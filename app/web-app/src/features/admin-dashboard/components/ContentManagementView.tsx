import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MapPin, Tag, Loader2, X, Calendar as CalendarIcon, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';

import { ContentService } from '../../../core/api/content.service';
import { AdminService } from '../../../core/api/admin.service';

export const ContentManagementView = () => {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newCat, setNewCat] = useState({ name: '', slug: '' });
    const [newSubCat, setNewSubCat] = useState<any>({ name: '', slug: '', mainCategoryId: '' });
    const [newCity, setNewCity] = useState({ name: '', slug: '' });
    const [newBanner, setNewBanner] = useState({
        title: '', subtitle: '', imageUrl: '', linkUrl: '',
        ctaText: 'Learn More', priority: 0, order: 0,
        startDate: '', endDate: '', isActive: true,
        targetRules: {}
    });

    const [editingBanner, setEditingBanner] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'banners' | 'categories' | 'cities'>('banners');

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
            ]).catch(err => {
                console.error("API Error in Promise.all", err);
                return [null, null, null];
            });

            const extractArray = (res: any) => {
                if (!res) return [];
                if (Array.isArray(res)) return res;
                if (Array.isArray(res.data)) return res.data;
                if (res.data && Array.isArray(res.data.data)) return res.data.data;
                return [];
            };

            const catArray = extractArray(catRes);
            if (catArray.length > 0) setCategories(catArray);
            else if (catRes?.success) setCategories(catRes.data);

            const cityArray = extractArray(cityRes);
            if (cityArray.length > 0) setCities(cityArray);
            else if (cityRes?.success) setCities(cityRes.data);

            const bannerArray = extractArray(bannerRes);
            if (bannerArray.length > 0) setBanners(bannerArray);
            else if (bannerRes?.success) setBanners(bannerRes.data);
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
            showStatus('success', t('admin.content.added_success'));
        } catch (err: any) {
            showStatus('error', err.error || t('admin.team.failed'));
        } finally {
            setFormStatus('idle');
        }
    };

    const handleAddSubCategory = async () => {
        if (!newSubCat.name || !newSubCat.slug || !newSubCat.mainCategoryId) return;
        try {
            setFormStatus('loading');
            await ContentService.addCategory(newSubCat.name, newSubCat.slug, parseInt(newSubCat.mainCategoryId));
            setNewSubCat({ name: '', slug: '', mainCategoryId: '' });
            fetchData();
            showStatus('success', t('admin.content.added_success'));
        } catch (err: any) {
            showStatus('error', err.error || t('admin.team.failed'));
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
            showStatus('success', t('admin.content.added_success'));
        } catch (err: any) {
            showStatus('error', err.error || t('admin.team.failed'));
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
            showStatus('success', t('admin.content.banner_added_success'));
        } catch (err: any) {
            console.error(err);
            showStatus('error', err.response?.data?.error || err.message || t('admin.team.failed'));
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
            showStatus('success', t('admin.content.banner_updated_success'));
        } catch (err: any) {
            showStatus('error', t('admin.team.failed'));
        }
    };

    const handleToggleBannerStatus = async (banner: any) => {
        try {
            await ContentService.updateBanner(banner.id, { isActive: !banner.isActive });
            fetchData();
        } catch (err) {
            showStatus('error', t('admin.team.failed'));
        }
    };

    const handleDeleteCat = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setModalConfig({
            isOpen: true,
            title: t('admin.content.delete_category_title'),
            message: t('admin.content.delete_category_message', { name }),
            type: 'danger',
            onConfirm: async () => {
                try {
                    await ContentService.removeCategory(id);
                    fetchData();
                    showStatus('success', t('admin.content.category_deleted'));
                } catch (err: any) { showStatus('error', err.error || t('admin.team.failed')); }
            }
        });
    };

    const handleDeleteCity = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        setModalConfig({
            isOpen: true,
            title: t('admin.content.delete_city_title'),
            message: t('admin.content.delete_city_message', { name }),
            type: 'danger',
            onConfirm: async () => {
                try {
                    await ContentService.removeCity(id);
                    fetchData();
                    showStatus('success', t('admin.content.city_removed'));
                } catch (err: any) { showStatus('error', err.error || t('admin.team.failed')); }
            }
        });
    };

    const handleDeleteBanner = async (id: number) => {
        setModalConfig({
            isOpen: true,
            title: t('admin.content.delete_banner_title'),
            message: t('admin.content.delete_banner_message'),
            type: 'danger',
            onConfirm: async () => {
                try {
                    await ContentService.removeBanner(id);
                    fetchData();
                    showStatus('success', t('admin.content.banner_deleted'));
                } catch (err: any) { showStatus('error', t('admin.team.failed')); }
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* 📑 Premium Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '40px',
                background: 'var(--bg-subtle)',
                padding: '8px',
                borderRadius: '20px',
                width: 'fit-content',
                border: '1px solid var(--border)'
            }}>
                {[
                    { id: 'banners', label: 'Banners', icon: ImageIcon, color: '#FF0000' },
                    { id: 'categories', label: 'Categories', icon: Tag, color: '#D946EF' },
                    { id: 'cities', label: 'Active Cities', icon: MapPin, color: '#10B981' },
                ].map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '14px 24px',
                                borderRadius: '14px',
                                border: isActive ? `1px solid ${t.color}30` : '1px solid transparent',
                                background: isActive ? 'var(--bg-card)' : 'transparent',
                                color: isActive ? t.color : 'var(--text-muted)',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isActive ? `0 10px 20px ${t.color}15` : 'none',
                                position: 'relative'
                            }}
                        >
                            <Icon size={18} color={isActive ? t.color : 'var(--text-muted)'} />
                            {t.label}
                            {isActive && (
                                <motion.div
                                    layoutId="contentTabGlow"
                                    style={{
                                        position: 'absolute',
                                        bottom: '-2px',
                                        left: '20%',
                                        right: '20%',
                                        height: '2px',
                                        background: t.color,
                                        boxShadow: `0 0 10px ${t.color}`
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'categories' && (
                    <motion.div
                        key="categories"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        {/* Categories Section */}
                        <div className="admin-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <Tag color="#D946EF" />
                                <h3 style={{ fontWeight: 800 }}>{t('admin.content.event_categories')}</h3>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <input
                                        placeholder={t('admin.content.category_name')}
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
                                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                                        <div
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
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{c.slug} • {c._count?.events || 0} {t('admin.content.events')}</p>
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
                                        {c.subcategories?.map((sc: any) => (
                                            <div key={sc.id} style={{ marginLeft: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(217, 70, 239, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D946EF' }}></div>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{sc.name}</p>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/{sc.slug}</p>
                                                    </div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCat(e, sc.id, sc.name); }} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <div style={{ marginLeft: '32px', display: 'flex', gap: '8px' }}>
                                            <input
                                                placeholder="Sub-category name"
                                                value={newSubCat.mainCategoryId === String(c.id) ? newSubCat.name : ''}
                                                onChange={e => {
                                                    const name = e.target.value;
                                                    setNewSubCat({ name, slug: toSlug(name), mainCategoryId: String(c.id) });
                                                }}
                                                style={{ flex: 2, background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.8rem' }}
                                            />
                                            <input
                                                placeholder="slug"
                                                value={newSubCat.mainCategoryId === String(c.id) ? newSubCat.slug : ''}
                                                onChange={e => setNewSubCat({ ...newSubCat, slug: e.target.value.toLowerCase(), mainCategoryId: String(c.id) })}
                                                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700 }}
                                            />
                                            <button onClick={handleAddSubCategory} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 12px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'cities' && (
                    <motion.div
                        key="cities"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <div className="admin-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <MapPin color="#FF0000" />
                                <h3 style={{ fontWeight: 800 }}>{t('admin.content.active_cities')}</h3>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <input
                                        placeholder={t('admin.content.city_name')}
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
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: '#FF0000', fontSize: '0.8rem', fontWeight: 700 }}
                                    />
                                </div>
                                <button onClick={handleAddCity} style={{ background: '#FF0000', color: 'white', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
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
                                                <MapPin size={18} color="#FF0000" />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{c.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{c.slug} • {c._count?.events || 0} {t('admin.content.events')}</p>
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
                    </motion.div>
                )}

                {activeTab === 'banners' && (
                    <motion.div
                        key="banners"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <div className="admin-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <ImageIcon color="var(--primary)" />
                                <h3 style={{ fontWeight: 800 }}>{t('admin.content.homepage_hero_banners')}</h3>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                                {t('admin.content.homepage_hero_banners_subtitle')}
                            </p>

                            {/* Banner Creation Form - More Professional */}
                            <div style={{ background: 'var(--bg-subtle)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '32px' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '20px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.content.create_new_banner')}</h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.content.banner_title_label')}</label>
                                        <input
                                            placeholder={t('admin.content.banner_title_placeholder')}
                                            value={newBanner.title}
                                            onChange={e => setNewBanner({ ...newBanner, title: e.target.value })}
                                            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.content.subtitle_label')}</label>
                                        <input
                                            placeholder={t('admin.content.subtitle_placeholder')}
                                            value={newBanner.subtitle}
                                            onChange={e => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                                            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.content.image_url_label')}</label>
                                        <input
                                            placeholder="https://..."
                                            value={newBanner.imageUrl}
                                            onChange={e => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                                            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.content.cta_text_label')}</label>
                                        <input
                                            value={newBanner.ctaText}
                                            onChange={e => setNewBanner({ ...newBanner, ctaText: e.target.value })}
                                            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.content.link_destination_label')}</label>
                                        <input
                                            placeholder="/events/123 or https://..."
                                            value={newBanner.linkUrl}
                                            onChange={e => setNewBanner({ ...newBanner, linkUrl: e.target.value })}
                                            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.content.priority_label')}</label>
                                            <input
                                                type="number"
                                                value={newBanner.priority}
                                                onChange={e => setNewBanner({ ...newBanner, priority: parseInt(e.target.value) || 0 })}
                                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.content.internal_order_label')}</label>
                                            <input
                                                type="number"
                                                value={newBanner.order}
                                                onChange={e => setNewBanner({ ...newBanner, order: parseInt(e.target.value) || 0 })}
                                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.content.start_date_label')}</label>
                                        <input
                                            type="datetime-local"
                                            value={newBanner.startDate}
                                            onChange={e => setNewBanner({ ...newBanner, startDate: e.target.value })}
                                            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.content.end_date_label')}</label>
                                        <input
                                            type="datetime-local"
                                            value={newBanner.endDate}
                                            onChange={e => setNewBanner({ ...newBanner, endDate: e.target.value })}
                                            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.content.target_city_label')}</label>
                                            <select
                                                value={(newBanner.targetRules as any).city || ''}
                                                onChange={e => setNewBanner({ ...newBanner, targetRules: { ...newBanner.targetRules, city: e.target.value } })}
                                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                            >
                                                <option value="">{t('admin.content.all_cities')}</option>
                                                {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('admin.content.target_language_label')}</label>
                                            <select
                                                value={(newBanner.targetRules as any).lang || ''}
                                                onChange={e => setNewBanner({ ...newBanner, targetRules: { ...newBanner.targetRules, lang: e.target.value } })}
                                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                                            >
                                                <option value="">{t('admin.content.all_languages')}</option>
                                                <option value="en">English</option>
                                                <option value="am">Amharic</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <button
                                            onClick={handleAddBanner}
                                            style={{ width: '100%', background: '#FF0000', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                                        >
                                            <Plus size={20} />
                                            {t('admin.content.create_banner_button')}
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
                                                {t('admin.content.priority')} {b.priority}
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
                                                {b.isActive ? t('admin.content.live_status') : t('admin.content.paused_status')}
                                            </button>
                                        </div>

                                        <div style={{ height: '180px', position: 'relative' }}>
                                            <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px', background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.95))' }}>
                                                <h4 style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: '4px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{b.title || t('admin.content.mobile_campaign')}</h4>
                                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{b.subtitle || t('admin.content.general_promotion')}</p>
                                            </div>
                                        </div>

                                        <div style={{ padding: '20px' }}>
                                            {/* Metrics Bar - More Integrated */}
                                            <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: '20px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '24px' }}>
                                                <div style={{ flex: 1, padding: '16px', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                                                    <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.content.impressions')}</p>
                                                    <p style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-main)' }}>{(b.viewCount || 0).toLocaleString()}</p>
                                                </div>
                                                <div style={{ flex: 1, padding: '16px', textAlign: 'center' }}>
                                                    <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.content.click_rate')}</p>
                                                    <p style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--primary)' }}>
                                                        {b.viewCount ? ((b.clickCount || 0) / b.viewCount * 100).toFixed(1) : '0.0'}%
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Deployment Info */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem' }}>
                                                    <MapPin size={16} color="var(--primary-blue)" />
                                                    <span style={{ fontWeight: 700 }}>{(b.targetRules as any)?.city || t('admin.content.global_cities')}</span>
                                                </div>
                                                {(b.startDate || b.endDate) && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem' }}>
                                                        <CalendarIcon size={16} color="#D946EF" />
                                                        <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                                                            {b.startDate ? new Date(b.startDate).toLocaleDateString() : t('admin.content.now')} - {b.endDate ? new Date(b.endDate).toLocaleDateString() : t('admin.content.forever')}
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
                                                    {t('admin.content.edit_details_button')}
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
                                        <h4 style={{ fontWeight: 800, color: 'var(--text-muted)' }}>{t('admin.content.no_banners_active_title')}</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>{t('admin.content.no_banners_active_message')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Banner Modal (New) */}
            <AnimatePresence>
                {
                    editingBanner && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15000 }}>
                            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} style={{ width: '650px', background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 950 }}>{t('admin.content.edit_banner_modal_title')}</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>{t('admin.content.edit_banner_modal_subtitle')}</p>
                                    </div>
                                    <button onClick={() => setEditingBanner(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', padding: '12px', borderRadius: '50%', cursor: 'pointer' }}><X size={20} /></button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('admin.content.image_url_label')}</label>
                                        <input value={editingBanner.imageUrl} onChange={e => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('admin.content.campaign_title_label')}</label>
                                        <input value={editingBanner.title} onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('admin.content.subtitle_label')}</label>
                                        <input value={editingBanner.subtitle} onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('admin.content.cta_text_label')}</label>
                                        <input value={editingBanner.ctaText} onChange={e => setEditingBanner({ ...editingBanner, ctaText: e.target.value })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('admin.content.priority_index_label')}</label>
                                        <input type="number" value={editingBanner.priority} onChange={e => setEditingBanner({ ...editingBanner, priority: parseInt(e.target.value) || 0 })} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('admin.content.target_city_label')}</label>
                                        <select
                                            value={(editingBanner.targetRules as any)?.city || ''}
                                            onChange={e => setEditingBanner({ ...editingBanner, targetRules: { ...(editingBanner.targetRules as any), city: e.target.value } })}
                                            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }}
                                        >
                                            <option value="">{t('admin.content.global_coverage')}</option>
                                            {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('admin.content.target_language_label')}</label>
                                        <select
                                            value={(editingBanner.targetRules as any)?.lang || ''}
                                            onChange={e => setEditingBanner({ ...editingBanner, targetRules: { ...(editingBanner.targetRules as any), lang: e.target.value } })}
                                            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'white', fontWeight: 600 }}
                                        >
                                            <option value="">{t('admin.content.universal_language')}</option>
                                            <option value="en">English</option>
                                            <option value="am">Amharic</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                                    <button onClick={() => setEditingBanner(null)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border)', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>{t('admin.content.discard_changes_button')}</button>
                                    <button onClick={handleUpdateBanner} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 950, cursor: 'pointer', boxShadow: '0 8px 20px rgba(255, 0, 0, 0.3)' }}>{t('admin.content.update_campaign_button')}</button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* Selection Detail Panel */}
            <AnimatePresence>
                {
                    selectedItem && (
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
                                        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin.content.slug_label')}: /{selectedItem.data.slug}</p>
                                    </div>
                                    <button onClick={() => setSelectedItem(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
                                        <X size={20} />
                                    </button>
                                </div>

                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '20px' }}>{t('admin.content.associated_events_title', { count: selectedItem.data.events?.length || 0 })}</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                                    {selectedItem.data.events?.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '16px' }}>
                                            {t('admin.content.no_events_found', { type: selectedItem.type })}
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
                                                            {t('admin.content.by_organizer', { organizer: evt.organizer?.organizationName })}
                                                        </span>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    await AdminService.toggleFeaturedEvent(evt.id, !evt.featured);
                                                                    handleFetchDetail(selectedItem.type, selectedItem.data.id);
                                                                } catch (err) {
                                                                    setModalConfig({
                                                                        isOpen: true,
                                                                        title: t('common.error', 'Error'),
                                                                        message: t('admin.content.failed_to_update'),
                                                                        onConfirm: () => { },
                                                                        type: 'danger'
                                                                    });
                                                                }
                                                            }}
                                                            style={{
                                                                background: evt.featured ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                                color: 'white', border: '1px solid var(--border)',
                                                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer'
                                                            }}
                                                        >
                                                            {evt.featured ? t('admin.content.featured_status') : t('admin.content.feature_button')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {
                isFetchingDetail && (
                    <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: '12px', zIndex: 1100, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
                        <Loader2 size={18} className="animate-spin" />
                        {t('admin.content.fetching_details')}
                    </div>
                )
            }

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
                            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: modalConfig.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
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
        </motion.div >
    );
};
