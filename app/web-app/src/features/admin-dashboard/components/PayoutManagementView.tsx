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
import { AdminPageHeader } from './AdminPageHeader';
import { exportToCSV } from '../../../core/utils/export';
import { Download } from 'lucide-react';

export const PayoutsManagementView = ({ view = 'QUEUE' }: { view?: 'QUEUE' | 'SETTLEMENTS' }) => {
    const { t } = useTranslation();
    const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
    const [processedPayouts, setProcessedPayouts] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [payoutsRes, processedRes, metricsRes]: any = await Promise.all([
                AdminService.getPendingPayouts(),
                AdminService.getProcessedPayouts(),
                AdminService.getFinancialMetrics()
            ]);
            setPendingPayouts(payoutsRes.data || []);
            setProcessedPayouts(processedRes.data || []);
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

    const handleReject = async (batchId: number) => {
        const reason = prompt('Please enter the reason for rejection:');
        if (!reason) return;
        try {
            setProcessingId(batchId);
            await AdminService.rejectPayout(batchId, reason);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reject payout');
        } finally {
            setProcessingId(null);
        }
    };

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
                title={view === 'SETTLEMENTS' ? 'Settlement Ledger' : t('admin.payouts')}
                subtitle={view === 'SETTLEMENTS'
                    ? 'Complete fiscal audit of all resolved funds and platform transfers.'
                    : t('admin.payouts_desc', 'Track platform sales volume and settle organizer balances.')}
                actions={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {view === 'QUEUE' && (
                            <button
                                onClick={() => {
                                    if (confirm('Initiate bulk settlement for all ready batches?')) {
                                        alert('Global settlement initiated (Sovereign Action)');
                                    }
                                }}
                                style={{ background: 'var(--bg-active)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}
                            >
                                Initiate Bulk Settlement
                            </button>
                        )}
                        <button
                            onClick={() => exportToCSV((view === 'SETTLEMENTS' ? processedPayouts : pendingPayouts).map(p => ({
                                Organizer: p.wallet?.organizer?.organizationName,
                                Amount: p.amount,
                                Method: p.method,
                                Details: p.payoutDetails,
                                Requested: p.createdAt
                            })), `${view.toLowerCase()}_export.csv`)}
                            className="btn-blue" style={{ background: '#12171F', color: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            <Download size={16} /> {t('admin.export_queue', 'Export List')}
                        </button>
                    </div>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>{view === 'SETTLEMENTS' ? 'TOTAL SETTLED' : 'MONTHLY GMV'}</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>ETB {(view === 'SETTLEMENTS' ? processedPayouts.reduce((sum, p) => sum + Number(p.amount), 0) : metrics.monthlyGMV).toLocaleString()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3B82F6', fontSize: '0.75rem', fontWeight: 700, marginTop: '12px' }}>
                        <DollarSign size={14} /> {view === 'SETTLEMENTS' ? 'Lifetime platform settlements' : 'Gross volume this month'}
                    </div>
                </div>
                <div className="admin-stat-card-main">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>{view === 'SETTLEMENTS' ? 'AUDITED COUNT' : 'PENDING PAYOUTS'}</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{view === 'SETTLEMENTS' ? processedPayouts.length : metrics.pendingPayouts.amount.toLocaleString()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700, marginTop: '12px' }}>
                        <Clock size={14} /> {view === 'SETTLEMENTS' ? 'Resolved financial records' : `${metrics.pendingPayouts.count} requests waiting`}
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

            {view === 'QUEUE' ? (
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
                                        No pending payout requests found.
                                    </td>
                                </tr>
                            ) : (
                                pendingPayouts.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <p style={{ fontWeight: 800 }}>{p.wallet?.organizer?.organizationName}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Method: {p.method}</p>
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
                                                <button onClick={() => handleReject(p.id)} disabled={processingId === p.id} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid #EF4444', padding: '8px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Reject</button>
                                                <button onClick={() => handleApprove(p.id)} disabled={processingId === p.id} style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    {processingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve
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
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Fiscal Audit Ledger</h3>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                            {processedPayouts.length} SETTLED RECORDS
                        </div>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ORGANIZER</th>
                                <th>AMOUNT</th>
                                <th>METHOD</th>
                                <th>PROCESSED AT</th>
                                <th>FISCAL STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedPayouts.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No settlement history found.</td></tr>
                            ) : (
                                processedPayouts.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <p style={{ fontWeight: 800 }}>{p.wallet?.organizer?.organizationName}</p>
                                        </td>
                                        <td style={{ fontWeight: 900 }}>ETB {Number(p.amount).toLocaleString()}</td>
                                        <td>{p.method}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(p.processedAt).toLocaleString()}</td>
                                        <td>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 800,
                                                background: p.status === 'PAID_OUT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: p.status === 'PAID_OUT' ? '#10B981' : '#EF4444',
                                                padding: '4px 10px', borderRadius: '6px'
                                            }}>
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );
};
