import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { PageHeader } from './PageHeader';

export const SupportView = () => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PageHeader title="Support & Help Center" subtitle="Get help with your account or report an issue." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Contact Support</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Subject</label>
                            <input type="text" placeholder="e.g. Payout Delay" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Message</label>
                            <textarea rows={5} placeholder="Describe your issue..." style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white', resize: 'none' }} />
                        </div>
                        <button className="btn-blue" style={{ width: '100%', justifyContent: 'center' }}>Send Message</button>
                    </div>
                </div>

                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>FAQ Quick Links</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            'How do I set up local bank payouts?',
                            'What is the ticket validation process?',
                            'How to handle refund requests?',
                            'Integrating third-party tracking pixels',
                            'Organizer verification requirements'
                        ].map((q, i) => (
                            <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q}</span>
                                <ChevronRight size={16} color="var(--text-muted)" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
