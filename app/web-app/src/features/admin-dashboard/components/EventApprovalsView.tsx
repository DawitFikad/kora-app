import { useState, useEffect } from 'react';
import DecisionModal from './DecisionModal';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Calendar, MapPin, Tag, Download, Check, X, Info, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';

import { AdminService } from '../../../core/api/admin.service';
import { exportToCSV } from '../../../core/utils/export';
import { exportToPDF } from '../../../core/utils/pdf';
import Pagination from '../../../core/components/Pagination';
import { useDialog } from '../../../core/context/DialogContext';

export const EventApprovalsView = () => {
    const { t } = useTranslation();
    const dialog = useDialog();
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('approved');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [decisionOpen, setDecisionOpen] = useState(false);
    const [decisionContext, setDecisionContext] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const pageSize = 10;

    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            const data: any = await AdminService.getEvents();
            setEvents(data || []);
        } catch (err) {
            console.error('Failed to fetch events', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const handleReview = (id: number, status: 'APPROVED' | 'REJECTED', commission?: any) => {
        setDecisionContext({ id, status, commission });
        setDecisionOpen(true);
    };

    const confirmDecision = async (payload: { reason: string; commission?: any }) => {
        if (!decisionContext) return;
        const { id, status } = decisionContext;
        try {
            setProcessingId(id);
            await AdminService.reviewEvent(id, status, payload.commission || { feeType: 'PERCENTAGE', feePercentage: 10 }, payload.reason);
            setDecisionOpen(false);
            setDecisionContext(null);
            fetchEvents();
        } catch (err) {
            await dialog.alert({ title: t('common.error', 'Error'), message: t('admin.team.failed', 'Action failed') });
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    const allFilteredEvents = events.filter(e => {
        if (activeTab === 'pending') return e.status === 'PENDING';
        if (activeTab === 'approved') return e.status === 'APPROVED' || e.status === 'PUBLISHED';
        return e.status === 'REJECTED';
    });

    const startIndex = (currentPage - 1) * pageSize;
    const filteredEvents = allFilteredEvents.slice(startIndex, startIndex + pageSize);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* 📑 Premium Control Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px',
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    background: 'var(--bg-subtle)',
                    padding: '8px',
                    borderRadius: '20px',
                    width: 'fit-content',
                    border: '1px solid var(--border)'
                }}>
                    {[
                        { id: 'approved', label: 'Active Events', icon: CheckCircle2, color: '#10B981' },
                        { id: 'pending', label: 'Pending Review', icon: Clock, color: '#F59E0B', count: events.filter(e => e.status === 'PENDING').length },
                        { id: 'rejected', label: 'Removed/Rejected', icon: XCircle, color: '#EF4444' },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '14px 28px',
                                    borderRadius: '16px',
                                    border: isActive ? `1px solid ${tab.color}40` : '1px solid transparent',
                                    background: isActive ? 'var(--bg-card)' : 'transparent',
                                    color: isActive ? tab.color : 'var(--text-muted)',
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isActive ? `0 10px 20px ${tab.color}15` : 'none',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Icon size={18} color={isActive ? tab.color : 'var(--text-muted)'} />
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span style={{
                                        marginLeft: '6px',
                                        padding: '2px 8px',
                                        background: tab.color,
                                        color: 'white',
                                        borderRadius: '8px',
                                        fontSize: '0.7rem',
                                        fontWeight: 900,
                                        boxShadow: `0 4px 10px ${tab.color}40`
                                    }}>
                                        {tab.count}
                                    </span>
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="premiumTabGlowEvents"
                                        style={{
                                            position: 'absolute',
                                            bottom: '-2px',
                                            left: '20%',
                                            right: '20%',
                                            height: '2.5px',
                                            background: tab.color,
                                            boxShadow: `0 0 15px ${tab.color}`,
                                            borderRadius: '100px'
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        onClick={() => {
                            setIsExporting(true);
                            exportToCSV(allFilteredEvents.map(e => ({
                                Title: e.title,
                                Organizer: e.organizer?.organizationName,
                                City: e.city?.name,
                                Date: e.dateTime,
                                Status: e.status
                            })), 'events_report.csv');
                            setTimeout(() => setIsExporting(false), 2000);
                        }}
                        disabled={isExporting}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 28px',
                            borderRadius: '18px',
                            fontWeight: 900,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0,0,0,0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} color="var(--primary)" />}
                        {t('admin.export', 'Export Events')}
                    </button>
                    <button
                        onClick={() => {
                            setIsExporting(true);
                            exportToPDF(allFilteredEvents.map(e => ({
                                Title: e.title,
                                Organizer: e.organizer?.organizationName,
                                City: e.city?.name,
                                Status: e.status
                            })), ['Title', 'Organizer', 'City', 'Status'], 'events_full_report.pdf', 'Platform Events Comprehensive Directory');
                            setTimeout(() => setIsExporting(false), 2000);
                        }}
                        disabled={isExporting}
                        style={{
                            background: 'linear-gradient(135deg, var(--primary), #3B82F6)',
                            color: 'white',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 28px',
                            borderRadius: '18px',
                            fontWeight: 950,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 8px 20px -5px rgba(59, 130, 246, 0.4)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 15px 30px -8px rgba(59, 130, 246, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 20px -5px rgba(59, 130, 246, 0.4)';
                        }}
                    >
                        <FileText size={20} />
                        Detailed PDF
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="admin-card"
                    style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '24px' }}
                >
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>#</th>
                                <th>{t('admin.approvals.event_title')}</th>
                                <th>{t('admin.approvals.category_city')}</th>
                                <th>{t('admin.approvals.date_time')}</th>
                                <th style={{ textAlign: 'right' }}>{t('admin.approvals.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                                        <Calendar size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                        <p>{activeTab === 'pending' ? t('admin.approvals.no_pending') : activeTab === 'approved' ? t('admin.approvals.no_approved') : t('admin.approvals.no_rejected')}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredEvents.map((evt, index) => (
                                    <tr key={evt.id}>
                                        <td style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {startIndex + index + 1}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                                    {evt.images?.[0] ? <img src={evt.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Info size={16} color="var(--primary)" />}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{evt.title}</p>
                                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{evt.organizer?.organizationName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800 }}>
                                                    <Tag size={12} color="var(--primary)" />
                                                    {evt.category?.name}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    <MapPin size={12} />
                                                    {evt.city?.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                                {new Date(evt.dateTime).toLocaleDateString()}
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '6px' }}>{new Date(evt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {evt.status === 'PENDING' ? (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleReview(evt.id, 'APPROVED')}
                                                        style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        {processingId === evt.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={16} />}
                                                        {t('admin.approvals.approve')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReview(evt.id, 'REJECTED')}
                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: evt.status === 'REJECTED' ? '#EF4444' : '#10B981', background: evt.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>
                                                        {evt.status}
                                                    </span>
                                                    <button onClick={() => setSelectedItem(evt)} style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}>
                                                        {t('admin.overview.details')}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </motion.div>
            </AnimatePresence>

            <div style={{ marginTop: '32px' }}>
                <Pagination
                    currentPage={currentPage}
                    totalItems={allFilteredEvents.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            </div>

            {decisionOpen && (
                <DecisionModal
                    open={decisionOpen}
                    title={`${decisionContext?.status === 'APPROVED' ? t('admin.approvals.approve') : t('admin.approvals.reject')} ${t('admin.sidebar.events_nav')}`}
                    showCommission={decisionContext?.status === 'APPROVED'}
                    initialCommission={decisionContext?.commission}
                    onCancel={() => { setDecisionOpen(false); setDecisionContext(null); }}
                    onConfirm={(p: any) => confirmDecision(p)}
                />
            )}

            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedItem(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
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
                                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{t('admin.overview.details')}</p>
                                    <h2 style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem' }}>{selectedItem.title}</h2>
                                </div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setSelectedItem(null)}>
                                    <X size={18} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>{t('admin.decision.reason_label')}</p>
                                    <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', lineHeight: 1.6, fontWeight: 600 }}>
                                        {selectedItem.adminNote || selectedItem.rejectionReason || selectedItem.statusReason || t('admin.decision.no_reason', 'No specific reason or note provided.')}
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                                        <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{t('admin.approvals.location')}</p>
                                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>{selectedItem.city?.name}</p>
                                    </div>
                                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                                        <p style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Category</p>
                                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>{selectedItem.category?.name}</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setSelectedItem(null)} style={{ marginTop: '32px', width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 950, fontSize: '0.9rem', cursor: 'pointer' }}>
                                {t('common.close', 'Close')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
