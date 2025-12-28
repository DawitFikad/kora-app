import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Download,
    FileText,
    Calendar,
    Filter,
    TrendingUp,
    DollarSign,
    Ticket,
    Users,
    CheckCircle
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { useToast } from '../../../core/components/Toast';

export const ReportGeneratorView = () => {
    const { showToast } = useToast();
    const [reportType, setReportType] = useState('financial');
    const [dateRange, setDateRange] = useState('30d');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

    const reportTypes = [
        {
            id: 'financial',
            name: 'Financial Report',
            description: 'Revenue, payouts, and transaction details',
            icon: DollarSign,
            color: '#10B981'
        },
        {
            id: 'sales',
            name: 'Sales Report',
            description: 'Ticket sales, trends, and performance',
            icon: Ticket,
            color: '#1D90F5'
        },
        {
            id: 'attendees',
            name: 'Attendee Report',
            description: 'Check-ins, demographics, and engagement',
            icon: Users,
            color: '#FBBF24'
        },
        {
            id: 'comprehensive',
            name: 'Comprehensive Report',
            description: 'All metrics and analytics combined',
            icon: FileText,
            color: '#A78BFA'
        }
    ];

    const generateReport = (format: 'pdf' | 'csv' | 'json') => {
        // Mock data for demonstration
        const reportData = {
            reportType,
            dateRange,
            generatedAt: new Date().toISOString(),
            events: selectedEvents,
            summary: {
                totalRevenue: 450000,
                ticketsSold: 1250,
                totalAttendees: 1180,
                averageTicketPrice: 360
            },
            details: [
                { event: 'Summer Music Festival', revenue: 125000, tickets: 350 },
                { event: 'Tech Conference 2025', revenue: 200000, tickets: 500 },
                { event: 'Food & Wine Expo', revenue: 125000, tickets: 400 }
            ]
        };

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportType}-report-${dateRange}-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else if (format === 'csv') {
            const headers = ['Event', 'Revenue', 'Tickets Sold'];
            const csvContent = [
                headers.join(','),
                ...reportData.details.map(row => [row.event, row.revenue, row.tickets].join(','))
            ].join('\\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportType}-report-${dateRange}-${Date.now()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
            // For PDF, we'll create an HTML report that can be printed
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${reportType.toUpperCase()} Report</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 40px; }
                            h1 { color: #1D90F5; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                            th { background-color: #1D90F5; color: white; }
                            .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
                            .metric { display: inline-block; margin: 10px 20px 10px 0; }
                            .metric-label { font-size: 12px; color: #666; }
                            .metric-value { font-size: 24px; font-weight: bold; color: #1D90F5; }
                        </style>
                    </head>
                    <body>
                        <h1>${reportType.toUpperCase()} Report</h1>
                        <p><strong>Date Range:</strong> ${dateRange}</p>
                        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                        
                        <div class="summary">
                            <h2>Summary</h2>
                            <div class="metric">
                                <div class="metric-label">Total Revenue</div>
                                <div class="metric-value">ETB ${reportData.summary.totalRevenue.toLocaleString()}</div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">Tickets Sold</div>
                                <div class="metric-value">${reportData.summary.ticketsSold.toLocaleString()}</div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">Total Attendees</div>
                                <div class="metric-value">${reportData.summary.totalAttendees.toLocaleString()}</div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">Avg. Ticket Price</div>
                                <div class="metric-value">ETB ${reportData.summary.averageTicketPrice}</div>
                            </div>
                        </div>

                        <h2>Event Details</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Revenue</th>
                                    <th>Tickets Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reportData.details.map(row => `
                                    <tr>
                                        <td>${row.event}</td>
                                        <td>ETB ${row.revenue.toLocaleString()}</td>
                                        <td>${row.tickets}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.print();
                }, 250);
            }
        }

        showToast(`${format.toUpperCase()} report generated successfully`, 'success');
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader
                title="Report Generator"
                subtitle="Create custom reports for your events and export in multiple formats"
            />

            {/* Report Type Selection */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Select Report Type</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {reportTypes.map((type) => (
                        <motion.div
                            key={type.id}
                            onClick={() => setReportType(type.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                padding: '24px',
                                background: reportType === type.id ? 'rgba(29, 144, 245, 0.1)' : 'var(--bg-card)',
                                border: `2px solid ${reportType === type.id ? 'var(--primary-blue)' : 'var(--border)'}`,
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                        >
                            {reportType === type.id && (
                                <CheckCircle
                                    size={20}
                                    color="var(--primary-blue)"
                                    style={{ position: 'absolute', top: 16, right: 16 }}
                                />
                            )}
                            <div style={{ background: `${type.color}20`, padding: '12px', borderRadius: '12px', width: 'fit-content', marginBottom: '16px' }}>
                                <type.icon size={24} color={type.color} />
                            </div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '8px' }}>{type.name}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{type.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="stat-card" style={{ padding: '32px', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={20} /> Report Filters
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                    {/* Date Range */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
                            <Calendar size={16} style={{ display: 'inline', marginRight: '6px' }} />
                            Date Range
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            style={{
                                width: '100%',
                                background: '#161B22',
                                border: '1px solid var(--border)',
                                color: 'white',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="1y">Last Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {/* Event Selection */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
                            <Ticket size={16} style={{ display: 'inline', marginRight: '6px' }} />
                            Events (Optional)
                        </label>
                        <select
                            multiple
                            value={selectedEvents}
                            onChange={(e) => setSelectedEvents(Array.from(e.target.selectedOptions, option => option.value))}
                            style={{
                                width: '100%',
                                background: '#161B22',
                                border: '1px solid var(--border)',
                                color: 'white',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                minHeight: '100px'
                            }}
                        >
                            <option value="all">All Events</option>
                            <option value="event1">Summer Music Festival</option>
                            <option value="event2">Tech Conference 2025</option>
                            <option value="event3">Food & Wine Expo</option>
                        </select>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            Hold Ctrl/Cmd to select multiple events
                        </p>
                    </div>
                </div>
            </div>

            {/* Export Options */}
            <div className="stat-card" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Export Report</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                        { format: 'pdf', label: 'PDF Report', description: 'Print-ready document', color: '#EF4444' },
                        { format: 'csv', label: 'CSV Export', description: 'Excel compatible', color: '#10B981' },
                        { format: 'json', label: 'JSON Data', description: 'Raw data format', color: '#1D90F5' }
                    ].map((option) => (
                        <button
                            key={option.format}
                            onClick={() => generateReport(option.format as 'pdf' | 'csv' | 'json')}
                            className="btn-blue"
                            style={{
                                background: `${option.color}20`,
                                border: `2px solid ${option.color}40`,
                                color: option.color,
                                padding: '20px',
                                flexDirection: 'column',
                                gap: '12px',
                                boxShadow: 'none'
                            }}
                        >
                            <Download size={24} />
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{option.label}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 600 }}>{option.description}</div>
                            </div>
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(29, 144, 245, 0.05)', borderRadius: '12px', border: '1px solid rgba(29, 144, 245, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', fontSize: '0.85rem', fontWeight: 700 }}>
                        <TrendingUp size={16} />
                        <span>Reports are generated based on your current filters and date range</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
