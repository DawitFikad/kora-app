import { motion } from 'framer-motion';
import { PageHeader } from './PageHeader';

export const SettingsView = () => {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Profile Settings" subtitle="Control your organization profile and account preferences." />

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['General', 'Payout Methods', 'Team Access', 'Notifications', 'Security', 'Billing'].map((tab, i) => (
                        <div key={i} style={{
                            padding: '12px 16px', borderRadius: '10px', background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
                            color: i === 0 ? 'white' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer'
                        }}>
                            {tab}
                        </div>
                    ))}
                </div>

                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Public Profile</h3>

                    <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', alignItems: 'center' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '20px', background: 'linear-gradient(45deg, #1D90F5, #D946EF)', padding: '4px' }}>
                            <img src="https://ui-avatars.com/api/?name=Alex+Morgan&background=11141B&color=fff&size=128" style={{ width: '100%', height: '100%', borderRadius: '16px' }} />
                        </div>
                        <div>
                            <button className="btn-blue" style={{ background: 'white', color: 'black', padding: '8px 16px', fontSize: '0.85rem' }}>Change Logo</button>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>At least 512x512px. JPG or PNG only.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Organization Name</label>
                            <input type="text" defaultValue="Alex Morgan Events" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Contact Email</label>
                            <input type="email" defaultValue="alex@events.com" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>About the Organizer</label>
                        <textarea rows={4} defaultValue="The leading event management firm in Addis Ababa, specializing in music festivals and tech networking events." style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white', resize: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn-blue" style={{ padding: '12px 24px' }}>Save Changes</button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
