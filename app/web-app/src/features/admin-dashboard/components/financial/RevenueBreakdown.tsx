import React, { useEffect, useState } from 'react';
import { AdminService } from '../../../../core/api/admin.service';

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

    return (
        <div>
            <h2>Platform Revenue <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>(live API)</span></h2>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 8 }}>
                    <strong>Commission</strong>
                    <div>{data.commissionTotal ?? '—'}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 8 }}>
                    <strong>Convenience Fees</strong>
                    <div>{data.convenienceTotal ?? '—'}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 8 }}>
                    <strong>Adjustments</strong>
                    <div>{data.adjustmentsTotal ?? '—'}</div>
                </div>
            </div>
        </div>
    );
};

export default RevenueBreakdown;
