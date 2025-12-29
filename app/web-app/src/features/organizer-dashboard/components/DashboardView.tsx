import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Ticket, Building2, TrendingUp, Megaphone, Users, Download, Loader2, DollarSign } from 'lucide-react';
import { CreditCardIcon } from './CustomIcons';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';

export const DashboardView = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
    const [stats, setStats] = useState<any[]>([]);
    const [velocity, setVelocity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await OrganizerService.getOverview();
                const data = response.data;

                const formattedStats = [
                    { label: 'Gross Sales', value: `ETB ${data.grossVolume.toLocaleString()}`, change: 'Total ticket value', icon: DollarSign, bgColor: 'rgba(16, 185, 129, 0.1)', iconColor: '#10B981' },
                    { label: 'Net Earnings', value: `ETB ${data.totalRevenue.toLocaleString()}`, change: 'After platform fees', icon: CreditCardIcon, bgColor: 'rgba(29, 144, 245, 0.1)', iconColor: '#1D90F5' },
                    { label: 'Tickets Sold', value: `${data.ticketsSold} / ${data.totalCapacity}`, change: `${data.totalCapacity > 0 ? ((data.ticketsSold / data.totalCapacity) * 100).toFixed(1) : 0}% sold`, icon: Ticket, bgColor: 'rgba(251, 191, 36, 0.1)', iconColor: '#FBBF24' },
                    { label: 'Checked In', value: data.totalCheckIns?.toLocaleString() || '0', change: `${data.totalCheckIns > 0 && data.ticketsSold > 0 ? ((data.totalCheckIns / data.ticketsSold) * 100).toFixed(1) : 0}% of sold`, icon: Users, bgColor: 'rgba(167, 139, 250, 0.1)', iconColor: '#A78BFA' },
                    { label: 'Available Payout', value: `ETB ${data.nextPayout.toLocaleString()}`, change: 'Ready for withdrawal', icon: Building2, bgColor: 'rgba(236, 72, 153, 0.1)', iconColor: '#EC4899' },
                ];

                setStats(formattedStats);
                setVelocity(data.salesVelocity);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleQuickAction = (action: string) => {
        switch (action) {
            case 'Promotions': onNavigate?.('Promotions'); break;
            case 'Ticket Types': onNavigate?.('Tickets'); break;
            case 'Set Capacity': onNavigate?.('Tickets'); break;
            case 'Gen. Report': onNavigate?.('Payments'); break;
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Welcome back" subtitle="Here is what’s happening with your events today." />

            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <MoreHorizontal size={20} color="#57606A" style={{ position: 'absolute', top: 24, right: 24, cursor: 'pointer' }} />
                        <div className="stat-icon-box" style={{ background: stat.bgColor, color: stat.iconColor }}>
                            <stat.icon size={22} color={stat.iconColor} strokeWidth={2.5} />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>{stat.label}</p>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px' }}>{stat.value}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: i === 3 ? 'var(--text-muted)' : '#10B981' }}>
                            {i !== 3 && <TrendingUp size={14} />}
                            {stat.change}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div className="stat-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Ticket Sales Velocity</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Last 7 days performance</p>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <select style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, appearance: 'none', cursor: 'pointer', paddingRight: '40px' }}>
                                <option>Last 7 Days</option>
                            </select>
                            <MoreHorizontal size={14} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%) rotate(90deg)' }} color="var(--text-muted)" />
                        </div>
                    </div>
                    <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px' }}>
                        {velocity.map((v, i) => (
                            <div key={v.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flex: 1 }}>
                                <div style={{
                                    width: '12px',
                                    height: `${Math.max((v.count / (Math.max(...velocity.map(val => val.count)) || 1)) * 180, 5)}px`,
                                    background: 'var(--bg-active)',
                                    borderRadius: '4px 4px 0 0',
                                    opacity: 0.8
                                }} />
                                <span style={{ fontSize: '0.8rem', color: i === 6 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 700 }}>{v.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '28px' }}>Quick Actions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        {[
                            { label: 'Promotions', icon: Megaphone },
                            { label: 'Ticket Types', icon: Ticket },
                            { label: 'Set Capacity', icon: Users },
                            { label: 'Gen. Report', icon: Download },
                        ].map((action) => (
                            <div
                                key={action.label}
                                onClick={() => handleQuickAction(action.label)}
                                className="quick-action-btn" style={{
                                    background: 'var(--bg-hover)', border: '1px solid var(--border)',
                                    borderRadius: '16px', padding: '24px 12px', textAlign: 'center', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}>
                                <div style={{ width: '42px', height: '42px', background: 'var(--bg-subtle)', borderRadius: '12px', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <action.icon size={20} color="#8E9BAE" />
                                </div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>{action.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
