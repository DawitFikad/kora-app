import { motion } from 'framer-motion';
import { Plus, Ticket, Settings } from 'lucide-react';
import { PageHeader } from './PageHeader';

export const TicketsView = () => {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Ticket Management" subtitle="Create and manage ticket tiers, pricing and availability." />

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                <div className="stat-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Active Ticket Tiers</h3>
                        <button className="btn-blue" style={{ padding: '8px 16px', fontSize: '0.85rem' }}><Plus size={16} /> Add Tier</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { name: 'Early Bird', price: '$45.00', sold: '150/150', status: 'Sold Out', color: '#EF4444' },
                            { name: 'General Admission', price: '$65.00', sold: '245/400', status: 'Active', color: '#10B981' },
                            { name: 'VIP Experience', price: '$120.00', sold: '55/100', status: 'Few Left', color: '#FBBF24' },
                        ].map((tier, i) => (
                            <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ticket size={20} color="var(--text-muted)" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 800 }}>{tier.name}</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tier.price}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>{tier.sold}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tickets Sold</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: tier.color, display: 'block', marginBottom: '4px' }}>{tier.status}</span>
                                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><Settings size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Inventory Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Capacity</span>
                                <span style={{ fontWeight: 800 }}>650</span>
                            </div>
                            <div className="progress-bg" style={{ width: '100%', height: '8px' }}>
                                <div className="progress-bar" style={{ width: '69%', background: 'var(--bg-active)' }} />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>450/650 tickets issued across all tiers.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>RESERVED</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900 }}>42</p>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>CHECKED IN</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900 }}>12</p>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <button className="btn-blue" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                                Manage Hold & Allocations
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
