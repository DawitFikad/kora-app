import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    DollarSign,
    Ticket,
    Users,
    Download,
    Calendar,
    Filter,
    ArrowUp,
    ArrowDown,
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useToast } from '../../../core/components/Toast';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface SalesData {
    totalRevenue: number;
    ticketsSold: number;
    conversionRate: number;
    averageTicketPrice: number;
    revenueByTicketType: { name: string; value: number; count: number }[];
    salesTrend: { date: string; revenue: number; tickets: number }[];
    topEvents: { name: string; revenue: number; tickets: number }[];
}

export const SalesRevenueView = () => {
    // Safe toast hook with fallback
    let toast: any;
    try {
        toast = useToast();
    } catch (e) {
        toast = { success: console.log, error: console.error };
    }

    const [loading, setLoading] = useState(true);
    const [salesData, setSalesData] = useState<SalesData | null>(null);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [selectedEvent, setSelectedEvent] = useState<string>('all');
    const [selectedTicketType, setSelectedTicketType] = useState<string>('all');
    const [events, setEvents] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const COLORS = ['#1D90F5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    useEffect(() => {
        fetchData();
    }, [dateRange, selectedEvent, selectedTicketType]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [financialsResponse, myEventsResponse] = await Promise.all([
                OrganizerService.getFinancials().catch(() => ({
                    data: {
                        totalRevenue: 0,
                        ticketsSold: 0,
                        conversionRate: 0,
                        averageTicketPrice: 0,
                        salesTrend: [],
                        revenueByTicketType: [],
                        topEvents: []
                    }
                })),
                OrganizerService.getMyEvents().catch(() => ({ data: [] }))
            ]);

            // Extract data from axios responses
            const financials = financialsResponse?.data || {
                totalRevenue: 0,
                ticketsSold: 0,
                conversionRate: 0,
                averageTicketPrice: 0,
                salesTrend: [],
                revenueByTicketType: [],
                topEvents: []
            };
            const myEvents = myEventsResponse?.data || [];

            setEvents(Array.isArray(myEvents) ? myEvents : []);

            // Use real API data directly
            const salesData: SalesData = {
                totalRevenue: financials.totalRevenue || 0,
                ticketsSold: financials.ticketsSold || 0,
                conversionRate: financials.conversionRate || 0,
                averageTicketPrice: financials.averageTicketPrice || 0,
                revenueByTicketType: financials.revenueByTicketType || [],
                salesTrend: financials.salesTrend || [],
                topEvents: financials.topEvents || []
            };

            setSalesData(salesData);
        } catch (error: any) {
            console.error('Failed to fetch sales data:', error);
            setError(error?.message || 'Failed to load sales data');
            if (toast?.error) toast.error('Failed to load sales data');

            // Set default data even on error
            setSalesData({
                totalRevenue: 0,
                ticketsSold: 0,
                conversionRate: 0,
                averageTicketPrice: 0,
                revenueByTicketType: [],
                salesTrend: [],
                topEvents: []
            });
        } finally {
            setLoading(false);
        }
    };









    const exportToCSV = () => {
        if (!salesData) return;

        try {
            const csvData = [
                ['Sales & Revenue Report'],
                ['Generated:', new Date().toLocaleString()],
                ['Date Range:', dateRange],
                [''],
                ['Summary'],
                ['Total Revenue', salesData.totalRevenue.toFixed(2)],
                ['Tickets Sold', salesData.ticketsSold.toString()],
                ['Conversion Rate', salesData.conversionRate.toFixed(2) + '%'],
                ['Average Ticket Price', salesData.averageTicketPrice.toFixed(2)],
                [''],
                ['Revenue by Ticket Type'],
                ['Ticket Type', 'Revenue', 'Tickets Sold'],
                ...(salesData.revenueByTicketType || []).map(t => [t.name, t.value.toFixed(2), t.count.toString()]),
                [''],
                ['Sales Trend'],
                ['Date', 'Revenue', 'Tickets'],
                ...(salesData.salesTrend || []).map(t => [t.date, t.revenue.toFixed(2), t.tickets.toString()])
            ];

            const csv = csvData.map(row => row.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales-report-${dateRange}-${Date.now()}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            if (toast?.success) toast.success('Report exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            if (toast?.error) toast.error('Failed to export report');
        }
    };

    if (loading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <PageHeader title="Sales & Revenue" subtitle="Loading sales data..." />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <Activity className="animate-pulse" size={48} color="var(--primary-blue)" />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader
                title="Sales & Revenue Dashboard"
                subtitle="Real-time insights into your ticket sales and revenue performance"
                actions={
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Date Range Filter */}
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as any)}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-main)',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="all">All Time</option>
                        </select>

                        {/* Event Filter */}
                        <select
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-main)',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Events</option>
                            {events.map((event) => (
                                <option key={event.id} value={event.id}>{event.title}</option>
                            ))}
                        </select>

                        {/* Ticket Type Filter */}
                        <select
                            value={selectedTicketType}
                            onChange={(e) => setSelectedTicketType(e.target.value)}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-card)',
                                color: 'var(--text-main)',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Ticket Types</option>
                            {salesData?.revenueByTicketType.map((type, idx) => (
                                <option key={idx} value={type.name}>{type.name}</option>
                            ))}
                        </select>

                        <button onClick={exportToCSV} className="btn-blue" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                }
            />

            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="stat-card"
                    style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, #1D90F5 0%, #1570C9 100%)',
                        color: 'white'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            padding: '12px',
                            borderRadius: '12px'
                        }}>
                            <DollarSign size={24} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                            <ArrowUp size={16} />
                            +12.5%
                        </div>
                    </div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, marginBottom: '8px' }}>Total Revenue</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 900 }}>
                        ${salesData?.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="stat-card"
                    style={{ padding: '24px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '12px',
                            borderRadius: '12px'
                        }}>
                            <Ticket size={24} color="#10B981" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>
                            <ArrowUp size={16} />
                            +8.3%
                        </div>
                    </div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Tickets Sold</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        {salesData?.ticketsSold.toLocaleString()}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="stat-card"
                    style={{ padding: '24px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            padding: '12px',
                            borderRadius: '12px'
                        }}>
                            <TrendingUp size={24} color="#F59E0B" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>
                            <ArrowUp size={16} />
                            +2.1%
                        </div>
                    </div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Conversion Rate</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        {salesData?.conversionRate.toFixed(1)}%
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="stat-card"
                    style={{ padding: '24px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{
                            background: 'rgba(139, 92, 246, 0.1)',
                            padding: '12px',
                            borderRadius: '12px'
                        }}>
                            <BarChart3 size={24} color="#8B5CF6" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700, color: '#EF4444' }}>
                            <ArrowDown size={16} />
                            -1.2%
                        </div>
                    </div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Avg. Ticket Price</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        ${salesData?.averageTicketPrice.toFixed(2)}
                    </p>
                </motion.div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* Sales Trend Chart */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="stat-card"
                    style={{ padding: '32px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>Sales Trend</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Revenue and tickets over time</p>
                        </div>
                        <Activity size={20} color="var(--primary-blue)" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesData?.salesTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                            <YAxis yAxisId="left" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem'
                                }}
                            />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#1D90F5" strokeWidth={3} dot={{ r: 4 }} name="Revenue ($)" />
                            <Line yAxisId="right" type="monotone" dataKey="tickets" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="Tickets" />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Revenue by Ticket Type */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="stat-card"
                    style={{ padding: '32px' }}
                >
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>Revenue by Type</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ticket type breakdown</p>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <RechartsPieChart>
                            <Pie
                                data={salesData?.revenueByTicketType}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: $${entry.value.toLocaleString()}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {salesData?.revenueByTicketType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px'
                                }}
                            />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Top Events & Revenue Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Top Performing Events */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="stat-card"
                    style={{ padding: '32px' }}
                >
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Top Performing Events</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {salesData?.topEvents.map((event, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    background: 'var(--bg-subtle)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: COLORS[idx],
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 800,
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 700, marginBottom: '4px' }}>{event.name}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{event.tickets} tickets sold</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--primary-blue)' }}>
                                        ${event.revenue.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Detailed Ticket Type Stats */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="stat-card"
                    style={{ padding: '32px' }}
                >
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Ticket Type Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {salesData?.revenueByTicketType.map((type, idx) => (
                            <div
                                key={idx}
                                style={{
                                    padding: '16px',
                                    background: 'var(--bg-subtle)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '3px',
                                                background: COLORS[idx]
                                            }}
                                        />
                                        {type.name}
                                    </h4>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: COLORS[idx] }}>
                                        ${type.value.toLocaleString()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <span>{type.count} tickets sold</span>
                                    <span>${(type.value / type.count).toFixed(2)} avg.</span>
                                </div>
                                <div
                                    style={{
                                        marginTop: '12px',
                                        height: '6px',
                                        background: 'var(--bg-main)',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${(type.value / (salesData?.totalRevenue || 1)) * 100}%`,
                                            background: COLORS[idx],
                                            borderRadius: '3px'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
