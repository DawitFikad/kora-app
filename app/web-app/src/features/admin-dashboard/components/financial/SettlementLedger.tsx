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
            const blob = await AdminService.exportSettlementLedgerCSV({ format: 'csv' });
            downloadBlobAsCSV(blob, 'settlement_ledger.csv');
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Settlement Ledger <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>{PAYMENTS_LIVE ? '(live API)' : '(audit-safe)'}</span></h2>
                    <p className="text-muted" style={{ margin: 0 }}>Immutable rows; corrections appear as compensating transactions.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>Append-only</div>
                    <input placeholder="Search ref, type, notes" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }} />
                    <button className="btn-blue" onClick={handleExport} style={{ padding: '8px 12px' }}>Export CSV</button>
                </div>
            </div>
            <div style={{ margin: '8px 0' }}>
                <button className="btn-blue" onClick={handleExport}>Export CSV</button>
            </div>
            {loading ? <div>Loading ledger from API...</div> : error ? <div style={{ color: 'var(--danger)' }}>{error}</div> : (
                <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                <th className="py-2">Ref ID</th>
                                <th className="py-2" style={{ width: '28%' }}>Timestamp</th>
                                <th className="py-2" style={{ width: '18%' }}>Type</th>
                                <th className="py-2 text-right" style={{ width: '12%' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No ledger rows</td></tr>}
                            {visible.map((r, i) => (
                                <tr key={r.refId} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)' }}>
                                    <td className="py-2 text-sm text-muted">{r.refId}</td>
                                    <td className="py-2 text-sm text-muted">{formatDate(r.timestamp as unknown as string)}</td>
                                    <td className="py-2 text-sm">
                                        <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 9999, border: '1px solid var(--border)', background: 'transparent', fontWeight: 700, fontSize: '0.75rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>{String(r.type).replace(/_/g, ' ')}</span>
                                    </td>
                                    <td className="py-2 text-sm text-right">{Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                        <div style={{ color: 'var(--text-muted)' }}>Showing {Math.min(filtered.length, page * pageSize + 1)} - {Math.min(filtered.length, (page + 1) * pageSize)} of {filtered.length}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent' }}>Prev</button>
                            <div style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent' }}>Page {page + 1}/{totalPages}</div>
                            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent' }}>Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettlementLedger;
