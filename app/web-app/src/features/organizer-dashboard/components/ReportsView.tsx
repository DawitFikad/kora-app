import { motion } from 'framer-motion';
import { Download, DollarSign, CreditCard, Shield, Package } from 'lucide-react';
import { PageHeader } from './PageHeader';

export const ReportsView = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader
                title="Financial Reports"
                subtitle="Detailed breakdown of sales, taxes, and payouts."
                actions={<button className="btn-blue" style={{ background: '#161B22', color: 'white' }}><Download size={18} /> Export CSV</button>}
            />

            <div className="stats-grid">
                {[
                    { label: 'Gross Sales', value: '$42,500', icon: DollarSign, color: '#1D90F5' },
                    { label: 'Total Payouts', value: '$38,200', icon: CreditCard, color: '#10B981' },
                    { label: 'Processing Fees', value: '$1,840', icon: Shield, color: '#EF4444' },
                    { label: 'Available Balance', value: '$2,460', icon: Package, color: '#FBBF24' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{s.label}</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{s.value}</h3>
                    </div>
                ))}
            </div>

            <div className="stat-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Transaction History</h3>
                </div>
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
                        {[
                            { id: '#ORD-9021', name: 'Abinet Kebede', date: 'Oct 12, 2:45 PM', amount: '$130.00', status: 'Completed' },
                            { id: '#ORD-9020', name: 'Sara Mohammed', date: 'Oct 12, 1:12 PM', amount: '$65.00', status: 'Completed' },
                            { id: '#ORD-9019', name: 'Elias Tadesse', date: 'Oct 11, 11:20 PM', amount: '$195.00', status: 'Processing' },
                            { id: '#ORD-9018', name: 'Lily Thompson', date: 'Oct 11, 8:05 PM', amount: '$65.00', status: 'Completed' },
                        ].map((tx, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 800, color: '#1D90F5' }}>{tx.id}</td>
                                <td style={{ fontWeight: 700 }}>{tx.name}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{tx.date}</td>
                                <td style={{ fontWeight: 800 }}>{tx.amount}</td>
                                <td><span className="pill pill-green" style={{ background: tx.status === 'Processing' ? 'rgba(251, 191, 36, 0.1)' : undefined, color: tx.status === 'Processing' ? '#FBBF24' : undefined }}>{tx.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};
