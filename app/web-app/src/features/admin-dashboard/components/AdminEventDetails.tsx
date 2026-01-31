import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../../core/api/booking.service';
import { Loader2, ArrowUpRight } from 'lucide-react';

const AdminEventDetails: React.FC<{ eventId: number }> = ({ eventId }) => {
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await bookingService.getEventForBooking(eventId);
                setEvent(data);
            } catch (err) {
                console.error('Failed to load event', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [eventId]);

    if (loading) return <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>;
    if (!event) return <div style={{ padding: 40 }}>Event not found.</div>;

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{event.title}</h2>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{event.category?.name || 'Uncategorized'} • {event.city?.name || 'Unknown'}</div>
                </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/admin'); } }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent' }}>Back</button>
                    <a href={`/event/${event.id}`} target="_blank" rel="noreferrer" style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-active)', color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>Open Public <ArrowUpRight size={14} /></a>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                <div style={{ background: 'var(--bg-card)', padding: 18, borderRadius: 12, border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>{event.description}</p>

                    <h4 style={{ marginTop: 18, marginBottom: 8 }}>Ticket Tiers</h4>
                    <div style={{ display: 'grid', gap: 10 }}>
                        {event.tiers?.map((t: any) => (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 8, background: 'var(--bg-subtle)' }}>
                                <div>
                                    <div style={{ fontWeight: 800 }}>{t.name}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.capacity} cap • {t.soldCount} sold</div>
                                </div>
                                <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 900 }}>ETB {t.price.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: 'var(--bg-card)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</div>
                        <div style={{ fontWeight: 900 }}>{new Date(event.dateTime).toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Venue</div>
                        <div style={{ fontWeight: 900 }}>{event.venue}</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>City</div>
                        <div style={{ fontWeight: 900 }}>{event.city?.name || 'Unknown'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminEventDetails;
