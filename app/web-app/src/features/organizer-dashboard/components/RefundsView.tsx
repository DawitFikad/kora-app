import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, RefreshCw, XCircle, Ban, DollarSign, Calendar, Users } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useToast } from '../../../core/components/Toast';
import { ConfirmDialog } from '../../../core/components/ConfirmDialog';

export const RefundsView = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'refunds' | 'cancellation'>('refunds');

    // Data States
    const [refunds, setRefunds] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [refundImpact, setRefundImpact] = useState<any>(null);
    const [impactLoading, setImpactLoading] = useState(false);
    const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; description?: string; variant?: 'default' | 'danger'; onConfirm?: () => void }>({ open: false, title: '' });

    // Form States
    const [showRefundForm, setShowRefundForm] = useState(false);
    const [refundForm, setRefundForm] = useState({ purchaseId: '', reason: '', description: '', refundType: 'FULL', amount: '' });
    const [cancelReason, setCancelReason] = useState('');
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [refundsRes, eventsRes] = await Promise.all([
                OrganizerService.getRefunds().catch(() => ({ data: [] })),
                OrganizerService.getMyEvents()
            ]);
            setRefunds((refundsRes as any)?.data?.data || (refundsRes as any)?.data || []);
            setEvents((eventsRes as any)?.data?.data || (eventsRes as any)?.data || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load refund data");
        } finally {
            setLoading(false);
        }
    };

    const handleImpactAnalysis = async (eventId: string) => {
        if (!eventId) {
            setRefundImpact(null);
            return;
        }

        setSelectedEventId(eventId);
        setImpactLoading(true);
        try {
            const res = await OrganizerService.getRefundImpact(Number(eventId));
            setRefundImpact((res as any)?.data?.data || (res as any)?.data);
        } catch (error: any) {
            toast.error("Failed to calculate impact: " + error.message);
        } finally {
            setImpactLoading(false);
        }
    };

    const handleSubmitRefund = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await OrganizerService.requestRefund({
                purchaseId: Number(refundForm.purchaseId),
                reason: refundForm.reason,
                description: refundForm.description,
                amount: refundForm.refundType === 'PARTIAL' ? Number(refundForm.amount) : undefined
            });
            toast.success("Refund request submitted for admin approval");
            setShowRefundForm(false);
            setRefundForm({ purchaseId: '', reason: '', description: '', refundType: 'FULL', amount: '' });
            fetchData(); // Refresh list
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to submit refund request");
        } finally {
            setLoading(false);
        }
    };

    const handleCancellationRequest = async () => {
        if (!selectedEventId || !cancelReason) return;

        setConfirmState({
            open: true,
            title: 'Request event cancellation?',
            description: 'This action requires admin approval.',
            variant: 'danger',
            onConfirm: async () => {
                setLoading(true);
                try {
                    await OrganizerService.requestCancellation(Number(selectedEventId), cancelReason);
                    toast.success("Cancellation request submitted successfully");
                    setCancelReason('');
                    setRefundImpact(null);
                    setSelectedEventId('');
                } catch (error: any) {
                    toast.error(error?.response?.data?.error || "Failed to request cancellation");
                } finally {
                    setLoading(false);
                    setConfirmState({ open: false, title: '' });
                }
            }
        });
    };

    if (loading && !refunds.length && !events.length) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary-blue)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                description={confirmState.description}
                variant={confirmState.variant}
                confirmText="Confirm"
                cancelText="Cancel"
                onCancel={() => setConfirmState({ open: false, title: '' })}
                onConfirm={() => confirmState.onConfirm?.()}
            />
            <PageHeader
                title="Refunds & Cancellations"
                subtitle="Manage refund requests and event cancellations."
            />

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <button
                    onClick={() => setActiveTab('refunds')}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'refunds' ? '2px solid var(--primary-blue)' : '2px solid transparent',
                        color: activeTab === 'refunds' ? 'var(--primary-blue)' : 'var(--text-muted)',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    Refund Requests
                </button>
                <button
                    onClick={() => setActiveTab('cancellation')}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'cancellation' ? '2px solid #EF4444' : '2px solid transparent',
                        color: activeTab === 'cancellation' ? '#EF4444' : 'var(--text-muted)',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    Event Cancellation
                </button>
            </div>

            {activeTab === 'refunds' ? (
                // Refunds Section
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <button
                            onClick={() => setShowRefundForm(true)}
                            className="btn-blue"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <RefreshCw size={18} /> Request New Refund
                        </button>
                    </div>

                    {showRefundForm && (
                        <div className="stat-card" style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--primary-blue)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>New Refund Request</h3>
                            <form onSubmit={handleSubmitRefund} style={{ display: 'grid', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>Purchase ID</label>
                                        <input
                                            required
                                            type="number"
                                            placeholder="e.g. 1024"
                                            value={refundForm.purchaseId}
                                            onChange={e => setRefundForm({ ...refundForm, purchaseId: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>Reason</label>
                                        <select
                                            required
                                            value={refundForm.reason}
                                            onChange={e => setRefundForm({ ...refundForm, reason: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)' }}
                                        >
                                            <option value="">Select Reason</option>
                                            <option value="DUPLICATE_PAYMENT">Duplicate Payment</option>
                                            <option value="CANCELLATION">Customer Cancellation</option>
                                            <option value="ORGANIZER_APPROVED">Organizer Approved</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>Refund Type</label>
                                        <select
                                            value={refundForm.refundType}
                                            onChange={e => setRefundForm({ ...refundForm, refundType: e.target.value, amount: '' })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)' }}
                                        >
                                            <option value="FULL">Full Refund</option>
                                            <option value="PARTIAL">Partial Refund</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>Amount (ETB)</label>
                                        <input
                                            type="number"
                                            placeholder={refundForm.refundType === 'PARTIAL' ? 'Enter amount' : 'Auto (full amount)'}
                                            value={refundForm.amount}
                                            onChange={e => setRefundForm({ ...refundForm, amount: e.target.value })}
                                            disabled={refundForm.refundType !== 'PARTIAL'}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>Description (Optional)</label>
                                    <textarea
                                        rows={3}
                                        value={refundForm.description}
                                        onChange={e => setRefundForm({ ...refundForm, description: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowRefundForm(false)}
                                        style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-blue">Submit Request</button>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Refunds close 24 hours before event start. Event policy is applied automatically.
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="stat-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <table className="event-table">
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Customer</th>
                                    <th>Event</th>
                                    <th>Amount</th>
                                    <th>Reason</th>
                                    <th>Type</th>
                                    <th>Policy</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refunds.map((refund) => (
                                    <tr key={refund.id}>
                                        <td>
                                            <span
                                                className={`pill ${refund.status === 'COMPLETED' ? 'pill-green' :
                                                    refund.status === 'PENDING' ? 'pill-yellow' : 'pill-red'
                                                    }`}
                                            >
                                                {refund.status}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{refund.customerName || 'N/A'}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{refund.eventTitle}</td>
                                        <td style={{ fontWeight: 800 }}>ETB {refund.amount.toLocaleString()}</td>
                                        <td>{refund.reason.replace('_', ' ')}</td>
                                        <td>{refund.refundType}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{refund.refundPolicy}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(refund.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {refund.status === 'PENDING' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <button
                                                        className="btn-blue"
                                                        style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                                        onClick={() => setConfirmState({
                                                            open: true,
                                                            title: 'Approve refund?',
                                                            description: `Approve ${refund.refundType.toLowerCase()} refund of ETB ${refund.amount}?`,
                                                            onConfirm: async () => {
                                                                try {
                                                                    await OrganizerService.approveRefund(refund.id);
                                                                    toast.success('Refund approved');
                                                                    fetchData();
                                                                } catch (error: any) {
                                                                    toast.error(error?.response?.data?.error || 'Failed to approve');
                                                                } finally {
                                                                    setConfirmState({ open: false, title: '' });
                                                                }
                                                            }
                                                        })}
                                                    >
                                                        Approve
                                                    </button>
                                                    {rejectingId === refund.id ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="Reject reason"
                                                                value={rejectReason}
                                                                onChange={(e) => setRejectReason(e.target.value)}
                                                                style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: '0.75rem' }}
                                                            />
                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                <button
                                                                    className="btn-blue"
                                                                    style={{ padding: '6px 10px', fontSize: '0.75rem', background: '#EF4444' }}
                                                                    onClick={async () => {
                                                                        try {
                                                                            await OrganizerService.rejectRefund(refund.id, rejectReason);
                                                                            toast.success('Refund rejected');
                                                                            setRejectingId(null);
                                                                            setRejectReason('');
                                                                            fetchData();
                                                                        } catch (error: any) {
                                                                            toast.error(error?.response?.data?.error || 'Failed to reject');
                                                                        }
                                                                    }}
                                                                >
                                                                    Confirm Reject
                                                                </button>
                                                                <button
                                                                    style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)' }}
                                                                    onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="btn-blue"
                                                            style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                                            onClick={() => setRejectingId(refund.id)}
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No actions</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {refunds.length === 0 && (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                            No refund requests found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            ) : (
                // Cancellation Section
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {/* Event Selection & Analysis */}
                        <div className="stat-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle color="#F59E0B" /> Cancellation Impact Analysis
                            </h3>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>Select Event to Cancel</label>
                                <select
                                    value={selectedEventId}
                                    onChange={(e) => handleImpactAnalysis(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: '1rem' }}
                                >
                                    <option value="">-- Choose Event --</option>
                                    {events.filter(e => e.status !== 'CANCELLED' && e.status !== 'COMPLETED').map(e => (
                                        <option key={e.id} value={e.id}>{e.title} ({new Date(e.dateTime).toLocaleDateString()})</option>
                                    ))}
                                </select>
                            </div>

                            {impactLoading && (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Loader2 className="animate-spin" style={{ margin: '0 auto 12px' }} />
                                    Calculating financial impact...
                                </div>
                            )}

                            {!impactLoading && refundImpact && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div style={{ background: 'var(--bg-subtle)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                            <div>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Tickets Sold</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{refundImpact.totalTicketsSold}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Affected Customers</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B' }}>{refundImpact.affectedCustomers}</p>
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Estimated Refund Liability</p>
                                            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#EF4444' }}>
                                                ETB {refundImpact.totalRefundAmount.toLocaleString()}
                                            </p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                                * This amount will be deducted from your wallet or invoiced if balance is insufficient.
                                            </p>
                                        </div>
                                    </div>

                                    {!refundImpact.canCancel ? (
                                        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', fontWeight: 600 }}>
                                            <Ban size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                            This event cannot be cancelled.
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>Reason for Cancellation</label>
                                            <textarea
                                                required
                                                rows={3}
                                                placeholder="Please maintain transparency with your attendees..."
                                                value={cancelReason}
                                                onChange={e => setCancelReason(e.target.value)}
                                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)', marginBottom: '16px' }}
                                            />
                                            <button
                                                onClick={handleCancellationRequest}
                                                disabled={!cancelReason}
                                                style={{
                                                    width: '100%',
                                                    padding: '16px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: cancelReason ? '#EF4444' : 'var(--border)',
                                                    color: 'white',
                                                    fontWeight: 800,
                                                    cursor: cancelReason ? 'pointer' : 'not-allowed',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <XCircle size={20} /> Request Event Cancellation
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {!selectedEventId && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <Calendar size={48} opacity={0.2} style={{ margin: '0 auto 16px' }} />
                                    <p>Select an event to view cancellation impact and options.</p>
                                </div>
                            )}
                        </div>

                        {/* Guidelines */}
                        <div className="stat-card" style={{ padding: '32px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Cancellation Policy</h3>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ background: 'rgba(29, 144, 245, 0.1)', padding: '8px', borderRadius: '50%' }}>
                                        <Users size={16} color="var(--primary-blue)" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Attendee Notification</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All ticket holders will be automatically notified via SMS and Email upon approval.</p>
                                    </div>
                                </li>
                                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ background: 'rgba(29, 144, 245, 0.1)', padding: '8px', borderRadius: '50%' }}>
                                        <DollarSign size={16} color="var(--primary-blue)" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Automatic Refunds</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Refunds are processed automatically to the original payment method. Platform fees are non-refundable.</p>
                                    </div>
                                </li>
                                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ background: 'rgba(29, 144, 245, 0.1)', padding: '8px', borderRadius: '50%' }}>
                                        <AlertTriangle size={16} color="var(--primary-blue)" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Admin Approval</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cancellation requests are reviewed by our team to ensure compliance with our terms of service.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
