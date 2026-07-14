import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import type { AppBindings, AuthContext } from "../types/index.js";

async function resolveOrganizationId(userId: string, requestedOrganizationId?: string | null) {
  if (requestedOrganizationId) {
    const membership = await prisma.member.findFirst({
      where: {
        userId,
        organizationId: requestedOrganizationId
      },
      select: {
        organizationId: true
      }
    });

    if (membership) {
      return membership.organizationId;
    }
  }

  const membership = await prisma.member.findFirst({
    where: {
      userId
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      organizationId: true
    }
  });

  return membership?.organizationId ?? null;
}

async function fromSession(headers: Headers): Promise<AuthContext | null> {
  const session = await auth.api.getSession({
    headers,
    asResponse: false
  });

  if (!session) {
    return null;
  }

  const organizationId = await resolveOrganizationId(
    session.user.id,
    session.session.activeOrganizationId ?? null
  );

  if (!organizationId) {
    return null;
  }

  return {
    userId: session.user.id,
    organizationId,
    email: session.user.email,
    name: session.user.name
  };
}

async function fromBearerJwt(headers: Headers): Promise<AuthContext | null> {
  const authHeader = headers.get("authorization");

  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authHeader.slice("bearer ".length).trim();

  if (!token || !token.includes(".")) {
    return null;
  }

  const verified = await auth.api.verifyJWT({
    body: {
      token
    }
  });

  if (!verified.payload?.sub) {
    return null;
  }

  const payload = verified.payload as {
    sub: string;
    email?: string;
    name?: string;
    organizationId?: string | null;
  };

  const organizationId = await resolveOrganizationId(payload.sub, payload.organizationId);

  if (!organizationId) {
    return null;
  }

  return {
    userId: payload.sub,
    organizationId,
    email: payload.email,
    name: payload.name
  };
}

export const requireAuth = createMiddleware<AppBindings>(async (c, next) => {
  const headers = c.req.raw.headers;
  const authContext = (await fromSession(headers)) ?? (await fromBearerJwt(headers));

  if (!authContext) {
    throw new HTTPException(401, {
      message: "Authentication required."
    });
  }

  c.set("auth", authContext);
  await next();
});
