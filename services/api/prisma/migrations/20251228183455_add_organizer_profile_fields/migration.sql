-- AlterTable
ALTER TABLE "OrganizerProfile" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoUrl" TEXT;
