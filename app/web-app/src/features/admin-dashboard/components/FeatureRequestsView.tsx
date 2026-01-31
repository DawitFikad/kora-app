import React, { useEffect, useState } from 'react';
import DecisionModal from './DecisionModal';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Crown, Loader2 } from 'lucide-react';
import { AdminService } from '../../../core/api/admin.service';

export const FeatureRequestsView = () => {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [decisionOpen, setDecisionOpen] = useState(false);
    const [decisionContext, setDecisionContext] = useState<any>(null);

    const fetchRequests = async () => {
        try {
            const res: any = await AdminService.getNotifications();
            const all = res?.data || [];
            const featureRequests = all.filter((n: any) => n.metadata?.type === 'FEATURE_REQUEST');
            setRequests(featureRequests);
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

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '10px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px' }}>
                    <Crown size={22} color="#FBBF24" />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Feature Requests</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Approve or reject organizer requests to feature events.</p>
                </div>
            </div>

            <div className="stat-card" style={{ padding: '0' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Pending Requests</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{requests.length} total</span>
                </div>
                <div style={{ padding: '8px 16px' }}>
                    {requests.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
                            {requests.map((n: any) => (
                                <div key={n.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>{n.title}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{n.content}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleRespond(n.id, true)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#10B981', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}
                                        >
                                            <CheckCircle size={14} /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleRespond(n.id, false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', cursor: 'pointer', color: '#EF4444', fontWeight: 700, fontSize: '0.8rem' }}
                                        >
                                            <XCircle size={14} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No feature requests pending.
                        </div>
                    )}
                </div>
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
