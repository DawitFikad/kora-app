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
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        background: 'linear-gradient(135deg, #8B5CF6, #D946EF)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Ticket color="white" size={20} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.05em' }}>ET-TICKETS</span>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <a href="#how-it-works" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>How it works</a>
                    <a href="#features" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Features</a>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Login</button>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Create Account</button>
                </div>
            </div>
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
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{question}</h4>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown size={20} color="rgba(255,255,255,0.4)" />
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
                        <p style={{ paddingTop: '1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const OrganizerLanding = () => {
    const navigate = useNavigate();
    const [revenue, setRevenue] = useState(24.5);
    const [tickets, setTickets] = useState(842);

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
            <Navbar />

            {/* 1. Hero Section */}
            <section style={{ paddingTop: '10rem', paddingBottom: '6rem' }}>
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
                            marginBottom: '2.5rem',
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                        }}>
                            <Zap size={14} /> THE GOLD STANDARD FOR EVENT TICKETING
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', fontWeight: 900, lineHeight: 1, marginBottom: '2rem', letterSpacing: '-0.03em' }}>
                            Sell Tickets. Manage Events. <br />
                            <span className="gradient-text">Get Paid — All in One Platform.</span>
                        </h1>
                        <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', color: 'rgba(255,255,255,0.5)', maxWidth: '800px', margin: '0 auto 3.5rem', lineHeight: 1.6 }}>
                            Built for Ethiopian events — from concerts and conferences to sports and church gatherings. Scale your reach effortlessly with our industry-leading tools.
                        </p>
                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ padding: '1.25rem 2.5rem' }}>
                                Create Organizer Account <ArrowRight size={20} />
                            </button>
                            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '1.25rem 2.5rem' }}>
                                Organizer Login
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 2. How It Works (4 Steps) */}
            <section id="how-it-works" style={{ background: 'rgba(255,255,255,0.02)', padding: '8rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Streamlined Workflow</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>From creation to validation, we've got you covered.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2.5rem' }}>
                        {[
                            { icon: Layers, title: 'Create Event', desc: 'Set up your event page, ticket tiers, and pricing in minutes.' },
                            { icon: ShieldCheck, title: 'Get Admin Approval', desc: 'Secure verification from our team to protect you and your fans.' },
                            { icon: Globe, title: 'Sell Tickets Online', desc: 'Accept payments via Telebirr, CBE Birr, and other local options.' },
                            { icon: ScanLine, title: 'Scan & Validate', desc: 'Use our mobile scanner app to verify tickets at the gate.' }
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
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>{step.title}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', lineHeight: 1.5 }}>{step.desc}</p>
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
                            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '3rem', letterSpacing: '-0.02em' }}>
                                Tools designed for <br /><span className="gradient-text">Event Professionals.</span>
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {[
                                    { title: 'Digital Ticketing & QR Validation', desc: 'Instant ticket delivery and fraud-proof scanning at the heavy-traffic gates.' },
                                    { title: 'Seat Map & Capacity Control', desc: 'Customizable seating charts and real-time inventory management.' },
                                    { title: 'Real-time Sales Dashboard', desc: 'Monitor ticket velocity and revenue as it happens.' },
                                    { title: 'Automated Payouts', desc: 'Fast settlements to your local bank account or mobile wallet.' },
                                    { title: 'Fraud Protection', desc: 'Advanced tracking to prevent scalping and double-entry.' }
                                ].map((feat, i) => (
                                    <motion.div
                                        key={i}
                                        style={{ display: 'flex', gap: '1.5rem' }}
                                        whileHover={{ x: 10 }}
                                    >
                                        <div style={{ color: 'var(--primary)', paddingTop: '0.25rem' }}><CheckCircle2 size={26} /></div>
                                        <div>
                                            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem' }}>{feat.title}</h4>
                                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', lineHeight: 1.5 }}>{feat.desc}</p>
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
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>LIVE REVENUE</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>ETB {revenue}k</p>
                                    </div>
                                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>LIVE SALES</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{tickets}</p>
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

            {/* 4. Trust & Compliance */}
            <section style={{ padding: '6rem 0' }}>
                <div className="container">
                    <div className="glass" style={{ padding: '5rem', borderRadius: '5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '5rem', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>Trust built on <br />Compliance.</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>We operate with full transparency to ensure every event is a success. Our automated settlement system ensures you get paid on time, every time.</p>
                            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '1rem 2rem' }}>Learn About Payouts</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                            {[
                                { title: 'Local Payment Integrations', desc: 'Secure settlement via Telebirr, CBE Birr, and CBE.' },
                                { title: 'Secure Transactions', desc: 'End-to-end encryption for all payments.' },
                                { title: 'Admin-Approved Events Only', desc: 'A verified marketplace for genuine organizers.' },
                                { title: 'Transparent Fees', desc: 'No hidden costs. You know exactly what you take home.' }
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
                                        <span style={{ display: 'block', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.2rem' }}>{item.title}</span>
                                        <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.4)' }}>{item.desc}</span>
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
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>Common Questions</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>Everything you need to know about the platform.</p>
                    </div>
                    <FAQItem
                        question="How long does it take to get paid?"
                        answer="We offer daily settlements. Once an event is completed, payouts are typically processed within 24-48 hours directly to your bank account or mobile wallet."
                    />
                    <FAQItem
                        question="What are the platform fees?"
                        answer="We charge a standard 10% commission on every ticket sold. This includes payment processing fees and platform usage. There are zero upfront costs."
                    />
                    <FAQItem
                        question="Can I scan tickets offline?"
                        answer="Yes! Our mobile scanner app supports offline validation for areas with poor connectivity. Once you're back online, the data syncs automatically."
                    />
                    <FAQItem
                        question="Is identity verification required?"
                        answer="Yes, all organizers must undergo a business or identity verification process to ensure a safe marketplace for ticket buyers."
                    />
                </div>
            </section>

            {/* 5. Footer */}
            <footer style={{ padding: '8rem 0 4rem', borderTop: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '5rem' }}>
                        <div style={{ flex: '1 1 350px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <Ticket color="#8B5CF6" size={40} />
                                <span style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.05em' }}>ET-TICKETS</span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '350px', fontSize: '1.1rem', lineHeight: 1.6 }}>
                                Ethiopia's leading digital ticketing platform. Empowering event organizers with technology that works.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '5rem', flexWrap: 'wrap' }}>
                            <div>
                                <h5 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Platform</h5>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '1rem' }}>Features</a></li>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '1rem' }}>Pricing</a></li>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '1rem' }}>Case Studies</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Support</h5>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '1rem' }}>Help Center</a></li>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '1rem' }}>Contact Us</a></li>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '1rem' }}>System Status</a></li>
                                </ul>
                            </div>
                        </div>

                        <div style={{ flex: '0 0 auto' }}>
                            <div className="glass" style={{ display: 'flex', padding: '0.5rem', borderRadius: '14px' }}>
                                <button style={{
                                    background: 'var(--primary)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem',
                                    fontWeight: 800
                                }}>EN</button>
                                <button style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.4)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem',
                                    fontWeight: 800
                                }}>AM</button>
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '6rem', paddingTop: '3rem', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1rem', fontWeight: 600 }}>
                            © 2025 ET-TICKETS PLATFORM. ALL RIGHTS RESERVED.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default OrganizerLanding;
