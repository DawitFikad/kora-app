import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Ticket,
    ArrowRight,
    CheckCircle2,
    BarChart3,
    ShieldCheck,
    ScanLine,
    Globe,
    Zap,
    Layers,
    ChevronDown,
    Sun,
    Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { LoginModal } from '../auth/LoginModal';
import { useAuth } from '../../core/context/AuthContext';
import { useTheme } from '../../core/context/ThemeContext';
import { useLanguage } from '../../core/context/LanguageContext';

const Navbar = ({ onAuthClick }: { onAuthClick: (mode: 'login' | 'register') => void }) => {
    const { theme, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`} style={{ transition: 'all 0.3s' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="logo-box">
                        <Ticket color="var(--primary-blue)" size={20} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--text-main)' }}>ET-TICKETS</span>
                </div>

                {/* Desktop Nav */}
                <div className="desktop-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <a href="#how-it-works" className="nav-link">{t('nav.howItWorks')}</a>
                    <a href="#features" className="nav-link">{t('nav.features')}</a>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={() => onAuthClick('login')}
                            style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text-main)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {t('nav.login')}
                        </button>
                        <button
                            onClick={() => onAuthClick('register')}
                            style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)',
                                color: 'white',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {t('nav.register')}
                        </button>
                    </div>
                </div>

                {/* Navbar Actions (Theme & Mobile Menu) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        onClick={toggleTheme}
                        style={{ borderRadius: '10px', background: 'var(--bg-hover)', padding: '8px', cursor: 'pointer', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {theme === 'dark' ? <Sun size={20} color="var(--text-main)" /> : <Moon size={20} color="var(--text-main)" />}
                    </div>
                    <div
                        onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
                        style={{
                            borderRadius: '10px',
                            background: 'var(--bg-hover)',
                            padding: '8px',
                            cursor: 'pointer',
                            border: '1px solid var(--border)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                            minWidth: '36px',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {language.toUpperCase()}
                    </div>
                    <div
                        className="mobile-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{ borderRadius: '10px', background: 'var(--bg-hover)', padding: '8px' }}
                    >
                        <Zap size={20} color={mobileMenuOpen ? 'var(--primary)' : 'var(--text-main)'} />
                    </div>
                </div>
            </div>

            {/* Mobile Nav Dropdown */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem 2rem', gap: '1.5rem' }}>
                            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 700 }}>{t('nav.howItWorks')}</a>
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 700 }}>{t('nav.features')}</a>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    onClick={() => { onAuthClick('login'); setMobileMenuOpen(false); }}
                                    style={{
                                        flex: 1,
                                        padding: '0.7rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        background: 'transparent',
                                        color: 'var(--text-main)',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                    className="nav-btn-outline"
                                >
                                    {t('nav.login')}
                                </button>
                                <button
                                    onClick={() => { onAuthClick('register'); setMobileMenuOpen(false); }}
                                    style={{
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
                                        whiteSpace: 'nowrap'
                                    }}
                                    className="nav-btn-primary"
                                >
                                    {t('nav.register')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .nav-link { color: var(--text-muted); text-decoration: none; font-weight: 600; fontSize: 0.9rem; transition: color 0.2s; }
                .nav-link:hover { color: var(--text-main); }
                
                .nav-btn-outline:hover {
                    background: var(--bg-hover) !important;
                    border-color: var(--text-main) !important;
                }
                
                .nav-btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 15px var(--primary-glow) !important;
                }
                
                .nav-btn-primary:active {
                    transform: translateY(0);
                }

                @media (max-width: 768px) {
                    .desktop-nav { display: none !important; }
                    .mobile-toggle { display: block !important; cursor: pointer; }
                }
                @media (min-width: 769px) {
                    .mobile-toggle { display: none !important; }
                }
            `}</style>
        </nav>
    );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div
            className="glass"
            style={{
                padding: '1.5rem',
                borderRadius: '1.5rem',
                cursor: 'pointer',
                marginBottom: '1rem'
            }}
            onClick={() => setIsOpen(!isOpen)}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{question}</h4>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown size={20} color="var(--text-muted)" />
                </motion.div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <p style={{ paddingTop: '1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const PaymentServices = () => {
    const { t, language } = useLanguage();
    const providers = [
        { name: language === 'am' ? 'ቴሌብር' : 'Telebirr', color: '#0066B3' },
        { name: language === 'am' ? 'ሲቢኢ ብር' : 'CBE Birr', color: '#8B5CF6' },
        { name: language === 'am' ? 'አሞሌ' : 'Amole', color: '#F59E0B' },
        { name: language === 'am' ? 'ሲቢኢ' : 'CBE', color: '#3B82F6' }
    ];

    return (
        <section style={{ padding: '10rem 0', background: 'var(--bg-subtle)', position: 'relative', overflow: 'hidden' }}>
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4rem', marginBottom: '8rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '2 1 500px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 1rem',
                            background: 'rgba(139, 92, 246, 0.1)',
                            borderRadius: '100px',
                            color: '#A78BFA',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                        }}>
                            <Zap size={14} /> {t('payment.badge')}
                        </div>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, marginBottom: '2rem', lineHeight: 1.1, color: 'var(--text-main)' }}>
                            {t('payment.title')}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', lineHeight: 1.6, maxWidth: '600px' }}>
                            {t('payment.subtitle')}
                        </p>
                    </div>
                    <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
                        <motion.div
                            animate={{
                                y: [0, -25, 0],
                                rotateY: [0, 15, 0]
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                width: '320px',
                                height: '320px',
                                borderRadius: '60px',
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(217, 70, 239, 0.1))',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <div style={{
                                width: '240px',
                                height: '160px',
                                background: 'linear-gradient(135deg, #6366F1, #D946EF)',
                                borderRadius: '24px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.5)',
                                transform: 'perspective(1000px) rotateX(15deg) rotateY(-10deg)'
                            }}>
                                <div style={{ position: 'absolute', top: '24px', left: '24px', width: '48px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px' }} />
                                <div style={{ position: 'absolute', bottom: '24px', left: '24px', fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>•••• 8421</div>
                                <div style={{ position: 'absolute', top: '24px', right: '24px' }}><ShieldCheck color="white" size={24} /></div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem' }}>
                    {providers.map((p, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -15, background: 'rgba(255,255,255,0.08)', borderColor: p.color }}
                            className="glass"
                            style={{
                                padding: '4rem 2rem',
                                borderRadius: '3.5rem',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2rem',
                                border: '1px solid var(--border)',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                        >
                            <div style={{
                                width: '110px', height: '110px', borderRadius: '35px',
                                background: p.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 25px 50px ${p.color}44`,
                                marginBottom: '0.5rem'
                            }}>
                                <span style={{ color: 'white', fontWeight: 950, fontSize: '3rem' }}>{p.name[0]}</span>
                            </div>
                            <h4 style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--text-main)' }}>{p.name}</h4>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Testimonials = () => {
    const { t, language } = useLanguage();
    const tms = [
        {
            name: language === 'am' ? 'አቢነት ከበደ' : 'Abinet Kebede',
            role: language === 'am' ? 'የኮንሰርት አዘጋጅ' : 'Concert Promoter',
            quote: language === 'am' ? 'ET-TICKETS የዝግጅት መግቢያ አያያዝ ሂደታችንን ለውጦታል። ከ5000 በላይ ታዳሚዎች ቢኖሩም የQR ቅኝቱ ፍጹም ነው።' : 'ET-TICKETS transformed how we manage gate entry. The QR scanning is flawless even with 5000+ attendees.'
        },
        {
            name: language === 'am' ? 'ሰላም ተክሌ' : 'Selam Tekle',
            role: language === 'am' ? 'የኮንፈረንስ አዘጋጅ' : 'Conference Organizer',
            quote: language === 'am' ? 'የእውነተኛ ጊዜ ዳሽቦርዱ የአእምሮ ሰላም ይሰጠናል። ገቢያችን በየደቂቃው ሲያድግ ማየት እንችላለን።' : 'The real-time dashboard gives us peace of mind. We can see revenue growing minute by minute.'
        },
        {
            name: language === 'am' ? 'ዳዊት መንግስቱ' : 'Dawit Mengistu',
            role: language === 'am' ? 'የስፖርት ዝግጅት መሪ' : 'Sports Event Lead',
            quote: language === 'am' ? 'በመጨረሻም ቴሌብርን እና ሲቢኢ ብርን የሚረዳ መድረክ አገኘን። የክፍያ አሰፋፈር ሂደቱ በሚገርም ሁኔታ ፈጣን ነው።' : 'Finally, a platform that understands Telebirr and CBE Birr. The settlement process is exceptionally fast.'
        }
    ];

    return (
        <section style={{ padding: '10rem 0' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{t('testimonials.title')}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{t('testimonials.subtitle')}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                    {tms.map((t, i) => (
                        <div key={i} className="glass" style={{ padding: '3.5rem', borderRadius: '3rem', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '2rem', left: '2rem', color: 'var(--primary)', opacity: 0.2 }}>
                                <Zap size={48} />
                            </div>
                            <p style={{ fontSize: '1.15rem', fontStyle: 'italic', marginBottom: '2.5rem', lineHeight: 1.7, position: 'relative', color: 'var(--text-main)' }}>"{t.quote}"</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), var(--secondary))' }} />
                                <div>
                                    <h5 style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-main)' }}>{t.name}</h5>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

import { ContentService } from '../../core/api/content.service';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const InlineBannerCarousel = ({ banners }: { banners: any[] }) => {
    const [index, setIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    const current = banners[index];

    return (
        <div style={{
            maxWidth: '1000px',
            margin: '0 auto 3.5rem',
            position: 'relative',
            borderRadius: '24px',
            overflow: 'hidden',
            aspectRatio: '2/1',
            maxHeight: '400px',
            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: `url(${current.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />
                </motion.div>
            </AnimatePresence>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', textAlign: 'left', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <motion.h2
                        key={`t-${current.id}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                    >
                        {current.title}
                    </motion.h2>
                    <motion.p
                        key={`s-${current.id}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
                    >
                        {current.subtitle}
                    </motion.p>
                </div>
                {current.linkUrl && (
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => {
                            if (current.linkUrl.startsWith('http')) window.location.href = current.linkUrl;
                            else navigate(current.linkUrl);
                        }}
                        style={{
                            padding: '0.75rem 1.5rem', borderRadius: '12px',
                            background: 'white', color: 'black',
                            border: 'none', fontSize: '0.9rem', fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}
                    >
                        Check it out <ChevronRight size={16} />
                    </motion.button>
                )}
            </div>

            {/* Controls */}
            {banners.length > 1 && (
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 10px', pointerEvents: 'none' }}>
                    <button onClick={() => setIndex(prev => (prev - 1 + banners.length) % banners.length)} style={{ pointerEvents: 'auto', padding: '8px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setIndex(prev => (prev + 1) % banners.length)} style={{ pointerEvents: 'auto', padding: '8px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

const OrganizerLanding = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [revenue, setRevenue] = useState(24.5);
    const [tickets, setTickets] = useState(842);
    const { language, setLanguage, t } = useLanguage();
    const [banners, setBanners] = useState<any[]>([]);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await ContentService.getBanners();
                if (res.success && res.data.length > 0) {
                    setBanners(res.data.filter((b: any) => b.isActive).sort((a: any, b: any) => a.order - b.order));
                }
            } catch (err) {
                console.error('Failed to load banners', err);
            }
        };
        fetchBanners();
    }, []);

    useEffect(() => {
        if (user) {
            console.log('Landing: User logged in, redirecting based on role:', user.role);
            if (user.role === 'ADMIN') {
                navigate('/admin');
            } else if (user.role === 'ORGANIZER') {
                navigate('/dashboard');
            }
        }
    }, [user, navigate]);

    useEffect(() => {
        const interval = setInterval(() => {
            setRevenue(prev => +(prev + Math.random() * 0.1).toFixed(2));
            setTickets(prev => prev + (Math.random() > 0.7 ? 1 : 0));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <div className="mesh-bg" />
            <Navbar onAuthClick={(mode) => { setAuthMode(mode); setIsLoginOpen(true); }} />

            <LoginModal isOpen={isLoginOpen} mode={authMode} onClose={() => setIsLoginOpen(false)} />

            {/* 1. Hero Section */}
            <section style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 1rem',
                            background: 'rgba(139, 92, 246, 0.1)',
                            borderRadius: '100px',
                            color: '#A78BFA',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            marginBottom: '2rem',
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                        }}>
                            <Zap size={14} /> {t('hero.badge')}
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 900, lineHeight: 1, marginBottom: '1.5rem', letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
                            {language === 'en' ? (
                                <>Sell Tickets. Manage Events. <br /><span className="gradient-text">Get Paid — All in One Platform.</span></>
                            ) : (
                                <>{t('hero.title')}</>
                            )}
                        </h1>
                        <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
                            {t('hero.subtitle')}
                        </p>

                        {/* BANNERS INJECTED HERE */}
                        {banners.length > 0 && <InlineBannerCarousel banners={banners} />}

                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <motion.button
                                onClick={() => { setAuthMode('register'); setIsLoginOpen(true); }}
                                whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)' }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    padding: '1.1rem 2.5rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <span>{t('nav.register')}</span>
                                <ArrowRight size={20} />
                            </motion.button>
                            <motion.button
                                onClick={() => { setAuthMode('login'); setIsLoginOpen(true); }}
                                whileHover={{ background: 'rgba(255, 255, 255, 0.1)' }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    padding: '1.1rem 2.5rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-hover)',
                                    color: 'var(--text-main)',
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {t('nav.login')}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </section>

            <PaymentServices />

            {/* 2. How It Works (4 Steps) */}
            <section id="how-it-works" style={{ background: 'var(--bg-subtle)', padding: '8rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>{t('steps.title')}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{t('steps.subtitle')}</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2.5rem' }}>
                        {[
                            { icon: Layers, title: t('steps.1.title'), desc: t('steps.1.desc') },
                            { icon: ShieldCheck, title: t('steps.2.title'), desc: t('steps.2.desc') },
                            { icon: Globe, title: t('steps.3.title'), desc: t('steps.3.desc') },
                            { icon: ScanLine, title: t('steps.4.title'), desc: t('steps.4.desc') }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.05, translateY: -10 }}
                                className="glass"
                                style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '2.5rem' }}
                            >
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                    borderRadius: '22px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 2rem',
                                    boxShadow: '0 12px 24px rgba(139, 92, 246, 0.2)'
                                }}>
                                    <step.icon color="white" size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-main)' }}>{step.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Features Highlights */}
            <section id="features" style={{ padding: '10rem 0' }}>
                <div className="container">
                    <div style={{ display: 'flex', gap: '6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 500px' }}>
                            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '3rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                                {t('features.title')}
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {[
                                    { title: t('features.1.title'), desc: t('features.1.desc') },
                                    { title: t('features.2.title'), desc: t('features.2.desc') },
                                    { title: t('features.3.title'), desc: t('features.3.desc') },
                                    { title: t('features.4.title'), desc: t('features.4.desc') },
                                    { title: t('features.5.title'), desc: t('features.5.desc') },
                                    { title: t('features.6.title'), desc: t('features.6.desc') }
                                ].map((feat, i) => (
                                    <motion.div
                                        key={i}
                                        style={{ display: 'flex', gap: '1.5rem' }}
                                        whileHover={{ x: 10 }}
                                    >
                                        <div style={{ color: 'var(--primary)', paddingTop: '0.25rem' }}><CheckCircle2 size={26} /></div>
                                        <div>
                                            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-main)' }}>{feat.title}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.5 }}>{feat.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: '1 1 400px' }}>
                            <motion.div
                                className="glass"
                                style={{ padding: '3.5rem', borderRadius: '4rem', position: 'relative' }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '-30px',
                                    right: '-30px',
                                    width: '100px',
                                    height: '100px',
                                    background: 'linear-gradient(135deg, #8B5CF6, #D946EF)',
                                    borderRadius: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transform: 'rotate(12deg)',
                                    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)'
                                }}>
                                    <BarChart3 color="white" size={48} />
                                </div>
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <div style={{ height: '10px', width: '60%', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', marginBottom: '1.25rem' }} />
                                    <div style={{ height: '10px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '5px' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>{t('stats.revenue')}</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)' }}>ETB {revenue}k</p>
                                    </div>
                                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>{t('stats.sales')}</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)' }}>{tickets}</p>
                                    </div>
                                </div>
                                <div style={{ height: '160px', width: '100%', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '2rem', position: 'relative', overflow: 'hidden' }}>
                                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <motion.path
                                            d="M0,80 Q25,20 50,60 T100,20 L100,100 L0,100 Z"
                                            fill="rgba(139, 92, 246, 0.2)"
                                            animate={{
                                                d: [
                                                    "M0,80 Q25,20 50,60 T100,20 L100,100 L0,100 Z",
                                                    "M0,80 Q25,40 50,20 T100,60 L100,100 L0,100 Z",
                                                    "M0,80 Q25,20 50,60 T100,20 L100,100 L0,100 Z"
                                                ]
                                            }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                    </svg>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            <Testimonials />

            {/* 4. Trust & Compliance */}
            <section style={{ padding: '6rem 0' }}>
                <div className="container">
                    <div className="glass" style={{ padding: '2rem 1rem', borderRadius: '5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '5rem', alignItems: 'center' }}>
                        <div style={{ padding: '3rem' }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>{t('trust.title')}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>{t('trust.subtitle')}</p>
                            <button onClick={() => setIsLoginOpen(true)} className="btn btn-primary" style={{ padding: '1rem 2rem' }}>{t('trust.btn')}</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', padding: '3rem' }}>
                            {[
                                { title: t('trust.1.title'), desc: t('trust.1.desc') },
                                { title: t('trust.2.title'), desc: t('trust.2.desc') },
                                { title: t('trust.3.title'), desc: t('trust.3.desc') },
                                { title: t('trust.4.title'), desc: t('trust.4.desc') }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}
                                    whileHover={{ x: 5 }}
                                >
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(167, 139, 250, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShieldCheck color="#A78BFA" size={24} />
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.2rem', color: 'var(--text-main)' }}>{item.title}</span>
                                        <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{item.desc}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section style={{ padding: '10rem 0' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-main)' }}>{t('faq.title')}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{t('faq.subtitle')}</p>
                    </div>
                    <FAQItem
                        question={t('faq.1.q')}
                        answer={t('faq.1.a')}
                    />
                    <FAQItem
                        question={t('faq.2.q')}
                        answer={t('faq.2.a')}
                    />
                    <FAQItem
                        question={t('faq.3.q')}
                        answer={t('faq.3.a')}
                    />
                    <FAQItem
                        question={t('faq.4.q')}
                        answer={t('faq.4.a')}
                    />
                </div>
            </section>

            {/* 5. Footer */}
            <footer style={{ padding: '8rem 0 4rem', borderTop: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '5rem' }}>
                        <div style={{ flex: '1 1 350px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <Ticket color="var(--primary)" size={40} />
                                <span style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--text-main)' }}>ET-TICKETS</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', maxWidth: '350px', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                {t('footer.desc')}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '5rem', flexWrap: 'wrap' }}>
                            <div>
                                <h5 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('footer.platform')}</h5>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('nav.features')}</a></li>
                                    <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('footer.pricing')}</a></li>
                                    <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('footer.caseStudies')}</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('footer.support')}</h5>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('footer.helpCenter')}</a></li>
                                    <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('footer.contactUs')}</a></li>
                                    <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('footer.systemStatus')}</a></li>
                                </ul>
                            </div>
                        </div>

                        <div style={{ flex: '0 0 auto' }}>
                            <div className="glass" style={{ display: 'flex', padding: '0.5rem', borderRadius: '14px', border: '1px solid var(--border)' }}>
                                <button
                                    onClick={() => setLanguage('en')}
                                    style={{
                                        background: language === 'en' ? 'var(--primary)' : 'transparent',
                                        border: 'none',
                                        color: language === 'en' ? 'white' : 'var(--text-muted)',
                                        padding: '0.5rem 1.25rem',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >EN</button>
                                <button
                                    onClick={() => setLanguage('am')}
                                    style={{
                                        background: language === 'am' ? 'var(--primary)' : 'transparent',
                                        border: 'none',
                                        color: language === 'am' ? 'white' : 'var(--text-muted)',
                                        padding: '0.5rem 1.25rem',
                                        borderRadius: '10px',
                                        fontSize: '0.9rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >AM</button>
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '6rem', paddingTop: '3rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>
                            © 2025 ET-TICKETS PLATFORM. {t('footer.rights')}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default OrganizerLanding;
