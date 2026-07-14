import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type PrismaTransactionalClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

export async function withOrganizationRls<T>(
  organizationId: string,
  callback: (tx: PrismaTransactionalClient) => Promise<T>
) {
  return prisma.$transaction(async (tx) => {
    return callback(tx);
  });
}
