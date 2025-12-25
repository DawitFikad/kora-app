import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign,
    TrendingUp,
    CheckCircle2,
    Calendar,
    Download,
    UserPlus,
    Activity,
    ShieldAlert,
    Loader2
} from 'lucide-react';
import { AdminService } from '../../../core/api/admin.service';

export const AdminOverview = () => {
    const [organizers, setOrganizers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingOrganizers: 0,
        pendingEvents: 0,
        totalGMV: 0,
        totalPayouts: 0,
        platformCommission: 0,
        totalTicketsSold: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const [orgsResponse, statsResponse]: any = await Promise.all([
                    AdminService.getPendingOrganizers(),
                    AdminService.getStats()
                ]);

                setOrganizers(orgsResponse.slice(0, 5));
                const kpis = statsResponse.kpis;

                setStats({
                    pendingOrganizers: kpis.pendingOrganizers,
                    pendingEvents: kpis.pendingEvents,
                    totalGMV: kpis.totalGMV,
                    totalPayouts: 0, // Payout logic needed later
                    platformCommission: kpis.platformCommission,
                    totalTicketsSold: kpis.totalTicketsSold
                });
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* 🟢 Top Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                    { label: 'Review Pending', sub: `${stats.pendingOrganizers + stats.pendingEvents} items waiting`, icon: ShieldAlert, color: '#3B82F6', iconBg: 'rgba(59, 130, 246, 0.1)' },
                    { label: 'Export Report', sub: 'CSV or PDF', icon: Download, color: '#A78BFA', iconBg: 'rgba(167, 139, 250, 0.1)' },
                    { label: 'Invite Admin', sub: 'Manage access', icon: UserPlus, color: '#F59E0B', iconBg: 'rgba(245, 158, 11, 0.1)' },
                    { label: 'System Status', sub: 'All systems operational', icon: Activity, color: '#10B981', iconBg: 'rgba(16, 185, 129, 0.1)' },
                ].map((item, i) => (
                    <div key={i} className="admin-stat-card-mini">
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                            <item.icon size={20} color={item.color} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '2px' }}>{item.label}</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>Performance Overview</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total GMV</p>
                        <DollarSign size={18} color="var(--text-muted)" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>ETB {stats.totalGMV.toLocaleString()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '0.8rem', fontWeight: 700 }}>
                        <TrendingUp size={14} /> +12% vs last month
                    </div>
                </div>

                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Platform Commission</p>
                        <DollarSign size={18} color="#10B981" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>ETB {stats.platformCommission.toLocaleString()}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>Total Earned</p>
                </div>

                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Organizer Approvals</p>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: stats.pendingOrganizers > 0 ? '#3B82F6' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={12} color="white" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>{stats.pendingOrganizers}</h2>
                    <p style={{ fontSize: '0.8rem', color: stats.pendingOrganizers > 0 ? '#3B82F6' : '#10B981', fontWeight: 700 }}>
                        {stats.pendingOrganizers > 0 ? 'Action Required' : 'All caught up'}
                    </p>
                </div>

                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Event Approvals</p>
                        <Calendar size={18} color="#F59E0B" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>{stats.pendingEvents}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 700 }}>Pending Review</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* 🔵 Revenue Chart Area */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Revenue Trends</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gross Merchandise Value vs. Payouts</p>
                        </div>
                    </div>

                    <div style={{ height: '240px', width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', paddingBottom: '30px' }}>
                        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,180 Q100,160 200,190 T400,140 T600,80 T800,120" fill="none" stroke="#3B82F6" strokeWidth="3" />
                            <path d="M0,180 Q100,160 200,190 T400,140 T600,80 T800,120 L800,240 L0,240 Z" fill="url(#chartGradient)" />
                            <circle cx="600" cy="80" r="4" fill="#3B82F6" />
                        </svg>

                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                            <span>Dec 01</span>
                            <span>Dec 08</span>
                            <span>Dec 15</span>
                            <span>Dec 22</span>
                            <span>Dec 29</span>
                        </div>
                    </div>
                </div>

                {/* 🟡 Fraud Alerts Sidebar */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Fraud Alerts</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <CheckCircle2 size={18} color="#10B981" />
                            <div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>All systems normal</h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last scan: 2 mins ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🟣 Needs Attention Table */}
            <div className="admin-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recent Registrations</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest organizers awaiting verification</p>
                    </div>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ORGANIZATION</th>
                            <th>CONTACT</th>
                            <th>SUBMITTED</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {organizers.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>No recent registrations</td></tr>
                        ) : (
                            organizers.map((org) => (
                                <tr key={org.id}>
                                    <td>
                                        <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{org.organizationName}</p>
                                    </td>
                                    <td>{org.contactPhone}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(org.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '6px', height: '6px', borderRadius: '50%',
                                                background: org.status === 'PENDING' ? '#F59E0B' : '#10B981'
                                            }} />
                                            <span style={{
                                                fontSize: '0.85rem', fontWeight: 700,
                                                color: org.status === 'PENDING' ? '#F59E0B' : '#10B981'
                                            }}>{org.status}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>Manage</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};
