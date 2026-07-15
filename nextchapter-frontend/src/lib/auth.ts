import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "./schemas";
import type { AuthPayload } from "./types";

const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          console.error("[NextAuth] Credentials validation failed:", parsed.error.format());
          return null;
        }

        try {
          const targetUrl = `${backendBaseUrl}/api/auth/login`;
          console.log(`[NextAuth] Forwarding login request to backend URL: ${targetUrl}`);
          
          const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify(parsed.data)
          });

          if (!response.ok) {
            const errorBody = await response.text().catch(() => "Unable to read error body");
            console.error(`[NextAuth] Backend responded with status ${response.status}:`, errorBody);
            return null;
          }

          const payload = (await response.json()) as AuthPayload;

          return {
            id: payload.user.id,
            email: payload.user.email,
            name: payload.user.name,
            backendToken: payload.jwt,
            sessionToken: payload.sessionToken,
            organizationId: payload.organization.id,
            organizationName: payload.organization.name,
            organizationSlug: payload.organization.slug
          };
        } catch (error) {
          console.error("[NextAuth] Connection error while trying to reach backend:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.backendToken = user.backendToken;
        token.sessionToken = user.sessionToken;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.organizationSlug = user.organizationSlug;
      }

      return token;
    },
    session({ session, token }) {
      session.backendToken = String(token.backendToken ?? "");
      session.sessionToken = String(token.sessionToken ?? "");
      session.user.id = String(token.sub ?? "");
      session.user.organizationId = String(token.organizationId ?? "");
      session.user.organizationName = String(token.organizationName ?? "");
      session.user.organizationSlug = String(token.organizationSlug ?? "");

      return session;
    }
  }
});
