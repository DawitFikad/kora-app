import {
    Activity,
    ArrowUpRight,
    CheckCircle2,
    Download,
    Loader2,
    MapPin,
    Tag,
    TrendingUp,
    UserPlus,
    Image as ImageIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AdminService } from '../../../core/api/admin.service';
import type { AdminTab } from '../AdminDashboard';
import { exportToCSV } from '../../../core/utils/export';
import { exportToPDF } from '../../../core/utils/pdf';
import { AdminTooltip } from '../../../core/components/AdminTooltip';

export const AdminOverview = ({ setActiveTab }: { setActiveTab: (tab: AdminTab) => void }) => {
    const { t } = useTranslation();
    const [organizers, setOrganizers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [salesTrends, setSalesTrends] = useState<any[]>([]);
    const [organizerSales, setOrganizerSales] = useState<any[]>([]);
    const [categorySales, setCategorySales] = useState<any[]>([]);
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
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
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    const chartColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6'];

    const normalizeDistribution = (items: any[]) => {
        return (items || []).map((item: any, index: number) => ({
            ...item,
            color: item?.color || chartColors[index % chartColors.length]
        }));
    };

    const deriveCategoryDistributionFromEvents = (events: any[]) => {
        const bucket = new Map<string, number>();
        (events || []).forEach((evt: any) => {
            const name =
                evt?.category?.name ||
                evt?.mainCategory?.name ||
                evt?.categoryName ||
                'Uncategorized';
            bucket.set(name, (bucket.get(name) || 0) + 1);
        });

        return Array.from(bucket.entries())
            .map(([name, value], index) => ({ name, value, color: chartColors[index % chartColors.length] }))
            .sort((a, b) => b.value - a.value);
    };

    const computeMetrics = (evt: any) => {
        if (!evt) return evt;
        const existingRevenue = Number(evt?.metrics?.totalRevenue || 0);
        const existingTickets = Number(evt?.metrics?.ticketsSold || 0);
        if (existingRevenue > 0 || existingTickets > 0) {
            return evt;
        }

        const tiers = Array.isArray(evt.tiers) ? evt.tiers : [];
        const ticketsSold = tiers.reduce((s: number, t: any) => s + (Number(t.soldCount || 0)), 0);
        const totalRevenue = tiers.reduce((s: number, t: any) => s + (Number(t.soldCount || 0) * Number(t.price || 0)), 0);
        return { ...evt, metrics: { ...(evt.metrics || {}), ticketsSold, totalRevenue } };
    };

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
                const activeStatuses = ['PUBLISHED', 'APPROVED', 'LIVE', 'ACTIVE'];
                const activeEventCount = eventsList.filter((e: any) => activeStatuses.includes((e.status || '').toUpperCase())).length;

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

                const analytics = analyticsResponse?.data || analyticsResponse || {};
                const dailySales = Array.isArray(analytics.dailySales) ? analytics.dailySales : [];
                setSalesTrends(dailySales);

                const organizerDistribution = Array.isArray(analytics.organizerDistribution) ? analytics.organizerDistribution : [];
                setOrganizerSales(
                    organizerDistribution.length > 0
                        ? normalizeDistribution(organizerDistribution)
                        : []
                );

                const apiCategoryDistribution =
                    Array.isArray(analytics.categoryDistribution) && analytics.categoryDistribution.length > 0
                        ? analytics.categoryDistribution
                        : Array.isArray(analytics.categories)
                            ? analytics.categories
                            : [];

                const eventCategoryDistribution = deriveCategoryDistributionFromEvents(eventsList);
                const finalCategoryDistribution =
                    apiCategoryDistribution.length > 0
                        ? normalizeDistribution(apiCategoryDistribution)
                        : eventCategoryDistribution.length > 0
                            ? eventCategoryDistribution
                            : [];

                setCategorySales(finalCategoryDistribution);

                const approvedEventsList = eventsList
                    .filter((e: any) => activeStatuses.includes((e.status || '').toUpperCase()))
                    .map((e: any) => computeMetrics(e));
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


    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div>
            <div style={{ paddingBottom: '40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <StatCard
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {t('admin.total_gmv')}
                                <AdminTooltip title={t('admin.total_gmv')} content={t('admin.overview.total_gmv_tooltip')} />
                            </div>
                        }
                        value={`ETB ${stats.totalGMV.toLocaleString()}`}
                        trend={t('admin.overview.liquidity_desc')}
                        trendColor="var(--text-muted)"
                        icon={null}
                    />
                    <StatCard
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {t('admin.platform_commission')}
                                <AdminTooltip title={t('admin.platform_commission')} content={t('admin.overview.profit_tooltip')} />
                            </div>
                        }
                        value={`ETB ${stats.platformCommission.toLocaleString()}`}
                        trend={t('admin.commissions.subtitle')}
                        trendColor="#10B981"
                        icon={Activity}
                    />
                    <StatCard
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {t('admin.sidebar.gmv_tracking')}
                                <AdminTooltip title={t('admin.sidebar.gmv_tracking')} content={t('admin.overview.earnings_tooltip')} />
                            </div>
                        }
                        value={`ETB ${stats.organizerEarnings.toLocaleString()}`}
                        trend={t('admin.commissions.organizer_net')}
                        trendColor="#8B5CF6"
                        icon={TrendingUp}
                    />
                    <StatCard
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {t('admin.sidebar.organizers_nav')}
                                <AdminTooltip title={t('admin.sidebar.organizers_nav')} content={t('admin.overview.organizer_metrics_tooltip')} />
                            </div>
                        }
                        value={stats.activeOrganizers.toLocaleString()}
                        trend={`${stats.activeEvents} ${t('admin.active_users')}`}
                        trendColor="#3B82F6"
                        icon={UserPlus}
                    />
                    <StatCard
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {t('admin.sidebar.events_nav')}
                                <AdminTooltip title={t('admin.sidebar.events_nav')} content={t('admin.overview.integrity_tooltip')} />
                            </div>
                        }
                        value={stats.totalTicketsSold.toLocaleString()}
                        trend={t('admin.overview.integrity')}
                        trendColor="var(--text-muted)"
                        icon={CheckCircle2}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <button
                        onClick={() => setActiveTab('Content')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            padding: '24px', borderRadius: '24px', border: '1px solid var(--border)',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))',
                            color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15))';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))';
                        }}
                    >
                        <div style={{ padding: '10px', background: '#3B82F6', borderRadius: '12px', color: 'white' }}>
                            <ImageIcon size={20} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>Create Banner</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Manage platform promotions</div>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('Content')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            padding: '24px', borderRadius: '24px', border: '1px solid var(--border)',
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                            color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))';
                        }}
                    >
                        <div style={{ padding: '10px', background: '#10B981', borderRadius: '12px', color: 'white' }}>
                            <MapPin size={20} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>Location</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Add or manage cities</div>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('Content')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            padding: '24px', borderRadius: '24px', border: '1px solid var(--border)',
                            background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.1), rgba(192, 38, 211, 0.1))',
                            color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(217, 70, 239, 0.15), rgba(192, 38, 211, 0.15))';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(217, 70, 239, 0.1), rgba(192, 38, 211, 0.1))';
                        }}
                    >
                        <div style={{ padding: '10px', background: '#D946EF', borderRadius: '12px', color: 'white' }}>
                            <Tag size={20} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>Event Category</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Manage categories & tags</div>
                        </div>
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '20px' }}>
                    <div className="admin-card" style={{ flex: 1, padding: '24px', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                            <UserPlus size={18} color="#10B981" />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 950, color: 'var(--text-main)' }}>{t('admin.overview.organizer_status')}</h3>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                            <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto' }}>
                                <svg viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', borderRadius: '50%' }}>
                                    {[
                                        { name: t('admin.overview.verified'), value: stats.activeOrganizers, color: '#10B981' },
                                        { name: t('admin.overview.pending'), value: stats.pendingOrganizers, color: '#F59E0B' },
                                    ].map((slice, i, arr) => {
                                        const total = arr.reduce((acc, item) => acc + item.value, 0) || 1;
                                        const percentage = (slice.value / total) * 100;
                                        const offset = arr.slice(0, i).reduce((acc, item) => acc + (item.value / total) * 100, 0);
                                        return (
                                            <circle
                                                key={i}
                                                r="16" cx="16" cy="16"
                                                fill="transparent"
                                                stroke={slice.color}
                                                strokeWidth="32"
                                                strokeDasharray={`${percentage} 100`}
                                                strokeDashoffset={-offset}
                                                style={{ transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                            />
                                        );
                                    })}
                                    <circle r="11" cx="16" cy="16" fill="var(--bg-card)" />
                                </svg>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 1000, color: 'var(--text-main)' }}>{stats.activeOrganizers + stats.pendingOrganizers}</div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 1000 }}>{t('admin.overview.total')}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { name: t('admin.overview.verified'), value: stats.activeOrganizers, color: '#10B981' },
                                    { name: t('admin.overview.pending'), value: stats.pendingOrganizers, color: '#F59E0B' },
                                ].map((item, i, arr) => {
                                    const total = arr.reduce((acc, s) => acc + s.value, 0) || 1;
                                    const pct = ((item.value / total) * 100).toFixed(1);
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{item.name}</span>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 1000, color: 'var(--text-main)' }}>{item.value} ({pct}%)</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                            {/* Weekly Sales Trend */}
                            <div className="admin-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', minHeight: '340px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <TrendingUp size={18} color="#F59E0B" />
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 950, color: 'var(--text-main)' }}>{t('admin.overview.sales_trend_weekly', 'Weekly Sales Trend')}</h3>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-subtle)', padding: '6px 12px', borderRadius: '100px', border: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 900 }}>LIVE</span>
                                        <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                                    </div>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                    {salesTrends.length > 0 ? (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', flex: 1, minHeight: '160px', paddingBottom: '16px' }}>
                                                {salesTrends.map((s, i) => {
                                                    const max = Math.max(...salesTrends.map(m => m.amount), 1);
                                                    const h = (s.amount / max) * 100;
                                                    const isToday = i === new Date().getDay() - 1 || (i === 6 && new Date().getDay() === 0);
                                                    return (
                                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                                                                <motion.div
                                                                    initial={{ height: 0 }}
                                                                    animate={{ height: `${h}%` }}
                                                                    transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                                                                    style={{
                                                                        width: '100%',
                                                                        background: isToday ? 'linear-gradient(180deg, #10B981 0%, #34D399 100%)' : 'linear-gradient(180deg, var(--primary) 0%, #60A5FA 100%)',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                        opacity: isToday ? 1 : 0.7,
                                                                        boxShadow: isToday ? '0 10px 20px -5px rgba(16, 185, 129, 0.4)' : 'none'
                                                                    }}
                                                                />
                                                            </div>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: isToday ? 900 : 700, color: isToday ? '#10B981' : 'var(--text-muted)' }}>{s.name}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '20px 0 0 0', borderTop: '1px solid var(--border)' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Weekly Volume</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 1000, color: 'var(--text-main)' }}>ETB {salesTrends.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Peak Output</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 1000, color: '#10B981' }}>ETB {Math.max(...salesTrends.map(s => s.amount)).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            {/* Tickets by Organizer */}
                            <div className="admin-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                    <UserPlus size={18} color="var(--primary)" />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 950, color: 'var(--text-main)' }}>By Organizer</h3>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                                    <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto' }}>
                                        <svg viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', borderRadius: '50%' }}>
                                            {(organizerSales || []).map((cat, i) => {
                                                const total = (organizerSales || []).reduce((acc, c) => acc + c.value, 0);
                                                const percentage = (cat.value / total) * 100;
                                                const offset = (organizerSales || []).slice(0, i).reduce((acc, c) => acc + (c.value / total) * 100, 0);
                                                return (
                                                    <circle
                                                        key={i}
                                                        r="16" cx="16" cy="16"
                                                        fill="transparent"
                                                        stroke={cat.color}
                                                        strokeWidth="32"
                                                        strokeDasharray={`${percentage} 100`}
                                                        strokeDashoffset={-offset}
                                                        style={{ transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                                    />
                                                );
                                            })}
                                            <circle r="11" cx="16" cy="16" fill="var(--bg-card)" />
                                        </svg>
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 1000, color: 'var(--text-main)' }}>{stats.totalTicketsSold}</div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 1000 }}>TOTAL</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {(organizerSales || []).map((cat, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{cat.name}</span>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 1000, color: 'var(--text-main)' }}>{cat.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tickets by Category */}
                            <div className="admin-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                    <Tag size={18} color="#10B981" />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 950, color: 'var(--text-main)' }}>By Category</h3>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                                    <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto' }}>
                                        <svg viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', borderRadius: '50%' }}>
                                            {(categorySales || []).map((cat, i) => {
                                                const total = (categorySales || []).reduce((acc, c) => acc + c.value, 0) || 1;
                                                const percentage = (cat.value / total) * 100;
                                                const offset = (categorySales || []).slice(0, i).reduce((acc, c) => acc + (c.value / total) * 100, 0);
                                                return (
                                                    <circle
                                                        key={i}
                                                        r="16" cx="16" cy="16"
                                                        fill="transparent"
                                                        stroke={cat.color}
                                                        strokeWidth="32"
                                                        strokeDasharray={`${percentage} 100`}
                                                        strokeDashoffset={-offset}
                                                        style={{ transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                                    />
                                                );
                                            })}
                                            <circle r="11" cx="16" cy="16" fill="var(--bg-card)" />
                                        </svg>
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                            <Activity size={24} color="#10B981" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {(categorySales || []).map((cat, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{cat.name}</span>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 1000, color: 'var(--text-main)' }}>{cat.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                    {/* Latest Organizers */}
                    <div className="admin-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 950, color: 'white' }}>{t('admin.overview.latest_organizers')}</h4>
                            <button onClick={() => handleExportOrganizers('csv')} style={{ border: 'none', background: 'var(--bg-subtle)', padding: '8px', cursor: 'pointer', borderRadius: '8px', color: 'var(--text-muted)' }}>
                                <Download size={16} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                            {organizers.length > 0 ? organizers.map((org, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: org.status === 'APPROVED' ? '#10B981' : '#F59E0B' }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{org.organizationName}</span>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: org.status === 'APPROVED' ? '#10B981' : '#D97706', textTransform: 'uppercase' }}>{org.status === 'APPROVED' ? t('admin.overview.active') : t('admin.overview.review_label')}</span>
                                </div>
                            )) : <p style={{ color: 'var(--text-muted)' }}>{t('admin.overview.no_recent_records')}</p>}
                        </div>
                    </div>

                    {/* Approved Events */}
                    <div className="admin-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>{t('admin.overview.approved_events')}</h3>
                            <button onClick={() => setActiveTab('Event Approvals')} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'white', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>
                                {t('admin.view_all')}
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                        <th style={{ padding: '8px 4px', fontWeight: 800, textTransform: 'uppercase' }}>{t('admin.overview.event_name')}</th>
                                        <th style={{ padding: '8px 4px', fontWeight: 800, textTransform: 'uppercase' }}>{t('admin.overview.revenue')}</th>
                                        <th style={{ padding: '8px 4px', fontWeight: 800, textTransform: 'uppercase', textAlign: 'right' }}>{t('admin.overview.action')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentEvents.length > 0 ? recentEvents.slice(0, 5).map((event, i) => (
                                        <tr key={i} style={{ borderBottom: i < 4 ? '1px solid var(--border)' : 'none', fontSize: '0.85rem' }}>
                                            <td style={{ padding: '12px 4px', fontWeight: 800, color: 'var(--text-main)' }}>
                                                <div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                                            </td>
                                            <td style={{ padding: '12px 4px', fontWeight: 900, color: 'var(--text-main)' }}>ETB {Number(event.metrics?.totalRevenue || 0).toLocaleString()}</td>
                                            <td style={{ padding: '12px 4px', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => setSelectedEvent(computeMetrics(event))}
                                                    style={{ padding: '4px 8px', background: 'var(--bg-active)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                                                >
                                                    {t('admin.overview.inspect')}
                                                </button>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan={3} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>{t('admin.overview.no_events')}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {selectedEvent && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }} onClick={() => setSelectedEvent(null)}>
                    <div className="admin-card" style={{ maxWidth: '800px', width: '100%', padding: '0', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: '32px', background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: 'white', position: 'relative' }}>
                            <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
                            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                <div style={{ width: '180px', height: '110px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                    {selectedEvent.coverImage ? <img src={selectedEvent.coverImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎫</div>}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.65rem', background: '#10B981', color: 'white', padding: '4px 10px', borderRadius: '20px', fontWeight: 900, textTransform: 'uppercase' }}>{selectedEvent.status}</span>
                                        <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.15)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: 800 }}>{selectedEvent.category?.name || 'GENERIC'}</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: 1000, marginBottom: '4px', lineHeight: 1.1 }}>{selectedEvent.title}</h3>
                                    <p style={{ fontSize: '0.95rem', opacity: 0.8, fontWeight: 700 }}>by {selectedEvent.organizer?.organizationName || t('admin.overview.independent_partner')}</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                                <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>{t('admin.overview.total_revenue')}</p>
                                    <h4 style={{ fontSize: '1.3rem', fontWeight: 1000, color: 'var(--text-main)' }}>ETB {Number(selectedEvent.metrics?.totalRevenue || 0).toLocaleString()}</h4>
                                </div>
                                <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>{t('admin.overview.tickets_sold')}</p>
                                    <h4 style={{ fontSize: '1.3rem', fontWeight: 1000, color: 'var(--text-main)' }}>{selectedEvent.metrics?.ticketsSold || 0} / {selectedEvent.totalCapacity || '∞'}</h4>
                                </div>
                                <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>{t('admin.overview.platform_profit')}</p>
                                    <h4 style={{ fontSize: '1.3rem', fontWeight: 1000, color: '#10B981' }}>ETB {Number(selectedEvent.metrics?.platformFee || 0).toLocaleString()}</h4>
                                </div>
                            </div>
                            <div style={{ marginTop: '-10px', marginBottom: '24px', padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase' }}>Organizer Net</p>
                                    <p style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)' }}>ETB {Number(selectedEvent.metrics?.organizerNet || 0).toLocaleString()}</p>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                                <div>
                                    <h5 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '20px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('admin.overview.logistics')}</h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{new Date(selectedEvent.dateTime).toLocaleString()}</p>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <MapPin size={16} color="var(--text-muted)" />
                                            <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedEvent.venue}, {selectedEvent.city?.name}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h5 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '20px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('admin.overview.market')}</h5>
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
                            <button onClick={() => setSelectedEvent(null)} style={{ padding: '10px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' }}>{t('admin.overview.close')}</button>
                            <button
                                onClick={() => window.open(`/admin/events/${selectedEvent.id}`, '_blank')}
                                style={{ padding: '10px 20px', background: 'var(--bg-active)', border: 'none', color: 'white', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                {t('admin.overview.details')} <ArrowUpRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, trend, trendColor, icon: Icon }: any) => (
    <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)', border: '1px solid var(--border)', minHeight: '100px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            {Icon && <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={14} color="var(--text-muted)" /></div>}
        </div>
        <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 1000, color: 'var(--text-main)', marginBottom: '2px' }}>{value}</h3>
            {trend && <span style={{ fontSize: '0.7rem', color: trendColor, fontWeight: 800 }}>{trend}</span>}
        </div>
    </div>
);
