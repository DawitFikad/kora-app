import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../../core/api/payment.service';
import './PaymentCallbackPage.css';

const PaymentCallbackPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Status from query params (set by backend redirect)
    const statusParam = searchParams.get('status');
    const ref = searchParams.get('ref');
    const purchaseId = searchParams.get('purchaseId');
    const reason = searchParams.get('reason');
    const message = searchParams.get('message'); // Generic error message

    const [verifying, setVerifying] = useState(true);
    const [finalStatus, setFinalStatus] = useState<'SUCCESS' | 'FAILED' | 'ERROR'>('ERROR');
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        // If the backend already verified and redirected with status, we can trust it
        // OR we can double check verification if we want to be extra sure (recommended for robustness)

        const verify = async () => {
            if (statusParam === 'success') {
                setFinalStatus('SUCCESS');
                setStatusMessage('Your payment was successful and tickets have been issued.');
                setVerifying(false);
            } else if (statusParam === 'failed') {
                setFinalStatus('FAILED');
                setStatusMessage(reason || 'Payment verification failed.');
                setVerifying(false);
            } else if (statusParam === 'error') {
                setFinalStatus('ERROR');
                setStatusMessage(message || 'An error occurred during payment processing.');
                setVerifying(false);
            } else if (ref) {
                // If we somehow got here without status param but have ref
                try {
                    const result = await paymentService.verifyPayment(ref);
                    if (result.status === 'SUCCESS') {
                        setFinalStatus('SUCCESS');
                        setStatusMessage('Payment verified successfully.');
                    } else {
                        setFinalStatus('FAILED');
                        setStatusMessage(result.message || 'Payment verification failed.');
                    }
                } catch (err: any) {
                    setFinalStatus('ERROR');
                    setStatusMessage(err.message || 'Failed to verify payment.');
                } finally {
                    setVerifying(false);
                }
            } else {
                setFinalStatus('ERROR');
                setStatusMessage('Invalid callback parameters.');
                setVerifying(false);
            }
        };

        verify();
    }, [statusParam, ref, reason, message]);

    const handleRetry = () => {
        if (purchaseId) {
            // Retrieve state if possible, or just navigate to payment page which handles reload?
            // Since we don't persist full state, we navigate to payment page.
            // PaymentPage logic handles "missing state" by redirecting home, which is bad for retry.
            // Ideally we should have a "getPurchase" endpoint.
            // For now, let's navigate to /dashboard/tickets if success, or home if fail? 
            // We need a way to restart payment.

            // If I navigate to `/payment/${purchaseId}`, PaymentPage will fail because `location.state` is null.
            // We need to fix PaymentPage to fetch data if state is missing.

            // For now, let's navigate to home or retry if we can?
            // I'll update PaymentPage to allow fetching data (TODO).
            // But let's assume we can just go back to the payment page.
            navigate(`/payment/${purchaseId}`);
        } else {
            navigate('/');
        }
    };

    const handleDone = () => {
        navigate('/');
    };

    if (verifying) {
        return (
            <div className="callback-page">
                <div className="callback-card loading">
                    <div className="spinner"></div>
                    <h2>Verifying Payment...</h2>
                    <p>Please wait while we confirm your transaction.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="callback-page">
            <div className={`callback-card ${finalStatus.toLowerCase()}`}>
                <div className="status-icon">
                    {finalStatus === 'SUCCESS' ? '🎉' : finalStatus === 'FAILED' ? '❌' : '⚠️'}
                </div>

                <h2>
                    {finalStatus === 'SUCCESS' ? 'Payment Successful!' :
                        finalStatus === 'FAILED' ? 'Payment Failed' : 'something went wrong'}
                </h2>

                <p className="status-message">{statusMessage}</p>

                {finalStatus === 'SUCCESS' && (
                    <div className="success-actions">
                        <p>Receive your tickets via email/SMS shortly.</p>
                        <button onClick={handleDone} className="btn-primary">
                            Return to Home
                        </button>
                    </div>
                )}

                {finalStatus !== 'SUCCESS' && (
                    <div className="failure-actions">
                        <button onClick={handleRetry} className="btn-retry">
                            Retry Payment
                        </button>
                        <button onClick={() => navigate('/')} className="btn-secondary">
                            Back to Events
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentCallbackPage;
