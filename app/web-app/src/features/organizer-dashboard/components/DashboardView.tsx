import { motion } from 'framer-motion';
import { MoreHorizontal, Ticket, Eye, Building2, TrendingUp, Megaphone, Users, Download } from 'lucide-react';
import { CreditCardIcon } from './CustomIcons';
import { PageHeader } from './PageHeader';

export const DashboardView = () => {
    const stats = [
        { label: 'Total Revenue', value: '$12,450', change: '+12% vs last week', icon: CreditCardIcon, bgColor: 'rgba(29, 144, 245, 0.1)', iconColor: '#1D90F5' },
        { label: 'Tickets Sold', value: '450 / 600', change: '+5% new sales', icon: Ticket, bgColor: 'rgba(251, 191, 36, 0.1)', iconColor: '#FBBF24' },
        { label: 'Page Views', value: '1,200', change: '+8% traffic increase', icon: Eye, bgColor: 'rgba(167, 139, 250, 0.1)', iconColor: '#A78BFA' },
        { label: 'Next Payout', value: '$3,200', change: 'Scheduled: Sept 15', icon: Building2, bgColor: 'rgba(236, 72, 153, 0.1)', iconColor: '#EC4899' },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Welcome back, Alex" subtitle="Here is what’s happening with your events today." />

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
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time sales performance</p>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <select style={{ background: '#161B22', border: '1px solid var(--border)', color: 'white', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, appearance: 'none', cursor: 'pointer', paddingRight: '40px' }}>
                                <option>Last 7 Days</option>
                            </select>
                            <MoreHorizontal size={14} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%) rotate(90deg)' }} />
                        </div>
                    </div>
                    <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px' }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flex: 1 }}>
                                <div style={{ width: '1px', height: '180px', background: 'rgba(255,255,255,0.03)' }} />
                                <span style={{ fontSize: '0.8rem', color: i === 4 ? 'white' : 'var(--text-muted)', fontWeight: 700 }}>{day}</span>
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
                            <div key={action.label} className="quick-action-btn" style={{
                                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                                borderRadius: '16px', padding: '24px 12px', textAlign: 'center', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
