import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag, Users, Trash2, Loader2, Megaphone, Crown, ArrowUpRight, CheckCircle, XCircle, Link2, Sparkles } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useToast } from '../../../core/components/Toast';
import { ConfirmDialog } from '../../../core/components/ConfirmDialog';

export const PromotionsView = ({ searchQuery = '' }: { searchQuery?: string }) => {
    const toast = useToast();
    const [promos, setPromos] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<number[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [form, setForm] = useState({
        code: '',
        discount: '',
        type: 'PERCENTAGE',
        codeType: 'STANDARD',
        campaignName: '',
        influencerName: '',
        expiresAt: '',
        maxUses: '',
        eventId: ''
    });

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-ET', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value || 0);

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
            setForm({ code: '', discount: '', type: 'PERCENTAGE', codeType: 'STANDARD', campaignName: '', influencerName: '', expiresAt: '', maxUses: '', eventId: '' });
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
            setPendingRequests(prev => [...prev, eventId]);
            toast.success("Feature request sent. Pending admin approval.");
        } catch (error) {
            toast.error("Failed to submit request.");
        }
    };

    const handleDeletePromo = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await OrganizerService.deletePromoCode(deleteTarget.id);
            setPromos(prev => prev.filter(p => p.id !== deleteTarget.id));
            toast.success('Promo code deleted');
            setDeleteTarget(null);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to delete promo code');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading && promos.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100% ' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredPromos = promos.filter((p) => {
        if (!normalizedQuery) return true;
        const code = (p.code || '').toLowerCase();
        const eventTitle = (events.find(e => e.id === parseInt(p.eventId))?.title || '').toLowerCase();
        const campaign = (p.campaignName || '').toLowerCase();
        const influencer = (p.influencerName || '').toLowerCase();
        return code.includes(normalizedQuery) || eventTitle.includes(normalizedQuery) || campaign.includes(normalizedQuery) || influencer.includes(normalizedQuery);
    });

    const topPromos = [...filteredPromos]
        .sort((a, b) => (b?.stats?.revenue || 0) - (a?.stats?.revenue || 0))
        .slice(0, 3);

    const hasFeatureRequestBanner =
        events.some(e => !e.featured && e.status === 'APPROVED') || pendingRequests.length > 0;

    const getAutoApplyLink = (promo: any) => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}/book/${promo.eventId}?promo=${promo.code}`;
    };

    const handleCopyLink = async (promo: any) => {
        const link = getAutoApplyLink(promo);
        if (!link) return;
        try {
            await navigator.clipboard.writeText(link);
            toast.success('Auto-apply link copied!');
        } catch {
            toast.error('Failed to copy link');
        }
    };

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

            {hasFeatureRequestBanner && (
                <div className="stat-card" style={{ padding: '16px 20px', marginBottom: '24px', border: '1px solid rgba(251, 191, 36, 0.25)', background: 'rgba(251, 191, 36, 0.06)' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                        Request to Feature: submit a request and the admin will review and respond.
                    </p>
                </div>
            )}

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="stat-card" style={{ padding: '32px', marginBottom: '32px', border: '1px solid var(--bg-active)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>New Promo Code</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Promo Code</label>
                            <input required type="text" placeholder="SUMMER25" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Discount Value</label>
                            <input required type="number" placeholder="20" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Type</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }}>
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED">Fixed Amount (ETB)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Promo Category</label>
                            <select value={form.codeType} onChange={e => setForm({ ...form, codeType: e.target.value })} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }}>
                                <option value="STANDARD">Standard</option>
                                <option value="INFLUENCER">Influencer</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Assign to Event</label>
                            <select required value={form.eventId} onChange={e => setForm({ ...form, eventId: e.target.value })} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }}>
                                <option value="">Select Event</option>
                                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Campaign Name (Optional)</label>
                            <input type="text" placeholder="New Year Blast" value={form.campaignName} onChange={e => setForm({ ...form, campaignName: e.target.value })} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Influencer Name</label>
                            <input type="text" placeholder="@example" value={form.influencerName} onChange={e => setForm({ ...form, influencerName: e.target.value })} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Max Uses (Optional)</label>
                            <input type="number" placeholder="Unlimited" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Expiry Date</label>
                            <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }} />
                        </div>
                        <div style={{ gridColumn: 'span 3', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" className="btn-blue" style={{ padding: '12px 32px' }}>Create Code</button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="stat-card" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(29,144,245,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '10px', background: 'rgba(29,144,245,0.1)', borderRadius: '12px' }}>
                        <Sparkles size={20} color="#1D90F5" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Promo Performance</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Campaign tracking to see which code sells more.</p>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {topPromos.map((promo) => (
                        <div key={promo.id} style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 800, marginBottom: '6px' }}>{promo.code}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{promo.campaignName || 'No campaign'}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span>{promo?.stats?.orders || 0} sales</span>
                                <span style={{ fontWeight: 700 }}>ETB {formatCurrency(promo?.stats?.revenue || 0)}</span>
                            </div>
                        </div>
                    ))}
                    {topPromos.length === 0 && (
                        <div style={{ gridColumn: 'span 3', textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No promo performance data yet.</div>
                    )}
                </div>
            </div>

            <div className="stat-card" style={{ padding: '0' }}>
                <table className="event-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Event</th>
                            <th>Campaign</th>
                            <th>Influencer</th>
                            <th>Usage</th>
                            <th>Sales</th>
                            <th>Revenue</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPromos.map((p, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 800, color: 'var(--bg-active)' }}>
                                    <Tag size={14} style={{ marginRight: '8px' }} /> {p.code}
                                    {p.codeType === 'INFLUENCER' && (
                                        <span style={{ marginLeft: '8px', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.15)', color: '#F59E0B' }}>Influencer</span>
                                    )}
                                </td>
                                <td style={{ fontWeight: 700 }}>{p.type === 'PERCENTAGE' ? `${p.discount}%` : `ETB ${formatCurrency(p.discount)}`}</td>
                                <td>{events.find(e => e.id === parseInt(p.eventId))?.title || 'Event Removed'}</td>
                                <td>{p.campaignName || '—'}</td>
                                <td>{p.influencerName || '—'}</td>
                                <td><Users size={14} style={{ marginRight: '8px' }} /> {p.usedCount} / {p.maxUses || '∞'}</td>
                                <td>{p?.stats?.orders || 0}</td>
                                <td style={{ fontWeight: 700 }}>ETB {formatCurrency(p?.stats?.revenue || 0)}</td>
                                <td>
                                    {p.isActive ? (
                                        p.expiresAt && new Date(p.expiresAt) < new Date() ?
                                            <span className="pill pill-red">Expired</span> :
                                            <span className="pill pill-green">Active</span>
                                    ) : (
                                        <span className="pill pill-gray">Disabled</span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button
                                            onClick={() => handleCopyLink(p)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(29,144,245,0.1)', border: '1px solid rgba(29,144,245,0.2)', color: '#1D90F5', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}
                                            title="Copy auto-apply link"
                                        >
                                            <Link2 size={14} /> Copy Link
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(p)}
                                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                                            title="Delete promo code"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredPromos.length === 0 && (
                            <tr>
                                <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
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
                                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
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
                                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
                                        <span style={{ fontWeight: 600 }}>{e.title}</span>
                                        {(pendingRequests.includes(e.id) || e.featureStatus === 'PENDING') ? (
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                                <CheckCircle size={14} /> Pending
                                            </span>
                                        ) : e.featureStatus === 'REJECTED' ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <XCircle size={14} /> Declined
                                                </span>
                                                <button
                                                    onClick={() => handleRequestFeature(e.id)}
                                                    style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                                    Retry
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleRequestFeature(e.id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                                                Request <ArrowUpRight size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No eligible events available for featuring.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete promo code?"
                description={deleteTarget ? `This will permanently remove ${deleteTarget.code}. If it has been used, deletion will be blocked.` : ''}
                confirmText={isDeleting ? 'Deleting...' : 'Delete'}
                cancelText="Cancel"
                variant="danger"
                onCancel={() => (isDeleting ? null : setDeleteTarget(null))}
                onConfirm={handleDeletePromo}
            />
        </motion.div>
    );
};
