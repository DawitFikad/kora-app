import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    CheckCircle2,
    Download,
    UserPlus,
    Activity,
    Loader2,
    Zap,
    ArrowUpRight,
    ShieldCheck,
    BarChart3,
    CalendarCheck,
    ClipboardList,
    TrendingUp,
    LayoutDashboard,
    Globe,
    Layers,
    MapPin,
    Calendar,
    Trophy,
    Target
} from 'lucide-react';
import { AdminService } from '../../../core/api/admin.service';
import { exportToCSV } from '../../../core/utils/export';
import { exportToPDF } from '../../../core/utils/pdf';

export const AdminOverview = () => {
    const { t } = useTranslation();
    const [organizers, setOrganizers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [monthlySales, setMonthlySales] = useState<any[]>([]);
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [stats, setStats] = useState({
        pendingOrganizers: 0,
        pendingEvents: 0,
        totalGMV: 0,
        pendingPayouts: 0,
        platformCommission: 0,
        organizerEarnings: 0,
        totalTicketsSold: 0,
        activeUsers: 0,
        activeOrganizers: 0,
        activeEvents: 0
    });
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const results = await Promise.allSettled([
                    AdminService.getPendingOrganizers(),
                    AdminService.getStats(),
                    AdminService.getFinancialMetrics(),
                    AdminService.getAnalytics(),
                    AdminService.getApprovedOrganizers(),
                    AdminService.getEvents()
                ]);

                const getVal = (res: PromiseSettledResult<any>) => res.status === 'fulfilled' ? res.value : null;

                const orgsResponse = getVal(results[0]);
                const statsResponse = getVal(results[1]);
                const metricsResponse = getVal(results[2]);
                const analyticsResponse = getVal(results[3]);
                const approvedOrgs = getVal(results[4]);
                const allEvents = getVal(results[5]);

                const safeArray = (data: any) => {
                    if (!data) return [];
                    if (Array.isArray(data)) return data;
                    if (data.data && Array.isArray(data.data)) return data.data;
                    return [];
                };

                const pendingOrgsList = safeArray(orgsResponse);
                const activeOrgsList = safeArray(approvedOrgs);

                const allRecentOrgs = [...pendingOrgsList, ...activeOrgsList].sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                setOrganizers(allRecentOrgs.slice(0, 5));

                const kpis = statsResponse?.kpis || {};
                const metrics = metricsResponse?.data || {};
                const activeOrgCount = activeOrgsList.length;
                const eventsList = safeArray(allEvents);
                const activeEventCount = eventsList.filter((e: any) => e.status === 'PUBLISHED').length;

                setStats({
                    pendingOrganizers: kpis.pendingOrganizers || pendingOrgsList.length || 0,
                    pendingEvents: kpis.pendingEvents || 0,
                    totalGMV: kpis.totalGMV || 0,
                    pendingPayouts: metrics.pendingPayouts?.amount || 0,
                    platformCommission: kpis.platformCommission || 0,
                    organizerEarnings: kpis.organizerEarnings || 0,
                    totalTicketsSold: kpis.totalTicketsSold || 0,
                    activeUsers: kpis.activeUsers || 0,
                    activeOrganizers: activeOrgCount,
                    activeEvents: activeEventCount
                });

                setMonthlySales(analyticsResponse?.monthlySales || []);
                setCategoryData(analyticsResponse?.categories || []);

                const approvedEventsList = eventsList.filter((e: any) => e.status === 'PUBLISHED' || e.status === 'APPROVED');
                setRecentEvents(approvedEventsList.slice(0, 5));

            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleExportOrganizers = (type: 'csv' | 'pdf') => {
        const data = organizers.map(o => ({
            Organization: o.organizationName,
            Contact: o.contactPhone,
            Submitted: new Date(o.createdAt).toLocaleDateString(),
            Status: o.status
        }));
        if (type === 'csv') {
            exportToCSV(data, `recent_registrations_${new Date().toISOString().split('T')[0]}.csv`);
        } else {
            exportToPDF(data, ['Organization', 'Contact', 'Submitted', 'Status'], `recent_registrations_${new Date().toISOString().split('T')[0]}.pdf`, 'Recent Organizer Registrations');
        }
    };

    const handleInviteAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        alert(`Invitation sent to ${inviteEmail} (Simulated)`);
        setInviteEmail('');
        setShowInviteModal(false);
    };

    const colors = ['#8B5CF6', '#10B981', '#EC4899', '#3B82F6', '#F59E0B', '#64748B'];

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ paddingBottom: '40px' }}>
                {/* 1. Header KPIs (4 Cards) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <StatCard
                        label="Total GMV"
                        value={`ETB ${stats.totalGMV.toLocaleString()}`}
                        trend="Gross Sales Volume"
                        trendColor="var(--text-muted)"
                        icon={DollarSign}
                    />
                    <StatCard
                        label="Platform Profit"
                        value={`ETB ${stats.platformCommission.toLocaleString()}`}
                        trend="Commission + Fees"
                        trendColor="#10B981"
                        icon={Activity}
                    />
                    <StatCard
                        label="Org. Earnings"
                        value={`ETB ${stats.organizerEarnings.toLocaleString()}`}
                        trend="Net paid to partners"
                        trendColor="#8B5CF6"
                        icon={TrendingUp}
                    />
                    <StatCard
                        label="Active Organizers"
                        value={stats.activeOrganizers.toLocaleString()}
                        trend={`${stats.activeEvents} Global Events`}
                        trendColor="#3B82F6"
                        icon={UserPlus}
                    />
                    <StatCard
                        label="Verified Sales"
                        value={stats.totalTicketsSold.toLocaleString()}
                        trend="Total Tickets Issued"
                        trendColor="var(--text-muted)"
                        icon={CheckCircle2}
                    />
                </div>

                {/* 2. Main High-Density Grid (DASHBOARD COMMAND CENTER) */}

                {/* Top row: Admin Command Center (left) and Calendar (right) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', marginBottom: '16px' }}>
                    {/* Admin Command Center (Left) */}
                    <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ background: 'var(--bg-active)', padding: '5px', borderRadius: '7px' }}>
                                <LayoutDashboard size={13} color="white" />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Command Center</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                                { label: 'Organizers', sub: 'Validate', icon: ShieldCheck, col: '#3B82F6' },
                                { label: 'Events', sub: 'Review', icon: CalendarCheck, col: '#10B981' },
                                { label: 'Analytics', sub: 'Growth', icon: BarChart3, col: '#8B5CF6' },
                                { label: 'Reports', sub: 'Finance', icon: ClipboardList, col: '#EC4899' }
                            ].map((btn, i) => (
                                <button key={i} className="admin-action-btn" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '10px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${btn.col}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <btn.icon size={14} color={btn.col} />
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{btn.label}</p>
                                        <p style={{ fontSize: '0.55rem', color: 'var(--text-muted)', margin: 0 }}>{btn.sub}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calendar (Right) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="admin-card" style={{ flex: 1, padding: '18px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Globe size={14} color="var(--text-muted)" />
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main)' }}>{new Date().toLocaleString('default', { month: 'short' })} '{new Date().getFullYear().toString().slice(-2)}</h3>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{d}</span>)}
                                {Array.from({ length: 31 }).map((_, i) => {
                                    const day = i + 1;
                                    const isToday = day === new Date().getDate();
                                    return (
                                        <span key={i} style={{
                                            background: isToday ? 'var(--bg-active)' : 'transparent',
                                            color: isToday ? 'white' : 'var(--text-main)',
                                            borderRadius: '8px', padding: '4px 0',
                                            fontWeight: isToday ? 900 : 600
                                        }}>{day}</span>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Second row: Organizer Status (left) and Ticket Sales Trend (right) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '20px' }}>
                    {/* Organizer Status (Left) */}
                    <div className="admin-card" style={{ flex: 1, padding: '20px', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <UserPlus size={16} color="#10B981" />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-main)' }}>Organizer Status</h3>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
                            <div style={{ position: 'relative', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '8px solid var(--bg-subtle)', position: 'absolute' }} />
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%', border: '8px solid transparent',
                                    borderTopColor: '#10B981', borderRightColor: '#10B981',
                                    transform: `rotate(${(stats.activeOrganizers / (stats.activeOrganizers + stats.pendingOrganizers || 1)) * 360}deg)`,
                                    transition: 'transform 1.5s ease'
                                }} />
                                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>{stats.activeOrganizers}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>VERIFIED</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 900, color: '#10B981' }}>{stats.activeOrganizers}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)' }}>PENDING</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 900, color: '#F59E0B' }}>{stats.pendingOrganizers}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Sales Trend (Right) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="admin-card" style={{ flex: 1, padding: '24px', borderRadius: '24px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingUp size={16} color="#F59E0B" />
                                    <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)' }}>Ticket Sales Trend</h3>
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800 }}>MONTHLY PERFORMANCE</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flex: 1, minHeight: '120px', padding: '10px 0' }}>
                                {monthlySales.length > 0 ? monthlySales.map((s, i) => {
                                    const max = Math.max(...monthlySales.map(m => m.amount), 1);
                                    const h = (s.amount / max) * 100;
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                                <div style={{ height: `${h}%`, width: '14px', background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)', borderRadius: '4px' }} />
                                            </div>
                                            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)' }}>{s.name}</span>
                                        </div>
                                    )
                                }) : <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)' }}>Metrics loading...</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Bottom Grid: Category & Organizers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                    <div className="admin-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '20px' }}>Sales per Category</h3>
                        {categoryData.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                <div style={{ width: '40%' }}>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '14px' }}>
                                        {categoryData.map((c, i) => (
                                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: colors[i % colors.length] }} />
                                                {c.name} ({c.percentage}%)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                    <div style={{
                                        width: '140px', height: '140px', borderRadius: '50%',
                                        background: `conic-gradient(${categoryData.map((c, i, arr) => {
                                            const start = arr.slice(0, i).reduce((acc, curr) => acc + curr.percentage, 0);
                                            const end = start + c.percentage;
                                            return `${colors[i % colors.length]} ${start}% ${end}%`;
                                        }).join(', ')})`,
                                        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <div style={{ width: '90px', height: '90px', background: 'var(--bg-card)', borderRadius: '50%', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)' }} />
                                    </div>
                                </div>
                            </div>
                        ) : <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>}
                    </div>

                    <div className="admin-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>Recent Organizers</h3>
                            <button onClick={() => handleExportOrganizers('csv')} style={{ border: 'none', background: 'var(--bg-subtle)', padding: '8px', cursor: 'pointer', borderRadius: '8px', color: 'var(--text-muted)' }}>
                                <Download size={16} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {organizers.length > 0 ? organizers.map((org, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: org.status === 'APPROVED' ? '#10B981' : '#F59E0B' }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{org.organizationName}</span>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: org.status === 'APPROVED' ? '#10B981' : '#D97706', textTransform: 'uppercase' }}>{org.status === 'APPROVED' ? 'active' : 'review'}</span>
                                </div>
                            )) : <p style={{ color: 'var(--text-muted)' }}>No recent records.</p>}
                        </div>
                    </div>
                </div>

                {/* 4. Approved Events Registry */}
                <div style={{ marginTop: '24px' }}>
                    <div className="admin-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>Approved Events</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, padding: '4px 12px', background: 'var(--bg-subtle)', borderRadius: '20px' }}>{stats.activeEvents} LIVE EVENTS</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        <th style={{ padding: '12px 10px', fontWeight: 800, textTransform: 'uppercase' }}>Event Name</th>
                                        <th style={{ padding: '12px 10px', fontWeight: 800, textTransform: 'uppercase' }}>Category</th>
                                        <th style={{ padding: '12px 10px', fontWeight: 800, textTransform: 'uppercase' }}>Event Date</th>
                                        <th style={{ padding: '12px 10px', fontWeight: 800, textTransform: 'uppercase' }}>Revenue</th>
                                        <th style={{ padding: '12px 10px', fontWeight: 800, textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentEvents.length > 0 ? recentEvents.map((event, i) => (
                                        <tr key={i} style={{ borderBottom: i < recentEvents.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '0.92rem' }}>
                                            <td style={{ padding: '16px 10px', fontWeight: 800, color: 'var(--text-main)' }}>{event.title}</td>
                                            <td style={{ padding: '16px 10px', color: 'var(--text-muted)' }}>{event.category?.name || 'GENERIC'}</td>
                                            <td style={{ padding: '16px 10px', color: 'var(--text-muted)' }}>{new Date(event.dateTime).toLocaleDateString()}</td>
                                            <td style={{ padding: '16px 10px', fontWeight: 900, color: 'var(--text-main)' }}>ETB {Number(event.metrics?.totalRevenue || 0).toLocaleString()}</td>
                                            <td style={{ padding: '16px 10px', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => setSelectedEvent(event)}
                                                    style={{ padding: '8px 16px', background: 'var(--bg-active)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                                >
                                                    INSPECT
                                                </button>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan={5} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No events found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Details Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }} onClick={() => setSelectedEvent(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="admin-card"
                            style={{ maxWidth: '800px', width: '100%', padding: '0', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ padding: '32px', background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: 'white', position: 'relative' }}>
                                <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                    <div style={{ width: '180px', height: '110px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        {selectedEvent.coverImage ? (
                                            <img src={selectedEvent.coverImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎫</div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '0.65rem', background: '#10B981', color: 'white', padding: '4px 10px', borderRadius: '20px', fontWeight: 900, textTransform: 'uppercase' }}>{selectedEvent.status}</span>
                                            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.15)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: 800 }}>{selectedEvent.category?.name || 'GENERIC'}</span>
                                        </div>
                                        <h3 style={{ fontSize: '1.8rem', fontWeight: 1000, marginBottom: '4px', lineHeight: 1.1 }}>{selectedEvent.title}</h3>
                                        <p style={{ fontSize: '0.95rem', opacity: 0.8, fontWeight: 700 }}>by {selectedEvent.organizer?.organizationName || 'Independent Partner'}</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '32px', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                                    <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>Total Revenue</p>
                                        <h4 style={{ fontSize: '1.3rem', fontWeight: 1000, color: 'var(--text-main)' }}>ETB {Number(selectedEvent.metrics?.totalRevenue || 0).toLocaleString()}</h4>
                                    </div>
                                    <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>Tickets Sold</p>
                                        <h4 style={{ fontSize: '1.3rem', fontWeight: 1000, color: 'var(--text-main)' }}>{selectedEvent.metrics?.ticketsSold || 0} / {selectedEvent.totalCapacity || '∞'}</h4>
                                    </div>
                                    <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>Platform Profit</p>
                                        <h4 style={{ fontSize: '1.3rem', fontWeight: 1000, color: '#10B981' }}>ETB {Number(selectedEvent.metrics?.totalRevenue * 0.1 || 0).toLocaleString()}</h4>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                                    <div>
                                        <h5 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '20px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Logistics</h5>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <Calendar size={16} color="var(--text-muted)" />
                                                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{new Date(selectedEvent.dateTime).toLocaleString()}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <MapPin size={16} color="var(--text-muted)" />
                                                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedEvent.venue}, {selectedEvent.city?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '20px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market</h5>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {selectedEvent.tiers?.map((tier: any, idx: number) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: '12px' }}>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{tier.name}</p>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 1000, color: 'var(--text-main)' }}>ETB {tier.price.toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                <button onClick={() => setSelectedEvent(null)} style={{ padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' }}>Close</button>
                                <button
                                    onClick={() => window.open(`/book/${selectedEvent.id}`, '_blank')}
                                    style={{ padding: '10px 20px', background: 'var(--bg-active)', border: 'none', color: 'white', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    Browse <ArrowUpRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const StatCard = ({ label, value, trend, trendColor, icon: Icon }: any) => (
    <div style={{
        background: 'var(--bg-card)', borderRadius: '24px', padding: '20px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)', border: '1px solid var(--border)',
        minHeight: '100px'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color="var(--text-muted)" />
            </div>
        </div>
        <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 1000, color: 'var(--text-main)', marginBottom: '2px' }}>{value}</h3>
            {trend && <span style={{ fontSize: '0.7rem', color: trendColor, fontWeight: 800, opacity: 0.8 }}>{trend}</span>}
        </div>
    </div>
);
