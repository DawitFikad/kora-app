import React from 'react';

export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '6px', letterSpacing: '-0.02em' }}>{title}</h1>
            {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: '12px' }}>{actions}</div>}
    </div>
);
