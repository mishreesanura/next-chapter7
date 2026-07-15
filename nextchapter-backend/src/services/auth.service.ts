import { randomUUID } from "node:crypto";
import type { Organization, User } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

type AuthHeadersResult<T> = {
  response: T;
  headers: Headers;
};

type AuthenticatedResponse = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  sessionToken: string;
  jwt: string;
};

function normalizeEmailName(email: string) {
  const [localPart] = email.split("@");
  return (localPart || email).replace(/[._-]+/g, " ").trim() || email;
}

function toSlug(input: string) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return `${base || "workspace"}-${randomUUID().slice(0, 8)}`;
}

function headersFromSetCookie(headers: Headers) {
  const nextHeaders = new Headers();
  const setCookie = headers.get("set-cookie");

  if (!setCookie) {
    return nextHeaders;
  }

  const cookie = setCookie
    .split(/,(?=\s*[^;,]+=)/)
    .map((part) => part.split(";")[0]?.trim())
    .filter((part): part is string => Boolean(part))
    .join("; ");

  if (cookie) {
    nextHeaders.set("cookie", cookie);
  }

  return nextHeaders;
}

async function issueJwt(user: Pick<User, "id" | "email" | "name">, organizationId: string) {
  const signed = await auth.api.signJWT({
    body: {
      payload: {
        sub: user.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        organizationId
      },
      overrideOptions: {
        jwt: {
          expirationTime: "7 days"
        }
      }
    }
  });

  return signed.token;
}

async function ensureUserOrganization(
  user: Pick<User, "id" | "email" | "name">,
  sessionHeaders: Headers
) {
  const existing = await prisma.member.findFirst({
    where: {
      userId: user.id
    },
    include: {
      organization: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (existing) {
    await auth.api.setActiveOrganization({
      headers: sessionHeaders,
      body: {
        organizationId: existing.organizationId
      }
    });

    return existing.organization;
  }

  const orgName = `${user.name || normalizeEmailName(user.email)} Workspace`;
  const organization = await auth.api.createOrganization({
    headers: sessionHeaders,
    body: {
      name: orgName,
      slug: toSlug(user.email),
      keepCurrentActiveOrganization: false
    }
  });

  return organization as Organization;
}

function toAuthResponse(
  user: Pick<User, "id" | "email" | "name">,
  organization: Pick<Organization, "id" | "name" | "slug">,
  sessionToken: string,
  jwt: string
): AuthenticatedResponse {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug
    },
    sessionToken,
    jwt
  };
}

export async function registerWithOrganization(
  input: {
    email: string;
    password: string;
    name?: string;
  },
  headers?: Headers
) {
  const name = input.name?.trim() || normalizeEmailName(input.email);
  const signUp = (await auth.api.signUpEmail({
    body: {
      email: input.email,
      password: input.password,
      name,
      rememberMe: true
    },
    headers,
    returnHeaders: true
  })) as AuthHeadersResult<{
    token: string | null;
    user: User;
  }>;

  if (!signUp.response.token) {
    throw new HTTPException(500, {
      message: "Better Auth did not return a session token during registration."
    });
  }

  const sessionHeaders = headersFromSetCookie(signUp.headers);
  const organization = await ensureUserOrganization(signUp.response.user, sessionHeaders);
  const jwt = await issueJwt(signUp.response.user, organization.id);

  return {
    data: toAuthResponse(signUp.response.user, organization, signUp.response.token, jwt),
    headers: signUp.headers
  };
}

export async function loginWithOrganization(
  input: {
    email: string;
    password: string;
  },
  headers?: Headers
) {
  const signIn = (await auth.api.signInEmail({
    body: {
      email: input.email,
      password: input.password,
      rememberMe: true
    },
    headers,
    returnHeaders: true
  })) as AuthHeadersResult<{
    redirect: boolean;
    token: string;
    user: User;
  }>;

  const sessionHeaders = headersFromSetCookie(signIn.headers);
  const organization = await ensureUserOrganization(signIn.response.user, sessionHeaders);
  const jwt = await issueJwt(signIn.response.user, organization.id);

  return {
    data: toAuthResponse(signIn.response.user, organization, signIn.response.token, jwt),
    headers: signIn.headers
  };
}
