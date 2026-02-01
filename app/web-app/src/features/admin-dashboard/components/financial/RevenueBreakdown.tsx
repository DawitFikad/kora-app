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

    // Display data from live API
    const commission = data.commissionTotal ?? '—';
    const convenience = data.convenienceTotal ?? '—';
    const adjustments = data.adjustmentsTotal ?? '—';

    return (
        <div>
            <h2>Platform Revenue</h2>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 8 }}>
                    <strong>Commission</strong>
                    <div>{commission}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 8 }}>
                    <strong>Convenience Fees</strong>
                    <div>{convenience}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 8 }}>
                    <strong>Adjustments</strong>
                    <div>{adjustments}</div>
                </div>
            </div>
        </div>
    );
};

export default RevenueBreakdown;
