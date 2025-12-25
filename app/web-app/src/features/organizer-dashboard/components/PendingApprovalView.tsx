import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Clock,
    ShieldCheck,
    Rocket,
    BarChart,
    Zap,
    Users,
    Headphones
} from 'lucide-react';

export const PendingApprovalView = ({ user }: { user: any }) => {
    const features = [
        {
            icon: Rocket,
            title: "Pro Event Tools",
            desc: "Create complex ticket tiers, early bird discounts, and group packages."
        },
        {
            icon: BarChart,
            title: "Real-time Analytics",
            desc: "Track sales, demography, and traffic sources with our advanced dashboard."
        },
        {
            icon: ShieldCheck,
            title: "Secure Payments",
            desc: "Instant payouts via TeleBirr, CBE Birr, and Chapa with automated reconciliation."
        },
        {
            icon: Zap,
            title: "Smart QR Scanning",
            desc: "Validate tickets offline or online with our secure scanner mobile app."
        },
        {
            icon: Users,
            title: "Attendee Management",
            desc: "Communicate directly with your fans via SMS and Email notifications."
        },
        {
            icon: Headphones,
            title: "24/7 Support",
            desc: "Dedicated account manager to help you scale your events."
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="pending-container"
            style={{
                maxWidth: '1000px',
                margin: '40px auto',
                padding: '0 20px'
            }}
        >
            {/* Header Section */}
            <div className="glass" style={{
                padding: '60px 40px',
                borderRadius: '32px',
                textAlign: 'center',
                marginBottom: '40px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '-100px', right: '-100px',
                    width: '300px', height: '300px',
                    background: 'radial-gradient(circle, rgba(29, 144, 245, 0.1) 0%, transparent 70%)',
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 32px',
                        border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                        <Clock size={40} className="animate-pulse" color="#F59E0B" />
                    </div>

                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                        Welcome to the Family, <span className="text-gradient">{user.profile?.fullName?.split(' ')[0] || user.phoneNumber}</span>!
                    </h1>

                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}>
                        We've received your application to become a verified Organizer.
                        Our team typically reviews credentials within <span style={{ color: 'white', fontWeight: 700 }}>24 hours</span>.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <div style={{
                            padding: '12px 24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <CheckCircle2 size={18} color="#10B981" />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Registration Complete</span>
                        </div>
                        <div style={{
                            padding: '12px 24px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.05)',
                            border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <div className="spinner-small" />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#3B82F6' }}>Verification in Progress</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* What's Coming Section */}
            <div style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '32px', textAlign: 'center' }}>
                    What you'll get with ET-Ticket
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {features.map((f, i) => (
                        <div key={i} className="glass card-hover" style={{
                            padding: '32px',
                            borderRadius: '24px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{
                                width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '20px'
                            }}>
                                <f.icon size={24} color="#3B82F6" />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px' }}>{f.title}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Notice */}
            <div style={{
                textAlign: 'center',
                padding: '40px',
                borderTop: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: '0.9rem'
            }}>
                Need help faster? Reach our onboarding team at <span style={{ color: 'white' }}>support@et-ticket.com</span>
            </div>

            <style>{`
                .text-gradient {
                    background: linear-gradient(to right, #1D90F5, #D946EF);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .card-hover:hover {
                    background: rgba(255, 255, 255, 0.05) !important;
                    transform: translateY(-5px);
                    border-color: rgba(59, 130, 246, 0.3) !important;
                }
                .spinner-small {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(59, 130, 246, 0.2);
                    border-top-color: #3B82F6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </motion.div>
    );
};
