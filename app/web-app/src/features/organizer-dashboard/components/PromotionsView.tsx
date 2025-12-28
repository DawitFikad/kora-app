import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag, Users, Trash2, Loader2, Megaphone, Crown, ArrowUpRight } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useToast } from '../../../core/components/Toast';

export const PromotionsView = () => {
    const toast = useToast();
    const [promos, setPromos] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        code: '',
        discount: '',
        type: 'PERCENTAGE',
        expiresAt: '',
        maxUses: '',
        eventId: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventsRes, promosRes] = await Promise.all([
                    OrganizerService.getMyEvents(),
                    OrganizerService.getPromoCodes()
                ]);
                setEvents(eventsRes.data);
                setPromos(promosRes.data);
            } catch (error) {
                console.error("Failed to fetch promotions data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await OrganizerService.createPromoCode(form);
            setPromos([res.data, ...promos]);
            setShowForm(false);
            setForm({ code: '', discount: '', type: 'PERCENTAGE', expiresAt: '', maxUses: '', eventId: '' });
            toast.success("Promo code created successfully!");
        } catch (error) {
            console.error("Failed to create promo", error);
            toast.error("Error creating promo code.");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestFeature = async (eventId: number) => {
        try {
            await OrganizerService.requestFeature(eventId);
            toast.success("Feature request sent to Admin for approval.");
        } catch (error) {
            toast.error("Failed to submit request.");
        }
    };

    if (loading && promos.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100% ' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader
                title="Promotions"
                subtitle="Create discount codes and boost your event sales."
                actions={
                    <button onClick={() => setShowForm(true)} className="btn-blue">
                        <Plus size={18} /> Create Promo Code
                    </button>
                }
            />

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="stat-card" style={{ padding: '32px', marginBottom: '32px', border: '1px solid var(--bg-active)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>New Promo Code</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Promo Code</label>
                            <input required type="text" placeholder="SUMMER25" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Discount Value</label>
                            <input required type="number" placeholder="20" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Type</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }}>
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED">Fixed Amount (ETB)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Assign to Event</label>
                            <select required value={form.eventId} onChange={e => setForm({ ...form, eventId: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }}>
                                <option value="">Select Event</option>
                                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Max Uses (Optional)</label>
                            <input type="number" placeholder="Unlimited" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Expiry Date</label>
                            <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                        <div style={{ gridColumn: 'span 3', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border)', color: 'white', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" className="btn-blue" style={{ padding: '12px 32px' }}>Create Code</button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="stat-card" style={{ padding: '0' }}>
                <table className="event-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Event</th>
                            <th>Usage</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promos.map((p, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 800, color: 'var(--bg-active)' }}><Tag size={14} style={{ marginRight: '8px' }} /> {p.code}</td>
                                <td style={{ fontWeight: 700 }}>{p.type === 'PERCENTAGE' ? `${p.discount}%` : `ETB ${p.discount}`}</td>
                                <td>{events.find(e => e.id === parseInt(p.eventId))?.title || 'Event Removed'}</td>
                                <td><Users size={14} style={{ marginRight: '8px' }} /> {p.usedCount} / {p.maxUses || '∞'}</td>
                                <td><span className="pill pill-green">Active</span></td>
                                <td>
                                    <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {promos.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                    <div style={{ marginBottom: '16px' }}><Megaphone size={48} opacity={0.2} style={{ margin: '0 auto' }} /></div>
                                    No active promo codes. Click "Create Promo Code" to start.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Featured Listings Section */}
            <div style={{ marginTop: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ padding: '10px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px' }}>
                        <Crown size={24} color="#FBBF24" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Featured Listings</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Admin-approved events highlighted on the homepage.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Currently Featured */}
                    <div className="stat-card" style={{ padding: '24px', border: '1px solid #FBBF24' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: '#FBBF24' }}>Active Featured Events</h4>
                        {events.filter(e => e.featured).length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {events.filter(e => e.featured).map(e => (
                                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                        <span style={{ fontWeight: 600 }}>{e.title}</span>
                                        <span className="pill pill-green">Live</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>You have no featured events currently.</p>
                        )}
                    </div>

                    {/* Eligible for Featuring */}
                    <div className="stat-card" style={{ padding: '24px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Request to Feature</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {events.filter(e => !e.featured && e.status === 'APPROVED').length > 0 ? (
                                events.filter(e => !e.featured && e.status === 'APPROVED').map(e => (
                                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                        <span style={{ fontWeight: 600 }}>{e.title}</span>
                                        <button
                                            onClick={() => handleRequestFeature(e.id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                                            Request <ArrowUpRight size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No eligible events available for featuring.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
