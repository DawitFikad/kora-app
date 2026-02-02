import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';

const OrganizerAgreementPage: React.FC = () => {
    return (
        <PublicPageLayout title="Organizer Agreement">
            <div style={{ color: 'var(--text-main)', lineHeight: 1.8 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
                    This agreement governs the relationship between event organizers and the ET-TICKETS platform.
                </p>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>1. Verification and Approval</h3>
                    <p>All organizers must undergo a verification process by providing valid business licenses or identity documents. ET-TICKETS reserves the right to reject any organizer profile that does not meet our safety standards.</p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>2. Event Listing Standards</h3>
                    <p>Organizers are responsible for providing high-quality cover images, accurate descriptions, and correct venue details. Misleading information may result in event cancellation and account suspension.</p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>3. Payouts and Fees</h3>
                    <p>ET-TICKETS charges a platform fee for each ticket sold. Net proceeds are settled to the organizer's designated bank account after the event has successfully concluded, typically within 3 business days.</p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>4. Attendee Privacy</h3>
                    <p>Organizers may only use attendee data for event-related communication. Selling or sharing attendee data with third parties is strictly prohibited.</p>
                </section>

                <section>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>5. Compliance</h3>
                    <p>Organizers must comply with all local tax regulations and public safety requirements for their events. ET-TICKETS is a facilitator and does not take responsibility for the physical execution of the event.</p>
                </section>
            </div>
        </PublicPageLayout>
    );
};

export default OrganizerAgreementPage;
