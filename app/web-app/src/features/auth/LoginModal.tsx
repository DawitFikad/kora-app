import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ShieldCheck, Mail, ArrowRight, Loader2, MapPin, Building2 } from 'lucide-react';
import { AuthService } from '../../core/api/auth.service';
import { useAuth } from '../../core/context/AuthContext';
import { useLanguage } from '../../core/context/LanguageContext';

interface LoginModalProps {
    isOpen: boolean;
    mode?: 'login' | 'register';
    onClose: () => void;
}

export const LoginModal = ({ isOpen, mode = 'login', onClose }: LoginModalProps) => {
    const { login } = useAuth();
    const { t } = useLanguage();
    const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Registration fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [payoutDetails, setPayoutDetails] = useState('');

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await AuthService.requestOtp(phoneNumber);
            setStep('otp');
        } catch (err: any) {
            setError(err.error || 'Failed to send OTP. Please check the number.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const verifyRes: any = await AuthService.verifyOtp(phoneNumber, otp);

            if (mode === 'register') {
                // If user is already an organizer, just log them in
                if (verifyRes.hasOrganizerProfile) {
                    await login({ accessToken: verifyRes.accessToken, user: verifyRes.user });
                    onClose();
                    return;
                }

                // Otherwise, complete registration with the data from step 1
                try {
                    const regRes: any = await AuthService.registerOrganizer({
                        phoneNumber,
                        email,
                        name,
                        city,
                        payoutDetails
                    });
                    await login({ accessToken: regRes.accessToken, user: regRes.user });
                    onClose();
                } catch (regErr: any) {
                    setError(regErr.response?.data?.error || 'Registration failed after verification.');
                }
            } else {
                // Regular login mode
                if (!verifyRes.hasOrganizerProfile && verifyRes.user.role !== 'ADMIN') {
                    setError(t('auth.noAccountError'));
                    return;
                }
                await login({ accessToken: verifyRes.accessToken, user: verifyRes.user });
                onClose();
            }
        } catch (err: any) {
            console.error('[LoginModal] Verification Error:', err);
            const errorMessage = err.response?.data?.error || err.error || err.message || 'Verification failed. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass"
                style={{
                    width: '100%', maxWidth: '450px', padding: '40px', borderRadius: '32px',
                    position: 'relative', border: '1px solid var(--border)', background: 'var(--bg-card)'
                }}
            >
                <button onClick={onClose} style={{
                    position: 'absolute', top: 24, right: 24, background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer'
                }}>
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        {step === 'phone' && (mode === 'register' ? <Building2 size={32} color="var(--primary)" /> : <Phone size={32} color="var(--primary)" />)}
                        {step === 'otp' && <ShieldCheck size={32} color="var(--primary)" />}
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        {step === 'phone' && (mode === 'register' ? t('auth.applyTitle') : t('auth.welcomeTitle'))}
                        {step === 'otp' && t('auth.verifyTitle')}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                        {step === 'phone' && (mode === 'register' ? t('auth.applyDesc') : t('auth.welcomeDesc'))}
                        {step === 'otp' && `${t('auth.verifyDesc')} ${phoneNumber}`}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px',
                        color: '#EF4444', fontSize: '0.9rem', marginBottom: '24px', fontWeight: 600
                    }}>
                        {error}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {step === 'phone' && (
                        <motion.form key="phone" onSubmit={handleRequestOtp}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {mode === 'register' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>{t('auth.orgName')}</label>
                                        <div style={{ position: 'relative' }}>
                                            <Building2 size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                            <input
                                                type="text"
                                                placeholder={t('auth.orgNamePlaceholder')}
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                style={{
                                                    width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                                    padding: '12px 12px 12px 48px', borderRadius: '12px', color: 'var(--text-main)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>{t('auth.city')}</label>
                                            <div style={{ position: 'relative' }}>
                                                <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                                <input
                                                    type="text"
                                                    placeholder={t('auth.cityPlaceholder')}
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    required
                                                    style={{
                                                        width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                                        padding: '12px 12px 12px 36px', borderRadius: '12px', color: 'var(--text-main)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>{t('auth.email')}</label>
                                            <div style={{ position: 'relative' }}>
                                                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                                <input
                                                    type="email"
                                                    placeholder={t('auth.emailPlaceholder')}
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    style={{
                                                        width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                                        padding: '12px 12px 12px 36px', borderRadius: '12px', color: 'var(--text-main)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>{t('auth.payout')}</label>
                                        <input
                                            type="text"
                                            placeholder={t('auth.payoutPlaceholder')}
                                            value={payoutDetails}
                                            onChange={(e) => setPayoutDetails(e.target.value)}
                                            required
                                            style={{
                                                width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                                padding: '12px', borderRadius: '12px', color: 'var(--text-main)'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>{t('auth.phone')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                    <input
                                        type="tel"
                                        placeholder={t('auth.phonePlaceholder')}
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                        style={{
                                            width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                            padding: '16px 16px 16px 48px', borderRadius: '14px', color: 'var(--text-main)', fontSize: '1rem'
                                        }}
                                    />
                                </div>
                            </div>
                            <button disabled={isLoading} className="btn-blue" style={{ width: '100%', padding: '16px', justifyContent: 'center', height: 'auto' }}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <>{mode === 'register' ? t('auth.registerBtn') : t('auth.loginBtn')} <ArrowRight size={20} /></>}
                            </button>
                        </motion.form>
                    )}

                    {step === 'otp' && (
                        <motion.form key="otp" onSubmit={handleVerifyOtp}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>{t('auth.otpLabel')}</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                        padding: '16px', borderRadius: '14px', color: 'var(--text-main)', fontSize: '1.5rem',
                                        textAlign: 'center', letterSpacing: '8px', fontWeight: 900
                                    }}
                                />
                            </div>
                            <button disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '16px', justifyContent: 'center' }}>
                                {isLoading ? <Loader2 className="animate-spin" /> : t('auth.verifyBtn')}
                            </button>
                            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                {t('auth.resend')} <span style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }} onClick={() => setStep('phone')}>{t('auth.resendBtn')}</span>
                            </p>
                        </motion.form>
                    )}

                </AnimatePresence>
            </motion.div>
        </div>
    );
};
