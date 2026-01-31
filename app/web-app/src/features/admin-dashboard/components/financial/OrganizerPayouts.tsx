import React, { useEffect, useState } from 'react';
import { AdminService } from '../../../../core/api/admin.service';
import ReadOnlyBanner from './ReadOnlyBanner';
import { PAYMENTS_LIVE } from './financialConfig';

const currency = (v: number) => v == null ? '\u2014' : Number(v).toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export const OrganizerPayouts: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState<any>({ available: [], pending: [], paid: [] });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setError(null);
        if (!PAYMENTS_LIVE) {
            // Audit-safe: do not call live payments API while payments are not live
            if (mounted) {
                setPayouts({ available: [], pending: [], paid: [], availableTotal: 0, pendingTotal: 0, paidTotal: 0 });
                setLoading(false);
            }
            return () => { mounted = false };
        }

        AdminService.getOrganizerPayouts()
            .then((res: any) => { if (mounted) setPayouts(res?.data || res || {}); })
            .catch((err: any) => { console.error('Payouts fetch failed', err); if (mounted) setError('Failed to load payouts'); })
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false };
    }, []);

    if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;
    if (loading) return <div>Loading payouts from API...</div>;

    return (
        <div>
            <ReadOnlyBanner message={PAYMENTS_LIVE ? 'Organizer payouts are live from API.' : 'Organizer payouts are audit-safe until payments are live.'} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Organizer Payouts <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>{PAYMENTS_LIVE ? '(live API)' : '(audit-safe)'}</span></h2>
                <div style={{ color: 'var(--text-muted)' }}>Immutable payout ledger • live balances</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 12 }}>
                <section style={{ padding: 16, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Available Balance</div>
                            <div style={{ fontSize: 20, fontWeight: 700 }}>{currency(payouts.availableTotal || payouts.available?.reduce((s: number, p: any) => s + (p.available || 0), 0))}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                        {payouts.available?.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No available balances</div>}
                        {payouts.available?.map((r: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 8, background: 'transparent' }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{r.organizerName || r.organizer || '—'}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.organizerId ? `ID ${r.organizerId}` : ''}</div>
                                </div>
                                <div style={{ fontWeight: 800 }}>{currency(r.available)}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section style={{ padding: 16, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending Settlement</div>
                            <div style={{ fontSize: 20, fontWeight: 700 }}>{currency(payouts.pendingTotal || payouts.pending?.reduce((s: number, p: any) => s + (p.amount || 0), 0))}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                        {payouts.pending?.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No pending settlements</div>}
                        {payouts.pending?.map((r: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 8 }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{r.organizerName || r.organizer || '—'}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.ticketsCount ? `${r.ticketsCount} tickets` : ''}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{ fontWeight: 800 }}>{currency(r.amount)}</div>
                                    <div style={{ fontSize: 12, padding: '4px 8px', borderRadius: 9999, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Awaiting</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section style={{ padding: 16, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Paid History</div>
                            <div style={{ fontSize: 20, fontWeight: 700 }}>{currency(payouts.paidTotal || payouts.paid?.reduce((s: number, p: any) => s + (p.amount || 0), 0))}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                        {payouts.paid?.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No paid batches</div>}
                        {payouts.paid?.map((r: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 8 }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{r.batchId || `#${r.id || '—'}`}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.settledAt ? new Date(r.settledAt).toLocaleDateString() : ''}</div>
                                </div>
                                <div style={{ fontWeight: 800 }}>{currency(r.amount)}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default OrganizerPayouts;
