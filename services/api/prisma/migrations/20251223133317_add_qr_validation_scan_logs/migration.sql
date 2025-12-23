-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SCANNER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TicketStatus" ADD VALUE 'GENERATED';
ALTER TYPE "TicketStatus" ADD VALUE 'SOLD';
ALTER TYPE "TicketStatus" ADD VALUE 'EXPIRED';

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" SERIAL NOT NULL,
    "ticketId" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "gateId" TEXT,
    "deviceId" TEXT,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceTime" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);
