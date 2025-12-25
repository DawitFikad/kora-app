import React, { useState } from 'react';
import './PromoCodeInput.css';

interface PromoCodeInputProps {
    promoCode: string;
    onPromoCodeChange: (code: string) => void;
    onApply: () => void;
    isApplied: boolean;
    disabled?: boolean;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
    promoCode,
    onPromoCodeChange,
    onApply,
    isApplied,
    disabled = false
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (promoCode.trim() && !isApplied) {
            onApply();
        }
    };

    const handleRemove = () => {
        onPromoCodeChange('');
        // Parent should handle resetting promoApplied state
    };

    return (
        <div className="promo-code-input">
            {!isExpanded && !isApplied ? (
                <button
                    className="promo-toggle"
                    onClick={() => setIsExpanded(true)}
                    disabled={disabled}
                >
                    <span className="promo-icon">🏷️</span>
                    <span>Add Promo Code</span>
                </button>
            ) : isApplied ? (
                <div className="promo-applied">
                    <div className="applied-badge">
                        <span className="check-icon">✓</span>
                        <span className="applied-code">{promoCode}</span>
                    </div>
                    <button className="remove-promo" onClick={handleRemove}>
                        Remove
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="promo-form">
                    <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => onPromoCodeChange(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="promo-input"
                        disabled={disabled}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="apply-btn"
                        disabled={disabled || !promoCode.trim()}
                    >
                        Apply
                    </button>
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => {
                            setIsExpanded(false);
                            onPromoCodeChange('');
                        }}
                    >
                        ×
                    </button>
                </form>
            )}
        </div>
    );
};

export default PromoCodeInput;
