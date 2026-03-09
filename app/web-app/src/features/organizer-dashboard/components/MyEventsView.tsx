import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Calendar, Globe, Pencil, BarChart3, Loader2, Copy, Send, CheckCircle2, XCircle, Eye, EyeOff, Layers, Heart, Star } from 'lucide-react';
import { useToast } from '../../../core/components/Toast';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { ConfirmDialog } from '../../../core/components/ConfirmDialog';

export const MyEventsView = ({ searchQuery = '', onNavigate, onEditEvent, onViewStats }: { searchQuery?: string; onNavigate?: (tab: string) => void; onEditEvent?: (eventId: number) => void; onViewStats?: (eventId: number) => void }) => {
    const toast = useToast();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All Events');
    const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; description?: string; variant?: 'default' | 'danger'; onConfirm?: () => void }>({ open: false, title: '' });

    const normalizeEventsPayload = (payload: any): any[] => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        return [];
    };

    const getLatestEventDate = (event: any): Date => {
        const baseDate = new Date(event?.dateTime);
        const additionalDates = Array.isArray(event?.additionalDates) ? event.additionalDates : [];
        const validDates = [baseDate, ...additionalDates.map((d: string) => new Date(d))].filter(
            (d) => !Number.isNaN(d.getTime()),
        );

        if (validDates.length === 0) return new Date(0);

        return validDates.reduce((max, d) => (d > max ? d : max), validDates[0]);
    };

    const isEventEnded = (event: any): boolean => {
        return getLatestEventDate(event).getTime() < Date.now();
    };

    const handleDuplicate = async (eventId: number) => {
        setConfirmState({
            open: true,
            title: 'Duplicate this event?',
            description: 'A new draft will be created with the same details.',
            onConfirm: async () => {
                try {
                    await OrganizerService.duplicateEvent(eventId);
                    toast.success('Event duplicated (Draft created)');
                    const response = await OrganizerService.getMyEvents();
                    setEvents(normalizeEventsPayload(response.data));
                } catch (error: any) {
                    toast.error(error?.message || 'Failed to duplicate event');
                } finally {
                    setConfirmState({ open: false, title: '' });
                }
            }
        });
    };

    const handleSubmit = async (eventId: number) => {
        setConfirmState({
            open: true,
            title: 'Submit for approval?',
            description: 'This will send the event for admin review.',
            onConfirm: async () => {
                try {
                    await OrganizerService.updateEvent(eventId, { status: 'PENDING' });
                    toast.success('Event submitted for approval');
                    const response = await OrganizerService.getMyEvents();
                    setEvents(normalizeEventsPayload(response.data));
                } catch (error: any) {
                    toast.error(error?.message || 'Failed to submit event');
                } finally {
                    setConfirmState({ open: false, title: '' });
                }
            }
        });
    };

    const handleToggleVisibility = async (eventId: number, isPublic: boolean) => {
        setConfirmState({
            open: true,
            title: isPublic ? 'Set event to private?' : 'Set event to public?',
            description: isPublic ? 'Private events are hidden from public listings.' : 'Public events are visible to all users.',
            onConfirm: async () => {
                try {
                    await OrganizerService.updateEvent(eventId, { isPublic: !isPublic });
                    const response = await OrganizerService.getMyEvents();
                    setEvents(normalizeEventsPayload(response.data));
                    toast.success(!isPublic ? 'Event is now public' : 'Event is now private');
                } catch (error: any) {
                    toast.error(error?.message || 'Failed to update visibility');
                } finally {
                    setConfirmState({ open: false, title: '' });
                }
            }
        });
    };

    const fetchEvents = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const response = await OrganizerService.getMyEvents();
            setEvents(normalizeEventsPayload(response.data));
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            if (showLoader) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents(true);

        const intervalId = setInterval(() => fetchEvents(false), 15000);
        const refreshOnActive = () => {
            if (document.visibilityState === 'visible') {
                fetchEvents(false);
            }
        };

        window.addEventListener('focus', refreshOnActive);
        document.addEventListener('visibilitychange', refreshOnActive);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', refreshOnActive);
            document.removeEventListener('visibilitychange', refreshOnActive);
        };
    }, [fetchEvents]);

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredEvents = events.filter(event => {
        if (activeFilter === 'All Events') return true;
        if (activeFilter === 'Published') return event.status === 'PUBLISHED' || event.status === 'APPROVED';
        if (activeFilter === 'Drafts') return ['DRAFT', 'PENDING', 'REJECTED'].includes(event.status);
        if (activeFilter === 'Past Events') return isEventEnded(event);
        return true;
    }).filter(event => {
        if (!normalizedQuery) return true;
        const title = (event.title || '').toLowerCase();
        const venue = (event.venue || '').toLowerCase();
        return title.includes(normalizedQuery) || venue.includes(normalizedQuery);
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                description={confirmState.description}
                variant={confirmState.variant}
                confirmText="Confirm"
                cancelText="Cancel"
                onCancel={() => setConfirmState({ open: false, title: '' })}
                onConfirm={() => confirmState.onConfirm?.()}
            />
            <PageHeader
                title="My Events"
                subtitle="Manage and track all your scheduled events."
                actions={
                    <>
                        <button
                            onClick={() => onNavigate?.('CreateEvent')}
                            className="btn-blue"
                            style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                        >
                            <Plus size={18} /> Create New Event
                        </button>
                    </>
                }
            />

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {['All Events', 'Published', 'Drafts', 'Past Events'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        style={{
                            padding: '8px 16px', borderRadius: '100px', background: activeFilter === filter ? 'var(--bg-active)' : 'var(--bg-hover)',
                            border: 'none', color: activeFilter === filter ? 'white' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                        }}
                    >
                        {filter}
                    </button>
                ))}
                <button style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <Filter size={16} /> Filters
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {filteredEvents.map((event) => {
                    const salesPercent = event.totalCapacity > 0
                        ? (event._count.tickets / event.totalCapacity) * 100
                        : 0;
                    const totalCapacity = event.tiers?.reduce((sum: number, t: any) => sum + (t.capacity || 0), 0) || 0;
                    const soldCount = event._count?.tickets || 0;
                    const isEnded = isEventEnded(event);
                    const isSoldOut = totalCapacity > 0 && soldCount >= totalCapacity && !isEnded;
                    const baseStatus = event.status === 'APPROVED' ? 'Published'
                        : (event.status === 'DRAFT' || event.status === 'PENDING' || event.status === 'REJECTED') ? 'Draft'
                            : (event.status === 'CANCELLED' || event.status === 'COMPLETED') ? 'Ended'
                                : 'Draft';
                    const statusLabel = isEnded ? 'Ended' : isSoldOut ? 'Sold Out' : baseStatus;
                    const readiness = [
                        { label: 'Banner uploaded', ok: !!event.coverImage },
                        { label: 'Tickets created', ok: totalCapacity > 0 },
                        { label: 'Payment enabled', ok: !!event.feeType && event.status === 'APPROVED' }
                    ];

                    return (
                        <div key={event.id} className="stat-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ height: '160px', width: '100%', position: 'relative' }}>
                                <img
                                    src={event.coverImage || 'https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400&q=80'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt={event.title}
                                />
                                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                    <span className={`pill ${statusLabel === 'Published' ? 'pill-green' : statusLabel === 'Sold Out' || statusLabel === 'Ended' ? 'pill-red' : 'pill-blue'}`} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>{event.title}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <Calendar size={14} /> {new Date(event.dateTime).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <Globe size={14} /> {event.venue}
                                    </div>
                                    {(event.additionalDates?.length || 0) > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <Layers size={14} /> {event.additionalDates.length + 1} dates
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <button
                                            onClick={() => handleToggleVisibility(event.id, event.isPublic)}
                                            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                            title={event.isPublic ? 'Set Private' : 'Set Public'}
                                        >
                                            {event.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
                                            {event.isPublic ? 'Public' : 'Private'}
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {readiness.map((item) => (
                                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: item.ok ? '#10B981' : 'var(--text-muted)' }}>
                                                {item.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Ticket Sales: </span>
                                        <span style={{ color: salesPercent > 80 ? '#10B981' : '#FBBF24' }}>{salesPercent.toFixed(0)}%</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <Heart size={14} color="#EF4444" /> {Number(event.likesCount || 0).toLocaleString()}
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <Star size={14} color="#FBBF24" fill="#FBBF24" />
                                            {Number(event.averageRating || 0).toFixed(1)} ({Number(event.ratingsCount || 0).toLocaleString()})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {event.status === 'DRAFT' && (
                                            <button
                                                onClick={() => handleSubmit(event.id)}
                                                title="Submit for Approval"
                                                style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: '#10B981', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                            >
                                                <Send size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDuplicate(event.id)}
                                            title="Duplicate Event"
                                            style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={() => onEditEvent?.(event.id)}
                                            title="Edit Event"
                                            style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => onViewStats?.(event.id)}
                                            style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-muted)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                        >
                                            <BarChart3 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {events.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                        No events found. Create your first event to get started!
                    </div>
                )}
            </div>
        </motion.div>
    );
};
