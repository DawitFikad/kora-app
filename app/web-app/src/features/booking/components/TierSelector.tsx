import React from 'react';
import './TierSelector.css';

interface Tier {
    id: number;
    name: string;
    price: number;
    capacity: number;
    soldCount: number;
    available: number;
}

interface TierSelectorProps {
    tiers: Tier[];
    selectedTierId: number | null;
    onSelect: (tierId: number) => void;
}

const TierSelector: React.FC<TierSelectorProps> = ({ tiers, selectedTierId, onSelect }) => {
    const getAvailabilityStatus = (tier: Tier) => {
        const percentSold = (tier.soldCount / tier.capacity) * 100;

        if (tier.available === 0) {
            return { label: 'Sold Out', className: 'sold-out' };
        } else if (percentSold >= 80) {
            return { label: 'Almost Sold Out', className: 'low-stock' };
        } else if (percentSold >= 50) {
            return { label: 'Selling Fast', className: 'limited' };
        }
        return { label: 'Available', className: 'available' };
    };

    return (
        <div className="tier-selector">
            {tiers.map(tier => {
                const status = getAvailabilityStatus(tier);
                const isDisabled = tier.available === 0;

                return (
                    <div
                        key={tier.id}
                        className={`tier-card ${selectedTierId === tier.id ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                        onClick={() => !isDisabled && onSelect(tier.id)}
                    >
                        <div className="tier-header">
                            <h3 className="tier-name">{tier.name}</h3>
                            <span className={`tier-status ${status.className}`}>
                                {status.label}
                            </span>
                        </div>

                        <div className="tier-price">
                            <span className="currency">ETB</span>
                            <span className="amount">{tier.price.toLocaleString()}</span>
                        </div>

                        <div className="tier-availability">
                            <div className="availability-bar">
                                <div
                                    className="availability-fill"
                                    style={{ width: `${(tier.soldCount / tier.capacity) * 100}%` }}
                                />
                            </div>
                            <span className="availability-text">
                                {tier.available} of {tier.capacity} remaining
                            </span>
                        </div>

                        {selectedTierId === tier.id && (
                            <div className="selected-indicator">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default TierSelector;
