import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Loader2, Calendar, MapPin, Tag, ShieldCheck } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';

export const EventApprovalsView = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            const data: any = await AdminService.getEvents();
            // Show only PENDING ones in the queue, or all with status filtering
            setEvents(data);
        } catch (err) {
            console.error('Failed to fetch events', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleReview = async (id: number, status: 'APPROVED' | 'REJECTED', commission?: any) => {
        try {
            setProcessingId(id);
            // Default commission 10% if not provided
            await AdminService.reviewEvent(id, status, commission || {
                feeType: 'PERCENTAGE',
                feePercentage: 10
            });
            await fetchEvents();
        } catch (err) {
            alert('Action failed');
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    const pendingEvents = events.filter(e => e.status === 'PENDING');

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AdminPageHeader
                title="Event Approval Queue"
                subtitle={`Review and moderate pending event applications (${pendingEvents.length} items waiting)`}
                actions={
                    <button className="btn-blue" style={{ background: '#12171F', color: 'white', border: '1px solid var(--border)' }}>
                        <Filter size={16} /> Advanced Search
                    </button>
                }
            />

            <div style={{ display: 'grid', gap: '16px' }}>
                {pendingEvents.length === 0 ? (
                    <div className="admin-card" style={{ padding: '60px', textAlign: 'center' }}>
                        <ShieldCheck size={48} color="#10B981" style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Queue is Empty</h3>
                        <p style={{ color: 'var(--text-muted)' }}>All events have been processed.</p>
                    </div>
                ) : (
                    pendingEvents.map((event) => (
                        <div key={event.id} className="admin-card" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr', alignItems: 'center', gap: '24px' }}>
                            <div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 900 }}>{event.title}</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Org: {event.organizer?.organizationName}</p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={16} color="var(--text-muted)" />
                                <div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{event.venue}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.city?.name}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={16} color="var(--text-muted)" />
                                <div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{new Date(event.dateTime).toLocaleDateString()}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Event Date</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Tag size={16} color="var(--text-muted)" />
                                <div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{event.tiers?.length} Tiers</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ticket Types</p>
                                </div>
                            </div>

                            <div>
                                <span className="pill" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', fontWeight: 800 }}>{event.status}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <input
                                        type="number"
                                        placeholder="Comm %"
                                        defaultValue={10}
                                        id={`comm-${event.id}`}
                                        style={{ width: '70px', background: '#0B0E14', border: '1px solid var(--border)', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', color: 'white' }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Conv Fee"
                                        defaultValue={0}
                                        id={`conv-${event.id}`}
                                        style={{ width: '70px', background: '#0B0E14', border: '1px solid var(--border)', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', color: 'white' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button
                                        disabled={processingId === event.id}
                                        onClick={() => {
                                            const comm = (document.getElementById(`comm-${event.id}`) as HTMLInputElement).value;
                                            const conv = (document.getElementById(`conv-${event.id}`) as HTMLInputElement).value;
                                            handleReview(event.id, 'APPROVED', { feePercentage: Number(comm), feeFixed: Number(conv) });
                                        }}
                                        style={{ background: '#10B981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        {processingId === event.id ? '...' : 'Approve'}
                                    </button>
                                    <button
                                        disabled={processingId === event.id}
                                        onClick={() => handleReview(event.id, 'REJECTED')}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};
