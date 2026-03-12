import {
    FinancialStatus,
    Prisma,
    ReconciliationMismatchType,
    ReconciliationStatus,
    SettlementAccountStatus,
    SettlementAccountType,
    SettlementEntryDirection,
    SettlementEntryType,
    TransactionType,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

interface CreateSettlementAccountInput {
    name: string;
    provider?: string;
    bankName?: string;
    accountNumberMasked?: string;
    currency?: string;
    accountType?: SettlementAccountType;
    metadata?: Prisma.InputJsonValue;
}

interface RecordSettlementEntryInput {
    accountId?: number;
    entryType: SettlementEntryType;
    direction: SettlementEntryDirection;
    amount: number;
    referenceId?: string;
    externalReference?: string;
    description?: string;
    purchaseId?: number;
    payoutBatchId?: number;
    financialTransactionId?: number;
    occurredAt?: Date;
    metadata?: Prisma.InputJsonValue;
}

export class ReconciliationService {
    private static round2(value: number): number {
        return Math.round(value * 100) / 100;
    }

    static async listSettlementAccounts() {
        return prisma.settlementAccount.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: {
                        entries: true,
                        reconciliationRuns: true,
                    },
                },
            },
        });
    }

    static async createSettlementAccount(input: CreateSettlementAccountInput) {
        return prisma.settlementAccount.create({
            data: {
                name: input.name,
                provider: input.provider,
                bankName: input.bankName,
                accountNumberMasked: input.accountNumberMasked,
                currency: input.currency || "ETB",
                accountType: input.accountType || SettlementAccountType.SETTLEMENT,
                status: SettlementAccountStatus.ACTIVE,
                metadata: input.metadata,
            },
        });
    }

    static async listSettlementEntries(accountId?: number, limit = 100) {
        return prisma.settlementEntry.findMany({
            where: accountId ? { accountId } : undefined,
            orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
            take: Math.max(1, Math.min(limit, 500)),
            include: {
                account: true,
                purchase: {
                    select: { id: true, paymentRef: true, status: true },
                },
                payoutBatch: {
                    select: { id: true, status: true, method: true },
                },
                financialTransaction: {
                    select: { id: true, type: true, status: true },
                },
            },
        });
    }

    static async listReconciliationRuns(accountId?: number, limit = 20) {
        return prisma.reconciliationRun.findMany({
            where: accountId ? { accountId } : undefined,
            include: {
                account: true,
                mismatches: true,
            },
            orderBy: { createdAt: "desc" },
            take: Math.max(1, Math.min(limit, 100)),
        });
    }

    static async recordSettlementEntry(input: RecordSettlementEntryInput) {
        return prisma.$transaction((tx) => this.recordSettlementEntryTx(tx, input));
    }

    static async recordAutomaticPayoutSettlement(
        tx: Prisma.TransactionClient,
        input: Omit<RecordSettlementEntryInput, "accountId" | "entryType" | "direction">
    ) {
        const account = await this.findDefaultSettlementAccount(tx);
        if (!account) {
            return null;
        }

        return this.recordSettlementEntryTx(tx, {
            ...input,
            accountId: account.id,
            entryType: SettlementEntryType.ORGANIZER_PAYOUT,
            direction: SettlementEntryDirection.OUTFLOW,
        });
    }

    /**
     * Called on every successful payment verification (CAPTURED).
     * Records an inbound provider settlement entry so that bank reconciliation
     * can compare provider settlements vs internal captured totals.
     * If no active settlement account exists, silently returns null (non-fatal).
     */
    static async recordAutomaticProviderSettlement(input: {
        purchaseId: number;
        amount: number;
        provider: string;
        referenceId?: string;
        externalReference?: string;
        metadata?: Prisma.InputJsonValue;
    }) {
        return prisma.$transaction(async (tx) => {
            const account = await this.findDefaultSettlementAccount(tx);
            if (!account) {
                // No settlement account configured yet — log and skip (non-fatal)
                return null;
            }

            return this.recordSettlementEntryTx(tx, {
                accountId: account.id,
                entryType: SettlementEntryType.PROVIDER_SETTLEMENT,
                direction: SettlementEntryDirection.INFLOW,
                amount: input.amount,
                referenceId: input.referenceId,
                externalReference: input.externalReference,
                description: `Provider settlement from ${input.provider} for purchase #${input.purchaseId}`,
                purchaseId: input.purchaseId,
                metadata: input.metadata,
            });
        });
    }

    /**
     * Records a refund outflow entry on the settlement account.
     * Called when a refund is approved so the settlement ledger stays consistent.
     */
    static async recordAutomaticRefundSettlement(input: {
        purchaseId: number;
        amount: number;
        financialTransactionId?: number;
        referenceId?: string;
        metadata?: Prisma.InputJsonValue;
    }) {
        return prisma.$transaction(async (tx) => {
            const account = await this.findDefaultSettlementAccount(tx);
            if (!account) {
                return null;
            }

            return this.recordSettlementEntryTx(tx, {
                accountId: account.id,
                entryType: SettlementEntryType.REFUND,
                direction: SettlementEntryDirection.OUTFLOW,
                amount: input.amount,
                referenceId: input.referenceId,
                description: `Refund outflow for purchase #${input.purchaseId}`,
                purchaseId: input.purchaseId,
                financialTransactionId: input.financialTransactionId,
                metadata: input.metadata,
            });
        });
    }

    /**
     * Runs daily reconciliation across ALL active settlement accounts.
     * Returns a summary of each account run, suitable for a cron endpoint response.
     */
    static async runDailyReconciliationForAllAccounts() {
        const accounts = await prisma.settlementAccount.findMany({
            where: { status: SettlementAccountStatus.ACTIVE },
        });

        if (accounts.length === 0) {
            return { accountsProcessed: 0, runs: [], note: "No active settlement accounts found" };
        }

        const runs: Array<{ accountId: number; accountName: string; status: string; variance: number; mismatches: number }> = [];

        for (const account of accounts) {
            try {
                const run = await this.runReconciliation(account.id);
                if (run) {
                    runs.push({
                        accountId: account.id,
                        accountName: account.name,
                        status: run.status,
                        variance: Number(run.variance),
                        mismatches: run.mismatches.length,
                    });
                }
            } catch (err: any) {
                runs.push({
                    accountId: account.id,
                    accountName: account.name,
                    status: "FAILED",
                    variance: 0,
                    mismatches: 0,
                });
            }
        }

        return {
            accountsProcessed: accounts.length,
            runs,
            ranAt: new Date().toISOString(),
        };
    }

    static async runReconciliation(accountId: number, scopeEnd?: Date) {
        const account = await prisma.settlementAccount.findUnique({ where: { id: accountId } });
        if (!account) {
            throw new Error("Settlement account not found");
        }

        const effectiveScopeEnd = scopeEnd || new Date();

        const [capturedAgg, refundAgg, payoutAgg, providerSettlementAgg, payoutEntryAgg, refundEntryAgg] = await Promise.all([
            prisma.financialTransaction.aggregate({
                where: {
                    type: TransactionType.TICKET_PURCHASE,
                    purchase: { status: "SUCCESS" },
                    createdAt: { lte: effectiveScopeEnd },
                },
                _sum: { amount: true },
            }),
            prisma.financialTransaction.aggregate({
                where: {
                    type: TransactionType.REFUND,
                    status: FinancialStatus.REFUNDED,
                    createdAt: { lte: effectiveScopeEnd },
                },
                _sum: { amount: true },
            }),
            prisma.financialTransaction.aggregate({
                where: {
                    type: TransactionType.ORGANIZER_PAYOUT,
                    status: FinancialStatus.PAID_OUT,
                    createdAt: { lte: effectiveScopeEnd },
                },
                _sum: { amount: true },
            }),
            prisma.settlementEntry.aggregate({
                where: {
                    accountId,
                    entryType: SettlementEntryType.PROVIDER_SETTLEMENT,
                    direction: SettlementEntryDirection.INFLOW,
                    occurredAt: { lte: effectiveScopeEnd },
                },
                _sum: { amount: true },
            }),
            prisma.settlementEntry.aggregate({
                where: {
                    accountId,
                    entryType: SettlementEntryType.ORGANIZER_PAYOUT,
                    direction: SettlementEntryDirection.OUTFLOW,
                    occurredAt: { lte: effectiveScopeEnd },
                },
                _sum: { amount: true },
            }),
            prisma.settlementEntry.aggregate({
                where: {
                    accountId,
                    entryType: SettlementEntryType.REFUND,
                    direction: SettlementEntryDirection.OUTFLOW,
                    occurredAt: { lte: effectiveScopeEnd },
                },
                _sum: { amount: true },
            }),
        ]);

        const internalCaptured = Number(capturedAgg._sum.amount || 0);
        const internalRefunds = Math.abs(Number(refundAgg._sum.amount || 0));
        const internalPayouts = Math.abs(Number(payoutAgg._sum.amount || 0));
        const internalExpectedBalance = this.round2(internalCaptured - internalRefunds - internalPayouts);
        const actualBalance = Number(account.currentBalance || 0);
        const variance = this.round2(actualBalance - internalExpectedBalance);

        const providerSettlements = Number(providerSettlementAgg._sum.amount || 0);
        const payoutEntries = Number(payoutEntryAgg._sum.amount || 0);
        const refundEntries = Number(refundEntryAgg._sum.amount || 0);

        const mismatchRows: Array<{
            mismatchType: ReconciliationMismatchType;
            referenceId?: string;
            expectedAmount?: Prisma.Decimal;
            actualAmount?: Prisma.Decimal;
            description: string;
            metadata?: Prisma.InputJsonValue;
        }> = [];

        if (internalCaptured > 0 && providerSettlements <= 0) {
            mismatchRows.push({
                mismatchType: ReconciliationMismatchType.MISSING_PROVIDER_SETTLEMENT,
                expectedAmount: new Prisma.Decimal(internalCaptured),
                actualAmount: new Prisma.Decimal(providerSettlements),
                description: "Captured customer funds exist internally but no provider settlement inflow has been recorded for this account.",
            });
        }

        if (internalPayouts > 0 && payoutEntries < internalPayouts) {
            mismatchRows.push({
                mismatchType: ReconciliationMismatchType.MISSING_PAYOUT_ENTRY,
                expectedAmount: new Prisma.Decimal(internalPayouts),
                actualAmount: new Prisma.Decimal(payoutEntries),
                description: "Organizer payouts were posted internally but corresponding settlement outflows are incomplete.",
            });
        }

        if (internalRefunds > 0 && refundEntries < internalRefunds) {
            mismatchRows.push({
                mismatchType: ReconciliationMismatchType.MISSING_REFUND_ENTRY,
                expectedAmount: new Prisma.Decimal(internalRefunds),
                actualAmount: new Prisma.Decimal(refundEntries),
                description: "Refunds were posted internally but corresponding settlement outflows are incomplete.",
            });
        }

        // --- NEW: Payout Integrity Check (§7) ---
        const problematicPayouts = await (prisma.payoutBatch as any).findMany({
            where: {
                status: FinancialStatus.PAID_OUT,
                transferReference: null,
                processedAt: { lte: effectiveScopeEnd },
            } as any,
            select: { id: true, amount: true },
        });

        if (problematicPayouts.length > 0) {
            mismatchRows.push({
                mismatchType: ReconciliationMismatchType.BALANCE_VARIANCE, // Proxy for structural mismatch
                description: `Found ${problematicPayouts.length} payout batches marked PAID_OUT but missing an external transfer reference. Possible audit failure.`,
                metadata: { problematicPayoutIds: problematicPayouts.map((p: any) => p.id) },
            });
        }

        if (variance !== 0) {
            mismatchRows.push({
                mismatchType: ReconciliationMismatchType.BALANCE_VARIANCE,
                expectedAmount: new Prisma.Decimal(internalExpectedBalance),
                actualAmount: new Prisma.Decimal(actualBalance),
                description: "Settlement account balance does not match the internal expected balance.",
                metadata: {
                    internalCaptured,
                    internalRefunds,
                    internalPayouts,
                },
            });
        }

        const run = await prisma.$transaction(async (tx) => {
            const createdRun = await tx.reconciliationRun.create({
                data: {
                    accountId,
                    status: mismatchRows.length > 0 ? ReconciliationStatus.MISMATCH : ReconciliationStatus.MATCHED,
                    scopeEnd: effectiveScopeEnd,
                    internalCaptured: new Prisma.Decimal(internalCaptured),
                    internalRefunds: new Prisma.Decimal(internalRefunds),
                    internalPayouts: new Prisma.Decimal(internalPayouts),
                    internalExpectedBalance: new Prisma.Decimal(internalExpectedBalance),
                    actualBalance: new Prisma.Decimal(actualBalance),
                    variance: new Prisma.Decimal(variance),
                    notes: mismatchRows.length > 0 ? "Reconciliation completed with mismatches" : "Reconciliation matched",
                    completedAt: new Date(),
                },
            });

            if (mismatchRows.length > 0) {
                await tx.reconciliationMismatch.createMany({
                    data: mismatchRows.map((row) => ({
                        runId: createdRun.id,
                        mismatchType: row.mismatchType,
                        referenceId: row.referenceId,
                        expectedAmount: row.expectedAmount,
                        actualAmount: row.actualAmount,
                        description: row.description,
                        metadata: row.metadata,
                    })),
                });
            }

            await tx.settlementAccount.update({
                where: { id: accountId },
                data: {
                    lastReconciledBalance: new Prisma.Decimal(actualBalance),
                    lastReconciledAt: new Date(),
                },
            });

            return tx.reconciliationRun.findUnique({
                where: { id: createdRun.id },
                include: {
                    account: true,
                    mismatches: true,
                },
            });
        });

        return run;
    }

    private static async findDefaultSettlementAccount(tx: Prisma.TransactionClient) {
        return tx.settlementAccount.findFirst({
            where: { status: SettlementAccountStatus.ACTIVE },
            orderBy: [{ accountType: "asc" }, { createdAt: "asc" }],
        });
    }

    private static async recordSettlementEntryTx(tx: Prisma.TransactionClient, input: RecordSettlementEntryInput) {
        const accountId = input.accountId ?? (await this.findDefaultSettlementAccount(tx))?.id;
        if (!accountId) {
            throw new Error("No active settlement account available");
        }

        if (!Number.isFinite(input.amount) || input.amount <= 0) {
            throw new Error("Settlement entry amount must be greater than zero");
        }

        const account = await tx.settlementAccount.findUnique({ where: { id: accountId } });
        if (!account) {
            throw new Error("Settlement account not found");
        }

        const currentBalance = Number(account.currentBalance || 0);
        const delta = input.direction === SettlementEntryDirection.INFLOW ? input.amount : -input.amount;
        const runningBalanceAfter = this.round2(currentBalance + delta);

        const entry = await tx.settlementEntry.create({
            data: {
                accountId,
                entryType: input.entryType,
                direction: input.direction,
                amount: new Prisma.Decimal(this.round2(input.amount)),
                runningBalanceAfter: new Prisma.Decimal(runningBalanceAfter),
                referenceId: input.referenceId,
                externalReference: input.externalReference,
                description: input.description,
                purchaseId: input.purchaseId,
                payoutBatchId: input.payoutBatchId,
                financialTransactionId: input.financialTransactionId,
                occurredAt: input.occurredAt || new Date(),
                metadata: input.metadata,
            },
        });

        await tx.settlementAccount.update({
            where: { id: accountId },
            data: {
                currentBalance: new Prisma.Decimal(runningBalanceAfter),
            },
        });

        return entry;
    }
}
