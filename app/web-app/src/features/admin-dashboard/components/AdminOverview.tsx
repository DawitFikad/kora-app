import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    DollarSign,
    TrendingUp,
    CheckCircle2,
    Download,
    UserPlus,
    Activity,
    ShieldAlert,
    Loader2
} from 'lucide-react';
import { AdminService } from '../../../core/api/admin.service';
import { exportToCSV } from '../../../core/utils/export';
import { exportToPDF } from '../../../core/utils/pdf';

export const AdminOverview = ({ onNavigate }: { onNavigate?: (tab: any) => void }) => {
    const { t } = useTranslation();
    const [organizers, setOrganizers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
    const [monthlySales, setMonthlySales] = useState<any[]>([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [stats, setStats] = useState({
        pendingOrganizers: 0,
        pendingEvents: 0,
        totalGMV: 0,
        pendingPayouts: 0,
        platformCommission: 0,
        totalTicketsSold: 0,
        activeUsers: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const [orgsResponse, statsResponse, metricsResponse, fraudResponse, analyticsResponse]: any = await Promise.all([
                    AdminService.getPendingOrganizers(),
                    AdminService.getStats(),
                    AdminService.getFinancialMetrics(),
                    AdminService.getFraudAlerts(),
                    AdminService.getAnalytics()
                ]);

                setOrganizers(orgsResponse.slice(0, 5));
                const kpis = statsResponse.kpis;
                const metrics = metricsResponse.data;

                setStats({
                    pendingOrganizers: kpis.pendingOrganizers,
                    pendingEvents: kpis.pendingEvents,
                    totalGMV: kpis.totalGMV,
                    pendingPayouts: metrics.pendingPayouts.amount,
                    platformCommission: kpis.platformCommission,
                    totalTicketsSold: kpis.totalTicketsSold,
                    activeUsers: kpis.activeUsers
                });
                setFraudAlerts(fraudResponse.slice(0, 3));
                setMonthlySales(analyticsResponse.monthlySales || []);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleExportReport = (type: 'csv' | 'pdf') => {
        const reportData = [
            { Metric: 'Total GMV', Value: stats.totalGMV },
            { Metric: 'Platform Commission', Value: stats.platformCommission },
            { Metric: 'Active Users', Value: stats.activeUsers },
            { Metric: 'Tickets Sold', Value: stats.totalTicketsSold },
            { Metric: 'Pending Payouts', Value: stats.pendingPayouts },
        ];
        if (type === 'csv') {
            exportToCSV(reportData, `admin_overview_report_${new Date().toISOString().split('T')[0]}.csv`);
        } else {
            exportToPDF(reportData, ['Metric', 'Value'], `admin_overview_report_${new Date().toISOString().split('T')[0]}.pdf`, 'Dashboard Overview Report');
        }
    };

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
                    { label: t('admin.review_pending'), sub: `${stats.pendingOrganizers + stats.pendingEvents} items waiting`, icon: ShieldAlert, color: '#3B82F6', iconBg: 'rgba(59, 130, 246, 0.1)', tab: 'Organizer Approvals' },
                    { label: t('admin.export_report'), sub: 'CSV or PDF', icon: Download, color: '#A78BFA', iconBg: 'rgba(167, 139, 250, 0.1)', action: () => handleExportReport('pdf') },
                    { label: t('admin.invite_admin'), sub: 'Manage access', icon: UserPlus, color: '#F59E0B', iconBg: 'rgba(245, 158, 11, 0.1)', action: () => setShowInviteModal(true) },
                    { label: t('admin.system_status'), sub: 'All systems operational', icon: Activity, color: '#10B981', iconBg: 'rgba(16, 185, 129, 0.1)', tab: 'Monitoring' },
                ].map((item, i) => (
                    <div key={i} className="admin-stat-card-mini" onClick={() => {
                        if (item.tab) onNavigate?.(item.tab);
                        if (item.action) item.action();
                    }} style={{ cursor: 'pointer' }}>
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

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>{t('admin.performance_overview', 'Performance Overview')}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin.total_gmv')}</p>
                        <DollarSign size={18} color="var(--text-muted)" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>ETB {stats.totalGMV.toLocaleString()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '0.8rem', fontWeight: 700 }}>
                        <TrendingUp size={14} /> +12% vs last month
                    </div>
                </div>

                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin.platform_commission')}</p>
                        <DollarSign size={18} color="#10B981" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>ETB {stats.platformCommission.toLocaleString()}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>Total Earned</p>
                </div>

                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin.pending_payouts')}</p>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: stats.pendingPayouts > 0 ? '#F59E0B' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={12} color="white" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>ETB {stats.pendingPayouts.toLocaleString()}</h2>
                    <p style={{ fontSize: '0.8rem', color: stats.pendingPayouts > 0 ? '#F59E0B' : '#10B981', fontWeight: 700 }}>
                        {stats.pendingPayouts > 0 ? t('admin.awaiting_settlement', 'Awaiting settlement') : t('admin.all_settled', 'All settled')}
                    </p>
                </div>

                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin.active_users')}</p>
                        <UserPlus size={18} color="#A78BFA" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>{stats.activeUsers.toLocaleString()}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#A78BFA', fontWeight: 700 }}>{t('admin.active_desc', 'Registered & Active')}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* 🔵 Revenue Chart Area */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('admin.revenue_trends', 'Revenue Trends')}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('admin.gmv_payouts', 'Gross Merchandise Value vs. Payouts')}</p>
                        </div>
                    </div>

                    <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '30px', borderBottom: '1px solid var(--border)' }}>
                        {monthlySales.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', paddingBottom: '60px' }}>No sales data available yet</p>
                        ) : (
                            monthlySales.map((s, i) => {
                                const maxAmount = Math.max(...monthlySales.map(m => m.amount), 1);
                                const height = (s.amount / maxAmount) * 180;
                                return (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                                        <div style={{ width: '70%', height: `${height}px`, background: 'var(--primary)', borderRadius: '4px', opacity: 0.8 }} title={`ETB ${s.amount}`} />
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{s.name}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginTop: '12px' }}>
                        <span>6 mo trend</span>
                        <span>Present</span>
                    </div>
                </div>

                {/* 🟡 Fraud Alerts Sidebar */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('admin.fraud')}</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {fraudAlerts.length === 0 ? (
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <CheckCircle2 size={18} color="#10B981" />
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>{t('admin.all_normal', 'All systems normal')}</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('admin.no_critical', 'No critical alerts found.')}</p>
                                </div>
                            </div>
                        ) : (
                            fraudAlerts.map(alert => (
                                <div key={alert.id} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <ShieldAlert size={18} color="#EF4444" />
                                    <div>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>{alert.type}</h4>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{alert.message}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 🟣 Needs Attention Table */}
            <div className="admin-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t('admin.recent_registrations', 'Recent Registrations')}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('admin.awaiting_verif', 'Latest organizers awaiting verification')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => onNavigate?.('Organizer Approvals')}
                            style={{ background: 'none', border: 'none', color: 'var(--bg-active)', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', marginRight: '16px' }}
                        >
                            {t('admin.view_all', 'View All')}
                        </button>
                        <button onClick={() => handleExportOrganizers('csv')} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>CSV</button>
                        <button onClick={() => handleExportOrganizers('pdf')} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>PDF</button>
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
                                        <button
                                            onClick={() => onNavigate?.('Organizer Approvals')}
                                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Invite Admin Modal */}
            {showInviteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="admin-card" style={{ width: '400px', padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Invite New Admin</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Enter the email address of the person you want to grant administrative access.</p>
                        <form onSubmit={handleInviteAdmin}>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                style={{ width: '100%', padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-main)', marginBottom: '20px' }}
                                autoFocus
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setShowInviteModal(false)} style={{ flex: 1, padding: '12px', background: 'var(--bg-subtle)', border: 'none', borderRadius: '8px', color: 'var(--text-main)', fontWeight: 700 }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--bg-active)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700 }}>Send Invite</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};
