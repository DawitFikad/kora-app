import { useState, useEffect, useMemo, useRef } from 'react';
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
    Loader2,
    Users,
    Shield,
    AlertTriangle,
    Activity
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useToast } from '../../../core/components/Toast';
import { useAuth } from '../../../core/context/AuthContext';

export const ScannerView = () => {
    const toast = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [ticketId, setTicketId] = useState('');
    const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error' | 'duplicate'>('idle');
    const [scanResult, setScanResult] = useState<any>(null);
    const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [gateId, setGateId] = useState('Gate A');
    const [deviceId, setDeviceId] = useState('');
    const [cameraOn, setCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const readerRef = useRef<any>(null);

    // Live attendance metrics
    const [attendanceStats, setAttendanceStats] = useState({
        totalScans: 0,
        successfulScans: 0,
        failedScans: 0,
        duplicateScans: 0
    });

    // Duplicate detection state
    const [scannedTickets, setScannedTickets] = useState<Set<string>>(new Set());
    const [pendingOverride, setPendingOverride] = useState<string | null>(null);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Load offline queue and scanned tickets
        const saved = localStorage.getItem('offline_scans');
        const scanned = localStorage.getItem('scanned_tickets');
        if (saved) setOfflineQueue(JSON.parse(saved));
        if (scanned) setScannedTickets(new Set(JSON.parse(scanned)));

        const savedDeviceId = localStorage.getItem('scanner_device_id');
        if (savedDeviceId) {
            setDeviceId(savedDeviceId);
        } else {
            const newId = `SCAN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
            localStorage.setItem('scanner_device_id', newId);
            setDeviceId(newId);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await OrganizerService.getMyEvents();
                const data = (res as any)?.data?.data || (res as any)?.data || [];
                setEvents(Array.isArray(data) ? data : []);
            } catch {
                setEvents([]);
            }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        return () => {
            if (readerRef.current) {
                try { readerRef.current.reset(); } catch { /* noop */ }
            }
        };
    }, []);

    const gateOptions = useMemo(() => ['Gate A', 'Gate B', 'Gate C', 'VIP Gate'], []);

    const handleValidate = async (id: string = ticketId, isOverride: boolean = false) => {
        if (!id) return;

        // Check for duplicates
        if (!isOverride && scannedTickets.has(id)) {
            setStatus('duplicate');
            setScanResult({
                message: 'This ticket has already been scanned!',
                ticketId: id,
                isDuplicate: true
            });
            setPendingOverride(id);
            setAttendanceStats(prev => ({
                ...prev,
                totalScans: prev.totalScans + 1,
                duplicateScans: prev.duplicateScans + 1
            }));
            return;
        }

        setStatus('validating');

        if (!isOnline) {
            if (!selectedEventId) {
                toast.error('Select an event before offline scanning.');
                setStatus('idle');
                return;
            }
            const scan = {
                id: Date.now(),
                ticketId: id,
                eventId: Number(selectedEventId),
                scannedAt: new Date().toISOString(),
                gateId,
                deviceId,
                status: 'PENDING_SYNC',
                isOverride
            };
            const newQueue = [...offlineQueue, scan];
            setOfflineQueue(newQueue);
            localStorage.setItem('offline_scans', JSON.stringify(newQueue));

            setStatus('success');
            setScanResult({ name: 'Saved Offline', type: 'Caching Mode', message: 'Scan cached for sync' });
            addToHistory({ id, timestamp: new Date().toISOString(), status: 'PENDING_SYNC', gateId });
            addScannedTicket(id);
            setTicketId('');
            setAttendanceStats(prev => ({
                ...prev,
                totalScans: prev.totalScans + 1,
                successfulScans: prev.successfulScans + 1
            }));
            return;
        }

        try {
            const result = await OrganizerService.validateTicket(id, gateId) as any;
            if (result && result.success) {
                setStatus('success');
                setScanResult({
                    name: result.ticket.userName || 'Attendee',
                    type: result.ticket.tierName,
                    event: result.ticket.eventTitle || 'Event',
                    isOverride,
                    gateId
                });
                addToHistory({ id, timestamp: new Date().toISOString(), status: 'SUCCESS', isOverride, gateId });
                addScannedTicket(id);
                setTicketId('');
                setPendingOverride(null);
                setAttendanceStats(prev => ({
                    ...prev,
                    totalScans: prev.totalScans + 1,
                    successfulScans: prev.successfulScans + 1
                }));
            } else {
                setStatus('error');
                setScanResult({ message: result?.message || 'Invalid Ticket Response' });
                setAttendanceStats(prev => ({
                    ...prev,
                    totalScans: prev.totalScans + 1,
                    failedScans: prev.failedScans + 1
                }));
            }
        } catch (error: any) {
            console.error("Validation failed", error);
            setStatus('error');
            const msg = error.message || error.error || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Validation error. Please try again.';
            setScanResult({ message: msg });
            addToHistory({ id, timestamp: new Date().toISOString(), status: 'ERROR', gateId });
            setAttendanceStats(prev => ({
                ...prev,
                totalScans: prev.totalScans + 1,
                failedScans: prev.failedScans + 1
            }));
        }
    };

    const addScannedTicket = (id: string) => {
        const updated = new Set(scannedTickets);
        updated.add(id);
        setScannedTickets(updated);
        localStorage.setItem('scanned_tickets', JSON.stringify(Array.from(updated)));
    };

    const addToHistory = (scan: any) => {
        setHistory([scan, ...history].slice(0, 50)); // Keep last 50 scans
    };

    const handleAdminOverride = () => {
        if (!isAdmin || !pendingOverride) {
            toast.error('Only admins can override duplicate scans');
            return;
        }
        toast.info('Admin override applied - scanning duplicate ticket');
        handleValidate(pendingOverride, true);
    };

    const syncOffline = async () => {
        if (offlineQueue.length === 0) return;
        setStatus('validating');
        try {
            const normalizedLogs = offlineQueue.map((log: any) => ({
                id: log.id || Date.now(),
                ticketId: log.ticketId || log.qrPayload,
                eventId: log.eventId || Number(selectedEventId),
                scannedAt: log.scannedAt || log.timestamp,
                gateId: log.gateId || gateId,
                deviceId: log.deviceId || deviceId
            }));
            await OrganizerService.syncLogs(normalizedLogs);
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

    const startCamera = async () => {
        try {
            setCameraError(null);
            const { BrowserMultiFormatReader } = await import('@zxing/browser');
            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;
            setCameraOn(true);
            await reader.decodeFromVideoDevice(undefined, videoRef.current as HTMLVideoElement, (result, err) => {
                if (result) {
                    handleValidate(result.getText());
                }
                if (err && err.name === 'NotFoundException') {
                    // ignore no QR found
                }
            });
        } catch (error: any) {
            setCameraError(error?.message || 'Camera access failed');
            setCameraOn(false);
        }
    };

    const stopCamera = () => {
        if (readerRef.current) {
            try { readerRef.current.reset(); } catch { /* noop */ }
        }
        setCameraOn(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader
                title="Ticket Validation & Entry Management"
                subtitle="Validate entry with real-time attendance tracking and duplicate detection"
                actions={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(29,144,245,0.08)', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            <Shield size={14} /> {user?.role === 'SCANNER' ? 'Scanner Mode' : 'Organizer Mode'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isOnline ? '#10B981' : '#EF4444', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700 }}>
                            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                            {isOnline ? 'Online' : 'Offline Mode'}
                        </div>
                        {offlineQueue.length > 0 && (
                            <button onClick={syncOffline} className="btn-blue" style={{ background: '#FBBF24', color: 'black' }}>
                                <RefreshCw size={16} className={status === 'validating' ? 'animate-spin' : ''} /> Sync {offlineQueue.length}
                            </button>
                        )}
                    </div>
                }
            />

            {/* Live Attendance Counter */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="stat-card"
                    style={{ padding: '20px', background: 'linear-gradient(135deg, #1D90F5 0%, #1570C9 100%)', color: 'white' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Users size={20} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.9 }}>Total Scans</span>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 900 }}>{attendanceStats.totalScans}</p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="stat-card"
                    style={{ padding: '20px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <CheckCircle2 size={20} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.9 }}>Successful</span>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 900 }}>{attendanceStats.successfulScans}</p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="stat-card"
                    style={{ padding: '20px', background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', color: 'white' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <XCircle size={20} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.9 }}>Failed</span>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 900 }}>{attendanceStats.failedScans}</p>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="stat-card"
                    style={{ padding: '20px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <AlertTriangle size={20} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.9 }}>Duplicates</span>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 900 }}>{attendanceStats.duplicateScans}</p>
                </motion.div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Event & Gate Selection */}
                    <div className="stat-card" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Event</label>
                            <select
                                className="scanner-select"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)' }}
                            >
                                <option value="">Select event</option>
                                {events.map((e: any) => (
                                    <option key={e.id} value={e.id}>{e.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Gate</label>
                            <select
                                className="scanner-select"
                                value={gateId}
                                onChange={(e) => setGateId(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)' }}
                            >
                                {gateOptions.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Device ID</label>
                            <input
                                value={deviceId}
                                onChange={(e) => setDeviceId(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>
                    {/* Scanner Input Area */}
                    <div className="stat-card" style={{ padding: '48px', textAlign: 'center', minHeight: '450px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                        <AnimatePresence mode="wait">
                            {status === 'idle' || status === 'validating' ? (
                                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <div style={{ width: '120px', height: '120px', background: 'rgba(29, 144, 245, 0.1)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                                        <Maximize size={48} color="#1D90F5" className={status === 'validating' ? 'animate-pulse' : ''} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '16px' }}>Ready to Scan</h3>
                                    <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto 32px' }}>
                                        Scan QR codes or enter ticket ID manually. Duplicate detection is active.
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px', margin: '0 auto' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            {!cameraOn ? (
                                                <button
                                                    onClick={startCamera}
                                                    className="btn-blue"
                                                    style={{ background: 'rgba(29,144,245,0.15)', color: '#1D90F5', border: '1px solid rgba(29,144,245,0.3)' }}
                                                >
                                                    Start Camera Scan
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={stopCamera}
                                                    className="btn-blue"
                                                    style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
                                                >
                                                    Stop Camera
                                                </button>
                                            )}
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mobile camera QR supported</span>
                                        </div>
                                        {cameraOn && (
                                            <div style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                                                <video ref={videoRef} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        {cameraError && (
                                            <div style={{ fontSize: '0.8rem', color: '#EF4444' }}>{cameraError}</div>
                                        )}
                                        <div style={{ position: 'relative', width: '100%' }}>
                                            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                type="text"
                                                placeholder="Enter Ticket ID..."
                                                value={ticketId}
                                                onChange={e => setTicketId(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleValidate()}
                                                style={{
                                                    width: '100%',
                                                    height: '54px',
                                                    padding: '0 16px 0 48px',
                                                    background: 'var(--bg-subtle)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '12px',
                                                    color: 'var(--text-main)',
                                                    fontSize: '1rem',
                                                    fontWeight: 500,
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
                                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleValidate()}
                                            disabled={status === 'validating'}
                                            className="btn-blue"
                                            style={{ height: '54px', width: '100%', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            {status === 'validating' ? <Loader2 size={24} className="animate-spin" /> : <><Zap size={20} /> Validate Ticket</>}
                                        </button>
                                    </div>
                                </motion.div>
                            ) : status === 'duplicate' ? (
                                <motion.div key="duplicate" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', width: '100%' }}>
                                    <div style={{ width: '100px', height: '100px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                        <AlertTriangle size={56} color="#F59E0B" />
                                    </div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B', marginBottom: '8px' }}>DUPLICATE DETECTED</h3>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>{scanResult?.message}</p>

                                    <div style={{ padding: '16px 24px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', marginBottom: '24px', border: '1px solid #F59E0B' }}>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>This ticket was already scanned</p>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace' }}>{scanResult?.ticketId}</p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => setStatus('idle')}
                                            className="btn-blue"
                                            style={{ background: 'var(--bg-sidebar)', color: 'var(--text-main)', padding: '12px 24px' }}
                                        >
                                            Cancel
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={handleAdminOverride}
                                                className="btn-blue"
                                                style={{ background: '#F59E0B', color: 'white', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <Shield size={16} />
                                                Admin Override
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ) : status === 'success' ? (
                                <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }} style={{ textAlign: 'center' }}>
                                    <div style={{ width: '100px', height: '100px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                        <CheckCircle2 size={56} color="#10B981" />
                                    </div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', marginBottom: '8px' }}>
                                        {scanResult?.isOverride ? 'OVERRIDE GRANTED' : 'ACCESS GRANTED'}
                                    </h3>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>{scanResult?.name}</p>

                                    <div style={{ padding: '16px 24px', background: 'var(--bg-subtle)', borderRadius: '16px', display: 'inline-block', textAlign: 'left' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>TICKET TYPE</p>
                                        <p style={{ fontWeight: 800 }}>{scanResult?.type}</p>
                                    </div>

                                    {scanResult?.isOverride && (
                                        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: '1px solid #F59E0B' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#F59E0B', fontSize: '0.85rem', fontWeight: 700 }}>
                                                <Shield size={16} />
                                                Admin Override Applied
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '32px' }}>
                                        <button onClick={() => setStatus('idle')} className="btn-blue" style={{ background: 'var(--bg-sidebar)', color: 'var(--text-main)', padding: '12px 32px' }}>Next Attendee</button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="error" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
                                    <div style={{ width: '100px', height: '100px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                        <XCircle size={56} color="#EF4444" />
                                    </div>
                                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#EF4444', marginBottom: '8px' }}>ACCESS DENIED</h3>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '32px' }}>{scanResult?.message}</p>

                                    <button onClick={() => setStatus('idle')} className="btn-blue" style={{ background: 'var(--bg-sidebar)', color: 'var(--text-main)', padding: '12px 32px' }}>Try Again</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Scan History */}
                    <div className="stat-card" style={{ padding: '24px', flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <History size={18} color="var(--text-muted)" /> Recent Scans
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                            {history.map((h, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: '14px',
                                        background: 'var(--bg-subtle)',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{h.id}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(h.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            color: h.status === 'SUCCESS' ? '#10B981' : h.status === 'PENDING_SYNC' ? '#FBBF24' : '#EF4444',
                                            padding: '4px 8px',
                                            background: h.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : h.status === 'PENDING_SYNC' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            borderRadius: '6px'
                                        }}>
                                            {h.status}
                                        </span>
                                        {h.isOverride && (
                                            <span style={{ fontSize: '0.65rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Shield size={10} /> Override
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                    <p style={{ fontSize: '0.85rem' }}>No scans recorded yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
