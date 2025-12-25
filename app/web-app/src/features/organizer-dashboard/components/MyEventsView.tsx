import { motion } from 'framer-motion';
import { Plus, Filter, Calendar, Globe, Pencil, BarChart3 } from 'lucide-react';
import { PageHeader } from './PageHeader';

export const MyEventsView = () => {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <PageHeader
                title="My Events"
                subtitle="Manage and track all your scheduled events."
                actions={
                    <>
                        <button className="btn-blue" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                            <Plus size={18} /> Create New Event
                        </button>
                    </>
                }
            />

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {['All Events', 'Pubished', 'Drafts', 'Past Events'].map((filter, i) => (
                    <button key={i} style={{
                        padding: '8px 16px', borderRadius: '100px', background: i === 0 ? 'var(--bg-active)' : 'rgba(255,255,255,0.05)',
                        border: 'none', color: i === 0 ? 'white' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                    }}>
                        {filter}
                    </button>
                ))}
                <button style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <Filter size={16} /> Filters
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {[
                    { name: 'Summer Music Festival 2024', date: 'Aug 24, 2024', status: 'Live', sales: '85%', venues: 'Millennium Hall', img: 'https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400&q=80' },
                    { name: 'Tech Networking Night', date: 'Sept 02, 2024', status: 'Selling Fast', sales: '42%', venues: 'Skylight Hotel', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80' },
                    { name: 'Gospel Concert Live', date: 'Oct 15, 2024', status: 'Upcoming', sales: '0%', venues: 'Addis Ababa Stadium', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80' },
                    { name: 'Digital Art Expo', date: 'Nov 10, 2024', status: 'Draft', sales: '-', venues: 'Museum of Modern Art', img: 'https://images.unsplash.com/photo-1545235617-946f02a58938?w=400&q=80' },
                ].map((event, i) => (
                    <div key={i} className="stat-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ height: '160px', width: '100%', position: 'relative' }}>
                            <img src={event.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                <span className={`pill ${event.status === 'Live' ? 'pill-green' : 'pill-blue'}`} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>{event.status}</span>
                            </div>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>{event.name}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <Calendar size={14} /> {event.date}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <Globe size={14} /> {event.venues}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Ticket Sales: </span>
                                    <span style={{ color: '#10B981' }}>{event.sales}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Pencil size={16} /></button>
                                    <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><BarChart3 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
