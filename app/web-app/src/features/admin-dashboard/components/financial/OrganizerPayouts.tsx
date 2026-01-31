import React, { useEffect, useState } from 'react';
import { AdminService } from '../../../../core/api/admin.service';

export const OrganizerPayouts: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState<any>({ available: [], pending: [], paid: [] });

    useEffect(() => {
        let mounted = true;
        AdminService.getOrganizerPayouts()
            .then((res: any) => { if (mounted) setPayouts(res?.data || res || {}); })
            .catch(() => setPayouts({ available: [], pending: [], paid: [] }))
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false };
    }, []);

    if (loading) return <div>Loading payouts...</div>;

    return (
        <div>
            <h2>Organizer Payouts</h2>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <h4>Available Balance</h4>
                    <table style={{ width: '100%' }}>
                        <thead><tr><th>Organizer</th><th>Available</th></tr></thead>
                        <tbody>
                            {payouts.available?.length === 0 && <tr><td colSpan={2}>None</td></tr>}
                            {payouts.available?.map((r: any, i: number) => (
                                <tr key={i}><td>{r.organizer}</td><td>{r.available}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ flex: 1 }}>
                    <h4>Pending Settlement</h4>
                    <table style={{ width: '100%' }}>
                        <thead><tr><th>Organizer</th><th>Amount</th></tr></thead>
                        <tbody>
                            {payouts.pending?.length === 0 && <tr><td colSpan={2}>None</td></tr>}
                            {payouts.pending?.map((r: any, i: number) => (
                                <tr key={i}><td>{r.organizer}</td><td>{r.amount}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ flex: 1 }}>
                    <h4>Paid History</h4>
                    <table style={{ width: '100%' }}>
                        <thead><tr><th>Batch ID</th><th>Amount</th><th>Date</th></tr></thead>
                        <tbody>
                            {payouts.paid?.length === 0 && <tr><td colSpan={3}>None</td></tr>}
                            {payouts.paid?.map((r: any, i: number) => (
                                <tr key={i}><td>{r.batchId}</td><td>{r.amount}</td><td>{r.date}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrganizerPayouts;
