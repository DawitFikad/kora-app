import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, DollarSign, CreditCard, Shield, Package, Loader2 } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';

export const ReportsView = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const response = await OrganizerService.getFinancials();
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch financials", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFinancials();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100% ' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    const stats = [
        { label: 'Gross Sales', value: `ETB ${data?.grossSales.toLocaleString()}`, icon: DollarSign, color: '#1D90F5' },
        { label: 'Total Payouts', value: `ETB ${data?.totalPayouts.toLocaleString()}`, icon: CreditCard, color: '#10B981' },
        { label: 'Processing Fees', value: `ETB ${data?.processingFees.toLocaleString()}`, icon: Shield, color: '#EF4444' },
        { label: 'Available Balance', value: `ETB ${data?.availableBalance.toLocaleString()}`, icon: Package, color: '#FBBF24' },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader
                title="Financial Reports"
                subtitle="Detailed breakdown of sales, taxes, and payouts."
                actions={<button className="btn-blue" style={{ background: '#161B22', color: 'white' }}><Download size={18} /> Export CSV</button>}
            />

            <div className="stats-grid">
                {stats.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ background: `${s.color}20`, padding: '8px', borderRadius: '8px' }}>
                                <s.icon size={18} color={s.color} />
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{s.label}</p>
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{s.value}</h3>
                    </div>
                ))}
            </div>

            <div className="stat-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Transaction History</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="event-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.transactions.map((tx: any, i: number) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 800, color: '#1D90F5' }}>{tx.id}</td>
                                    <td style={{ fontWeight: 700 }}>{tx.name}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 800 }}>ETB {tx.amount.toLocaleString()}</td>
                                    <td>
                                        <span className={`pill ${tx.status === 'Completed' ? 'pill-green' : 'pill-blue'}`} style={{
                                            background: tx.status === 'Processing' ? 'rgba(251, 191, 36, 0.1)' : undefined,
                                            color: tx.status === 'Processing' ? '#FBBF24' : undefined
                                        }}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {data?.transactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No transactions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};
