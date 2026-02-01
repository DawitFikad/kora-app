import { useState, useEffect } from 'react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';
import {
    UserPlus,
    Shield,
    Mail,
    CheckCircle2,
    User,
    Phone,
    Loader2,
    AlertCircle,
    RefreshCcw,
    Trash2,
    Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TeamManagementView = () => {
    // --- Form State ---
    const [inviteEmail, setInviteEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState('admin');
    const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // --- Team Data State ---
    const [team, setTeam] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingTeam, setIsLoadingTeam] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // --- Modal State ---
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info'
    });

    const fetchData = async () => {
        setIsLoadingTeam(true);
        setIsLoadingHistory(true);
        try {
            const [teamRes, historyRes]: any = await Promise.all([
                AdminService.getTeamMembers(),
                AdminService.getInvitationHistory()
            ]);
            setTeam(teamRes.users || []);
            setHistory(historyRes.notifications || []);
        } catch (err) {
            console.error('Failed to fetch team data', err);
        } finally {
            setIsLoadingTeam(false);
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInvite = async (e?: React.FormEvent, data?: any) => {
        if (e) e.preventDefault();

        const payload = data || {
            email: inviteEmail,
            phoneNumber,
            fullName,
            role
        };

        if (!payload.email || !payload.phoneNumber) return;

        try {
            setFormStatus('loading');
            const res: any = await AdminService.inviteAdmin(payload);

            setFormStatus('success');
            setSuccessMessage(res.message || 'Invitation sent successfully!');

            if (!data) {
                setInviteEmail('');
                setFullName('');
                setPhoneNumber('');
            }

            fetchData(); // Refresh everything
            setTimeout(() => setFormStatus('idle'), 5000);
        } catch (err: any) {
            console.error('[Invitation Error]', err);
            setFormStatus('error');
            const msg = err.error || err.message || 'Failed to send invitation';
            setErrorMessage(msg);
            setTimeout(() => setFormStatus('idle'), 5000);
        }
    };

    const handleDelete = async (userId: number) => {
        try {
            await AdminService.removeAdmin(userId);
            setSuccessMessage("Administrator removed successfully");
            setFormStatus('success');
            fetchData();
            setTimeout(() => setFormStatus('idle'), 3000);
        } catch (err: any) {
            console.error('[Delete Error]', err);
            setErrorMessage(err.error || "Failed to remove administrator");
            setFormStatus('error');
            setTimeout(() => setFormStatus('idle'), 5000);
        }
    };

    const getRoleBadgeColor = (r: string) => {
        switch (r.toLowerCase()) {
            case 'admin': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', label: 'Super Admin' };
            case 'financial': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', label: 'Financial' };
            case 'events': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', label: 'Events' };
            default: return { bg: 'rgba(255, 255, 255, 0.05)', text: 'var(--text-muted)', label: r };
        }
    };

    return (
        <div className="team-management-view" style={{ paddingBottom: '60px' }}>
            <AdminPageHeader
                title="Team Management"
                subtitle="Invite and manage administrative access."
            />

            {/* Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px', alignItems: 'start', marginBottom: '48px' }}>

                {/* 🔵 Left Side: Invitation Form */}
                <div className="admin-card" style={{ padding: '32px', position: 'sticky', top: '100px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(29, 144, 245, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserPlus size={24} color="var(--primary-blue)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Invite New Admin</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Grant access to the team.</p>
                        </div>
                    </div>

                    <form onSubmit={handleInvite}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Amanuel Alex"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Phone</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="tel"
                                        placeholder="+251..."
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Email</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="email"
                                        placeholder="admin@ettickets.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Role Assignment</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                                {[
                                    { id: 'admin', label: 'Super Admin', desc: 'Full system sovereignty control', icon: Shield },
                                    { id: 'financial', label: 'Financial Officer', desc: 'Ledgers, Payouts & Refunds', icon: AlertCircle },
                                    { id: 'events', label: 'Events Manager', desc: 'Approvals & Content only', icon: Calendar }
                                ].map(r => (
                                    <div
                                        key={r.id}
                                        onClick={() => setRole(r.id)}
                                        style={{
                                            padding: '12px 16px', borderRadius: '12px', border: `1px solid ${role === r.id ? 'var(--primary-blue)' : 'var(--border)'}`,
                                            cursor: 'pointer', background: role === r.id ? 'rgba(29, 144, 245, 0.05)' : 'transparent',
                                            display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ color: role === r.id ? 'var(--primary-blue)' : 'var(--text-muted)' }}>
                                            <r.icon size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 800, fontSize: '0.85rem', color: role === r.id ? 'white' : 'var(--text-main)' }}>{r.label}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.desc}</p>
                                        </div>
                                        {role === r.id && <motion.div layoutId="role-check"><CheckCircle2 size={16} color="var(--primary-blue)" /></motion.div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={formStatus === 'loading'}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: 'var(--primary-blue)',
                                color: 'white', fontWeight: 800, fontSize: '1rem', cursor: formStatus === 'loading' ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                boxShadow: '0 10px 25px -5px rgba(29, 144, 245, 0.4)'
                            }}
                        >
                            {formStatus === 'loading' ? <Loader2 size={20} className="animate-spin" /> : <Mail size={20} />}
                            {formStatus === 'loading' ? 'Sending Link...' : 'Send Portal Invitation'}
                        </button>
                    </form>

                    <AnimatePresence>
                        {formStatus === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                            >
                                <CheckCircle2 size={20} />
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{successMessage}</span>
                            </motion.div>
                        )}
                        {formStatus === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                            >
                                <AlertCircle size={20} />
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{errorMessage}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 🟢 Right Side: Team Members List */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Active Team Members</h3>
                        <button
                            onClick={fetchData}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <RefreshCcw size={14} className={isLoadingTeam ? 'animate-spin' : ''} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Refresh</span>
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {isLoadingTeam ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="admin-card animate-pulse" style={{ height: '100px', background: 'var(--bg-subtle)' }} />
                            ))
                        ) : team.length === 0 ? (
                            <div className="admin-card" style={{ padding: '48px', textAlign: 'center', opacity: 0.6 }}>
                                <Shield size={40} style={{ margin: '0 auto 16px', color: 'var(--border)' }} />
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No other admin members found.</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {team.map((member, index) => {
                                    const roleStyle = getRoleBadgeColor(member.role);
                                    return (
                                        <motion.div
                                            key={member.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="admin-card"
                                            style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s', position: 'relative' }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                        >
                                            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                                {member.profile?.fullName?.[0] || member.role[0]}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{member.profile?.fullName || 'Untitled Admin'}</h4>
                                                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: roleStyle.bg, color: roleStyle.text, fontWeight: 800, textTransform: 'uppercase' }}>
                                                        {roleStyle.label}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                                        <Mail size={12} />
                                                        <span>{member.email}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                                                        <Phone size={12} />
                                                        <span>{member.phoneNumber}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => {
                                                        setModalConfig({
                                                            isOpen: true,
                                                            title: 'Resend Invitation',
                                                            message: `Are you sure you want to resend the administrative invitation to ${member.email}?`,
                                                            type: 'info',
                                                            onConfirm: () => handleInvite(undefined, {
                                                                email: member.email,
                                                                phoneNumber: member.phoneNumber,
                                                                fullName: member.profile?.fullName,
                                                                role: member.role.toLowerCase()
                                                            })
                                                        });
                                                    }}
                                                    title="Resend Invite"
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-blue)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                                >
                                                    <RefreshCcw size={14} color="var(--primary-blue)" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setModalConfig({
                                                            isOpen: true,
                                                            title: 'Remove Administrator',
                                                            message: `This will permanently revoke all administrative access for ${member.profile?.fullName || member.email}. This action cannot be undone.`,
                                                            type: 'danger',
                                                            onConfirm: () => handleDelete(member.id)
                                                        });
                                                    }}
                                                    title="Remove Admin"
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                                                >
                                                    <Trash2 size={14} color="#EF4444" />
                                                </button>
                                            </div>

                                            <div style={{ position: 'absolute', right: '12px', top: '12px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: member.status === 'ACTIVE' ? '#10B981' : '#F59E0B' }} />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>

            {/* 📜 Invitation History Table (New Section) */}
            <div className="admin-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Invitation Distribution History</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chronological log of administrative portal invitations.</p>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '0 16px 8px' }}>Recipient</th>
                                <th style={{ padding: '0 16px 8px' }}>Role</th>
                                <th style={{ padding: '0 16px 8px' }}>Timestamp</th>
                                <th style={{ padding: '0 16px 8px' }}>Delivery Status</th>
                                <th style={{ padding: '0 16px 8px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingHistory ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i}><td colSpan={5} style={{ height: '48px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }} className="animate-pulse" /></tr>
                                ))
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
                                        No invitation logs found in system records.
                                    </td>
                                </tr>
                            ) : (
                                history.map((log) => (
                                    <tr key={log.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Mail size={14} color="var(--primary-blue)" />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{log.recipient}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Via {log.channel}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{log.metadata?.role || 'N/A'}</span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '0.8rem' }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.status === 'SENT' ? '#10B981' : '#EF4444' }} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: log.status === 'SENT' ? '#10B981' : '#EF4444' }}>{log.status === 'SENT' ? 'Success' : 'Failed'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleInvite(undefined, {
                                                    email: log.recipient,
                                                    phoneNumber: team.find(m => m.id === log.metadata?.invitedUserId)?.phoneNumber || '',
                                                    fullName: team.find(m => m.id === log.metadata?.invitedUserId)?.profile?.fullName || log.recipient.split('@')[0],
                                                    role: log.metadata?.role || 'admin'
                                                })}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', padding: '4px 8px' }}
                                            >
                                                Resend
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🛡️ Confirmation Modal */}
            <AnimatePresence>
                {modalConfig.isOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{ width: '400px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: modalConfig.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(29, 144, 245, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                {modalConfig.type === 'danger' ? <Trash2 color="#EF4444" size={24} /> : <RefreshCcw color="var(--primary-blue)" size={24} />}
                            </div>

                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>{modalConfig.title}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '32px' }}>{modalConfig.message}</p>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        modalConfig.onConfirm();
                                        setModalConfig({ ...modalConfig, isOpen: false });
                                    }}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: modalConfig.type === 'danger' ? '#EF4444' : 'var(--primary-blue)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
