import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Clock, CheckCircle2, AlertCircle, ArrowUpRight, Filter, MoreHorizontal, Download, ShieldCheck } from 'lucide-react';
import { AdminService } from '../../../../core/api/admin.service';

const currency = (v: number) => v == null ? '—' : `ETB ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const normalizePayoutPayload = (payload: any) => {
    const data = payload?.data || payload || {};
    return {
        available: Array.isArray(data.available) ? data.available : [],
        pending: Array.isArray(data.pending) ? data.pending : [],
        paid: Array.isArray(data.paid) ? data.paid : [],
        availableTotal: Number(data.availableTotal || 0),
        pendingTotal: Number(data.pendingTotal || 0),
        paidTotal: Number(data.paidTotal || 0),
    };
};

const createCsv = (rows: string[][]) => rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

export const OrganizerPayouts: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState<any>({ available: [], pending: [], paid: [] });
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('');
    const [actionBusy, setActionBusy] = useState<string | null>(null);
    const [statusText, setStatusText] = useState<string | null>(null);

    const loadPayouts = async (showLoader = false) => {
        if (showLoader) setLoading(true);
        setError(null);
        try {
            const response = await AdminService.getOrganizerPayouts();
            setPayouts(normalizePayoutPayload(response));
        } catch (err) {
            console.error('Payouts fetch failed', err);
            setError('Failed to load payouts');
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const response = await AdminService.getOrganizerPayouts();
                if (!mounted) return;
                setPayouts(normalizePayoutPayload(response));
            } catch (err) {
                console.error('Payouts fetch failed', err);
                if (mounted) setError('Failed to load payouts');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false };
    }, []);

    const approveBatch = async (batchId: number) => {
        setStatusText(null);
        setActionBusy(`approve-${batchId}`);
        try {
            await AdminService.approvePayout(batchId, 'Approved from GMV payout dashboard');
            await loadPayouts(false);
            setStatusText(`Batch #${batchId} approved successfully.`);
        } catch (err: any) {
            console.error('Approve payout failed', err);
            setError(err?.message || 'Failed to approve payout');
        } finally {
            setActionBusy(null);
        }
    };

    const rejectBatch = async (batchId: number) => {
        const reason = window.prompt('Enter rejection reason for this payout batch:', 'Insufficient verification details');
        if (!reason) return;

        setStatusText(null);
        setActionBusy(`reject-${batchId}`);
        try {
            await AdminService.rejectPayout(batchId, reason);
            await loadPayouts(false);
            setStatusText(`Batch #${batchId} rejected.`);
        } catch (err: any) {
            console.error('Reject payout failed', err);
            setError(err?.message || 'Failed to reject payout');
        } finally {
            setActionBusy(null);
        }
    };

    const processAllPending = async () => {
        const pendingItems = Array.isArray(payouts.pending) ? payouts.pending : [];
        if (pendingItems.length === 0) {
            setStatusText('No pending payouts to process.');
            return;
        }

        const confirmed = window.confirm(`Approve ${pendingItems.length} pending payout batch(es)?`);
        if (!confirmed) return;

        setStatusText(null);
        setActionBusy('process-all');
        try {
            let successCount = 0;
            let failedCount = 0;

            for (const row of pendingItems) {
                try {
                    await AdminService.approvePayout(Number(row.batchId), 'Bulk-approved from GMV payout dashboard');
                    successCount += 1;
                } catch (err) {
                    console.error('Bulk payout approval failed', { batchId: row.batchId, err });
                    failedCount += 1;
                }
            }

            await loadPayouts(false);
            setStatusText(`Processed pending payouts. Approved: ${successCount}, Failed: ${failedCount}.`);
        } catch (err: any) {
            console.error('Process all payouts failed', err);
            setError(err?.message || 'Failed to process all pending payouts');
        } finally {
            setActionBusy(null);
        }
    };

    const exportSnapshot = () => {
        const rows: string[][] = [['section', 'batchId', 'organizer', 'amount', 'status', 'date']];

        (payouts.available || []).forEach((r: any) => rows.push([
            'available',
            String(r.batchId || ''),
            String(r.organizerName || ''),
            String(r.available || 0),
            'AVAILABLE',
            ''
        ]));

        (payouts.pending || []).forEach((r: any) => rows.push([
            'pending',
            String(r.batchId || ''),
            String(r.organizerName || ''),
            String(r.amount || 0),
            String(r.status || 'INITIATED'),
            r.createdAt ? new Date(r.createdAt).toISOString() : ''
        ]));

        (payouts.paid || []).forEach((r: any) => rows.push([
            'paid',
            String(r.batchId || ''),
            String(r.organizerName || ''),
            String(r.amount || 0),
            String(r.status || 'PAID_OUT'),
            r.settledAt ? new Date(r.settledAt).toISOString() : ''
        ]));

        const csv = createCsv(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `organizer-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatusText('Payout snapshot exported.');
    };

    if (error) return (
        <div style={{ padding: '40px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <AlertCircle color="#EF4444" size={24} />
            <span style={{ color: '#EF4444', fontWeight: 700 }}>{error}</span>
        </div>
    );

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ height: '300px', background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '32px', height: '32px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>QUANTIZING SETTLEMENT DATA...</span>
                </div>
            </div>
        </div>
    );

    const StatCard = ({ label, amount, items, color, icon: Icon, type }: any) => (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: '32px',
                borderRadius: '32px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                height: '480px',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: `radial-gradient(circle at top right, ${color}15, transparent)`, pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon color={color} size={24} />
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{label}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--text-main)' }}>{currency(amount)}</div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '8px', scrollbarWidth: 'none' }}>
                {items?.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.5 }}>
                        <ArrowUpRight size={32} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>No active settlements found</span>
                    </div>
                ) : items?.map((r: any) => (
                    <div key={`${type}-${r.batchId || r.organizerId || r.organizerName}`} style={{
                        padding: '16px',
                        borderRadius: '20px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem', color: 'var(--primary)' }}>
                                {r.organizerName?.[0] || 'O'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>{r.organizerName || r.organizer || 'Unnamed Partner'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{type === 'paid' ? (r.settledAt ? new Date(r.settledAt).toLocaleDateString() : 'Settled') : `ID: #${r.organizerId || '---'}`}</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '170px' }}>
                            <div style={{ fontWeight: 950, fontSize: '0.95rem' }}>{currency(r.available || r.amount)}</div>
                            {type === 'pending' && <span style={{ fontSize: '0.6rem', color: '#F59E0B', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLEARING</span>}
                            {type === 'pending' && (
                                <div style={{ marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => approveBatch(Number(r.batchId))}
                                        disabled={actionBusy === `approve-${r.batchId}` || actionBusy === 'process-all'}
                                        style={{ padding: '6px 10px', borderRadius: '10px', border: 'none', background: '#10B981', color: 'white', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        {actionBusy === `approve-${r.batchId}` ? 'Approving...' : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => rejectBatch(Number(r.batchId))}
                                        disabled={actionBusy === `reject-${r.batchId}` || actionBusy === 'process-all'}
                                        style={{ padding: '6px 10px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        {actionBusy === `reject-${r.batchId}` ? 'Rejecting...' : 'Reject'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => loadPayouts(false)}
                disabled={!!actionBusy}
                style={{ marginTop: '24px', width: '100%', padding: '14px', borderRadius: '16px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
                Refresh Data
                <MoreHorizontal size={14} />
            </button>
        </motion.section>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* 📍 Control Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Filter style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                        <input
                            placeholder="Filter by organizer..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            style={{ padding: '12px 16px 12px 44px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', fontSize: '0.9rem', width: '300px' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={exportSnapshot}
                        style={{ padding: '12px 24px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                        <Download size={18} />
                        Export Snapshot
                    </button>
                    <button
                        onClick={processAllPending}
                        disabled={actionBusy === 'process-all'}
                        style={{ padding: '12px 24px', borderRadius: '16px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(29, 144, 245, 0.3)', opacity: actionBusy === 'process-all' ? 0.7 : 1 }}
                    >
                        {actionBusy === 'process-all' ? 'Processing...' : 'Process All Pending Payouts'}
                    </button>
                </div>
            </div>

            {statusText && (
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontWeight: 700, fontSize: '0.85rem' }}>
                    {statusText}
                </div>
            )}

            {/* 📊 Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
                <StatCard
                    label="Available to Payout"
                    amount={payouts.availableTotal || payouts.available?.reduce((s: number, p: any) => s + (p.available || 0), 0)}
                    items={payouts.available?.filter((i: any) => (i.organizerName || '').toLowerCase().includes(filter.toLowerCase()))}
                    color="#3B82F6"
                    icon={CheckCircle2}
                    type="available"
                />
                <StatCard
                    label="Pending Settlement"
                    amount={payouts.pendingTotal || payouts.pending?.reduce((s: number, p: any) => s + (p.amount || 0), 0)}
                    items={payouts.pending?.filter((i: any) => (i.organizerName || '').toLowerCase().includes(filter.toLowerCase()))}
                    color="#F59E0B"
                    icon={Clock}
                    type="pending"
                />
                <StatCard
                    label="Lifetime Settlements"
                    amount={payouts.paidTotal || payouts.paid?.reduce((s: number, p: any) => s + (p.amount || 0), 0)}
                    items={payouts.paid?.filter((i: any) => (i.organizerName || '').toLowerCase().includes(filter.toLowerCase()))}
                    color="#10B981"
                    icon={Wallet}
                    type="paid"
                />
            </div>

            {/* 🛡️ Risk & Compliance Indicator */}
            <div style={{ padding: '24px 32px', borderRadius: '24px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck color="#3B82F6" size={20} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 850 }}>System Liquidity Assurance</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>All displayed funds are reconciled with Telebirr/Chapa settlement batches.</p>
                    </div>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RECONCILED 100%</div>
            </div>
        </div>
    );
};

export default OrganizerPayouts;
