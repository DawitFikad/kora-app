import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { Mail, Phone, Clock, MessageSquare } from 'lucide-react';

const SupportPage: React.FC = () => {
    return (
        <PublicPageLayout title="Support Center">
            <div style={{ color: 'var(--text-main)', lineHeight: 1.8 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2.5rem' }}>
                    Need help with your tickets, account, or an event? Our dedicated support team is available to assist you.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                        <Mail color="var(--primary)" style={{ marginBottom: '1rem' }} />
                        <h4 style={{ margin: '0 0 0.5rem' }}>Email Us</h4>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>support@et-tickets.com</p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Response within 24 hours</p>
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                        <Phone color="#10B981" style={{ marginBottom: '1rem' }} />
                        <h4 style={{ margin: '0 0 0.5rem' }}>Call Support</h4>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>+251 911 223 344</p>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mon–Sat, 8am – 6pm</p>
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                        <Clock color="#F59E0B" style={{ marginBottom: '1rem' }} />
                        <h4 style={{ margin: '0 0 0.5rem' }}>Business Hours</h4>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monday – Friday: 8am – 6pm</p>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Saturday: 9am – 4pm</p>
                    </div>
                </div>

                <div style={{ background: 'rgba(29, 144, 245, 0.05)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(29, 144, 245, 0.2)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <MessageSquare size={24} color="var(--primary)" />
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800 }}>Common Support Topics</h3>
                            <ul style={{ paddingLeft: '1.5rem', margin: '1rem 0 0' }}>
                                <li>Ticket not received after payment</li>
                                <li>Payment failed or pending status</li>
                                <li>How to join as an organizer</li>
                                <li>Refund requests for cancelled events</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </PublicPageLayout>
    );
};

export default SupportPage;
