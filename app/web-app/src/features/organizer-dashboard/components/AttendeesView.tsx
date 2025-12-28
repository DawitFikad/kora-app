import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { OrganizerService } from '../../../core/api/organizer.service';

export const AttendeesView = () => {
    const [attendees, setAttendees] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendees = async () => {
            try {
                const response = await OrganizerService.getAttendees();
                setAttendees(response.data);
            } catch (error) {
                console.error("Failed to fetch attendees", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendees();
    }, []);

    const filteredAttendees = attendees.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.event.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            <div className="stat-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <input
                            type="text"
                            placeholder="Search by name or event..."
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
                                <th>Event</th>
                                <th>Ticket Type</th>
                                <th>Purchase Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAttendees.map((person) => (
                                <tr key={person.id}>
                                    <td style={{ fontWeight: 800 }}>{person.name}</td>
                                    <td style={{ fontWeight: 600 }}>{person.event}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{person.type}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{new Date(person.date).toLocaleDateString()}</td>
                                    <td><span className={`pill ${person.status === 'Checked In' ? 'pill-green' : 'pill-blue'}`}>{person.status}</span></td>
                                </tr>
                            ))}
                            {filteredAttendees.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No attendees found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};
