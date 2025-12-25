import { motion } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';

export const AdminSettingsView = () => {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AdminPageHeader title="System Configuration" subtitle="Global platform rules, commission rates, and security parameters." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="admin-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Platform Parameters</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>DEFAULT COMMISSION RATE (%)</label>
                            <input type="number" defaultValue={10} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>SEAT LOCK DURATION (MINUTES)</label>
                            <input type="number" defaultValue={15} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>QR RE-SCAN TIMEOUT (SECONDS)</label>
                            <input type="number" defaultValue={30} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                        <button className="btn-blue" style={{ background: '#3B82F6', color: 'white', padding: '12px', width: '100%', border: 'none', borderRadius: '10px', fontWeight: 800 }}>Update Global Rules</button>
                    </div>
                </div>

                <div className="admin-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Governance & Audit</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            'Enable Mandatory 2FA for all Admins',
                            'Automated Fraud Protection (AI model)',
                            'Real-time IP Monitoring',
                            'Auto-suspend Organizer on 5+ Disputes',
                        ].map((rule, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{rule}</span>
                                <div style={{ width: '40px', height: '20px', background: '#10B981', borderRadius: '20px', position: 'relative' }}>
                                    <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
