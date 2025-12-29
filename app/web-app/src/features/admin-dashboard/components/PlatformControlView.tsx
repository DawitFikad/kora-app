import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';
import {
    Activity,
    AlertTriangle,
    Zap,
    Server,
    Database,
    Globe,
    Lock,
    Unlock,
    MessageSquare,
    Bug
} from 'lucide-react';

export const PlatformControlView = () => {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [globalMessage, setGlobalMessage] = useState('');
    const [systemMetrics, setSystemMetrics] = useState({
        cpu: 24,
        memory: 42,
        dbLatency: 12,
        apiLatency: 45,
        activeConnections: 1240
    });

    // Simulated real-time metrics update
    useEffect(() => {
        const interval = setInterval(() => {
            setSystemMetrics(prev => ({
                cpu: Math.max(10, Math.min(95, prev.cpu + (Math.random() * 10 - 5))),
                memory: Math.max(20, Math.min(90, prev.memory + (Math.random() * 4 - 2))),
                dbLatency: Math.max(5, Math.min(150, prev.dbLatency + (Math.random() * 6 - 3))),
                apiLatency: Math.max(20, Math.min(200, prev.apiLatency + (Math.random() * 10 - 5))),
                activeConnections: Math.max(1000, prev.activeConnections + Math.floor(Math.random() * 100 - 50))
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const healthStatus = systemMetrics.cpu > 80 || systemMetrics.dbLatency > 100 ? 'Critical' : 'Healthy';

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AdminPageHeader
                title="Platform Control & Monitoring"
                subtitle="Manage global system state and monitor live infrastructure health."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* 🔴 Left Side: Live Monitoring */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Infrastructure Health</h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            borderRadius: '100px',
                            background: healthStatus === 'Healthy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: healthStatus === 'Healthy' ? '#10B981' : '#EF4444',
                            fontSize: '0.75rem',
                            fontWeight: 900
                        }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }} />
                            {healthStatus.toUpperCase()}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <MetricCard label="CPU Usage" value={`${systemMetrics.cpu.toFixed(0)}%`} icon={Server} color="#3B82F6" progress={systemMetrics.cpu} />
                        <MetricCard label="RAM Usage" value={`${systemMetrics.memory.toFixed(0)}%`} icon={Zap} color="#A78BFA" progress={systemMetrics.memory} />
                        <MetricCard label="Active Sessions" value={systemMetrics.activeConnections.toLocaleString()} icon={Globe} color="#10B981" />
                        <MetricCard label="DB Latency" value={`${systemMetrics.dbLatency.toFixed(0)}ms`} icon={Database} color="#F59E0B" warn={systemMetrics.dbLatency > 80} />
                        <MetricCard label="API Latency" value={`${systemMetrics.apiLatency.toFixed(0)}ms`} icon={Activity} color="#6366F1" />
                        <MetricCard label="System Logs" value="Normal" icon={Bug} color="#57606A" />
                    </div>

                    <div style={{ marginTop: '32px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '16px' }}>NETWORK TRAFFIC (REAL-TIME)</h4>
                        <div style={{ height: '120px', width: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <motion.path
                                    d="M0,80 Q10,20 20,50 T40,30 T60,70 T80,40 T100,60 L100,100 L0,100 Z"
                                    fill="rgba(59, 130, 246, 0.15)"
                                    stroke="#3B82F6"
                                    strokeWidth="2"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 🔵 Right Side: Platform Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="admin-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Emergency Actions</h3>

                        <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#EF4444' }}>Maintenance Mode</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Lock the platform for all users immediately.</p>
                                </div>
                                <button
                                    onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: isMaintenanceMode ? '#EF4444' : 'rgba(239, 68, 68, 0.1)',
                                        color: isMaintenanceMode ? 'white' : '#EF4444',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {isMaintenanceMode ? <Unlock size={16} /> : <Lock size={16} />}
                                    {isMaintenanceMode ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', background: 'rgba(59, 130, 246, 0.05)' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3B82F6', marginBottom: '12px' }}>Global Announcement</h4>
                            <div style={{ position: 'relative' }}>
                                <MessageSquare size={18} style={{ position: 'absolute', left: 16, top: 16, color: 'rgba(255,255,255,0.3)' }} />
                                <textarea
                                    placeholder="Enter message for all users..."
                                    value={globalMessage}
                                    onChange={(e) => setGlobalMessage(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'var(--bg-main)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        padding: '16px 16px 16px 48px',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        minHeight: '80px',
                                        resize: 'none'
                                    }}
                                />
                            </div>
                            <button className="btn-blue" style={{ width: '100%', marginTop: '12px', padding: '12px', background: '#3B82F6', borderRadius: '10px', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                                Broadcast To All
                            </button>
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>Recent Audit Logs</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <AuditItem time="2m ago" action="Admin 'Aman' updated commission rates" />
                            <AuditItem time="15m ago" action="Maintenance mode deactivated" />
                            <AuditItem time="45m ago" action="Suspicious IP blocked: 192.168.1.45" />
                            <AuditItem time="1h ago" action="Global announcement broadcasted" />
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
};

const MetricCard = ({ label, value, icon: Icon, color, progress, warn }: any) => (
    <div className="metric-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}11`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
            </div>
            {warn && <AlertTriangle size={16} color="#EF4444" />}
        </div>
        <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</p>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginTop: '2px', color: warn ? '#EF4444' : 'var(--text-main)' }}>{value}</h4>
        </div>
        {progress !== undefined && (
            <div style={{ height: '4px', width: '100%', background: 'var(--bg-subtle)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: color, borderRadius: '2px' }} />
            </div>
        )}
    </div>
);

const AuditItem = ({ time, action }: any) => (
    <div className="audit-item">
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{action}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{time}</span>
    </div>
);
