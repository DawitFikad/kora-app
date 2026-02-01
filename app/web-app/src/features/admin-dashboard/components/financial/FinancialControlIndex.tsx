import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, Wallet, Receipt } from 'lucide-react';
import GMVDashboard from './GMVDashboard';
import RevenueBreakdown from './RevenueBreakdown';
import OrganizerPayouts from './OrganizerPayouts';
import SettlementLedger from './SettlementLedger';
import { AdminService } from '../../../../core/api/admin.service';

const tabs = [
    { id: 'gmv', label: 'GMV Tracking', icon: TrendingUp, color: '#10B981' },
    { id: 'revenue', label: 'Platform Revenue', icon: DollarSign, color: '#3B82F6' },
    { id: 'payouts', label: 'Organizer Payouts', icon: Wallet, color: '#F59E0B' },
    { id: 'ledger', label: 'Settlement Ledger', icon: Receipt, color: '#8B5CF6' },
];

export const FinancialControlIndex: React.FC = () => {
    const [active, setActive] = useState('gmv');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        AdminService.getStats().then(res => setStats(res));
    }, []);

    const currency = (v: number) => `ETB ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '0 10px' }}
        >
            {/* 🏦 Global Financial Header */}
            <div style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border)',
                borderRadius: '32px',
                padding: '40px',
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.05)'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 15px #10B981' }} />
                        <h1 style={{ fontSize: '2.4rem', fontWeight: 950, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Financial Control</h1>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600, maxWidth: '500px' }}>
                        Unified command center for platform liquidity, Gross Merchandise Value (GMV), and settlement records.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ textAlign: 'right', padding: '0 24px', borderRight: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Platform Liquidity</p>
                        <p style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--text-main)' }}>{stats ? currency(stats.financials?.totalVolume || 0) : '---'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Live GMV</p>
                        <p style={{ fontSize: '1.8rem', fontWeight: 950, color: '#10B981' }}>{stats ? currency(stats.financials?.gmvToday || 0) : '---'}</p>
                    </div>
                </div>
            </div>

            {/* 📑 Premium Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '40px',
                background: 'var(--bg-subtle)',
                padding: '8px',
                borderRadius: '20px',
                width: 'fit-content',
                border: '1px solid var(--border)'
            }}>
                {tabs.map(t => {
                    const Icon = t.icon;
                    const isActive = active === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActive(t.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '14px 24px',
                                borderRadius: '14px',
                                border: isActive ? `1px solid ${t.color}30` : '1px solid transparent',
                                background: isActive ? 'var(--bg-card)' : 'transparent',
                                color: isActive ? t.color : 'var(--text-muted)',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isActive ? `0 10px 20px ${t.color}20` : 'none',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'var(--bg-hover)';
                                    e.currentTarget.style.color = t.color;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                }
                            }}
                        >
                            <Icon size={18} color={isActive ? t.color : t.color + '60'} />
                            {t.label}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabGlow"
                                    style={{
                                        position: 'absolute',
                                        bottom: '0',
                                        left: '20%',
                                        right: '20%',
                                        height: '2px',
                                        background: t.color,
                                        boxShadow: `0 0 10px ${t.color}`
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* 🏗️ Tab Content Area */}
            <div style={{ minHeight: '600px' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        {active === 'gmv' && <GMVDashboard />}
                        {active === 'revenue' && <RevenueBreakdown />}
                        {active === 'payouts' && <OrganizerPayouts />}
                        {active === 'ledger' && <SettlementLedger />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default FinancialControlIndex;
