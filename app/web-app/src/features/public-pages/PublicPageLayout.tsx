import React from 'react';
import { Link } from 'react-router-dom';

interface PublicPageLayoutProps {
    title: string;
    children: React.ReactNode;
}

export const PublicPageLayout: React.FC<PublicPageLayoutProps> = ({ title, children }) => {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '6rem 0' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 700 }}>
                    ← Back to Home
                </Link>
                <h1 style={{ fontSize: '2.6rem', fontWeight: 900, margin: '1.5rem 0 1rem', color: 'var(--text-main)' }}>
                    {title}
                </h1>
                <div className="glass" style={{ padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};
