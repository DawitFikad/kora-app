import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';

const TermsPage: React.FC = () => {
    return (
        <PublicPageLayout title="Terms of Service">
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                By using ET-TICKETS, you agree to our platform rules, payment policies, and organizer verification standards.
            </p>
            <ol style={{ marginTop: '1.5rem', color: 'var(--text-main)', lineHeight: 1.8 }}>
                <li>All events must be approved by admins before public listing.</li>
                <li>Ticket purchases are final unless the event is cancelled or rescheduled.</li>
                <li>Users must present a valid QR ticket at entry.</li>
                <li>Organizers are responsible for the accuracy of event details.</li>
            </ol>
        </PublicPageLayout>
    );
};

export default TermsPage;
