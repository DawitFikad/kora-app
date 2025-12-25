import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';

export const ContentManagementView = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader title="Content Management" subtitle="Moderate event descriptions, media, and platform-wide banners." />
            <div className="admin-card" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Flagged Media for Review</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <div style={{ height: '120px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={32} color="var(--text-muted)" />
                            </div>
                            <div style={{ padding: '12px' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>Event Background #{i * 102}</p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button style={{ flex: 1, background: '#10B981', color: 'white', border: 'none', padding: '4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>Keep</button>
                                    <button style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', padding: '4px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
