import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const SystemStatusCard: React.FC<{
    health: 'Healthy' | 'Attention' | 'Critical';
    fraudCount?: number;
    refundFlags?: number;
    warnings?: string[];
}> = ({ health, fraudCount = 0, refundFlags = 0, warnings = [] }) => {
    const color = health === 'Healthy' ? '#10B981' : health === 'Attention' ? '#F59E0B' : '#EF4444';

    return (
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={18} color={color} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>System Status</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Overview of platform health</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color }}>{health}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{warnings.length} warnings</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <div style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fraud flags</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{fraudCount}</div>
                </div>
                <div style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Refund alerts</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{refundFlags}</div>
                </div>
            </div>

            {warnings.length > 0 && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.04)', color: '#EF4444' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <AlertTriangle size={14} /> Risk & Integrity Monitor
                    </div>
                    <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18, color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        {warnings.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SystemStatusCard;
