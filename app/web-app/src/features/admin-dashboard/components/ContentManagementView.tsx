import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MapPin, Tag, Loader2, X, Calendar as CalendarIcon, Image as ImageIcon } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { ContentService } from '../../../core/api/content.service';
import { AdminService } from '../../../core/api/admin.service';

export const ContentManagementView = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newCat, setNewCat] = useState({ name: '', slug: '' });
    const [newCity, setNewCity] = useState({ name: '', slug: '' });
    const [newBanner, setNewBanner] = useState({
        title: '', subtitle: '', imageUrl: '', linkUrl: '',
        ctaText: 'Learn More', priority: 0, order: 0,
        startDate: '', endDate: '', isActive: true,
        targetRules: {}
    });

    const [editingBanner, setEditingBanner] = useState<any | null>(null);

    // Details handling
    const [selectedItem, setSelectedItem] = useState<{ type: 'category' | 'city', data: any } | null>(null);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [catRes, cityRes, bannerRes] = await Promise.all([
                ContentService.getCategories(),
                ContentService.getCities(),
                ContentService.getBanners(true)
            ]);
            if (catRes?.success) setCategories(catRes.data);
            if (cityRes?.success) setCities(cityRes.data);
            if (bannerRes?.success) setBanners(bannerRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFetchDetail = async (type: 'category' | 'city', id: number) => {
        try {
            setIsFetchingDetail(true);
            const detail = type === 'category'
                ? await ContentService.getCategoryDetail(id)
                : await ContentService.getCityDetail(id);
            setSelectedItem({ type, data: detail.data });
        } catch (err) {
            console.error('Failed to fetch detail', err);
        } finally {
            setIsFetchingDetail(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCat.name || !newCat.slug) return;
        try {
            await ContentService.addCategory(newCat.name, newCat.slug);
            setNewCat({ name: '', slug: '' });
            fetchData();
        } catch (err: any) { alert(err.error || 'Failed to add'); }
    };

    const handleAddCity = async () => {
        if (!newCity.name || !newCity.slug) return;
        try {
            await ContentService.addCity(newCity.name, newCity.slug);
            setNewCity({ name: '', slug: '' });
            fetchData();
        } catch (err: any) { alert(err.error || 'Failed to add'); }
    };

    const handleAddBanner = async () => {
        if (!newBanner.imageUrl) return;
        try {
            // Clean up empty dates
            const data = { ...newBanner };
            if (!data.startDate) delete (data as any).startDate;
            if (!data.endDate) delete (data as any).endDate;

            await ContentService.addBanner(data);
            setNewBanner({
                title: '', subtitle: '', imageUrl: '', linkUrl: '',
                ctaText: 'Learn More', priority: 0, order: 0,
                startDate: '', endDate: '', isActive: true,
                targetRules: {}
            });
            fetchData();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || err.message || 'Failed to add banner');
        }
    };

    const handleUpdateBanner = async () => {
        if (!editingBanner) return;
        try {
            await ContentService.updateBanner(editingBanner.id, editingBanner);
            setEditingBanner(null);
            fetchData();
        } catch (err: any) {
            alert('Failed to update banner');
        }
    };

    const handleToggleBannerStatus = async (banner: any) => {
        try {
            await ContentService.updateBanner(banner.id, { isActive: !banner.isActive });
            fetchData();
        } catch (err) {
            alert('Failed to toggle status');
        }
    };

    const handleDeleteCat = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This might affect existing events.')) return;
        try {
            await ContentService.removeCategory(id);
            fetchData();
        } catch (err: any) { alert(err.error || 'Failed to delete'); }
    };

    const handleDeleteCity = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('Are you sure?')) return;
        try {
            await ContentService.removeCity(id);
            fetchData();
        } catch (err: any) { alert(err.error || 'Failed to delete'); }
    };

    const handleDeleteBanner = async (id: number) => {
        if (!confirm('Delete this banner?')) return;
        try {
            await ContentService.removeBanner(id);
            fetchData();
        } catch (err: any) { alert('Failed to delete banner'); }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader title="Content Management" subtitle="Manage platform metadata: Categories, Cities, and Hero Banners." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Categories Section */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Tag color="#D946EF" />
                        <h3 style={{ fontWeight: 800 }}>Event Categories</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        <input
                            placeholder="Name"
                            value={newCat.name}
                            onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                            style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-main)' }}
                        />
                        <input
                            placeholder="Slug"
                            value={newCat.slug}
                            onChange={e => setNewCat({ ...newCat, slug: e.target.value.toLowerCase() })}
                            style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-main)' }}
                        />
                        <button onClick={handleAddCategory} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                            <Plus size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {categories.map(c => (
                            <div
                                key={c.id}
                                onClick={() => handleFetchDetail('category', c.id)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '10px',
                                    cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s'
                                }}
                            >
                                <div>
                                    <p style={{ fontWeight: 700 }}>{c.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c._count?.events || 0} Events</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={(e) => handleDeleteCat(e, c.id)} style={{ padding: '8px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cities Section */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <MapPin color="#3B82F6" />
                        <h3 style={{ fontWeight: 800 }}>Active Cities</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        <input
                            placeholder="City Name"
                            value={newCity.name}
                            onChange={e => setNewCity({ ...newCity, name: e.target.value })}
                            style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-main)' }}
                        />
                        <input
                            placeholder="Slug"
                            value={newCity.slug}
                            onChange={e => setNewCity({ ...newCity, slug: e.target.value.toLowerCase() })}
                            style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-main)' }}
                        />
                        <button onClick={handleAddCity} style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                            <Plus size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {cities.map(c => (
                            <div
                                key={c.id}
                                onClick={() => handleFetchDetail('city', c.id)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px',
                                    cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s'
                                }}
                            >
                                <div>
                                    <p style={{ fontWeight: 700 }}>{c.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c._count?.events || 0} Events</p>
                                </div>
                                <button onClick={(e) => handleDeleteCity(e, c.id)} style={{ padding: '8px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Homepage Hero Banners */}
            <div className="admin-card" style={{ padding: '24px', marginTop: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <ImageIcon color="var(--primary)" />
                    <h3 style={{ fontWeight: 800 }}>Homepage Hero Banners</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                    Manage banners that appear on the mobile and web homepages. Higher priority banners appear first.
                </p>

                {/* Banner Creation Form - More Professional */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '32px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '20px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create New Banner</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Banner Title (Optional)</label>
                            <input
                                placeholder="e.g. Early Bird Tickets"
                                value={newBanner.title}
                                onChange={e => setNewBanner({ ...newBanner, title: e.target.value })}
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Subtitle (Optional)</label>
                            <input
                                placeholder="e.g. Get 20% off today"
                                value={newBanner.subtitle}
                                onChange={e => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Image URL (Required)</label>
                            <input
                                placeholder="https://..."
                                value={newBanner.imageUrl}
                                onChange={e => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>CTA Text</label>
                            <input
                                value={newBanner.ctaText}
                                onChange={e => setNewBanner({ ...newBanner, ctaText: e.target.value })}
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Link / Destination</label>
                            <input
                                placeholder="/events/123 or https://..."
                                value={newBanner.linkUrl}
                                onChange={e => setNewBanner({ ...newBanner, linkUrl: e.target.value })}
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Priority (Ranking)</label>
                                <input
                                    type="number"
                                    value={newBanner.priority}
                                    onChange={e => setNewBanner({ ...newBanner, priority: parseInt(e.target.value) || 0 })}
                                    style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Internal Order</label>
                                <input
                                    type="number"
                                    value={newBanner.order}
                                    onChange={e => setNewBanner({ ...newBanner, order: parseInt(e.target.value) || 0 })}
                                    style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Start Date (Optional)</label>
                            <input
                                type="datetime-local"
                                value={newBanner.startDate}
                                onChange={e => setNewBanner({ ...newBanner, startDate: e.target.value })}
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>End Date (Optional)</label>
                            <input
                                type="datetime-local"
                                value={newBanner.endDate}
                                onChange={e => setNewBanner({ ...newBanner, endDate: e.target.value })}
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target City</label>
                                <select
                                    value={(newBanner.targetRules as any).city || ''}
                                    onChange={e => setNewBanner({ ...newBanner, targetRules: { ...newBanner.targetRules, city: e.target.value } })}
                                    style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                >
                                    <option value="">All Cities</option>
                                    {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Language</label>
                                <select
                                    value={(newBanner.targetRules as any).lang || ''}
                                    onChange={e => setNewBanner({ ...newBanner, targetRules: { ...newBanner.targetRules, lang: e.target.value } })}
                                    style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                >
                                    <option value="">All Languages</option>
                                    <option value="en">English</option>
                                    <option value="am">Amharic</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                onClick={handleAddBanner}
                                style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary), #3B82F6)', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                            >
                                <Plus size={20} />
                                Create Banner
                            </button>
                        </div>
                    </div>
                </div>

                {/* Banner List / Grid with Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {banners.map(b => (
                        <div
                            key={b.id}
                            style={{
                                position: 'relative', borderRadius: '24px', overflow: 'hidden',
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                display: 'flex', flexDirection: 'column', height: 'fit-content',
                                opacity: b.isActive ? 1 : 0.6, transition: 'all 0.3s'
                            }}
                        >
                            {/* Priority Badge */}
                            <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 900, color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                P{b.priority}
                            </div>

                            {/* Status Checkbox / Toggle */}
                            <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                                <button
                                    onClick={() => handleToggleBannerStatus(b)}
                                    style={{
                                        background: b.isActive ? '#10B981' : 'rgba(255,255,255,0.1)',
                                        color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px',
                                        fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer', backdropFilter: 'blur(4px)'
                                    }}
                                >
                                    {b.isActive ? 'LIVE' : 'PAUSED'}
                                </button>
                            </div>

                            <div style={{ height: '160px', position: 'relative' }}>
                                <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))' }}>
                                    <h4 style={{ fontWeight: 800, fontSize: '1rem' }}>{b.title || 'Nameless Banner'}</h4>
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{b.subtitle || 'No subtitle provided'}</p>
                                </div>
                            </div>

                            <div style={{ padding: '20px' }}>
                                {/* Metrics Bar */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Impressions</p>
                                        <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#3B82F6' }}>{b.viewCount || 0}</p>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Engagement</p>
                                        <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>{b.clickCount || 0}</p>
                                    </div>
                                </div>

                                {/* Scheduling Info */}
                                {(b.startDate || b.endDate) && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', fontSize: '0.75rem', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                        {b.startDate && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Starts:</span>
                                            <span style={{ fontWeight: 700 }}>{new Date(b.startDate).toLocaleDateString()}</span>
                                        </div>}
                                        {b.endDate && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Ends:</span>
                                            <span style={{ fontWeight: 700 }}>{new Date(b.endDate).toLocaleDateString()}</span>
                                        </div>}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setEditingBanner(b)}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        Edit Details
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBanner(b.id)}
                                        style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {banners.length === 0 && (
                        <div style={{ gridColumn: 'span 3', padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '2px dashed var(--border)' }}>
                            <ImageIcon size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.3 }} />
                            <h4 style={{ fontWeight: 800, color: 'var(--text-muted)' }}>No homepage banners active.</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>Create your first banner to see it live on the homepage.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Banner Modal (New) */}
            <AnimatePresence>
                {editingBanner && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ width: '600px', background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Edit Banner</h3>
                                <button onClick={() => setEditingBanner(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Image URL</label>
                                    <input value={editingBanner.imageUrl} onChange={e => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Title</label>
                                    <input value={editingBanner.title} onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Subtitle</label>
                                    <input value={editingBanner.subtitle} onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>CTA Text</label>
                                    <input value={editingBanner.ctaText} onChange={e => setEditingBanner({ ...editingBanner, ctaText: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Priority</label>
                                    <input type="number" value={editingBanner.priority} onChange={e => setEditingBanner({ ...editingBanner, priority: parseInt(e.target.value) || 0 })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Start Date</label>
                                    <input type="datetime-local" value={editingBanner.startDate?.split('.')[0] || ''} onChange={e => setEditingBanner({ ...editingBanner, startDate: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>End Date</label>
                                    <input type="datetime-local" value={editingBanner.endDate?.split('.')[0] || ''} onChange={e => setEditingBanner({ ...editingBanner, endDate: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Target City</label>
                                    <select
                                        value={(editingBanner.targetRules as any)?.city || ''}
                                        onChange={e => setEditingBanner({ ...editingBanner, targetRules: { ...(editingBanner.targetRules as any), city: e.target.value } })}
                                        style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }}
                                    >
                                        <option value="">All Cities</option>
                                        {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Target Language</label>
                                    <select
                                        value={(editingBanner.targetRules as any)?.lang || ''}
                                        onChange={e => setEditingBanner({ ...editingBanner, targetRules: { ...(editingBanner.targetRules as any), lang: e.target.value } })}
                                        style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }}
                                    >
                                        <option value="">All Languages</option>
                                        <option value="en">English</option>
                                        <option value="am">Amharic</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button onClick={() => setEditingBanner(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleUpdateBanner} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Selection Detail Panel */}
            <AnimatePresence>
                {selectedItem && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                        display: 'flex', justifyContent: 'flex-end', zIndex: 1000
                    }}>
                        <motion.div
                            initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
                            style={{ width: '450px', height: '100%', background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)', padding: '40px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{selectedItem.data.name}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Slug: /{selectedItem.data.slug}</p>
                                </div>
                                <button onClick={() => setSelectedItem(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '20px' }}>ASSOCIATED EVENTS ({selectedItem.data.events?.length || 0})</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                                {selectedItem.data.events?.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '16px' }}>
                                        No events found for this {selectedItem.type}.
                                    </div>
                                ) : (
                                    selectedItem.data.events.map((evt: any) => (
                                        <div key={evt.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <h4 style={{ fontWeight: 800, fontSize: '0.95rem' }}>{evt.title}</h4>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900,
                                                    background: evt.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: evt.status === 'APPROVED' ? '#10B981' : '#F59E0B'
                                                }}>{evt.status}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    <CalendarIcon size={14} />
                                                    {new Date(evt.dateTime).toLocaleDateString()}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    <MapPin size={14} />
                                                    {evt.venue}
                                                </div>
                                                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                                                        By {evt.organizer?.organizationName}
                                                    </span>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                await AdminService.toggleFeaturedEvent(evt.id, !evt.featured);
                                                                handleFetchDetail(selectedItem.type, selectedItem.data.id);
                                                            } catch (err) { alert('Failed to update'); }
                                                        }}
                                                        style={{
                                                            background: evt.featured ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                            color: 'white', border: '1px solid var(--border)',
                                                            padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer'
                                                        }}
                                                    >
                                                        {evt.featured ? '★ Featured' : '☆ Feature'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {isFetchingDetail && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: '12px', zIndex: 1100, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
                    <Loader2 size={18} className="animate-spin" />
                    Fetching Details...
                </div>
            )}
        </motion.div>
    );
};
