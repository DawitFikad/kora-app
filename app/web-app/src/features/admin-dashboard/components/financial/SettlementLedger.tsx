import React, { useEffect, useState } from 'react';
import { AdminService } from '../../../../core/api/admin.service';
import { downloadBlobAsCSV } from './csvExport';
import ReadOnlyBanner from './ReadOnlyBanner';
import { PAYMENTS_LIVE } from './financialConfig';

export const SettlementLedger: React.FC = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('');
    const [page, setPage] = useState<number>(0);
    const pageSize = 12;

    useEffect(() => {
        let mounted = true;
        setError(null);
        AdminService.getSettlementLedger({ limit: 100 })
            .then((res: any) => { if (mounted) setRows(res?.data || res || []); })
            .catch((err: any) => { console.error('Ledger fetch failed', err); if (mounted) setError('Failed to load ledger'); setRows([]); })
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false };
    }, []);

    const handleExport = async () => {
        try {
            const res: any = await AdminService.exportSettlementLedgerCSV({ format: 'csv' });
            // res.data should be the Blob if responseType was 'blob'
            downloadBlobAsCSV(res.data || res, 'settlement_ledger.csv');
        } catch (e) {
            console.error(e);
        }
    };

    // copyRef removed: UI no longer exposes a Copy action for immutable ledger rows

    const formatDate = (v: any) => {
        if (!v) return '';
        try {
            const d = new Date(v);
            return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return String(v);
        }
    };

    // notes removed from UI; CSV still includes notes column server-side

    const filtered = rows.filter(r => {
        if (!filter) return true;
        const q = filter.toLowerCase();
        return String(r.refId).toLowerCase().includes(q) || String(r.type || '').toLowerCase().includes(q) || String(r.notes || '').toLowerCase().includes(q);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const visible = filtered.slice(page * pageSize, page * pageSize + pageSize);

    return (
        <div>
            <ReadOnlyBanner message={PAYMENTS_LIVE ? 'Settlement ledger is live from API.' : 'Settlement ledger is audit-safe until payments are live.'} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>System Ledger <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>{PAYMENTS_LIVE ? '(PROD)' : '(AUDIT-ONLY)'}</span></h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Immutable append-only record of all financial movements.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                        placeholder="Search Ref ID..."
                        value={filter}
                        onChange={e => { setFilter(e.target.value); setPage(0); }}
                        style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', width: '240px', fontSize: '0.85rem' }}
                    />
                    <button
                        className="btn-blue"
                        onClick={handleExport}
                        style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Decrypting ledger rows...</div>
            ) : error ? (
                <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontWeight: 700 }}>{error}</div>
            ) : (
                <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '200px' }}>REFERENCE</th>
                                <th>EVENT TIMESTAMP</th>
                                <th>TRANSACTION TYPE</th>
                                <th style={{ textAlign: 'right' }}>VALUATION (ETB)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        No transactions found in this period.
                                    </td>
                                </tr>
                            )}
                            {visible.map((r, i) => (
                                <tr key={r.refId}>
                                    <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--bg-active)' }}>
                                        #{r.refId}
                                    </td>
                                    <td>
                                        <p style={{ fontWeight: 700, margin: 0 }}>{formatDate(r.timestamp)}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>PLATFORM_SETTLEMENT</p>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            background: r.amount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: r.amount > 0 ? '#10B981' : '#EF4444',
                                            fontWeight: 900,
                                            fontSize: '0.65rem',
                                            letterSpacing: '0.05em'
                                        }}>
                                            {String(r.type).replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', fontFamily: 'var(--font-mono, monospace)' }}>
                                        {Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Displaying <strong>{page * pageSize + 1}-{Math.min(filtered.length, (page + 1) * pageSize)}</strong> of {filtered.length} entries
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}
                            >
                                PREVIOUS
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettlementLedger;
