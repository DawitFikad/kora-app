import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { BookOpen, Shield } from 'lucide-react';

const HelpCenterPage: React.FC = () => {
    return (
        <PublicPageLayout title="Help Center">
            <div style={{ color: 'var(--text-main)', lineHeight: 1.8 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '3rem' }}>
                    Find answers to frequently asked questions and learn how to make the most of KORA.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <BookOpen size={22} color="var(--primary)" />
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>For Attendees</h3>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <li className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                                <strong>How do I buy a ticket?</strong>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Find an event, select your tier, and pay via Chapa or Telebirr. Your QR ticket will appear in "My Tickets".</p>
                            </li>
                            <li className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                                <strong>What if I don't receive my ticket?</strong>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>First, check your transaction history. If it shows "Paid" but no ticket is visible, contact support immediately.</p>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <Shield size={22} color="#10B981" />
                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>For Organizers</h3>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <li className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                                <strong>How long does event approval take?</strong>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Most events are reviewed within 4-12 hours. We check for image quality and accurate info.</p>
                            </li>
                            <li className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                                <strong>When do I get paid?</strong>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Payouts are processed 48-72 hours after the event successfully concludes, ensuring all attendee issues are resolved.</p>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </PublicPageLayout>
    );
};

export default HelpCenterPage;
