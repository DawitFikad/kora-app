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
                            <input type="number" defaultValue={10} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>SEAT LOCK DURATION (MINUTES)</label>
                            <input type="number" defaultValue={15} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>QR RE-SCAN TIMEOUT (SECONDS)</label>
                            <input type="number" defaultValue={30} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }} />
                        </div>
                        <button className="btn-blue" style={{ background: 'var(--bg-active)', color: 'white', padding: '12px', width: '100%', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>Update Global Rules</button>
                    </div>
                </div>

                <div className="admin-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Governance & Audit</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { label: 'Mandatory 2FA for all Admins', active: true },
                            { label: 'AI Fraud Protection Layer', active: true },
                            { label: 'Real-time IP Blacklisting', active: false },
                            { label: 'Auto-suspend on Dispute Threshold', active: true },
                            { label: 'Cryptographic Scan Verification', active: true },
                        ].map((rule, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{rule.label}</span>
                                <div style={{
                                    width: '42px',
                                    height: '22px',
                                    background: rule.active ? 'var(--bg-active)' : 'rgba(255,255,255,0.1)',
                                    borderRadius: '20px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}>
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        background: 'white',
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        left: rule.active ? '22px' : '4px',
                                        top: '3px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
