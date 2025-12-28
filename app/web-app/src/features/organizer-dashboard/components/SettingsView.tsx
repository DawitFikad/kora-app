import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Trash2, CreditCard, Bell, Shield, DollarSign, Users } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useToast } from '../../../core/components/Toast';

type TabType = 'General' | 'Payout Methods' | 'Team Access' | 'Notifications' | 'Security' | 'Billing';

export const SettingsView = () => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('General');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // General Settings
    const [profile, setProfile] = useState<any>(null);
    
    // Payout Methods
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [newPaymentMethod, setNewPaymentMethod] = useState({ provider: 'BANK_TRANSFER', accountNumber: '', accountName: '' });
    
    // Notifications
    const [notifications, setNotifications] = useState<any[]>([]);
    
    // Security
    const [securitySettings, setSecuritySettings] = useState({ twoFactorEnabled: false });
    
    // Billing
    const [payoutHistory, setPayoutHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchAllData();
    }, [activeTab]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Always fetch general settings
            const settingsRes = await OrganizerService.getSettings();
            if (settingsRes && (settingsRes as any).success) {
                setProfile((settingsRes as any).data);
            } else if (settingsRes && (settingsRes as any).data) {
                setProfile((settingsRes as any).data);
            } else {
                setProfile(settingsRes);
            }

            // Fetch tab-specific data
            if (activeTab === 'Payout Methods') {
                try {
                    const methods = await OrganizerService.getPaymentMethods();
                    setPaymentMethods(Array.isArray(methods) ? methods : []);
                } catch (error) {
                    console.error('Failed to fetch payment methods:', error);
                    setPaymentMethods([]);
                }
            } else if (activeTab === 'Notifications') {
                try {
                    const notifRes = await OrganizerService.getNotifications();
                    setNotifications(notifRes.data || []);
                } catch (error) {
                    console.error('Failed to fetch notifications:', error);
                    setNotifications([]);
                }
            } else if (activeTab === 'Billing') {
                try {
                    const payouts = await OrganizerService.getPayoutHistory();
                    setPayoutHistory(Array.isArray(payouts) ? payouts : []);
                } catch (error) {
                    console.error('Failed to fetch payout history:', error);
                    setPayoutHistory([]);
                }
            }
        } catch (error: any) {
            console.error("Failed to fetch settings", error);
            toast.error(error?.error || "Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGeneral = async () => {
        setSaving(true);
        try {
            const result = await OrganizerService.updateSettings({
                organizationName: profile?.organizationName,
                contactEmail: profile?.contactEmail,
                contactPhone: profile?.contactPhone,
                city: profile?.city,
                payoutDetails: profile?.payoutDetails,
                adminNote: profile?.adminNote
            });
            if ((result as any).success) {
                toast.success("Settings saved successfully!");
                setProfile((result as any).data);
            } else if ((result as any).data) {
                toast.success("Settings saved successfully!");
                setProfile((result as any).data);
            } else {
                toast.success("Settings saved successfully!");
                setProfile(result);
            }
        } catch (error: any) {
            console.error("Failed to save settings", error);
            toast.error(error?.error || "Error saving settings.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddPaymentMethod = async () => {
        if (!newPaymentMethod.accountNumber || !newPaymentMethod.accountName) {
            toast.error("Please fill in all fields");
            return;
        }
        setSaving(true);
        try {
            await OrganizerService.addPaymentMethod(newPaymentMethod);
            toast.success("Payment method added successfully!");
            setShowAddPayment(false);
            setNewPaymentMethod({ provider: 'BANK_TRANSFER', accountNumber: '', accountName: '' });
            fetchAllData();
        } catch (error: any) {
            console.error("Failed to add payment method", error);
            toast.error(error?.error || "Failed to add payment method");
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePaymentMethod = async (id: number) => {
        if (!confirm("Are you sure you want to delete this payment method?")) return;
        setSaving(true);
        try {
            await OrganizerService.deletePaymentMethod(id);
            toast.success("Payment method deleted!");
            fetchAllData();
        } catch (error: any) {
            console.error("Failed to delete payment method", error);
            toast.error(error?.error || "Failed to delete payment method");
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefaultPayment = async (id: number) => {
        setSaving(true);
        try {
            await OrganizerService.setDefaultPaymentMethod(id);
            toast.success("Default payment method updated!");
            fetchAllData();
        } catch (error: any) {
            console.error("Failed to set default payment", error);
            toast.error(error?.error || "Failed to update default payment method");
        } finally {
            setSaving(false);
        }
    };

    const tabs: { id: TabType; icon: any; label: string }[] = [
        { id: 'General', icon: null, label: 'General' },
        { id: 'Payout Methods', icon: CreditCard, label: 'Payout Methods' },
        { id: 'Team Access', icon: Users, label: 'Team Access' },
        { id: 'Notifications', icon: Bell, label: 'Notifications' },
        { id: 'Security', icon: Shield, label: 'Security' },
        { id: 'Billing', icon: DollarSign, label: 'Billing' }
    ];

    if (loading && !profile) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Settings" subtitle="Manage your organization settings and preferences." />

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px' }}>
                {/* Sidebar Tabs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    background: isActive ? 'rgba(29, 144, 245, 0.15)' : 'transparent',
                                    color: isActive ? '#1D90F5' : 'var(--text-muted)',
                                    fontWeight: isActive ? 700 : 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s',
                                    border: isActive ? '1px solid rgba(29, 144, 245, 0.3)' : '1px solid transparent'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                {Icon && <Icon size={18} />}
                                {tab.label}
                            </div>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="stat-card" style={{ padding: '32px' }}>
                    {activeTab === 'General' && (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Public Profile</h3>

                            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', alignItems: 'center' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '24px', background: 'linear-gradient(45deg, #1D90F5, #D946EF)', padding: '4px' }}>
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.organizationName || 'Organization')}&background=11141B&color=fff&size=128`}
                                        style={{ width: '100%', height: '100%', borderRadius: '20px' }}
                                        alt="Organization"
                                    />
                                </div>
                                <div>
                                    <button className="btn-blue" style={{ background: 'white', color: 'black', padding: '10px 20px', fontSize: '0.85rem' }}>Change Logo</button>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>At least 512x512px. JPG or PNG only.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Organization Name</label>
                                    <input
                                        type="text"
                                        value={profile?.organizationName || ''}
                                        onChange={e => setProfile({ ...profile, organizationName: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Contact Email</label>
                                    <input
                                        type="email"
                                        value={profile?.contactEmail || ''}
                                        onChange={e => setProfile({ ...profile, contactEmail: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={profile?.contactPhone || ''}
                                        onChange={e => setProfile({ ...profile, contactPhone: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>City</label>
                                    <input
                                        type="text"
                                        value={profile?.city || ''}
                                        onChange={e => setProfile({ ...profile, city: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Payout Details (Bank/Mobile Money)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. CBE - 1000123456789"
                                    value={profile?.payoutDetails || ''}
                                    onChange={e => setProfile({ ...profile, payoutDetails: e.target.value })}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>About the Organizer</label>
                                <textarea
                                    rows={4}
                                    value={profile?.adminNote || ''}
                                    onChange={e => setProfile({ ...profile, adminNote: e.target.value })}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', resize: 'none', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={handleSaveGeneral} disabled={saving} className="btn-blue" style={{ padding: '14px 28px' }}>
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Payout Methods' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Payout Methods</h3>
                                <button
                                    onClick={() => setShowAddPayment(!showAddPayment)}
                                    className="btn-blue"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                                >
                                    <Plus size={16} /> Add Method
                                </button>
                            </div>

                            {showAddPayment && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Add New Payment Method</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Provider</label>
                                            <select
                                                value={newPaymentMethod.provider}
                                                onChange={e => setNewPaymentMethod({ ...newPaymentMethod, provider: e.target.value })}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white', outline: 'none' }}
                                            >
                                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                                <option value="MOBILE_MONEY">Mobile Money</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Account Number</label>
                                            <input
                                                type="text"
                                                value={newPaymentMethod.accountNumber}
                                                onChange={e => setNewPaymentMethod({ ...newPaymentMethod, accountNumber: e.target.value })}
                                                placeholder="e.g. 1000123456789"
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white', outline: 'none' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Account Name</label>
                                        <input
                                            type="text"
                                            value={newPaymentMethod.accountName}
                                            onChange={e => setNewPaymentMethod({ ...newPaymentMethod, accountName: e.target.value })}
                                            placeholder="Account holder name"
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowAddPayment(false)} className="btn-ghost">Cancel</button>
                                        <button onClick={handleAddPaymentMethod} disabled={saving} className="btn-blue">
                                            {saving ? <Loader2 className="animate-spin" size={16} /> : 'Add Method'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                    <Loader2 className="animate-spin" size={32} />
                                </div>
                            ) : paymentMethods.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <CreditCard size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                    <p>No payment methods added yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {paymentMethods.map((method: any) => (
                                        <div
                                            key={method.id}
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                                padding: '20px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                    <CreditCard size={20} color="var(--text-muted)" />
                                                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{method.provider.replace('_', ' ')}</span>
                                                    {method.isDefault && (
                                                        <span style={{ background: 'rgba(29, 144, 245, 0.2)', color: '#1D90F5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Default</span>
                                                    )}
                                                </div>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0' }}>{method.accountName}</p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>****{method.accountNumber.slice(-4)}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {!method.isDefault && (
                                                    <button
                                                        onClick={() => handleSetDefaultPayment(method.id)}
                                                        disabled={saving}
                                                        style={{ padding: '8px 16px', background: 'rgba(29, 144, 245, 0.1)', border: '1px solid rgba(29, 144, 245, 0.3)', borderRadius: '8px', color: '#1D90F5', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    >
                                                        Set Default
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeletePaymentMethod(method.id)}
                                                    disabled={saving}
                                                    style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#EF4444', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Team Access' && (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Team Access</h3>
                            <div style={{ background: 'rgba(29, 144, 245, 0.1)', border: '1px solid rgba(29, 144, 245, 0.3)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                                <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Team management features coming soon</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Invite team members, manage roles, and control access to your events.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Notifications' && (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Notification History</h3>
                            {loading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                    <Loader2 className="animate-spin" size={32} />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                    <p>No notifications yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {notifications.map((notif: any) => (
                                        <div
                                            key={notif.id}
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                                padding: '20px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                                <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{notif.title || 'Notification'}</h4>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0' }}>{notif.content}</p>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                <span style={{ background: notif.status === 'SENT' || notif.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: notif.status === 'SENT' || notif.status === 'DELIVERED' ? '#10B981' : '#EF4444', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    {notif.status}
                                                </span>
                                                <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                                                    {notif.channel}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Security' && (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Security Settings</h3>
                            
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>Two-Factor Authentication</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Add an extra layer of security to your account</p>
                                    </div>
                                    <button
                                        onClick={() => setSecuritySettings({ ...securitySettings, twoFactorEnabled: !securitySettings.twoFactorEnabled })}
                                        style={{
                                            padding: '8px 16px',
                                            background: securitySettings.twoFactorEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                            border: securitySettings.twoFactorEnabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)',
                                            borderRadius: '8px',
                                            color: securitySettings.twoFactorEnabled ? '#10B981' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 700
                                        }}
                                    >
                                        {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(29, 144, 245, 0.1)', border: '1px solid rgba(29, 144, 245, 0.3)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                                <Shield size={48} style={{ margin: '0 auto 16px', opacity: '0.5' }} />
                                <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Additional security features coming soon</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Password change, session management, and more security options will be available here.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Billing' && (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Payout History</h3>
                            {loading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                    <Loader2 className="animate-spin" size={32} />
                                </div>
                            ) : payoutHistory.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <DollarSign size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                    <p>No payout history yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {payoutHistory.map((payout: any) => (
                                        <div
                                            key={payout.id}
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                                padding: '20px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                                <div>
                                                    <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
                                                        {payout.amount ? `ETB ${payout.amount.toLocaleString()}` : 'Payout'}
                                                    </h4>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        {payout.method || 'N/A'} • {new Date(payout.createdAt || Date.now()).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    background: payout.status === 'PAID_OUT' || payout.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.2)' : payout.status === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: payout.status === 'PAID_OUT' || payout.status === 'SUCCESS' ? '#10B981' : payout.status === 'PENDING' ? '#F59E0B' : '#EF4444',
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700
                                                }}>
                                                    {payout.status || 'PENDING'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
