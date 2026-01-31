import React from 'react';

export const FinancialSnapshot: React.FC<{
    gmvToday: number;
    ticketsToday: number;
    revenueToday: number;
    change?: { gmv?: number; revenue?: number };
    onAdjustCommission?: () => void;
    onFeatureEvent?: () => void;
}> = ({ gmvToday, ticketsToday, revenueToday, change = {}, onAdjustCommission, onFeatureEvent }) => {
    const fmt = (v: number) => v.toLocaleString();

    const smallStat = (label: string, value: React.ReactNode) => (
        <div style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace' }}>{value}</div>
        </div>
    );

    return (
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>Today Snapshot</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GMV, tickets and platform revenue (today)</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onAdjustCommission} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem' }}>Adjust commission</button>
                    <button onClick={onFeatureEvent} style={{ padding: '6px 10px', borderRadius: 8, background: '#3B82F6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>Feature event</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                {smallStat('GMV today', `ETB ${fmt(gmvToday)}`)}
                {smallStat('Tickets sold', fmt(ticketsToday))}
                {smallStat('Platform revenue', `ETB ${fmt(revenueToday)}`)}
            </div>

            <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span style={{ marginRight: 12 }}>GMV change: {change.gmv != null ? `${change.gmv > 0 ? '↑' : '↓'} ${Math.abs(change.gmv)}%` : '—'}</span>
                <span>Revenue change: {change.revenue != null ? `${change.revenue > 0 ? '↑' : '↓'} ${Math.abs(change.revenue)}%` : '—'}</span>
            </div>
        </div>
    );
};

export default FinancialSnapshot;
