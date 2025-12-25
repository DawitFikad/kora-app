import React, { useState, useEffect } from 'react';
import './CountdownTimer.css';

interface CountdownTimerProps {
    expiry: Date;
    onExpire: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiry, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = expiry.getTime() - Date.now();

        if (difference <= 0) {
            return { minutes: 0, seconds: 0, total: 0 };
        }

        return {
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
            total: difference
        };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (newTimeLeft.total <= 0) {
                clearInterval(timer);
                onExpire();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiry, onExpire]);

    const isWarning = timeLeft.total < 60000; // Less than 1 minute
    const isCritical = timeLeft.total < 30000; // Less than 30 seconds

    return (
        <div className={`countdown-timer ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''}`}>
            <div className="timer-icon">⏱️</div>
            <div className="timer-content">
                <span className="timer-label">Reservation expires in</span>
                <span className="timer-value">
                    {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
            </div>
            {isWarning && (
                <div className="timer-warning">
                    Complete your purchase soon!
                </div>
            )}
        </div>
    );
};

export default CountdownTimer;
