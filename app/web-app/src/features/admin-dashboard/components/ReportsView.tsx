import { useState } from 'react';
import { AdminPageHeader } from './AdminPageHeader';
import { Download, FileText, BarChart3, Calendar } from 'lucide-react';
import { exportToCSV } from '../../../core/utils/export';
import { exportToPDF } from '../../../core/utils/pdf';
import { AdminService } from '../../../core/api/admin.service';

export const ReportsView = () => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (reportType: string, format: 'csv' | 'pdf') => {
        setIsExporting(true);
        try {
            // Fetch fresh data for the report
            const stats: any = await AdminService.getStats();
            const metrics: any = await AdminService.getFinancialMetrics();

            const data = [
                { Metric: 'Total GMV', Value: stats.kpis.totalGMV },
                { Metric: 'Platform Commission', Value: stats.kpis.platformCommission },
                { Metric: 'Active Users', Value: stats.kpis.activeUsers },
                { Metric: 'Tickets Sold', Value: stats.kpis.totalTicketsSold },
                { Metric: 'Pending Payouts', Value: metrics.data.pendingPayouts.amount },
                { Metric: 'Report Date', Value: new Date().toLocaleDateString() }
            ];

            const filename = `${reportType}_${new Date().toISOString().split('T')[0]}.${format}`;

            if (format === 'csv') {
                exportToCSV(data, filename);
            } else {
                exportToPDF(data, ['Metric', 'Value'], filename, `${reportType.replace('_', ' ')} Report`);
            }
        } catch (error) {
            console.error('Export failed', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <AdminPageHeader
                title="System Reports"
                subtitle="Generate and download detailed platform insights."
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                <ReportCard
                    title="Financial Overview"
                    description="Comprehensive breakdown of GMV, revenue, and payouts."
                    icon={BarChart3}
                    onExport={(fmt: 'csv' | 'pdf') => handleExport('financial_overview', fmt)}
                    loading={isExporting}
                />
                <ReportCard
                    title="User Activity"
                    description="New registrations, active users, and engagement metrics."
                    icon={FileText}
                    onExport={(fmt: 'csv' | 'pdf') => handleExport('user_activity', fmt)}
                    loading={isExporting}
                />
                <ReportCard
                    title="Event Performance"
                    description="Ticket sales, attendance rates, and category trends."
                    icon={Calendar}
                    onExport={(fmt: 'csv' | 'pdf') => handleExport('event_performance', fmt)}
                    loading={isExporting}
                />
            </div>
        </div>
    );
};

const ReportCard = ({ title, description, icon: Icon, onExport, loading }: any) => (
    <div className="admin-card" style={{ padding: '24px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Icon size={24} color="var(--primary)" />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', minHeight: '40px' }}>{description}</p>

        <div style={{ display: 'flex', gap: '12px' }}>
            <button
                onClick={() => onExport('csv')}
                disabled={loading}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem' }}
            >
                <Download size={14} /> CSV
            </button>
            <button
                onClick={() => onExport('pdf')}
                disabled={loading}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem' }}
            >
                <Download size={14} /> PDF
            </button>
        </div>
    </div>
);
