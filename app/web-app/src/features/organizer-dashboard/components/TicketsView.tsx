import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Loader2 } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';

export const TicketsView = ({ searchQuery = '' }: { searchQuery?: string }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [capacityEdits, setCapacityEdits] = useState<Record<number, string>>({});
    const [savingTierId, setSavingTierId] = useState<number | null>(null);
    const [capacityErrors, setCapacityErrors] = useState<Record<number, string>>({});
    const [editingTierId, setEditingTierId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 6;

    const fetchStats = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const response = await OrganizerService.getTicketStats();
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch ticket stats", error);
        } finally {
            if (showLoader) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats(true);

        const intervalId = setInterval(() => fetchStats(false), 15000);
        const refreshOnActive = () => {
            if (document.visibilityState === 'visible') {
                fetchStats(false);
            }
        };

        window.addEventListener('focus', refreshOnActive);
        document.addEventListener('visibilitychange', refreshOnActive);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', refreshOnActive);
            document.removeEventListener('visibilitychange', refreshOnActive);
        };
    }, [fetchStats]);

    const inventoryPercent = stats?.totalCapacity > 0
        ? (stats.totalSold / stats.totalCapacity) * 100
        : 0;

    const ticketTypeTotals = useMemo(() => {
        const tiers = stats?.tiers || [];
        const totals: Record<string, { capacity: number; sold: number }> = {};
        tiers.forEach((tier: any) => {
            const name = tier.name || 'General';
            if (!totals[name]) totals[name] = { capacity: 0, sold: 0 };
            totals[name].capacity += Number(tier.capacity || 0);
            totals[name].sold += Number(tier.sold || 0);
        });
        return Object.entries(totals)
            .map(([name, value]) => ({ name, ...value }))
            .sort((a, b) => b.capacity - a.capacity);
    }, [stats]);

    const ticketSalesBuckets = useMemo(() => {
        const tiers = stats?.tiers || [];
        let mostSold = 0;
        let medium = 0;
        let notStarted = 0;

        tiers.forEach((tier: any) => {
            const capacity = Number(tier.capacity || 0);
            const sold = Number(tier.sold || 0);
            const ratio = capacity > 0 ? sold / capacity : 0;

            if (sold <= 0) {
                notStarted += 1;
            } else if (ratio >= 0.8) {
                mostSold += 1;
            } else {
                medium += 1;
            }
        });

        return { mostSold, medium, notStarted };
    }, [stats]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredTiers = (stats?.tiers || []).filter((tier: any) => {
        if (!normalizedQuery) return true;
        const name = (tier.name || '').toLowerCase();
        const eventName = (tier.eventName || '').toLowerCase();
        return name.includes(normalizedQuery) || eventName.includes(normalizedQuery);
    });

    const totalPages = Math.max(1, Math.ceil(filteredTiers.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pagedTiers = filteredTiers.slice((safePage - 1) * pageSize, safePage * pageSize);

    const getTierStatus = (sold: number, capacity: number) => {
        if (sold >= capacity) return 'Sold Out';
        if (sold > capacity * 0.8) return 'Few Left';
        return 'Active';
    };

    const handleCapacitySave = async (tier: any) => {
        const tierId = Number(tier.tierId ?? tier.id);
        if (!tierId) return;
        const rawValue = capacityEdits[tierId] ?? String(tier.capacity ?? '');
        const nextCapacity = Number(rawValue);

        if (!Number.isFinite(nextCapacity) || nextCapacity <= 0) {
            setCapacityErrors(prev => ({ ...prev, [tierId]: 'Enter a valid capacity.' }));
            return;
        }

        if (nextCapacity < Number(tier.sold || 0)) {
            setCapacityErrors(prev => ({ ...prev, [tierId]: `Capacity cannot be less than sold (${tier.sold}).` }));
            return;
        }

        setSavingTierId(tierId);
        setCapacityErrors(prev => ({ ...prev, [tierId]: '' }));
        try {
            await OrganizerService.updateTicketTier(tierId, { capacity: Math.floor(nextCapacity) });
            setStats((prev: any) => {
                if (!prev) return prev;
                const updatedTiers = (prev.tiers || []).map((t: any) => {
                    const id = Number(t.tierId ?? t.id);
                    if (id !== tierId) return t;
                    const newCapacity = Math.floor(nextCapacity);
                    return {
                        ...t,
                        capacity: newCapacity,
                        status: getTierStatus(Number(t.sold || 0), newCapacity)
                    };
                });
                const totalCapacity = updatedTiers.reduce((sum: number, t: any) => sum + Number(t.capacity || 0), 0);
                return { ...prev, tiers: updatedTiers, totalCapacity };
            });
        } catch (error) {
            setCapacityErrors(prev => ({ ...prev, [tierId]: 'Failed to update capacity.' }));
        } finally {
            setSavingTierId(null);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Ticket Management" subtitle="Create and manage ticket tiers, pricing and availability." />

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                <div className="stat-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Active Ticket Tiers</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {pagedTiers.map((tier: any, i: number) => {
                            const colors: Record<string, string> = {
                                'Sold Out': '#EF4444',
                                'Active': '#10B981',
                                'Few Left': '#FBBF24'
                            };

                            const tierId = Number(tier.tierId ?? tier.id);
                            const editedCapacity = capacityEdits[tierId] ?? String(tier.capacity ?? '');

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
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: colors[tier.status] || '#FF0000', display: 'block', marginBottom: '8px' }}>{tier.status}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                            <input
                                                type="number"
                                                min={tier.sold}
                                                value={editedCapacity}
                                                disabled={editingTierId !== tierId}
                                                onChange={e => setCapacityEdits(prev => ({ ...prev, [tierId]: e.target.value }))}
                                                style={{ width: '90px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '6px 8px', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.8rem', opacity: editingTierId === tierId ? 1 : 0.6 }}
                                            />
                                            {editingTierId === tierId ? (
                                                <>
                                                    <button
                                                        onClick={() => handleCapacitySave(tier)}
                                                        disabled={savingTierId === tierId}
                                                        style={{ background: 'var(--bg-active)', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', opacity: savingTierId === tierId ? 0.6 : 1 }}
                                                    >
                                                        {savingTierId === tierId ? 'Saving...' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingTierId(null);
                                                            setCapacityEdits(prev => ({ ...prev, [tierId]: String(tier.capacity ?? '') }));
                                                            setCapacityErrors(prev => ({ ...prev, [tierId]: '' }));
                                                        }}
                                                        style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingTierId(tierId)}
                                                    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                        {capacityErrors[tierId] && (
                                            <p style={{ marginTop: '6px', fontSize: '0.7rem', color: '#EF4444', fontWeight: 600 }}>{capacityErrors[tierId]}</p>
                                        )}
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

                    {filteredTiers.length > pageSize && (
                        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={safePage === 1}
                                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', opacity: safePage === 1 ? 0.5 : 1 }}
                            >
                                Previous
                            </button>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                Page {safePage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', opacity: safePage === totalPages ? 0.5 : 1 }}
                            >
                                Next
                            </button>
                        </div>
                    )}
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

                        {ticketTypeTotals.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.08em' }}>TICKET TYPES</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {ticketTypeTotals.map((type) => (
                                        <div key={type.name} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '6px' }}>{type.name}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{type.capacity} total</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.08em' }}>SALES STATUS</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(16, 185, 129, 0.08)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>MOST SOLD</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10B981' }}>{ticketSalesBuckets.mostSold}</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(251, 191, 36, 0.08)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>MEDIUM</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FBBF24' }}>{ticketSalesBuckets.medium}</p>
                                </div>
                                <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(239, 68, 68, 0.08)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>NOT STARTED</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#EF4444' }}>{ticketSalesBuckets.notStarted}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </motion.div>
    );
};
