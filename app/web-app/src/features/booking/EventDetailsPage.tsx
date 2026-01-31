import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../../core/api/booking.service';
import type { EventForBooking } from '../../core/api/booking.service';
import { useToast } from '../../core/components/Toast';
import './EventDetailsPage.css';

const EventDetailsPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [event, setEvent] = useState<EventForBooking | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);

    const androidAppUrl = import.meta.env.VITE_ANDROID_APP_URL || '';
    const iosAppUrl = import.meta.env.VITE_IOS_APP_URL || '';

    useEffect(() => {
        const loadEvent = async () => {
            if (!eventId) return;

            try {
                setLoading(true);
                const eventData = await bookingService.getEventForBooking(parseInt(eventId));
                setEvent(eventData);
            } catch (error: any) {
                showToast(error.error || 'Failed to load event', 'error');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        loadEvent();
    }, [eventId, navigate, showToast]);

    const handleGetTickets = () => {
        if (event) {
            setShowDownloadPrompt(true);
        }
    };

    if (loading) {
        return (
            <div className="event-details-page loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading event details...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="event-details-page error">
                <h2>Event Not Found</h2>
                <p>The event you're looking for is not available.</p>
                <button onClick={() => navigate('/')} className="btn-primary">
                    Browse Events
                </button>
            </div>
        );
    }

    const lowestPrice = Math.min(...event.tiers.map(t => t.price));
    const totalAvailable = event.tiers.reduce((sum, t) => sum + t.available, 0);

    return (
        <div className="event-details-page">
            {/* Hero Section */}
            <div className="event-hero">
                {event.coverImage ? (
                    <img src={event.coverImage} alt={event.title} className="hero-image" />
                ) : (
                    <div className="hero-placeholder">
                        <span className="hero-icon">🎫</span>
                    </div>
                )}
                <div className="hero-overlay">
                    <div className="container">
                        <div className="hero-content">
                            <h1 className="event-title">{event.title}</h1>
                                    <div className="event-meta">
                                <span className="meta-item">
                                    <span className="meta-icon">📍</span>
                                    {event.venue}, {event.city?.name || event.city}
                                </span>
                                <span className="meta-item">
                                    <span className="meta-icon">📅</span>
                                    {new Date(event.dateTime).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                                <span className="meta-item">
                                    <span className="meta-icon">🕐</span>
                                    {new Date(event.dateTime).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="event-content">
                <div className="container">
                    <div className="content-grid">
                        {/* Main Content */}
                        <div className="main-content">
                            {/* Description */}
                            <section className="content-section">
                                <h2>About This Event</h2>
                                <p className="event-description">{event.description}</p>
                            </section>

                            {/* Ticket Tiers */}
                            <section className="content-section">
                                <h2>Ticket Options</h2>
                                <div className="tier-list">
                                    {event.tiers.map((tier) => (
                                        <div key={tier.id} className="tier-card">
                                            <div className="tier-info">
                                                <h3 className="tier-name">{tier.name}</h3>
                                                {tier.description && <p className="tier-description">{tier.description}</p>}
                                                <div className="tier-availability">
                                                    {tier.available > 0 ? (
                                                        <span className="available">
                                                            {tier.available} tickets available
                                                        </span>
                                                    ) : (
                                                        <span className="sold-out">Sold Out</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="tier-price">
                                                <span className="price-label">From</span>
                                                <span className="price-amount">ETB {tier.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Event Details */}
                            <section className="content-section">
                                <h2>Event Information</h2>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Category</span>
                                        <span className="info-value">{event.category?.name || event.category}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Event Type</span>
                                        <span className="info-value">
                                            {event.eventType === 'SEAT_MAP' ? 'Assigned Seating' : 'General Admission'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Venue</span>
                                        <span className="info-value">{event.venue}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Location</span>
                                        <span className="info-value">{event.city?.name || event.city}</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar */}
                        <aside className="sidebar">
                            <div className="booking-card">
                                <div className="booking-header">
                                    <h3>Get Your Tickets</h3>
                                    <p className="price-from">From ETB {lowestPrice.toFixed(2)}</p>
                                </div>

                                <div className="booking-info">
                                    <div className="info-row">
                                        <span className="info-icon">📅</span>
                                        <div className="info-text">
                                            <span className="info-label">Date & Time</span>
                                            <span className="info-value">
                                                {new Date(event.dateTime).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })} at {new Date(event.dateTime).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="info-row">
                                        <span className="info-icon">📍</span>
                                        <div className="info-text">
                                            <span className="info-label">Location</span>
                                            <span className="info-value">{event.venue}, {event.city?.name || event.city}</span>
                                        </div>
                                    </div>

                                    <div className="info-row">
                                        <span className="info-icon">🎫</span>
                                        <div className="info-text">
                                            <span className="info-label">Availability</span>
                                            <span className="info-value">
                                                {totalAvailable > 0 ? `${totalAvailable} tickets available` : 'Sold Out'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="btn-get-tickets"
                                    onClick={handleGetTickets}
                                    disabled={totalAvailable === 0}
                                >
                                    {totalAvailable > 0 ? 'Get Tickets' : 'Sold Out'}
                                </button>

                                <div className="secure-notice">
                                    <span className="secure-icon">🔒</span>
                                    <span className="secure-text">Secure payment via Chapa</span>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {showDownloadPrompt && (
                <div className="download-modal" role="dialog" aria-modal="true">
                    <div className="download-modal-card">
                        <h3>Get tickets in the mobile app</h3>
                        <p>For ticket purchases and QR entry, please download the ET-TICKETS app.</p>
                        <div className="download-actions">
                            <a
                                className={`download-btn ${!androidAppUrl ? 'disabled' : ''}`}
                                href={androidAppUrl || undefined}
                                target={androidAppUrl ? '_blank' : undefined}
                                rel={androidAppUrl ? 'noreferrer' : undefined}
                                onClick={(e) => {
                                    if (!androidAppUrl) e.preventDefault();
                                }}
                            >
                                Android
                            </a>
                            <a
                                className={`download-btn ${!iosAppUrl ? 'disabled' : ''}`}
                                href={iosAppUrl || undefined}
                                target={iosAppUrl ? '_blank' : undefined}
                                rel={iosAppUrl ? 'noreferrer' : undefined}
                                onClick={(e) => {
                                    if (!iosAppUrl) e.preventDefault();
                                }}
                            >
                                iOS
                            </a>
                        </div>
                        <button className="download-close" onClick={() => setShowDownloadPrompt(false)}>
                            Not now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDetailsPage;
