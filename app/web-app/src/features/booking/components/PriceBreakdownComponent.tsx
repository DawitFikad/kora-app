import React from 'react';
import './PriceBreakdownComponent.css';

interface PriceBreakdown {
    basePrice: number;
    ticketPrice: number;
    subtotal: number;
    commission: number;
    convenienceFee: number;
    paymentGatewayFee?: number;
    discount: number;
    organizerEarnings?: number;
    total: number;
    promoApplied?: {
        code: string;
        type: string;
        value: number;
    };
}

interface PriceBreakdownComponentProps {
    breakdown: PriceBreakdown;
}

const PriceBreakdownComponent: React.FC<PriceBreakdownComponentProps> = ({ breakdown }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ET', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const gatewayFee = Number(
        breakdown.paymentGatewayFee ?? breakdown.convenienceFee ?? 0
    );
    const organizerEarnings = Number(
        breakdown.organizerEarnings ??
        (Number(breakdown.subtotal || 0) - Number(breakdown.commission || 0) - gatewayFee - Number(breakdown.discount || 0))
    );

    return (
        <div className="price-breakdown">
            <div className="breakdown-line">
                <span>Ticket Price</span>
                <span>ETB {formatCurrency(breakdown.subtotal)}</span>
            </div>

            <div className="breakdown-line fee">
                <span>
                    Platform Fee
                    <span className="info-tooltip" title="Platform commission">
                        ⓘ
                    </span>
                </span>
                <span>ETB {formatCurrency(breakdown.commission)}</span>
            </div>

            <div className="breakdown-line fee">
                <span>
                    Payment Gateway Fee
                    <span className="info-tooltip" title="Deducted from organizer payout">
                        ⓘ
                    </span>
                </span>
                <span>ETB {formatCurrency(gatewayFee)}</span>
            </div>

            <div className="breakdown-line">
                <span>Organizer Earnings</span>
                <span>ETB {formatCurrency(organizerEarnings)}</span>
            </div>

            {breakdown.discount > 0 && (
                <div className="breakdown-line discount">
                    <span>
                        Discount
                        {breakdown.promoApplied && (
                            <span className="promo-badge">
                                {breakdown.promoApplied.code}
                            </span>
                        )}
                    </span>
                    <span className="discount-amount">
                        -ETB {formatCurrency(breakdown.discount)}
                    </span>
                </div>
            )}

            <div className="breakdown-divider"></div>

            <div className="breakdown-line total">
                <span>Total</span>
                <span className="total-amount">
                    ETB {formatCurrency(breakdown.total)}
                </span>
            </div>
        </div>
    );
};

export default PriceBreakdownComponent;
