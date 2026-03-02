import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    MapPin,
    Plus,
    Trash2,
    Ticket,
    Image as ImageIcon,
    ShieldCheck,
    ArrowLeft,
    Loader2,
    Settings,
    AlertCircle
} from 'lucide-react';
import { OrganizerService } from '../../../core/api/organizer.service';
import { ContentService } from '../../../core/api/content.service';
import { useToast } from '../../../core/components/Toast';

interface EditEventViewProps {
    eventId: number;
    onComplete: () => void;
}

export const EditEventView = ({ eventId, onComplete }: EditEventViewProps) => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedMainCatId, setSelectedMainCatId] = useState('');

    // Derived: subcategories for selected main category
    const availableSubcategories = categories.find((c: any) => String(c.id) === selectedMainCatId)?.subCategories || [];

    const [form, setForm] = useState({
        title: '',
        description: '',
        venue: '',
        dateTime: '',
        additionalDates: [] as string[],
        isPublic: true,
        categoryId: '',
        subCategoryId: '' as string,
        cityId: '',
        coverImage: '',
        refundPolicy: '',
        tiers: [{ id: undefined as number | undefined, name: '', type: 'GENERAL', price: '', capacity: '', salesStart: '', salesEnd: '', maxPerUser: '5', isTransferable: true, isResellable: false, expanded: false }],
        adminNote: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, cityRes, eventRes] = await Promise.all([
                    ContentService.getCategories(),
                    ContentService.getCities(),
                    OrganizerService.getEventById(eventId)
                ]);

                if (catRes?.data) setCategories(catRes.data);
                if (cityRes?.data) setCities(cityRes.data);

                if (eventRes?.data) {
                    const event = eventRes.data;
                    const mainCatId = String(event.categoryId) || '';
                    setSelectedMainCatId(mainCatId);
                    setForm({
                        title: event.title || '',
                        description: event.description || '',
                        venue: event.venue || '',
                        dateTime: event.dateTime ? new Date(event.dateTime).toISOString().slice(0, 16) : '',
                        categoryId: mainCatId,
                        subCategoryId: event.subCategoryId ? String(event.subCategoryId) : '',
                        cityId: String(event.cityId) || '',
                        coverImage: event.coverImage || '',
                        additionalDates: (event.additionalDates || []).map((d: string) => new Date(d).toISOString().slice(0, 16)),
                        isPublic: event.isPublic !== false,
                        refundPolicy: event.refundPolicy || '',
                        tiers: event.tiers?.length > 0
                            ? event.tiers.map((t: any) => ({
                                id: t.id,
                                name: t.name,
                                type: t.type || 'GENERAL',
                                price: String(t.price),
                                capacity: String(t.capacity),
                                salesStart: t.salesStart ? new Date(t.salesStart).toISOString().slice(0, 16) : '',
                                salesEnd: t.salesEnd ? new Date(t.salesEnd).toISOString().slice(0, 16) : '',
                                maxPerUser: String(t.maxPerUser ?? '5'),
                                isTransferable: t.isTransferable !== false,
                                isResellable: !!t.isResellable,
                                expanded: false
                            }))
                            : [{ id: undefined, name: '', type: 'GENERAL', price: '', capacity: '', salesStart: '', salesEnd: '', maxPerUser: '5', isTransferable: true, isResellable: false, expanded: false }],
                        adminNote: event.adminNote || ''
                    });
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
                toast.error("Failed to load event data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [eventId]);

    const handleAddTier = () => {
        setForm({
            ...form,
            tiers: [...form.tiers, { id: undefined, name: 'General Admission', type: 'GENERAL', price: '', capacity: '', salesStart: '', salesEnd: '', maxPerUser: '5', isTransferable: true, isResellable: false, expanded: false }]
        });
    };

    const handleRemoveTier = (index: number) => {
        const newTiers = [...form.tiers];
        newTiers.splice(index, 1);
        setForm({ ...form, tiers: newTiers });
    };

    const handleTierChange = (index: number, field: string, value: any) => {
        const newTiers = [...form.tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setForm({ ...form, tiers: newTiers });
    };

    const handleAddDate = () => {
        setForm({ ...form, additionalDates: [...(form.additionalDates || []), ''] });
    };

    const handleRemoveDate = (index: number) => {
        const next = [...(form.additionalDates || [])];
        next.splice(index, 1);
        setForm({ ...form, additionalDates: next });
    };

    const handleDateChange = (index: number, value: string) => {
        const next = [...(form.additionalDates || [])];
        next[index] = value;
        setForm({ ...form, additionalDates: next });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm({ ...form, coverImage: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.categoryId || !form.cityId) {
            toast.warning("Please select a category and city.");
            return;
        }

        setSaving(true);
        try {
            const cleanForm = {
                ...form,
                additionalDates: (form.additionalDates || []).filter(Boolean),
                tiers: form.tiers.map(t => ({
                    id: (t as any).id,
                    name: t.name,
                    type: (t as any).type || 'GENERAL',
                    price: parseFloat(t.price as string) || 0,
                    capacity: parseInt(t.capacity as string) || 0,
                    salesStart: (t as any).salesStart ? new Date((t as any).salesStart) : null,
                    salesEnd: (t as any).salesEnd ? new Date((t as any).salesEnd) : null,
                    maxPerUser: parseInt((t as any).maxPerUser) || 5,
                    isTransferable: (t as any).isTransferable !== undefined ? !!(t as any).isTransferable : true,
                    isResellable: (t as any).isResellable !== undefined ? !!(t as any).isResellable : false
                }))
            };

            await OrganizerService.updateEvent(eventId, cleanForm);
            toast.success("Event updated successfully!");
            onComplete();
        } catch (error: any) {
            console.error("Failed to update event", error);
            const msg = error?.message || "Error updating event. Please check all fields.";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button
                    onClick={onComplete}
                    style={{ background: 'var(--bg-hover)', border: 'none', color: 'var(--text-main)', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Edit Event</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Update your event details.</p>
                </div>
            </div>

            {(form as any).adminNote && (
                <div style={{ background: 'rgba(29, 144, 245, 0.1)', border: '1px solid rgba(29, 144, 245, 0.3)', padding: '20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '10px' }}>
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '4px' }}>Boss Comment (Admin Note)</p>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{(form as any).adminNote}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* General Info */}
                    <div className="stat-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={20} color="#1D90F5" /> Basic Information
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Event Title</label>
                                <input
                                    required
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-main)' }}
                                />
                            </div>

                            {/* Main Category + Subcategory two-step picker */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Main Category</label>
                                    <select
                                        required
                                        value={selectedMainCatId}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setSelectedMainCatId(val);
                                            setForm({ ...form, categoryId: val, subCategoryId: '' });
                                        }}
                                        style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-main)' }}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        Subcategory {availableSubcategories.length === 0 && selectedMainCatId ? <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>(none)</span> : ''}
                                    </label>
                                    <select
                                        value={form.subCategoryId}
                                        disabled={availableSubcategories.length === 0}
                                        onChange={e => setForm({ ...form, subCategoryId: e.target.value })}
                                        style={{ width: '100%', background: availableSubcategories.length === 0 ? 'rgba(255,255,255,0.02)' : 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-main)', opacity: availableSubcategories.length === 0 ? 0.4 : 1 }}
                                    >
                                        <option value="">Select Subcategory (optional)</option>
                                        {availableSubcategories.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* City */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>City</label>
                                <select
                                    required
                                    value={form.cityId}
                                    onChange={e => setForm({ ...form, cityId: e.target.value })}
                                    style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-main)' }}
                                >
                                    <option value="">Select City</option>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Description</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-main)', resize: 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Venue & Time */}
                    <div className="stat-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MapPin size={20} color="#10B981" /> Venue & Timing
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Venue Name</label>
                                <input
                                    required
                                    type="text"
                                    value={form.venue}
                                    onChange={e => setForm({ ...form, venue: e.target.value })}
                                    style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Date & Time</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={form.dateTime}
                                    onChange={e => setForm({ ...form, dateTime: e.target.value })}
                                    style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-main)' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Additional Dates (Optional)</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(form.additionalDates || []).map((d, index) => (
                                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 40px', gap: '12px', alignItems: 'center' }}>
                                        <input
                                            type="datetime-local"
                                            value={d}
                                            onChange={e => handleDateChange(index, e.target.value)}
                                            style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '12px', color: 'var(--text-main)' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDate(index)}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddDate}
                                    className="btn-blue"
                                    style={{ width: 'fit-content', padding: '8px 14px', fontSize: '0.85rem' }}
                                >
                                    <Plus size={16} /> Add Date
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Visibility */}
                    <div className="stat-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Event Visibility</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontWeight: 700 }}>{form.isPublic ? 'Public' : 'Private'}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{form.isPublic ? 'Visible to all users' : 'Hidden from public listing'}</p>
                            </div>
                            <div
                                onClick={() => setForm({ ...form, isPublic: !form.isPublic } as any)}
                                style={{
                                    width: '48px', height: '26px',
                                    background: form.isPublic ? '#10B981' : 'var(--bg-subtle)',
                                    borderRadius: '100px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    border: '1px solid var(--border)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '20px', height: '20px',
                                    background: 'white', borderRadius: '50%',
                                    position: 'absolute', top: '2px',
                                    left: form.isPublic ? '24px' : '2px',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Ticket Tiers */}
                    <div className="stat-card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Ticket size={20} color="#FBBF24" /> Ticket Tiers
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddTier}
                                className="btn-blue" style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                                <Plus size={16} /> Add Tier
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {form.tiers.map((tier, index) => (
                                <div key={index} style={{ padding: '20px', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: '16px', alignItems: 'end' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Tier Name</label>
                                            <select
                                                required
                                                value={tier.name}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    handleTierChange(index, 'name', val);

                                                    // Auto-map name to type
                                                    if (val === 'VIP') handleTierChange(index, 'type', 'VIP');
                                                    else if (val === 'Early Bird') handleTierChange(index, 'type', 'EARLY_BIRD');
                                                    else handleTierChange(index, 'type', 'GENERAL');
                                                }}
                                                style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px', borderRadius: '10px', color: 'var(--text-main)', outline: 'none' }}
                                            >
                                                <option value="">Select Type</option>
                                                <option value="General Admission">General Admission</option>
                                                <option value="VIP">VIP</option>
                                                <option value="Early Bird">Early Bird</option>
                                                <option value="Group / Family">Group / Family</option>
                                                <option value="Reserved Seating">Reserved Seating</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Price (ETB)</label>
                                            <input
                                                required
                                                type="number"
                                                value={tier.price}
                                                onChange={e => handleTierChange(index, 'price', e.target.value)}
                                                style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px', borderRadius: '10px', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Capacity</label>
                                            <input
                                                required
                                                type="number"
                                                value={tier.capacity}
                                                onChange={e => handleTierChange(index, 'capacity', e.target.value)}
                                                style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px', borderRadius: '10px', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTier(index)}
                                            disabled={form.tiers.length === 1}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', padding: '10px', borderRadius: '10px', cursor: 'pointer', opacity: form.tiers.length === 1 ? 0.3 : 1 }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newTiers = [...form.tiers];
                                                (newTiers[index] as any).expanded = !(newTiers[index] as any).expanded;
                                                setForm({ ...form, tiers: newTiers });
                                            }}
                                            style={{ background: 'transparent', border: 'none', color: '#1D90F5', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                        >
                                            <Settings size={14} /> {(tier as any).expanded ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                                        </button>

                                        {(tier as any).expanded && (
                                            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Tier Type</label>
                                                    <select
                                                        value={(tier as any).type || 'GENERAL'}
                                                        onChange={e => handleTierChange(index, 'type', e.target.value)}
                                                        style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="GENERAL">General</option>
                                                        <option value="VIP">VIP</option>
                                                        <option value="EARLY_BIRD">Early Bird</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Sales Start</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={(tier as any).salesStart}
                                                        onChange={e => handleTierChange(index, 'salesStart', e.target.value)}
                                                        style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Sales End</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={(tier as any).salesEnd}
                                                        onChange={e => handleTierChange(index, 'salesEnd', e.target.value)}
                                                        style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Max Per User</label>
                                                    <input
                                                        type="number"
                                                        value={(tier as any).maxPerUser}
                                                        onChange={e => handleTierChange(index, 'maxPerUser', e.target.value)}
                                                        style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px', borderRadius: '10px' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, fontSize: '0.8rem' }}>Allow Transfer</p>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ticket can be transferred</p>
                                                    </div>
                                                    <div
                                                        onClick={() => handleTierChange(index, 'isTransferable', !(tier as any).isTransferable)}
                                                        style={{
                                                            width: '42px', height: '22px',
                                                            background: (tier as any).isTransferable ? '#10B981' : 'var(--bg-subtle)',
                                                            borderRadius: '100px',
                                                            position: 'relative',
                                                            cursor: 'pointer',
                                                            border: '1px solid var(--border)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '18px', height: '18px',
                                                            background: 'white', borderRadius: '50%',
                                                            position: 'absolute', top: '1px',
                                                            left: (tier as any).isTransferable ? '21px' : '2px',
                                                            transition: 'all 0.2s',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                        }} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px', borderRadius: '10px' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, fontSize: '0.8rem' }}>Allow Resale</p>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ticket can be resold</p>
                                                    </div>
                                                    <div
                                                        onClick={() => handleTierChange(index, 'isResellable', !(tier as any).isResellable)}
                                                        style={{
                                                            width: '42px', height: '22px',
                                                            background: (tier as any).isResellable ? '#10B981' : 'var(--bg-subtle)',
                                                            borderRadius: '100px',
                                                            position: 'relative',
                                                            cursor: 'pointer',
                                                            border: '1px solid var(--border)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '18px', height: '18px',
                                                            background: 'white', borderRadius: '50%',
                                                            position: 'absolute', top: '1px',
                                                            left: (tier as any).isResellable ? '21px' : '2px',
                                                            transition: 'all 0.2s',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                        }} />
                                                    </div>
                                                </div>
                                                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'rgba(29, 144, 245, 0.1)', borderRadius: '8px', fontSize: '0.75rem', color: '#1D90F5' }}>
                                                    <AlertCircle size={14} />
                                                    <span>Estimated Fees: 5% Platform Commission + 2% Service Fee will be deducted/added based on configuration.</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Media */}
                    <div className="stat-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ImageIcon size={20} color="#EC4899" /> Event Media
                        </h3>
                        <div>
                            <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--bg-subtle)', border: '2px dashed var(--border)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', marginBottom: '16px' }}>
                                {form.coverImage ? (
                                    <img src={form.coverImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <ImageIcon size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Image Preview</p>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input
                                    type="text"
                                    placeholder="Paste image URL here..."
                                    value={form.coverImage.startsWith('data:') ? '' : form.coverImage}
                                    onChange={e => setForm({ ...form, coverImage: e.target.value })}
                                    style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '12px', color: 'var(--text-main)' }}
                                />

                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OR</span>
                                </div>

                                <input
                                    type="file"
                                    id="local-image-edit"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('local-image-edit')?.click()}
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                                >
                                    Upload Local Image
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Refund Policy */}
                    <div className="stat-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ShieldCheck size={20} color="#A78BFA" /> Policies
                        </h3>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Refund Policy</label>
                            <textarea
                                rows={3}
                                value={form.refundPolicy}
                                onChange={e => setForm({ ...form, refundPolicy: e.target.value })}
                                style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', borderRadius: '12px', color: 'var(--text-main)', resize: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-blue"
                            style={{ width: '100%', justifyContent: 'center', padding: '18px', fontSize: '1.1rem', fontWeight: 900 }}
                        >
                            {saving ? <Loader2 className="animate-spin" size={24} /> : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={onComplete}
                            style={{ width: '100%', padding: '16px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '16px', cursor: 'pointer', fontWeight: 700 }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </motion.div>
    );
};
