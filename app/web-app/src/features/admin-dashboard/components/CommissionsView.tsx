import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, DollarSign, Wallet, ArrowUpRight } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';

import { exportToCSV } from '../../../core/utils/export';

export const CommissionsView = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [fees, setFees] = useState<any[]>([]);
    const [overrides, setOverrides] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const handleExport = () => {
        const exportData = transactions.map(tx => ({
            id: tx.id,
            event: tx.event?.title || 'N/A',
            organizer: tx.event?.organizer?.organizationName || 'N/A',
            type: tx.type,
            amount: tx.amount,
            fee: tx.feeAmount,
            net: tx.netAmount,
            status: tx.status,
            date: new Date(tx.createdAt).toLocaleString()
        }));
        exportToCSV(exportData, `commission_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [txResponse, metricsResponse, feesResponse]: any = await Promise.all([
                AdminService.getFinancialTransactions(),
                AdminService.getFinancialMetrics(),
                AdminService.getPlatformFees()
            ]);
            // Filter for only platform fee transactions in the table if desired?
            // Actually, keep the ledger but focus the title.
            setTransactions(txResponse.data || []);
            setMetrics(metricsResponse.data || null);
            setFees(feesResponse.data || []);
            setOverrides(feesResponse.overrides || []);
        } catch (err) {
            console.error('Failed to fetch commission data', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateFee = async (feeId: number, data: any) => {
        try {
            setIsSaving(true);
            await AdminService.updatePlatformFee({ id: feeId, ...data });
            await fetchData();
        } catch (err) {
            console.error('Failed to update fee', err);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading || !metrics) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader title="Commissions & Revenue" subtitle="Detailed audit of platform fees, commission rates, and real-time revenue collection." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Platform Commission</p>
                        <DollarSign size={18} color="#10B981" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>ETB {metrics.platformCommission.toLocaleString()}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>Total revenue earned</p>
                </div>
                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Pending Payouts</p>
                        <Wallet size={18} color="#F59E0B" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>ETB {metrics.pendingPayouts.amount.toLocaleString()}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 700 }}>{metrics.pendingPayouts.count} batches ready</p>
                </div>
                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Monthly GMV</p>
                        <ArrowUpRight size={18} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>ETB {metrics.monthlyGMV.toLocaleString()}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gross volume this month</p>
                </div>
            </div>

            {/* Global Fee Configuration */}
            <div className="admin-card" style={{ padding: '32px', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Global Fee Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                    {fees.filter(f => f.isDefault).map(fee => (
                        <div key={fee.id} style={{ padding: '24px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>{fee.name}</span>
                                <span className="pill" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>DEFAULT</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                <div style={{ flex: 1, minWidth: '120px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>PERCENTAGE (%)</label>
                                    <input
                                        type="number"
                                        defaultValue={fee.feePercentage}
                                        onChange={(e) => fee.newPercentage = Number(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white', fontWeight: 700 }}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: '120px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>CONVENIENCE FEE (ETB)</label>
                                    <input
                                        type="number"
                                        defaultValue={fee.feeFixed}
                                        onChange={(e) => fee.newFixed = Number(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'white', fontWeight: 700 }}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => handleUpdateFee(fee.id, {
                                    name: fee.name,
                                    feePercentage: fee.newPercentage !== undefined ? fee.newPercentage : fee.feePercentage,
                                    feeFixed: fee.newFixed !== undefined ? fee.newFixed : fee.feeFixed,
                                    isDefault: true
                                })}
                                disabled={isSaving}
                                className="btn-blue"
                                style={{ marginTop: '20px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Update Settings'}
                            </button>
                        </div>
                    ))}
                    {fees.length === 0 && (
                        <div style={{ padding: '24px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px dotted var(--border)', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No fee configs found. Initializing...</p>
                            <button
                                onClick={() => handleUpdateFee(0, { name: 'Standard Commission', feeType: 'PERCENTAGE', feePercentage: 5, feeFixed: 10, isDefault: true })}
                                className="btn-blue"
                                style={{ marginTop: '12px' }}
                            >
                                Create Default Fee
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Overrides Table */}
            {overrides.length > 0 && (
                <div className="admin-card" style={{ padding: '32px', marginBottom: '32px', borderLeft: '4px solid #8B5CF6' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Active Commission Overrides
                        <span style={{ fontSize: '0.7rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '4px 8px', borderRadius: '8px' }}>{overrides.length} Partner Overrides</span>
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {overrides.map(ov => (
                            <div key={ov.id} style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 900 }}>{ov.organizationName}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{ov.feePercentage}% + ETB {ov.feeFixed}</p>
                                </div>
                                <ArrowUpRight size={16} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                            </div>
                        ))}
                    </div>
                    <p style={{ marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Note: Overrides are set individually via the Organizer Approvals panel.</p>
                </div>
            )}

            <div className="admin-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Incoming Transaction Audit</h3>
                    <button
                        onClick={handleExport}
                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <Download size={16} /> Download Ledger
                    </button>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>TX ID</th>
                            <th>EVENT / ORGANIZER</th>
                            <th>TYPE</th>
                            <th>GROSS AMOUNT</th>
                            <th>FEE</th>
                            <th>NET</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions found</td></tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>TX-{tx.id.toString().padStart(4, '0')}</td>
                                    <td>
                                        <p style={{ fontWeight: 800, fontSize: '0.85rem' }}>{tx.event?.title || 'System/Payout'}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.event?.organizer?.organizationName || 'Platform'}</p>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{tx.type.replace('_', ' ')}</span>
                                    </td>
                                    <td style={{ fontWeight: 800, fontSize: '0.85rem' }}>ETB {Number(tx.amount).toLocaleString()}</td>
                                    <td style={{ color: '#F59E0B', fontWeight: 800, fontSize: '0.85rem' }}>{tx.feeAmount > 0 ? `ETB ${Number(tx.feeAmount).toLocaleString()}` : '-'}</td>
                                    <td style={{ color: '#1D90F5', fontWeight: 800, fontSize: '0.85rem' }}>ETB {Number(tx.netAmount).toLocaleString()}</td>
                                    <td>
                                        <span className="pill" style={{
                                            background: tx.status === 'SETTLED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: tx.status === 'SETTLED' ? '#10B981' : '#F59E0B'
                                        }}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};
