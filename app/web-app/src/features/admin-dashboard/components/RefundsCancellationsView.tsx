import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Loader2, XCircle, RefreshCw, Ban, HandCoins } from 'lucide-react';
import { AdminService } from '../../../core/api/admin.service';
import DecisionModal from './DecisionModal';

export type ReviewTab = 'refunds' | 'cancellations';

export const RefundsCancellationsView = () => {
    const { t } = useTranslation();

    const [active, setActive] = useState<ReviewTab>('refunds');
    const [loading, setLoading] = useState(true);

    const [refunds, setRefunds] = useState<any[]>([]);
    const [cancellations, setCancellations] = useState<any[]>([]);

    const [decisionOpen, setDecisionOpen] = useState(false);
    const [decisionContext, setDecisionContext] = useState<null | { kind: 'refund-reject' | 'cancel-reject'; id: number }>(null);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [refundRes, cancelRes]: any = await Promise.all([
                AdminService.listRefunds(),
                AdminService.getCancellationRequests({ limit: 50 })
            ]);

            setRefunds(refundRes?.data || []);
            setCancellations(cancelRes?.data || []);
        } catch (e) {
            console.error('Failed to load refunds/cancellations', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const pendingRefunds = useMemo(() => refunds.filter(r => r?.status === 'PENDING').length, [refunds]);
    const pendingCancellations = useMemo(() => cancellations.filter(c => c?.status === 'PENDING').length, [cancellations]);

    const openRejectRefund = (id: number) => {
        setDecisionContext({ kind: 'refund-reject', id });
        setDecisionOpen(true);
    };

    const openRejectCancellation = (id: number) => {
        setDecisionContext({ kind: 'cancel-reject', id });
        setDecisionOpen(true);
    };

    const confirmDecision = async (payload: { reason: string }) => {
        if (!decisionContext) return;

        try {
            if (decisionContext.kind === 'refund-reject') {
                await AdminService.rejectRefund(decisionContext.id, payload.reason);
            } else {
                await AdminService.rejectCancellationRequest(decisionContext.id, payload.reason);
            }

            setDecisionOpen(false);
            setDecisionContext(null);
            await fetchAll();
        } catch (e) {
            console.error('Decision failed', e);
        }
    };

    const approveRefund = async (id: number) => {
        if (!confirm(t('admin.refunds.confirm_approve', 'Approve this refund?'))) return;
        try {
            await AdminService.approveRefund(id);
            await fetchAll();
        } catch (e) {
            console.error('Approve refund failed', e);
        }
    };

    const approveCancellation = async (id: number) => {
        if (!confirm(t('admin.cancellations.confirm_approve', 'Approve this event cancellation? Refunds will be processed automatically.'))) return;
        try {
            await AdminService.approveCancellationRequest(id);
            await fetchAll();
        } catch (e) {
            console.error('Approve cancellation failed', e);
        }
    };

    const TabButton = ({ tab, label, count }: { tab: ReviewTab; label: string; count: number }) => (
        <button
            onClick={() => setActive(tab)}
            style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: active === tab ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: 'var(--text-main)',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            <span>{label}</span>
            <span style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '999px',
                background: active === tab ? 'var(--bg-active)' : 'rgba(255,255,255,0.06)',
                color: active === tab ? 'white' : 'var(--text-muted)'
            }}>{count}</span>
        </button>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
                <button
                    onClick={fetchAll}
                    style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}
                >
                    <RefreshCw size={16} /> {t('common.refresh', 'Refresh')}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                <TabButton tab="refunds" label={t('admin.refunds.title', 'Refund Requests')} count={pendingRefunds} />
                <TabButton tab="cancellations" label={t('admin.cancellations.title', 'Cancellation Requests')} count={pendingCancellations} />
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
                    <Loader2 className="animate-spin" size={44} color="var(--bg-active)" />
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {active === 'refunds' ? (
                        refunds.length > 0 ? refunds.map((r: any) => {
                            const event = r?.purchase?.tickets?.[0]?.event;
                            const customerName = r?.purchase?.user?.profile?.fullName || r?.purchase?.user?.phoneNumber || r?.purchase?.user?.email || 'Customer';
                            const isPending = r?.status === 'PENDING';

                            return (
                                <div
                                    key={r.id}
                                    style={{
                                        padding: '18px 18px',
                                        borderRadius: 16,
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-card)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 14
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 12,
                                            background: 'rgba(239, 68, 68, 0.08)',
                                            border: '1px solid rgba(239, 68, 68, 0.25)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <HandCoins size={18} color="#EF4444" />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                <div style={{ fontWeight: 1000, color: 'var(--text-main)' }}>
                                                    {t('admin.refunds.refund', 'Refund')} #{r.id}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.72rem',
                                                    padding: '2px 10px',
                                                    borderRadius: 999,
                                                    border: '1px solid var(--border)',
                                                    color: isPending ? '#F59E0B' : (r.status === 'APPROVED' ? '#10B981' : '#EF4444'),
                                                    fontWeight: 900
                                                }}>
                                                    {r.status}
                                                </div>
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem', marginTop: 4 }}>
                                                {customerName} • {event?.title || t('admin.refunds.unknown_event', 'Unknown Event')}
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', marginTop: 4 }}>
                                                {t('admin.refunds.amount', 'Amount')}: ETB {Number(r.amount).toLocaleString()} • {t('admin.refunds.reason', 'Reason')}: {r.reason}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem' }}>
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </div>
                                        {isPending && (
                                            <>
                                                <button
                                                    onClick={() => openRejectRefund(r.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        padding: '10px 14px',
                                                        borderRadius: 12,
                                                        cursor: 'pointer',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid #EF4444',
                                                        color: '#EF4444',
                                                        fontWeight: 900
                                                    }}
                                                >
                                                    <XCircle size={16} /> {t('common.reject', 'Reject')}
                                                </button>
                                                <button
                                                    onClick={() => approveRefund(r.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        padding: '10px 14px',
                                                        borderRadius: 12,
                                                        cursor: 'pointer',
                                                        background: '#10B981',
                                                        border: 'none',
                                                        color: 'white',
                                                        fontWeight: 900
                                                    }}
                                                >
                                                    <CheckCircle size={16} /> {t('common.approve', 'Approve')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 18 }}>
                                {t('admin.refunds.empty', 'No refunds found.')}
                            </div>
                        )
                    ) : (
                        cancellations.length > 0 ? cancellations.map((c: any) => {
                            const meta = c?.metadata || {};
                            const isPending = c?.status === 'PENDING';
                            return (
                                <div
                                    key={c.id}
                                    style={{
                                        padding: '18px 18px',
                                        borderRadius: 16,
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-card)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 14
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 12,
                                            background: 'rgba(245, 158, 11, 0.08)',
                                            border: '1px solid rgba(245, 158, 11, 0.25)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Ban size={18} color="#F59E0B" />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                <div style={{ fontWeight: 1000, color: 'var(--text-main)' }}>
                                                    {t('admin.cancellations.request', 'Cancellation Request')} #{c.id}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.72rem',
                                                    padding: '2px 10px',
                                                    borderRadius: 999,
                                                    border: '1px solid var(--border)',
                                                    color: isPending ? '#F59E0B' : (c.status === 'APPROVED' ? '#10B981' : '#EF4444'),
                                                    fontWeight: 900
                                                }}>
                                                    {c.status}
                                                </div>
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem', marginTop: 4 }}>
                                                {c?.organizer?.organizationName || t('admin.cancellations.organizer', 'Organizer')} • {c?.event?.title || t('admin.cancellations.event', 'Event')}
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', marginTop: 4 }}>
                                                {t('admin.cancellations.reason', 'Reason')}: {meta.reason || c.content}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem' }}>
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </div>
                                        {isPending && (
                                            <>
                                                <button
                                                    onClick={() => openRejectCancellation(c.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        padding: '10px 14px',
                                                        borderRadius: 12,
                                                        cursor: 'pointer',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid #EF4444',
                                                        color: '#EF4444',
                                                        fontWeight: 900
                                                    }}
                                                >
                                                    <XCircle size={16} /> {t('common.reject', 'Reject')}
                                                </button>
                                                <button
                                                    onClick={() => approveCancellation(c.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        padding: '10px 14px',
                                                        borderRadius: 12,
                                                        cursor: 'pointer',
                                                        background: '#10B981',
                                                        border: 'none',
                                                        color: 'white',
                                                        fontWeight: 900
                                                    }}
                                                >
                                                    <CheckCircle size={16} /> {t('common.approve', 'Approve')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 18 }}>
                                {t('admin.cancellations.empty', 'No cancellation requests found.')}
                            </div>
                        )
                    )}
                </div>
            )}

            {decisionOpen && (
                <DecisionModal
                    open={decisionOpen}
                    title={decisionContext?.kind === 'refund-reject'
                        ? t('admin.refunds.reject_title', 'Reject Refund')
                        : t('admin.cancellations.reject_title', 'Reject Cancellation')
                    }
                    onCancel={() => { setDecisionOpen(false); setDecisionContext(null); }}
                    onConfirm={(p: any) => confirmDecision(p)}
                />
            )}
        </motion.div>
    );
};

export default RefundsCancellationsView;
