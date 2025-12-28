import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Send, CheckCircle2, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useToast } from '../../../core/components/Toast';

const FAQS = [
    { q: 'How do I set up local bank payouts?', a: 'Go to Settings > Financials to link your bank account or mobile money wallet (Telebirr, CBE).' },
    { q: 'What is the ticket validation process?', a: 'Download our Mobile Scanner App or use the "Scanner" tab in this dashboard to validate QR codes at the gate.' },
    { q: 'How to handle refund requests?', a: 'Refunds must be approved manually. Contact support if you need to process a bulk refund.' },
    { q: 'Integrating third-party tracking pixels', a: 'Currently we support Facebook Pixel and Google Analytics. Add your IDs in Event Settings.' },
    { q: 'Organizer verification requirements', a: 'You need to upload a valid business license or ID. Verification takes 1-2 business days.' }
];

export const SupportView = () => {
    const toast = useToast();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const handleSubmit = async () => {
        if (!subject.trim() || !message.trim()) {
            toast.error("Please fill in all fields.");
            return;
        }

        setStatus('sending');
        try {
            await OrganizerService.contactSupport({ subject, message });
            setStatus('success');
            toast.success("Message sent! We'll reply shortly.");
            setSubject('');
            setMessage('');
        } catch (error: any) {
            console.error('Support form error:', error);
            const errorMessage = error?.error || error?.message || "Failed to send message. Please try again.";
            toast.error(errorMessage);
            setStatus('idle');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PageHeader title="Support & Help Center" subtitle="Get help with your account or report an issue." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Contact Form */}
                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageSquare size={20} color="var(--primary-blue)" /> Contact Support
                    </h3>

                    {status === 'success' ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <CheckCircle2 size={40} color="#10B981" />
                            </div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981' }}>Message Sent!</h4>
                            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Our team will contact you via email within 24 hours.</p>
                            <button onClick={() => setStatus('idle')} className="btn-ghost" style={{ marginTop: '24px' }}>Send Another</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Subject</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Payout Delay"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Message</label>
                                <textarea
                                    rows={6}
                                    placeholder="Describe your issue in detail..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', resize: 'none', outline: 'none' }}
                                />
                            </div>
                            <button
                                className="btn-blue"
                                onClick={handleSubmit}
                                disabled={status === 'sending'}
                                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                            >
                                {status === 'sending' ? <Loader2 className="animate-spin" /> : <>Send Message <Send size={16} /></>}
                            </button>
                        </div>
                    )}
                </div>

                {/* FAQ Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="stat-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertCircle size={20} color="#FBBF24" /> Frequently Asked Questions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {FAQS.map((item, i) => (
                                <div
                                    key={i}
                                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                    style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: expandedFaq === i ? 'var(--text-main)' : 'var(--text-muted)' }}>{item.q}</span>
                                        {expandedFaq === i ? <ChevronDown size={16} color="var(--text-main)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                                    </div>
                                    <AnimatePresence>
                                        {expandedFaq === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <p style={{ paddingTop: '12px', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                                    {item.a}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="stat-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(29, 144, 245, 0.1), rgba(29, 144, 245, 0.05))', border: '1px solid rgba(29, 144, 245, 0.2)' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1D90F5', marginBottom: '8px' }}>Need Urgent Help?</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Call our support line directly.</p>
                        <a href="tel:+251911000000" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 700, textDecoration: 'none' }}>
                            📞 +251 911 000 000
                        </a>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
