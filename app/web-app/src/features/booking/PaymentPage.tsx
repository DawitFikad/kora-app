import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { paymentService } from '../../core/api/payment.service';
import { bookingService } from '../../core/api/booking.service';
import { useToast } from '../../core/components/Toast';
import PriceBreakdownComponent from './components/PriceBreakdownComponent';
import CountdownTimer from './components/CountdownTimer';
import './PaymentPage.css';

interface PaymentPageState {
    paymentRef: string;
    priceBreakdown: any;
    event: {
        title: string;
        dateTime: string;
        venue: string;
    };
}

const PaymentPage: React.FC = () => {
    const { purchaseId } = useParams<{ purchaseId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // State from navigation or defaults
    const [state, setState] = useState<PaymentPageState | null>(
        location.state as PaymentPageState || null
    );

    const [isProcessing, setIsProcessing] = useState(false);
    const [lockExpiry, setLockExpiry] = useState<Date | null>(null);

    useEffect(() => {
        const loadPurchase = async () => {
            if (!purchaseId) return;

            // If we have state from navigation, use it initially
            if (!state) {
                try {
                    const data = await bookingService.getPurchase(parseInt(purchaseId));
                    setState({
                        paymentRef: data.paymentRef,
                        priceBreakdown: data.priceBreakdown,
                        event: {
                            title: data.event.title,
                            dateTime: data.event.dateTime,
                            venue: data.event.venue
                        }
                    });

                    if (data.lockExpiry) {
                        setLockExpiry(new Date(data.lockExpiry));
                    }
                } catch (error) {
                    showToast('Failed to load purchase details', 'error');
                    navigate('/');
                }
            } else {
                // We have state, set initial countdown if not set
                const expiryStr = (location.state as any)?.lockExpiry;
                if (expiryStr && !lockExpiry) {
                    setLockExpiry(new Date(expiryStr));
                }
            }
        };

        loadPurchase();

        // Fallback safety if no expiry found anywhere
        if (!lockExpiry && !state) {
            // don't set blind default if we are fetching
        } else if (!lockExpiry && state) {
            const expiryStr = (location.state as any)?.lockExpiry;
            if (!expiryStr) {
                setLockExpiry(new Date(Date.now() + 5 * 60 * 1000));
            }
        }
    }, [purchaseId, navigate, location.state]);

    const handlePayment = async () => {
        if (!purchaseId) return;

        try {
            setIsProcessing(true);
            const response = await paymentService.initializePayment(parseInt(purchaseId));

            if (response.checkoutUrl) {
                // Redirect to payment gateway
                window.location.href = response.checkoutUrl;
            } else {
                showToast('Failed to initialize payment gateway', 'error');
            }
        } catch (error: any) {
            console.error('Payment Error:', error);
            showToast(error.message || 'Payment initialization failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExtendLock = async () => {
        if (!purchaseId) return;
        try {
            const res: any = await bookingService.extendLock(parseInt(purchaseId));
            if (res.success && res.newExpiry) {
                setLockExpiry(new Date(res.newExpiry));
                showToast('Time extended successfully', 'success');
            }
        } catch (error) {
            showToast('Failed to extend time', 'error');
        }
    };

    const handleCancel = async () => {
        if (!purchaseId) return;
        try {
            await bookingService.cancelReservation(parseInt(purchaseId));
            showToast('Reservation cancelled', 'info');
            navigate('/');
        } catch (error) {
            console.error(error);
            navigate('/');
        }
    };

    if (!state) {
        return (
            <div className="payment-page error">
                <div className="payment-card">
                    {/* While fetching or if failed */}
                    <h2>Loading...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-page">
            <div className="payment-container">
                <div className="payment-header">
                    <h1>Complete Payment</h1>
                    <p>Secure checkout via Chapa</p>
                </div>

                <div className="payment-content">
                    {/* Order Summary */}
                    <div className="payment-section summary">
                        <h2>Order Summary</h2>
                        <div className="event-details">
                            <h3>{state.event.title}</h3>
                            <p>📍 {state.event.venue}</p>
                            <p>📅 {new Date(state.event.dateTime).toLocaleString()}</p>
                        </div>

                        <div className="divider"></div>

                        <PriceBreakdownComponent breakdown={state.priceBreakdown} />
                    </div>

                    {/* Timer & Actions */}
                    <div className="payment-section actions">
                        {lockExpiry && (
                            <CountdownTimer
                                expiry={lockExpiry}
                                onExpire={() => {
                                    showToast('Reservation expired', 'warning');
                                    handleCancel();
                                }}
                            />
                        )}

                        <div className="payment-methods">
                            <h3>Select Payment Method</h3>
                            <div className="method-card selected">
                                <span className="method-icon">💳</span>
                                <div className="method-info">
                                    <span className="method-name">Chapa</span>
                                    <span className="method-desc">Telebirr, CBE, Amole, Cards</span>
                                </div>
                                <span className="check-icon">✓</span>
                            </div>
                        </div>

                        <button
                            className="btn-pay"
                            onClick={handlePayment}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <span className="spinner-small"></span>
                            ) : (
                                `Pay ETB ${state.priceBreakdown.total.toLocaleString()}`
                            )}
                        </button>

                        <div className="secondary-actions">
                            <button onClick={handleExtendLock} className="btn-text">
                                Need more time?
                            </button>
                            <button onClick={handleCancel} className="btn-text danger">
                                Cancel Booking
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
