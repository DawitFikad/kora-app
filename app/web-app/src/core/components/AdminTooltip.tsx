import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface AdminTooltipProps {
    title: string;
    content: string;
    children?: React.ReactNode;
}

export const AdminTooltip: React.FC<AdminTooltipProps> = ({ title, content, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children || <Info size={14} style={{ cursor: 'help', color: 'var(--text-muted)', marginLeft: '6px' }} />}

            {isVisible && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%) translateY(-10px)',
                    width: '240px',
                    padding: '12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    pointerEvents: 'none'
                }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--bg-active)' }}>
                        {title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: '1.4', fontWeight: 500 }}>
                        {content}
                    </div>
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        marginLeft: '-6px',
                        borderWidth: '6px',
                        borderStyle: 'solid',
                        borderColor: 'var(--border) transparent transparent transparent'
                    }} />
                </div>
            )}
        </div>
    );
};
