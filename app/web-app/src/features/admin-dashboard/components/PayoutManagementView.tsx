import { useState, useEffect } from 'react';
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
import { AdminPageHeader } from './AdminPageHeader';

export const PayoutsManagementView = () => {
    const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [payoutsRes, metricsRes]: any = await Promise.all([
                AdminService.getPendingPayouts(),
                AdminService.getFinancialMetrics()
            ]);
            setPendingPayouts(payoutsRes.data || []);
            setMetrics(metricsRes.data || null);
        } catch (err) {
            console.error('Failed to fetch payout data', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (batchId: number) => {
        if (!confirm('Are you sure you want to approve this payout? This will deduct funds from the organizer\'s wallet.')) return;
        try {
            setProcessingId(batchId);
            await AdminService.approvePayout(batchId);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve payout');
        } finally {
            setProcessingId(null);
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
            <AdminPageHeader
                title="GMV & Payout Management"
                subtitle="Track platform sales volume and settle organizer balances."
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>MONTHLY GMV</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>ETB {metrics.monthlyGMV.toLocaleString()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3B82F6', fontSize: '0.75rem', fontWeight: 700, marginTop: '12px' }}>
                        <DollarSign size={14} /> Gross volume this month
                    </div>
                </div>
                <div className="admin-stat-card-main">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>PENDING PAYOUTS</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>ETB {metrics.pendingPayouts.amount.toLocaleString()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700, marginTop: '12px' }}>
                        <Clock size={14} /> {metrics.pendingPayouts.count} requests waiting
                    </div>
                </div>
                <div className="admin-stat-card-main" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>PLATFORM COMMISSION</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981' }}>ETB {metrics.platformCommission.toLocaleString()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '0.75rem', fontWeight: 700, marginTop: '12px' }}>
                        <ShieldCheck size={14} /> Net revenue earned
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Payout Queue</h3>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                        {pendingPayouts.length} REQUESTS
                    </div>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ORGANIZER</th>
                            <th>AMOUNT</th>
                            <th>METHOD</th>
                            <th>DETAILS</th>
                            <th>REQUESTED</th>
                            <th style={{ textAlign: 'right' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingPayouts.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                    <div style={{ marginBottom: '12px' }}><Wallet size={40} opacity={0.2} style={{ margin: '0 auto' }} /></div>
                                    No pending payout requests.
                                </td>
                            </tr>
                        ) : (
                            pendingPayouts.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <p style={{ fontWeight: 800 }}>{p.wallet?.organizer?.organizationName}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Balance: ETB {p.wallet?.availableBalance.toLocaleString()}</p>
                                    </td>
                                    <td>
                                        <p style={{ fontWeight: 900, color: 'white' }}>ETB {Number(p.amount).toLocaleString()}</p>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3B82F6' }}>{p.method}</span>
                                    </td>
                                    <td>
                                        <p style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{p.payoutDetails}</p>
                                    </td>
                                    <td>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</p>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleApprove(p.id)}
                                            disabled={processingId === p.id}
                                            style={{
                                                background: '#10B981', color: 'white', border: 'none',
                                                padding: '8px 16px', borderRadius: '8px', fontWeight: 800,
                                                fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {processingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                            Approve Payout
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '32px' }} className="admin-card">
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Settlement Logic</h3>
                </div>
                <div style={{ padding: '24px', display: 'flex', gap: '24px' }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px', color: '#3B82F6' }}>AUTOMATED PAYOUTS</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mobile Money (TeleBirr/CBE Birr) payouts are processed via B2B API upon approval. Ensure merchant gateway has sufficient float.</p>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px', color: '#F59E0B' }}>MANUAL SETTLEMENT</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bank transfers require manual processing. Approve the request here AFTER the bank transfer is confirmed externally.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
