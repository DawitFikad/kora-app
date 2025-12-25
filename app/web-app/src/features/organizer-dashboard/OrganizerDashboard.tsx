import { useState } from 'react';
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
    DollarSign
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

// --- Main Application Component ---

const OrganizerDashboard = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');

    const navItems = [
        { icon: Layout, label: 'Dashboard' },
        { icon: Calendar, label: 'Events' },
        { icon: Ticket, label: 'Tickets' },
        { icon: DollarSign, label: 'Payments' },
        { icon: Users, label: 'Attendees' },
        { icon: HelpCircle, label: 'Support' },
        { icon: Settings, label: 'Settings' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard': return <DashboardView />;
            case 'Events': return <MyEventsView />;
            case 'Tickets': return <TicketsView />;
            case 'Payments': return <ReportsView />;
            case 'Attendees': return <AttendeesView />;
            case 'Support': return <SupportView />;
            case 'Settings': return <SettingsView />;
            default: return <DashboardView />;
        }
    }

    return (
        <div className="container-fluid">
            {/* 🟢 Sidebar */}
            <aside className="sidebar">
                <div className="logo-section">
                    <div className="logo-box">
                        <BarChart3 color="#1D90F5" size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, lineHeight: 1.1 }}>Event Manager</h2>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Organizer Console</p>
                    </div>
                </div>

                <nav className="nav-group">
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

                <div className="sidebar-footer">
                    <button className="btn-blue">
                        <PlusCircle size={22} fill="white" color="#1D90F5" /> Create Event
                    </button>
                </div>
            </aside>

            {/* 🔵 Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <div style={{ opacity: activeTab === 'Dashboard' ? 1 : 0, pointerEvents: activeTab === 'Dashboard' ? 'all' : 'none' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dashboard Overview</h2>
                    </div>

                    <div className="search-pill">
                        <Search size={18} color="#8E9BAE" />
                        <input type="text" placeholder={`Search ${activeTab.toLowerCase()}...`} />
                    </div>

                    <div className="header-actions">
                        <div className="action-icon">
                            <Bell size={22} />
                            <div style={{ position: 'absolute', top: 2, right: 2, width: '8px', height: '8px', background: '#FF4D4D', borderRadius: '50%', border: '2px solid var(--bg-main)' }} />
                        </div>
                        <HelpCircle size={22} className="action-icon" />

                        <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(45deg, #1D90F5, #D946EF)', padding: '2px' }}>
                                <img src="https://ui-avatars.com/api/?name=Alex+Morgan&background=11141B&color=fff" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>Alex Morgan</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Organizer</p>
                            </div>
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

export default OrganizerDashboard;
