import React, { useState } from 'react';
import GMVDashboard from './GMVDashboard';
import RevenueBreakdown from './RevenueBreakdown';
import OrganizerPayouts from './OrganizerPayouts';
import SettlementLedger from './SettlementLedger';

const tabs = [
    { id: 'gmv', label: 'GMV' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'payouts', label: 'Payouts' },
    { id: 'ledger', label: 'Ledger' },
];

export const FinancialControlIndex: React.FC = () => {
    const [active, setActive] = useState('gmv');

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 6 }}>
                <h1 style={{ margin: 0 }}>Financial Control</h1>
            </div>
            <p className="text-muted" style={{ marginBottom: 20 }}>Unified command center for platform liquidity, Gross Merchandise Value (GMV), and settlement records.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {tabs.map(t => (
                    <button key={t.id} className={`nav-item ${active === t.id ? 'active' : ''}`} onClick={() => setActive(t.id)}>{t.label}</button>
                ))}
            </div>
            <div style={{ padding: 12 }}>
                {active === 'gmv' && <GMVDashboard />}
                {active === 'revenue' && <RevenueBreakdown />}
                {active === 'payouts' && <OrganizerPayouts />}
                {active === 'ledger' && <SettlementLedger />}
            </div>
        </div>
    );
};

export default FinancialControlIndex;
