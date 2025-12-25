import React from 'react';

export const AdminPageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>{title}</h1>
            {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: '12px' }}>{actions}</div>}
    </div>
);
