import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthService } from '../../core/api/auth.service';
import { AdminService } from '../../core/api/admin.service';
import {
    BarChart3,
    Layout,
    Users,
    DollarSign,
    ShieldAlert,
    Settings,
    Search,
    Bell,
    FileText,
    Activity,
    Calendar,
    LogOut,
    Globe,
    Sun,
    Moon,
    ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-Pages ---
import { AdminOverview } from './components/AdminOverview';
import { EventApprovalsView } from './components/EventApprovalsView';
import { FraudMonitoringView } from './components/FraudMonitoringView';
import { OrganizerApprovalsView } from './components/OrganizerApprovalsView';
import { CommissionsView } from './components/CommissionsView';
import { PayoutsManagementView } from './components/PayoutManagementView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { ContentManagementView } from './components/ContentManagementView';
import { AnalyticsView } from './components/AnalyticsView';
import { PlatformControlView } from './components/PlatformControlView';

import { TeamManagementView } from './components/TeamManagementView';
import { ActivityLogView } from './components/ActivityLogView';

// --- Types ---
export type AdminTab = 'Dashboard' | 'Organizer Approvals' | 'Event Approvals' | 'Commissions' | 'GMV Tracking' | 'Platform Revenue' | 'Organizer Payouts' | 'Settlement Ledger' | 'Fraud Monitoring' | 'Content' | 'Invite Admin' | 'Settings' | 'Platform Health' | 'Audit Logs';

// --- Main Admin Dashboard Component ---

const AdminDashboard = () => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
    const [pendingCount, setPendingCount] = useState(0);
    const [eventPendingCount, setEventPendingCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
    };

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [orgs, stats, notifRes]: any = await Promise.all([
                    AdminService.getPendingOrganizers(),
                    AdminService.getStats(),
                    AdminService.getNotifications()
                ]);
                setPendingCount(orgs.filter((o: any) => o.status === 'PENDING').length);
                setEventPendingCount(stats.kpis.pendingEvents);
                setNotifications(notifRes.data);
            } catch (err) {
                console.error('Failed to fetch admin counts', err);
            }
        };
        fetchCounts();
        // Refresh every 30s
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        AuthService.logout();
    };

    const handleFeatureResponse = async (notificationId: number, approved: boolean) => {
        try {
            await AdminService.respondToFeatureRequest(notificationId, approved);
            const res: any = await AdminService.getNotifications();
            setNotifications(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const navItems = [
        { icon: Layout, label: 'Dashboard' as AdminTab, display: t('admin.dashboard'), key: 'dashboard' },
        { icon: Users, label: 'Organizer Approvals' as AdminTab, count: pendingCount > 0 ? pendingCount : undefined, display: t('admin.organizers'), key: 'organizers' },
        { icon: Calendar, label: 'Event Approvals' as AdminTab, count: eventPendingCount > 0 ? eventPendingCount : undefined, display: t('admin.events'), key: 'events' },
        { icon: BarChart3, label: 'Commissions' as AdminTab, display: t('admin.commissions'), key: 'commissions' },
        { icon: DollarSign, label: 'GMV' as AdminTab, display: t('admin.gmv', 'GMV Tracking'), key: 'gmv' },
        { icon: DollarSign, label: 'Platform Revenue' as AdminTab, display: t('admin.revenue', 'Platform Revenue'), key: 'revenue' },
        { icon: DollarSign, label: 'Organizer Payouts' as AdminTab, display: t('admin.payouts', 'Organizer Payouts'), key: 'payouts' },
        { icon: DollarSign, label: 'Settlement Status' as AdminTab, display: t('admin.settlements', 'Settlement Status'), key: 'settlements' },
        { icon: ShieldAlert, label: 'Fraud' as AdminTab, display: t('admin.fraud'), key: 'fraud' },
        { icon: FileText, label: 'Content' as AdminTab, display: t('admin.content'), key: 'content' },
        { icon: Activity, label: 'Analytics' as AdminTab, display: t('admin.analytics'), key: 'analytics' },
        { icon: BarChart3, label: 'Reports' as AdminTab, display: t('admin.reports', 'Reports'), key: 'reports' },
        { icon: Users, label: 'Invite Admin' as AdminTab, display: t('admin.invite', 'Invite Admin'), key: 'invite_admin' },
        { icon: Settings, label: 'Monitoring' as AdminTab, display: "System Control Center", key: 'platform_control' },
    ];

    const currentNavItem = navItems.find(n => n.label === activeTab) || (activeTab === 'Settings' ? { display: 'Account Settings' } : null);

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard': return <AdminOverview setActiveTab={setActiveTab} />;
            case 'Organizer Approvals': return <OrganizerApprovalsView />;
            case 'Event Approvals': return <EventApprovalsView />;
            case 'Fraud Monitoring': return <FraudMonitoringView />;
            case 'Commissions': return <CommissionsView />;
            case 'GMV Tracking': return <AnalyticsView view="GMV" />;
            case 'Platform Revenue': return <AnalyticsView view="REVENUE" />;
            case 'Organizer Payouts': return <PayoutsManagementView view="QUEUE" />;
            case 'Settlement Ledger': return <PayoutsManagementView view="SETTLEMENTS" />;
            case 'Content': return <ContentManagementView />;
            case 'Invite Admin': return <TeamManagementView />;
            case 'Platform Health': return <PlatformControlView />;
            case 'Audit Logs': return <ActivityLogView />;
            case 'Settings': return <AdminSettingsView />;
            default: return <AdminOverview setActiveTab={setActiveTab} />;
        }
    }

    return (
        <div className="container-fluid" style={{ background: 'var(--bg-main)' }}>
            {/* 🟢 Admin Sidebar */}
            <aside className="sidebar" style={{ width: '280px', background: 'var(--bg-sidebar)' }}>
                <div className="logo-section" style={{ marginBottom: '40px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#E0E0E0' }}>
                        <img src="https://ui-avatars.com/api/?name=Admin+Portal&background=000&color=fff" style={{ width: '100%' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Admin Portal</h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Super Admin Access</p>
                    </div>
                </div>

                <nav className="nav-group" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
                    {/* Dashboard - Always top */}
                    <div
                        className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Dashboard')}
                        style={{ marginBottom: '24px' }} // Spacing after dashboard
                    >
                        <Layout size={18} />
                        <span style={{ fontSize: '0.9rem' }}>{t('admin.dashboard')}</span>
                    </div>

                    {[
                        {
                            title: 'Org. & Event Management',
                            items: [
                                { icon: Users, label: 'Organizer Approvals', count: pendingCount > 0 ? pendingCount : undefined, display: t('admin.organizers') },
                                { icon: Calendar, label: 'Event Approvals', count: eventPendingCount > 0 ? eventPendingCount : undefined, display: t('admin.events') },
                                { icon: BarChart3, label: 'Commissions', display: t('admin.commissions') }
                            ]
                        },
                        {
                            title: 'Financial Control',
                            items: [
                                { icon: DollarSign, label: 'GMV Tracking', display: 'GMV Tracking' },
                                { icon: DollarSign, label: 'Platform Revenue', display: 'Platform Revenue' },
                                { icon: DollarSign, label: 'Organizer Payouts', display: 'Organizer Payouts' },
                                { icon: DollarSign, label: 'Settlement Ledger', display: 'Settlement Ledger' }
                            ]
                        },
                        {
                            title: 'Security & System',
                            items: [
                                { icon: ShieldAlert, label: 'Fraud Monitoring', display: 'Fraud Monitoring' },
                                { icon: Activity, label: 'Platform Health', display: 'Platform Health' },
                                { icon: ClipboardList, label: 'Audit Logs', display: 'Audit Logs' },
                                { icon: Users, label: 'Invite Admin', display: 'Invite Admin' },
                                { icon: FileText, label: 'Content', display: 'Content Management' }
                            ]
                        }
                    ].map((group, groupIndex) => (
                        <div key={groupIndex} style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>
                                {group.title}
                            </h3>
                            {group.items.map((item: any) => (
                                <div
                                    key={item.label}
                                    className={`nav-item ${activeTab === item.label ? 'active' : ''}`}
                                    onClick={() => setActiveTab(item.label as AdminTab)}
                                    style={{ position: 'relative' }}
                                >
                                    <item.icon size={18} />
                                    <span style={{ fontSize: '0.9rem' }}>{item.display}</span>
                                    {item.count && (
                                        <div style={{
                                            position: 'absolute',
                                            right: '12px',
                                            background: '#EF4444',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            padding: '2px 6px',
                                            borderRadius: '10px'
                                        }}>
                                            {item.count}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <div className="nav-item" onClick={toggleLanguage}>
                        <Globe size={18} />
                        <span>{i18n.language === 'en' ? 'Amharic (አማርኛ)' : 'English'}</span>
                    </div>
                    <div className="nav-item" onClick={() => setActiveTab('Settings')}>
                        <Settings size={18} />
                        <span>{t('admin.settings', 'Settings')}</span>
                    </div>
                    <div className="nav-item" style={{ color: '#EF4444' }} onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>{t('admin.logout')}</span>
                    </div>
                </div>
            </aside>

            {/* 🔵 Admin Main Content */}
            <main className="main-content" style={{ padding: '32px 40px' }}>
                <header className="top-header" style={{ marginBottom: '32px', background: 'transparent' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{(currentNavItem as any)?.display || activeTab}</h2>

                    <div className="search-pill" style={{ width: '400px', background: 'var(--bg-card)' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Try searching 'events', 'payouts', or 'logs'..."
                            style={{ fontSize: '0.85rem' }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.currentTarget.value.toLowerCase();
                                    if (val.includes('event')) setActiveTab('Event Approvals');
                                    else if (val.includes('org')) setActiveTab('Organizer Approvals');
                                    else if (val.includes('comm')) setActiveTab('Commissions');
                                    else if (val.includes('log') || val.includes('audit')) setActiveTab('Audit Logs');
                                    else if (val.includes('fraud')) setActiveTab('Fraud Monitoring');
                                    else if (val.includes('payout')) setActiveTab('Organizer Payouts');
                                    else if (val.includes('gmv')) setActiveTab('GMV Tracking');
                                    else if (val.includes('revenue')) setActiveTab('Platform Revenue');
                                    else if (val.includes('settle')) setActiveTab('Settlement Ledger');
                                    else if (val.includes('team') || val.includes('invite')) setActiveTab('Invite Admin');
                                    else if (val.includes('control') || val.includes('health')) setActiveTab('Platform Health');
                                }
                            }}
                        />
                    </div>

                    <div className="header-actions" style={{ position: 'relative' }}>
                        <div
                            className="action-icon"
                            onClick={() => setShowNotifications(!showNotifications)}
                            style={{ background: 'rgba(255,255,255,0.03)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <Bell size={18} />
                            {(pendingCount + eventPendingCount) > 0 && (
                                <span style={{ position: 'absolute', top: 0, right: 0, width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', border: '2px solid #0B0E14' }} />
                            )}
                        </div>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    style={{
                                        position: 'absolute', top: '50px', right: 0, width: '320px',
                                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                                        borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                                        zIndex: 1000, overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Notifications</h4>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pendingCount + eventPendingCount} Pending</span>
                                    </div>
                                    <div style={{ padding: '8px' }}>
                                        {pendingCount > 0 && (
                                            <div
                                                onClick={() => { setActiveTab('Organizer Approvals'); setShowNotifications(false); }}
                                                style={{ padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Users size={16} color="#3B82F6" />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>Organizer Review</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pendingCount} applications waiting</p>
                                                </div>
                                            </div>
                                        )}
                                        {eventPendingCount > 0 && (
                                            <div
                                                onClick={() => { setActiveTab('Event Approvals'); setShowNotifications(false); }}
                                                style={{ padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Calendar size={16} color="#F59E0B" />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>Event Moderation</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{eventPendingCount} events pending</p>
                                                </div>
                                            </div>
                                        )}
                                        {pendingCount === 0 && eventPendingCount === 0 && notifications.length === 0 && (
                                            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                <p style={{ fontSize: '0.85rem' }}>All caught up! 🎉</p>
                                            </div>
                                        )}

                                        {/* Recent System Notifications */}
                                        {notifications.length > 0 && (
                                            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', padding: '0 8px 4px 8px' }}>Recent Activity</p>
                                                {notifications.slice(0, 5).map((n: any) => (
                                                    <div key={n.id} style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: n.metadata?.type === 'FEATURE_REQUEST' ? '#FBBF24' : 'white' }}>{n.title}</span>
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{n.content}</p>
                                                        {n.metadata?.type === 'FEATURE_REQUEST' && (
                                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                                <button onClick={(e) => { e.stopPropagation(); handleFeatureResponse(n.id, true); }} style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#10B981', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', fontWeight: 600 }}>Approve</button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleFeatureResponse(n.id, false); }} style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', borderRadius: '4px', cursor: 'pointer', color: '#EF4444', fontWeight: 600 }}>Reject</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                                        <button
                                            onClick={() => setShowNotifications(false)}
                                            style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            Dismiss All
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div
                            className="action-icon"
                            onClick={toggleTheme}
                            style={{ background: 'var(--bg-subtle)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </div>

                        <div
                            className="action-icon"
                            onClick={() => setActiveTab('Settings')}
                            style={{ background: 'var(--bg-subtle)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <Settings size={18} />
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default AdminDashboard;
