import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Maximize,
    Wifi,
    WifiOff,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Search,
    History,
    Zap,
    Loader2
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useToast } from '../../../core/components/Toast';

export const ScannerView = () => {
    const toast = useToast();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [ticketId, setTicketId] = useState('');
    const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
    const [scanResult, setScanResult] = useState<any>(null);
    const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Load offline queue
        const saved = localStorage.getItem('offline_scans');
        if (saved) setOfflineQueue(JSON.parse(saved));

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleValidate = async (id: string = ticketId) => {
        if (!id) return;
        setStatus('validating');

        if (!isOnline) {
            const scan = { qrPayload: id, timestamp: new Date().toISOString(), status: 'PENDING_SYNC' };
            const newQueue = [...offlineQueue, scan];
            setOfflineQueue(newQueue);
            localStorage.setItem('offline_scans', JSON.stringify(newQueue));

            setStatus('success');
            setScanResult({ name: 'Saved Offline', type: 'Caching Mode', message: 'Scan cached for sync' });
            setHistory([scan, ...history]);
            setTicketId('');
            return;
        }

        try {
            const res = await OrganizerService.validateTicket(id);
            if (res.data.success) {
                setStatus('success');
                setScanResult({
                    name: res.data.ticket.userName || 'Attendee',
                    type: res.data.ticket.tierName,
                    event: res.data.ticket.eventTitle
                });
                const scan = { id, timestamp: new Date().toISOString(), status: 'SUCCESS' };
                setHistory([scan, ...history]);
                setTicketId('');
            } else {
                setStatus('error');
                setScanResult({ message: res.data.message || 'Invalid Ticket' });
            }
        } catch (error: any) {
            console.error("Validation failed", error);
            setStatus('error');
            setScanResult({ message: error.response?.data?.message || 'Validation error. Please try again.' });
        }
    };

    const syncOffline = async () => {
        if (offlineQueue.length === 0) return;
        setStatus('validating');
        try {
            await OrganizerService.syncLogs(offlineQueue);
            setOfflineQueue([]);
            localStorage.removeItem('offline_scans');
            toast.success(`${offlineQueue.length} scans synchronized successfully!`);
        } catch (error) {
            console.error("Sync failed", error);
            toast.error("Failed to synchronize scans.");
        } finally {
            setStatus('idle');
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader
                title="Ticket Validator"
                subtitle="Validate entry for your event. Supports real-time and offline scanning."
                actions={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isOnline ? '#10B981' : '#EF4444', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700 }}>
                            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                            {isOnline ? 'Network Online' : 'Offline Mode'}
                        </div>
                        {offlineQueue.length > 0 && (
                            <button onClick={syncOffline} className="btn-blue" style={{ background: '#FBBF24', color: 'black' }}>
                                <RefreshCw size={16} className={status === 'validating' ? 'animate-spin' : ''} /> Sync {offlineQueue.length} Scans
                            </button>
                        )}
                    </div>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Scanner Input Area */}
                    <div className="stat-card" style={{ padding: '48px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                        <AnimatePresence mode="wait">
                            {status === 'idle' || status === 'validating' ? (
                                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <div style={{ width: '120px', height: '120px', background: 'rgba(29, 144, 245, 0.1)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                                        <Maximize size={48} color="#1D90F5" className={status === 'validating' ? 'animate-pulse' : ''} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '16px' }}>Ready to Scan</h3>
                                    <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto 32px' }}>Enter ticket ID manually below or use the mobile scanner app for QR codes.</p>

                                    <div style={{ display: 'flex', gap: '12px', maxWidth: '400px', margin: '0 auto' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                type="text"
                                                placeholder="Enter Ticket ID..."
                                                value={ticketId}
                                                onChange={e => setTicketId(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleValidate()}
                                                style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '14px', color: 'white', fontSize: '1rem' }}
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleValidate()}
                                            disabled={status === 'validating'}
                                            className="btn-blue" style={{ height: '54px', padding: '0 24px' }}
                                        >
                                            {status === 'validating' ? <Loader2 size={24} className="animate-spin" /> : <Zap size={20} />}
                                        </button>
                                    </div>
                                </motion.div>
                            ) : status === 'success' ? (
                                <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }} style={{ textAlign: 'center' }}>
                                    <div style={{ width: '100px', height: '100px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                        <CheckCircle2 size={56} color="#10B981" />
                                    </div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', marginBottom: '8px' }}>ACCESS GRANTED</h3>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>{scanResult?.name}</p>

                                    <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', display: 'inline-block', textAlign: 'left' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>TICKET TYPE</p>
                                        <p style={{ fontWeight: 800 }}>{scanResult?.type}</p>
                                    </div>

                                    <div style={{ marginTop: '32px' }}>
                                        <button onClick={() => setStatus('idle')} className="btn-blue" style={{ background: '#161B22', color: 'white', padding: '12px 32px' }}>Next Attendee</button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="error" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
                                    <div style={{ width: '100px', height: '100px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                        <XCircle size={56} color="#EF4444" />
                                    </div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#EF4444', marginBottom: '8px' }}>ACCESS DENIED</h3>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '32px' }}>{scanResult?.message}</p>

                                    <button onClick={() => setStatus('idle')} className="btn-blue" style={{ background: '#161B22', color: 'white', padding: '12px 32px' }}>Try Again</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Scan History */}
                    <div className="stat-card" style={{ padding: '32px', flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <History size={18} color="var(--text-muted)" /> Recent Scans
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {history.map((h, i) => (
                                <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{h.id}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(h.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: h.status === 'SUCCESS' ? '#10B981' : '#FBBF24' }}>
                                        {h.status}
                                    </span>
                                </div>
                            ))}
                            {history.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No scans recorded in this session.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
