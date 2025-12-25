import React from 'react';

interface MetricProps {
    size: number;
    color: string;
    strokeWidth: number;
}

export const CreditCardIcon = ({ size, color, strokeWidth }: MetricProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <circle cx="7" cy="15" r="1.5" />
        <circle cx="11" cy="15" r="1.5" />
    </svg>
);
