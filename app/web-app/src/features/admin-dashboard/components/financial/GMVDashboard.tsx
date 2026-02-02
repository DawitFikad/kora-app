import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, Download } from 'lucide-react';
import { AdminService } from '../../../../core/api/admin.service';
import { downloadBlobAsCSV } from './csvExport';
import Pagination from '../../../../core/components/Pagination';

const formatCurrency = (v: any) => {
    const n = Number(v || 0);
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const GMVDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

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
                setError('Failed to load GMV from platform node');
                setRows([]);
            })
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false };
    }, [range]);

    useEffect(() => {
        setCurrentPage(1);
    }, [range]);

    const handleExport = async () => {
        try {
            const res: any = await AdminService.exportSettlementLedgerCSV({ type: 'gmv', range });
            downloadBlobAsCSV(res.data || res, `gmv_report_${range}.csv`);
        } catch (e) {
            console.error(e);
        }
    };

    const totalGMV = rows.reduce((s, r) => s + Number(r.gmv || 0), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* 📊 Top Level Strategy Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp color="#10B981" size={20} />
                        </div>
                        <div style={{ padding: '4px 12px', borderRadius: '100px', background: 'rgba(16, 185, 129, 0.1)', fontSize: '0.7rem', color: '#10B981', fontWeight: 900 }}>+12.5%</div>
                    </div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Total Period GMV</p>
                    <p style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>ETB {formatCurrency(totalGMV)}</p>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin color="#3B82F6" size={20} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Top Region</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Leading Performance</p>
                    <p style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Addis Ababa</p>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Range</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>{range.toUpperCase()}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Data Nodes</p>
                            <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>{rows.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🛠️ Action & Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '16px 24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-sidebar)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    {(['7d', '30d', '90d'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: range === r ? 'var(--bg-active)' : 'transparent',
                                color: range === r ? 'white' : 'var(--text-muted)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleExport} style={{ padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        <Download size={16} />
                        Export Ledger
                    </button>
                    <button style={{ padding: '10px 20px', borderRadius: '12px', background: 'var(--primary)', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(29, 144, 245, 0.2)' }}>
                        Reconcile Batch
                    </button>
                </div>
            </div>

            {/* 📋 Data Table Area */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                {loading ? (
                    <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>SYNCING WITH FINANCIAL NODES...</div>
                ) : error ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444', fontWeight: 700 }}>{error}</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                                <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', width: '50px' }}>#</th>
                                <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Settlement Date</th>
                                <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Regional Node</th>
                                <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Organizer Entity</th>
                                <th style={{ padding: '24px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Asset Category</th>
                                <th style={{ padding: '24px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Valuation (ETB)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>Zero liquidity density detected for this range.</td></tr>
                            ) : rows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((r, i) => (
                                <motion.tr
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{ borderTop: '1px solid var(--border)', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>{(currentPage - 1) * pageSize + i + 1}</td>
                                    <td style={{ padding: '20px 24px', fontSize: '0.9rem', fontWeight: 700 }}>{r.date}</td>
                                    <td style={{ padding: '20px 24px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
                                            {r.city}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 800 }}>{r.organizer}</td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{r.category?.toUpperCase()}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: 950, fontSize: '1rem', color: '#10B981' }}>{formatCurrency(r.gmv)}</td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Pagination
                currentPage={currentPage}
                totalItems={rows.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default GMVDashboard;
