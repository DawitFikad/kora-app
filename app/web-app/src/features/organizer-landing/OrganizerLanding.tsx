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
    Layers
} from 'lucide-react';
import { motion } from 'framer-motion';

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
                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Login</button>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Create Account</button>
                </div>
            </div>
        </nav>
    );
};

const OrganizerLanding = () => {
    const navigate = useNavigate();

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
                        transition={{ duration: 0.6 }}
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
                            <Zap size={14} /> THE GOLD STANDARD FOR EVENT TICKETING
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', fontWeight: 900, lineHeight: 1, marginBottom: '2rem' }}>
                            Sell Tickets. Manage Events. <br />
                            <span className="gradient-text">Get Paid — All in One Platform.</span>
                        </h1>
                        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'rgba(255,255,255,0.6)', maxWidth: '800px', margin: '0 auto 3.5rem' }}>
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
            <section id="how-it-works" style={{ background: 'rgba(0,0,0,0.15)', padding: '6rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>Streamlined Workflow</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>From creation to validation, we've got you covered.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem' }}>
                        {[
                            { icon: Layers, title: 'Create Event', desc: 'Set up your event page, ticket tiers, and pricing in minutes.' },
                            { icon: ShieldCheck, title: 'Get Admin Approval', desc: 'Secure verification from our team to protect you and your fans.' },
                            { icon: Globe, title: 'Sell Tickets Online', desc: 'Accept payments via Telebirr, CBE Birr, and other local options.' },
                            { icon: ScanLine, title: 'Scan & Validate', desc: 'Use our mobile scanner app to verify tickets at the gate.' }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                style={{ textAlign: 'center' }}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    background: 'var(--primary)',
                                    borderRadius: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem',
                                    boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)'
                                }}>
                                    <step.icon color="white" size={28} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>{step.title}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Features Highlights */}
            <section id="features" style={{ padding: '8rem 0' }}>
                <div className="container">
                    <div style={{ display: 'flex', gap: '6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 500px' }}>
                            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '2.5rem' }}>
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
                                    <div key={i} style={{ display: 'flex', gap: '1.25rem' }}>
                                        <div style={{ color: 'var(--primary)', paddingTop: '0.25rem' }}><CheckCircle2 size={24} /></div>
                                        <div>
                                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{feat.title}</h4>
                                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: '1 1 400px' }}>
                            <div className="glass" style={{ padding: '3rem', borderRadius: '3rem', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    right: '-20px',
                                    width: '80px',
                                    height: '80px',
                                    background: 'linear-gradient(135deg, #8B5CF6, #D946EF)',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transform: 'rotate(12deg)'
                                }}>
                                    <BarChart3 color="white" size={40} />
                                </div>
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ height: '8px', width: '60%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '1rem' }} />
                                    <div style={{ height: '8px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>TODAY'S REVENUE</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 900 }}>ETB 24.5k</p>
                                    </div>
                                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>TICKETS SOLD</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 900 }}>842</p>
                                    </div>
                                </div>
                                <div style={{ height: '140px', width: '100%', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M0,80 Q25,20 50,60 T100,20 L100,100 L0,100 Z" fill="rgba(139, 92, 246, 0.2)" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Trust & Compliance */}
            <section style={{ padding: '4rem 0' }}>
                <div className="container">
                    <div className="glass" style={{ padding: '4rem', borderRadius: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1 }}>Trust built on <br />Compliance.</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>We operate with full transparency to ensure every event is a success.</p>
                            <button className="btn btn-secondary">Learn About Payouts</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                            {[
                                { title: 'Local Payment Integrations', desc: 'Secure settlement via Telebirr, CBE, and Amole.' },
                                { title: 'Secure Transactions', desc: 'End-to-end encryption for all payments.' },
                                { title: 'Admin-Approved Events Only', desc: 'A verified marketplace for genuine organizers.' },
                                { title: 'Transparent Fees', desc: 'No hidden costs. You know exactly what you take home.' }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <ShieldCheck color="#A78BFA" size={24} />
                                    <div>
                                        <span style={{ display: 'block', fontWeight: 700 }}>{item.title}</span>
                                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>{item.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Footer */}
            <footer style={{ padding: '6rem 0 3rem', borderTop: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4rem' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <Ticket color="#8B5CF6" size={32} />
                                <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.05em' }}>ET-TICKETS</span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '300px', fontSize: '0.95rem' }}>
                                Ethiopia's leading digital ticketing platform. Empowering event organizers with technology that works.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
                            <div>
                                <h5 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Platform</h5>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem' }}>Features</a></li>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem' }}>Pricing</a></li>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem' }}>Case Studies</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Support</h5>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem' }}>Help Center</a></li>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem' }}>Contact Us</a></li>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem' }}>System Status</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Legal</h5>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</a></li>
                                    <li><a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem' }}>Terms of Service</a></li>
                                </ul>
                            </div>
                        </div>

                        <div style={{ flex: '0 0 auto' }}>
                            <div className="glass" style={{ display: 'flex', padding: '0.4rem', borderRadius: '12px' }}>
                                <button style={{
                                    background: 'var(--primary)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: 800
                                }}>EN</button>
                                <button style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.4)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: 800
                                }}>AM</button>
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '4rem', paddingTop: '2rem', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                            © 2025 ET-TICKETS PLATFORM. ALL RIGHTS RESERVED.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default OrganizerLanding;
