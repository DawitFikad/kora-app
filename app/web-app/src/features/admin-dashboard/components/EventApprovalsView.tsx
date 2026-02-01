import { useState, useEffect } from 'react';
import DecisionModal from './DecisionModal';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Loader2, Calendar, MapPin, Tag, Download, Check, X, Info } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';
import { exportToCSV } from '../../../core/utils/export';

export const EventApprovalsView = () => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [decisionOpen, setDecisionOpen] = useState(false);
    const [decisionContext, setDecisionContext] = useState<any>(null);

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
            alert('Action failed');
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

    const filteredEvents = events.filter(e => {
        if (activeTab === 'pending') return e.status === 'PENDING';
        if (activeTab === 'approved') return e.status === 'APPROVED' || e.status === 'PUBLISHED';
        return e.status === 'REJECTED';
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader
                title={t('admin.events')}
                subtitle={t('admin.events_queue_desc')}
                actions={
                    <button
                        onClick={() => exportToCSV(filteredEvents.map(e => ({
                            Title: e.title,
                            Organizer: e.organizer?.organizationName,
                            City: e.city?.name,
                            Date: e.dateTime,
                            Status: e.status
                        })), 'events.csv')}
                        className="btn-blue"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
                    >
                        <Download size={16} />
                        {t('admin.export')}
                    </button>
                }
            />

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'var(--bg-sidebar)', padding: '6px', borderRadius: '16px', width: 'fit-content', border: '1px solid var(--border)' }}>
                {(['pending', 'approved', 'rejected'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === tab ? 'var(--bg-active)' : 'transparent',
                            color: activeTab === tab ? 'white' : 'var(--text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'pending' ? t('admin.approvals.pending_tab') : tab === 'approved' ? t('admin.approvals.approved_tab') : t('admin.approvals.rejected_tab')}
                        {tab === 'pending' && events.filter(e => e.status === 'PENDING').length > 0 && (
                            <span style={{ marginLeft: '8px', padding: '2px 6px', background: '#EF4444', color: 'white', borderRadius: '6px', fontSize: '0.65rem' }}>
                                {events.filter(e => e.status === 'PENDING').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t('admin.approvals.event_title')}</th>
                            <th>{t('admin.approvals.category_city')}</th>
                            <th>{t('admin.approvals.date_time')}</th>
                            <th style={{ textAlign: 'right' }}>{t('admin.approvals.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                                    <Calendar size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                    <p>{t('admin.approvals.no_pending')}</p>
                                </td>
                            </tr>
                        ) : (
                            filteredEvents.map((evt) => (
                                <tr key={evt.id}>
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
                                                <button onClick={() => fetchEvents()} style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}>
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
            </div>

            {decisionOpen && (
                <DecisionModal
                    open={decisionOpen}
                    title={`${decisionContext?.status === 'APPROVED' ? t('admin.approvals.approve') : t('admin.approvals.reject')} ${t('admin.events')}`}
                    showCommission={decisionContext?.status === 'APPROVED'}
                    initialCommission={decisionContext?.commission}
                    onCancel={() => { setDecisionOpen(false); setDecisionContext(null); }}
                    onConfirm={(p: any) => confirmDecision(p)}
                />
            )}
        </motion.div>
    );
};
