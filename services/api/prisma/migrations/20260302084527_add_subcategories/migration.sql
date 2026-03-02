/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('SCANNER', 'MANAGER');

-- CreateEnum
CREATE TYPE "TicketTierType" AS ENUM ('GENERAL', 'VIP', 'EARLY_BIRD');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentId" INTEGER;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "additionalDates" TIMESTAMP(3)[] DEFAULT (ARRAY[]::timestamp without time zone[])::timestamp(3) without time zone[],
ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "cast" TEXT,
ADD COLUMN     "director" TEXT,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "isMovie" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rating" TEXT,
ADD COLUMN     "subCategoryId" INTEGER,
ADD COLUMN     "trailerUrl" TEXT;

-- AlterTable
ALTER TABLE "OrganizerProfile" ADD COLUMN     "businessLicense" TEXT,
ADD COLUMN     "eventPoster" TEXT;

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "campaignName" TEXT,
ADD COLUMN     "codeType" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "influencerName" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "code" TEXT,
ADD COLUMN     "isVip" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TicketTier" ADD COLUMN     "isResellable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTransferable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "TicketTierType" NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE "OrganizerStaff" (
    "id" SERIAL NOT NULL,
    "organizerId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'SCANNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffInvitation" (
    "id" SERIAL NOT NULL,
    "organizerId" INTEGER NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'SCANNER',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerStaff_organizerId_userId_key" ON "OrganizerStaff"("organizerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvitation_inviteCode_key" ON "StaffInvitation"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_code_key" ON "Ticket"("code");

-- AddForeignKey
ALTER TABLE "OrganizerStaff" ADD CONSTRAINT "OrganizerStaff_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerStaff" ADD CONSTRAINT "OrganizerStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInvitation" ADD CONSTRAINT "StaffInvitation_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
