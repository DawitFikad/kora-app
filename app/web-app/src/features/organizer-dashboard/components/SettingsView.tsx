import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Trash2, CreditCard, Bell, Shield, DollarSign, Users, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
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

    // Profile Management
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [uploading, setUploading] = useState(false);

    // Phone Change
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [changePhoneStep, setChangePhoneStep] = useState(1); // 1 = Request, 2 = Verify
    const [newPhoneNumber, setNewPhoneNumber] = useState('');
    const [phoneOtp, setPhoneOtp] = useState('');

    useEffect(() => {
        fetchAllData();
    }, [activeTab]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Always fetch general settings
            const settingsRes = await OrganizerService.getSettings();
            // API interceptor unwraps response.data, check for success wrapper
            if (settingsRes && (settingsRes as any).success) {
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
                payoutDetailsAm: profile?.payoutDetailsAm,
                description: profile?.description,
                adminNote: profile?.adminNote
            });
            toast.success("Settings saved successfully!");
            // Handle response - check if it has success wrapper
            if ((result as any).success) {
                setProfile((result as any).data);
            } else {
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

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error("Invalid file type. Please upload JPG, PNG, or WebP image.");
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large. Maximum size is 5MB.");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('logo', file);

            const result = await OrganizerService.uploadLogo(formData);
            const logoUrl = (result as any).logoUrl;

            setProfile({ ...profile, logoUrl });
            toast.success("Profile picture uploaded successfully!");
        } catch (error: any) {
            console.error("Logo upload error:", error);
            toast.error(error?.error || "Failed to upload logo");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveLogo = async () => {
        if (!confirm("Are you sure you want to remove your profile picture?")) return;

        setSaving(true);
        try {
            await OrganizerService.removeLogo();
            setProfile({ ...profile, logoUrl: null });
            toast.success("Profile picture removed!");
        } catch (error: any) {
            console.error("Remove logo error:", error);
            toast.error(error?.error || "Failed to remove logo");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill in all password fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setSaving(true);
        try {
            await OrganizerService.changePassword({ currentPassword, newPassword });
            toast.success("Password changed successfully! Please log in again.");
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            // Optionally redirect to login
        } catch (error: any) {
            console.error("Change password error:", error);
            toast.error(error?.error || "Failed to change password");
        } finally {
            setSaving(false);
        }
    };

    const handleRequestPhoneChange = async () => {
        if (!newPhoneNumber) {
            toast.error("Please enter a new phone number");
            return;
        }

        // Basic validation for Ethiopian numbers or international
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(newPhoneNumber)) {
            toast.error("Please enter a valid phone number (e.g. +251911223344)");
            return;
        }

        setSaving(true);
        try {
            await OrganizerService.requestPhoneChange(newPhoneNumber);
            toast.success("OTP sent to your new number!");
            setChangePhoneStep(2);
        } catch (error: any) {
            console.error("Request phone change error:", error);
            toast.error(error?.error || "Failed to request phone change");
        } finally {
            setSaving(false);
        }
    };

    const handleVerifyPhoneChange = async () => {
        if (!phoneOtp) {
            toast.error("Please enter the verification code");
            return;
        }

        setSaving(true);
        try {
            await OrganizerService.verifyPhoneChange({ newPhoneNumber, otp: phoneOtp });
            toast.success("Phone number updated successfully!");

            // Update local state if profile exists
            if (profile) {
                setProfile({
                    ...profile,
                    contactPhone: newPhoneNumber,
                    // If we had user details in profile structure, update them too
                    user: profile.user ? { ...profile.user, phoneNumber: newPhoneNumber } : undefined
                });
            }

            setShowPhoneModal(false);
            setNewPhoneNumber('');
            setPhoneOtp('');
            setChangePhoneStep(1);
        } catch (error: any) {
            console.error("Verify phone change error:", error);
            toast.error(error?.error || "Failed to verify phone change");
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
                                        e.currentTarget.style.background = 'var(--bg-hover)';
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

                            {/* Profile Status Card */}
                            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            background: profile?.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : profile?.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                            color: profile?.status === 'APPROVED' ? '#10B981' : profile?.status === 'REJECTED' ? '#EF4444' : '#FBBF24',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            {profile?.status === 'APPROVED' ? <CheckCircle2 size={16} /> : profile?.status === 'REJECTED' ? <AlertCircle size={16} /> : <Loader2 size={16} />}
                                            {profile?.status || 'PENDING'}
                                        </div>
                                        {profile?.status === 'APPROVED' && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Authorized Organizer</span>}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{profile?.completeness || 0}%</span>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Profile Completion</p>
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${profile?.completeness || 0}%` }}
                                        style={{ height: '100%', background: '#1D90F5', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>

                            {/* Profile Picture Section */}
                            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', alignItems: 'center' }}>
                                <div style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'linear-gradient(45deg, #1D90F5, #D946EF', padding: '4px', position: 'relative' }}>
                                    {uploading && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                            <Loader2 className="animate-spin" size={32} color="white" />
                                        </div>
                                    )}
                                    <img
                                        src={profile?.logoUrl ? `http://localhost:4000${profile.logoUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.organizationName || 'Organization')}&background=11141B&color=fff&size=128`}
                                        style={{ width: '100%', height: '100%', borderRadius: '20px', objectFit: 'cover' }}
                                        alt="Organization Logo"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                                        <button
                                            onClick={() => document.getElementById('logo-upload')?.click()}
                                            disabled={uploading}
                                            className="btn-blue"
                                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '10px 20px', fontSize: '0.85rem' }}
                                        >
                                            {profile?.logoUrl ? 'Change Logo' : 'Upload Logo'}
                                        </button>
                                        {profile?.logoUrl && (
                                            <button
                                                onClick={handleRemoveLogo}
                                                disabled={saving}
                                                style={{ padding: '10px 20px', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#EF4444', cursor: 'pointer' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>At least 512x512px. JPG, PNG, or WebP. Max 5MB.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Organization Name</label>
                                    <input
                                        type="text"
                                        value={profile?.organizationName || ''}
                                        onChange={e => setProfile({ ...profile, organizationName: e.target.value })}
                                        disabled={profile?.status === 'APPROVED'}
                                        style={{ width: '100%', background: profile?.status === 'APPROVED' ? 'rgba(255,255,255,0.02)' : 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: profile?.status === 'APPROVED' ? 'var(--text-muted)' : 'var(--text-main)', outline: 'none', cursor: profile?.status === 'APPROVED' ? 'not-allowed' : 'text' }}
                                    />
                                    {profile?.status === 'APPROVED' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            <Lock size={12} />
                                            <span>Locked after verification</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>Contact Email</label>
                                    <input
                                        type="email"
                                        value={profile?.contactEmail || ''}
                                        onChange={e => setProfile({ ...profile, contactEmail: e.target.value })}
                                        style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'var(--text-main)', outline: 'none' }}
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
                                        style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'var(--text-main)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>City</label>
                                    <input
                                        type="text"
                                        value={profile?.city || ''}
                                        onChange={e => setProfile({ ...profile, city: e.target.value })}
                                        style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'var(--text-main)', outline: 'none' }}
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
                                    disabled={profile?.status === 'APPROVED'}
                                    style={{ width: '100%', background: profile?.status === 'APPROVED' ? 'rgba(255,255,255,0.02)' : 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: profile?.status === 'APPROVED' ? 'var(--text-muted)' : 'var(--text-main)', outline: 'none', cursor: profile?.status === 'APPROVED' ? 'not-allowed' : 'text' }}
                                />
                                {profile?.status === 'APPROVED' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <Lock size={12} />
                                        <span>Locked after verification</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>About the Organizer</label>
                                <textarea
                                    rows={4}
                                    value={profile?.description || ''}
                                    onChange={e => setProfile({ ...profile, description: e.target.value })}
                                    style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'var(--text-main)', resize: 'none', outline: 'none' }}
                                />
                            </div>

                            {/* Security Section */}
                            <div style={{ marginBottom: '32px', padding: '24px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '24px' }}>Security</h4>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '4px' }}>Password</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Change your account password</p>
                                    </div>
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="btn-ghost"
                                        style={{ padding: '10px 20px' }}
                                    >
                                        Change Password
                                    </button>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '4px' }}>Phone Number</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            Current: <span style={{ color: 'var(--text-main)' }}>{profile?.user?.phoneNumber || 'N/A'}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setChangePhoneStep(1);
                                            setNewPhoneNumber('');
                                            setPhoneOtp('');
                                            setShowPhoneModal(true);
                                        }}
                                        className="btn-ghost"
                                        style={{ padding: '10px 20px' }}
                                    >
                                        Change Phone Number
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={handleSaveGeneral} disabled={saving} className="btn-blue" style={{ padding: '14px 28px' }}>
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
                                </button>
                            </div>

                            {/* Password Change Modal */}
                            {showPasswordModal && (
                                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowPasswordModal(false)}>
                                    <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Change Password</h3>

                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Current Password</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                                style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}
                                            />
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>At least 8 characters with 1 uppercase, 1 lowercase, and 1 number</p>
                                        </div>

                                        <div style={{ marginBottom: '24px' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} className="btn-ghost">
                                                Cancel
                                            </button>
                                            <button onClick={handleChangePassword} disabled={saving} className="btn-blue">
                                                {saving ? <Loader2 className="animate-spin" size={16} /> : 'Change Password'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Phone Change Modal */}
                            {showPhoneModal && (
                                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowPhoneModal(false)}>
                                    <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Change Phone Number</h3>

                                        {changePhoneStep === 1 ? (
                                            <>
                                                <div style={{ marginBottom: '20px' }}>
                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                                        Enter your new phone number. We will send a verification code to this number.
                                                    </p>
                                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>New Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        placeholder="+251..."
                                                        value={newPhoneNumber}
                                                        onChange={e => setNewPhoneNumber(e.target.value)}
                                                        style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}
                                                    />
                                                </div>

                                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => setShowPhoneModal(false)} className="btn-ghost">
                                                        Cancel
                                                    </button>
                                                    <button onClick={handleRequestPhoneChange} disabled={saving} className="btn-blue">
                                                        {saving ? <Loader2 className="animate-spin" size={16} /> : 'Send Code'}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ marginBottom: '20px' }}>
                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                                        Enter the verification code sent to <strong>{newPhoneNumber}</strong>.
                                                    </p>
                                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Verification Code</label>
                                                    <input
                                                        type="text"
                                                        placeholder="123456"
                                                        value={phoneOtp}
                                                        onChange={e => setPhoneOtp(e.target.value)}
                                                        style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none', letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem' }}
                                                        maxLength={6}
                                                    />
                                                </div>

                                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => setChangePhoneStep(1)} className="btn-ghost">
                                                        Back
                                                    </button>
                                                    <button onClick={handleVerifyPhoneChange} disabled={saving} className="btn-blue">
                                                        {saving ? <Loader2 className="animate-spin" size={16} /> : 'Verify & Update'}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
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
                                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Add New Payment Method</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Provider</label>
                                            <select
                                                value={newPaymentMethod.provider}
                                                onChange={e => setNewPaymentMethod({ ...newPaymentMethod, provider: e.target.value })}
                                                style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}
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
                                                style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}
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
                                            style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}
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
                                                background: 'var(--bg-subtle)',
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
                                                background: 'var(--bg-subtle)',
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

                            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>Two-Factor Authentication</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Add an extra layer of security to your account</p>
                                    </div>
                                    <button
                                        onClick={() => setSecuritySettings({ ...securitySettings, twoFactorEnabled: !securitySettings.twoFactorEnabled })}
                                        style={{
                                            padding: '8px 16px',
                                            background: securitySettings.twoFactorEnabled ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-hover)',
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
                                                background: 'var(--bg-subtle)',
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
