import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, MapPin, Tag, Loader2 } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { ContentService } from '../../../core/api/content.service';

export const ContentManagementView = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newCat, setNewCat] = useState({ name: '', slug: '' });
    const [newCity, setNewCity] = useState({ name: '', slug: '' });

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [cats, cts] = await Promise.all([
                ContentService.getCategories(),
                ContentService.getCities()
            ]);
            setCategories(cats as any);
            setCities(cts as any);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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

    const handleDeleteCat = async (id: number) => {
        if (!confirm('Are you sure? This might affect existing events.')) return;
        try {
            await ContentService.removeCategory(id);
            fetchData();
        } catch (err: any) { alert(err.error || 'Failed to delete'); }
    };

    const handleDeleteCity = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await ContentService.removeCity(id);
            fetchData();
        } catch (err: any) { alert(err.error || 'Failed to delete'); }
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
            <AdminPageHeader title="Content Management" subtitle="Manage platform metadata: Categories and Cities." />

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
                            style={{ flex: 1, background: '#0B0E14', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px' }}
                        />
                        <input
                            placeholder="Slug"
                            value={newCat.slug}
                            onChange={e => setNewCat({ ...newCat, slug: e.target.value.toLowerCase() })}
                            style={{ flex: 1, background: '#0B0E14', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px' }}
                        />
                        <button onClick={handleAddCategory} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800 }}>
                            <Plus size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {categories.map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px' }}>
                                <div>
                                    <p style={{ fontWeight: 700 }}>{c.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c._count?.events || 0} Events</p>
                                </div>
                                <button onClick={() => handleDeleteCat(c.id)} style={{ padding: '8px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
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
                            style={{ flex: 1, background: '#0B0E14', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px' }}
                        />
                        <input
                            placeholder="Slug"
                            value={newCity.slug}
                            onChange={e => setNewCity({ ...newCity, slug: e.target.value.toLowerCase() })}
                            style={{ flex: 1, background: '#0B0E14', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px' }}
                        />
                        <button onClick={handleAddCity} style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800 }}>
                            <Plus size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {cities.map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px' }}>
                                <div>
                                    <p style={{ fontWeight: 700 }}>{c.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c._count?.events || 0} Events</p>
                                </div>
                                <button onClick={() => handleDeleteCity(c.id)} style={{ padding: '8px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
