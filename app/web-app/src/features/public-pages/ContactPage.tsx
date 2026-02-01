import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';

const ContactPage: React.FC = () => {
    return (
        <PublicPageLayout title="Contact Us">
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                For partnerships, media, or enterprise support, reach out directly.
            </p>
            <div style={{ marginTop: '1.5rem', color: 'var(--text-main)', lineHeight: 1.8 }}>
                <div>Email: support@et-tickets.com</div>
                <div>Phone: +251 911 223 344</div>
                <div>Address: Addis Ababa, Ethiopia</div>
            </div>
        </PublicPageLayout>
    );
};

export default ContactPage;
