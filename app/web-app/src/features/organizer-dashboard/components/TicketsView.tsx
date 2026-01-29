import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Ticket, Settings, Loader2 } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';

export const TicketsView = ({ searchQuery = '' }: { searchQuery?: string }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await OrganizerService.getTicketStats();
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch ticket stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    const inventoryPercent = stats?.totalCapacity > 0
        ? (stats.totalSold / stats.totalCapacity) * 100
        : 0;

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredTiers = (stats?.tiers || []).filter((tier: any) => {
        if (!normalizedQuery) return true;
        const name = (tier.name || '').toLowerCase();
        const eventName = (tier.eventName || '').toLowerCase();
        return name.includes(normalizedQuery) || eventName.includes(normalizedQuery);
    });

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
                        {filteredTiers.map((tier: any, i: number) => {
                            const colors: Record<string, string> = {
                                'Sold Out': '#EF4444',
                                'Active': '#10B981',
                                'Few Left': '#FBBF24'
                            };

                            return (
                                <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Ticket size={20} color="var(--text-muted)" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 800 }}>{tier.name}</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tier.eventName}</p>
                                            <p style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>ETB {tier.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>{tier.sold} / {tier.capacity}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tickets Sold</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: colors[tier.status] || '#1D90F5', display: 'block', marginBottom: '4px' }}>{tier.status}</span>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><Settings size={16} /></button>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredTiers.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No ticket tiers found.
                            </div>
                        )}
                    </div>
                </div>

                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Inventory Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Capacity</span>
                                <span style={{ fontWeight: 800 }}>{stats?.totalCapacity}</span>
                            </div>
                            <div className="progress-bg" style={{ width: '100%', height: '8px' }}>
                                <div className="progress-bar" style={{ width: `${inventoryPercent}%`, background: 'var(--bg-active)' }} />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>{stats?.totalSold}/{stats?.totalCapacity} tickets issued across all tiers.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>RESERVED</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900 }}>{stats?.reserved}</p>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>CHECKED IN</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900 }}>{stats?.checkedIn}</p>
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
