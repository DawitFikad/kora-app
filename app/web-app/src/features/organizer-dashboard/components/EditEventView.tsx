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
    Loader2
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

    const [form, setForm] = useState({
        title: '',
        description: '',
        venue: '',
        dateTime: '',
        categoryId: '',
        cityId: '',
        coverImage: '',
        refundPolicy: '',
        tiers: [{ name: '', price: '', capacity: '' }]
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
                    setForm({
                        title: event.title || '',
                        description: event.description || '',
                        venue: event.venue || '',
                        dateTime: event.dateTime ? new Date(event.dateTime).toISOString().slice(0, 16) : '',
                        categoryId: String(event.categoryId) || '',
                        cityId: String(event.cityId) || '',
                        coverImage: event.coverImage || '',
                        refundPolicy: event.refundPolicy || '',
                        tiers: event.tiers?.length > 0
                            ? event.tiers.map((t: any) => ({ name: t.name, price: String(t.price), capacity: String(t.capacity) }))
                            : [{ name: '', price: '', capacity: '' }]
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
            tiers: [...form.tiers, { name: '', price: '', capacity: '' }]
        });
    };

    const handleRemoveTier = (index: number) => {
        const newTiers = [...form.tiers];
        newTiers.splice(index, 1);
        setForm({ ...form, tiers: newTiers });
    };

    const handleTierChange = (index: number, field: string, value: string) => {
        const newTiers = [...form.tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setForm({ ...form, tiers: newTiers });
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
                tiers: form.tiers.map(t => ({
                    ...t,
                    price: parseFloat(t.price as string) || 0,
                    capacity: parseInt(t.capacity as string) || 0
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Category</label>
                                    <select
                                        required
                                        value={form.categoryId}
                                        onChange={e => setForm({ ...form, categoryId: e.target.value })}
                                        style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '14px', borderRadius: '12px', color: 'var(--text-main)' }}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
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
                                <div key={index} style={{ padding: '20px', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: '16px', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Tier Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={tier.name}
                                            onChange={e => handleTierChange(index, 'name', e.target.value)}
                                            style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px', borderRadius: '10px', color: 'var(--text-main)' }}
                                        />
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
