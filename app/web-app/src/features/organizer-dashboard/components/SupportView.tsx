import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Send, CheckCircle2, Loader2, MessageSquare, AlertCircle, BookOpen, Sparkles, Headset, ShieldAlert } from 'lucide-react';
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

const HELP_ARTICLES = [
    { title: 'Payouts & Withdrawals', tag: 'Finance', summary: 'Understand payout timelines, fees, and payout methods.' },
    { title: 'Ticket Validation Guide', tag: 'Operations', summary: 'How to scan tickets, handle offline mode, and resolve errors.' },
    { title: 'Refunds & Cancellations', tag: 'Policy', summary: 'Best practices for refunds and event cancellations.' },
    { title: 'Promotion & Promo Codes', tag: 'Marketing', summary: 'Create effective promo codes and measure performance.' },
    { title: 'Organizer Verification', tag: 'Compliance', summary: 'Required documents and approval timelines.' }
];

export const SupportView = () => {
    const toast = useToast();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [helpSearch, setHelpSearch] = useState('');
    const [events, setEvents] = useState<any[]>([]);
    const [priority, setPriority] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string>('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await OrganizerService.getMyEvents();
                const data = (res as any)?.data?.data || (res as any)?.data || [];
                setEvents(Array.isArray(data) ? data : []);
            } catch {
                setEvents([]);
            }
        };
        fetchEvents();
    }, []);

    const selectedEvent = events.find((e: any) => String(e.id) === String(selectedEventId));

    const suggestions = useMemo(() => {
        const text = `${subject} ${message}`.toLowerCase();
        if (!text.trim()) return [];
        return FAQS.filter(f => f.q.toLowerCase().includes(text) || f.a.toLowerCase().includes(text)).slice(0, 2);
    }, [subject, message]);

    const filteredArticles = useMemo(() => {
        const q = helpSearch.toLowerCase().trim();
        if (!q) return HELP_ARTICLES;
        return HELP_ARTICLES.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q));
    }, [helpSearch]);

    const handleSubmit = async () => {
        if (!subject.trim() || !message.trim()) {
            toast.error("Please fill in all fields.");
            return;
        }

        setStatus('sending');
        try {
            const prefix = priority ? '[PRIORITY]' : '[STANDARD]';
            const eventLabel = selectedEvent ? ` | Event: ${selectedEvent.title}` : '';
            await OrganizerService.contactSupport({ subject: `${prefix} ${subject}${eventLabel}`, message });
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
            <PageHeader title="Support & Help Center" subtitle="Self-serve help, smart answers, and priority support for live events." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Contact Form */}
                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageSquare size={20} color="var(--primary-blue)" /> Contact Support
                    </h3>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Event (optional)</label>
                            <select
                                className="support-select"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px', borderRadius: '10px', color: 'var(--text-main)' }}
                            >
                                <option value="">Select event</option>
                                {events.map((e: any) => (
                                    <option key={e.id} value={e.id}>{e.title}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ minWidth: '180px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Priority</label>
                            <button
                                onClick={() => setPriority(!priority)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '10px',
                                    border: priority ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)',
                                    background: priority ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-subtle)',
                                    color: priority ? '#EF4444' : 'var(--text-main)',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                <ShieldAlert size={14} /> {priority ? 'Live Event' : 'Standard'}
                            </button>
                        </div>
                    </div>

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
                    {/* Help Center */}
                    <div className="stat-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <BookOpen size={20} color="#FF0000" /> Help Center Articles
                        </h3>
                        <input
                            type="text"
                            placeholder="Search help articles..."
                            value={helpSearch}
                            onChange={(e) => setHelpSearch(e.target.value)}
                            style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '10px', color: 'var(--text-main)', marginBottom: '16px' }}
                        />
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {filteredArticles.map((article, i) => (
                                <div key={i} style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{article.title}</h4>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FF0000' }}>{article.tag}</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{article.summary}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Smart Suggestions */}
                    <div className="stat-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={18} color="#10B981" /> Smart Answers
                        </h3>
                        {suggestions.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Start typing your issue to see suggested answers.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {suggestions.map((s, i) => (
                                    <div key={i} style={{ padding: '12px', borderRadius: '10px', border: '1px dashed rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)' }}>
                                        <p style={{ fontWeight: 700, marginBottom: '6px' }}>{s.q}</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.a}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

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

                    <div className="stat-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 0, 0, 0.05))', border: '1px solid rgba(255, 0, 0, 0.2)' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FF0000', marginBottom: '8px' }}>Need Urgent Help?</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Call our support line directly.</p>
                        <a href="tel:+251911000000" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 700, textDecoration: 'none' }}>
                            📞 +251 911 000 000
                        </a>
                    </div>

                    <div className="stat-card" style={{ padding: '20px', border: '1px dashed rgba(255, 0, 0, 0.3)' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Headset size={16} color="#FF0000" /> Live Chat (Coming Soon)
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>We’re building in‑dashboard chat for faster support.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
