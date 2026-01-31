import React, { useState, useEffect } from 'react';
import DecisionModal from './DecisionModal';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Loader2, Calendar, MapPin, Tag, ShieldCheck } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';
import { exportToCSV } from '../../../core/utils/export';
import { Download } from 'lucide-react';

export const EventApprovalsView = () => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [inspectingEvent, setInspectingEvent] = useState<any>(null);
    const [decisionOpen, setDecisionOpen] = useState(false);
    const [decisionContext, setDecisionContext] = useState<any>(null);

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
        // open decision modal with context
        setDecisionContext({ id, status, commission });
        setDecisionOpen(true);
    };

    const confirmDecision = async (payload: { reason: string; commission?: any }) => {
        if (!decisionContext) return;
        const { id, status } = decisionContext;
        try {
            setProcessingId(id);
            await AdminService.reviewEvent(id, status, payload.commission || { feeType: 'PERCENTAGE', feePercentage: 10 }, payload.reason);
            setDecisionOpen(false);
            setDecisionContext(null);
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
    const approvedEvents = events.filter(e => e.status === 'APPROVED' || e.status === 'PUBLISHED');
    const rejectedEvents = events.filter(e => e.status === 'REJECTED');

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AdminPageHeader
                title={t('admin.events')}
                subtitle={t('admin.events_queue_desc', 'Review and moderate pending event applications')}
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => exportToCSV(pendingEvents.map(e => ({
                                Title: e.title,
                                Organizer: e.organizer?.organizationName,
                                Venue: e.venue,
                                City: e.city?.name,
                                Date: e.dateTime,
                                Status: e.status
                            })), 'pending_events.csv')}
                            className="btn-blue" style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            <Download size={16} /> {t('admin.export')}
                        </button>
                    </div>
                }
            />

            {/* 1. Pending Queue */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: '#F59E0B', width: '12px', height: '12px', borderRadius: '50%' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>Moderation Queue ({pendingEvents.length})</h3>
                </div>

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
                                    <span style={{ fontSize: '0.7rem', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: 900 }}>PENDING</span>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>PLATFORM %</p>
                                        <input
                                            type="number"
                                            id={`comm-${event.id}`}
                                            defaultValue={10}
                                            style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>CONV. FEE (ETB)</p>
                                        <input
                                            type="number"
                                            id={`conv-${event.id}`}
                                            defaultValue={0}
                                            style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                </div>

                                {/* Net Earnings Preview */}
                                <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '10px', marginBottom: '16px', border: '1px dashed var(--border)' }}>
                                    <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Earnings Preview (Per Ticket)</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Typical Tier (ETB 500)</span>
                                        <span style={{ fontSize: '1rem', fontWeight: 900, color: '#10B981' }}>
                                            ETB 450.00
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button
                                        disabled={processingId === event.id}
                                        onClick={() => {
                                            const comm = (document.getElementById(`comm-${event.id}`) as HTMLInputElement).value;
                                            const conv = (document.getElementById(`conv-${event.id}`) as HTMLInputElement).value;
                                            handleReview(event.id, 'APPROVED', { feePercentage: Number(comm), feeFixed: Number(conv) });
                                        }}
                                        style={{ background: '#10B981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', flex: 1 }}
                                    >
                                        {processingId === event.id ? <Loader2 className="animate-spin" size={16} /> : 'Approve & Save Fees'}
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
                        ))
                    )}
                </div>
            </div>

            {/* 2. Processed Sections Stack */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Approved Events */}
                <div className="admin-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10B981' }}>Recently Approved ({approvedEvents.length})</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {approvedEvents.length > 0 ? approvedEvents.map((event, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)' }}>{event.title}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{event.organizer?.organizationName}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#10B981', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>LIVE</span>
                                    <button
                                        onClick={() => setInspectingEvent(event)}
                                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.65rem', fontWeight: 800, padding: '4px 8px', borderRadius: '8px', cursor: 'pointer' }}>OVERRIDE</button>
                                    <button
                                        onClick={() => setInspectingEvent({ ...event, previewOnly: true })}
                                        style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, padding: '4px 8px', borderRadius: '8px', cursor: 'pointer' }}
                                    >PREVIEW</button>
                                </div>
                            </div>
                        )) : <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No approved events yet.</p>}
                    </div>
                </div>

                {/* Rejected Events */}
                <div className="admin-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#EF4444' }}>Recently Rejected ({rejectedEvents.length})</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {rejectedEvents.length > 0 ? rejectedEvents.map((event, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)' }}>{event.title}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{event.organizer?.organizationName}</p>
                                </div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#EF4444', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>REJECTED</span>
                            </div>
                        )) : <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No rejected events.</p>}
                    </div>
                </div>
            </div>

            {/* Admin Override Modal */}
            {inspectingEvent && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setInspectingEvent(null)}>
                    <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', maxWidth: '500px', width: '100%', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '8px' }}>Admin Override: {inspectingEvent.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Forcefully adjust event parameters or status. This bypasses organizer control.</p>

                        {inspectingEvent.previewOnly && (
                            <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Ticket Pricing</h4>
                                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {inspectingEvent.tiers?.map((tier: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div style={{ fontWeight: 800 }}>{tier.name}</div>
                                            <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 900 }}>ETB {Number(tier.price || 0).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                                {inspectingEvent.refundPolicy && (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800 }}>Refund Policy</div>
                                        <div style={{ marginTop: 6, color: 'var(--text-main)' }}>{inspectingEvent.refundPolicy}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'grid', gap: '20px', marginBottom: '32px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>FEE PERCENTAGE (%)</label>
                                <input id="override-comm" type="number" defaultValue={inspectingEvent.feePercentage || 10} style={{ width: '100%', padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', color: 'white', fontWeight: 700 }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>FIXED FEE (ETB)</label>
                                <input id="override-conv" type="number" defaultValue={inspectingEvent.feeFixed || 0} style={{ width: '100%', padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', color: 'white', fontWeight: 700 }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={async () => {
                                    const comm = (document.getElementById('override-comm') as HTMLInputElement).value;
                                    const conv = (document.getElementById('override-conv') as HTMLInputElement).value;
                                    await handleReview(inspectingEvent.id, 'APPROVED', { feePercentage: Number(comm), feeFixed: Number(conv) });
                                    setInspectingEvent(null);
                                }}
                                className="btn-blue" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 800 }}>UPDATE SETTINGS</button>
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to suspend this event?')) {
                                        await handleReview(inspectingEvent.id, 'REJECTED');
                                        setInspectingEvent(null);
                                    }
                                }}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 800, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid #EF4444', cursor: 'pointer' }}>SUSPEND EVENT</button>
                        </div>
                        <button onClick={() => setInspectingEvent(null)} style={{ marginTop: '16px', width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Dismiss</button>
                    </div>
                </div>
            )}
            {decisionOpen && (
                <DecisionModal
                    open={decisionOpen}
                    title={`${decisionContext?.status} Event`}
                    showCommission={true}
                    initialCommission={decisionContext?.commission}
                    onCancel={() => { setDecisionOpen(false); setDecisionContext(null); }}
                    onConfirm={(p: any) => confirmDecision(p)}
                />
            )}
        </motion.div >
    );
};

