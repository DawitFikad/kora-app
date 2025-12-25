import React from 'react';
import './PriceBreakdownComponent.css';

interface PriceBreakdown {
    basePrice: number;
    ticketPrice: number;
    subtotal: number;
    commission: number;
    convenienceFee: number;
    discount: number;
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

    return (
        <div className="price-breakdown">
            <div className="breakdown-line">
                <span>Subtotal</span>
                <span>ETB {formatCurrency(breakdown.subtotal)}</span>
            </div>

            <div className="breakdown-line fee">
                <span>
                    Service Fee
                    <span className="info-tooltip" title="Platform commission for secure transactions">
                        ⓘ
                    </span>
                </span>
                <span>ETB {formatCurrency(breakdown.commission)}</span>
            </div>

            <div className="breakdown-line fee">
                <span>
                    Convenience Fee
                    <span className="info-tooltip" title="Processing and handling fee">
                        ⓘ
                    </span>
                </span>
                <span>ETB {formatCurrency(breakdown.convenienceFee)}</span>
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
