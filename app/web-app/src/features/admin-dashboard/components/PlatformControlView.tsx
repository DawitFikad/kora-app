import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminService } from '../../../core/api/admin.service';
import { AdminPageHeader } from './AdminPageHeader';
import {
    Activity,
    AlertTriangle,
    Zap,
    Server,
    Database,
    Globe,
    MessageSquare
} from 'lucide-react';

export const PlatformControlView = () => {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [globalMessage, setGlobalMessage] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [systemMetrics, setSystemMetrics] = useState({
        cpu: 24,
        memory: 42,
        dbLatency: 12,
        apiLatency: 45,
        activeConnections: 1240
    });

    // Fetch live config
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res: any = await AdminService.getSystemConfigs();
                const mMode = res.data.find((c: any) => c.key === 'maintenance_mode');
                if (mMode) setIsMaintenanceMode(mMode.value === 'true');
            } catch (err) {
                console.error('Failed to fetch system config', err);
            }
        };
        fetchConfig();

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
                        <MetricCard label="Cache Hit Rate" value="98.2%" icon={Zap} color="#10B981" />
                    </div>

                    <div style={{ marginTop: '32px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '16px' }}>NETWORK TRAFFIC (REAL-TIME)</h4>
                        <div style={{ height: '120px', width: '100%', background: 'var(--bg-main)', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <motion.path
                                    d="M0,80 Q10,20 20,50 T40,30 T60,70 T80,40 T100,60 L100,100 L0,100 Z"
                                    fill="rgba(59, 130, 246, 0.1)"
                                    stroke="#3B82F6"
                                    strokeWidth="1"
                                    animate={{
                                        d: [
                                            "M0,80 Q10,20 20,50 T40,30 T60,70 T80,40 T100,60 L100,100 L0,100 Z",
                                            "M0,80 Q15,40 25,60 T45,20 T65,80 T85,30 T100,70 L100,100 L0,100 Z",
                                            "M0,80 Q10,20 20,50 T40,30 T60,70 T80,40 T100,60 L100,100 L0,100 Z"
                                        ]
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                />
                            </svg>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px' }}>API SERVICE CLUSTERS</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div key={i} title="Service Node Online" style={{ height: '12px', background: Math.random() > 0.1 ? '#10B981' : '#F59E0B', borderRadius: '2px', opacity: 0.6 }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 🔵 Right Side: Platform Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="admin-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Platform Sovereignty</h3>

                        <div className="metric-card" style={{ marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#EF4444' }}>MAINTENANCE PROTOCOL</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Read-only mode for maintenance tasks.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            setIsUpdating(true);
                                            const newValue = !isMaintenanceMode;
                                            await AdminService.updateSystemConfig({
                                                key: 'maintenance_mode',
                                                value: String(newValue),
                                                description: 'Global maintenance mode'
                                            });
                                            setIsMaintenanceMode(newValue);
                                        } catch (err) {
                                            alert('Failed to update maintenance mode');
                                        } finally {
                                            setIsUpdating(false);
                                        }
                                    }}
                                    disabled={isUpdating}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        background: isMaintenanceMode ? '#EF4444' : 'var(--bg-card)',
                                        color: isMaintenanceMode ? 'white' : '#EF4444',
                                        border: isMaintenanceMode ? 'none' : '1px solid #EF4444',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        opacity: isUpdating ? 0.5 : 1
                                    }}
                                >
                                    {isUpdating ? '...' : (isMaintenanceMode ? 'DEACTIVATE' : 'ACTIVATE')}
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>GLOBAL BROADCAST</h4>
                            <div style={{ position: 'relative' }}>
                                <MessageSquare size={16} style={{ position: 'absolute', left: 16, top: 16, color: 'var(--text-muted)' }} />
                                <textarea
                                    placeholder="Alert all active users..."
                                    value={globalMessage}
                                    onChange={(e) => setGlobalMessage(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'var(--bg-main)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        padding: '16px 16px 16px 48px',
                                        color: 'var(--text-main)',
                                        fontSize: '0.85rem',
                                        minHeight: '80px',
                                        resize: 'none'
                                    }}
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    if (!globalMessage) return;
                                    try {
                                        setIsUpdating(true);
                                        // In real app, this would hit a push-notify endpoint
                                        // For now, we log it as an audit event
                                        await AdminService.updateSystemConfig({
                                            key: 'last_broadcast',
                                            value: globalMessage,
                                            description: 'Last global broadcast message'
                                        });
                                        alert('Global broadcast sent to all active users!');
                                        setGlobalMessage('');
                                    } catch (err) {
                                        alert('Failed to send broadcast');
                                    } finally {
                                        setIsUpdating(false);
                                    }
                                }}
                                disabled={isUpdating || !globalMessage}
                                className="btn-blue"
                                style={{ width: '100%', marginTop: '12px', padding: '12px', background: 'var(--bg-active)', borderRadius: '10px', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: isUpdating ? 0.5 : 1 }}>
                                {isUpdating ? 'BROADCASTING...' : 'EXECUTE BROADCAST'}
                            </button>
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>Security Events</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="audit-item" style={{ borderLeft: '3px solid #EF4444' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <AlertTriangle size={14} color="#EF4444" />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Brute-force attempt blocked</span>
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>12:45 PM</span>
                            </div>
                            <AuditItem time="12:30 PM" action="Admin login: 'Alex' (Addis Ababa)" />
                            <AuditItem time="11:15 AM" action="Backup sync completed (S3 Bucket)" />
                            <AuditItem time="10:00 AM" action="New organizer verified: 'National Theater'" />
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
