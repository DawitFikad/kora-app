import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Ticket,
    Calendar,
    Download,
    Loader2,
    Activity
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useToast } from '../../../core/components/Toast';

export const AdvancedAnalyticsView = () => {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7d');
    const [analytics, setAnalytics] = useState<any>(null);
    const { showToast } = useToast();

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await OrganizerService.getOverview();
            setAnalytics((response as any)?.data?.data || (response as any)?.data);
        } catch (error: any) {
            showToast(error.message || 'Failed to load analytics', 'error');
        } finally {
            setLoading(false);
        }
    };

    const exportReport = () => {
        if (!analytics) return;

        const reportData = {
            generatedAt: new Date().toISOString(),
            timeRange,
            metrics: {
                totalRevenue: analytics.totalRevenue,
                ticketsSold: analytics.ticketsSold,
                totalCapacity: analytics.totalCapacity,
                nextPayout: analytics.nextPayout
            }
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('Report exported successfully', 'success');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    const metrics = [
        {
            label: 'Conversion Rate',
            value: `${(analytics?.conversionRate || 0).toFixed(1)}%`,
            change: 'Live',
            trend: 'up',
            icon: TrendingUp,
            color: '#10B981'
        },
        {
            label: 'Tickets Sold vs Capacity',
            value: `${analytics?.ticketsSoldVsCapacity?.sold || 0} / ${analytics?.ticketsSoldVsCapacity?.capacity || 0}`,
            change: `${(analytics?.ticketsSoldVsCapacity?.percent || 0).toFixed(1)}%`,
            trend: 'up',
            icon: Ticket,
            color: '#FF0000'
        },
        {
            label: 'Peak Buying Time',
            value: analytics?.advanced?.peakBuyingTime?.label || 'N/A',
            change: `${analytics?.advanced?.peakBuyingTime?.count || 0} sales`,
            trend: 'up',
            icon: Activity,
            color: '#FBBF24'
        },
        {
            label: 'Returning Buyers',
            value: `${(analytics?.advanced?.returningBuyers?.percent || 0).toFixed(1)}%`,
            change: `${analytics?.advanced?.returningBuyers?.returning || 0}/${analytics?.advanced?.returningBuyers?.total || 0}`,
            trend: 'up',
            icon: Users,
            color: '#A78BFA'
        }
    ];

    const conversionMetrics = [
        {
            label: 'Total Capacity',
            value: analytics?.advanced?.funnel?.capacity.toLocaleString() || '0',
            conversion: '100%'
        },
        {
            label: 'Tickets Sold',
            value: analytics?.advanced?.funnel?.sold.toLocaleString() || '0',
            conversion: analytics?.advanced?.funnel?.capacity ? `${((analytics.advanced.funnel.sold / analytics.advanced.funnel.capacity) * 100).toFixed(1)}%` : '0%'
        },
        {
            label: 'Attendees Entered',
            value: analytics?.advanced?.funnel?.checkedIn.toLocaleString() || '0',
            conversion: analytics?.advanced?.funnel?.sold ? `${((analytics.advanced.funnel.checkedIn / analytics.advanced.funnel.sold) * 100).toFixed(1)}%` : '0%'
        }
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader
                title="Decision-Making Analytics"
                subtitle="Enterprise-grade insights for smarter decisions"
                actions={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            style={{
                                background: '#161B22',
                                border: '1px solid var(--border)',
                                color: 'white',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="1y">Last Year</option>
                        </select>
                        <button onClick={exportReport} className="btn-blue" style={{ background: '#161B22' }}>
                            <Download size={18} /> Export Report
                        </button>
                    </div>
                }
            />

            {/* Key Metrics */}
            <div className="stats-grid">
                {metrics.map((metric, i) => (
                    <motion.div
                        key={i}
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ background: `${metric.color}20`, padding: '10px', borderRadius: '12px' }}>
                                <metric.icon size={20} color={metric.color} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 800, color: metric.trend === 'up' ? '#10B981' : '#EF4444' }}>
                                {metric.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {metric.change}
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>
                            {metric.label}
                        </p>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{metric.value}</h3>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Conversion Funnel */}
                <div className="stat-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '4px' }}>Conversion Funnel</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Track customer journey from view to purchase</p>
                        </div>
                        <Activity size={24} color="var(--primary-blue)" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {conversionMetrics.map((step, i) => {
                            const percentage = parseFloat(step.conversion);
                            return (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div>
                                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{step.label}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '12px' }}>
                                                {step.value}
                                            </span>
                                        </div>
                                        <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{step.conversion}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: i * 0.2, duration: 0.8 }}
                                            style={{
                                                height: '100%',
                                                background: `linear-gradient(90deg, var(--primary-blue), ${i === conversionMetrics.length - 1 ? '#10B981' : 'var(--primary-blue)'})`,
                                                borderRadius: '10px'
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="stat-card" style={{ padding: '32px' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '4px' }}>Revenue Breakdown</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Income sources analysis</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {analytics?.advanced?.revenueBreakdown?.map((item: any, i: number) => {
                            const total = analytics?.totalRevenue || 1;
                            const percentage = (item.value / total) * 100;
                            const color = ['#1D90F5', '#10B981', '#FBBF24'][i % 3];

                            return (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '12px', height: '12px', background: color, borderRadius: '3px' }} />
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.label}</span>
                                        </div>
                                        <span style={{ fontWeight: 800 }}>ETB {item.value.toLocaleString()}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: i * 0.2, duration: 0.8 }}
                                            style={{ height: '100%', background: color, borderRadius: '10px' }}
                                        />
                                    </div>
                                </div>
                            );
                        }) || <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No revenue data available</p>}
                    </div>

                    <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(255, 0, 0, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 0, 0, 0.1)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 800, marginBottom: '4px' }}>TOTAL REVENUE</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>ETB {analytics?.totalRevenue?.toLocaleString() || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Device Breakdown + Location Heatmap */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div className="stat-card" style={{ padding: '32px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '4px' }}>Device Breakdown</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mobile vs Web traffic</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {Object.entries(analytics?.advanced?.deviceBreakdown || { Mobile: 0, Web: 0, Unknown: 0 }).map(([key, value], idx) => (
                            <div
                                key={key}
                                style={{
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '14px'
                                }}
                            >
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{key.toUpperCase()}</p>
                                <p style={{ fontSize: '1.4rem', fontWeight: 900 }}>{Number(value).toLocaleString()}</p>
                                <div style={{ marginTop: '8px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${analytics?.ticketsSold ? (Number(value) / analytics.ticketsSold) * 100 : 0}%`,
                                            background: ['#1D90F5', '#10B981', '#F59E0B'][idx % 3]
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="stat-card" style={{ padding: '32px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '4px' }}>Location Heatmap</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>City-level ticket demand</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {(analytics?.advanced?.locationHeatmap || []).map((row: any, idx: number) => (
                            <div key={`${row.city}-${idx}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 800 }}>{row.city}</span>
                                    <span style={{ fontWeight: 800 }}>{row.tickets} tickets</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${analytics?.ticketsSold ? (row.tickets / analytics.ticketsSold) * 100 : 0}%`,
                                            background: '#FF0000'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        {(!analytics?.advanced?.locationHeatmap || analytics.advanced.locationHeatmap.length === 0) && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No city data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Insights */}
            <div className="stat-card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '4px' }}>Performance Insights</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Key findings and recommendations</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    {[
                        {
                            title: 'Best Performing Event',
                            value: analytics?.advanced?.bestEvent?.title || 'None',
                            metric: `ETB ${(analytics?.advanced?.bestEvent?.revenue || 0).toLocaleString()} revenue`,
                            icon: TrendingUp,
                            color: '#10B981'
                        },
                        {
                            title: 'Peak Sales Day',
                            value: analytics?.advanced?.peakDay?.day || 'None',
                            metric: `${analytics?.advanced?.peakDay?.count || 0} tickets sold`,
                            icon: Calendar,
                            color: '#FF0000'
                        },
                        {
                            title: 'Average Ticket Price',
                            value: `ETB ${analytics?.totalRevenue && analytics?.ticketsSold ? Math.round(analytics.totalRevenue / analytics.ticketsSold) : 0}`,
                            metric: 'Revenue / Tickets Sold',
                            icon: DollarSign,
                            color: '#FBBF24'
                        }
                    ].map((insight, i) => (
                        <div
                            key={i}
                            style={{
                                padding: '24px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px'
                            }}
                        >
                            <div style={{ background: `${insight.color}20`, padding: '10px', borderRadius: '12px', width: 'fit-content', marginBottom: '16px' }}>
                                <insight.icon size={20} color={insight.color} />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
                                {insight.title.toUpperCase()}
                            </p>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '4px' }}>{insight.value}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{insight.metric}</p>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </motion.div>
    );
};
