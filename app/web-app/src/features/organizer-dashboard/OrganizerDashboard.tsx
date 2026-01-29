import { useState, useEffect } from 'react';
import { useAuth } from '../../core/context/AuthContext';
import { useTheme } from '../../core/context/ThemeContext';
import { useLanguage } from '../../core/context/LanguageContext';
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
    Maximize,
    LogOut,
    FileText,
    Sun,
    Moon,
    RefreshCw
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// --- Sub-Pages Components ---
import { DashboardView } from './components/DashboardView';
import { MyEventsView } from './components/MyEventsView';
import { TicketsView } from './components/TicketsView';

import { AttendeesView } from './components/AttendeesView';
import { SupportView } from './components/SupportView';
import { SettingsView } from './components/SettingsView';
import { CreateEventView } from './components/CreateEventView';
import { EditEventView } from './components/EditEventView';
import { PromotionsView } from './components/PromotionsView';
import { ScannerView } from './components/ScannerView';
import { PendingApprovalView } from './components/PendingApprovalView';
import { EventStatsView } from './components/EventStatsView';
import { ContentManagementView } from './components/ContentManagementView';
import { AdvancedAnalyticsView } from './components/AdvancedAnalyticsView';
import { ReportGeneratorView } from './components/ReportGeneratorView';
import { SalesRevenueView } from './components/SalesRevenueView';
import { RefundsView } from './components/RefundsView';


// --- Main Application Component ---

