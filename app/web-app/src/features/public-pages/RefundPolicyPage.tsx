import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';

const RefundPolicyPage: React.FC = () => {
    return (
        <PublicPageLayout title="Refund Policy">
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                Refunds depend on the organizer’s policy and event status. Always check the event page for the latest terms.
            </p>
            <ul style={{ marginTop: '1.5rem', color: 'var(--text-main)', lineHeight: 1.8 }}>
                <li>Cancelled events: automatic refund within 5–10 business days.</li>
                <li>Rescheduled events: tickets remain valid unless otherwise stated.</li>
                <li>Within 24 hours of event time: refunds may not be available.</li>
            </ul>
        </PublicPageLayout>
    );
};

export default RefundPolicyPage;
