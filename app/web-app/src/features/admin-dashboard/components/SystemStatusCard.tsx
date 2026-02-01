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
        <div style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}30` }}>
                        <ShieldCheck size={22} color={color} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '2px' }}>Platform Integrity</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Security & uptime monitoring</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color, letterSpacing: '0.05em' }}>{health.toUpperCase()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{warnings.length} SECURITY EVENTS</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Fraud Flags</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: fraudCount > 0 ? '#EF4444' : 'var(--text-main)' }}>{fraudCount}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Refund Alerts</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{refundFlags}</div>
                </div>
            </div>

            {warnings.length > 0 ? (
                <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', color: '#EF4444' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center', marginBottom: '8px', textTransform: 'uppercase' }}>
                        <AlertTriangle size={14} /> Critical Warnings
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                        {warnings.slice(0, 3).map((w, i) => <li key={i} style={{ marginBottom: '4px' }}>{w}</li>)}
                    </ul>
                </div>
            ) : (
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                    <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800 }}>API & GATEWAYS OPERATING WITHIN OPTIMAL PARAMETERS</span>
                </div>
            )}
        </div>
    );
};

export default SystemStatusCard;
