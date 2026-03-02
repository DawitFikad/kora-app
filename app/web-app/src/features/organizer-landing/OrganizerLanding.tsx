import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Ticket,
    ArrowRight,
    CheckCircle2,
    ShieldCheck,
    ScanLine,
    BadgeCheck,
    Smartphone,
    MapPin,
    Tag,
    Calendar,
    Clock,
    Menu,
    ChevronRight,
    Sun,
    Moon,
    Users,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { LoginModal } from '../auth/LoginModal';
import { useAuth } from '../../core/context/AuthContext';
import { useTheme } from '../../core/context/ThemeContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { EventService } from '../../core/api/event.service';
import type { PublicEvent } from '../../core/api/event.service';
import { ContentService } from '../../core/api/content.service';

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
                <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="logo-box">
                        <Ticket color="var(--primary-blue)" size={20} />
                    </div>
                    <span className="logo-text" style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--text-main)' }}>ET-TICKETS</span>
                </div>

                {/* Desktop Nav */}
                <div className="desktop-nav" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <a href="#home" className="nav-link">{t('nav.home', 'Home')}</a>
                    <a href="#featured-events" className="nav-link">{t('nav.events')}</a>
                    <a href="#organizers" className="nav-link">{t('nav.organizers')}</a>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={() => onAuthClick('login')}
                            style={{
                                padding: '0.4rem 0.9rem',
                                borderRadius: '8px',
                                border: '1px solid transparent',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {t('nav.organizerLogin')}
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
                            {t('nav.createEvent')}
                        </button>
                    </div>
                </div>

                {/* Navbar Actions (Theme & Mobile Menu) */}
                <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        aria-label="Toggle navigation"
                        role="button"
                    >
                        <Menu size={20} color={mobileMenuOpen ? 'var(--primary)' : 'var(--text-main)'} />
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
                        <div className="mobile-menu" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem 2rem', gap: '1.5rem' }}>
                            <a href="#home" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 700 }}>{t('nav.home', 'Home')}</a>
                            <a href="#featured-events" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 700 }}>{t('nav.events')}</a>
                            <a href="#organizers" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 700 }}>{t('nav.organizers')}</a>
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
                                    {t('nav.organizerLogin')}
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
                                    {t('nav.createEvent')}
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
                @media (max-width: 640px) {
                    .navbar .container { padding: 0 1rem; }
                    .navbar-brand { gap: 0.5rem; }
                    .logo-text { font-size: 1.05rem !important; }
                    .navbar-actions { gap: 6px; }
                    .mobile-menu { padding: 1.25rem 1.25rem; }
                }
                @media (min-width: 769px) {
                    .mobile-toggle { display: none !important; }
                }
            `}</style>
        </nav>
    );
};

const TrustSignals = () => {
    const { t } = useLanguage();
    const badges = [
        { name: t('landing.trust.badgeTelebirr'), color: '#0F4C81' },
        { name: t('landing.trust.badgeCbeBirr'), color: '#8B5CF6' },
        { name: t('landing.trust.badgeAmole'), color: '#F59E0B', comingSoon: true }
    ];

    const signals = [
        { icon: Users, title: t('landing.trust.usedBy') },
        { icon: ShieldCheck, title: t('landing.trust.securePayments') },
        { icon: ScanLine, title: t('landing.trust.qr') },
        { icon: BadgeCheck, title: t('landing.trust.adminVerified') },
        { icon: ShieldCheck, title: t('landing.trust.adminApproved') }
    ];

    return (
        <section id="trust" style={{ padding: '8rem 0', background: 'var(--bg-subtle)' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-main)' }}>{t('landing.trust.title')}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('landing.trust.subtitle')}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                    {signals.map((item, i) => (
                        <div key={i} className="glass" style={{ padding: '1.8rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <item.icon size={22} color="var(--primary)" />
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.title}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                    {badges.map((badge, i) => (
                        <div key={i} className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '999px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: badge.color, display: 'inline-block' }} />
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{badge.name}</span>
                            {badge.comingSoon && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{t('landing.trust.comingSoon')}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};



const InlineBannerCarousel = ({ banners }: { banners: any[] }) => {
    const [index, setIndex] = useState(0);
    const navigate = useNavigate();

    // Auto-rotate logic
    useEffect(() => {
        if (banners.length < 2) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    if (banners.length === 0) return null;

    // Single Banner (Hero Mode)
    if (banners.length === 1) {
        const current = banners[0];
        return (
            <div style={{ width: '100%', maxWidth: '100%', margin: '0 0 3.5rem', position: 'relative', borderRadius: '24px', overflow: 'hidden', aspectRatio: '2/1', maxHeight: '500px', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <motion.div initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${current.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />
                </motion.div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3rem', textAlign: 'left', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{current.title}</h2>
                        <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{current.subtitle}</p>
                    </div>
                    {current.linkUrl && (
                        <button onClick={() => current.linkUrl.startsWith('http') ? window.location.href = current.linkUrl : navigate(current.linkUrl)} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'white', color: 'black', border: 'none', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Check it out <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Determine positions
    const getPosition = (idx: number) => {
        if (idx === index) return 'center';
        const len = banners.length;
        const diff = (idx - index + len) % len;

        // Handle special case for 2 items to ensure they toggle sides correctly
        if (len === 2) {
            return idx !== index ? 'right' : 'center'; // Just show 'next' on right for 2-item toggle
        }

        if (diff === 1) return 'right';
        if (diff === len - 1) return 'left';
        return 'hidden';
    };

    // Variants for the items
    const cardVariants: any = {
        center: {
            x: '0%',
            scale: 1,
            opacity: 1,
            zIndex: 10,
            transition: { duration: 0.5, ease: 'easeOut' }
        },
        left: {
            x: '-85%',
            scale: 0.85,
            opacity: 0.5,
            zIndex: 5,
            transition: { duration: 0.5, ease: 'easeOut' }
        },
        right: {
            x: '85%',
            scale: 0.85,
            opacity: 0.5,
            zIndex: 5,
            transition: { duration: 0.5, ease: 'easeOut' }
        },
        hidden: {
            x: '0%',
            scale: 0.5,
            opacity: 0,
            zIndex: 0,
            transition: { duration: 0.5 }
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto 4rem', height: '450px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                <AnimatePresence initial={false}>
                    {banners.map((b, idx) => {
                        const itemPos = getPosition(idx);
                        return (
                            <motion.div
                                key={`${b.id}`}
                                variants={cardVariants}
                                initial="hidden"
                                animate={itemPos}
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    right: '0',
                                    margin: '0 auto',
                                    width: '90%',
                                    maxWidth: '900px',
                                    height: '100%',
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 40px -5px rgba(0,0,0,0.4)',
                                    background: '#000'
                                }}
                            >
                                <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />
                                {itemPos === 'center' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', textAlign: 'left' }}
                                    >
                                        <div style={{ display: 'inline-block', padding: '6px 12px', background: 'var(--primary)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
                                            FEATURED
                                        </div>
                                        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>{b.title}</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1rem' }}>{b.subtitle}</p>
                                        {b.linkUrl && null}
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <div style={{ position: 'absolute', bottom: '-18px', display: 'flex', gap: '8px' }}>
                {banners.map((_, i) => (
                    <div
                        key={i}
                        onClick={() => setIndex(i)}
                        style={{
                            width: i === index ? '22px' : '8px',
                            height: '8px',
                            borderRadius: '999px',
                            background: i === index ? 'white' : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const OrganizerLanding = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const { language, setLanguage, t } = useLanguage();
    const [banners, setBanners] = useState<any[]>([]);
    const [prioritizedEvents, setPrioritizedEvents] = useState<PublicEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [eventFilter, setEventFilter] = useState<'all' | 'today' | 'week'>('all');
    const [searchQuery, setSearchQuery] = useState('');

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
        const fetchEvents = async () => {
            try {
                setEventsLoading(true);
                const data = await EventService.getEvents({ featured: true });
                const normalized = Array.isArray(data) ? data : [];
                setPrioritizedEvents(normalized);
            } catch (err) {
                console.error('Failed to load events', err);
                setPrioritizedEvents([]);
            } finally {
                setEventsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (user) {
            console.log('Landing: User logged in, redirecting based on role:', user.role);
            if (user.role === 'ADMIN') {
                navigate('/admin');
            } else if (user.role === 'ORGANIZER') {
                if (user.status === 'PENDING' || user.organizer?.status === 'PENDING' || user.organizer?.status === 'REJECTED') {
                    navigate('/onboarding');
                } else {
                    navigate('/dashboard');
                }
            }
        }
    }, [user, navigate]);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const isSameDay = (value: string) => {
        const d = new Date(value);
        return d.getFullYear() === startOfToday.getFullYear()
            && d.getMonth() === startOfToday.getMonth()
            && d.getDate() === startOfToday.getDate();
    };

    const isWithinWeek = (value: string) => {
        const d = new Date(value);
        return d >= startOfToday && d <= endOfWeek;
    };

    const sortedEvents = [...prioritizedEvents].sort((a, b) => {
        const featuredDelta = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        if (featuredDelta !== 0) return featuredDelta;
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    });

    const featuredItems = sortedEvents.filter((event) => {
        // Search Filter
        const matchesSearch = !searchQuery.trim() ||
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.city?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.venue || '').toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // Date Filter
        if (eventFilter === 'today') return isSameDay(event.dateTime);
        if (eventFilter === 'week') return isWithinWeek(event.dateTime);
        return true;
    });

    const fallbackFeatured = sortedEvents.filter(event => event.featured).slice(0, 5);
    const fallbackAny = sortedEvents.slice(0, 6);
    const featuredDisplay = featuredItems.length >= 5
        ? featuredItems.slice(0, 6)
        : featuredItems.length > 0
            ? [...featuredItems, ...fallbackFeatured.filter(e => !featuredItems.some(f => f.id === e.id))].slice(0, 6)
            : (fallbackFeatured.length > 0 ? fallbackFeatured : fallbackAny);










    const formatEventDate = (value: string) => new Intl.DateTimeFormat(
        language === 'am' ? 'am-ET' : 'en-US',
        { month: 'short', day: 'numeric', weekday: 'short' }
    ).format(new Date(value));

    const formatEventTime = (value: string) => new Intl.DateTimeFormat(
        language === 'am' ? 'am-ET' : 'en-US',
        { hour: 'numeric', minute: '2-digit' }
    ).format(new Date(value));

    const attendeeSteps = [
        { title: t('landing.how.attendee.1.title'), desc: t('landing.how.attendee.1.desc') },
        { title: t('landing.how.attendee.2.title'), desc: t('landing.how.attendee.2.desc') },
        { title: t('landing.how.attendee.3.title'), desc: t('landing.how.attendee.3.desc') }
    ];

    const organizerSteps = [
        { title: t('landing.how.organizer.1.title'), desc: t('landing.how.organizer.1.desc') },
        { title: t('landing.how.organizer.2.title'), desc: t('landing.how.organizer.2.desc') },
        { title: t('landing.how.organizer.3.title'), desc: t('landing.how.organizer.3.desc') }
    ];

    return (
        <div>
            <div className="mesh-bg" />
            <Navbar onAuthClick={(mode) => { setAuthMode(mode); setIsLoginOpen(true); }} />

            <LoginModal isOpen={isLoginOpen} mode={authMode} onClose={() => setIsLoginOpen(false)} />

            {/* 1. Hero Section */}
            <section id="home" style={{ paddingTop: '9rem', paddingBottom: '7rem' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ maxWidth: '1600px', width: '100%', margin: '0 auto' }}
                    >
                        <div className="glass hero-glass" style={{ padding: '3rem 3.5rem', borderRadius: '3rem', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem' }}>
                                {[
                                    t('landing.hero.badge1'),
                                    t('landing.hero.badge2'),
                                    t('landing.hero.badge3')
                                ].map((item, i) => (
                                    <div key={i} style={{ padding: '0.45rem 1rem', borderRadius: '999px', border: '1px solid var(--border)', background: 'rgba(139, 92, 246, 0.08)', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                        {item}
                                    </div>
                                ))}
                            </div>

                            <h1 style={{ fontSize: 'clamp(2.6rem, 8vw, 5rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
                                {language === 'en' ? (
                                    <>Buy tickets safely.<br /><span className="gradient-text">Pay by phone. Enter with QR.</span></>
                                ) : (
                                    <>{t('landing.hero.title')}</>
                                )}
                            </h1>
                            <p style={{ fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', color: 'var(--text-muted)', maxWidth: '820px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
                                {t('landing.hero.subtitle')}
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
                                {[
                                    t('landing.hero.point1'),
                                    t('landing.hero.point2'),
                                    t('landing.hero.point3'),
                                    t('landing.hero.point4')
                                ].map((item, i) => (
                                    <div key={i} style={{ padding: '0.55rem 1rem', borderRadius: '999px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                        <CheckCircle2 size={16} color="var(--primary)" />
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{item}</span>
                                    </div>
                                ))}
                            </div>

                            {/* BANNERS INJECTED HERE */}
                            {banners.length > 0 && <InlineBannerCarousel banners={banners} />}

                            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <motion.button
                                    onClick={() => document.getElementById('featured-events')?.scrollIntoView({ behavior: 'smooth' })}
                                    whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)' }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        padding: '1.05rem 2.4rem',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '1.05rem',
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
                                    <span>{t('landing.hero.primaryCta')}</span>
                                    <ArrowRight size={20} />
                                </motion.button>
                                <motion.button
                                    onClick={() => { setAuthMode('register'); setIsLoginOpen(true); }}
                                    whileHover={{ background: 'rgba(255, 255, 255, 0.1)' }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        padding: '1.05rem 2.4rem',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        background: 'var(--bg-hover)',
                                        color: 'var(--text-main)',
                                        fontWeight: 700,
                                        fontSize: '1.05rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {t('landing.hero.secondaryCta')}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <TrustSignals />

            {/* 2. How It Works (3 Steps Each) */}
            <section id="how-it-works" style={{ padding: '8rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-main)' }}>{t('landing.how.title')}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem' }}>{t('landing.how.subtitle')}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
                        <div className="glass" style={{ padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{t('landing.how.attendees')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {attendeeSteps.map((step, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ width: '34px', height: '34px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary)' }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.3rem', color: 'var(--text-main)' }}>{step.title}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{t('landing.how.organizers')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {organizerSteps.map((step, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ width: '34px', height: '34px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#3B82F6' }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.3rem', color: 'var(--text-main)' }}>{step.title}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Featured Events */}
            <section id="featured-events" style={{ padding: '8rem 0', background: 'var(--bg-subtle)' }}>
                <div className="container">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', marginBottom: '3.5rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-main)' }}>{t('landing.featured.title')}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('landing.featured.subtitle')}</p>
                        </div>

                        <div style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
                            <Search size={22} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder={t('landing.featured.searchPlaceholder', 'Search events by name or city...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '1.2rem 1.5rem 1.2rem 4rem',
                                    borderRadius: '999px',
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-main)',
                                    fontSize: '1.1rem',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {(['all', 'today', 'week'] as const).map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => setEventFilter(tag)}
                                    style={{
                                        padding: '0.6rem 1.5rem',
                                        borderRadius: '999px',
                                        border: '1px solid',
                                        borderColor: eventFilter === tag ? 'var(--primary)' : 'var(--border)',
                                        background: eventFilter === tag ? 'var(--primary)' : 'transparent',
                                        color: eventFilter === tag ? 'white' : 'var(--text-muted)',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    {t(`landing.featured.filter.${tag}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {eventsLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)', minHeight: '320px' }} />
                            ))}
                        </div>
                    ) : featuredDisplay.length === 0 ? (
                        <div className="glass" style={{ padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{t('landing.featured.empty')}</p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                                {featuredItems.map((event) => (
                                    <div
                                        key={event.id}
                                        className="glass"
                                        style={{ borderRadius: '2rem', border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer' }}
                                        onClick={() => navigate(`/event/${event.id}`)}
                                    >
                                        <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                                            {event.coverImage ? (
                                                <img src={event.coverImage} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎟️</div>
                                            )}
                                            {event.featured && (
                                                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(17, 24, 39, 0.75)', color: 'white', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                                                    {t('landing.featured.adminPriority')}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)' }}>{event.title}</h3>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} /> {formatEventDate(event.dateTime)}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> {formatEventTime(event.dateTime)}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={14} /> {event.city?.name || t('landing.featured.cityFallback')}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {event.category?.name && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.7rem', borderRadius: '999px', background: 'rgba(139, 92, 246, 0.12)', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        <Tag size={12} /> {event.category?.name}
                                                    </span>
                                                )}
                                                {event.subCategory?.name && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.7rem', borderRadius: '999px', background: 'rgba(139, 92, 246, 0.08)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        <Tag size={12} /> {event.subCategory?.name}
                                                    </span>
                                                )}
                                                {event.organizer?.organizationName && (
                                                    <span style={{ padding: '0.3rem 0.7rem', borderRadius: '999px', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        {event.organizer.organizationName}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                style={{ marginTop: '1rem', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                {t('landing.featured.cta')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Why Choose This Platform */}
            <section id="why-choose" style={{ padding: '8rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-main)' }}>{t('landing.why.title')}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('landing.why.subtitle')}</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                        {[
                            t('landing.why.1'),
                            t('landing.why.2'),
                            t('landing.why.3'),
                            t('landing.why.4'),
                            t('landing.why.5')
                        ].map((item, i) => (
                            <div key={i} className="glass" style={{ padding: '1.6rem', borderRadius: '1.5rem', border: '1px solid var(--border)', display: 'flex', gap: '0.8rem' }}>
                                <CheckCircle2 size={20} color="var(--primary)" />
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Organizer Call-to-Action */}
            <section id="organizers" style={{ padding: '8rem 0', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))' }}>
                <div className="container">
                    <div className="glass" style={{ padding: '3.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '2.6rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-main)' }}>{t('landing.organizer.title')}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>{t('landing.organizer.subtitle')}</p>
                            <button
                                onClick={() => { setAuthMode('register'); setIsLoginOpen(true); }}
                                style={{ padding: '0.9rem 2rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                            >
                                {t('landing.organizer.cta')}
                            </button>
                        </div>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {[
                                t('landing.organizer.point1'),
                                t('landing.organizer.point2'),
                                t('landing.organizer.point3')
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <BadgeCheck size={20} color="var(--primary)" />
                                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Mobile-First Emphasis */}
            <section id="mobile-first" style={{ padding: '6rem 0' }}>
                <div className="container">
                    <div className="glass" style={{ padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Smartphone size={26} color="#3B82F6" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-main)' }}>{t('landing.mobile.title')}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{t('landing.mobile.subtitle')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Compliance + Scale Statement */}
            <section style={{ padding: '2rem 0 6rem' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>{t('landing.compliance')}</p>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{t('landing.scaleLine')}</p>
                </div>
            </section>

            {/* 5. Footer */}
            <footer style={{ padding: '8rem 0 4rem', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
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
                                <h5 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('landing.footer.supportTitle')}</h5>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <li><Link to="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('landing.footer.contact')}</Link></li>
                                    <li><Link to="/help-center" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('footer.helpCenter', 'Help Center')}</Link></li>
                                    <li><Link to="/support" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('landing.footer.support')}</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h5 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('landing.footer.policiesTitle')}</h5>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <li><Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('landing.footer.terms')}</Link></li>
                                    <li><Link to="/refund-policy" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('landing.footer.refund')}</Link></li>
                                    <li><Link to="/organizer-agreement" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('landing.footer.organizerAgreement')}</Link></li>
                                    <li><Link to="/admin-content" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem' }}>{t('landing.footer.adminContent')}</Link></li>
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
                            © {new Date().getFullYear()} ET-TICKETS PLATFORM. {t('footer.rights')}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default OrganizerLanding;
