import { motion } from 'framer-motion';
import {
    Activity,
    ArrowDown,
    ArrowUp,
    BarChart3,
    Download,
    Ticket,
    TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useToast } from '../../../core/components/Toast';
import { PageHeader } from './PageHeader';

interface SalesData {
    totalRevenue: number;
    ticketsSold: number;
    conversionRate: number;
    averageTicketPrice: number;
    revenueByTicketType: { name: string; value: number; count: number }[];
    salesTrend: { date: string; revenue: number; tickets: number }[];
    topEvents: { name: string; revenue: number; tickets: number }[];
    salesTable: {
        id: string;
        eventId: number | null;
        eventTitle: string;
        customer: string;
        date: string | Date;
        amount: number;
        paymentMethod: string;
        channel: string;
        status: string;
    }[];
    salesByChannel: { name: string; revenue: number; count: number }[];
    failedPayments: {
        id: string;
        eventId: number | null;
        eventTitle: string;
        customer: string;
        date: string | Date;
        amount: number;
        paymentMethod: string;
        reason: string;
        status: string;
    }[];
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
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
    const [events, setEvents] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [salesFilters, setSalesFilters] = useState({
        eventId: 'all',
        customer: '',
        paymentMethod: 'all',
        date: ''
    });
    const [failedFilters, setFailedFilters] = useState({
        eventId: 'all',
        customer: '',
        paymentMethod: 'all',
        date: ''
    });

