import React, { useEffect, useState } from 'react';
import { AdminService } from '../../../../core/api/admin.service';

const currency = (v: number) => v == null ? '—' : `ETB ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const OrganizerPayouts: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState<any>({ available: [], pending: [], paid: [] });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setError(null);

        AdminService.getOrganizerPayouts()
            .then((res: any) => { if (mounted) setPayouts(res?.data || res || {}); })
            .catch((err: any) => { console.error('Payouts fetch failed', err); if (mounted) setError('Failed to load payouts'); })
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false };
    }, []);

    if (error) return <div style={{ padding: '32px', color: '#EF4444', fontWeight: 800 }}>{error}</div>;
    if (loading) return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Querying liquidity providers...</div>;

    const StatCard = ({ label, amount, items, color, type }: any) => (
        <section style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: color || 'var(--text-main)', fontFamily: 'var(--font-mono, monospace)' }}>{currency(amount)}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {items?.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>No activity</div>
                ) : items?.map((r: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.02)' }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{r.organizerName || r.organizer || r.batchId || '—'}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{type === 'paid' ? (r.settledAt ? new Date(r.settledAt).toLocaleDateString() : 'Settled') : (r.organizerId ? `UID: ${r.organizerId}` : 'Awaiting Settlement')}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: '2px' }}>{currency(r.available || r.amount)}</div>
                            {type === 'pending' && <span style={{ fontSize: '0.6rem', color: '#F59E0B', fontWeight: 900 }}>IN CLEARING</span>}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Organizer Payouts</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Manage fund separation and settlement queues for partners.</p>
                </div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <StatCard
                    label="Available to Payout"
                    amount={payouts.availableTotal || payouts.available?.reduce((s: number, p: any) => s + (p.available || 0), 0)}
                    items={payouts.available}
                    color="#3B82F6"
                    type="available"
                />
                <StatCard
                    label="Pending Settlement"
                    amount={payouts.pendingTotal || payouts.pending?.reduce((s: number, p: any) => s + (p.amount || 0), 0)}
                    items={payouts.pending}
                    color="#F59E0B"
                    type="pending"
                />
                <StatCard
                    label="Lifetime Settlements"
                    amount={payouts.paidTotal || payouts.paid?.reduce((s: number, p: any) => s + (p.amount || 0), 0)}
                    items={payouts.paid}
                    color="#10B981"
                    type="paid"
                />
            </div>
        </div>
    );
};

export default OrganizerPayouts;
