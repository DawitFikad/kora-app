import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ShieldCheck, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { AuthService } from '../../core/api/auth.service';
import { useAuth } from '../../core/context/AuthContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
    const { login } = useAuth();
    const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Registration fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

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
            const response: any = await AuthService.verifyOtp(phoneNumber, otp);

            if (response.isNewUser) {
                setStep('register');
            } else {
                // Already exists, just log them in
                await login({ accessToken: response.accessToken, user: response.user });
                onClose();
            }
        } catch (err: any) {
            setError(err.error || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response: any = await AuthService.registerOrganizer({ phoneNumber, email, name });
            await login({ accessToken: response.accessToken, user: response.user });
            onClose();
        } catch (err: any) {
            setError(err.error || 'Registration failed.');
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
                    position: 'relative', border: '1px solid rgba(255,255,255,0.1)'
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
                        {step === 'phone' && <Phone size={32} color="var(--primary)" />}
                        {step === 'otp' && <ShieldCheck size={32} color="var(--primary)" />}
                        {step === 'register' && <User size={32} color="var(--primary)" />}
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>
                        {step === 'phone' && 'Welcome back'}
                        {step === 'otp' && 'Verify identity'}
                        {step === 'register' && 'Complete Profile'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                        {step === 'phone' && 'Enter your phone number to continue'}
                        {step === 'otp' && `Enter the 6-digit code sent to ${phoneNumber}`}
                        {step === 'register' && 'Tell us a bit about your organization'}
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
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                    <input
                                        type="tel"
                                        placeholder="+251 9... or 09..."
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                        style={{
                                            width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                            padding: '16px 16px 16px 48px', borderRadius: '14px', color: 'white', fontSize: '1rem'
                                        }}
                                    />
                                </div>
                            </div>
                            <button disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '16px', justifyContent: 'center' }}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight size={20} /></>}
                            </button>
                        </motion.form>
                    )}

                    {step === 'otp' && (
                        <motion.form key="otp" onSubmit={handleVerifyOtp}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Verification Code</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                        padding: '16px', borderRadius: '14px', color: 'white', fontSize: '1.5rem',
                                        textAlign: 'center', letterSpacing: '8px', fontWeight: 900
                                    }}
                                />
                            </div>
                            <button disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '16px', justifyContent: 'center' }}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Verify & Sign In'}
                            </button>
                            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Didn't receive code? <span style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }} onClick={() => setStep('phone')}>Resend</span>
                            </p>
                        </motion.form>
                    )}

                    {step === 'register' && (
                        <motion.form key="register" onSubmit={handleRegister}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Organization Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                    <input
                                        type="text"
                                        placeholder="e.g. Kuriftu Events"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        style={{
                                            width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                            padding: '16px 16px 16px 48px', borderRadius: '14px', color: 'white'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Email Address <span style={{ fontWeight: 400, opacity: 0.7 }}>(Optional)</span></label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                    <input
                                        type="email"
                                        placeholder="contact@org.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{
                                            width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                            padding: '16px 16px 16px 48px', borderRadius: '14px', color: 'white'
                                        }}
                                    />
                                </div>
                            </div>
                            <button disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '16px', justifyContent: 'center' }}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Complete Registration'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
