import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MapPin, Tag, Loader2, X, Calendar as CalendarIcon, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
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

    // --- Modal State ---
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'info' | 'success';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info'
    });

    const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const toSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };

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
            setFormStatus('loading');
            await ContentService.addCategory(newCat.name, newCat.slug);
            setNewCat({ name: '', slug: '' });
            fetchData();
            showStatus('success', 'Category added successfully');
        } catch (err: any) {
            showStatus('error', err.error || 'Failed to add category');
        } finally {
            setFormStatus('idle');
        }
    };

    const handleAddCity = async () => {
        if (!newCity.name || !newCity.slug) return;
        try {
            setFormStatus('loading');
            await ContentService.addCity(newCity.name, newCity.slug);
            setNewCity({ name: '', slug: '' });
            fetchData();
            showStatus('success', 'City developed successfully');
        } catch (err: any) {
            showStatus('error', err.error || 'Failed to add city');
        } finally {
            setFormStatus('idle');
        }
    };

    const showStatus = (type: 'success' | 'error', msg: string) => {
        setFormStatus(type);
        setStatusMessage(msg);
        setTimeout(() => setFormStatus('idle'), 5000);
    };

    const handleAddBanner = async () => {
        if (!newBanner.imageUrl) return;
        try {
            setFormStatus('loading');
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
            showStatus('success', 'Hero banner launched successfully');
        } catch (err: any) {
            console.error(err);
            showStatus('error', err.response?.data?.error || err.message || 'Failed to add banner');
        } finally {
            setFormStatus('idle');
        }
    };

    const handleUpdateBanner = async () => {
        if (!editingBanner) return;
        try {
            await ContentService.updateBanner(editingBanner.id, editingBanner);
            setEditingBanner(null);
            fetchData();
            showStatus('success', 'Banner updated successfully');
        } catch (err: any) {
            showStatus('error', 'Failed to update banner');
        }
    };

    const handleToggleBannerStatus = async (banner: any) => {
        try {
            await ContentService.updateBanner(banner.id, { isActive: !banner.isActive });
            fetchData();
        } catch (err) {
            showStatus('error', 'Failed to toggle status');
        }
    };

    const handleDeleteCat = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setModalConfig({
            isOpen: true,
            title: 'Delete Category',
            message: `Are you sure you want to delete "${name}"? This might affect existing events associated with this category.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await ContentService.removeCategory(id);
                    fetchData();
                    showStatus('success', 'Category deleted');
                } catch (err: any) { showStatus('error', err.error || 'Failed to delete'); }
            }
        });
    };

    const handleDeleteCity = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setModalConfig({
            isOpen: true,
            title: 'Delete City',
            message: `Are you sure you want to delete "${name}"? This will remove the city from the platform's searchable metrics.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await ContentService.removeCity(id);
                    fetchData();
                    showStatus('success', 'City removed');
                } catch (err: any) { showStatus('error', err.error || 'Failed to delete'); }
            }
        });
    };

    const handleDeleteBanner = async (id: number) => {
        setModalConfig({
            isOpen: true,
            title: 'Delete Banner',
            message: 'Are you sure you want to remove this hero banner from the homepage?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await ContentService.removeBanner(id);
                    fetchData();
                    showStatus('success', 'Banner deleted');
                } catch (err: any) { showStatus('error', 'Failed to delete banner'); }
            }
        });
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
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input
                                placeholder="Category Name"
                                value={newCat.name}
                                onChange={e => {
                                    const name = e.target.value;
                                    setNewCat({ name, slug: toSlug(name) });
                                }}
                                style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <input
                                placeholder="slug-auto-generated"
                                value={newCat.slug}
                                onChange={e => setNewCat({ ...newCat, slug: e.target.value.toLowerCase() })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700 }}
                            />
                        </div>
                        <button onClick={handleAddCategory} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                            <Plus size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {categories.map(c => (
                            <div
                                key={c.id}
                                onClick={() => handleFetchDetail('category', c.id)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '16px',
                                    cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s',
                                    position: 'relative', overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(217, 70, 239, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Tag size={18} color="#D946EF" />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{c.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{c.slug} • {c._count?.events || 0} Events</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={(e) => handleDeleteCat(e, c.id, c.name)}
                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                                    >
                                        <Trash2 size={16} color="#EF4444" />
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
                        <div style={{ flex: 1 }}>
                            <input
                                placeholder="City Name"
                                value={newCity.name}
                                onChange={e => {
                                    const name = e.target.value;
                                    setNewCity({ name, slug: toSlug(name) });
                                }}
                                style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <input
                                placeholder="slug-path"
                                value={newCity.slug}
                                onChange={e => setNewCity({ ...newCity, slug: e.target.value.toLowerCase() })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: '#3B82F6', fontSize: '0.8rem', fontWeight: 700 }}
                            />
                        </div>
                        <button onClick={handleAddCity} style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                            <Plus size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {cities.map(c => (
                            <div
                                key={c.id}
                                onClick={() => handleFetchDetail('city', c.id)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '16px',
                                    cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                    e.currentTarget.style.borderColor = 'var(--primary-blue)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <MapPin size={18} color="#3B82F6" />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{c.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{c.slug} • {c._count?.events || 0} Events</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteCity(e, c.id, c.name)}
                                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                                >
                                    <Trash2 size={16} color="#EF4444" />
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '28px' }}>
                    {banners.map(b => (
                        <div
                            key={b.id}
                            style={{
                                position: 'relative', borderRadius: '28px', overflow: 'hidden',
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                display: 'flex', flexDirection: 'column', height: 'fit-content',
                                opacity: b.isActive ? 1 : 0.7, transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.borderColor = 'var(--primary)';
                                e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(0,0,0,0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Priority & Status Controls */}
                            <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900, color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    PRIORITY {b.priority}
                                </div>
                                <button
                                    onClick={() => handleToggleBannerStatus(b)}
                                    style={{
                                        background: b.isActive ? '#10B981' : 'rgba(15, 23, 42, 0.8)',
                                        color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '100px',
                                        fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', backdropFilter: 'blur(10px)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {b.isActive ? '• LIVE' : '• PAUSED'}
                                </button>
                            </div>

                            <div style={{ height: '180px', position: 'relative' }}>
                                <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px', background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.95))' }}>
                                    <h4 style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: '4px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{b.title || 'Mobile Campaign'}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{b.subtitle || 'General platform promotion'}</p>
                                </div>
                            </div>

                            <div style={{ padding: '20px' }}>
                                {/* Metrics Bar - More Integrated */}
                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '24px' }}>
                                    <div style={{ flex: 1, padding: '16px', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                                        <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impressions</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 950, color: 'white' }}>{(b.viewCount || 0).toLocaleString()}</p>
                                    </div>
                                    <div style={{ flex: 1, padding: '16px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Click Rate</p>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--primary)' }}>
                                            {b.viewCount ? ((b.clickCount || 0) / b.viewCount * 100).toFixed(1) : '0.0'}%
                                        </p>
                                    </div>
                                </div>

                                {/* Deployment Info */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem' }}>
                                        <MapPin size={16} color="var(--primary-blue)" />
                                        <span style={{ fontWeight: 700 }}>{(b.targetRules as any)?.city || 'Global (All Cities)'}</span>
                                    </div>
                                    {(b.startDate || b.endDate) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem' }}>
                                            <CalendarIcon size={16} color="#D946EF" />
                                            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                                                {b.startDate ? new Date(b.startDate).toLocaleDateString() : 'Now'} - {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'Forever'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => setEditingBanner(b)}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.04)', color: 'white', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                    >
                                        Edit Details
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBanner(b.id)}
                                        style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                                    >
                                        <Trash2 size={20} />
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
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15000 }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} style={{ width: '650px', background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 950 }}>Edit Banner</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>Update campaign parameters and targeting.</p>
                                </div>
                                <button onClick={() => setEditingBanner(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', padding: '12px', borderRadius: '50%', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Image URL</label>
                                    <input value={editingBanner.imageUrl} onChange={e => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Campaign Title</label>
                                    <input value={editingBanner.title} onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subtitle</label>
                                    <input value={editingBanner.subtitle} onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CTA Text</label>
                                    <input value={editingBanner.ctaText} onChange={e => setEditingBanner({ ...editingBanner, ctaText: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Priority Index</label>
                                    <input type="number" value={editingBanner.priority} onChange={e => setEditingBanner({ ...editingBanner, priority: parseInt(e.target.value) || 0 })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target City</label>
                                    <select
                                        value={(editingBanner.targetRules as any)?.city || ''}
                                        onChange={e => setEditingBanner({ ...editingBanner, targetRules: { ...(editingBanner.targetRules as any), city: e.target.value } })}
                                        style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }}
                                    >
                                        <option value="">Global Coverage</option>
                                        {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Language</label>
                                    <select
                                        value={(editingBanner.targetRules as any)?.lang || ''}
                                        onChange={e => setEditingBanner({ ...editingBanner, targetRules: { ...(editingBanner.targetRules as any), lang: e.target.value } })}
                                        style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }}
                                    >
                                        <option value="">Universal Language</option>
                                        <option value="en">English</option>
                                        <option value="am">Amharic</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                                <button onClick={() => setEditingBanner(null)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>Discard Changes</button>
                                <button onClick={handleUpdateBanner} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 950, cursor: 'pointer', boxShadow: '0 8px 20px rgba(29, 144, 245, 0.3)' }}>Update Campaign</button>
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

            {/* 🛡️ Global Status Notification */}
            <AnimatePresence>
                {formStatus !== 'idle' && formStatus !== 'loading' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        style={{
                            position: 'fixed', bottom: '40px', left: '50%', x: '-50%', zIndex: 12000,
                            padding: '12px 20px', borderRadius: '100px',
                            background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)',
                            border: `1px solid ${formStatus === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            color: 'white', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: formStatus === 'success' ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {formStatus === 'success' ? <CheckCircle2 size={16} color="white" /> : <AlertCircle size={16} color="white" />}
                        </div>
                        <span style={{ fontSize: '0.9rem' }}>{statusMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🛡️ Confirmation Modal */}
            <AnimatePresence>
                {modalConfig.isOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{ width: '400px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: modalConfig.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(29, 144, 245, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                {modalConfig.type === 'danger' ? <Trash2 color="#EF4444" size={24} /> : <RefreshCcw color="var(--primary-blue)" size={24} />}
                            </div>

                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>{modalConfig.title}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '32px' }}>{modalConfig.message}</p>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        modalConfig.onConfirm();
                                        setModalConfig({ ...modalConfig, isOpen: false });
                                    }}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: modalConfig.type === 'danger' ? '#EF4444' : 'var(--primary-blue)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
