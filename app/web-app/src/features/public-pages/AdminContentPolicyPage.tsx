import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';

const AdminContentPolicyPage: React.FC = () => {
    return (
        <PublicPageLayout title="Admin Content Policy">
            <div style={{ color: 'var(--text-main)', lineHeight: 1.8 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
                    Guidelines for the review and approval of content on the ET-TICKETS platform.
                </p>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Objective</h3>
                    <p>Our goal is to maintain a safe, professional, and trustworthy environment for all users. Admin reviews are meant to filter out fraudulent, illegal, or substandard content.</p>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Prohibited Content</h3>
                    <ul style={{ paddingLeft: '1.5rem' }}>
                        <li>Illegal goods or services.</li>
                        <li>Explicit or adult-themed content.</li>
                        <li>Hate speech or discriminatory language.</li>
                        <li>High-risk financial schemes or non-existent events.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Review Process</h3>
                    <p>Each event submission is reviewed manually by our administration team. We check for image quality, description clarity, and organizer reputation. This process typically takes between 2 to 24 hours.</p>
                </section>

                <section>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Appeal Rights</h3>
                    <p>If your event is rejected, you will receive a specific reason in your organizer dashboard. You may address the issues and resubmit for a new review at no extra cost.</p>
                </section>
            </div>
        </PublicPageLayout>
    );
};

export default AdminContentPolicyPage;
