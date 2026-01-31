import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';

const OrganizerAgreementPage: React.FC = () => {
    return (
        <PublicPageLayout title="Organizer Agreement">
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                Organizers agree to maintain accurate event listings, comply with local regulations, and respect ticketing policies.
            </p>
            <ul style={{ marginTop: '1.5rem', color: 'var(--text-main)', lineHeight: 1.8 }}>
                <li>Provide valid business and contact information.</li>
                <li>Submit events for admin review before launch.</li>
                <li>Honor ticket tiers, prices, and capacity limits.</li>
                <li>Notify attendees of any changes or cancellations promptly.</li>
            </ul>
        </PublicPageLayout>
    );
};

export default OrganizerAgreementPage;
