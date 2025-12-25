import React, { useMemo } from 'react';
import './SeatSelector.css';

interface SeatStatus {
    seatNumber: string;
    status: 'available' | 'locked' | 'sold';
    lockedBy?: number;
    ttl?: number;
}

interface SeatSelectorProps {
    seats: SeatStatus[];
    selectedSeats: string[];
    onSeatSelect: (seatNumber: string) => void;
    userId?: number; // Current user ID to show their locked seats differently
}

const SeatSelector: React.FC<SeatSelectorProps> = ({
    seats,
    selectedSeats,
    onSeatSelect,
    userId
}) => {
    // Organize seats into rows for display
    const organizedSeats = useMemo(() => {
        const seatsPerRow = 10;
        const rows: SeatStatus[][] = [];

        for (let i = 0; i < seats.length; i += seatsPerRow) {
            rows.push(seats.slice(i, i + seatsPerRow));
        }

        return rows;
    }, [seats]);

    const getSeatClass = (seat: SeatStatus) => {
        if (selectedSeats.includes(seat.seatNumber)) {
            return 'seat selected';
        }

        switch (seat.status) {
            case 'sold':
                return 'seat sold';
            case 'locked':
                // If locked by current user, show as selected/available
                if (userId && seat.lockedBy === userId) {
                    return 'seat locked-by-me';
                }
                return 'seat locked';
            case 'available':
            default:
                return 'seat available';
        }
    };

    const handleSeatClick = (seat: SeatStatus) => {
        if (seat.status === 'sold') return;
        if (seat.status === 'locked' && seat.lockedBy !== userId) return;

        onSeatSelect(seat.seatNumber);
    };

    return (
        <div className="seat-selector">
            {/* Stage indicator */}
            <div className="stage-indicator">
                <div className="stage">STAGE</div>
            </div>

            {/* Legend */}
            <div className="seat-legend">
                <div className="legend-item">
                    <span className="legend-seat available"></span>
                    <span>Available</span>
                </div>
                <div className="legend-item">
                    <span className="legend-seat selected"></span>
                    <span>Selected</span>
                </div>
                <div className="legend-item">
                    <span className="legend-seat locked"></span>
                    <span>Reserved</span>
                </div>
                <div className="legend-item">
                    <span className="legend-seat sold"></span>
                    <span>Sold</span>
                </div>
            </div>

            {/* Seat Grid */}
            <div className="seat-grid">
                {organizedSeats.map((row, rowIndex) => (
                    <div key={rowIndex} className="seat-row">
                        <span className="row-label">{String.fromCharCode(65 + rowIndex)}</span>
                        <div className="row-seats">
                            {row.map((seat, seatIndex) => (
                                <button
                                    key={seat.seatNumber}
                                    className={getSeatClass(seat)}
                                    onClick={() => handleSeatClick(seat)}
                                    disabled={seat.status === 'sold' || (seat.status === 'locked' && seat.lockedBy !== userId)}
                                    title={`Seat ${seat.seatNumber} - ${seat.status}`}
                                    aria-label={`Seat ${seat.seatNumber}, ${seat.status}`}
                                >
                                    {seatIndex + 1}
                                </button>
                            ))}
                        </div>
                        <span className="row-label">{String.fromCharCode(65 + rowIndex)}</span>
                    </div>
                ))}
            </div>

            {/* Selected seats summary */}
            {selectedSeats.length > 0 && (
                <div className="selected-summary">
                    <h4>Selected Seats:</h4>
                    <div className="selected-tags">
                        {selectedSeats.map(seat => (
                            <span key={seat} className="seat-tag">
                                {seat}
                                <button
                                    className="remove-seat"
                                    onClick={() => onSeatSelect(seat)}
                                    aria-label={`Remove seat ${seat}`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeatSelector;
