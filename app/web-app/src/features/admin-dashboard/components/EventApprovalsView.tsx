import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';

export const EventApprovalsView = () => {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AdminPageHeader
                title="Event Approval Queue"
                subtitle="Review and moderate pending event applications (34 items)"
                actions={
                    <button className="btn-blue" style={{ background: '#12171F', color: 'white', border: '1px solid var(--border)' }}>
                        <Filter size={16} /> Advanced Search
                    </button>
                }
            />

            <div style={{ display: 'grid', gap: '16px' }}>
                {[
                    { name: 'Millennium Music Festival', org: 'Abel Tesfaye', location: 'Addis Ababa', price: '$45 - $200', risk: 'Low', status: 'Pending Review' },
                    { name: 'Underground Tech Night', org: 'Neon Nights', location: 'Bole, Addis', price: '$20 - $50', risk: 'Medium', status: 'Suspicious IP' },
                    { name: 'Global Business Summit', org: 'Selam Gebre', location: 'Skylight Hotel', price: '$150 - $500', risk: 'Low', status: 'Ready to Approve' },
                ].map((event, i) => (
                    <div key={i} className="admin-card" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr', alignItems: 'center', gap: '20px' }}>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{event.name}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Organizer: {event.org}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Location</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{event.location}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tiers</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{event.price}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Risk Score</p>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: event.risk === 'Low' ? '#10B981' : '#F59E0B' }}>{event.risk.toUpperCase()}</span>
                        </div>
                        <div>
                            <span className="pill" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', fontWeight: 800 }}>{event.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>Approve</button>
                            <button style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>Reject</button>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
