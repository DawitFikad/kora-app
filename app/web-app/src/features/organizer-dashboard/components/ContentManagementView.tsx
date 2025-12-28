import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, MapPin, Tag, Loader2, Grid } from 'lucide-react';
import { ContentService } from '../../../core/api/content.service';
import { useToast } from '../../../core/components/Toast';

export const ContentManagementView = () => {
    const toast = useToast();
    const [categories, setCategories] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newCat, setNewCat] = useState({ name: '', slug: '' });
    const [newCity, setNewCity] = useState({ name: '', slug: '' });

    // Seat Map Management
    const [seatMaps, setSeatMaps] = useState<any[]>([]);
    const [newSeatMap, setNewSeatMap] = useState({ name: '', rows: 10, seatsPerRow: 10 });

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [catRes, cityRes] = await Promise.all([
                ContentService.getCategories(),
                ContentService.getCities()
            ]);
            if (catRes?.data) setCategories(catRes.data);
            if (cityRes?.data) setCities(cityRes.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddCategory = async () => {
        if (!newCat.name || !newCat.slug) {
            toast.warning('Please fill in both name and slug');
            return;
        }
        try {
            await ContentService.addCategory(newCat.name, newCat.slug);
            setNewCat({ name: '', slug: '' });
            toast.success('Category added successfully');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to add category');
        }
    };

    const handleAddCity = async () => {
        if (!newCity.name || !newCity.slug) {
            toast.warning('Please fill in both name and slug');
            return;
        }
        try {
            await ContentService.addCity(newCity.name, newCity.slug);
            setNewCity({ name: '', slug: '' });
            toast.success('City added successfully');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to add city');
        }
    };

    const handleDeleteCat = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This might affect existing events.')) return;
        try {
            await ContentService.removeCategory(id);
            toast.success('Category deleted');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to delete category');
        }
    };

    const handleDeleteCity = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('Are you sure?')) return;
        try {
            await ContentService.removeCity(id);
            toast.success('City deleted');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to delete city');
        }
    };

    const handleAddSeatMap = () => {
        if (!newSeatMap.name || newSeatMap.rows < 1 || newSeatMap.seatsPerRow < 1) {
            toast.warning('Please provide valid seat map details');
            return;
        }
        const map = {
            id: Date.now(),
            ...newSeatMap,
            totalSeats: newSeatMap.rows * newSeatMap.seatsPerRow
        };
        setSeatMaps([...seatMaps, map]);
        setNewSeatMap({ name: '', rows: 10, seatsPerRow: 10 });
        toast.success('Seat map template created');
    };

    const handleDeleteSeatMap = (id: number) => {
        setSeatMaps(seatMaps.filter(m => m.id !== id));
        toast.success('Seat map deleted');
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
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Content Management</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                    Manage event categories, cities, and seat map templates for your organization
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Categories Section */}
                <div className="stat-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <Tag color="#D946EF" size={24} />
                        <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Event Categories</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        <input
                            placeholder="Category Name"
                            value={newCat.name}
                            onChange={e => {
                                const name = e.target.value;
                                setNewCat({
                                    name,
                                    slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                                });
                            }}
                            style={{
                                flex: 1,
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                color: 'var(--text-main)'
                            }}
                        />
                        <input
                            placeholder="slug"
                            value={newCat.slug}
                            onChange={e => setNewCat({ ...newCat, slug: e.target.value.toLowerCase() })}
                            style={{
                                flex: 1,
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                color: 'var(--text-main)'
                            }}
                        />
                        <button
                            onClick={handleAddCategory}
                            className="btn-blue"
                            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                        {categories.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: 'var(--text-muted)',
                                background: 'var(--bg-subtle)',
                                borderRadius: '12px',
                                border: '1px dashed var(--border)'
                            }}>
                                <Tag size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                <p>No categories yet. Add your first one!</p>
                            </div>
                        ) : (
                            categories.map(c => (
                                <div
                                    key={c.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'rgba(217, 70, 239, 0.05)',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(217, 70, 239, 0.2)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            /{c.slug}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteCat(e, c.id)}
                                        style={{
                                            padding: '8px',
                                            color: '#EF4444',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Cities Section */}
                <div className="stat-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <MapPin color="#3B82F6" size={24} />
                        <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Active Cities</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        <input
                            placeholder="City Name"
                            value={newCity.name}
                            onChange={e => {
                                const name = e.target.value;
                                setNewCity({
                                    name,
                                    slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                                });
                            }}
                            style={{
                                flex: 1,
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                color: 'var(--text-main)'
                            }}
                        />
                        <input
                            placeholder="slug"
                            value={newCity.slug}
                            onChange={e => setNewCity({ ...newCity, slug: e.target.value.toLowerCase() })}
                            style={{
                                flex: 1,
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                color: 'var(--text-main)'
                            }}
                        />
                        <button
                            onClick={handleAddCity}
                            style={{
                                background: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                padding: '10px 16px',
                                borderRadius: '10px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                        {cities.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: 'var(--text-muted)',
                                background: 'var(--bg-subtle)',
                                borderRadius: '12px',
                                border: '1px dashed var(--border)'
                            }}>
                                <MapPin size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                <p>No cities yet. Add your first one!</p>
                            </div>
                        ) : (
                            cities.map(c => (
                                <div
                                    key={c.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'rgba(59, 130, 246, 0.05)',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            /{c.slug}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteCity(e, c.id)}
                                        style={{
                                            padding: '8px',
                                            color: '#EF4444',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Seat Map Templates */}
            <div className="stat-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <Grid color="#10B981" size={24} />
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Seat Map Templates</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Create reusable seat map layouts for your venues
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                }}>
                    {seatMaps.map(map => (
                        <div
                            key={map.id}
                            style={{
                                background: 'rgba(16, 185, 129, 0.05)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '12px',
                                padding: '16px',
                                position: 'relative'
                            }}
                        >
                            <button
                                onClick={() => handleDeleteSeatMap(map.id)}
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: 'none',
                                    color: '#EF4444',
                                    padding: '6px',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                            <h4 style={{ fontWeight: 700, marginBottom: '12px' }}>{map.name}</h4>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <p>Rows: {map.rows}</p>
                                <p>Seats/Row: {map.seatsPerRow}</p>
                                <p style={{ marginTop: '8px', color: '#10B981', fontWeight: 700 }}>
                                    Total: {map.totalSeats} seats
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Add New Seat Map Card */}
                    <div
                        style={{
                            background: 'var(--bg-subtle)',
                            border: '2px dashed var(--border)',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}
                    >
                        <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>New Template</h4>
                        <input
                            placeholder="Template Name"
                            value={newSeatMap.name}
                            onChange={e => setNewSeatMap({ ...newSeatMap, name: e.target.value })}
                            style={{
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                color: 'var(--text-main)',
                                fontSize: '0.85rem'
                            }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <input
                                type="number"
                                placeholder="Rows"
                                value={newSeatMap.rows}
                                onChange={e => setNewSeatMap({ ...newSeatMap, rows: parseInt(e.target.value) || 0 })}
                                style={{
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    color: 'var(--text-main)',
                                    fontSize: '0.85rem'
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Seats"
                                value={newSeatMap.seatsPerRow}
                                onChange={e => setNewSeatMap({ ...newSeatMap, seatsPerRow: parseInt(e.target.value) || 0 })}
                                style={{
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    color: 'var(--text-main)',
                                    fontSize: '0.85rem'
                                }}
                            />
                        </div>
                        <button
                            onClick={handleAddSeatMap}
                            style={{
                                background: '#10B981',
                                color: 'white',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <Plus size={16} /> Create
                        </button>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px',
                    padding: '16px'
                }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        💡 <strong>Tip:</strong> Seat map templates are stored locally and can be used when creating events with seat-based ticketing.
                        They help you quickly set up venue layouts without recreating them each time.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
