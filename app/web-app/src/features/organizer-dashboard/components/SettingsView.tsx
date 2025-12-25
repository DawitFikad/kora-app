import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';

export const SettingsView = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await OrganizerService.getSettings();
                setProfile(response.data);
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await OrganizerService.updateSettings(profile);
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Failed to save settings", error);
            alert("Error saving settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Profile Settings" subtitle="Control your organization profile and account preferences." />

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['General', 'Payout Methods', 'Team Access', 'Notifications', 'Security', 'Billing'].map((tab, i) => (
                        <div key={i} style={{
                            padding: '12px 16px', borderRadius: '100px', background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
                            color: i === 0 ? 'white' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer'
                        }}>
                            {tab}
                        </div>
                    ))}
                </div>

                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Public Profile</h3>

                    <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', alignItems: 'center' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '24px', background: 'linear-gradient(45deg, #1D90F5, #D946EF)', padding: '4px' }}>
                            <img
                                src={`https://ui-avatars.com/api/?name=${profile?.organizationName}&background=11141B&color=fff&size=128`}
                                style={{ width: '100%', height: '100%', borderRadius: '20px' }}
                            />
                        </div>
                        <div>
                            <button className="btn-blue" style={{ background: 'white', color: 'black', padding: '10px 20px', fontSize: '0.85rem' }}>Change Logo</button>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>At least 512x512px. JPG or PNG only.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Organization Name</label>
                            <input type="text" value={profile?.organizationName || ''} onChange={e => setProfile({ ...profile, organizationName: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Contact Email</label>
                            <input type="email" value={profile?.contactEmail || ''} onChange={e => setProfile({ ...profile, contactEmail: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Payout Details (Bank/Mobile Money)</label>
                        <input type="text" placeholder="e.g. CBE - 1000123456789" value={profile?.payoutDetails || ''} onChange={e => setProfile({ ...profile, payoutDetails: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white' }} />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>About the Organizer</label>
                        <textarea rows={4} value={profile?.adminNote || ''} onChange={e => setProfile({ ...profile, adminNote: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', resize: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={handleSave} disabled={saving} className="btn-blue" style={{ padding: '14px 28px' }}>
                            {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
