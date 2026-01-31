import React from 'react';
import { PAYMENTS_LIVE } from './financialConfig';

export const ReadOnlyBanner: React.FC<{ message?: string }> = ({ message }) => {
    if (PAYMENTS_LIVE) return null;
    return (
        <div style={{ padding: 10, borderRadius: 8, background: 'linear-gradient(90deg, rgba(255,249,240,0.9), rgba(255,250,244,0.85))', border: '1px solid rgba(245,166,35,0.18)', color: 'var(--text-main)', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <strong style={{ color: 'var(--accent)' }}>Read-only mode</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{message || 'Payments not yet live — actions are disabled and views are audit-safe.'}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Audit-safe</div>
            </div>
        </div>
    );
};

export default ReadOnlyBanner;
