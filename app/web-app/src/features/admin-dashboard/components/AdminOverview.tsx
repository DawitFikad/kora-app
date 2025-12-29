import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    DollarSign,
    CheckCircle2,
    Download,
    UserPlus,
    Activity,
    Loader2
} from 'lucide-react';
import { AdminService } from '../../../core/api/admin.service';
import { exportToCSV } from '../../../core/utils/export';
import { exportToPDF } from '../../../core/utils/pdf';

export const AdminOverview = () => {
    const { t } = useTranslation();
    const [organizers, setOrganizers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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
                const [orgsResponse, statsResponse, metricsResponse, analyticsResponse]: any = await Promise.all([
                    AdminService.getPendingOrganizers(),
                    AdminService.getStats(),
                    AdminService.getFinancialMetrics(),
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
                setMonthlySales(analyticsResponse.monthlySales || []);
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
                {/* 1. Top Stats Row */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        <StatCard
                            label={t('admin.active_users', 'Total customers')}
                            value={stats.activeUsers.toLocaleString()}
                            trend="+2.5%"
                            trendColor="#10B981"
                            icon={UserPlus}
                        />
                        <StatCard
                            label={t('admin.total_gmv', 'Total revenue')}
                            value={`ETB ${(stats.totalGMV / 1000).toFixed(1)}k`}
                            trend="+0.5%"
                            trendColor="#10B981"
                            icon={DollarSign}
                        />
                        <StatCard
                            label={t('admin.tickets_sold', 'Total orders')}
                            value={stats.totalTicketsSold.toLocaleString()}
                            trend="+0.2%"
                            trendColor="#EF4444"
                            icon={CheckCircle2}
                        />
                        <StatCard
                            label={t('admin.pending_payouts', 'Total returns')}
                            value={`ETB ${stats.pendingPayouts.toLocaleString()}`}
                            trend="+0.12%"
                            trendColor="#10B981"
                            icon={Activity}
                        />
                    </div>
                    {/* Add/Action Button */}
                    <button
                        onClick={() => setShowInviteModal(true)}
                        style={{
                            height: '100%',
                            padding: '0 24px',
                            background: 'white',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            minHeight: '100px',
                            gap: '8px'
                        }}
                    >
                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserPlus size={14} color="var(--text-muted)" />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.invite_admin', 'Add user')}</span>
                    </button>
                </div>

                {/* 2. Middle Main Chart Row (Splitted) */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    {/* Left: Product Sales Chart */}
                    <div className="admin-card" style={{ padding: '24px', borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Product sales</h3>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
                                    <span style={{ color: 'var(--text-muted)' }}>Gross margin</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                                    <span style={{ color: 'var(--text-muted)' }}>Revenue</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: '20px', paddingRight: '20px' }}>
                            {monthlySales.length > 0 ? monthlySales.slice(0, 12).map((s, i) => {
                                const max = Math.max(...monthlySales.map(m => m.amount), 1);
                                const h1 = (s.amount / max) * 200; // Blue bar
                                const h2 = (s.amount * 0.7 / max) * 200; // Orange bar (simulated)
                                return (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100%' }}>
                                            <div style={{ width: '12px', height: `${Math.max(4, h1)}px`, background: '#3B82F6', borderRadius: '4px' }} />
                                            <div style={{ width: '12px', height: `${Math.max(4, h2)}px`, background: '#F59E0B', borderRadius: '4px' }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.name.substring(0, 3)}</span>
                                    </div>
                                )
                            }) : (
                                // Placeholder bars if no data
                                Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100%' }}>
                                            <div style={{ width: '12px', height: `${30 + Math.random() * 100}px`, background: '#3B82F6', borderRadius: '4px' }} />
                                            <div style={{ width: '12px', height: `${20 + Math.random() * 80}px`, background: '#F59E0B', borderRadius: '4px' }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Upcoming Features / Events */}
                    <div className="admin-card" style={{ padding: '24px', borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Phase 2 Features</h3>
                            <span style={{ fontSize: '0.7rem', color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>POST-LAUNCH</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { title: 'Loyalty Points', date: 'Q1', desc: 'Rewards & Redemption', color: '#10B981' },
                                { title: 'Wallet Balance', date: 'Q1', desc: 'Integrated stored value', color: '#F59E0B' },
                                { title: 'Diaspora Cards', date: 'Q2', desc: 'International payment gateway', color: '#3B82F6' },
                                { title: 'Seat Map Designer', date: 'Q2', desc: 'Visual layout editor', color: '#EC4899' },
                                { title: 'White-label Pages', date: 'Q3', desc: 'Custom organizer domains', color: '#8B5CF6' },
                                { title: 'Live Streaming', date: 'Q3', desc: 'Virtual event support', color: '#64748B' }
                            ].map((feat, i) => (
                                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '40px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{feat.date}</span>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: feat.color }} />
                                    </div>
                                    <div style={{ flex: 1, paddingBottom: '16px', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px', color: 'var(--text-main)' }}>{feat.title}</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{feat.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Bottom Two Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                    {/* Sales by Category (Donut Chart) */}
                    <div className="admin-card" style={{ padding: '24px', borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px' }}>Sales by product category</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                            <div style={{ width: '40%' }}>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {[
                                        { label: 'Concerts', val: '25%', color: '#8B5CF6' },
                                        { label: 'Sports', val: '13%', color: '#10B981' },
                                        { label: 'Theater', val: '3%', color: '#EC4899' },
                                        { label: 'Dining', val: '17%', color: '#3B82F6' },
                                        { label: 'Bedroom', val: '12%', color: '#F59E0B' }, // Kept original labels from image or map to categories
                                        { label: 'Other', val: '9%', color: '#64748B' }
                                    ].map((c, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: c.color }} />
                                            {c.label} - {c.val}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                {/* Simple CSS Conic Gradient Donut */}
                                <div style={{
                                    width: '180px',
                                    height: '180px',
                                    borderRadius: '50%',
                                    background: 'conic-gradient(#8B5CF6 0% 25%, #10B981 25% 38%, #EC4899 38% 41%, #3B82F6 41% 58%, #F59E0B 58% 70%, #64748B 70% 100%)',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ width: '120px', height: '120px', background: 'white', borderRadius: '50%' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales by Countries (Registrations List) */}
                    <div className="admin-card" style={{ padding: '24px', borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recent Organizers</h3>
                            <button onClick={() => handleExportOrganizers('csv')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <Download size={18} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {organizers.length > 0 ? organizers.map((org, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: org.status === 'APPROVED' ? '#10B981' : '#F59E0B' }} />
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{org.organizationName}</span>
                                    </div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>{Math.floor(Math.random() * 20)}%</span>
                                </div>
                            )) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent registrations.</p>
                            )}
                        </div>
                    </div>
                </div>
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

const StatCard = ({ label, value, trend, trendColor, icon: Icon }: any) => (
    <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        minHeight: '130px'
    }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{label}</p>
            <Icon size={18} color="var(--text-muted)" style={{ opacity: 0.5 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)' }}>{value}</h3>
            {trend && <span style={{ fontSize: '0.75rem', color: trendColor, fontWeight: 700 }}>{trend}</span>}
        </div>
    </div>
);
