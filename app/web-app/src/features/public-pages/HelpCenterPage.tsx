import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';

const HelpCenterPage: React.FC = () => {
    return (
        <PublicPageLayout title="Help Center">
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                Find quick answers and self‑service guides for tickets, payments, and event access.
            </p>
            <div style={{ marginTop: '1.5rem', color: 'var(--text-main)', lineHeight: 1.8 }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Popular topics</h4>
                <ul>
                    <li>How to buy tickets</li>
                    <li>Payment methods (TeleBirr, CBE Birr, Amole)</li>
                    <li>Finding your QR ticket</li>
                    <li>Event cancellation and changes</li>
                </ul>
            </div>
        </PublicPageLayout>
    );
};

export default HelpCenterPage;
