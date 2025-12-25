import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag, Users, Trash2, Loader2, Megaphone } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';

export const PromotionsView = () => {
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
        } catch (error) {
            console.error("Failed to create promo", error);
            alert("Error creating promo code.");
        } finally {
            setLoading(false);
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
        </motion.div>
    );
};
