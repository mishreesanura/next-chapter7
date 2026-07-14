import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    backendToken: string;
    sessionToken: string;
    user: DefaultSession["user"] & {
      id: string;
      organizationId: string;
      organizationName: string;
      organizationSlug: string;
    };
  }

  interface User {
    backendToken: string;
    sessionToken: string;
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken: string;
    sessionToken: string;
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
  }
}
