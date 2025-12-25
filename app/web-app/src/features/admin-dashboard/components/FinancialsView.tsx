import { motion } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';

export const FinancialsView = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader title="Financial Oversight" subtitle="Platform commission, GMV tracking, and organizer payout settlement." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Platform Commission</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>$124,050</h2>
                    <p style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>+15% this week</p>
                </div>
                <div className="admin-stat-card-main">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Pending Payouts</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>$45,200</h2>
                    <p style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 700 }}>8 batches ready</p>
                </div>
                <div className="admin-stat-card-main">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Settled This Month</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>$850,000</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Via CBE, TeleBirr, Stripe</p>
                </div>
            </div>

            <div className="admin-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Incoming Transaction Audit</h3>
                    <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>Download Ledger</button>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>TX ID</th>
                            <th>ORGANIZER</th>
                            <th>METHOD</th>
                            <th>AMOUNT</th>
                            <th>FEE (10%)</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { id: 'TX-9021', org: 'Ethio-Jazz', method: 'TeleBirr', amount: '$1,200', fee: '$120', status: 'Settled' },
                            { id: 'TX-9022', org: 'Neon Nights', method: 'CBE Birr', amount: '$4,500', fee: '$450', status: 'Pending' },
                            { id: 'TX-9023', org: 'Tech Co.', method: 'Stripe', amount: '$800', fee: '$80', status: 'Settled' },
                        ].map((tx, i) => (
                            <tr key={i}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{tx.id}</td>
                                <td>{tx.org}</td>
                                <td>{tx.method}</td>
                                <td style={{ fontWeight: 800 }}>{tx.amount}</td>
                                <td style={{ color: '#1D90F5', fontWeight: 800 }}>{tx.fee}</td>
                                <td><span className="pill" style={{ background: tx.status === 'Settled' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: tx.status === 'Settled' ? '#10B981' : '#F59E0B' }}>{tx.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};
