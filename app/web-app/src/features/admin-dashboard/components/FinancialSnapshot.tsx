import React from 'react';
import { useTranslation } from 'react-i18next';

export const FinancialSnapshot: React.FC<{
    gmvToday: number;
    ticketsToday: number;
    revenueToday: number;
    change?: { gmv?: number; revenue?: number };
    onAdjustCommission?: () => void;
    onFeatureEvent?: () => void;
}> = ({ gmvToday, ticketsToday, revenueToday, change = {}, onAdjustCommission, onFeatureEvent }) => {
    const { t } = useTranslation();
    const fmt = (v: number) => v.toLocaleString();

    const smallStat = (label: string, value: React.ReactNode, subValue?: string, isCurrency: boolean = false) => (
        <div style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {isCurrency && <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>ETB</span>}
                <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-main)' }}>{value}</div>
            </div>
            {subValue && <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>{subValue}</div>}
        </div>
    );

    return (
        <div style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '4px' }}>{t('admin.overview.liquidity_snapshot')}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin.overview.liquidity_desc')}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={onAdjustCommission}
                        style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    >
                        {t('admin.overview.adjust_commission')}
                    </button>
                    <button
                        onClick={onFeatureEvent}
                        style={{ padding: '8px 14px', borderRadius: '10px', background: '#FF0000', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                    >
                        {t('admin.overview.feature_event')}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
                {smallStat(t('admin.total_gmv') + ' ' + t('admin.overview.active_now'), fmt(gmvToday), change.gmv != null ? `${change.gmv > 0 ? '↑' : '↓'} ${Math.abs(change.gmv)}% ${t('admin.overview.vs_yesterday')}` : undefined, true)}
                {smallStat(t('admin.active_users'), fmt(ticketsToday), `${fmt(ticketsToday * 1.2)} ${t('admin.overview.velocity_index')}`)}
                {smallStat(t('admin.platform_commission'), fmt(revenueToday), change.revenue != null ? `${change.revenue > 0 ? '↑' : '↓'} ${Math.abs(change.revenue)}% ${t('admin.overview.vs_yesterday')}` : undefined, true)}
            </div>

            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>{t('admin.overview.financial_stable')}</span>
            </div>
        </div>
    );
};

export default FinancialSnapshot;
