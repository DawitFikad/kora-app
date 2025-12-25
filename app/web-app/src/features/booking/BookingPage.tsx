import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    bookingService,
    EventForBooking,
    PriceBreakdown,
    SeatStatus
} from '../../core/api/booking.service';
import { useToast } from '../../core/components/Toast';
import QuantitySelector from './components/QuantitySelector';
import SeatSelector from './components/SeatSelector';
import TierSelector from './components/TierSelector';
import PriceBreakdownComponent from './components/PriceBreakdownComponent';
import PromoCodeInput from './components/PromoCodeInput';
import CountdownTimer from './components/CountdownTimer';
import './BookingPage.css';

const BookingPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // State
    const [event, setEvent] = useState<EventForBooking | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [seatStatus, setSeatStatus] = useState<SeatStatus[]>([]);
    const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);
    const [lockExpiry, setLockExpiry] = useState<Date | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'select' | 'review' | 'payment'>('select');

    // Load event data
    useEffect(() => {
        const loadEvent = async () => {
            if (!eventId) return;

            try {
                setLoading(true);
                const eventData = await bookingService.getEventForBooking(parseInt(eventId));
                setEvent(eventData);

                // Auto-select first tier if only one exists
                if (eventData.tiers.length === 1) {
                    setSelectedTierId(eventData.tiers[0].id);
                }
            } catch (error: any) {
                showToast(error.error || 'Failed to load event', 'error');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        loadEvent();
    }, [eventId]);

    // Load seat status for SEAT_MAP events
    useEffect(() => {
        const loadSeatStatus = async () => {
            if (!event || !selectedTierId || event.eventType !== 'SEAT_MAP') return;

            try {
                const seats = await bookingService.getSeatStatus(event.id, selectedTierId);
                setSeatStatus(seats);
            } catch (error) {
                console.error('Failed to load seat status:', error);
            }
        };

        loadSeatStatus();
        // Poll for seat updates every 10 seconds
        const interval = setInterval(loadSeatStatus, 10000);
        return () => clearInterval(interval);
    }, [event, selectedTierId]);

    // Calculate price when selections change
    useEffect(() => {
        const calculatePrice = async () => {
            if (!event || !selectedTierId) return;

            const effectiveQuantity = event.eventType === 'SEAT_MAP'
                ? selectedSeats.length
                : quantity;

            if (effectiveQuantity < 1) {
                setPriceBreakdown(null);
                return;
            }

            try {
                const breakdown = await bookingService.calculatePrice(
                    event.id,
                    selectedTierId,
                    effectiveQuantity,
                    promoApplied ? promoCode : undefined
                );
                setPriceBreakdown(breakdown);
            } catch (error) {
                console.error('Failed to calculate price:', error);
            }
        };

        calculatePrice();
    }, [event, selectedTierId, quantity, selectedSeats, promoApplied, promoCode]);

    // Handle promo code application
    const handleApplyPromo = async () => {
        if (!event || !promoCode.trim()) return;

        try {
            const result = await bookingService.validatePromoCode(promoCode.trim(), event.id);
            if (result.valid) {
                setPromoApplied(true);
                showToast('Promo code applied successfully!', 'success');
            } else {
                showToast(result.message || 'Invalid promo code', 'error');
            }
        } catch (error: any) {
            showToast(error.error || 'Failed to validate promo code', 'error');
        }
    };

    // Handle seat selection
    const handleSeatSelect = async (seatNumber: string) => {
        if (selectedSeats.includes(seatNumber)) {
            // Deselect seat
            setSelectedSeats(prev => prev.filter(s => s !== seatNumber));
        } else {
            // Select seat (max 10)
            if (selectedSeats.length >= 10) {
                showToast('Maximum 10 seats per purchase', 'warning');
                return;
            }
            setSelectedSeats(prev => [...prev, seatNumber]);
        }
    };

    // Handle reservation
    const handleReserve = async () => {
        if (!event || !selectedTierId || !priceBreakdown) return;

        const effectiveQuantity = event.eventType === 'SEAT_MAP'
            ? selectedSeats.length
            : quantity;

        if (effectiveQuantity < 1) {
            showToast('Please select at least 1 ticket', 'warning');
            return;
        }

        try {
            setIsProcessing(true);

            const response = await bookingService.createReservation({
                eventId: event.id,
                tierId: selectedTierId,
                quantity: effectiveQuantity,
                seatNumbers: event.eventType === 'SEAT_MAP' ? selectedSeats : undefined,
                promoCode: promoApplied ? promoCode : undefined
            });

            if (response.success) {
                setLockExpiry(response.lockExpiry ? new Date(response.lockExpiry) : null);
                setStep('payment');
                showToast('Reservation created! Please complete payment.', 'success');

                // Navigate to payment with purchase details
                navigate(`/payment/${response.purchaseId}`, {
                    state: {
                        paymentRef: response.paymentRef,
                        priceBreakdown: response.priceBreakdown,
                        event: {
                            title: event.title,
                            dateTime: event.dateTime,
                            venue: event.venue
                        }
                    }
                });
            } else {
                showToast(response.error || 'Failed to create reservation', 'error');
            }
        } catch (error: any) {
            showToast(error.error || 'Reservation failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="booking-page loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading event details...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="booking-page error">
                <h2>Event Not Found</h2>
                <p>The event you're looking for is not available.</p>
                <button onClick={() => navigate('/')} className="btn-primary">
                    Browse Events
                </button>
            </div>
        );
    }

    const selectedTier = event.tiers.find(t => t.id === selectedTierId);
    const effectiveQuantity = event.eventType === 'SEAT_MAP' ? selectedSeats.length : quantity;

    return (
        <div className="booking-page">
            {/* Event Header */}
            <div className="booking-header">
                <div className="event-cover">
                    {event.coverImage ? (
                        <img src={event.coverImage} alt={event.title} />
                    ) : (
                        <div className="placeholder-cover">
                            <span>🎫</span>
                        </div>
                    )}
                    <div className="event-info-overlay">
                        <h1>{event.title}</h1>
                        <div className="event-meta">
                            <span className="meta-item">
                                📍 {event.venue}, {event.city}
                            </span>
                            <span className="meta-item">
                                📅 {new Date(event.dateTime).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                            <span className="meta-item">
                                🕐 {new Date(event.dateTime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Content */}
            <div className="booking-content">
                <div className="booking-main">
                    {/* Tier Selection */}
                    <section className="booking-section">
                        <h2>Select Ticket Type</h2>
                        <TierSelector
                            tiers={event.tiers}
                            selectedTierId={selectedTierId}
                            onSelect={setSelectedTierId}
                        />
                    </section>

                    {/* Quantity or Seat Selection */}
                    {selectedTierId && (
                        <section className="booking-section">
                            {event.eventType === 'SEAT_MAP' ? (
                                <>
                                    <h2>Select Seats</h2>
                                    <p className="section-hint">
                                        Click on available seats to select them. Selected: {selectedSeats.length}
                                    </p>
                                    <SeatSelector
                                        seats={seatStatus}
                                        selectedSeats={selectedSeats}
                                        onSeatSelect={handleSeatSelect}
                                    />
                                </>
                            ) : (
                                <>
                                    <h2>Select Quantity</h2>
                                    <QuantitySelector
                                        quantity={quantity}
                                        maxQuantity={Math.min(10, selectedTier?.available || 0)}
                                        onQuantityChange={setQuantity}
                                    />
                                    {selectedTier && (
                                        <p className="availability-hint">
                                            {selectedTier.available} tickets available
                                        </p>
                                    )}
                                </>
                            )}
                        </section>
                    )}

                    {/* Promo Code */}
                    <section className="booking-section">
                        <h2>Have a Promo Code?</h2>
                        <PromoCodeInput
                            promoCode={promoCode}
                            onPromoCodeChange={setPromoCode}
                            onApply={handleApplyPromo}
                            isApplied={promoApplied}
                            disabled={!selectedTierId || effectiveQuantity < 1}
                        />
                    </section>
                </div>

                {/* Price Breakdown Sidebar */}
                <aside className="booking-sidebar">
                    <div className="price-card">
                        <h3>Order Summary</h3>

                        {selectedTier && effectiveQuantity > 0 ? (
                            <>
                                <div className="order-items">
                                    <div className="order-item">
                                        <span>{selectedTier.name} × {effectiveQuantity}</span>
                                    </div>
                                </div>

                                {priceBreakdown && (
                                    <PriceBreakdownComponent breakdown={priceBreakdown} />
                                )}

                                {lockExpiry && (
                                    <CountdownTimer
                                        expiry={lockExpiry}
                                        onExpire={() => {
                                            showToast('Reservation expired', 'warning');
                                            setStep('select');
                                        }}
                                    />
                                )}

                                <button
                                    className="btn-reserve"
                                    onClick={handleReserve}
                                    disabled={isProcessing || effectiveQuantity < 1}
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="btn-spinner"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        `Reserve & Pay ${priceBreakdown ? `ETB ${priceBreakdown.total.toFixed(2)}` : ''}`
                                    )}
                                </button>
                            </>
                        ) : (
                            <p className="empty-selection">
                                Select a ticket type and quantity to see the price breakdown.
                            </p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default BookingPage;
