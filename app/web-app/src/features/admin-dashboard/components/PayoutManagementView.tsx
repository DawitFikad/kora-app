import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    DollarSign,
    Clock,
    CheckCircle2,
    Loader2,
    Wallet,
    ShieldCheck
} from 'lucide-react';
import { AdminService } from '../../../core/api/admin.service';

import { exportToCSV } from '../../../core/utils/export';
import { Download } from 'lucide-react';
import DecisionModal from './DecisionModal';
import { useDialog } from '../../../core/context/DialogContext';

export const PayoutsManagementView = ({ view = 'QUEUE' }: { view?: 'QUEUE' | 'SETTLEMENTS' }) => {
    const { t } = useTranslation();
    const dialog = useDialog();
    const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
    const [processedPayouts, setProcessedPayouts] = useState<any[]>([]);
    const [settlementLedger, setSettlementLedger] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [organizerSummaries, setOrganizerSummaries] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [payoutsRes, processedRes, metricsRes, ledgerRes]: any = await Promise.all([
                AdminService.getPendingPayouts(),
                AdminService.getProcessedPayouts(),
                AdminService.getFinancialMetrics(),
                AdminService.getFinancialTransactions()
            ]);
            setPendingPayouts(payoutsRes.data || []);
            setProcessedPayouts(processedRes.data || []);
            setMetrics(metricsRes.data || null);
            setSettlementLedger(ledgerRes.data || ledgerRes || []);
        } catch (err) {
            console.error('Failed to fetch payout data', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Build simple organizer summary from fetched data if backend summary not provided
        const summaries: Record<string, any> = {};
        (pendingPayouts || []).forEach(p => {
            const key = p.wallet?.organizer?.id || p.organizerId || p.organizerName || 'unknown';
            summaries[key] = summaries[key] || { organizerName: p.wallet?.organizer?.organizationName || p.organizerName || 'Unknown', pending: 0, paid: 0, total: 0, nextSettlement: p.nextSettlement || null };
            summaries[key].pending += Number(p.amount || 0);
            summaries[key].total += Number(p.amount || 0);
            if (!summaries[key].nextSettlement && p.nextSettlement) summaries[key].nextSettlement = p.nextSettlement;
        });
        (processedPayouts || []).forEach(p => {
            const key = p.wallet?.organizer?.id || p.organizerId || p.organizerName || 'unknown';
            summaries[key] = summaries[key] || { organizerName: p.wallet?.organizer?.organizationName || p.organizerName || 'Unknown', pending: 0, paid: 0, total: 0, nextSettlement: p.nextSettlement || null };
            summaries[key].paid += Number(p.amount || 0);
            summaries[key].total += Number(p.amount || 0);
        });
        setOrganizerSummaries(Object.values(summaries));
    }, [pendingPayouts, processedPayouts]);

    const [decisionOpen, setDecisionOpen] = useState(false);
    const [decisionContext, setDecisionContext] = useState<any>(null);

    const handleReject = async (batchId: number) => {
        setDecisionContext({ action: 'rejectPayout', batchId, title: 'Reject Payout' });
        setDecisionOpen(true);
    };

    const handleApprove = async (batchId: number) => {
        setDecisionContext({ action: 'approvePayout', batchId, title: 'Approve Payout' });
        setDecisionOpen(true);
    };

    const handleDecisionCancel = () => {
        setDecisionOpen(false);
        setDecisionContext(null);
    };

    const handleDecisionConfirm = async (payload: any) => {
        if (!decisionContext) return;
        const { action, batchId } = decisionContext;
        try {
            if (action === 'rejectPayout') {
                setProcessingId(batchId);
                await AdminService.rejectPayout(batchId, payload.reason);
                await fetchData();
            } else if (action === 'approvePayout') {
                setProcessingId(batchId);
                await AdminService.approvePayout(batchId, payload.reason);
                await fetchData();
            } else if (action === 'bulkSettlement') {
                // Placeholder: no backend endpoint implemented for bulk settlement in MVP
                // Record admin note in system config/audit and notify
                await dialog.alert({
                    title: t('admin.payouts.initiate_bulk', 'Bulk settlement'),
                    message: `Bulk settlement simulated. Note: ${payload.reason}`
                });
            }
        } catch (err: any) {
            await dialog.alert({ title: t('common.error', 'Error'), message: err?.response?.data?.message || t('admin.team.failed', 'Action failed') });
        } finally {
            setProcessingId(null);
            setDecisionOpen(false);
            setDecisionContext(null);
        }
    };

    if (isLoading || !metrics) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            <div style={{ display: 'flex', gap: '12px' }}>
                {view === 'QUEUE' && (
                    <button
                        onClick={() => { setDecisionContext({ action: 'bulkSettlement', title: t('admin.payouts.initiate_bulk') }); setDecisionOpen(true); }}
                        style={{ background: 'var(--bg-active)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}
                    >
                        {t('admin.payouts.initiate_bulk')}
                    </button>
                )}
                <button
                    onClick={() => exportToCSV((view === 'SETTLEMENTS' ? processedPayouts : pendingPayouts).map(p => ({
                        Transaction: p.transactionId || p.id,
                        Organizer: p.wallet?.organizer?.organizationName || p.organizerName,
                        Event: p.eventTitle || p.event?.title || '',
                        Gross: p.grossAmount || p.amount,
                        PlatformCut: p.platformCut || '',
                        OrganizerNet: p.netAmount || '',
                        Status: p.status,
                        Timestamp: p.processedAt || p.createdAt
                    })), `${view.toLowerCase()}_export.csv`)}
                    className="btn-blue" style={{ background: '#12171F', color: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                >
                    <Download size={16} /> {t('admin.export_queue')}
                </button>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>{view === 'SETTLEMENTS' ? t('admin.payouts.total_settled') : t('admin.commissions.monthly_gmv')}</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>ETB {(view === 'SETTLEMENTS' ? processedPayouts.reduce((sum, p) => sum + Number(p.amount), 0) : metrics.monthlyGMV).toLocaleString()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3B82F6', fontSize: '0.75rem', fontWeight: 700, marginTop: '12px' }}>
                        <DollarSign size={14} /> {view === 'SETTLEMENTS' ? t('admin.payouts.lifetime_settlements') : t('admin.commissions.gross_volume_month')}
                    </div>
                </div>
                <div className="admin-stat-card-main">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>{view === 'SETTLEMENTS' ? t('admin.payouts.audited_count') : t('admin.pending_payouts')}</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{view === 'SETTLEMENTS' ? processedPayouts.length : metrics.pendingPayouts.amount.toLocaleString()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700, marginTop: '12px' }}>
                        <Clock size={14} /> {view === 'SETTLEMENTS' ? t('admin.payouts.resolved_records') : `${metrics.pendingPayouts.count} ${t('admin.payouts.requests_waiting')}`}
                    </div>
                </div>
                <div className="admin-stat-card-main" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>{t('admin.platform_commission')}</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981' }}>ETB {metrics.platformCommission.toLocaleString()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '0.75rem', fontWeight: 700, marginTop: '12px' }}>
                        <ShieldCheck size={14} /> {t('admin.commissions.revenue_earned')}
                    </div>
                </div>
            </div>

            {view === 'QUEUE' ? (
                <div className="admin-card">
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('admin.payouts.payout_queue')}</h3>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                            {pendingPayouts.length} {t('admin.payouts.requests_count')}
                        </div>
                    </div>

                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{t('admin.commissions.organizer_label')}</th>
                                <th>{t('admin.commissions.gross')}</th>
                                <th>{t('admin.payouts.method')}</th>
                                <th>{t('admin.overview.details')}</th>
                                <th>{t('admin.payouts.requested')}</th>
                                <th style={{ textAlign: 'right' }}>{t('admin.commissions.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingPayouts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                        <div style={{ marginBottom: '12px' }}><Wallet size={40} opacity={0.2} style={{ margin: '0 auto' }} /></div>
                                        {t('admin.payouts.no_payouts')}
                                    </td>
                                </tr>
                            ) : (
                                pendingPayouts.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <p style={{ fontWeight: 800 }}>{p.wallet?.organizer?.organizationName}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('admin.payouts.method_label')}: {p.method}</p>
                                        </td>
                                        <td>
                                            <p style={{ fontWeight: 900, color: 'var(--text-main)' }}>ETB {Number(p.amount).toLocaleString()}</p>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F59E0B' }}>{p.status}</span>
                                        </td>
                                        <td>
                                            <p style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{p.payoutDetails}</p>
                                        </td>
                                        <td>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleReject(p.id)} disabled={processingId === p.id} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid #EF4444', padding: '8px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>{t('admin.features.reject')}</button>
                                                <button onClick={() => handleApprove(p.id)} disabled={processingId === p.id} style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    {processingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} {t('admin.features.approve')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="admin-card">
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('admin.payouts.fiscal_ledger')}</h3>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                            {processedPayouts.length} {t('admin.payouts.settled_records_count')}
                        </div>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{t('admin.commissions.transaction_id')}</th>
                                <th>{t('admin.sidebar.events')}</th>
                                <th>{t('admin.commissions.organizer_label')}</th>
                                <th>{t('admin.commissions.gross')}</th>
                                <th>{t('admin.commissions.platform_fee')}</th>
                                <th>{t('admin.commissions.organizer_net')}</th>
                                <th>{t('admin.commissions.status')}</th>
                                <th>{t('admin.logs.timestamp')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {settlementLedger.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('admin.payouts.no_settlements')}</td></tr>
                            ) : (
                                settlementLedger.map((t) => (
                                    <tr key={t.transactionId || t.id}>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 800 }}>{t.transactionId || t.id}</td>
                                        <td>{t.eventTitle || t.event?.title || '-'}</td>
                                        <td style={{ fontWeight: 800 }}>{t.organizerName || t.wallet?.organizer?.organizationName || '-'}</td>
                                        <td style={{ fontWeight: 900 }}>ETB {(t.grossAmount || t.amount || 0).toLocaleString()}</td>
                                        <td>ETB {(t.platformCut || t.platformFee || 0).toLocaleString()}</td>
                                        <td style={{ fontWeight: 900 }}>ETB {(t.netAmount || t.organizerNet || 0).toLocaleString()}</td>
                                        <td>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 800,
                                                background: t.status === 'SETTLED' || t.status === 'PAID_OUT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: t.status === 'SETTLED' || t.status === 'PAID_OUT' ? '#10B981' : '#EF4444',
                                                padding: '4px 10px', borderRadius: '6px'
                                            }}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(t.processedAt || t.timestamp || t.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {/* Decision modal for approvals/rejections */}
            <DecisionModal
                open={decisionOpen}
                title={decisionContext?.title}
                showCommission={false}
                showPriority={false}
                showRevenueEstimate={false}
                onCancel={handleDecisionCancel}
                onConfirm={handleDecisionConfirm}
            />
        </motion.div>
    );
};
