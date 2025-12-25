import { useState } from 'react';
import { useAuth } from '../../core/context/AuthContext';
import {
    Calendar,
    Ticket,
    BarChart3,
    Settings,
    Search,
    Bell,
    HelpCircle,
    PlusCircle,
    Users,
    Layout,
    DollarSign,
    Megaphone,
    Maximize
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// --- Sub-Pages Components ---
import { DashboardView } from './components/DashboardView';
import { MyEventsView } from './components/MyEventsView';
import { TicketsView } from './components/TicketsView';
import { ReportsView } from './components/ReportsView';
import { AttendeesView } from './components/AttendeesView';
import { SupportView } from './components/SupportView';
import { SettingsView } from './components/SettingsView';
import { CreateEventView } from './components/CreateEventView';
import { PromotionsView } from './components/PromotionsView';
import { ScannerView } from './components/ScannerView';
import { PendingApprovalView } from './components/PendingApprovalView';

// --- Main Application Component ---

const OrganizerDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('Dashboard');

    const navItems = [
        { icon: Layout, label: 'Dashboard' },
        { icon: Calendar, label: 'Events' },
        { icon: Ticket, label: 'Tickets' },
        { icon: DollarSign, label: 'Payments' },
        { icon: Users, label: 'Attendees' },
        { icon: Megaphone, label: 'Promotions' },
        { icon: Maximize, label: 'Scanner' },
        { icon: HelpCircle, label: 'Support' },
        { icon: Settings, label: 'Settings' },
    ];

    // If pending, show the invitation/waiting page instead of the full dashboard
    if (user?.status === 'PENDING') {
        return (
            <div className="container-fluid" style={{ minHeight: '100vh', background: '#0B0E14', flexDirection: 'column' }}>
                <header style={{
                    padding: '24px 80px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', borderBottom: '1px solid var(--border)',
                    background: '#0B0E14', zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="logo-box">
                            <BarChart3 color="#1D90F5" size={24} strokeWidth={2.5} />
                        </div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>ET-Ticket</h2>
                    </div>

                    <button
                        onClick={logout}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#EF4444', padding: '10px 24px', borderRadius: '14px',
                            cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
                            transition: 'all 0.2s'
                        }}
                    >
                        Sign Out
                    </button>
                </header>

                <main style={{ flex: 1, overflowY: 'auto', padding: '60px 0' }}>
                    <PendingApprovalView user={user} />
                </main>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard': return <DashboardView />;
            case 'Events': return <MyEventsView />;
            case 'Tickets': return <TicketsView />;
            case 'Payments': return <ReportsView />;
            case 'Attendees': return <AttendeesView />;
            case 'Promotions': return <PromotionsView />;
            case 'Scanner': return <ScannerView />;
            case 'Support': return <SupportView />;
            case 'Settings': return <SettingsView />;
            case 'CreateEvent': return <CreateEventView onComplete={() => setActiveTab('Events')} />;
            default: return <DashboardView />;
        }
    };

    return (
        <div className="container-fluid">
            {/* 🟢 Sidebar */}
            <aside className="sidebar">
                <div className="logo-section" style={{ padding: '32px 24px' }}>
                    <div className="logo-box" style={{ width: '40px', height: '40px', background: 'rgba(29, 144, 245, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart3 color="#1D90F5" size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1.1 }}>Event Manager</h2>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Organizer Console</p>
                    </div>
                </div>

                <nav className="nav-group" style={{ padding: '0 16px' }}>
                    {navItems.map((item) => (
                        <div
                            key={item.label}
                            className={`nav-item ${activeTab === item.label ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.label)}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ padding: '24px', marginTop: 'auto' }}>
                    <button
                        onClick={() => setActiveTab('CreateEvent')}
                        className="btn-blue"
                        style={{ width: '100%', padding: '14px', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <PlusCircle size={20} /> Create Event
                    </button>
                </div>
            </aside>

            {/* 🔵 Main Content */}
            <main className="main-content">
                <header className="top-header" style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeTab === 'Dashboard' ? 'Dashboard Overview' : activeTab}</h2>
                    </div>

                    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div className="search-pill" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.05)', padding: '10px 20px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                            <Search size={18} color="#8E9BAE" />
                            <input type="text" placeholder={`Search...`} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.9rem' }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="action-icon" style={{ position: 'relative', cursor: 'pointer' }}>
                                <Bell size={22} color="#8E9BAE" />
                                <div style={{ position: 'absolute', top: 2, right: 2, width: '8px', height: '8px', background: '#FF4D4D', borderRadius: '50%', border: '2px solid #0B0E14' }} />
                            </div>
                            <HelpCircle size={22} color="#8E9BAE" style={{ cursor: 'pointer' }} />
                        </div>

                        <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(45deg, #1D90F5, #D946EF)', padding: '2px' }}>
                                <img src={`https://ui-avatars.com/api/?name=${user?.phoneNumber}&background=11141B&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>{user?.profile?.fullName || user?.phoneNumber}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Organizer</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div style={{ padding: '0 40px 40px' }}>
                    <AnimatePresence mode="wait">
                        {renderContent()}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default OrganizerDashboard;
