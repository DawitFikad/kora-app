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
import { AnimatePresence } from 'framer-motion';

// --- Sub-Pages ---
import { AdminOverview } from './components/AdminOverview';
import { EventApprovalsView } from './components/EventApprovalsView';
import { FraudMonitoringView } from './components/FraudMonitoringView';
import { OrganizerApprovalsView } from './components/OrganizerApprovalsView';
import { FinancialsView } from './components/FinancialsView';
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
        { icon: Layout, label: 'Dashboard' as AdminTab },
        { icon: Users, label: 'Organizer Approvals' as AdminTab, count: pendingCount > 0 ? pendingCount : undefined },
        { icon: Calendar, label: 'Event Approvals' as AdminTab, count: eventPendingCount > 0 ? eventPendingCount : undefined },
        { icon: BarChart3, label: 'Commissions' as AdminTab },
        { icon: DollarSign, label: 'GMV' as AdminTab },
        { icon: ShieldAlert, label: 'Fraud' as AdminTab },
        { icon: FileText, label: 'Content' as AdminTab },
        { icon: Activity, label: 'Analytics' as AdminTab },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard': return <AdminOverview />;
            case 'Organizer Approvals': return <OrganizerApprovalsView />;
            case 'Event Approvals': return <EventApprovalsView />;
            case 'Fraud': return <FraudMonitoringView />;
            case 'Commissions':
            case 'GMV': return <FinancialsView />;
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
                            <span style={{ fontSize: '0.9rem' }}>{item.label === 'Commissions' ? 'Commissions & Fees' : item.label === 'GMV' ? 'GMV & Payouts' : item.label === 'Fraud' ? 'Fraud Monitoring' : item.label === 'Content' ? 'Content Management' : item.label}</span>
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
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{activeTab === 'Dashboard' ? 'Dashboard Overview' : activeTab}</h2>

                    <div className="search-pill" style={{ width: '400px', background: '#12171F' }}>
                        <Search size={18} color="#57606A" />
                        <input type="text" placeholder="Search event ID, user, or email..." style={{ fontSize: '0.85rem' }} />
                    </div>

                    <div className="header-actions">
                        <div className="action-icon" style={{ background: 'rgba(255,255,255,0.03)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bell size={18} />
                        </div>
                        <div className="action-icon" style={{ background: 'rgba(255,255,255,0.03)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
