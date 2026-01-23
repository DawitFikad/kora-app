import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';
import { Loader2, Download } from 'lucide-react';
import { exportToCSV } from '../../../core/utils/export';

export const AnalyticsView = ({ view = 'GMV' }: { view?: 'GMV' | 'REVENUE' }) => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await AdminService.getAnalytics();
                setAnalytics(data);
            } catch (err) {
                console.error('Failed to fetch analytics', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    const maxSale = analytics ? Math.max(...analytics.monthlySales.map((s: any) => s.amount), 1) : 1;
    const totalDistValue = analytics ? analytics.categoryDistribution.reduce((sum: number, c: any) => sum + c.value, 0) : 0;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader
                title={view === 'REVENUE' ? 'Platform Revenue Analysis' : 'Platform Analytics (GMV)'}
                subtitle={view === 'REVENUE'
                    ? 'Deep dive into net earnings, convenience fees, and tax collection.'
                    : 'Analyze gross market volume and ticket sales velocity.'}
                actions={
                    <button
                        onClick={() => exportToCSV([
                            ...analytics?.monthlySales.map((s: any) => ({ Section: 'Sales Trend', Key: s.name, Value: s.amount })),
                            ...analytics?.categoryDistribution.map((c: any) => ({ Section: 'Category Distribution', Key: c.name, Value: c.value })),
                            ...analytics?.cityDistribution.map((city: any) => ({ Section: 'City Market Share', Key: city.name, Value: city.value }))
                        ], 'platform_analytics_summary.csv')}
                        className="btn-blue" style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        <Download size={16} /> Export Summary
                    </button>
                }
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                <div className="admin-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{view === 'REVENUE' ? 'Platform Revenue Trajectory' : 'Market Velocity (GMV)'}</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: view === 'REVENUE' ? '#10B981' : '#3B82F6', fontSize: '0.8rem', fontWeight: 700 }}>
                            <span style={{ padding: '4px 8px', background: view === 'REVENUE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>{view === 'REVENUE' ? '+8.2% Growth' : '+12.5% Velocity'}</span>
                        </div>
                    </div>
                    <div style={{ height: '200px', width: '100%', borderLeft: '2px solid var(--border)', borderBottom: '2px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '20px' }}>
                        {analytics?.monthlySales.map((s: any, i: number) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '40px', height: `${(s.amount / maxSale) * 100}%`, background: view === 'REVENUE' ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)' : 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)', borderRadius: '6px 6px 0 0', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '0.65rem', fontWeight: 800 }}>{s.amount > 0 ? `${(s.amount / 1000).toFixed(1)}k` : ''}</div>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="admin-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>{view === 'REVENUE' ? 'Revenue Components' : 'Category Distribution (Revenue)'}</h3>
                    {view === 'REVENUE' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>ORGANIZER COMMISSIONS</p>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981' }}>75% of Platform Net</h4>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>CONVENIENCE FEES</p>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#3B82F6' }}>25% of Platform Net</h4>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>* Estimates based on current active fee configurations.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {analytics?.categoryDistribution.map((c: any, i: number) => {
                                const percent = totalDistValue > 0 ? (c.value / totalDistValue) * 100 : 0;
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{c.name}</span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{percent.toFixed(1)}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
                                            <div style={{ height: '100%', width: `${percent}%`, background: '#D946EF', borderRadius: '10px' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {view === 'GMV' ? (
                <div className="admin-card" style={{ padding: '32px', marginTop: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Market Share by City (Sales Volume)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {analytics?.cityDistribution.map((city: any, i: number) => {
                            const totalRevenue = analytics.cityDistribution.reduce((sum: number, c: any) => sum + c.value, 0);
                            const percent = totalRevenue > 0 ? (city.value / totalRevenue) * 100 : 0;
                            return (
                                <div key={i} style={{ padding: '20px', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>{city.name.toUpperCase()}</p>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 900 }}>ETB {city.value.toLocaleString()}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                        <div style={{ flex: 1, height: '4px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                                            <div style={{ height: '100%', width: `${percent}%`, background: '#3B82F6', borderRadius: '10px' }} />
                                        </div>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B82F6' }}>{percent.toFixed(1)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="admin-card" style={{ padding: '32px', marginTop: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Revenue & Tax Summary</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '12px 0' }}>FISCAL CATEGORY</th>
                                    <th>COLLECTED</th>
                                    <th>COMMISSION (10%)</th>
                                    <th>NET PLATFORM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics?.categoryDistribution.map((c: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                                        <td style={{ padding: '16px 0', fontWeight: 800 }}>{c.name}</td>
                                        <td>ETB {c.value.toLocaleString()}</td>
                                        <td style={{ color: '#10B981', fontWeight: 800 }}>ETB {(c.value * 0.1).toLocaleString()}</td>
                                        <td style={{ fontWeight: 900 }}>ETB {(c.value * 0.1).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
