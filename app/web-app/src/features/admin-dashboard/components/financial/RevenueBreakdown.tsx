import React, { useEffect, useState } from 'react';
import { AdminService } from '../../../../core/api/admin.service';

export const RevenueBreakdown: React.FC = () => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        let mounted = true;
        AdminService.getPlatformRevenue({ range: '30d' })
            .then((res: any) => { if (mounted) setData(res?.data || res); })
            .catch(() => setData(null));
        return () => { mounted = false };
    }, []);

    if (!data) return <div>Loading revenue breakdown...</div>;

    return (
        <div>
            <h2>Platform Revenue</h2>
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
