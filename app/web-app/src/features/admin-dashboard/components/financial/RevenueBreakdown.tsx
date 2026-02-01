import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Percent, Zap, ShieldCheck, Info, RefreshCw, ArrowUpRight } from 'lucide-react';
import { AdminService } from '../../../../core/api/admin.service';

const currency = (v: number | string) => v === '—' ? v : `ETB ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const RevenueBreakdown: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res: any = await AdminService.getPlatformRevenue({ range: '30d' });
            setData(res?.data || res);
        } catch (err: any) {
            console.error('Revenue fetch failed', err);
            setError('Failed to reach revenue calculation node');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (error) return (
        <div style={{ padding: '40px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', fontWeight: 700 }}>
            {error}
        </div>
    );

    const commission = data?.commissionTotal ?? 0;
    const convenience = data?.convenienceTotal ?? 0;
    const adjustments = data?.adjustmentsTotal ?? 0;
    const netRevenue = commission + convenience + adjustments;

    const RevenueCard = ({ label, amount, icon: Icon, color, description }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: '32px',
                background: 'var(--bg-card)',
                borderRadius: '32px',
                border: '1px solid var(--border)',
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle at top right, ${color}10, transparent)`, pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon color={color} size={24} />
                </div>
                <ArrowUpRight size={20} color="var(--text-muted)" style={{ opacity: 0.5 }} />
            </div>

            <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{label}</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 950, margin: 0, color: 'white' }}>{currency(amount)}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px', fontWeight: 600 }}>{description}</p>
        </motion.div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* 📈 Revenue Summary Header */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                padding: '40px',
                borderRadius: '32px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 950 }}>Net Platform Revenue</h2>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Aggregate earnings from all platform sources (30d rolling).</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#3B82F6', textTransform: 'uppercase', marginBottom: '4px' }}>Consolidated Total</p>
                    <p style={{ fontSize: '2.4rem', fontWeight: 950, color: '#3B82F6', margin: 0 }}>{currency(netRevenue)}</p>
                </div>
            </div>

            {/* 🗃️ Revenue Categories */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <RevenueCard
                    label="Transaction Commission"
                    amount={commission}
                    icon={Percent}
                    color="#10B981"
                    description="Standard service fees from organizer ticket volume."
                />
                <RevenueCard
                    label="Convenience Fees"
                    amount={convenience}
                    icon={Zap}
                    color="#F59E0B"
                    description="Aggregate of per-ticket processing surcharges."
                />
                <RevenueCard
                    label="Operational Adjustments"
                    amount={adjustments}
                    icon={ShieldCheck}
                    color="#8B5CF6"
                    description="Net total of refunds, reversals, and disputed claims."
                />
            </div>

            {/* ℹ️ Protocol Information */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <Info size={20} color="var(--text-muted)" />
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    These figures are extracted from the **Audit-Signed Ledger** and include VAT where applicable. Data refreshes every 30 minutes.
                </p>
                <div style={{ flex: 1 }} />
                <button
                    onClick={fetchData}
                    disabled={loading}
                    style={{ padding: '8px 16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <RefreshCw size={14} className={loading ? 'infinite-rotate' : ''} />
                    {loading ? 'SYNCING...' : 'REFRESH NOW'}
                </button>
            </div>
        </div>
    );
};

export default RevenueBreakdown;
