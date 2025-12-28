import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Calendar, Globe, Pencil, BarChart3, Loader2 } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';

export const MyEventsView = ({ onNavigate, onEditEvent, onViewStats }: { onNavigate?: (tab: string) => void; onEditEvent?: (eventId: number) => void; onViewStats?: (eventId: number) => void }) => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All Events');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await OrganizerService.getMyEvents();
                setEvents(response.data);
            } catch (error) {
                console.error("Failed to fetch events", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event => {
        if (activeFilter === 'All Events') return true;
        if (activeFilter === 'Published') return event.status === 'PUBLISHED' || event.status === 'APPROVED';
        if (activeFilter === 'Drafts') return event.status === 'DRAFT' || event.status === 'PENDING';
        if (activeFilter === 'Past Events') return new Date(event.dateTime) < new Date();
        return true;
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

                    return (
                        <div key={event.id} className="stat-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ height: '160px', width: '100%', position: 'relative' }}>
                                <img
                                    src={event.coverImage || 'https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400&q=80'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt={event.title}
                                />
                                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                    <span className={`pill ${event.status === 'APPROVED' ? 'pill-green' : 'pill-blue'}`} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                        {event.status}
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
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Ticket Sales: </span>
                                        <span style={{ color: salesPercent > 80 ? '#10B981' : '#FBBF24' }}>{salesPercent.toFixed(0)}%</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
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
