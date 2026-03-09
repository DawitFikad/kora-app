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
    const [filters, setFilters] = useState({
        event: 'all',
        customer: '',
        date: '',
        status: 'all'
    });
    const [page, setPage] = useState(1);
    const pageSize = 10;

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
    const normalizedAttendees = attendees.map(a => ({
        ...a,
        dateObj: a.date ? new Date(a.date) : null
    }));

    const filteredAttendees = normalizedAttendees.filter(a => {
        if (normalizedSearch) {
            const name = (a.name || '').toLowerCase();
            const eventName = (a.event || '').toLowerCase();
            const phone = (a.phone || '').toLowerCase();
            if (!name.includes(normalizedSearch) && !eventName.includes(normalizedSearch) && !phone.includes(normalizedSearch)) return false;
        }

        if (filters.event !== 'all' && a.event !== filters.event) return false;
        if (filters.status !== 'all' && a.status !== filters.status) return false;
        if (filters.customer) {
            const customer = filters.customer.toLowerCase();
            const name = (a.name || '').toLowerCase();
            const phone = (a.phone || '').toLowerCase();
            if (!name.includes(customer) && !phone.includes(customer)) return false;
        }
        if (filters.date) {
            if (!a.dateObj) return false;
            const start = new Date(filters.date);
            const end = new Date(filters.date);
            end.setHours(23, 59, 59, 999);
            if (a.dateObj < start || a.dateObj > end) return false;
        }
        return true;
    });

    useEffect(() => {
        setPage(1);
    }, [searchTerm, filters]);

    const totalPages = Math.max(1, Math.ceil(filteredAttendees.length / pageSize));
    const pagedAttendees = filteredAttendees.slice((page - 1) * pageSize, page * pageSize);
    const eventOptions = Array.from(new Set(attendees.map(a => a.event).filter(Boolean)));
    const statusOptions = Array.from(new Set(attendees.map(a => a.status).filter(Boolean)));

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

    const handleExport = () => {
        try {
            const rows = [
                ['Attendee Name', 'Phone', 'Event', 'Ticket Type', 'Ticket ID', 'ET Code', 'Purchase Date', 'Status', 'VIP'],
                ...filteredAttendees.map(person => [
                    person.name || 'Guest',
                    person.phone || '',
                    person.event || '',
                    person.type || '',
                    person.id || '',
                    person.ticketCode || '',
                    person.dateObj ? person.dateObj.toLocaleDateString() : '',
                    person.status || '',
                    person.isVip ? 'Yes' : 'No'
                ])
            ];

            const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendees-${Date.now()}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Attendees exported');
        } catch (error) {
            console.error('Failed to export attendees', error);
            toast.error('Failed to export attendees');
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
                        <button
                            onClick={handleExport}
                            className="btn-blue"
                            style={{ background: 'var(--bg-active)', color: 'white', padding: '10px 20px' }}
                        >
                            <Download size={16} /> Export List
                        </button>
                    </div>
                </div>
                <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
                        <select
                            value={filters.event}
                            onChange={(e) => setFilters(prev => ({ ...prev, event: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        >
                            <option value="all">All Events</option>
                            {eventOptions.map((event) => (
                                <option key={event} value={event}>{event}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Customer name or phone"
                            value={filters.customer}
                            onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        />
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        />
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                        >
                            <option value="all">All Statuses</option>
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setFilters({ event: 'all', customer: '', date: '', status: 'all' })}
                            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, gridColumn: 'span 4' }}
                        >
                            Reset Filters
                        </button>
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
                                <th>Ticket ID</th>
                                <th>ET Code</th>
                                <th>Purchase Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAttendees.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No attendees found matching your search.</td>
                                </tr>
                            ) : (
                                pagedAttendees.map((person) => (
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
                                        <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{person.id || '—'}</td>
                                        <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem' }}>{person.ticketCode || '—'}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{person.dateObj ? person.dateObj.toLocaleDateString() : '—'}</td>
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Page {page} of {totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 700, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
