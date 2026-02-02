import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';

const RefundPolicyPage: React.FC = () => {
    return (
        <PublicPageLayout title="Refund Policy">
            <div style={{ color: 'var(--text-main)', lineHeight: 1.8 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
                    Our refund policy is designed to balance the needs of both attendees and event organizers.
                </p>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>General Terms</h3>
                    <p>All ticket sales are considered final. By purchasing a ticket on ET-TICKETS, you acknowledge that tickets are non-refundable except under specific circumstances outlined below.</p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Event Cancellation</h3>
                    <p>If an event is cancelled in its entirety, a full refund of the ticket price will be issued to the original payment method (Telebirr or Bank Transfer) within 5–10 business days. Convenience fees may be non-refundable.</p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Rescheduling</h3>
                    <p>If an event is rescheduled, your ticket will remain valid for the new date. If you cannot attend the rescheduled date, you must request a refund within 72 hours of the announcement.</p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Organizer Policies</h3>
                    <p>Some organizers may offer more flexible refund policies. These will be clearly stated on the specific event page. In such cases, the organizer's specific policy takes precedence.</p>
                </section>

                <section>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>How to Request</h3>
                    <p>To request a refund for a cancelled or rescheduled event, please contact our support team at <strong style={{ color: 'var(--primary)' }}>support@et-tickets.com</strong> with your Ticket ID and purchase details.</p>
                </section>
            </div>
        </PublicPageLayout>
    );
};

export default RefundPolicyPage;
