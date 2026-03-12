-- CreateEnum
CREATE TYPE "SettlementAccountType" AS ENUM ('SETTLEMENT', 'ESCROW', 'SAFEGUARDED');

-- CreateEnum
CREATE TYPE "SettlementAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SettlementEntryType" AS ENUM ('PROVIDER_SETTLEMENT', 'ORGANIZER_PAYOUT', 'REFUND', 'BANK_FEE', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "SettlementEntryDirection" AS ENUM ('INFLOW', 'OUTFLOW');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'MATCHED', 'MISMATCH', 'FAILED');

-- CreateEnum
CREATE TYPE "ReconciliationMismatchType" AS ENUM ('BALANCE_VARIANCE', 'MISSING_PROVIDER_SETTLEMENT', 'MISSING_PAYOUT_ENTRY', 'MISSING_REFUND_ENTRY');

-- AlterTable
ALTER TABLE "PayoutBatch" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "transferReference" TEXT,
ADD COLUMN     "transferStatus" TEXT;

-- CreateTable
CREATE TABLE "SettlementAccount" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "bankName" TEXT,
    "accountNumberMasked" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "accountType" "SettlementAccountType" NOT NULL DEFAULT 'SETTLEMENT',
    "status" "SettlementAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentBalance" DECIMAL(14,2) NOT NULL DEFAULT 0.0,
    "lastReconciledBalance" DECIMAL(14,2) NOT NULL DEFAULT 0.0,
    "lastReconciledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettlementAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementEntry" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "entryType" "SettlementEntryType" NOT NULL,
    "direction" "SettlementEntryDirection" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "runningBalanceAfter" DECIMAL(14,2) NOT NULL,
    "referenceId" TEXT,
    "externalReference" TEXT,
    "description" TEXT,
    "purchaseId" INTEGER,
    "payoutBatchId" INTEGER,
    "financialTransactionId" INTEGER,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "SettlementEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationRun" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
    "scopeStart" TIMESTAMP(3),
    "scopeEnd" TIMESTAMP(3),
    "internalCaptured" DECIMAL(14,2) NOT NULL DEFAULT 0.0,
    "internalRefunds" DECIMAL(14,2) NOT NULL DEFAULT 0.0,
    "internalPayouts" DECIMAL(14,2) NOT NULL DEFAULT 0.0,
    "internalExpectedBalance" DECIMAL(14,2) NOT NULL DEFAULT 0.0,
    "actualBalance" DECIMAL(14,2) NOT NULL DEFAULT 0.0,
    "variance" DECIMAL(14,2) NOT NULL DEFAULT 0.0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReconciliationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationMismatch" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "mismatchType" "ReconciliationMismatchType" NOT NULL,
    "referenceId" TEXT,
    "expectedAmount" DECIMAL(14,2),
    "actualAmount" DECIMAL(14,2),
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationMismatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SettlementEntry_accountId_occurredAt_idx" ON "SettlementEntry"("accountId", "occurredAt");

-- CreateIndex
CREATE INDEX "SettlementEntry_purchaseId_idx" ON "SettlementEntry"("purchaseId");

-- CreateIndex
CREATE INDEX "SettlementEntry_payoutBatchId_idx" ON "SettlementEntry"("payoutBatchId");

-- CreateIndex
CREATE INDEX "SettlementEntry_financialTransactionId_idx" ON "SettlementEntry"("financialTransactionId");

-- CreateIndex
CREATE INDEX "ReconciliationRun_accountId_createdAt_idx" ON "ReconciliationRun"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "ReconciliationMismatch_runId_mismatchType_idx" ON "ReconciliationMismatch"("runId", "mismatchType");

-- AddForeignKey
ALTER TABLE "SettlementEntry" ADD CONSTRAINT "SettlementEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SettlementAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementEntry" ADD CONSTRAINT "SettlementEntry_financialTransactionId_fkey" FOREIGN KEY ("financialTransactionId") REFERENCES "FinancialTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementEntry" ADD CONSTRAINT "SettlementEntry_payoutBatchId_fkey" FOREIGN KEY ("payoutBatchId") REFERENCES "PayoutBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementEntry" ADD CONSTRAINT "SettlementEntry_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationRun" ADD CONSTRAINT "ReconciliationRun_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SettlementAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationMismatch" ADD CONSTRAINT "ReconciliationMismatch_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReconciliationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
