/*
  Warnings:

  - You are about to drop the column `commission` on the `Event` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('INITIATED', 'AUTHORIZED', 'CAPTURED', 'SETTLED', 'RELEASED', 'PAID_OUT', 'FAILED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TICKET_PURCHASE', 'PLATFORM_FEE', 'ORGANIZER_PAYOUT', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('BANK_TRANSFER', 'MOBILE_MONEY', 'MANUAL');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FraudType" AS ENUM ('REPLAY', 'OFFLINE_ABUSE', 'BOT_PURCHASE', 'INSIDER_ABUSE', 'PAYMENT_FRAUD', 'IP_ANOMALY');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('CANCELLATION', 'DUPLICATE_PAYMENT', 'POSTPONEMENT', 'ORGANIZER_APPROVED', 'ADMIN_FORCE', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeSource" AS ENUM ('USER_COMPLAINT', 'ORGANIZER_CHALLENGE', 'BANK_CHARGEBACK');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SMS', 'PUSH', 'EMAIL');

-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "commission",
ADD COLUMN     "feeFixed" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
ADD COLUMN     "feePercentage" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
ADD COLUMN     "feeType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "refundPolicy" TEXT NOT NULL DEFAULT 'No refunds within 24 hours of event.';

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT;

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "eventId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerWallet" (
    "id" SERIAL NOT NULL,
    "organizerId" INTEGER NOT NULL,
    "pendingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "availableBalance" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "totalWithdrawn" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletLedger" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "referenceId" TEXT NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" SERIAL NOT NULL,
    "status" "FinancialStatus" NOT NULL DEFAULT 'INITIATED',
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "feeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "purchaseId" INTEGER,
    "eventId" INTEGER,
    "payoutBatchId" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutBatch" (
    "id" SERIAL NOT NULL,
    "status" "FinancialStatus" NOT NULL DEFAULT 'INITIATED',
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PayoutMethod" NOT NULL,
    "payoutDetails" TEXT NOT NULL,
    "walletId" INTEGER NOT NULL,
    "processedAt" TIMESTAMP(3),
    "adminId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformFeeConfig" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "feeType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "feeFixed" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "feePercentage" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformFeeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudAlert" (
    "id" SERIAL NOT NULL,
    "type" "FraudType" NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "isCleared" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "userId" INTEGER,
    "eventId" INTEGER,
    "organizerId" INTEGER,
    "ticketId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "level" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryMetric" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "gateId" TEXT,
    "entryCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntryMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" SERIAL NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" "RefundReason" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "purchaseId" INTEGER NOT NULL,
    "transactionId" INTEGER,
    "processedBy" INTEGER,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" SERIAL NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "source" "DisputeSource" NOT NULL,
    "reason" TEXT NOT NULL,
    "purchaseId" INTEGER,
    "refundId" INTEGER,
    "userId" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "organizerId" INTEGER,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerRef" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerWallet_organizerId_key" ON "OrganizerWallet"("organizerId");

-- CreateIndex
CREATE UNIQUE INDEX "EntryMetric_eventId_gateId_timestamp_key" ON "EntryMetric"("eventId", "gateId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_transactionId_key" ON "Refund"("transactionId");

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerWallet" ADD CONSTRAINT "OrganizerWallet_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedger" ADD CONSTRAINT "WalletLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "OrganizerWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_payoutBatchId_fkey" FOREIGN KEY ("payoutBatchId") REFERENCES "PayoutBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutBatch" ADD CONSTRAINT "PayoutBatch_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "OrganizerWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAlert" ADD CONSTRAINT "FraudAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAlert" ADD CONSTRAINT "FraudAlert_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAlert" ADD CONSTRAINT "FraudAlert_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAlert" ADD CONSTRAINT "FraudAlert_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryMetric" ADD CONSTRAINT "EntryMetric_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "FinancialTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
