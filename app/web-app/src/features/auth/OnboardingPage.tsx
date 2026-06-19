import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    ShieldCheck,
    Rocket,
    BarChart,
    Zap,
    Users,
    Headphones,
    AlertTriangle,
    LogOut,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';

export const OnboardingPage = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // If somehow a non-organizer or an active organizer lands here, redirect them
    if (!user) {
        navigate('/');
        return null;
    }

    if (user.role !== 'ORGANIZER' && user.role !== 'USER') {
        navigate('/');
        return null;
    }

    if (user.status === 'ACTIVE' && user.organizer?.status === 'APPROVED') {
        navigate('/dashboard');
        return null;
    }

    const isRejected = user.organizer?.status === 'REJECTED';

    const features = [
        {
            icon: Rocket,
            title: t('org.pending.feature.tools', "Pro Event Tools"),
            desc: t('org.pending.feature.tools_desc', "Create complex ticket tiers, early bird discounts, and group packages.")
        },
        {
            icon: BarChart,
            title: t('org.pending.feature.analytics', "Real-time Analytics"),
            desc: t('org.pending.feature.analytics_desc', "Track sales, demography, and traffic sources with our advanced dashboard.")
        },
        {
            icon: ShieldCheck,
            title: t('org.pending.feature.payments', "Secure Payments"),
            desc: t('org.pending.feature.payments_desc', "Instant payouts via TeleBirr, CBE Birr, and Chapa with automated reconciliation.")
        },
        {
            icon: Zap,
            title: t('org.pending.feature.scanning', "Smart QR Scanning"),
            desc: t('org.pending.feature.scanning_desc', "Validate tickets offline or online with our secure scanner mobile app.")
        },
        {
            icon: Users,
            title: t('org.pending.feature.attendees', "Attendee Management"),
            desc: t('org.pending.feature.attendees_desc', "Communicate directly with your fans via SMS and Email notifications.")
        },
        {
            icon: Headphones,
            title: t('org.pending.feature.support', "24/7 Support"),
            desc: t('org.pending.feature.support_desc', "Dedicated account manager to help you scale your events.")
        }
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
            <header style={{
                padding: '24px 80px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', borderBottom: '1px solid var(--border)',
                background: 'var(--bg-sidebar)', zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/KORA%20Icon.png" alt="KORA" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)' }}>KORA</h2>
                </div>

                <button
                    onClick={logout}
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#EF4444', padding: '10px 24px', borderRadius: '14px',
                        cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <LogOut size={18} />
                    {t('auth.logout', 'Sign Out')}
                </button>
            </header>

            <main style={{ flex: 1, padding: '60px 20px', overflowY: 'auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ maxWidth: '1000px', margin: '0 auto' }}
                >
                    {/* Status Card */}
                    <div className="glass" style={{
                        padding: '60px 40px',
                        borderRadius: '32px',
                        textAlign: 'center',
                        marginBottom: '40px',
                        border: '1px solid var(--border)',
                        background: isRejected
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(2, 6, 23, 0.8) 100%)'
                            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: '-100px', right: '-100px',
                            width: '300px', height: '300px',
                            background: isRejected
                                ? 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(255, 0, 0, 0.08) 0%, transparent 70%)',
                            zIndex: 0
                        }} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: '80px', height: '80px',
                                background: isRejected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 32px',
                                border: isRejected ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                            }}>
                                {isRejected
                                    ? <AlertTriangle size={40} color="#EF4444" />
                                    : <Clock size={40} className="animate-pulse" color="#F59E0B" />
                                }
                            </div>

                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                                {isRejected
                                    ? t('org.rejected.title', "Application Status: Action Required")
                                    : `${t('org.pending.welcome', "Welcome to the Family")}, ${user.profile?.fullName?.split(' ')[0] || t('org.pending.organizer', "Organizer")}!`
                                }
                            </h1>

                            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}>
                                {isRejected
                                    ? t('org.rejected.subtitle', "Your application needs some adjustments before we can activate your account.")
                                    : t('org.pending.subtitle', "We've received your application to become a verified Organizer. Our team typically reviews credentials within 24 hours.")
                                }
                            </p>

                            {isRejected && user.organizer?.adminNote && (
                                <div style={{
                                    padding: '24px',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    marginBottom: '40px',
                                    textAlign: 'left'
                                }}>
                                    <h4 style={{ color: '#F87171', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertTriangle size={18} />
                                        {t('org.rejected.feedback', "Admin Feedback")}
                                    </h4>
                                    <p style={{ color: 'var(--text-main)', fontSize: '1rem', lineHeight: 1.5, fontWeight: 500 }}>
                                        {user.organizer.adminNote}
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                <div style={{
                                    padding: '12px 24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px'
                                }}>
                                    <CheckCircle2 size={18} color="#10B981" />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t('org.pending.status_submitted', "Registration Complete")}</span>
                                </div>
                                <div style={{
                                    padding: '12px 24px', borderRadius: '16px',
                                    background: isRejected ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 0, 0, 0.05)',
                                    border: isRejected ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255, 0, 0, 0.2)',
                                    display: 'flex', alignItems: 'center', gap: '10px'
                                }}>
                                    {!isRejected && <div className="spinner-small" />}
                                    <span style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: isRejected ? '#EF4444' : '#FF0000'
                                    }}>
                                        {isRejected ? t('org.rejected.status', "Action Needed") : t('org.pending.status_review', "Verification in Progress")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div style={{ marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '32px', textAlign: 'center' }}>
                            {t('org.pending.features_title', "What you'll get with KORA")}
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '24px'
                        }}>
                            {features.map((f, i) => (
                                <div key={i} className="glass" style={{
                                    padding: '32px',
                                    borderRadius: '24px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '48px', height: '48px', background: 'rgba(255, 0, 0, 0.1)',
                                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '20px'
                                    }}>
                                        <f.icon size={24} color="#FF0000" />
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px' }}>{f.title}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support Notice */}
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        borderTop: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <p>{t('org.pending.help', "Need help faster? Reach our onboarding team at")} <span style={{ color: 'var(--primary)', fontWeight: 700 }}>support@kora.com</span></p>
                    </div>
                </motion.div>
            </main>

            <style>{`
                .spinner-small {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 0, 0, 0.2);
                    border-top-color: #FF0000;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .logo-box {
                    width: 40px;
                    height: 40px;
                    background: rgba(29, 144, 245, 0.1);
                    borderRadius: 12px;
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                }
            `}</style>
        </div>
    );
};
