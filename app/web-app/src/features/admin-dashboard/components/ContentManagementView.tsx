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
    const [newBanner, setNewBanner] = useState({ title: '', imageUrl: '', linkUrl: '', order: 0 });

    // Details handling
    const [selectedItem, setSelectedItem] = useState<{ type: 'category' | 'city', data: any } | null>(null);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [catRes, cityRes, bannerRes] = await Promise.all([
                ContentService.getCategories(),
                ContentService.getCities(),
                ContentService.getBanners()
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
            await ContentService.addBanner(newBanner);
            setNewBanner({ title: '', imageUrl: '', linkUrl: '', order: 0 });
            fetchData();
        } catch (err: any) { alert('Failed to add banner'); }
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <ImageIcon color="var(--primary)" />
                    <h3 style={{ fontWeight: 800 }}>Homepage Hero Banners</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    <input placeholder="Banner Title" value={newBanner.title} onChange={e => setNewBanner({ ...newBanner, title: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text-main)' }} />
                    <input placeholder="Image URL" value={newBanner.imageUrl} onChange={e => setNewBanner({ ...newBanner, imageUrl: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text-main)' }} />
                    <input placeholder="Link URL" value={newBanner.linkUrl} onChange={e => setNewBanner({ ...newBanner, linkUrl: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text-main)' }} />
                    <button onClick={handleAddBanner} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>Add Banner</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {banners.map(b => (
                        <div key={b.id} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '160px', border: '1px solid var(--border)' }}>
                            <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{b.title || 'No Title'}</h4>
                                <button onClick={() => handleDeleteBanner(b.id)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {banners.length === 0 && (
                        <div style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No homepage banners active.</p>
                        </div>
                    )}
                </div>
            </div>

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
