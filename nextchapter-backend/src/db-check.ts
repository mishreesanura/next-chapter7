import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");
  const users = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: "desc" }
  });
  console.log("Latest Users:");
  console.dir(users, { depth: null });

  const accounts = await prisma.account.findMany({
    take: 10,
    orderBy: { createdAt: "desc" }
  });
  console.log("Latest Accounts:");
  console.dir(accounts, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
