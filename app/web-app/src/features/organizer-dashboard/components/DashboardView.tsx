import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Ticket, Building2, Megaphone, Loader2, DollarSign, AlertTriangle, CalendarDays, ArrowRight, Clock } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useLanguage } from '../../../core/context/LanguageContext';

export const DashboardView = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
    const { t } = useLanguage();
    const [overview, setOverview] = useState<any>(null);
    const [salesTrend, setSalesTrend] = useState<any[]>([]);
    const [velocity, setVelocity] = useState<any[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [overviewResponse, financialsResponse] = await Promise.all([
                    OrganizerService.getOverview(),
                    OrganizerService.getFinancials().catch(() => ({ data: { salesTrend: [] } }))
                ]);
                const data = overviewResponse.data;
                setOverview(data);
                setVelocity(data.salesVelocity || []);
                setUpcomingEvents(data.upcomingEvents || []);
                setSalesTrend(financialsResponse.data?.salesTrend || []);
                setAlerts(data.alerts || []);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleQuickAction = (action: string) => {
        switch (action) {
            case 'Create Event': onNavigate?.('CreateEvent'); break;
            case 'Scan Tickets': onNavigate?.('Scanner'); break;
            case 'Promote Event': onNavigate?.('Promotions'); break;
            case 'Events': onNavigate?.('Events'); break;
        }
    };

    const todayKey = useMemo(() => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), []);

    const todaySales = useMemo(() => {
        if (!salesTrend || salesTrend.length === 0) return 0;
        const today = salesTrend.find((d: any) => d.date === todayKey);
        return today?.revenue || 0;
    }, [salesTrend, todayKey]);

    const upcomingCountdown = useMemo(() => {
        if (!upcomingEvents || upcomingEvents.length === 0) return null;
        const next = upcomingEvents[0];
        const now = new Date();
        const eventDate = new Date(next.date);
        const diffMs = eventDate.getTime() - now.getTime();
        if (diffMs <= 0) return { label: t('org.dashboard.eventLive', 'Live today'), event: next };
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);

        let label = "";
        if (days > 0) {
            label = `${days}d ${hours}h`;
        } else if (hours > 0) {
            label = t('org.dashboard.hoursRemain', '{hours} hours remain').replace('{hours}', String(hours));
        } else {
            label = t('org.dashboard.startingSoon', 'Starting soon');
        }

        return { days, hours, label, event: next };
    }, [upcomingEvents, t]);

    const localizedAlerts = useMemo(() => {
        const baseAlerts = alerts.map((alert: any) => {
            const message = alert?.message || '';
            if (message.match(/pending approval/i)) {
                const countMatch = message.match(/(\d+)/);
                const count = countMatch ? countMatch[1] : '0';
                return { ...alert, message: t('org.dashboard.alertPendingApproval', '{count} events pending approval').replace('{count}', count) };
            }
            const lowCapMatch = message.match(/Low capacity:\s*(.+)\s+is\s+(\d+)%/i);
            if (lowCapMatch) {
                const [, title, percent] = lowCapMatch;
                return {
                    ...alert,
                    message: t('org.dashboard.alertLowInventory', 'Low ticket inventory: {title} is {percent}% sold')
                        .replace('{title}', title)
                        .replace('{percent}', percent)
                };
            }
            return alert;
        });

        // Add alerts for all upcoming events within 3 days
        upcomingEvents.forEach(event => {
            const now = new Date();
            const eventDate = new Date(event.date);
            const diffMs = eventDate.getTime() - now.getTime();
            const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
            const days = Math.floor(totalHours / 24);
            const remHours = totalHours % 24;

            if (totalHours >= 0 && totalHours <= 72) { // Within 3 days
                let timeMsg = "";
                if (days > 0) {
                    const templateKey = days === 1 ? 'org.dashboard.alertEventSoonSingle' : 'org.dashboard.alertEventSoon';
                    timeMsg = t(templateKey, days === 1 ? '{days} day' : '{days} days').replace('{days}', String(days));
                } else if (remHours > 0) {
                    timeMsg = t('org.dashboard.hoursRemainShort', '{hours} hours').replace('{hours}', String(remHours));
                } else {
                    timeMsg = t('org.dashboard.startingSoon', 'Starting soon');
                }

                baseAlerts.unshift({
                    type: 'warning',
                    action: 'Events',
                    message: t('org.dashboard.alertEventSoonFormat', 'Event starting in {time}: {title}')
                        .replace('{time}', timeMsg)
                        .replace('{title}', event.title || t('org.dashboard.unknownEvent', 'Event'))
                });
            }
        });

        return baseAlerts;
    }, [alerts, upcomingEvents, t]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title={t('org.dashboard.welcome', 'Welcome back')} subtitle={t('org.dashboard.subtitle', 'Here is what’s happening with your events today.')} />



            {/* Alerts Section */}
            {localizedAlerts.length > 0 && (
                <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {localizedAlerts.map((alert: any, i: number) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                background: alert.type === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                border: `1px solid ${alert.type === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                color: alert.type === 'critical' ? '#EF4444' : '#EAB308'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <AlertTriangle size={20} />
                                <span style={{ fontWeight: 600 }}>{alert.message}</span>
                            </div>
                            <button
                                onClick={() => handleQuickAction(alert.action)}
                                style={{
                                    background: 'transparent',
                                    border: `1px solid ${alert.type === 'critical' ? '#EF4444' : '#EAB308'}`,
                                    padding: '6px 16px',
                                    borderRadius: '8px',
                                    color: 'inherit',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {t('org.actions.view', 'View')}
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            <div className="stats-grid">
                {(
                    overview ? [
                        { label: t('org.dashboard.todaySales', "Today's Sales"), value: `ETB ${Number(todaySales || 0).toLocaleString()}`, change: t('org.dashboard.todaySalesHint', 'Today'), icon: DollarSign, bgColor: 'rgba(16, 185, 129, 0.1)', iconColor: '#10B981' },
                        { label: t('org.dashboard.totalTicketsSold', 'Total Tickets Sold'), value: `${Number(overview.ticketsSold || 0).toLocaleString()} / ${Number(overview.totalCapacity || 0).toLocaleString()}`, change: t('org.dashboard.totalTicketsHint', 'All events'), icon: Ticket, bgColor: 'rgba(251, 191, 36, 0.1)', iconColor: '#FBBF24' },
                        { label: t('org.dashboard.activeEvents', 'Active Events'), value: Number(overview.activeEvents || 0).toLocaleString(), change: t('org.dashboard.activeEventsHint', 'Upcoming & live'), icon: CalendarDays, bgColor: 'rgba(29, 144, 245, 0.1)', iconColor: '#1D90F5' },
                        { label: t('org.dashboard.upcomingCountdown', 'Upcoming Event Countdown'), value: upcomingCountdown ? (upcomingCountdown as any).label || `${(upcomingCountdown as any).days}d ${(upcomingCountdown as any).hours}h` : t('org.dashboard.noUpcomingShort', 'No upcoming events'), change: upcomingCountdown?.event?.title || t('org.dashboard.nextEvent', 'Next event'), icon: Clock, bgColor: 'rgba(167, 139, 250, 0.1)', iconColor: '#A78BFA' },
                        { label: t('org.dashboard.pendingPayout', 'Pending Payout'), value: `ETB ${Number(overview.nextPayout || 0).toLocaleString()}`, change: t('org.dashboard.pendingPayoutHint', 'Pending payout amount'), icon: Building2, bgColor: 'rgba(236, 72, 153, 0.1)', iconColor: '#EC4899' },
                    ] : []
                ).map((stat, i) => (
                    <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <div className="stat-icon-box" style={{ background: stat.bgColor, color: stat.iconColor }}>
                            <stat.icon size={22} color={stat.iconColor} strokeWidth={2.5} />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>{stat.label}</p>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px' }}>{stat.value}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: i === 3 ? 'var(--text-muted)' : '#10B981' }}>
                            {stat.change}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div className="stat-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{t('org.dashboard.salesTrend', '7-Day Sales Trend')}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('org.dashboard.velocitySubtitle', 'Last 7 days performance')}</p>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <select style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, appearance: 'none', cursor: 'pointer', paddingRight: '40px' }}>
                                <option>{t('org.dashboard.last7Days', 'Last 7 Days')}</option>
                            </select>
                            <MoreHorizontal size={14} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%) rotate(90deg)' }} color="var(--text-muted)" />
                        </div>
                    </div>
                    <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px' }}>
                        {velocity.map((v, i) => (
                            <div key={v.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flex: 1 }}>
                                <div style={{
                                    width: '12px',
                                    height: `${Math.max((v.count / (Math.max(...velocity.map(val => val.count)) || 1)) * 180, 5)}px`,
                                    background: 'var(--bg-active)',
                                    borderRadius: '4px 4px 0 0',
                                    opacity: 0.8
                                }} />
                                <span style={{ fontSize: '0.8rem', color: i === 6 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 700 }}>{v.day}</span>
                            </div>
                        ))}
                    </div>
                </div>



                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '28px' }}>{t('org.dashboard.upcomingEvents', 'Upcoming Events (7 Days)')}</h3>
                    {upcomingEvents.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {upcomingEvents.map((e: any) => (
                                <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '10px',
                                            background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center', fontWeight: 800
                                        }}>
                                            <span style={{ fontSize: '0.6rem', color: '#1D90F5' }}>{new Date(e.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                                            <span style={{ fontSize: '1rem', color: 'var(--text-main)', lineHeight: 1 }}>{new Date(e.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>{e.title}</h4>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.sold} / {e.capacity} {t('org.dashboard.ticketsSoldLabel', 'tickets sold')}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('Events')} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                            <CalendarDays size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <p style={{ fontSize: '0.9rem' }}>{t('org.dashboard.noUpcoming', 'No upcoming events.')}</p>
                        </div>
                    )}
                </div>

                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '28px' }}>{t('org.dashboard.quickActions', 'Quick Actions')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        {[
                            { label: 'Create Event', icon: CalendarDays, display: t('org.dashboard.actions.createEvent', 'Create Event') },
                            { label: 'Scan Tickets', icon: Ticket, display: t('org.dashboard.actions.scanTickets', 'Scan Tickets') },
                            { label: 'Promote Event', icon: Megaphone, display: t('org.dashboard.actions.promoteEvent', 'Promote Event') }
                        ].map((action) => (
                            <div
                                key={action.label}
                                onClick={() => handleQuickAction(action.label)}
                                className="quick-action-btn" style={{
                                    background: 'var(--bg-hover)', border: '1px solid var(--border)',
                                    borderRadius: '16px', padding: '24px 12px', textAlign: 'center', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}>
                                <div style={{ width: '42px', height: '42px', background: 'var(--bg-subtle)', borderRadius: '12px', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <action.icon size={20} color="#8E9BAE" />
                                </div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>{action.display}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </motion.div >
    );
};
