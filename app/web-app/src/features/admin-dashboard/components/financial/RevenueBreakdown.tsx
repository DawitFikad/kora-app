import React, { useEffect, useState } from 'react';
import { AdminService } from '../../../../core/api/admin.service';

const currency = (v: number | string) => v === '—' ? v : `ETB ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const RevenueBreakdown: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setError(null);
        AdminService.getPlatformRevenue({ range: '30d' })
            .then((res: any) => { if (mounted) setData(res?.data || res); })
            .catch((err: any) => { console.error('Revenue fetch failed', err); if (mounted) setError('Failed to load revenue'); })
        return () => { mounted = false };
    }, []);

    if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;
    if (!data) return <div>Loading revenue breakdown from API...</div>;

    // Display data from live API
    const commission = data.commissionTotal ?? '—';
    const convenience = data.convenienceTotal ?? '—';
    const adjustments = data.adjustmentsTotal ?? '—';

    return (
        <div>
            <h2>Platform Revenue</h2>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Commission</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{currency(commission)}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Convenience Fees</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{currency(convenience)}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Adjustments</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{currency(adjustments)}</div>
                </div>
            </div>
        </div>
    );
};

export default RevenueBreakdown;
