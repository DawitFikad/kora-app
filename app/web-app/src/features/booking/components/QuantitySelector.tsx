import React from 'react';
import './QuantitySelector.css';

interface QuantitySelectorProps {
    quantity: number;
    maxQuantity: number;
    onQuantityChange: (quantity: number) => void;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
    quantity,
    maxQuantity,
    onQuantityChange
}) => {
    const handleDecrement = () => {
        if (quantity > 1) {
            onQuantityChange(quantity - 1);
        }
    };

    const handleIncrement = () => {
        if (quantity < maxQuantity) {
            onQuantityChange(quantity + 1);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
            onQuantityChange(value);
        }
    };

    return (
        <div className="quantity-selector">
            <div className="quantity-controls">
                <button
                    className="qty-btn decrement"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                >
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M19 13H5v-2h14v2z" />
                    </svg>
                </button>

                <input
                    type="number"
                    className="qty-input"
                    value={quantity}
                    onChange={handleInputChange}
                    min={1}
                    max={maxQuantity}
                    aria-label="Quantity"
                />

                <button
                    className="qty-btn increment"
                    onClick={handleIncrement}
                    disabled={quantity >= maxQuantity}
                    aria-label="Increase quantity"
                >
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                </button>
            </div>

            {/* Quick select buttons */}
            <div className="quick-select">
                {[1, 2, 4, 6, 8, 10].filter(n => n <= maxQuantity).map(num => (
                    <button
                        key={num}
                        className={`quick-btn ${quantity === num ? 'active' : ''}`}
                        onClick={() => onQuantityChange(num)}
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuantitySelector;
