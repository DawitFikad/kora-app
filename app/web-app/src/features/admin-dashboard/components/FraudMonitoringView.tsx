import { motion } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';

export const FraudMonitoringView = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader title="Fraud & Security Control" subtitle="Real-time monitoring of suspicious ticket activity and identity fraud." />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <h4 style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px' }}>CRITICAL ALERTS</h4>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>04</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Action required immediately</p>
                </div>
                <div className="admin-stat-card-main">
                    <h4 style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px' }}>SUSPICIOUS ORGS</h4>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>12</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending audit</p>
                </div>
                <div className="admin-stat-card-main">
                    <h4 style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px' }}>AUTH SUCCESS</h4>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>99.8%</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last 24 hours</p>
                </div>
            </div>

            <div className="admin-card" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Live Security Log</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { event: 'Bulk Purchase Detected', detail: 'User #921 bought 45 tickets in 2 seconds', time: 'Just now', severity: 'High' },
                        { event: 'Multiple Scan Timeout', detail: 'QR Token #AX-22 scanned 4 times in 10 mins', time: '2 mins ago', severity: 'Med' },
                        { event: 'Geo-location Anomaly', detail: 'Organizer login from non-standard region (RU)', time: '15 mins ago', severity: 'High' },
                    ].map((log, i) => (
                        <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.severity === 'High' ? '#EF4444' : '#F59E0B' }} />
                                <div>
                                    <h4 style={{ fontWeight: 800, fontSize: '0.95rem' }}>{log.event}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.detail}</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontWeight: 800, fontSize: '0.85rem' }}>{log.time}</p>
                                <button style={{ color: '#3B82F6', background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>ANALYZE ROOT CAUSE</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
