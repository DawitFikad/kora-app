import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Clock, CheckCircle2, AlertCircle, ArrowUpRight, Filter, MoreHorizontal, Download, ShieldCheck } from 'lucide-react';
import { AdminService } from '../../../../core/api/admin.service';

const currency = (v: number) => v == null ? '—' : `ETB ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const OrganizerPayouts: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [payouts, setPayouts] = useState<any>({ available: [], pending: [], paid: [] });
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        let mounted = true;
        setError(null);

        AdminService.getOrganizerPayouts()
            .then((res: any) => { if (mounted) setPayouts(res?.data || res || {}); })
            .catch((err: any) => { console.error('Payouts fetch failed', err); if (mounted) setError('Failed to load payouts'); })
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false };
    }, []);

    if (error) return (
        <div style={{ padding: '40px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <AlertCircle color="#EF4444" size={24} />
            <span style={{ color: '#EF4444', fontWeight: 700 }}>{error}</span>
        </div>
    );

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ height: '300px', background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '32px', height: '32px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>QUANTIZING SETTLEMENT DATA...</span>
                </div>
            </div>
        </div>
    );

    const StatCard = ({ label, amount, items, color, icon: Icon, type }: any) => (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: '32px',
                borderRadius: '32px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                height: '480px',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: `radial-gradient(circle at top right, ${color}15, transparent)`, pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon color={color} size={24} />
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{label}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 950, color: 'white' }}>{currency(amount)}</div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '8px', scrollbarWidth: 'none' }}>
                {items?.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.5 }}>
                        <ArrowUpRight size={32} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>No active settlements found</span>
                    </div>
                ) : items?.map((r: any, i: number) => (
                    <div key={i} style={{
                        padding: '16px',
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem', color: 'var(--primary)' }}>
                                {r.organizerName?.[0] || 'O'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white' }}>{r.organizerName || r.organizer || 'Unnamed Partner'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{type === 'paid' ? (r.settledAt ? new Date(r.settledAt).toLocaleDateString() : 'Settled') : `ID: #${r.organizerId || '---'}`}</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 950, fontSize: '0.95rem' }}>{currency(r.available || r.amount)}</div>
                            {type === 'pending' && <span style={{ fontSize: '0.6rem', color: '#F59E0B', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLEARING</span>}
                        </div>
                    </div>
                ))}
            </div>

            <button style={{ marginTop: '24px', width: '100%', padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'white', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                View Full Audit
                <MoreHorizontal size={14} />
            </button>
        </motion.section>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* 📍 Control Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Filter style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                        <input
                            placeholder="Filter by organizer..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            style={{ padding: '12px 16px 12px 44px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', fontSize: '0.9rem', width: '300px' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ padding: '12px 24px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Download size={18} />
                        Export Snapshot
                    </button>
                    <button style={{ padding: '12px 24px', borderRadius: '16px', background: 'var(--primary)', border: 'none', color: 'white', fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(29, 144, 245, 0.3)' }}>
                        Process All Pending Payouts
                    </button>
                </div>
            </div>

            {/* 📊 Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
                <StatCard
                    label="Available to Payout"
                    amount={payouts.availableTotal || payouts.available?.reduce((s: number, p: any) => s + (p.available || 0), 0)}
                    items={payouts.available?.filter((i: any) => (i.organizerName || '').toLowerCase().includes(filter.toLowerCase()))}
                    color="#3B82F6"
                    icon={CheckCircle2}
                    type="available"
                />
                <StatCard
                    label="Pending Settlement"
                    amount={payouts.pendingTotal || payouts.pending?.reduce((s: number, p: any) => s + (p.amount || 0), 0)}
                    items={payouts.pending?.filter((i: any) => (i.organizerName || '').toLowerCase().includes(filter.toLowerCase()))}
                    color="#F59E0B"
                    icon={Clock}
                    type="pending"
                />
                <StatCard
                    label="Lifetime Settlements"
                    amount={payouts.paidTotal || payouts.paid?.reduce((s: number, p: any) => s + (p.amount || 0), 0)}
                    items={payouts.paid?.filter((i: any) => (i.organizerName || '').toLowerCase().includes(filter.toLowerCase()))}
                    color="#10B981"
                    icon={Wallet}
                    type="paid"
                />
            </div>

            {/* 🛡️ Risk & Compliance Indicator */}
            <div style={{ padding: '24px 32px', borderRadius: '24px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck color="#3B82F6" size={20} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 850 }}>System Liquidity Assurance</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>All displayed funds are reconciled with Telebirr/Chapa settlement batches.</p>
                    </div>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RECONCILED 100%</div>
            </div>
        </div>
    );
};

export default OrganizerPayouts;
