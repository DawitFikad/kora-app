import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Activity, Loader2 } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';

export const FraudMonitoringView = () => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [alertsData, metricsData]: any = await Promise.all([
                AdminService.getFraudAlerts(),
                AdminService.getFraudMetrics()
            ]);
            setAlerts(alertsData);
            setMetrics(metricsData);
        } catch (err) {
            console.error('Failed to fetch fraud data', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading || !metrics) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader title="Fraud & Security Control" subtitle="Real-time monitoring of suspicious ticket activity and identity fraud." />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main" style={{ borderColor: metrics.criticalAlerts > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)' }}>
                    <h4 style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '0.05em' }}>CRITICAL ALERTS</h4>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>{String(metrics.criticalAlerts).padStart(2, '0')}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Action required immediately</p>
                </div>
                <div className="admin-stat-card-main">
                    <h4 style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '0.05em' }}>HIGH RISK ALERTS</h4>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>{String(metrics.highRiskAlerts).padStart(2, '0')}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending detailed audit</p>
                </div>
                <div className="admin-stat-card-main">
                    <h4 style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '0.05em' }}>SYSTEM HEALTH</h4>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>{metrics.authSuccessRate}%</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Auth success rate (24h)</p>
                </div>
            </div>

            <div className="admin-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Live Security Log</h3>
                    <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={14} color="#10B981" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>Monitoring Live...</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {alerts.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
                            <ShieldCheck size={40} color="#10B981" style={{ opacity: 0.3, marginBottom: '12px' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No fraud alerts detected in the last 24 hours.</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div key={alert.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: alert.riskLevel === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <ShieldAlert size={20} color={alert.riskLevel === 'CRITICAL' ? '#EF4444' : '#F59E0B'} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 800, fontSize: '0.95rem' }}>{alert.type}</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {alert.message} {alert.user && `• User: ${alert.user.phoneNumber}`}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>{new Date(alert.createdAt).toLocaleTimeString()}</p>
                                    <button style={{ color: '#3B82F6', background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>ANALYZE ROOT CAUSE</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
};
