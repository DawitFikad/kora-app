import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, ChevronLeft, ChevronRight, Hash, Calendar, ArrowUpRight, ShieldCheck, MoreVertical } from 'lucide-react';
import { AdminService } from '../../../../core/api/admin.service';
import { downloadBlobAsCSV } from './csvExport';

export const SettlementLedger: React.FC = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('');
    const [page, setPage] = useState<number>(0);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const pageSize = 12;

    useEffect(() => {
        let mounted = true;
        setError(null);

        AdminService.getSettlementLedger({ limit: 100 })
            .then((res: any) => { if (mounted) setRows(res?.data || res || []); })
            .catch((err: any) => { console.error('Ledger fetch failed', err); if (mounted) setError('Failed to decrypt ledger rows'); setRows([]); })
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false };
    }, []);

    const handleExport = async () => {
        try {
            const res: any = await AdminService.exportSettlementLedgerCSV({ format: 'csv' });
            downloadBlobAsCSV(res.data || res, 'settlement_ledger.csv');
        } catch (e) {
            console.error(e);
        }
    };

    const formatDate = (v: any) => {
        if (!v) return '—';
        try {
            const d = new Date(v);
            return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return String(v);
        }
    };

    const filtered = rows.filter(r => {
        if (!filter) return true;
        const q = filter.toLowerCase();
        return String(r.refId).toLowerCase().includes(q) || String(r.type || '').toLowerCase().includes(q) || String(r.notes || '').toLowerCase().includes(q);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const visible = filtered.slice(page * pageSize, page * pageSize + pageSize);
    const latestTimestamp = rows[0]?.timestamp ? formatDate(rows[0].timestamp) : 'No entries yet';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* 🛡️ Ledger Status & Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px 20px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldCheck size={18} color="#10B981" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ledger Feed Live ({rows.length})</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                        <input
                            placeholder="Search Reference IDs..."
                            value={filter}
                            onChange={e => { setFilter(e.target.value); setPage(0); }}
                            style={{ padding: '12px 16px 12px 44px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', fontSize: '0.9rem', width: '300px' }}
                        />
                    </div>
                    <button onClick={handleExport} style={{ padding: '12px 20px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Download size={18} />
                        Export Audit
                    </button>
                </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                Last ledger entry: {latestTimestamp}
            </div>

            {/* 📋 Ledger Table */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                {loading ? (
                    <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>DECRYPTING LEDGER BLOCKS...</div>
                ) : error ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#EF4444', fontWeight: 700 }}>{error}</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                                <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reference</th>
                                <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Timestamp</th>
                                <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Protocol Type</th>
                                <th style={{ padding: '24px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Valuation (ETB)</th>
                                <th style={{ padding: '24px', textAlign: 'center', width: '80px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>Empty state: No ledger entries match query.</td></tr>
                            ) : visible.map((r, i) => (
                                <motion.tr
                                    key={r.refId}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    style={{ borderTop: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }}
                                    onClick={() => setSelectedEntry(r)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Hash size={14} color="var(--text-muted)" />
                                            </div>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>#{r.refId}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={14} color="var(--text-muted)" />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{formatDate(r.timestamp)}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            background: r.amount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: r.amount > 0 ? '#10B981' : '#EF4444',
                                            fontSize: '0.65rem',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            border: `1px solid ${r.amount > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                        }}>
                                            {String(r.type).replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: 950, fontSize: '1.05rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                                        {r.amount > 0 ? '+' : ''}{Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                        <ArrowUpRight size={16} color="var(--text-muted)" />
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* 🔢 Pagination */}
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        ENTRY NODE <strong>{page * pageSize + 1}</strong> TO <strong>{Math.min(filtered.length, (page + 1) * pageSize)}</strong> <span style={{ opacity: 0.5 }}>/ TOTAL {filtered.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.75rem', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <ChevronLeft size={16} /> PREV
                        </button>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                            style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.75rem', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            NEXT <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 🔍 Entry Detail Modal (Overlay) */}
            <AnimatePresence>
                {selectedEntry && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedEntry(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)', padding: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Reference Detail</p>
                                    <h2 style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem' }}>#{selectedEntry.refId}</h2>
                                </div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setSelectedEntry(null)}>
                                    <MoreVertical size={18} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Transaction Metadata</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Protocol Type</span>
                                            <span style={{ fontWeight: 800, color: 'white', fontSize: '0.85rem' }}>{selectedEntry.type}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Final Valuation</span>
                                            <span style={{ fontWeight: 950, color: '#10B981', fontSize: '0.85rem' }}>ETB {Number(selectedEntry.amount).toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Timestamp</span>
                                            <span style={{ fontWeight: 800, color: 'white', fontSize: '0.85rem' }}>{new Date(selectedEntry.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '20px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#3B82F6', textTransform: 'uppercase', marginBottom: '8px' }}>System Note</p>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{selectedEntry.notes || 'No extended annotation available for this ledger entry.'}</p>
                                </div>
                            </div>

                            <button onClick={() => setSelectedEntry(null)} style={{ marginTop: '32px', width: '100%', padding: '16px', borderRadius: '16px', background: 'white', color: 'black', border: 'none', fontWeight: 950, fontSize: '0.9rem', cursor: 'pointer' }}>
                                Close Reference
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettlementLedger;
