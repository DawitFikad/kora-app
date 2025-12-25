import { useState, useEffect } from 'react';
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
    LogOut
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

// --- Types ---
type AdminTab = 'Dashboard' | 'Organizer Approvals' | 'Event Approvals' | 'Commissions' | 'GMV' | 'Fraud' | 'Content' | 'Analytics' | 'Settings';

// --- Main Admin Dashboard Component ---

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
    const [pendingCount, setPendingCount] = useState(0);
    const [eventPendingCount, setEventPendingCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [orgs, stats]: any = await Promise.all([
                    AdminService.getPendingOrganizers(),
                    AdminService.getStats()
                ]);
                setPendingCount(orgs.filter((o: any) => o.status === 'PENDING').length);
                setEventPendingCount(stats.kpis.pendingEvents);
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

    const navItems = [
        { icon: Layout, label: 'Dashboard' as AdminTab, display: 'Dashboard Overview' },
        { icon: Users, label: 'Organizer Approvals' as AdminTab, count: pendingCount > 0 ? pendingCount : undefined },
        { icon: Calendar, label: 'Event Approvals' as AdminTab, count: eventPendingCount > 0 ? eventPendingCount : undefined },
        { icon: BarChart3, label: 'Commissions' as AdminTab, display: 'Commissions & Fees' },
        { icon: DollarSign, label: 'GMV' as AdminTab, display: 'GMV & Payouts' },
        { icon: ShieldAlert, label: 'Fraud' as AdminTab, display: 'Fraud Monitoring' },
        { icon: FileText, label: 'Content' as AdminTab, display: 'Content Management' },
        { icon: Activity, label: 'Analytics' as AdminTab, display: 'Detailed Analytics' },
    ];

    const currentNavItem = navItems.find(n => n.label === activeTab) || (activeTab === 'Settings' ? { display: 'Account Settings' } : null);

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard': return <AdminOverview />;
            case 'Organizer Approvals': return <OrganizerApprovalsView />;
            case 'Event Approvals': return <EventApprovalsView />;
            case 'Fraud': return <FraudMonitoringView />;
            case 'Commissions': return <CommissionsView />;
            case 'GMV': return <PayoutsManagementView />;
            case 'Content': return <ContentManagementView />;
            case 'Analytics': return <AnalyticsView />;
            case 'Settings': return <AdminSettingsView />;
            default: return <AdminOverview />;
        }
    }

    return (
        <div className="container-fluid" style={{ background: '#0B0E14' }}>
            {/* 🟢 Admin Sidebar */}
            <aside className="sidebar" style={{ width: '280px', background: '#0C1017' }}>
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
                    {navItems.map((item) => (
                        <div
                            key={item.label}
                            className={`nav-item ${activeTab === item.label ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.label)}
                        >
                            <item.icon size={18} />
                            <span style={{ fontSize: '0.9rem' }}>{item.display || item.label}</span>
                            {item.count && (
                                <span style={{ marginLeft: 'auto', background: activeTab === item.label ? 'rgba(255,255,255,0.2)' : 'rgba(59, 130, 246, 0.1)', color: activeTab === item.label ? 'white' : '#3B82F6', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                                    {item.count}
                                </span>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <div className="nav-item" onClick={() => setActiveTab('Settings')}>
                        <Settings size={18} />
                        <span>Settings</span>
                    </div>
                    <div className="nav-item" style={{ color: '#EF4444' }} onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </div>
                </div>
            </aside>

            {/* 🔵 Admin Main Content */}
            <main className="main-content" style={{ padding: '32px 40px' }}>
                <header className="top-header" style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{(currentNavItem as any)?.display || activeTab}</h2>

                    <div className="search-pill" style={{ width: '400px', background: '#12171F' }}>
                        <Search size={18} color="#57606A" />
                        <input
                            type="text"
                            placeholder="Search event ID, user, or email..."
                            style={{ fontSize: '0.85rem' }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    alert(`Searching for: ${e.currentTarget.value}`);
                                    // Global search logic could be integrated here
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
                                        background: '#161B22', border: '1px solid var(--border)',
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
                                        {pendingCount === 0 && eventPendingCount === 0 && (
                                            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                <p style={{ fontSize: '0.85rem' }}>All caught up! 🎉</p>
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
                            onClick={() => setActiveTab('Settings')}
                            style={{ background: 'rgba(255,255,255,0.03)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <Settings size={18} />
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </main>

            <style>{`
                .admin-stat-card-mini {
                    background: #12171F;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 20px;
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .admin-stat-card-mini:hover {
                    border-color: rgba(255,255,255,0.1);
                    background: #161B22;
                }
                .admin-stat-card-main {
                    background: #12171F;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 24px;
                }
                .admin-card {
                    background: #12171F;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                }
                .admin-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .admin-table th {
                    text-align: left;
                    padding: 16px 24px;
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid var(--border);
                }
                .admin-table td {
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border);
                }
                .admin-table tr:hover {
                    background: rgba(255,255,255,0.01);
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
