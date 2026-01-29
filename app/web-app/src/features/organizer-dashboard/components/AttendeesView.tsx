import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Loader2, Mail, MessageSquare, Star } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';
import { useToast } from '../../../core/components/Toast';

export const AttendeesView = ({ searchQuery = '' }: { searchQuery?: string }) => {
    const toast = useToast();
    const [attendees, setAttendees] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        const fetchAttendees = async () => {
            try {
                const response = await OrganizerService.getAttendees();
                setAttendees((response as any)?.data?.data || (response as any)?.data || []);
            } catch (error) {
                console.error("Failed to fetch attendees", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendees();
    }, []);

    useEffect(() => {
        setSearchTerm(searchQuery);
    }, [searchQuery]);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredAttendees = attendees.filter(a => {
        if (!normalizedSearch) return true;
        const name = (a.name || '').toLowerCase();
        const eventName = (a.event || '').toLowerCase();
        const phone = (a.phone || '').toLowerCase();
        return name.includes(normalizedSearch) || eventName.includes(normalizedSearch) || phone.includes(normalizedSearch);
    });

    const handleResend = async (ticketId: string, channel: 'SMS' | 'EMAIL') => {
        try {
            setProcessing(ticketId);
            await OrganizerService.resendTicket(ticketId, channel);
            toast.success(`Ticket resent via ${channel}`);
        } catch (error: any) {
            toast.error(error?.message || `Failed to resend via ${channel}`);
        } finally {
            setProcessing(null);
        }
    };

    const handleCheckIn = async (ticketId: string) => {
        try {
            setProcessing(ticketId);
            await OrganizerService.manualCheckIn(ticketId);
            setAttendees(prev => prev.map(a => a.id === ticketId ? { ...a, status: 'Used' } : a));
            toast.success('Manual check-in successful');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to check in');
        } finally {
            setProcessing(null);
        }
    };

    const handleVipToggle = async (ticketId: string, isVip: boolean) => {
        try {
            setProcessing(ticketId);
            await OrganizerService.tagVip(ticketId, isVip);
            setAttendees(prev => prev.map(a => a.id === ticketId ? { ...a, isVip } : a));
            toast.success(isVip ? 'Marked as VIP' : 'VIP removed');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to update VIP');
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 className="animate-spin" size={48} color="var(--bg-active)" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Attendees" subtitle="Track and manage all ticket holders for your events." />

            <style>{`
                .attendee-action {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 10px;
                    border-radius: 10px;
                    font-size: 0.72rem;
                    font-weight: 700;
                    border: 1px solid var(--border);
                    background: var(--bg-subtle);
                    color: var(--text-main);
                    cursor: pointer;
                }
                .attendee-action.primary {
                    background: rgba(29, 144, 245, 0.12);
                    border-color: rgba(29, 144, 245, 0.35);
                    color: #1D90F5;
                }
                .attendee-action.success {
                    background: rgba(16, 185, 129, 0.12);
                    border-color: rgba(16, 185, 129, 0.35);
                    color: #10B981;
                }
                .attendee-action.warn {
                    background: rgba(245, 158, 11, 0.12);
                    border-color: rgba(245, 158, 11, 0.35);
                    color: #F59E0B;
                }
                .attendee-action:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>

            <div className="stat-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <input
                            type="text"
                            placeholder="Search by name, event, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-blue" style={{ background: 'var(--bg-active)', color: 'white', padding: '10px 20px' }}><Download size={16} /> Export List</button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="event-table">
                        <thead>
                            <tr>
                                <th>Attendee Name</th>
                                <th>Phone</th>
                                <th>Event</th>
                                <th>Ticket Type</th>
                                <th>Purchase Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAttendees.map((person) => (
                                <tr key={person.id}>
                                    <td style={{ fontWeight: 800 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{person.name}</span>
                                            {person.isVip && (
                                                <span style={{ padding: '4px 8px', fontSize: '0.65rem', fontWeight: 800, borderRadius: '999px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.35)' }}>VIP</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{person.phone || '—'}</td>
                                    <td style={{ fontWeight: 600 }}>{person.event}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{person.type}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{new Date(person.date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`pill ${person.status === 'Used' ? 'pill-green' : person.status === 'Refunded' ? 'pill-red' : 'pill-blue'}`}>{person.status}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button
                                                className="attendee-action primary"
                                                disabled={processing === person.id}
                                                onClick={() => handleResend(person.id, 'SMS')}
                                            >
                                                <MessageSquare size={12} /> Resend SMS
                                            </button>
                                            <button
                                                className="attendee-action primary"
                                                disabled={processing === person.id}
                                                onClick={() => handleResend(person.id, 'EMAIL')}
                                            >
                                                <Mail size={12} /> Resend Email
                                            </button>
                                            <button
                                                className="attendee-action success"
                                                disabled={processing === person.id || person.status === 'Used' || person.status === 'Refunded'}
                                                onClick={() => handleCheckIn(person.id)}
                                            >
                                                <CheckCircle size={12} /> Manual Check-in
                                            </button>
                                            <button
                                                className="attendee-action warn"
                                                disabled={processing === person.id}
                                                onClick={() => handleVipToggle(person.id, !person.isVip)}
                                            >
                                                <Star size={12} /> {person.isVip ? 'VIP' : 'Tag VIP'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredAttendees.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No attendees found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};
