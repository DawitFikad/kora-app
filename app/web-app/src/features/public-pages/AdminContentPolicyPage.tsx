import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';

const AdminContentPolicyPage: React.FC = () => {
    return (
        <PublicPageLayout title="Admin Content Policy">
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                Our admins review event content to ensure accuracy, compliance, and user safety.
            </p>
            <ul style={{ marginTop: '1.5rem', color: 'var(--text-main)', lineHeight: 1.8 }}>
                <li>Events must be truthful and comply with local laws.</li>
                <li>Misleading or fraudulent listings are removed.</li>
                <li>Admin decisions prioritize attendee safety and platform trust.</li>
            </ul>
        </PublicPageLayout>
    );
};

export default AdminContentPolicyPage;