const OrganizerDashboard = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [viewingStatsId, setViewingStatsId] = useState<number | null>(null);
    const [organizerProfile, setOrganizerProfile] = useState<any>(null);

    // Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    // Fetch organizer profile on mount to get logo and name
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { OrganizerService } = await import('../../core/api/organizer.service');

                // Fetch Profile
                const settingsRes = await OrganizerService.getSettings();
                if (settingsRes && (settingsRes as any).success) {
                    setOrganizerProfile((settingsRes as any).data);
                } else {
                    setOrganizerProfile(settingsRes);
                }

                // Fetch Notifications
                const notifRes = await OrganizerService.getNotifications();
                if ((notifRes as any).success) {
                    setNotifications((notifRes as any).data);
                    setUnreadCount((notifRes as any).unreadCount || 0);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };
        fetchData();

        // Optional: Poll notifications every minute
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [activeTab]);

    // Group Notifications Helper
    const getGroupedNotifications = () => {
        const groups: any = {
            new: [],
            today: [],
            yesterday: [],
            older: []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterday = today - 86400000;

        notifications.forEach(n => {
            if (!n.isRead) {
                groups.new.push(n);
                return;
            }

            const nDate = new Date(n.createdAt).getTime();
            if (nDate >= today) {
                groups.today.push(n);
            } else if (nDate >= yesterday) {
                groups.yesterday.push(n);
            } else {
                groups.older.push(n);
            }
        });

        return groups;
    };

    const handleMarkAsRead = async (id?: number) => {
        try {
            const { OrganizerService } = await import('../../core/api/organizer.service');
            if (id) {
                await OrganizerService.markNotificationsRead({ notificationIds: [id] });
                // Update local state
                const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
                setNotifications(updated);
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                // Mark all displayed (or all new) as read
                // For now, let's just mark all new as read if user clicks "Mark all read"
                const newIds = notifications.filter(n => !n.isRead).map(n => n.id);
                if (newIds.length > 0) {
                    await OrganizerService.markNotificationsRead({ notificationIds: newIds });
                    const updated = notifications.map(n => ({ ...n, isRead: true }));
                    setNotifications(updated);
                    setUnreadCount(0);
                }
            }
        } catch (error) {
            console.error("Failed to mark read", error);
        }
    };

    const handleEditEvent = (eventId: number) => {
        setEditingEventId(eventId);
        setActiveTab('EditEvent');
    };

    const handleViewStats = (eventId: number) => {
        setViewingStatsId(eventId);
        setActiveTab('EventStats');
    };

    const navItems = [
        { icon: Layout, label: 'Dashboard', display: t('org.nav.dashboard', 'Dashboard') },
        { icon: Calendar, label: 'Events', display: t('org.nav.events', 'Events') },
        { icon: Ticket, label: 'Tickets', display: t('org.nav.tickets', 'Tickets') },
        { icon: DollarSign, label: 'Sales', display: t('org.nav.sales', 'Sales') },
        { icon: BarChart3, label: 'Analytics', display: t('org.nav.analytics', 'Analytics') },
        { icon: FileText, label: 'Reports', display: t('org.nav.reports', 'Reports') },
        { icon: Users, label: 'Attendees', display: t('org.nav.attendees', 'Attendees') },
        { icon: Megaphone, label: 'Promotions', display: t('org.nav.promotions', 'Promotions') },
        { icon: RefreshCw, label: 'Refunds', display: t('org.nav.refunds', 'Refunds') },
        { icon: Layout, label: 'Content', display: t('org.nav.content', 'Content') },
        { icon: Maximize, label: 'Scanner', display: t('org.nav.scanner', 'Scanner') },
        { icon: HelpCircle, label: 'Support', display: t('org.nav.support', 'Support') },
        { icon: Settings, label: 'Settings', display: t('org.nav.settings', 'Settings') },
    ];

    const titleMap: Record<string, string> = {
        Dashboard: t('org.title.dashboard', 'Dashboard Overview'),
        CreateEvent: t('org.title.createEvent', 'Create New Event')
    };

    const activeTitle = titleMap[activeTab] || t(`org.title.${activeTab.toLowerCase()}`, activeTab);

    // If pending, show the invitation/waiting page instead of the full dashboard
    if (user?.status === 'PENDING') {
        return (
            <div className="container-fluid" style={{ minHeight: '100vh', background: 'var(--bg-main)', flexDirection: 'column' }}>
                <header style={{
                    padding: '24px 80px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-sidebar)', zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="logo-box">
                            <BarChart3 color="#1D90F5" size={24} strokeWidth={2.5} />
                        </div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>ET-Ticket</h2>
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
                        {t('org.actions.signOut', 'Sign Out')}
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
            case 'Dashboard': return <DashboardView key="dashboard" onNavigate={setActiveTab} />;
            case 'Events': return <MyEventsView key="events" onNavigate={setActiveTab} onEditEvent={handleEditEvent} onViewStats={handleViewStats} />;
            case 'Tickets': return <TicketsView key="tickets" />;
            case 'Sales': return <SalesRevenueView key="sales" />;
            case 'Analytics': return <AdvancedAnalyticsView key="analytics" />;
            case 'Reports': return <ReportGeneratorView key="reports" />;
            case 'Attendees': return <AttendeesView key="attendees" />;
            case 'Promotions': return <PromotionsView key="promotions" />;
            case 'Refunds': return <RefundsView key="refunds" />;
            case 'Content': return <ContentManagementView key="content" />;
            case 'Scanner': return <ScannerView key="scanner" />;
            case 'Support': return <SupportView key="support" />;
            case 'Settings': return <SettingsView key="settings" />;
            case 'CreateEvent': return <CreateEventView key="create-event" onComplete={() => setActiveTab('Events')} />;
            case 'EditEvent': return editingEventId ? <EditEventView key={`edit-${editingEventId}`} eventId={editingEventId} onComplete={() => { setEditingEventId(null); setActiveTab('Events'); }} /> : <DashboardView key="fallback" onNavigate={setActiveTab} />;
            case 'EventStats': return viewingStatsId ? <EventStatsView key={`stats-${viewingStatsId}`} eventId={viewingStatsId} onBack={() => { setViewingStatsId(null); setActiveTab('Events'); }} /> : <DashboardView key="fallback-stats" onNavigate={setActiveTab} />;
            default: return <DashboardView key="default" onNavigate={setActiveTab} />;
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
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1.1 }}>{t('org.brand.title', 'Event Manager')}</h2>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('org.brand.subtitle', 'Organizer Console')}</p>
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
                            {item.display}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ padding: '24px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={() => setActiveTab('CreateEvent')}
                        className="btn-blue"
                        style={{ width: '100%', padding: '14px', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <PlusCircle size={20} /> {t('org.actions.createEvent', 'Create Event')}
                    </button>
                    <button
                        onClick={logout}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '14px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#EF4444',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <LogOut size={18} /> {t('org.actions.signOut', 'Sign Out')}
                    </button>
                </div>
            </aside>

            {/* 🔵 Main Content */}
            <main className="main-content">
                <header className="top-header" style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                            {activeTitle}
                        </h2>
                    </div>

                    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div className="search-pill" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-main)', padding: '10px 20px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                            <Search size={18} color="var(--text-muted)" />
                            <input type="text" placeholder={t('org.search', 'Search...')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem' }} />
                        </div>

                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div
                                className="action-icon"
                                onClick={toggleTheme}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                            </div>

                            <div
                                className="action-icon"
                                onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'var(--bg-hover)',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                {language.toUpperCase()}
                            </div>

                            <div style={{ position: 'relative' }}>
                                <div
                                    className="action-icon"
                                    style={{ position: 'relative', cursor: 'pointer' }}
                                    onClick={() => setShowNotifications(!showNotifications)}
                                >
                                    <Bell size={22} color="var(--text-muted)" />
                                    {unreadCount > 0 && (
                                        <div style={{ position: 'absolute', top: -6, right: -6, background: '#FF4D4D', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px', border: '2px solid #0B0E14', minWidth: '18px', textAlign: 'center' }}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </div>
                                    )}
                                </div>

                                {showNotifications && (
                                    <>
                                        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowNotifications(false)} />
                                        <div style={{ position: 'absolute', top: '50px', right: '-10px', width: '380px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                                            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card-hover)' }}>
                                                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Notifications</h4>
                                                {unreadCount > 0 && (
                                                    <span onClick={(e) => { e.stopPropagation(); handleMarkAsRead(); }} style={{ fontSize: '0.8rem', color: '#1D90F5', cursor: 'pointer', fontWeight: 600 }}>Mark all read</span>
                                                )}
                                            </div>
                                            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                                {(['new', 'today', 'yesterday', 'older'] as const).map(group => {
                                                    const items = getGroupedNotifications()[group];
                                                    if (!items || items.length === 0) return null;
                                                    return (
                                                        <div key={group}>
                                                            <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.02)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                {group}
                                                            </div>
                                                            {items.map((n: any) => (
                                                                <div
                                                                    key={n.id}
                                                                    onClick={() => handleMarkAsRead(n.id)}
                                                                    style={{
                                                                        padding: '16px',
                                                                        borderBottom: '1px solid var(--border)',
                                                                        cursor: 'pointer',
                                                                        background: n.isRead ? 'transparent' : 'rgba(29, 144, 245, 0.05)',
                                                                        transition: 'background 0.2s',
                                                                        display: 'flex',
                                                                        gap: '12px'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(29, 144, 245, 0.08)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(29, 144, 245, 0.05)'}
                                                                >
                                                                    <div style={{ marginTop: '2px' }}>
                                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.isRead ? 'transparent' : '#1D90F5', border: n.isRead ? '1px solid var(--text-muted)' : 'none' }} />
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <p style={{ fontSize: '0.9rem', marginBottom: '4px', lineHeight: '1.4', color: n.isRead ? 'var(--text-muted)' : 'var(--text-main)' }}>{n.content}</p>
                                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                                {notifications.length === 0 && (
                                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                        <Bell size={32} color="#2D333B" style={{ marginBottom: '16px' }} />
                                                        <p>No notifications yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <HelpCircle size={22} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                    </div>

                    <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />

                    <div
                        onClick={() => setActiveTab('Settings')}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    >
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(45deg, #1D90F5, #D946EF)', padding: '2px' }}>
                            <img
                                src={organizerProfile?.logoUrl ? `http://localhost:4000${organizerProfile.logoUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(organizerProfile?.organizationName || user?.phoneNumber || 'Org')}&background=11141B&color=fff`}
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                alt="Avatar"
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>{organizerProfile?.organizationName || user?.profile?.fullName || user?.phoneNumber}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Organizer</p>
                        </div>
                    </div>

                </header>

                <div style={{ padding: '40px' }}>
                    <AnimatePresence mode="wait">
                        {renderContent()}
                    </AnimatePresence>
                </div>
            </main>
        </div >

    );
};

export default OrganizerDashboard;
