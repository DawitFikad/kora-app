import React from 'react';
import { useTranslation } from 'react-i18next';

export const PendingActionsCard: React.FC<{
    pendingOrganizers: number;
    pendingEvents: number;
    pendingRefunds?: number;
    onOpenOrganizers?: () => void;
    onOpenEvents?: () => void;
    onOpenRefunds?: () => void;
}> = ({ pendingOrganizers, pendingEvents, pendingRefunds = 0, onOpenOrganizers, onOpenEvents, onOpenRefunds }) => {
    const { t } = useTranslation();
    const item = (label: string, count: number, onClick?: () => void, color: string = 'var(--text-main)') => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color }}>{label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin.overview.triage_required')}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: count > 0 ? (label.includes('Refund') ? '#EF4444' : '#F59E0B') : 'var(--text-muted)' }}>{count}</div>
                <button
                    onClick={onClick}
                    style={{
                        fontSize: '0.7rem',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-subtle)',
                        cursor: 'pointer',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                >
                    {t('admin.overview.review')}
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '2px' }}>{t('admin.overview.operational_triage')}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin.overview.triage_desc')}</p>
                </div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: (pendingOrganizers + pendingEvents + pendingRefunds > 0) ? '#F59E0B' : '#10B981' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {item(t('admin.sidebar.organizers_nav'), pendingOrganizers, onOpenOrganizers)}
                {item(t('admin.sidebar.events_nav'), pendingEvents, onOpenEvents)}
                {item(t('admin.overview.refund_requests'), pendingRefunds, onOpenRefunds, '#EF4444')}
            </div>
        </div>
    );
};
