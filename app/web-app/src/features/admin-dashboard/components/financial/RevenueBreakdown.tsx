import React, { useEffect, useState } from 'react';
import { AdminService } from '../../../../core/api/admin.service';
import ReadOnlyBanner from './ReadOnlyBanner';
import { PAYMENTS_LIVE, PLATFORM_REVENUE_OVERRIDES } from './financialConfig';

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

    // If payments are not live, prefer overrides for audit-safe display
    const commission = PAYMENTS_LIVE ? (data.commissionTotal ?? '—') : PLATFORM_REVENUE_OVERRIDES.commissionTotal;
    const convenience = PAYMENTS_LIVE ? (data.convenienceTotal ?? '—') : PLATFORM_REVENUE_OVERRIDES.convenienceTotal;
    const adjustments = PAYMENTS_LIVE ? (data.adjustmentsTotal ?? '—') : PLATFORM_REVENUE_OVERRIDES.adjustmentsTotal;

    return (
        <div>
            <ReadOnlyBanner message={PAYMENTS_LIVE ? 'Platform revenue is live from API.' : 'Platform revenue uses audit-safe overrides until payments are live.'} />
            <h2>Platform Revenue <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>{PAYMENTS_LIVE ? '(live API)' : '(audit-safe)'}</span></h2>
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
