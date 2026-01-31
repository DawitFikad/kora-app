import React, { useState, useEffect } from 'react';

type Props = {
    open: boolean;
    title?: string;
    showCommission?: boolean;
    showPriority?: boolean;
    showRevenueEstimate?: boolean;
    initialCommission?: { feePercentage?: number; feeFixed?: number };
    initialPriority?: string;
    initialRevenue?: number | undefined;
    onCancel: () => void;
    onConfirm: (payload: { reason: string; commission?: any; priority?: string; revenueEstimate?: number }) => void;
};

const DecisionModal: React.FC<Props> = ({ open, title = 'Decision', showCommission = false, showPriority = false, showRevenueEstimate = false, initialCommission, initialPriority, initialRevenue, onCancel, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [feePercentage, setFeePercentage] = useState(initialCommission?.feePercentage ?? 10);
    const [feeFixed, setFeeFixed] = useState(initialCommission?.feeFixed ?? 0);
    const [priority, setPriority] = useState(initialPriority ?? '');
    const [revenueEstimate, setRevenueEstimate] = useState<number | ''>(initialRevenue ?? '');

    useEffect(() => {
        if (open) {
            setReason('');
            setFeePercentage(initialCommission?.feePercentage ?? 10);
            setFeeFixed(initialCommission?.feeFixed ?? 0);
            setPriority(initialPriority ?? '');
            setRevenueEstimate(initialRevenue ?? '');
        }
    }, [open, initialCommission, initialPriority, initialRevenue]);

    if (!open) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000 }} onClick={onCancel}>
            <div style={{ width: 520, maxWidth: '96%', background: 'var(--bg-card)', borderRadius: 12, padding: 20, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{title}</h3>
                <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block', marginBottom: 6 }}>Decision reason (required)</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)' }} />
                </div>

                {showCommission && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Platform %</label>
                            <input type="number" value={feePercentage} onChange={e => setFeePercentage(Number(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)' }} />
                        </div>
                        <div style={{ width: 120 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Fixed ETB</label>
                            <input type="number" value={feeFixed} onChange={e => setFeeFixed(Number(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)' }} />
                        </div>
                    </div>
                )}

                {showPriority && (
                    <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Priority</label>
                        <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width: 160, padding: 8, borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
                            <option value="">None</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                )}

                {showRevenueEstimate && (
                    <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Estimated revenue impact (ETB)</label>
                        <input type="number" value={revenueEstimate === '' ? '' : revenueEstimate} onChange={e => setRevenueEstimate(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: 200, padding: 8, borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)' }} />
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button onClick={onCancel} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)' }}>Cancel</button>
                    <button
                        onClick={() => {
                            if (!reason || reason.trim().length === 0) {
                                alert('Decision reason is required');
                                return;
                            }
                            onConfirm({ reason: reason.trim(), commission: showCommission ? { feePercentage, feeFixed, feeType: 'PERCENTAGE' } : undefined, priority: showPriority ? priority : undefined, revenueEstimate: showRevenueEstimate && revenueEstimate !== '' ? Number(revenueEstimate) : undefined });
                        }}
                        style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-active)', border: 'none', color: 'white', fontWeight: 800 }}
                    >Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default DecisionModal;
