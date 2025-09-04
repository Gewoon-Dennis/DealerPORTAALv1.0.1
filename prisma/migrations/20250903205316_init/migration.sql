-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'dealer');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'dealer',
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Application" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appNumber" SERIAL NOT NULL,
    "dealerEmail" TEXT NOT NULL,
    "dealerId" TEXT,
    "kvkNummer" TEXT NOT NULL,
    "kvkJong" BOOLEAN NOT NULL DEFAULT true,
    "contactNaam" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactTel" TEXT NOT NULL,
    "kenteken" TEXT,
    "merk" TEXT,
    "model" TEXT,
    "brandstof" TEXT,
    "bouwjaar" TEXT,
    "kmStand" TEXT,
    "aanschafprijs" DECIMAL(12,2) NOT NULL,
    "aanbetaling" DECIMAL(12,2) NOT NULL,
    "slottermijn" DECIMAL(12,2) NOT NULL,
    "looptijd" INTEGER NOT NULL,
    "renteStaffel" TEXT NOT NULL,
    "opmerkingen" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ingediend',
    "uploads" JSONB[],

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Application_appNumber_key" ON "public"."Application"("appNumber");

-- CreateIndex
CREATE INDEX "Application_dealerEmail_idx" ON "public"."Application"("dealerEmail");

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
