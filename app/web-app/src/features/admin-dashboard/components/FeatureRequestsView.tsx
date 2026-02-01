import { useEffect, useState } from 'react';
import DecisionModal from './DecisionModal';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Crown, Loader2, History, Inbox, Calendar, User } from 'lucide-react';
import { AdminService } from '../../../core/api/admin.service';

export const FeatureRequestsView = () => {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [decisionOpen, setDecisionOpen] = useState(false);
    const [decisionContext, setDecisionContext] = useState<any>(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res: any = await AdminService.getNotifications();
            const all = res?.data || [];

            // Pending are usually unread or not in Audit Log
            const pending = all.filter((n: any) => n.metadata?.type === 'FEATURE_REQUEST' && n.recipient !== 'Audit Log');

            // History might be in Audit Log or marked read
            const auditRes: any = await AdminService.getAuditLogs({ limit: 50 });
            const auditLogs = auditRes?.data || [];
            const historyItems = auditLogs.filter((n: any) => n.metadata?.type === 'FEATURE_REQUEST' || n.title.includes('Feature Request'));

            setRequests(pending);
            setHistory(historyItems);
        } catch (error) {
            console.error('Failed to fetch feature requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleRespond = async (notificationId: number, approved: boolean) => {
        setDecisionContext({ notificationId, approved });
        setDecisionOpen(true);
    };

    const confirmDecision = async (payload: { reason: string; priority?: string; revenueEstimate?: number }) => {
        if (!decisionContext) return;
        const { notificationId, approved } = decisionContext;
        try {
            await AdminService.respondToFeatureRequest(notificationId, approved, { priority: payload.priority, revenueEstimate: payload.revenueEstimate, adminNote: payload.reason });
            setDecisionOpen(false);
            setDecisionContext(null);
            await fetchRequests();
        } catch (error) {
            console.error('Failed to respond to feature request', error);
        }
    };

    if (loading && requests.length === 0 && history.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '16px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                        <Crown size={24} color="#FBBF24" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 950, color: 'white' }}>Feature Requests</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Manage placement and visibility upgrades for events.</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setActiveTab('pending')}
                        style={{
                            padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            background: activeTab === 'pending' ? 'white' : 'transparent',
                            color: activeTab === 'pending' ? 'black' : 'var(--text-muted)',
                            fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Inbox size={16} /> Pending ({requests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        style={{
                            padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            background: activeTab === 'history' ? 'white' : 'transparent',
                            color: activeTab === 'history' ? 'black' : 'var(--text-muted)',
                            fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <History size={16} /> Decided ({history.length})
                    </button>
                </div>
            </div>

            <div style={{ minHeight: '400px' }}>
                {activeTab === 'pending' ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {requests.length > 0 ? requests.map((n: any) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: '24px', borderRadius: '24px', border: '1px solid var(--border)',
                                    background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', gap: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                                        <Crown size={22} color="#FBBF24" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>{n.title}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>{n.content}</p>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={12} /> {new Date(n.createdAt).toLocaleDateString()}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <User size={12} /> {n.senderId ? `Admin ID: ${n.senderId}` : 'Organizer'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => handleRespond(n.id, false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '12px', cursor: 'pointer', color: '#EF4444', fontWeight: 800, fontSize: '0.85rem' }}
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleRespond(n.id, true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#10B981', border: 'none', borderRadius: '12px', cursor: 'pointer', color: 'white', fontWeight: 800, fontSize: '0.85rem' }}
                                    >
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                </div>
                            </motion.div>
                        )) : (
                            <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
                                <Inbox size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p style={{ fontSize: '1rem', fontWeight: 700 }}>No feature requests pending.</p>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Check back later for new requests.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {history.length > 0 ? history.map((h: any) => (
                            <motion.div
                                key={h.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border)',
                                    background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: h.title.includes('Approved') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {h.title.includes('Approved') ? <CheckCircle size={16} color="#10B981" /> : <XCircle size={16} color="#EF4444" />}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>{h.title}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h.content}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{new Date(h.createdAt).toLocaleDateString()}</p>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </motion.div>
                        )) : (
                            <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <History size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p style={{ fontSize: '1rem', fontWeight: 700 }}>Decision log is empty.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {decisionOpen && (
                <DecisionModal
                    open={decisionOpen}
                    title={`${decisionContext?.approved ? 'Approve' : 'Reject'} Feature Request`}
                    showPriority={true}
                    showRevenueEstimate={true}
                    onCancel={() => { setDecisionOpen(false); setDecisionContext(null); }}
                    onConfirm={(p: any) => confirmDecision(p)}
                />
            )}
        </motion.div>
    );
};

export default FeatureRequestsView;
