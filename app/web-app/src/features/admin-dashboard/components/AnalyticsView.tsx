import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';
import { Loader2, Download } from 'lucide-react';
import { exportToCSV } from '../../../core/utils/export';

export const AnalyticsView = () => {
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
                title="Platform Analytics"
                subtitle="Deep dive into ticket velocity and category performance."
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Sales Growth Trajectory</h3>
                    <div style={{ height: '200px', width: '100%', borderLeft: '2px solid var(--border)', borderBottom: '2px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '20px' }}>
                        {analytics?.monthlySales.map((s: any, i: number) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '40px', height: `${(s.amount / maxSale) * 100}%`, background: '#1D90F5', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '0.65rem', fontWeight: 800 }}>{s.amount > 0 ? `${(s.amount / 1000).toFixed(1)}k` : ''}</div>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="admin-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Category Distribution (Revenue)</h3>
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
                </div>
            </div>

            <div className="admin-card" style={{ padding: '32px', marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '24px' }}>Market Share by City</h3>
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
        </motion.div>
    );
};
