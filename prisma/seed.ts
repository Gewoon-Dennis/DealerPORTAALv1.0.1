// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminPass = await bcrypt.hash("Admin123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@autoagent.nl" },
    update: { passwordHash: adminPass, role: "admin", name: "AutoAgent Admin" },
    create: {
      email: "admin@autoagent.nl",
      passwordHash: adminPass,
      role: "admin",
      name: "AutoAgent Admin",
    },
  });

  // Dealer
  const dealerPass = await bcrypt.hash("Dealer123!", 10);
  await prisma.user.upsert({
    where: { email: "dealer@example.com" },
    update: {
      passwordHash: dealerPass,
      role: "dealer",
      name: "Demo Dealer BV",
    },
    create: {
      email: "dealer@example.com",
      passwordHash: dealerPass,
      role: "dealer",
      name: "Demo Dealer BV",
    },
  });

  console.log("✔ Seed klaar: admin & dealer bestaan.");
}

main().finally(() => prisma.$disconnect());