    const COLORS = ['#1D90F5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    useEffect(() => {
        fetchData();
    }, [dateRange, selectedEvent, selectedPaymentMethod]);

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
                        topEvents: [],
                        salesTable: [],
                        salesByChannel: [],
                        failedPayments: []
                    }
                })),
                OrganizerService.getMyEvents().catch(() => ({ data: [] }))
            ]);

            // Extract data from axios responses
            const financials = financialsResponse?.data?.data || financialsResponse?.data || {
                totalRevenue: 0,
                ticketsSold: 0,
                conversionRate: 0,
                averageTicketPrice: 0,
                salesTrend: [],
                revenueByTicketType: [],
                topEvents: [],
                salesTable: [],
                salesByChannel: [],
                failedPayments: []
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
                topEvents: financials.topEvents || [],
                salesTable: financials.salesTable || [],
                salesByChannel: financials.salesByChannel || [],
                failedPayments: financials.failedPayments || []
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
                topEvents: [],
                salesTable: [],
                salesByChannel: [],
                failedPayments: []
            });
        } finally {
            setLoading(false);
        }
    };









    const formatETB = (value: number, options?: Intl.NumberFormatOptions) => {
        const formatter = new Intl.NumberFormat('en-ET', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            ...options
        });
        return `ETB ${formatter.format(value || 0)}`;
    };

    const getRangeStart = () => {
        const now = new Date();
        if (dateRange === '7d') {
            const d = new Date(now);
            d.setDate(d.getDate() - 6);
            return d;
        }
        if (dateRange === '30d') {
            const d = new Date(now);
            d.setDate(d.getDate() - 29);
            return d;
        }
        if (dateRange === '90d') {
            const d = new Date(now);
            d.setDate(d.getDate() - 89);
            return d;
        }
        return null;
    };

    const rangeStart = getRangeStart();
    const normalizedSalesTable = (salesData?.salesTable || []).map(row => ({
        ...row,
        date: new Date(row.date)
    }));

    const normalizedFailedPayments = (salesData?.failedPayments || []).map(row => ({
        ...row,
        date: new Date(row.date)
    }));

    const matchesFilters = (row: any, filters: { eventId: string; customer: string; paymentMethod: string; date: string }) => {
        if (filters.eventId !== 'all' && String(row.eventId) !== String(filters.eventId)) return false;
        if (filters.paymentMethod !== 'all' && row.paymentMethod !== filters.paymentMethod) return false;
        if (filters.customer && !String(row.customer || '').toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.date) {
            const start = new Date(filters.date);
            const end = new Date(filters.date);
            end.setHours(23, 59, 59, 999);
            if (row.date < start || row.date > end) return false;
        }
        return true;
    };

    const filteredSalesTable = normalizedSalesTable.filter(row => {
        if (selectedEvent !== 'all' && String(row.eventId) !== String(selectedEvent)) return false;
        if (selectedPaymentMethod !== 'all' && row.paymentMethod !== selectedPaymentMethod) return false;
        if (rangeStart && row.date < rangeStart) return false;
        return matchesFilters(row, salesFilters);
    });

    const filteredFailedPayments = normalizedFailedPayments.filter(row => {
        if (selectedEvent !== 'all' && String(row.eventId) !== String(selectedEvent)) return false;
        if (selectedPaymentMethod !== 'all' && row.paymentMethod !== selectedPaymentMethod) return false;
        if (rangeStart && row.date < rangeStart) return false;
        return matchesFilters(row, failedFilters);
    });

    const paymentMethods = Array.from(new Set(normalizedSalesTable.map(row => row.paymentMethod))).filter(Boolean);
    const failedPaymentMethods = Array.from(new Set(normalizedFailedPayments.map(row => row.paymentMethod))).filter(Boolean);

    const exportToCSV = () => {
        if (!salesData) return;

        try {
            const csvData = [
                ['Sales & Revenue Report'],
                ['Generated:', new Date().toLocaleString()],
                ['Date Range:', dateRange],
                [''],
                ['Summary'],
                ['Total Revenue (ETB)', formatETB(salesData.totalRevenue)],
                ['Tickets Sold', salesData.ticketsSold.toString()],
                ['Conversion Rate', salesData.conversionRate.toFixed(2) + '%'],
                ['Average Ticket Price (ETB)', formatETB(salesData.averageTicketPrice)],
                [''],
                ['Revenue by Ticket Type'],
                ['Ticket Type', 'Revenue (ETB)', 'Tickets Sold'],
                ...(salesData.revenueByTicketType || []).map(t => [t.name, formatETB(t.value), t.count.toString()]),
                [''],
                ['Sales Trend'],
                ['Date', 'Revenue (ETB)', 'Tickets'],
                ...(salesData.salesTrend || []).map(t => [t.date, formatETB(t.revenue), t.tickets.toString()]),
                [''],
                ['Sales Table'],
                ['Order ID', 'Event', 'Customer', 'Date', 'Payment Method', 'Channel', 'Amount (ETB)', 'Status'],
                ...filteredSalesTable.map(row => [
                    row.id,
                    row.eventTitle,
                    row.customer,
                    row.date.toLocaleString(),
                    row.paymentMethod,
                    row.channel,
                    formatETB(row.amount),
                    row.status
                ]),
                [''],
                ['Failed Payments'],
                ['Payment ID', 'Event', 'Customer', 'Date', 'Payment Method', 'Amount (ETB)', 'Reason'],
                ...filteredFailedPayments.map(row => [
                    row.id,
                    row.eventTitle,
                    row.customer,
                    row.date.toLocaleString(),
                    row.paymentMethod,
                    formatETB(row.amount),
                    row.reason
                ])
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

    const exportToExcel = async () => {
        if (!salesData) return;

        try {
            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();

            const summaryRows = [
                ['Total Revenue (ETB)', formatETB(salesData.totalRevenue)],
                ['Tickets Sold', salesData.ticketsSold],
                ['Conversion Rate', `${salesData.conversionRate.toFixed(2)}%`],
                ['Average Ticket Price (ETB)', formatETB(salesData.averageTicketPrice)]
            ];
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
            XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

            const salesSheet = XLSX.utils.json_to_sheet(filteredSalesTable.map(row => ({
                OrderID: row.id,
                Event: row.eventTitle,
                Customer: row.customer,
                Date: row.date.toLocaleString(),
                PaymentMethod: row.paymentMethod,
                Channel: row.channel,
                AmountETB: row.amount,
                Status: row.status
            })));
            XLSX.utils.book_append_sheet(wb, salesSheet, 'Sales');

            const failedSheet = XLSX.utils.json_to_sheet(filteredFailedPayments.map(row => ({
                PaymentID: row.id,
                Event: row.eventTitle,
                Customer: row.customer,
                Date: row.date.toLocaleString(),
                PaymentMethod: row.paymentMethod,
                AmountETB: row.amount,
                Reason: row.reason
            })));
            XLSX.utils.book_append_sheet(wb, failedSheet, 'Failed Payments');

            XLSX.writeFile(wb, `sales-report-${dateRange}-${Date.now()}.xlsx`);
            if (toast?.success) toast.success('Excel report exported successfully!');
        } catch (error) {
            console.error('Excel export failed:', error);
            if (toast?.error) toast.error('Failed to export Excel report');
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

                        {/* Payment Method Filter */}
                        <select
                            value={selectedPaymentMethod}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
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
                            <option value="all">All Payment Methods</option>
                            {paymentMethods.map((method) => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>

                        <button onClick={exportToCSV} className="btn-blue" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Download size={16} />
                            Export CSV
                        </button>
                        <button onClick={exportToExcel} className="btn-blue" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Download size={16} />
                            Export Excel
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
                            borderRadius: '12px',
                            fontWeight: 900,
                            letterSpacing: '0.04em'
                        }}>
                            ETB
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                            <ArrowUp size={16} />
                            +12.5%
                        </div>
                    </div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9, marginBottom: '8px' }}>Total Revenue (ETB)</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 900 }}>
                        {formatETB(salesData?.totalRevenue || 0)}
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
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Avg. Ticket Price (ETB)</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        {formatETB(salesData?.averageTicketPrice || 0)}
                    </p>
                </motion.div>
            </div>

            {/* Sales by Channel */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="stat-card"
                style={{ padding: '32px', marginBottom: '32px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>Sales by Channel</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Direct vs Promo vs Referral</p>
                    </div>
                    <BarChart3 size={20} color="var(--primary-blue)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {(salesData?.salesByChannel || []).map((channel, idx) => (
                        <div
                            key={channel.name}
                            style={{
                                padding: '16px',
                                background: 'var(--bg-subtle)',
                                borderRadius: '12px',
                                border: '1px solid var(--border)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ fontWeight: 800 }}>{channel.name}</h4>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '4px',
                                    background: COLORS[idx % COLORS.length]
                                }} />
                            </div>
                            <p style={{ fontSize: '1.2rem', fontWeight: 900, color: COLORS[idx % COLORS.length] }}>
                                {formatETB(channel.revenue)}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{channel.count} payments</p>
                        </div>
                    ))}
                    {(salesData?.salesByChannel || []).length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                            No channel data available yet.
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Real-time Sales Table */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="stat-card"
                style={{ padding: '0', marginBottom: '32px' }}
            >
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Real-time Sales Table</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transparent revenue tracking in ETB</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginTop: '16px' }}>
                        <select
                            value={salesFilters.eventId}
                            onChange={(e) => setSalesFilters(prev => ({ ...prev, eventId: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        >
                            <option value="all">All Events</option>
                            {events.map((event) => (
                                <option key={event.id} value={event.id}>{event.title}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Customer"
                            value={salesFilters.customer}
                            onChange={(e) => setSalesFilters(prev => ({ ...prev, customer: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        />
                        <input
                            type="date"
                            value={salesFilters.date}
                            onChange={(e) => setSalesFilters(prev => ({ ...prev, date: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        />
                        <select
                            value={salesFilters.paymentMethod}
                            onChange={(e) => setSalesFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        >
                            <option value="all">All Payment Methods</option>
                            {paymentMethods.map((method) => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setSalesFilters({ eventId: 'all', customer: '', paymentMethod: 'all', date: '' })}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, gridColumn: 'span 4' }}
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="event-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Event</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Payment Method</th>
                                <th>Channel</th>
                                <th>Amount (ETB)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSalesTable.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                        No sales found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredSalesTable.map((row, index) => (
                                    <tr key={`${row.id}-${index}`}>
                                        <td style={{ fontWeight: 800, color: '#1D90F5' }}>{row.id}</td>
                                        <td style={{ fontWeight: 700 }}>{row.eventTitle}</td>
                                        <td>{row.customer}</td>
                                        <td>{row.date.toLocaleString()}</td>
                                        <td>{row.paymentMethod}</td>
                                        <td>{row.channel}</td>
                                        <td style={{ fontWeight: 800 }}>{formatETB(row.amount)}</td>
                                        <td>
                                            <span style={{
                                                padding: '6px 10px',
                                                borderRadius: '999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: row.status === 'Completed' ? '#10B981' : row.status === 'Failed' ? '#EF4444' : '#F59E0B',
                                                background: row.status === 'Completed'
                                                    ? 'rgba(16, 185, 129, 0.12)'
                                                    : row.status === 'Failed'
                                                        ? 'rgba(239, 68, 68, 0.12)'
                                                        : 'rgba(245, 158, 11, 0.12)'
                                            }}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Failed Payments */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="stat-card"
                style={{ padding: '0', marginBottom: '32px' }}
            >
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Failed Payments</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Track failed or cancelled payments</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginTop: '16px' }}>
                        <select
                            value={failedFilters.eventId}
                            onChange={(e) => setFailedFilters(prev => ({ ...prev, eventId: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        >
                            <option value="all">All Events</option>
                            {events.map((event) => (
                                <option key={event.id} value={event.id}>{event.title}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Customer"
                            value={failedFilters.customer}
                            onChange={(e) => setFailedFilters(prev => ({ ...prev, customer: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        />
                        <input
                            type="date"
                            value={failedFilters.date}
                            onChange={(e) => setFailedFilters(prev => ({ ...prev, date: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        />
                        <select
                            value={failedFilters.paymentMethod}
                            onChange={(e) => setFailedFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        >
                            <option value="all">All Payment Methods</option>
                            {failedPaymentMethods.map((method) => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setFailedFilters({ eventId: 'all', customer: '', paymentMethod: 'all', date: '' })}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, gridColumn: 'span 4' }}
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="event-table">
                        <thead>
                            <tr>
                                <th>Payment ID</th>
                                <th>Event</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Payment Method</th>
                                <th>Amount (ETB)</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFailedPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                        No failed payments for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredFailedPayments.map((row, index) => (
                                    <tr key={`${row.id}-${index}`}>
                                        <td style={{ fontWeight: 800, color: '#EF4444' }}>{row.id}</td>
                                        <td style={{ fontWeight: 700 }}>{row.eventTitle}</td>
                                        <td>{row.customer}</td>
                                        <td>{row.date.toLocaleString()}</td>
                                        <td>{row.paymentMethod}</td>
                                        <td style={{ fontWeight: 800 }}>{formatETB(row.amount)}</td>
                                        <td>{row.reason}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

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
                                formatter={(value: any, name: any) => {
                                    if (String(name).toLowerCase().includes('revenue')) {
                                        return formatETB(Number(value));
                                    }
                                    return value;
                                }}
                            />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#1D90F5" strokeWidth={3} dot={{ r: 4 }} name="Revenue (ETB)" />
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
                                label={(entry) => `${entry.name}: ETB ${entry.value.toLocaleString()}`}
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
                                formatter={(value: any) => formatETB(Number(value))}
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
                                        {formatETB(event.revenue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                                        {formatETB(type.value, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <span>{type.count} tickets sold</span>
                                    <span>{formatETB(type.value / type.count)}</span>
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
