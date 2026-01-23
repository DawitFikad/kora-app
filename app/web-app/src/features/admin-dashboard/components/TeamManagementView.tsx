import { useState } from 'react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';
import { UserPlus, Shield, Mail, CheckCircle2, User, Phone, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TeamManagementView = () => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState('admin');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || !fullName || !phoneNumber) return;

        try {
            setStatus('loading');
            const res: any = await AdminService.inviteAdmin({
                email: inviteEmail,
                phoneNumber,
                fullName,
                role
            });

            setStatus('success');
            setSuccessMessage(res.message || 'Invitation sent successfully!');
            setInviteEmail('');
            setFullName('');
            setPhoneNumber('');

            setTimeout(() => setStatus('idle'), 5000);
        } catch (err: any) {
            console.error('[Invitation Error]', err);
            setStatus('error');
            // Interceptor returns error.response.data directly
            const msg = err.error || err.message || (typeof err === 'string' ? err : 'Failed to send invitation');
            setErrorMessage(msg);
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <div className="animate-fade-in">
            <AdminPageHeader
                title="Team Management"
                subtitle="Invite and manage administrative access."
            />

            <div style={{ maxWidth: '600px' }}>
                <div className="admin-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserPlus size={24} color="#3B82F6" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Invite New Member</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Send an invitation link via email.</p>
                        </div>
                    </div>

                    <form onSubmit={handleInvite}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Enter full name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="tel"
                                        placeholder="+251..."
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    style={{ width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>Role</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div
                                    onClick={() => setRole('admin')}
                                    style={{
                                        padding: '16px', borderRadius: '12px', border: `2px solid ${role === 'admin' ? 'var(--primary)' : 'var(--border)'}`,
                                        cursor: 'pointer', background: role === 'admin' ? 'var(--bg-subtle)' : 'transparent',
                                        display: 'flex', flexDirection: 'column', gap: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Shield size={16} color={role === 'admin' ? 'var(--primary)' : 'var(--text-muted)'} />
                                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Super Admin</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full sovereign control</span>
                                </div>
                                <div
                                    onClick={() => setRole('moderator')}
                                    style={{
                                        padding: '16px', borderRadius: '12px', border: `2px solid ${role === 'moderator' ? 'var(--primary)' : 'var(--border)'}`,
                                        cursor: 'pointer', background: role === 'moderator' ? 'var(--bg-subtle)' : 'transparent',
                                        display: 'flex', flexDirection: 'column', gap: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Shield size={16} color={role === 'moderator' ? 'var(--primary)' : 'var(--text-muted)'} />
                                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Moderator</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ops & Audit only</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--bg-active)',
                                color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                            }}
                        >
                            {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                            {status === 'loading' ? 'Sending Invitation...' : 'Send Real Invitation'}
                        </button>
                    </form>

                    <AnimatePresence>
                        {status === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', gap: '12px' }}
                            >
                                <CheckCircle2 size={20} />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{successMessage}</span>
                            </motion.div>
                        )}
                        {status === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '12px' }}
                            >
                                <AlertCircle size={20} />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{errorMessage}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
