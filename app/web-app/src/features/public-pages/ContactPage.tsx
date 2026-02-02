import React, { useState } from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { supportService } from '../../core/api/support.service';
import { useToast } from '../../core/components/Toast';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';

const ContactPage: React.FC = () => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await supportService.sendContactMessage(formData);
            showToast('Message sent successfully! We will get back to you soon.', 'success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err: any) {
            showToast(err.error || 'Failed to send message. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PublicPageLayout title="Contact Us">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginTop: '1rem' }}>
                {/* Contact Info */}
                <div>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '2rem' }}>
                        Have questions about an event, or need help with your tickets? Our team is ready to assist you.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(29, 144, 245, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Mail size={20} color="var(--primary)" />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Email Support</h4>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>support@et-tickets.com</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Phone size={20} color="#10B981" />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Phone</h4>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>+251 911 223 344</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MapPin size={20} color="#F59E0B" />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Office</h4>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bole, Addis Ababa, Ethiopia</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                                placeholder="Your full name"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                                placeholder="name@example.com"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Subject</label>
                            <input
                                type="text"
                                required
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                                placeholder="How can we help?"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Message</label>
                            <textarea
                                required
                                rows={4}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-main)', resize: 'none' }}
                                placeholder="Tell us more about your inquiry..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-blue"
                            style={{ width: '100%', padding: '1rem', justifyContent: 'center' }}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send Message</>}
                        </button>
                    </form>
                </div>
            </div>
        </PublicPageLayout>
    );
};

export default ContactPage;
