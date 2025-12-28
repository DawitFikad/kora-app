import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ticketService } from '../../core/api/ticket.service';
import type { Ticket } from '../../core/api/ticket.service';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyTicketsPage: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const data = await ticketService.getMyTickets();
                setTickets(data);
            } catch (error) {
                console.error("Failed to load tickets", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0B0E14', color: 'white' }}>
                <div className="spinner"></div> Loading tickets...
            </div>
        );
    }

    return (
        <div style={{ background: '#0B0E14', minHeight: '100vh', padding: '40px 20px', color: 'white' }}>
            <header style={{ maxWidth: '800px', margin: '0 auto 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>My Tickets</h1>
                <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }}>Back to Home</button>
            </header>

            {tickets.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '100px', color: '#8E9BAE' }}>
                    <h2>No tickets found.</h2>
                    <p>Tickets you purchase will appear here.</p>
                </div>
            ) : (
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {tickets.map((ticket) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={ticket.id}
                            style={{
                                background: '#161B22',
                                border: '1px solid #2D3748',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'stretch'
                            }}
                        >
                            <div style={{ padding: '24px', flex: 1, minWidth: '300px', borderRight: '1px dashed #2D3748' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ background: 'rgba(29, 144, 245, 0.1)', color: '#1D90F5', padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700 }}>{ticket.tier.name}</span>
                                    <span style={{ color: ticket.status === 'VALID' ? '#48BB78' : '#F56565', fontWeight: 700 }}>{ticket.status}</span>
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px' }}>{ticket.event.title}</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#A0AEC0', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={16} />
                                        {new Date(ticket.event.dateTime).toLocaleString()}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={16} />
                                        {ticket.event.venue}
                                    </div>
                                    {ticket.seatNumber && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Tag size={16} />
                                            Seat: <span style={{ color: 'white', fontWeight: 700 }}>{ticket.seatNumber}</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #2D3748' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#718096' }}>Ticket ID: {ticket.ticketCode || ticket.id?.substring(0, 8).toUpperCase()}</p>
                                </div>
                            </div>

                            <div style={{ background: 'white', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '200px', flex: '0 0 auto', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                                <QRCodeSVG value={ticket.qrPayload} size={150} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTicketsPage;
