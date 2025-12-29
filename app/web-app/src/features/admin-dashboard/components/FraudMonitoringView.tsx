import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Activity, Loader2 } from 'lucide-react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';

export const FraudMonitoringView = () => {
    const { t } = useTranslation();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState<any>(null);
    const [isResolving, setIsResolving] = useState(false);

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

    const handleResolve = async (id: number) => {
        const note = prompt('Enter resolution note:');
        if (note === null) return;
        try {
            setIsResolving(true);
            await AdminService.resolveFraudAlert(id, note || 'Resolved by admin');
            setSelectedAlert(null);
            fetchData();
        } catch (err) {
            alert('Failed to resolve alert');
        } finally {
            setIsResolving(false);
        }
    };

    const handleAnalyze = async (id: number) => {
        try {
            const detail = await AdminService.getFraudAlertDetail(id);
            setSelectedAlert(detail.data);
        } catch (err) {
            alert('Failed to fetch details');
        }
    };

    if (isLoading || !metrics) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader title={t('admin.fraud')} subtitle={t('admin.fraud_desc', 'Real-time monitoring of suspicious ticket activity and identity fraud.')} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main" style={{ borderColor: metrics.criticalAlerts > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)' }}>
                    <h4 style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '0.05em' }}>{t('admin.critical_alerts', 'CRITICAL ALERTS')}</h4>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>{String(metrics.criticalAlerts).padStart(2, '0')}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('admin.action_required', 'Action required immediately')}</p>
                </div>
                <div className="admin-stat-card-main">
                    <h4 style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '0.05em' }}>{t('admin.high_risk_alerts', 'HIGH RISK ALERTS')}</h4>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>{String(metrics.highRiskAlerts).padStart(2, '0')}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('admin.pending_audit', 'Pending detailed audit')}</p>
                </div>
                <div className="admin-stat-card-main">
                    <h4 style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '0.05em' }}>{t('admin.system_health', 'SYSTEM HEALTH')}</h4>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>{metrics.authSuccessRate}%</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('admin.auth_success_rate', 'Auth success rate (24h)')}</p>
                </div>
            </div>

            <div className="admin-card" style={{ padding: '24px', marginBottom: '32px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '16px', color: '#EF4444' }}>Manual Security Override</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        id="manual-ticket-id"
                        placeholder="Enter Ticket ID or Reference to invalidate..."
                        style={{ flex: 1, background: '#0B0E14', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '8px', color: 'white' }}
                    />
                    <button
                        onClick={async () => {
                            const id = (document.getElementById('manual-ticket-id') as HTMLInputElement).value;
                            if (!id) return;
                            if (confirm(`Are you sure you want to PERMANENTLY INVALIDATE ticket ${id}?`)) {
                                try {
                                    await AdminService.invalidateTicket(id, 'Manual Admin Force Invalidation');
                                    alert('Ticket invalidated successfully');
                                    (document.getElementById('manual-ticket-id') as HTMLInputElement).value = '';
                                } catch (e) { alert('Failed to invalidate'); }
                            }
                        }}
                        style={{ background: '#EF4444', color: 'white', border: 'none', padding: '0 24px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                    >
                        Invalidate Ticket
                    </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>Use this to manually blacklist a ticket due to physical theft, chargebacks, or verified abuse reports.</p>
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
                        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: '12px' }}>
                            <ShieldCheck size={40} color="#10B981" style={{ opacity: 0.3, marginBottom: '12px' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No fraud alerts detected in the last 24 hours.</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div key={alert.id} style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                    <button
                                        onClick={() => handleAnalyze(alert.id)}
                                        style={{ color: '#3B82F6', background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        ANALYZE ROOT CAUSE
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Analysis Modal */}
            {selectedAlert && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="admin-card" style={{ width: '500px', padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '8px', color: '#EF4444' }}>{selectedAlert.type}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>{selectedAlert.message}</p>

                        <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                            <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B82F6', marginBottom: '8px', textTransform: 'uppercase' }}>Metadata Analysis</h4>
                            <pre style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', overflow: 'auto', maxHeight: '200px' }}>
                                {JSON.stringify(selectedAlert.metadata, null, 2)}
                            </pre>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setSelectedAlert(null)} style={{ flex: 1, padding: '12px', background: 'var(--bg-subtle)', border: 'none', borderRadius: '8px', color: 'var(--text-main)', fontWeight: 700 }}>Dismiss</button>
                            <button
                                onClick={() => handleResolve(selectedAlert.id)}
                                disabled={isResolving}
                                style={{ flex: 1.5, padding: '12px', background: '#10B981', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700 }}
                            >
                                {isResolving ? 'Resolving...' : 'Mark as Resolved'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};
