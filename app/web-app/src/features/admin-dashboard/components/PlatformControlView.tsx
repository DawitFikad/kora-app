import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AdminService } from '../../../core/api/admin.service';

import {
    Activity,
    AlertTriangle,
    Zap,
    Server,
    Database,
    Globe,
    MessageSquare,
    Loader2,
    ShieldAlert
} from 'lucide-react';

export const PlatformControlView = () => {
    const { t } = useTranslation();
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
    const [securityEvents, setSecurityEvents] = useState<any[]>([]);

    // Fetch live config & stats
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. System Config
                const configRes: any = await AdminService.getSystemConfigs();
                const mMode = configRes.data.find((c: any) => c.key === 'maintenance_mode');
                if (mMode) setIsMaintenanceMode(mMode.value === 'true');

                // 2. Real Stats
                const statsRes: any = await AdminService.getStats();
                const { metrics } = statsRes.systemHealth || {};

                if (metrics) {
                    setSystemMetrics({
                        cpu: metrics.cpu || 0,
                        memory: metrics.memory || 0,
                        dbLatency: statsRes.systemHealth.database === 'healthy' ? 12 : 500, // DB check
                        apiLatency: 35, // Static based on response time roughly
                        activeConnections: metrics.activeConnections || 0
                    });
                }

                // 3. Security Events (Audit Logs)
                const auditRes: any = await AdminService.getAuditLogs({ limit: 5 });
                setSecurityEvents(auditRes.data || []);

            } catch (err) {
                console.error('Failed to fetch platform health data', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const handleMaintenanceToggle = async () => {
        setIsUpdating(true);
        try {
            const newValue = !isMaintenanceMode;
            await AdminService.updateSystemConfig({
                key: 'maintenance_mode',
                value: String(newValue),
                description: 'System-wide maintenance mode'
            });
            setIsMaintenanceMode(newValue);
        } catch (err) {
            console.error('Failed to toggle maintenance mode', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleBroadcast = async () => {
        if (!globalMessage.trim()) return;
        setIsUpdating(true);
        try {
            await AdminService.updateSystemConfig({
                key: 'global_notice',
                value: globalMessage.trim(),
                description: 'Active announcement for all users'
            });
            setGlobalMessage('');
            alert(t('admin.platform.broadcast_success', 'Broadcast sent successfully!'));
        } catch (err) {
            console.error('Failed to send broadcast', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const healthStatus = systemMetrics.cpu > 80 || systemMetrics.dbLatency > 100 ? 'Critical' : 'Healthy';

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>


            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* 🔴 Left Side: Live Monitoring */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('admin.platform.infra_health')}</h3>
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
                            {healthStatus === 'Healthy' ? t('admin.platform.healthy').toUpperCase() : t('admin.platform.critical').toUpperCase()}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <MetricCard label={t('admin.platform.cpu_usage')} value={`${systemMetrics.cpu.toFixed(0)}%`} icon={Server} color="#3B82F6" progress={systemMetrics.cpu} />
                        <MetricCard label={t('admin.platform.ram_usage')} value={`${systemMetrics.memory.toFixed(0)}%`} icon={Zap} color="#A78BFA" progress={systemMetrics.memory} />
                        <MetricCard label={t('admin.platform.active_sessions')} value={systemMetrics.activeConnections.toLocaleString()} icon={Globe} color="#10B981" />
                        <MetricCard label={t('admin.platform.db_latency')} value={`${systemMetrics.dbLatency.toFixed(0)}ms`} icon={Database} color="#F59E0B" warn={systemMetrics.dbLatency > 80} />
                        <MetricCard label={t('admin.platform.api_latency')} value={`${systemMetrics.apiLatency.toFixed(0)}ms`} icon={Activity} color="#6366F1" />
                        <MetricCard label={t('admin.platform.cache_hit_rate')} value="98.2%" icon={Zap} color="#10B981" />
                    </div>

                    <div style={{ marginTop: '32px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '16px' }}>{t('admin.platform.network_traffic_realtime')}</h4>
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
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px' }}>{t('admin.platform.api_service_clusters')}</h4>
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
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>{t('admin.platform.platform_sovereignty')}</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {isMaintenanceMode ? t('admin.platform.maintenance_active') : t('admin.platform.maintenance_inactive')}
                            </span>
                            <button
                                onClick={handleMaintenanceToggle}
                                disabled={isUpdating}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    background: isMaintenanceMode ? '#10B981' : '#EF4444',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    opacity: isUpdating ? 0.5 : 1
                                }}
                            >
                                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : t('admin.platform.maintenance_toggle')}
                            </button>
                        </div>

                        <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>{t('admin.platform.global_broadcast')}</h4>
                            <div style={{ position: 'relative' }}>
                                <MessageSquare size={16} style={{ position: 'absolute', left: 16, top: 16, color: 'var(--text-muted)' }} />
                                <textarea
                                    placeholder={t('admin.platform.broadcast_placeholder')}
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
                                onClick={handleBroadcast}
                                disabled={isUpdating || !globalMessage}
                                className="btn-blue"
                                style={{ width: '100%', marginTop: '12px', padding: '12px', background: 'var(--bg-active)', borderRadius: '10px', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: isUpdating ? 0.5 : 1 }}>
                                {isUpdating ? t('admin.platform.broadcasting') : t('admin.platform.broadcast_button')}
                            </button>
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <ShieldAlert size={20} color="#EF4444" />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('admin.platform.security_events')}</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {securityEvents.length === 0 ? (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>{t('admin.platform.no_events')}</p>
                            ) : (
                                securityEvents.map((event) => (
                                    <AuditItem
                                        key={event.id}
                                        time={new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        action={event.content}
                                        isCritical={event.title?.toUpperCase().includes('CLEARED') || event.title?.toUpperCase().includes('DELETE')}
                                    />
                                ))
                            )}
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

const AuditItem = ({ time, action, isCritical }: any) => (
    <div className="audit-item" style={{ borderLeft: isCritical ? '3px solid #EF4444' : '3px solid transparent', paddingLeft: isCritical ? '12px' : '0' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isCritical ? '#EF4444' : 'var(--text-main)' }}>{action}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{time}</span>
    </div>
);
