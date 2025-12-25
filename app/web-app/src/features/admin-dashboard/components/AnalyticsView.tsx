import { motion } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';

export const AnalyticsView = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader title="Platform Analytics" subtitle="Deep dive into ticket velocity, user retention, and regional growth." />
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                <div className="admin-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Growth Trajectory</h3>
                    <div style={{ height: '200px', width: '100%', borderLeft: '2px solid var(--border)', borderBottom: '2px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '20px' }}>
                        {[40, 70, 45, 90, 65, 80].map((h, i) => (
                            <div key={i} style={{ width: '30px', height: `${h}%`, background: '#1D90F5', borderRadius: '4px 4px 0 0' }} />
                        ))}
                    </div>
                </div>
                <div className="admin-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Top Selling Categories</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { label: 'Music & Concerts', val: '65%' },
                            { label: 'Tech & Business', val: '20%' },
                            { label: 'Sports', val: '10%' },
                            { label: 'Other', val: '5%' },
                        ].map((c, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{c.label}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.val}</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                                    <div style={{ height: '100%', width: c.val, background: '#D946EF', borderRadius: '10px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
