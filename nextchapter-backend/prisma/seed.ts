import { registerWithOrganization } from "../src/services/auth.service.js";
import { prisma } from "../src/lib/prisma.js";

const seedUsers = [
  {
    email: "mishree.demo.one@example.com",
    password: "Password123!",
    name: "Mishree Demo One"
  },
  {
    email: "mishree.demo.two@example.com",
    password: "Password123!",
    name: "Mishree Demo Two"
  }
];

for (const user of seedUsers) {
  const existing = await prisma.user.findUnique({
    where: {
      email: user.email
    }
  });

  if (existing) {
    console.log(`Seed user already exists: ${user.email}`);
    continue;
  }

  const result = await registerWithOrganization(user);
  console.log(`Created ${result.data.user.email} in org ${result.data.organization.name}`);
}

await prisma.$disconnect();
