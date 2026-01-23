import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';
import { Loader2, ClipboardList, Shield, Clock } from 'lucide-react';

export const ActivityLogView = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res: any = await AdminService.getAuditLogs();
                setLogs(res.data || []);
            } catch (err) {
                console.error('Failed to fetch audit logs', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader
                title="Admin Activity Logs"
                subtitle="Every action is logged, timestamped, and attributable for total accountability."
            />

            <div className="admin-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <ClipboardList size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Audit Trail</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {logs.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No audit logs found.
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Shield size={18} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>{log.title}</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.content}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                                        <Clock size={12} color="var(--text-muted)" />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        Admin ID: {log.userId || 'System'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
};
