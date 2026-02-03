import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ClipboardList, Shield, Clock, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AdminService } from '../../../core/api/admin.service';
import { useDialog } from '../../../core/context/DialogContext';

export const ActivityLogView = () => {
    const { t } = useTranslation();
    const dialog = useDialog();
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>({});
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [isClearing, setIsClearing] = useState(false);

    const fetchLogs = async (p = 1) => {
        setIsLoading(true);
        try {
            const res: any = await AdminService.getAuditLogs({ page: p, limit: 10 });
            setLogs(res.data || []);
            setPagination(res.pagination || {});
            setPage(p);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleDelete = async (id: number) => {
        const r = await dialog.confirm({
            title: t('common.confirm', 'Confirm'),
            message: t('admin.logs.delete_confirm'),
            confirmText: t('common.delete', 'Delete'),
            cancelText: t('common.cancel', 'Cancel'),
            variant: 'danger'
        });
        if (!r.confirmed) return;
        try {
            await AdminService.deleteAuditLog(id);
            fetchLogs(page);
        } catch (err) {
            await dialog.alert({ title: t('common.error', 'Error'), message: t('admin.team.failed') });
        }
    };

    const handleClearAll = async () => {
        const r = await dialog.confirm({
            title: t('common.confirm', 'Confirm'),
            message: t('admin.logs.clear_all_confirm'),
            confirmText: t('admin.logs.clear_history', 'Clear'),
            cancelText: t('common.cancel', 'Cancel'),
            variant: 'danger'
        });
        if (!r.confirmed) return;
        setIsClearing(true);
        try {
            await AdminService.clearAuditLogs();
            fetchLogs(1);
        } catch (err) {
            await dialog.alert({ title: t('common.error', 'Error'), message: t('admin.team.failed') });
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>


            <div className="admin-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ClipboardList size={22} color="var(--primary)" />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>{t('admin.logs.audit_trail')}</h3>
                    </div>
                    <button
                        onClick={handleClearAll}
                        disabled={isClearing || logs.length === 0}
                        style={{
                            padding: '10px 18px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Trash2 size={16} />
                        {isClearing ? t('admin.logs.clearing') : t('admin.logs.clear_history')}
                    </button>
                </div>

                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {logs.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
                                <Shield size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p style={{ fontWeight: 700 }}>{t('admin.logs.no_logs')}</p>
                            </div>
                        ) : (
                            <>
                                {logs.map((log) => (
                                    <motion.div
                                        layout
                                        key={log.id}
                                        style={{
                                            padding: '20px',
                                            background: 'var(--bg-card)',
                                            borderRadius: '20px',
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                <Shield size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{log.description}</p>
                                                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                    <span>{t('admin.logs.id')}: {log.id}</span>
                                                    <span>{t('admin.logs.ip')}: {log.ipAddress || 'Internal'}</span>
                                                </div>
                                            </div>
                                            {log.metadata && (
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3B82F6', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900, cursor: 'pointer' }}
                                                >
                                                    DETAILS
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                                                    <Clock size={12} color="var(--text-muted)" />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '6px' }}>
                                                    ID: {log.userId || 'SYSTEM'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                style={{ padding: '8px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onMouseOver={(e) => (e.currentTarget.style.color = '#EF4444')}
                                                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Pagination */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '0 8px' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                        Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            disabled={page === 1}
                                            onClick={() => fetchLogs(page - 1)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-main)',
                                                fontWeight: 800,
                                                cursor: page === 1 ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                opacity: page === 1 ? 0.5 : 1
                                            }}
                                        >
                                            <ChevronLeft size={16} /> Previous
                                        </button>
                                        <button
                                            disabled={page === pagination.totalPages}
                                            onClick={() => fetchLogs(page + 1)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-main)',
                                                fontWeight: 800,
                                                cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                opacity: page === pagination.totalPages ? 0.5 : 1
                                            }}
                                        >
                                            Next <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Metadata Detail Modal Overlay */}
            <AnimatePresence>
                {selectedLog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                        onClick={() => setSelectedLog(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid var(--border)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '4px' }}>{selectedLog.title}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Detailed Metadata Payload</p>
                                </div>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    style={{ padding: '8px', background: 'var(--bg-subtle)', border: 'none', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ background: 'var(--bg-main)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)', overflowX: 'auto' }}>
                                <pre style={{ margin: 0, fontSize: '0.85rem', color: '#10B981', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1.6 }}>
                                    {JSON.stringify(selectedLog.metadata, null, 2)}
                                </pre>
                            </div>

                            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn-blue" onClick={() => setSelectedLog(null)} style={{ padding: '12px 24px' }}>
                                    CLOSE
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
