import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, DollarSign, Wallet, ArrowUpRight, ChevronLeft, ChevronRight, Hash, Eye, Calendar, User, Ticket } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';

import { exportToCSV } from '../../../core/utils/export';

export const CommissionsView = () => {
    const { t } = useTranslation();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [fees, setFees] = useState<any[]>([]);
    const [overrides, setOverrides] = useState<any[]>([]);
    const [organizerFilter, setOrganizerFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [selectedTx, setSelectedTx] = useState<any>(null);

    const handleExport = () => {
        const exportData = transactions.map(tx => ({
            id: tx.id,
            event: tx.event?.title || 'N/A',
            organizer: tx.event?.organizer?.organizationName || 'N/A',
            type: tx.type,
            amount: tx.amount,
            fee: tx.feeAmount,
            net: tx.netAmount,
            status: tx.status,
            date: new Date(tx.createdAt).toLocaleString()
        }));
        exportToCSV(exportData, `commission_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [txResponse, metricsResponse, feesResponse]: any = await Promise.all([
                AdminService.getFinancialTransactions(),
                AdminService.getFinancialMetrics(),
                AdminService.getPlatformFees()
            ]);
            setTransactions(txResponse.data || []);
            setMetrics(metricsResponse.data || null);
            setFees(feesResponse.data || []);
            setOverrides(feesResponse.overrides || []);
        } catch (err) {
            console.error('Failed to fetch commission data', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateFee = async (feeId: number, data: any) => {
        try {
            setIsSaving(true);
            await AdminService.updatePlatformFee({ id: feeId, ...data });
            await fetchData();
        } catch (err) {
            console.error('Failed to update fee', err);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading || !metrics) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    const organizerOptions = Array.from(
        new Map(
            transactions
                .filter((tx) => tx.event?.organizer?.id)
                .map((tx) => [tx.event.organizer.id, tx.event.organizer])
        ).values()
    ).sort((a: any, b: any) => (a.organizationName || '').localeCompare(b.organizationName || ''));

    const filteredTransactions = organizerFilter === 'all'
        ? transactions
        : transactions.filter((tx) => String(tx.event?.organizer?.id) === organizerFilter);

    // Pagination logic
    const totalPages = Math.ceil(filteredTransactions.length / pageSize);
    const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader title={t('admin.commissions.title')} subtitle={t('admin.commissions.subtitle')} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{t('admin.platform_commission')}</p>
                        <DollarSign size={18} color="#10B981" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>ETB {metrics.platformCommission.toLocaleString()}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>{t('admin.commissions.revenue_earned')}</p>
                </div>
                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{t('admin.pending_payouts')}</p>
                        <Wallet size={18} color="#F59E0B" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>ETB {metrics.pendingPayouts.amount.toLocaleString()}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 700 }}>{metrics.pendingPayouts.count} {t('admin.commissions.batches_ready')}</p>
                </div>
                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{t('admin.commissions.monthly_gmv')}</p>
                        <ArrowUpRight size={18} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>ETB {metrics.monthlyGMV.toLocaleString()}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('admin.commissions.gross_volume_month')}</p>
                </div>
            </div>

            {/* Global Fee Configuration */}
            <div className="admin-card" style={{ padding: '32px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                        <Hash size={20} color="#3B82F6" />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{t('admin.commissions.fee_config')}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    {fees.filter(f => f.isDefault).map(fee => (
                        <div key={fee.id} style={{ padding: '24px', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 12px', background: '#3B82F6', color: 'white', fontSize: '0.65rem', fontWeight: 900, borderRadius: '0 0 0 10px' }}>{t('admin.commissions.default_config')}</div>
                            <div style={{ marginBottom: '16px' }}>
                                <span style={{ fontWeight: 950, color: 'var(--text-main)', fontSize: '1.1rem' }}>{fee.name}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 800 }}>{t('admin.commissions.rate')}</label>
                                    <input
                                        type="number"
                                        defaultValue={fee.feePercentage}
                                        onChange={(e) => fee.newPercentage = Number(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: 900 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 800 }}>{t('admin.commissions.fixed')}</label>
                                    <input
                                        type="number"
                                        defaultValue={fee.feeFixed}
                                        onChange={(e) => fee.newFixed = Number(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: 900 }}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => handleUpdateFee(fee.id, {
                                    name: fee.name,
                                    feePercentage: fee.newPercentage !== undefined ? fee.newPercentage : fee.feePercentage,
                                    feeFixed: fee.newFixed !== undefined ? fee.newFixed : fee.feeFixed,
                                    isDefault: true
                                })}
                                disabled={isSaving}
                                className="btn-blue"
                                style={{ marginTop: '20px', width: '100%', borderRadius: '12px', height: '45px', fontWeight: 900 }}
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : t('admin.commissions.apply_update')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Audit Table */}
            <div className="admin-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 900 }}>{t('admin.commissions.audit_ledger')}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('admin.commissions.audit_desc')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select
                            value={organizerFilter}
                            onChange={(e) => { setOrganizerFilter(e.target.value); setCurrentPage(1); }}
                            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '12px', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.9rem' }}
                        >
                            <option value="all">{t('admin.commissions.all_organizers')}</option>
                            {organizerOptions.map((org: any) => (
                                <option key={org.id} value={String(org.id)}>
                                    {org.organizationName}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleExport}
                            style={{ background: 'var(--bg-black)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '12px', color: 'white', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <Download size={18} /> {t('admin.commissions.export_csv')}
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>#</th>
                                <th>{t('admin.commissions.tx_id')}</th>
                                <th>{t('admin.commissions.tx_detail')}</th>
                                <th>{t('admin.commissions.gross')}</th>
                                <th style={{ color: '#F59E0B' }}>{t('admin.commissions.platform_fee')}</th>
                                <th style={{ color: '#1D90F5' }}>{t('admin.commissions.net_payout')}</th>
                                <th>{t('admin.commissions.status')}</th>
                                <th>{t('admin.commissions.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>{t('admin.commissions.no_records')}</td></tr>
                            ) : (
                                paginatedTransactions.map((tx, idx) => (
                                    <tr key={tx.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTx(tx)}>
                                        <td style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)' }}>
                                            {(currentPage - 1) * pageSize + idx + 1}
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)', fontSize: '0.8rem' }}>
                                            TX-{tx.id.toString().padStart(6, '0')}
                                        </td>
                                        <td>
                                            <p style={{ fontWeight: 950, fontSize: '0.9rem', marginBottom: '4px' }}>{tx.event?.title || t('admin.platform.platform_sovereignty')}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{tx.event?.organizer?.organizationName || t('admin.platform.global_broadcast')}</p>
                                        </td>
                                        <td style={{ fontWeight: 900, fontSize: '0.9rem' }}>ETB {Number(tx.amount).toLocaleString()}</td>
                                        <td style={{ color: '#F59E0B', fontWeight: 950, fontSize: '0.9rem' }}>{tx.feeAmount > 0 ? `ETB ${Number(tx.feeAmount).toLocaleString()}` : '—'}</td>
                                        <td style={{ color: '#1D90F5', fontWeight: 950, fontSize: '0.9rem' }}>ETB {Number(tx.netAmount).toLocaleString()}</td>
                                        <td>
                                            <span className="pill" style={{
                                                background: tx.status === 'SETTLED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: tx.status === 'SETTLED' ? '#10B981' : '#F59E0B',
                                                fontWeight: 900
                                            }}>
                                                {tx.status === 'SETTLED' ? t('admin.all_settled') : t('admin.awaiting_settlement')}
                                            </span>
                                        </td>
                                        <td>
                                            <button style={{ background: 'var(--bg-subtle)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                                                <Eye size={14} color="var(--text-muted)" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '0 10px' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {t('admin.commissions.showing')} <b>{(currentPage - 1) * pageSize + 1}</b> {t('admin.commissions.to')} <b>{Math.min(currentPage * pageSize, filteredTransactions.length)}</b> {t('admin.commissions.of')} <b>{filteredTransactions.length}</b> {t('admin.commissions.records')}
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        style={{
                                            width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                                            background: currentPage === i + 1 ? 'var(--bg-active)' : 'transparent',
                                            color: currentPage === i + 1 ? 'white' : 'var(--text-muted)',
                                            fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer'
                                        }}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Drawer / Modal */}
            <AnimatePresence>
                {selectedTx && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }}>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedTx(null)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            style={{
                                width: '450px', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
                                zIndex: 2001, height: '100%', padding: '40px', display: 'flex', flexDirection: 'column',
                                boxShadow: '-20px 0 50px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 950 }}>{t('admin.commissions.audit_details')}</h3>
                                <button onClick={() => setSelectedTx(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 800 }}>{t('admin.overview.close')}</button>
                            </div>

                            <div style={{ display: 'grid', gap: '24px' }}>
                                <div style={{ padding: '24px', background: 'var(--bg-subtle)', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>{t('admin.commissions.transaction_id')}</p>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 950, fontFamily: 'monospace', color: 'var(--primary)' }}>TX-{selectedTx.id.toString().padStart(6, '0')}</p>
                                </div>

                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>{t('admin.commissions.order_info')}</p>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <Calendar size={16} color="var(--text-muted)" />
                                            <div>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>{t('admin.commissions.date_time')}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(selectedTx.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <User size={16} color="var(--text-muted)" />
                                            <div>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>{t('admin.commissions.organizer_label')}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedTx.event?.organizer?.organizationName || t('admin.platform.global_broadcast')}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <Ticket size={16} color="var(--text-muted)" />
                                            <div>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>{t('admin.commissions.linked_event')}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedTx.event?.title || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '16px' }}>{t('admin.commissions.revenue_breakdown')}</p>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '12px' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t('admin.commissions.gross_amount')}</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 900 }}>ETB {Number(selectedTx.amount).toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F59E0B' }}>{t('admin.platform_commission')}</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#F59E0B' }}>- ETB {Number(selectedTx.feeAmount).toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-active)', borderRadius: '12px', marginTop: '8px' }}>
                                            <span style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>{t('admin.commissions.organizer_net')}</span>
                                            <span style={{ fontSize: '1rem', fontWeight: 950, color: 'white' }}>ETB {Number(selectedTx.netAmount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                <button
                                    onClick={() => setSelectedTx(null)}
                                    style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'white', fontWeight: 900, cursor: 'pointer' }}
                                >
                                    {t('admin.commissions.dismiss')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
