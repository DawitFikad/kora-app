import React, { useEffect, useState } from 'react';
import { AdminService } from '../../../../core/api/admin.service';
import { downloadBlobAsCSV } from './csvExport';

const formatCurrency = (v: any) => {
    const n = Number(v || 0);
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const GMVDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        AdminService.getGMV({ range })
            .then((res: any) => {
                if (!mounted) return;
                setRows(res?.data || res || []);
            })
            .catch((err: any) => {
                console.error('Failed to fetch GMV', err);
                if (!mounted) return;
                setError('Failed to load GMV from API');
                setRows([]);
            })
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false };
    }, [range]);

    const handleExport = async () => {
        try {
            const blob = await AdminService.exportSettlementLedgerCSV({ type: 'gmv', range });
            downloadBlobAsCSV(blob, `gmv_export_${range}.csv`);
        } catch (e) {
            console.error(e);
        }
    };

    const totalGMV = rows.reduce((s, r) => s + Number(r.gmv || 0), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>GMV Tracking (Preview)</h2>
                    <p className="text-muted" style={{ marginTop: 6 }}>Bank-style financial controls — read-only until payments live</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select value={range} onChange={e => setRange(e.target.value as any)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                    <button className="btn-blue" onClick={handleExport} style={{ padding: '8px 12px' }}>Export CSV</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
                <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL GMV</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: 6 }}>ETB {formatCurrency(totalGMV)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Range</div>
                            <div style={{ fontWeight: 800 }}>{range}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                            <div style={{ padding: 12, background: 'var(--bg-main)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Top City</div>
                                <div style={{ fontWeight: 900, marginTop: 6 }}>{rows[0]?.city || '—'}</div>
                            </div>
                            <div style={{ padding: 12, background: 'var(--bg-main)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Top Organizer</div>
                                <div style={{ fontWeight: 900, marginTop: 6 }}>{rows[0]?.organizer || '—'}</div>
                            </div>
                            <div style={{ padding: 12, background: 'var(--bg-main)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Top Category</div>
                                <div style={{ fontWeight: 900, marginTop: 6 }}>{rows[0]?.category || '—'}</div>
                            </div>
                            <div style={{ padding: 12, background: 'var(--bg-main)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Days</div>
                                <div style={{ fontWeight: 900, marginTop: 6 }}>{rows.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', height: '100%' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>Quick Actions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className="btn-blue" style={{ padding: '10px 12px' }}>Reconcile Selected</button>
                        <button style={{ padding: '10px 12px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }}>View Settlement Ledger</button>
                        <button style={{ padding: '10px 12px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)' }}>Download Report</button>
                    </div>
                </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                {loading ? <div>Loading GMV from API...</div> : error ? <div style={{ color: 'var(--danger)' }}>{error}</div> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                <th style={{ padding: '10px 12px' }}>Date</th>
                                <th style={{ padding: '10px 12px' }}>City</th>
                                <th style={{ padding: '10px 12px' }}>Organizer</th>
                                <th style={{ padding: '10px 12px' }}>Category</th>
                                <th style={{ padding: '10px 12px', textAlign: 'right' }}>GMV (ETB)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No data</td></tr>}
                            {rows.map((r, i) => (
                                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px' }}>{r.date}</td>
                                    <td style={{ padding: '12px' }}>{r.city}</td>
                                    <td style={{ padding: '12px' }}>{r.organizer}</td>
                                    <td style={{ padding: '12px' }}>{r.category}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>ETB {formatCurrency(r.gmv)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default GMVDashboard;
