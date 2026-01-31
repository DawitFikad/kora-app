import React from 'react';

export const PendingActionsCard: React.FC<{
    pendingOrganizers: number;
    pendingEvents: number;
    pendingRefunds?: number;
    onOpenOrganizers?: () => void;
    onOpenEvents?: () => void;
    onOpenRefunds?: () => void;
}> = ({ pendingOrganizers, pendingEvents, pendingRefunds = 0, onOpenOrganizers, onOpenEvents, onOpenRefunds }) => {
    const item = (label: string, count: number, onClick?: () => void) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
            <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>{label}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Action required</div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 900 }}>{count}</div>
                <button onClick={onClick} style={{ marginTop: 6, fontSize: '0.72rem', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>View</button>
            </div>
        </div>
    );

    return (
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>Pending Actions</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick triage</div>
            </div>
            {item('Organizer approvals', pendingOrganizers, onOpenOrganizers)}
            {item('Event approvals', pendingEvents, onOpenEvents)}
            {item('Refund approvals', pendingRefunds, onOpenRefunds)}
        </div>
    );
};

export default PendingActionsCard;
