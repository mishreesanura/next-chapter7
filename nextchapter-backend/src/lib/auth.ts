import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins/bearer";
import { jwt } from "better-auth/plugins/jwt";
import { organization } from "better-auth/plugins/organization";
import { env } from "./env.js";
import { prisma } from "./prisma.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mongodb",
    transaction: true
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.FRONTEND_ORIGIN],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      teams: {
        enabled: true
      }
    }),
    jwt({
      jwt: {
        expirationTime: "7 days",
        definePayload: ({ user, session }) => ({
          sub: user.id,
          userId: user.id,
          email: user.email,
          name: user.name,
          organizationId: session.activeOrganizationId ?? null
        })
      }
    }),
    bearer()
  ]
});

export type NextChapterAuth = typeof auth;
