import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';

const SupportPage: React.FC = () => {
    return (
        <PublicPageLayout title="Support">
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                Need help with tickets, payments, or organizer verification? We’re here to help.
            </p>
            <ul style={{ marginTop: '1.5rem', color: 'var(--text-main)', lineHeight: 1.8 }}>
                <li>Email: support@et-tickets.com</li>
                <li>Phone: +251 9XX XXX XXX</li>
                <li>Hours: Mon–Sat, 8:00 AM – 6:00 PM (EAT)</li>
            </ul>
        </PublicPageLayout>
    );
};

export default SupportPage;
