import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';

const TermsPage: React.FC = () => {
    return (
        <PublicPageLayout title="Terms of Service">
            <div style={{ color: 'var(--text-main)', lineHeight: 1.8 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
                    Welcome to KORA. By accessing or using our platform, you agree to be bound by these Terms of Service.
                </p>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>1. Use of Service</h3>
                    <p>KORA provides a platform for event discovery and ticket management. You must use the service only for lawful purposes and in compliance with all applicable Ethiopian laws.</p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>2. Ticket Purchases</h3>
                    <p>All ticket sales are final. Once a purchase is confirmed via Chapa or Telebirr, the ticket is issued to your account and cannot be cancelled by the user. Refunds are only issued in the event of cancellation or significant rescheduling by the organizer.</p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>3. Organizer Responsibilities</h3>
                    <p>Organizers are responsible for the accuracy of event descriptions, pricing, and availability. KORA is not liable for changes made to events once listed, although we strive to verify all information.</p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>4. Security and Access</h3>
                    <p>You are responsible for maintaining the security of your account. Do not share your QR tickets with anyone, as they represent your unique entry right. KORA is not responsible for lost or stolen tickets used by unauthorized parties.</p>
                </section>

                <section>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>5. Limitation of Liability</h3>
                    <p>KORA is not liable for any direct or indirect damages resulting from event cancellations, technical failures, or actions of third-party organizers.</p>
                </section>
            </div>
        </PublicPageLayout>
    );
};

export default TermsPage;
