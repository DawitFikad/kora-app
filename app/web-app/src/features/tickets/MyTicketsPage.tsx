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
                                borderRadius: '24px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'stretch',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div style={{ padding: '28px', flex: '1 1 400px', borderRight: '1px dashed #2D3748' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                    <span style={{ background: 'rgba(29, 144, 245, 0.12)', color: '#1D90F5', padding: '6px 14px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800 }}>{ticket.tier.name}</span>
                                    <span style={{
                                        color: ticket.status === 'VALID' ? '#4ADE80' : '#F87171',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '20px', color: 'white', lineHeight: 1.2 }}>{ticket.event.title}</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: '#94A3B8', fontSize: '0.95rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Calendar size={18} color="#94A3B8" />
                                        </div>
                                        {new Date(ticket.event.dateTime).toLocaleString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MapPin size={18} color="#94A3B8" />
                                        </div>
                                        {ticket.event.venue}
                                    </div>
                                    {ticket.seatNumber && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Tag size={18} color="#94A3B8" />
                                            </div>
                                            Seat: <span style={{ color: 'white', fontWeight: 800 }}>{ticket.seatNumber}</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>TICKET ID: <span style={{ color: '#94A3B8' }}>{ticket.ticketCode || ticket.id?.substring(0, 8).toUpperCase()}</span></p>
                                </div>
                            </div>

                            <div style={{
                                background: 'white',
                                padding: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '240px',
                                flex: '1 1 200px',
                                borderLeft: '1px dashed #E2E8F0'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <QRCodeSVG value={ticket.qrPayload} size={160} level="H" />
                                    <p style={{ marginTop: '16px', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>SCAN AT ENTRY</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTicketsPage;
