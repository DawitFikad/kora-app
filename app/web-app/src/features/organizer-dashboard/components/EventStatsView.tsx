import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Ticket,
    DollarSign,
    Activity,
    Clock,
    MapPin,
    AlertCircle,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { OrganizerService } from '../../../core/api/organizer.service';

interface EventStatsViewProps {
    eventId: number;
    onBack: () => void;
}

export const EventStatsView = ({ eventId, onBack }: EventStatsViewProps) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await OrganizerService.getEventStats(eventId);
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch event stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [eventId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
                <h3>Failed to load event data.</h3>
                <button onClick={onBack} className="btn-blue" style={{ marginTop: '24px', width: 'auto' }}>Go Back</button>
            </div>
        );
    }

    const { event, sales, liveOperations, financial } = data;
    const soldPercent = sales.totalCapacity > 0 ? (sales.totalTicketsSold / sales.totalCapacity) * 100 : 0;
    const isLive = new Date(event.dateTime).getTime() < Date.now() + (3 * 3600 * 1000) &&
        new Date(event.dateTime).getTime() > Date.now() - (6 * 3600 * 1000);

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                <button
                    onClick={onBack}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{event.title}</h2>
                        {isLive && (
                            <span style={{
                                padding: '4px 12px', background: 'rgba(239, 68, 68, 0.1)',
                                color: '#EF4444', borderRadius: '100px', fontSize: '0.75rem',
                                fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                <span style={{ width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', boxShadow: '0 0 10px #EF4444' }} />
                                LIVE OPERATIONS
                            </span>
                        )}
                    </div>
                    <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {new Date(event.dateTime).toLocaleString()}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {event.venue}</span>
                    </p>
                </div>
            </div>

            {/* Top Grid: Key Metrics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>GROSS VOLUME</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>ETB {financial.grossVolume.toLocaleString()}</h3>
                    <p style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 800 }}>Net: ETB {financial.netRevenue.toLocaleString()}</p>
                    <DollarSign size={20} color="#1D90F5" style={{ position: 'absolute', top: 24, right: 24 }} />
                </div>
                <div className="stat-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>TICKETS SOLD</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>{sales.totalTicketsSold} / {sales.totalCapacity}</h3>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${soldPercent}%`, height: '100%', background: 'var(--bg-active)' }} />
                    </div>
                    <Ticket size={20} color="#FBBF24" style={{ position: 'absolute', top: 24, right: 24 }} />
                </div>
                <div className="stat-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>CHECKED IN</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>{liveOperations.totalEntered}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>Entry Rate: {liveOperations.entryRate.toFixed(1)}/min</p>
                    <Activity size={20} color="#10B981" style={{ position: 'absolute', top: 24, right: 24 }} />
                </div>
                <div className="stat-card">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px' }}>PAYOUT STATUS</p>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>{financial.payoutStatus}</h3>
                    <span className={`pill ${financial.payoutStatus === 'PAID' ? 'pill-green' : 'pill-blue'}`}>
                        {financial.payoutStatus === 'RELEASED' ? 'Funds Secure' : financial.payoutStatus}
                    </span>
                    <CheckCircle2 size={20} color="#A78BFA" style={{ position: 'absolute', top: 24, right: 24 }} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }}>
                {/* Tier Performance */}
                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Tier Performance Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {sales.tierPerformance.map((tier: any) => (
                            <div key={tier.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div>
                                        <span style={{ fontWeight: 800, fontSize: '1rem' }}>{tier.name}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '12px' }}>{tier.sold} sold</span>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tier.occupancy.toFixed(0)}%</span>
                                </div>
                                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${tier.occupancy}%` }}
                                        style={{ height: '100%', background: tier.occupancy > 90 ? '#10B981' : 'var(--bg-active)' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gate Performance */}
                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Live Entry Flow</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                                <span style={{ fontWeight: 700 }}>Active Scanning Stations</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {Object.entries(liveOperations.gatePerformance).map(([gate, count]: any) => (
                                    <div key={gate}>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{gate.toUpperCase()}</p>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 900 }}>{count} scans</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(29, 144, 245, 0.05)', borderRadius: '16px' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', fontWeight: 800, marginBottom: '4px' }}>PEAK ENTRY TIME</p>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 900 }}>6:45 PM — 7:15 PM</h4>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </motion.div>
    );
};
