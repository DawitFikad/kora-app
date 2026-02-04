import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    MapPin,
    Tag,
    Building2,
    Loader2,
    ArrowRight,
    X,
    Mail,
    Phone
} from 'lucide-react';
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
    const [phoneHint, setPhoneHint] = useState('');
    const [otpHint, setOtpHint] = useState('');

    // Registration fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [city] = useState('');
    const [payoutDetails, setPayoutDetails] = useState('');
    const [organizerType, setOrganizerType] = useState<'company' | 'individual' | ''>('');
    const [shortDescription, setShortDescription] = useState('');
    const [categories, setCategories] = useState('');
    const [operatingCities, setOperatingCities] = useState('');
    const [businessLicense, setBusinessLicense] = useState<File | null>(null);
    const [eventPoster, setEventPoster] = useState<File | null>(null);

    const normalizeEthiopianPhone = (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) return '';
        const hasPlus = trimmed.startsWith('+');
        const digits = trimmed.replace(/\D/g, '');

        if (hasPlus && digits.startsWith('251')) {
            return `+${digits}`;
        }

        if (digits.startsWith('251')) {
            return `+${digits}`;
        }

        if (digits.startsWith('0') && digits.length === 10) {
            return `+251${digits.slice(1)}`;
        }

        if (digits.startsWith('9') && digits.length === 9) {
            return `+251${digits}`;
        }

        return '';
    };

    const handlePhoneChange = (val: string) => {
        const cleaned = val.replace(/[^0-9+]/g, '');
        if (cleaned !== val) {
            setPhoneHint(t('auth.hint.numbersOnly', 'Numbers only, please'));
            setTimeout(() => setPhoneHint(''), 2000);
        }

        // Limit length: 10 for 09..., 13 for +251...
        if (cleaned.startsWith('09')) {
            if (cleaned.length <= 10) setPhoneNumber(cleaned);
        } else if (cleaned.startsWith('+251')) {
            if (cleaned.length <= 13) setPhoneNumber(cleaned);
        } else if (cleaned.startsWith('251')) {
            if (cleaned.length <= 12) setPhoneNumber(cleaned);
        } else {
            // General limit for other inputs while typing
            if (cleaned.length <= 13) setPhoneNumber(cleaned);
        }
    };

    const handleOtpChange = (val: string) => {
        const cleaned = val.replace(/[^0-9]/g, '');
        if (cleaned !== val) {
            setOtpHint(t('auth.hint.numbersOnly', 'Numbers only, please'));
            setTimeout(() => setOtpHint(''), 2000);
        }
        if (cleaned.length <= 6) setOtp(cleaned);
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const normalized = normalizeEthiopianPhone(phoneNumber);
            if (!normalized) {
                setError('Please enter a valid Ethiopian phone number (e.g. 0912xxxxxx or +251912xxxxxx).');
                return;
            }
            await AuthService.requestOtp(normalized);
            setPhoneNumber(normalized);
            setStep('otp');
        } catch (err: any) {
            console.error('[LoginModal] OTP Request Error:', err);
            // 🔹 DEBUGGING: Show exact error
            const msg = err.error || err.message || JSON.stringify(err);
            setError(`Error: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const normalized = normalizeEthiopianPhone(phoneNumber);
            if (!normalized) {
                setError('Please enter a valid Ethiopian phone number (e.g. 0912xxxxxx or +251912xxxxxx).');
                return;
            }
            const verifyRes: any = await AuthService.verifyOtp(normalized, otp);

            if (mode === 'register') {
                // If user is already an organizer, just log them in
                if (verifyRes.hasOrganizerProfile) {
                    await login({ accessToken: verifyRes.accessToken, user: verifyRes.user });
                    onClose();
                    return;
                }

                // Otherwise, complete registration with the data from step 1
                try {
                    console.log('Attempting organizer registration with data:', {
                        phoneNumber,
                        email,
                        name,
                        city,
                        payoutDetails
                    });

                    const regRes: any = await AuthService.registerOrganizer({
                        phoneNumber: normalized,
                        email,
                        name,
                        city: operatingCities || city,
                        payoutDetails,
                        organizerType,
                        shortDescription,
                        categories,
                        operatingCities,
                        businessLicense,
                        eventPoster
                    });

                    console.log('Registration successful:', regRes);
                    await login({ accessToken: regRes.accessToken, user: regRes.user });
                    onClose();
                } catch (regErr: any) {
                    console.error('Registration error details:', regErr);
                    console.error('Error response:', regErr.response?.data);
                    setError(regErr.response?.data?.error || regErr.error || regErr.message || 'Registration failed after verification.');
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
            // Extract the most descriptive error message
            const errorMessage =
                (err.response?.data?.error) ||
                (err.error) ||
                (err.message) ||
                (typeof err === 'string' ? err : 'We couldn\'t verify that code. Please try again.');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'var(--modal-overlay, rgba(2,6,23,0.6))',
            backdropFilter: 'blur(10px) saturate(120%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
            padding: '24px'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass"
                style={{
                    width: '100%', maxWidth: '560px', padding: '36px', borderRadius: '28px',
                    position: 'relative', border: '1px solid var(--glass-border)',
                    background: 'var(--glass-bg)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)'
                }}
            >
                <button onClick={onClose} style={{
                    position: 'absolute', top: 20, right: 20, background: 'var(--bg-hover)',
                    border: '1px solid var(--border)', borderRadius: '12px',
                    color: 'var(--text-muted)', cursor: 'pointer', padding: '6px'
                }}>
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(14,165,233,0.12))',
                        border: '1px solid rgba(99,102,241,0.22)',
                        borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 18px'
                    }}>
                        {step === 'phone' && (mode === 'register' ? <Building2 size={32} color="var(--primary)" /> : <Phone size={32} color="var(--primary)" />)}
                        {step === 'otp' && <ShieldCheck size={32} color="var(--primary)" />}
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                        {step === 'phone' && (mode === 'register' ? t('auth.applyTitle') : t('auth.welcomeTitle'))}
                        {step === 'otp' && t('auth.verifyTitle')}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.98rem' }}>
                        {step === 'phone' && (mode === 'register' ? t('auth.applyDesc') : t('auth.welcomeDesc'))}
                        {step === 'otp' && `${t('auth.verifyDesc')} ${phoneNumber}`}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px', background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '12px',
                        color: '#F87171', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 600
                    }}>
                        {error}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {step === 'phone' && (
                        <motion.form key="phone" onSubmit={handleRequestOtp}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {mode === 'register' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px',
                                        padding: '16px', borderRadius: '20px',
                                        background: 'var(--bg-subtle)',
                                        border: '1px solid var(--border)',
                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                                    }}>
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
                                                        padding: '12px 12px 12px 48px', borderRadius: '14px', color: 'var(--text-main)',
                                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>{t('auth.organizerType')}</label>
                                            <select
                                                className="auth-select"
                                                value={organizerType}
                                                onChange={(e) => setOrganizerType(e.target.value as 'company' | 'individual' | '')}
                                                required
                                                style={{
                                                    width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                                    padding: '12px', borderRadius: '14px', color: 'var(--text-main)',
                                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                                                }}
                                            >
                                                <option value="">{t('auth.organizerTypePlaceholder', 'Select type')}</option>
                                                <option value="company">{t('auth.organizerTypeCompany')}</option>
                                                <option value="individual">{t('auth.organizerTypeIndividual')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>{t('auth.shortDesc')}</label>
                                            <textarea
                                                rows={2}
                                                placeholder={t('auth.shortDescPlaceholder', 'Tell us what kind of events you run')}
                                                value={shortDescription}
                                                onChange={(e) => setShortDescription(e.target.value)}
                                                required
                                                style={{
                                                    width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                                    padding: '12px', borderRadius: '14px', color: 'var(--text-main)', resize: 'none',
                                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>{t('auth.categories')}</label>
                                            <div style={{ position: 'relative' }}>
                                                <Tag size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                                <input
                                                    type="text"
                                                    placeholder={t('auth.categoriesPlaceholder', 'Music, Conference, Sports')}
                                                    value={categories}
                                                    onChange={(e) => setCategories(e.target.value)}
                                                    required
                                                    style={{
                                                        width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                                        padding: '12px 12px 12px 36px', borderRadius: '14px', color: 'var(--text-main)',
                                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>{t('auth.operatingCities')}</label>
                                            <div style={{ position: 'relative' }}>
                                                <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                                <input
                                                    type="text"
                                                    placeholder={t('auth.operatingCitiesPlaceholder', 'Addis Ababa, Adama')}
                                                    value={operatingCities}
                                                    onChange={(e) => setOperatingCities(e.target.value)}
                                                    required
                                                    style={{
                                                        width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                                        padding: '12px 12px 12px 36px', borderRadius: '14px', color: 'var(--text-main)',
                                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
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
                                                        padding: '12px 12px 12px 36px', borderRadius: '14px', color: 'var(--text-main)',
                                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                                                    }}
                                                />
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
                                                    padding: '12px', borderRadius: '14px', color: 'var(--text-main)',
                                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('auth.businessLicense')}</label>
                                            <input
                                                type="file"
                                                accept=".pdf,image/*"
                                                onChange={(e) => setBusinessLicense(e.target.files?.[0] || null)}
                                                style={{
                                                    width: '100%', background: 'var(--bg-subtle)', border: '1px dashed var(--border)',
                                                    padding: '10px', borderRadius: '12px', color: 'var(--text-muted)'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('auth.poster')}</label>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => setEventPoster(e.target.files?.[0] || null)}
                                                style={{
                                                    width: '100%', background: 'var(--bg-subtle)', border: '1px dashed var(--border)',
                                                    padding: '10px', borderRadius: '12px', color: 'var(--text-muted)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {mode === 'register' && (
                                <div style={{
                                    height: '1px', width: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.18), transparent)',
                                    margin: '6px 0 20px'
                                }} />
                            )}

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>{t('auth.phone')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                    <input
                                        type="tel"
                                        placeholder={t('auth.phonePlaceholder')}
                                        value={phoneNumber}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                        required
                                        style={{
                                            width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                            padding: '16px 16px 16px 48px', borderRadius: '16px', color: 'var(--text-main)', fontSize: '1rem',
                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                                        }}
                                    />
                                    {phoneHint && (
                                        <motion.span
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#F87171', fontSize: '0.75rem', fontWeight: 600, pointerEvents: 'none' }}
                                        >
                                            {phoneHint}
                                        </motion.span>
                                    )}
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
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => handleOtpChange(e.target.value)}
                                        required
                                        style={{
                                            width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                                            padding: '16px', borderRadius: '16px', color: 'var(--text-main)', fontSize: '1.5rem',
                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                                            textAlign: 'center', letterSpacing: '8px', fontWeight: 900
                                        }}
                                    />
                                    {otpHint && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            style={{ position: 'absolute', left: 0, right: 0, bottom: -20, textAlign: 'center', color: '#F87171', fontSize: '0.7rem', fontWeight: 700 }}
                                        >
                                            {otpHint}
                                        </motion.span>
                                    )}
                                </div>
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
