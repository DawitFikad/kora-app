import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';
import {
    Settings,
    Globe,
    Lock,
    Percent,
    FileText,
    Layout,
    Bell,
    CreditCard,
    ShieldCheck,
    Save,
    RotateCcw,
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    User
} from 'lucide-react';

type SettingsCategory = 'GENERAL' | 'LANGUAGE' | 'AUTH' | 'COMMISSION' | 'EVENT' | 'HOMEPAGE' | 'NOTIFICATION' | 'PAYMENT' | 'LOGS';

interface ConfigItem {
    id?: number;
    key: string;
    value: string;
    description: string | null;
}

interface AuditLog {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    metadata: any;
}

export const AdminSettingsView = () => {
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>('GENERAL');
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const categories: { id: SettingsCategory; label: string; icon: any; color: string }[] = [
        { id: 'GENERAL', label: t('admin.settings.categories.general'), icon: Settings, color: '#3B82F6' },
        { id: 'LANGUAGE', label: t('admin.settings.categories.language'), icon: Globe, color: '#10B981' },
        { id: 'AUTH', label: t('admin.settings.categories.auth'), icon: Lock, color: '#F59E0B' },
        { id: 'COMMISSION', label: t('admin.settings.categories.commission'), icon: Percent, color: '#6366F1' },
        { id: 'EVENT', label: t('admin.settings.categories.event'), icon: FileText, color: '#A78BFA' },
        { id: 'HOMEPAGE', label: t('admin.settings.categories.homepage'), icon: Layout, color: '#EC4899' },
        { id: 'NOTIFICATION', label: t('admin.settings.categories.notification'), icon: Bell, color: '#F97316' },
        { id: 'PAYMENT', label: t('admin.settings.categories.payment'), icon: CreditCard, color: '#06B6D4' },
        { id: 'LOGS', label: t('admin.settings.categories.logs'), icon: ShieldCheck, color: '#64748B' },
    ];

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [configRes, logsRes]: any = await Promise.all([
                AdminService.getSystemConfigs(),
                AdminService.getAuditLogs()
            ]);
            setConfigs(configRes.data || configRes);
            setAuditLogs(logsRes.data || logsRes);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateConfig = async (key: string, value: string, description?: string) => {
        try {
            await AdminService.updateSystemConfig({ key, value, description });
            await fetchData();
            showMessage('success', t('admin.settings.update_success'));
        } catch (err) {
            showMessage('error', t('admin.settings.update_failed'));
        } finally {
            // setIsLoading(false); // Removed duplicate or unused finally block logic
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const getConfigValue = (key: string, defaultValue: string = '') => {
        return configs.find(c => c.key === key)?.value || defaultValue;
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AdminPageHeader
                title={t('admin.settings.title')}
                subtitle={t('admin.settings.subtitle')}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', minHeight: '600px' }}>
                {/* 🧭 Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 18px',
                                borderRadius: '12px',
                                border: 'none',
                                background: activeCategory === cat.id ? 'var(--bg-active)' : 'transparent',
                                color: activeCategory === cat.id ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'left',
                                fontWeight: activeCategory === cat.id ? 800 : 600,
                                fontSize: '0.9rem'
                            }}
                        >
                            <cat.icon size={18} color={activeCategory === cat.id ? 'white' : cat.color} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* 🛠️ Content Area */}
                <div style={{ position: 'relative' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="admin-card"
                            style={{ padding: '32px', minHeight: '100%' }}
                        >
                            {isLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                        <Activity size={32} color="var(--bg-active)" />
                                    </motion.div>
                                </div>
                            ) : (
                                renderCategoryContent(activeCategory, { getConfigValue, handleUpdateConfig, auditLogs })
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Toast */}
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                style={{
                                    position: 'fixed',
                                    bottom: '32px',
                                    right: '32px',
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    background: message.type === 'success' ? '#10B981' : '#EF4444',
                                    color: 'white',
                                    fontWeight: 800,
                                    zIndex: 1000,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

const renderCategoryContent = (category: SettingsCategory, props: any) => {
    switch (category) {
        case 'GENERAL': return <Section title="Platform identity" subtitle="Define the core branding and operational state."><GeneralSettings {...props} /></Section>;
        case 'LANGUAGE': return <Section title="Locales & Internationalization" subtitle="Configure supported languages and regional defaults."><LanguageSettings {...props} /></Section>;
        case 'AUTH': return <Section title="Security & Access" subtitle="Strict rules for administrator and user authentication."><AuthSettings {...props} /></Section>;
        case 'COMMISSION': return <Section title="Fiscal Lever" subtitle="Global defaults for commissions, taxes, and payouts."><CommissionSettings {...props} /></Section>;
        case 'EVENT': return <Section title="Event & Ticketing Rules" subtitle="Core discovery and booking engine parameters."><EventSettings {...props} /></Section>;
        case 'HOMEPAGE': return <Section title="Homepage Intelligence" subtitle="Control content density and discovery algorithms."><HomepageSettings {...props} /></Section>;
        case 'NOTIFICATION': return <Section title="Notification Channels" subtitle="Manage status for Email, SMS, and Push gateways."><NotificationSettings {...props} /></Section>;
        case 'PAYMENT': return <Section title="Payment Infrastructure" subtitle="Configure gateway integrations and transaction rules."><PaymentSettings {...props} /></Section>;
        case 'LOGS': return <Section title="Audit Ledger" subtitle="Immutable history of system-wide administrative changes."><ActivityLogs {...props} /></Section>;
        default: return null;
    }
};

const Section = ({ title, subtitle, children }: any) => (
    <div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>{subtitle}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>{children}</div>
    </div>
);

const GeneralSettings = ({ getConfigValue, handleUpdateConfig }: any) => (
    <>
        <ConfigInput label="PLATFORM NAME" configKey="general.platform_name" description="The name used in emails, SEO, and headers." value={getConfigValue('general.platform_name', 'ET-Ticket')} onSave={handleUpdateConfig} />
        <ConfigInput label="SUPPORT HOTLINE" configKey="general.support_phone" description="Customer service number displayed to users." value={getConfigValue('general.support_phone', '+251911223344')} onSave={handleUpdateConfig} />
        <ConfigInput label="MAINTENANCE MODE" type="toggle" configKey="maintenance_mode" description="Put platform in read-only mode for all users." value={getConfigValue('maintenance_mode', 'false')} onSave={handleUpdateConfig} />
    </>
);

const LanguageSettings = ({ getConfigValue, handleUpdateConfig }: any) => (
    <>
        <ConfigInput label="DEFAULT LANGUAGE" configKey="language.default" description="System-wide fallback language code (e.g., 'en', 'am')." value={getConfigValue('language.default', 'en')} onSave={handleUpdateConfig} />
        <ConfigInput label="SUPPORTED LANGUAGES" configKey="language.supported" description="Comma-separated list of enabled languages." value={getConfigValue('language.supported', 'en,am')} onSave={handleUpdateConfig} />
    </>
);

const AuthSettings = ({ getConfigValue, handleUpdateConfig }: any) => (
    <>
        <ConfigInput label="MANDATORY 2FA" type="toggle" configKey="auth.mandatory_2fa" description="Force two-factor authentication for all Admins." value={getConfigValue('auth.mandatory_2fa', 'true')} onSave={handleUpdateConfig} />
        <ConfigInput label="SESSION TIMEOUT (MIN)" type="number" configKey="auth.session_timeout" description="Auto-logout duration for inactive sessions." value={getConfigValue('auth.session_timeout', '60')} onSave={handleUpdateConfig} />
        <ConfigInput label="MAX LOGIN ATTEMPTS" type="number" configKey="auth.max_attempts" description="Failed attempts before account lock." value={getConfigValue('auth.max_attempts', '5')} onSave={handleUpdateConfig} />
    </>
);

const CommissionSettings = ({ getConfigValue, handleUpdateConfig }: any) => (
    <>
        <ConfigInput label="GLOBAL RATE (%)" type="number" configKey="commission.default_rate" description="Default percentage fee for all ticket sales." value={getConfigValue('commission.default_rate', '10')} onSave={handleUpdateConfig} />
        <ConfigInput label="MINIMUM WITHDRAWAL (ETB)" type="number" configKey="commission.min_payout" description="Threshold for organizer settlement requests." value={getConfigValue('commission.min_payout', '1000')} onSave={handleUpdateConfig} />
        <ConfigInput label="SERVICE FEE (FIXED)" type="number" configKey="commission.fixed_fee" description="Per-ticket flat fee in local currency." value={getConfigValue('commission.fixed_fee', '15')} onSave={handleUpdateConfig} />
    </>
);

const EventSettings = ({ getConfigValue, handleUpdateConfig }: any) => (
    <>
        <ConfigInput label="SEAT LOCK TIMEOUT (MIN)" type="number" configKey="event.seat_lock" description="Time seats stay reserved during checkout." value={getConfigValue('event.seat_lock', '15')} onSave={handleUpdateConfig} />
        <ConfigInput label="SCAN VALIDATION WINDOW (SEC)" type="number" configKey="event.rescan_limit" description="Delay required between duplicate QR scans." value={getConfigValue('event.rescan_limit', '30')} onSave={handleUpdateConfig} />
        <ConfigInput label="MAX TICKETS PER ORDER" type="number" configKey="event.max_per_user" description="Anti-scalping limit for single acquisitions." value={getConfigValue('event.max_per_user', '6')} onSave={handleUpdateConfig} />
    </>
);

const HomepageSettings = ({ getConfigValue, handleUpdateConfig }: any) => (
    <>
        <ConfigInput label="HERO BANNER LIMIT" type="number" configKey="homepage.banner_limit" description="Maximum active hero slides to display." value={getConfigValue('homepage.banner_limit', '5')} onSave={handleUpdateConfig} />
        <ConfigInput label="FEATURED EVENTS COUNT" type="number" configKey="homepage.featured_count" description="Items displayed in the 'Top Picks' row." value={getConfigValue('homepage.featured_count', '8')} onSave={handleUpdateConfig} />
    </>
);

const NotificationSettings = ({ getConfigValue, handleUpdateConfig }: any) => (
    <>
        <ConfigInput label="EMAIL GATEWAY" type="toggle" configKey="notification.email_enabled" description="Global toggle for SMTP/Transactional mail." value={getConfigValue('notification.email_enabled', 'true')} onSave={handleUpdateConfig} />
        <ConfigInput label="SMS TRANSACTIONS" type="toggle" configKey="notification.sms_enabled" description="Status of SMS delivery for OTPs and tickets." value={getConfigValue('notification.sms_enabled', 'false')} onSave={handleUpdateConfig} />
        <ConfigInput label="PUSH MESSAGING" type="toggle" configKey="notification.push_enabled" description="Status of Real-time Firebase Push services." value={getConfigValue('notification.push_enabled', 'true')} onSave={handleUpdateConfig} />
    </>
);

const PaymentSettings = ({ getConfigValue, handleUpdateConfig }: any) => (
    <>
        <ConfigInput label="CHAPA INTEGRATION" type="toggle" configKey="payment.chapa" description="Accept payments via Chapa infrastructure." value={getConfigValue('payment.chapa', 'true')} onSave={handleUpdateConfig} />
        <ConfigInput label="TELEBIRR DIRECT" type="toggle" configKey="payment.telebirr" description="Accept direct mobile payments via Telebirr." value={getConfigValue('payment.telebirr', 'true')} onSave={handleUpdateConfig} />
        <ConfigInput label="SANDBOX MODE" type="toggle" configKey="payment.sandbox" description="Force all payments into test/sandbox environments." value={getConfigValue('payment.sandbox', 'true')} onSave={handleUpdateConfig} />
    </>
);

const ActivityLogs = ({ auditLogs }: { auditLogs: AuditLog[] }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No audit events found.</div>
        ) : (
            auditLogs.map((log) => (
                <div key={log.id} style={{
                    padding: '16px',
                    background: 'var(--bg-subtle)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start'
                }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--bg-hover)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid var(--border)'
                    }}>
                        <ShieldCheck size={20} color="#3B82F6" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{log.title}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
                                <Clock size={12} />
                                {new Date(log.createdAt).toLocaleString()}
                            </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{log.content}</p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-main)', fontWeight: 800 }}>
                                <User size={12} /> ADMIN SYSTEM
                            </div>
                            {log.metadata && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--bg-active)', fontWeight: 800 }}>
                                    ATTR: {Object.keys(log.metadata).join(', ')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))
        )}
    </div>
);

const ConfigInput = ({ label, configKey, value, description, type = 'text', onSave }: any) => {
    const [currentValue, setCurrentValue] = useState(value);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setCurrentValue(value);
        setIsDirty(false);
    }, [value]);

    return (
        <div style={{ padding: '24px', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px solid var(--border)', transition: 'all 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ flex: 1, paddingRight: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em' }}>{label}</label>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{description}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {type !== 'toggle' && isDirty && (
                        <button
                            onClick={() => { setCurrentValue(value); setIsDirty(false); }}
                            style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <RotateCcw size={16} />
                        </button>
                    )}
                    {(isDirty || type === 'toggle') && (
                        <button
                            onClick={() => {
                                const finalValue = type === 'toggle' ? (currentValue === 'true' ? 'false' : 'true') : currentValue;
                                onSave(configKey, finalValue);
                                if (type === 'toggle') setCurrentValue(finalValue);
                                setIsDirty(false);
                            }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                background: type === 'toggle' ? (currentValue === 'true' ? 'var(--bg-active)' : 'var(--bg-subtle)') : 'var(--bg-active)',
                                border: type === 'toggle' && currentValue !== 'true' ? '1px solid var(--border)' : 'none',
                                cursor: 'pointer',
                                color: type === 'toggle' && currentValue !== 'true' ? 'var(--text-main)' : 'white',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {type === 'toggle' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: currentValue === 'true' ? 'white' : 'var(--text-muted)', opacity: currentValue === 'true' ? 1 : 0.5 }} />
                                    {currentValue === 'true' ? 'ACTIVE' : 'DISABLED'}
                                </div>
                            ) : (
                                <><Save size={16} /> SAVE CHANGES</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {type !== 'toggle' && (
                <input
                    type={type}
                    value={currentValue}
                    onChange={(e) => {
                        setCurrentValue(e.target.value);
                        setIsDirty(e.target.value !== value);
                    }}
                    style={{
                        width: '100%',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border)',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        color: 'var(--text-main)',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--bg-active)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                />
            )}
        </div>
    );
};
