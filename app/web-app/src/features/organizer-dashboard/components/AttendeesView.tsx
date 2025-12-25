import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { PageHeader } from './PageHeader';

export const AttendeesView = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Attendees" subtitle="Track and manage all ticket holders for your events." />

            <div className="stat-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Attendee List</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-blue" style={{ background: '#161B22', color: 'white', padding: '8px 16px' }}><Download size={16} /> Export List</button>
                    </div>
                </div>
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
                        {[
                            { name: 'Dawit Solomon', event: 'Summer Music Fest', type: 'VIP', date: 'Dec 12, 2024', status: 'Checked In' },
                            { name: 'Helen Tilahun', event: 'Tech Networking', type: 'GA', date: 'Dec 14, 2024', status: 'Pending' },
                            { name: 'Yonas Gebre', event: 'Summer Music Fest', type: 'GA', date: 'Dec 15, 2024', status: 'Checked In' },
                            { name: 'Marta Alemu', event: 'Gospel Concert', type: 'VIP', date: 'Dec 18, 2024', status: 'Pending' },
                        ].map((person, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 800 }}>{person.name}</td>
                                <td style={{ fontWeight: 600 }}>{person.event}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{person.type}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{person.date}</td>
                                <td><span className={`pill ${person.status === 'Checked In' ? 'pill-green' : 'pill-blue'}`}>{person.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};
