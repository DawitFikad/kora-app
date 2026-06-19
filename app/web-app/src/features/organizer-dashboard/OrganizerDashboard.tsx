import { useState, useEffect } from 'react';
import { useAuth } from '../../core/context/AuthContext';
import { useTheme } from '../../core/context/ThemeContext';
import { useLanguage } from '../../core/context/LanguageContext';
import { resolveMediaUrl } from '../../core/utils/media';
import {
    Calendar,
    Ticket,
    BarChart3,
    Settings,
    Bell,
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
    const [dashboardAvatarFailed, setDashboardAvatarFailed] = useState(false);

    // Mobile sidebar
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    // Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationRefreshToken, setNotificationRefreshToken] = useState(0);


    const normalizeNotifications = (payload: any): any[] => {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.data)) return payload.data;
        return [];
    };

    const createFallbackNotificationsFromOverview = (overview: any): any[] => {
        if (!overview) return [];

        const rawAlerts: any[] = Array.isArray(overview.alerts) ? overview.alerts : [];
        const upcomingEvents: any[] = Array.isArray(overview.upcomingEvents) ? overview.upcomingEvents : [];

        const alertItems = rawAlerts.map((alert, index) => ({
            id: -(index + 1),
            content: alert?.message || alert?.content || 'Dashboard alert',
            title: alert?.title || 'Dashboard Alert',
            createdAt: new Date().toISOString(),
            isRead: false,
            localOnly: true,
        }));

        const now = Date.now();
        const upcomingItems = upcomingEvents
            .map((event: any, index: number) => {
                const eventTime = new Date(event?.date).getTime();
                if (!Number.isFinite(eventTime)) return null;

                const diffHours = Math.floor((eventTime - now) / (1000 * 60 * 60));
                if (diffHours < 0 || diffHours > 72) return null;

                let timeLabel = 'starting soon';
                const days = Math.floor(diffHours / 24);
                const hours = diffHours % 24;
                if (days > 0) {
                    timeLabel = days === 1 ? '1 day' : `${days} days`;
                } else if (hours > 0) {
                    timeLabel = hours === 1 ? '1 hour' : `${hours} hours`;
                }

                return {
                    id: -(1000 + index + 1),
                    content: `Event starting in ${timeLabel}: ${event?.title || 'Event'}`,
                    title: 'Upcoming Event',
                    createdAt: new Date().toISOString(),
                    isRead: false,
                    localOnly: true,
                    actionTab: 'Events',
                };
            })
            .filter(Boolean) as any[];

        const deduped = [...alertItems, ...upcomingItems].filter((item, index, arr) => {
            const key = String(item?.content || '').trim().toLowerCase();
            if (!key) return false;
            return arr.findIndex((n: any) => String(n?.content || '').trim().toLowerCase() === key) === index;
        });

        return deduped;
    };

    // Keep the page from scrolling; only the dashboard content should scroll.
    useEffect(() => {
        document.body.classList.add('dashboard-no-body-scroll');
        return () => {
            document.body.classList.remove('dashboard-no-body-scroll');
        };
    }, []);

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

                // Fetch Notifications and Overview-derived alerts for bell panel
                const [notifRes, overviewRes] = await Promise.all([
                    OrganizerService.getNotifications().catch(() => null),
                    OrganizerService.getOverview().catch(() => null),
                ]);
                const serverNotifications = normalizeNotifications(notifRes);
                const serverUnread = Number((notifRes as any)?.unreadCount || 0);
                const overviewData = (overviewRes as any)?.data || overviewRes;
                const fallbackNotifications = createFallbackNotificationsFromOverview(overviewData);

                const mergedNotifications = [...serverNotifications, ...fallbackNotifications].filter((item, index, arr) => {
                    const key = `${String(item?.title || '').trim().toLowerCase()}|${String(item?.content || '').trim().toLowerCase()}`;
                    if (key === '|') return false;
                    return arr.findIndex((n: any) => `${String(n?.title || '').trim().toLowerCase()}|${String(n?.content || '').trim().toLowerCase()}` === key) === index;
                });

                setNotifications(mergedNotifications);

                const serverDerivedUnread = serverUnread || serverNotifications.filter((n: any) => !n?.isRead).length;
                const localDerivedUnread = fallbackNotifications.filter((n: any) => !n?.isRead).length;
                setUnreadCount(serverDerivedUnread + localDerivedUnread);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };
        fetchData();

        // Keep notifications responsive while limiting network load.
        const interval = setInterval(fetchData, 10000);
        const refreshOnActive = () => {
            if (document.visibilityState === 'visible') {
                fetchData();
            }
        };
        window.addEventListener('focus', refreshOnActive);
        document.addEventListener('visibilitychange', refreshOnActive);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', refreshOnActive);
            document.removeEventListener('visibilitychange', refreshOnActive);
        };
    }, [notificationRefreshToken]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
        const base = String(apiBase).replace(/\/$/, '');
        const streamUrl = `${base}/organizer/notifications/stream?token=${encodeURIComponent(token)}`;
        const stream = new EventSource(streamUrl);

        const onNotification = () => {
            setNotificationRefreshToken((value) => value + 1);
        };

        stream.addEventListener('notifications', onNotification);
        stream.addEventListener('connected', onNotification);
        stream.onerror = () => {
            // Keep polling as fallback if stream disconnects.
        };

        return () => {
            stream.removeEventListener('notifications', onNotification);
            stream.removeEventListener('connected', onNotification);
            stream.close();
        };
    }, []);

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

    const resolveNotificationActionTab = (notification: any): string | null => {
        if (!notification) return null;

        if (notification.actionTab) return notification.actionTab;

        const title = String(notification.title || '').toLowerCase();
        const content = String(notification.content || '').toLowerCase();
        if (title.includes('upcoming') || content.includes('event starting in')) {
            return 'Events';
        }

        return null;
    };

    const profileAvatarUrl = resolveMediaUrl(user?.profile?.avatarUrl);
    const organizerLogoUrl = resolveMediaUrl(organizerProfile?.logoUrl);
    const dashboardAvatarSrc =
        profileAvatarUrl ||
        organizerLogoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(organizerProfile?.organizationName || user?.phoneNumber || 'Org')}&background=11141B&color=fff`;

    const dashboardAvatarInitials = String(
        organizerProfile?.organizationName || user?.profile?.fullName || user?.phoneNumber || 'ORG'
    )
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    useEffect(() => {
        setDashboardAvatarFailed(false);
    }, [dashboardAvatarSrc]);

    const handleNotificationClick = async (notification: any) => {
        if (!notification) return;

        await handleMarkAsRead(notification.id);

        const actionTab = resolveNotificationActionTab(notification);
        if (actionTab) {
            setActiveTab(actionTab);
        }

        setShowNotifications(false);
    };

    const handleMarkAsRead = async (id?: number) => {
        try {
            const { OrganizerService } = await import('../../core/api/organizer.service');
            if (id) {
                const target = notifications.find(n => n.id === id);
                if (!target?.localOnly) {
                    await OrganizerService.markNotificationsRead({ notificationIds: [id] });
                }
                // Update local state
                const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
                setNotifications(updated);
                if (!target?.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            } else {
                // Explicitly mark all server-side notifications as read.
                await OrganizerService.markNotificationsRead({ markAll: true });
                const updated = notifications.map(n => ({ ...n, isRead: true }));
                setNotifications(updated);
                setUnreadCount(0);
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

    const navGroups = [
        {
            title: t('org.nav.group.core', 'Core'),
            items: [
                { icon: Layout, label: 'Dashboard', display: t('org.nav.dashboard', 'Dashboard') },
                { icon: Calendar, label: 'Events', display: t('org.nav.events', 'Events') },
                { icon: Ticket, label: 'Tickets', display: t('org.nav.tickets', 'Tickets') },
                { icon: Users, label: 'Attendees', display: t('org.nav.attendees', 'Attendees') }
            ]
        },
        {
            title: t('org.nav.group.revenue', 'Revenue'),
            items: [
                { icon: DollarSign, label: 'Sales', display: t('org.nav.sales', 'Sales') },
                { icon: RefreshCw, label: 'Refunds', display: t('org.nav.refunds', 'Refunds') }
            ]
        },
        {
            title: t('org.nav.group.marketing', 'Marketing'),
            items: [
                { icon: Megaphone, label: 'Promotions', display: t('org.nav.promotions', 'Promotions') }
            ]
        },
        {
            title: t('org.nav.group.insights', 'Insights'),
            items: [
                { icon: BarChart3, label: 'Analytics', display: t('org.nav.analytics', 'Analytics') },
                { icon: FileText, label: 'Reports', display: t('org.nav.reports', 'Reports') }
            ]
        },
        {
            title: t('org.nav.group.tools', 'Tools'),
            items: [
                { icon: Layout, label: 'Content', display: t('org.nav.content', 'Content') },
                { icon: Maximize, label: 'Scanner', display: t('org.nav.scanner', 'Scanner') }
            ]
        },
        {
            title: t('org.nav.group.support', 'Support'),
            items: [
                { icon: Bell, label: 'Support', display: t('org.nav.support', 'Support') },
                { icon: Settings, label: 'Settings', display: t('org.nav.settings', 'Settings') }
            ]
        }
    ];

    const titleMap: Record<string, string> = {
        Dashboard: t('org.title.dashboard', 'Dashboard Overview'),
        CreateEvent: t('org.title.createEvent', 'Create New Event')
    };

    const activeTitle = titleMap[activeTab] || t(`org.title.${activeTab.toLowerCase()}`, activeTab);

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard': return <DashboardView key="dashboard" onNavigate={setActiveTab} />;
            case 'Events': return <MyEventsView key="events" searchQuery="" onNavigate={setActiveTab} onEditEvent={handleEditEvent} onViewStats={handleViewStats} />;
            case 'Tickets': return <TicketsView key="tickets" searchQuery="" />;
            case 'Sales': return <SalesRevenueView key="sales" />;
            case 'Analytics': return <AdvancedAnalyticsView key="analytics" />;
            case 'Reports': return <ReportGeneratorView key="reports" />;
            case 'Attendees': return <AttendeesView key="attendees" searchQuery="" />;
            case 'Promotions': return <PromotionsView key="promotions" searchQuery="" />;
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
        <div className="container-fluid organizer-dashboard-layout">
            {/* Mobile sidebar overlay */}
            <div className={`sidebar-overlay ${mobileMenuOpen ? 'visible' : ''}`} onClick={closeMobileMenu} />
            {/* 🟢 Sidebar */}
            <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="logo-section" style={{ padding: '32px 24px' }}>
                    <img src="/KORA%20Icon.png" alt="KORA" style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'contain', flexShrink: 0 }} />
                    
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, lineHeight: 1.1 }}>{t('org.brand.title', 'KORA')}</h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('org.brand.subtitle', 'Organizer Console')}</p>
                    </div>
                </div>

                <nav className="nav-group hide-scrollbar" style={{ padding: '0 16px', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
                    {navGroups.map((group, groupIndex) => (
                        <div key={groupIndex} style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.08em', paddingLeft: '6px' }}>
                                {group.title}
                            </h3>
                            {group.items.map((item) => (
                                <div
                                    key={item.label}
                                    className={`nav-item ${activeTab === item.label ? 'active' : ''}`}
                                    onClick={() => { setActiveTab(item.label); closeMobileMenu(); }}
                                >
                                    <item.icon size={20} />
                                    {item.display}
                                </div>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ padding: '24px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={() => { setActiveTab('CreateEvent'); closeMobileMenu(); }}
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
            <main className="main-content hide-scrollbar">
                <header className="top-header" style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu" type="button">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                            {activeTitle}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginLeft: 'auto' }}>
                        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
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
                                                        <span onClick={(e) => { e.stopPropagation(); handleMarkAsRead(); }} style={{ fontSize: '0.8rem', color: '#FF0000', cursor: 'pointer', fontWeight: 600 }}>Mark all read</span>
                                                    )}
                                                </div>
                                                <div className="hide-scrollbar" style={{ maxHeight: '420px', overflowY: 'auto' }}>
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
                                                                        onClick={() => handleNotificationClick(n)}
                                                                        style={{
                                                                            padding: '16px',
                                                                            borderBottom: '1px solid var(--border)',
                                                                            cursor: 'pointer',
                                                                            background: n.isRead ? 'transparent' : 'rgba(255, 0, 0, 0.05)',
                                                                            transition: 'background 0.2s',
                                                                            display: 'flex',
                                                                            gap: '12px'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(255, 0, 0, 0.08)'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(255, 0, 0, 0.05)'}
                                                                    >
                                                                        <div style={{ marginTop: '2px' }}>
                                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.isRead ? 'transparent' : '#FF0000', border: n.isRead ? '1px solid var(--text-muted)' : 'none' }} />
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
                        </div>

                        <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />

                        <div
                            onClick={() => setActiveTab('Settings')}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        >
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#FF0000', padding: '2px' }}>
                                {dashboardAvatarFailed ? (
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                        {dashboardAvatarInitials || 'OR'}
                                    </div>
                                ) : (
                                    <img
                                        src={dashboardAvatarSrc}
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                        alt=""
                                        onError={() => setDashboardAvatarFailed(true)}
                                    />
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>{organizerProfile?.organizationName || user?.profile?.fullName || user?.phoneNumber}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Organizer</p>
                            </div>
                        </div>
                    </div>

                </header>

                <div className="content-scroll-area hide-scrollbar" style={{ padding: '40px' }}>
                    <AnimatePresence mode="wait">
                        {renderContent()}
                    </AnimatePresence>
                </div>
            </main>
        </div >

    );
};

export default OrganizerDashboard;
