import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';

import { AdminService } from '../../../core/api/admin.service';
import { Loader2, Download } from 'lucide-react';
import { exportToCSV } from '../../../core/utils/export';




export const AnalyticsView = ({ view = 'GMV' }: { view?: 'GMV' | 'REVENUE' }) => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month');
    const [selectedOrganizer, setSelectedOrganizer] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState('all');
    const [customPeriod, setCustomPeriod] = useState<{ start: Date; end: Date } | null>(null);
    const [comparisonPeriod, setComparisonPeriod] = useState('previous');

    const [organizers, setOrganizers] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const [orgRes, evtRes]: any = await Promise.all([
                    AdminService.getApprovedOrganizers().catch(() => ({ data: [] })),
                    AdminService.getEvents().catch(() => ({ data: [] }))
                ]);
                setOrganizers(orgRes?.data || orgRes || []);
                setEvents(evtRes?.data || evtRes || []);
            } catch (err) {
                console.warn('Failed to fetch organizers/events', err);
            }
        };
        fetchMeta();
    }, []);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setIsLoading(true);
                const params: any = { range: dateRange, organizer: selectedOrganizer, event: selectedEvent, comparison: comparisonPeriod };
                if (dateRange === 'custom' && customPeriod) {
                    params.start = customPeriod.start.toISOString();
                    params.end = customPeriod.end.toISOString();
                }
                const res: any = await AdminService.getAnalytics(params);
                setAnalytics(res?.data || res || {});
            } catch (err) {
                console.error('Failed to fetch analytics', err);
                setAnalytics({});
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, [dateRange, selectedOrganizer, selectedEvent, customPeriod, comparisonPeriod, view]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    const monthlySales = analytics?.monthlySales || [];
    const categoryDistribution = analytics?.categoryDistribution || [];
    const cityDistribution = analytics?.cityDistribution || [];
    const maxSale = monthlySales.length ? Math.max(...monthlySales.map((s: any) => s.amount || 0), 1) : 1;
    const totalDistValue = categoryDistribution.reduce((sum: number, c: any) => sum + (c.value || 0), 0);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', justifyContent: 'flex-end' }}>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem' }}
                >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom</option>
                </select>
                <select
                    value={selectedOrganizer}
                    onChange={(e) => setSelectedOrganizer(e.target.value)}
                    style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem' }}
                >
                    <option value="all">All Organizers</option>
                    {organizers.map((o: any) => <option key={o.id} value={o.id}>{o.organizationName || o.fullName || o.email}</option>)}
                </select>
                <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem' }}
                >
                    <option value="all">All Events</option>
                    {events.map((ev: any) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
                <button
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'help', fontSize: '0.85rem' }}
                >
                    What is GMV?
                </button>
                <select
                    value={comparisonPeriod}
                    onChange={(e) => setComparisonPeriod(e.target.value)}
                    style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.85rem' }}
                >
                    <option value="previous">Previous Period</option>
                    <option value="same">Same Period Last Year</option>
                </select>
                <button
                    onClick={() => exportToCSV([
                        ...monthlySales.map((s: any) => ({ Section: 'Sales Trend', Key: s.name, Value: s.amount })),
                        ...categoryDistribution.map((c: any) => ({ Section: 'Category Distribution', Key: c.name, Value: c.value })),
                        ...cityDistribution.map((city: any) => ({ Section: 'City Market Share', Key: city.name, Value: city.value }))
                    ], 'platform_analytics_summary.csv')}
                    className="btn-blue" style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                >
                    <Download size={16} /> Export Summary
                </button>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ padding: '18px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', flex: '1' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800 }}>TOTAL {view === 'REVENUE' ? 'PLATFORM REVENUE' : 'GMV'}</p>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>ETB {(analytics?.totalGMV || analytics?.totalRevenue || 0).toLocaleString()}</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>{comparisonPeriod === 'previous' ? 'Compared to previous period' : 'Compared to same period last year'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {dateRange === 'custom' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="datetime-local" onChange={(e) => setCustomPeriod({ start: new Date(e.target.value), end: customPeriod?.end || new Date() })} />
                                <input type="datetime-local" onChange={(e) => setCustomPeriod({ start: customPeriod?.start || new Date(), end: new Date(e.target.value) })} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                <div className="admin-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{view === 'REVENUE' ? 'Platform Revenue Trajectory' : 'Market Velocity (GMV)'}</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: view === 'REVENUE' ? '#10B981' : '#FF0000', fontSize: '0.8rem', fontWeight: 700 }}>
                            <span style={{ padding: '4px 8px', background: view === 'REVENUE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>{view === 'REVENUE' ? '+8.2% Growth' : '+12.5% Velocity'}</span>
                        </div>
                    </div>
                    <div style={{ height: '200px', width: '100%', borderLeft: '2px solid var(--border)', borderBottom: '2px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '20px' }}>
                        {monthlySales.map((s: any, i: number) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '40px', height: `${(s.amount / maxSale) * 100}%`, background: view === 'REVENUE' ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)' : 'linear-gradient(180deg, #FF0000 0%, #2563EB 100%)', borderRadius: '6px 6px 0 0', position: 'relative' }}>
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
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FF0000' }}>25% of Platform Net</h4>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>* Estimates based on current active fee configurations.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {categoryDistribution.map((c: any, i: number) => {
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
                        {cityDistribution.map((city: any, i: number) => {
                            const totalRevenue = cityDistribution.reduce((sum: number, c: any) => sum + (c.value || 0), 0);
                            const percent = totalRevenue > 0 ? (city.value / totalRevenue) * 100 : 0;
                            return (
                                <div key={i} style={{ padding: '20px', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>{(city.name || '').toUpperCase()}</p>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 900 }}>ETB {(city.value || 0).toLocaleString()}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                        <div style={{ flex: 1, height: '4px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                                            <div style={{ height: '100%', width: `${percent}%`, background: '#FF0000', borderRadius: '10px' }} />
                                        </div>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FF0000' }}>{percent.toFixed(1)}%</span>
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
                                {categoryDistribution.map((c: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                                        <td style={{ padding: '16px 0', fontWeight: 800 }}>{c.name}</td>
                                        <td>ETB {(c.value || 0).toLocaleString()}</td>
                                        <td style={{ color: '#10B981', fontWeight: 800 }}>ETB {((c.value || 0) * 0.1).toLocaleString()}</td>
                                        <td style={{ fontWeight: 900 }}>ETB {((c.value || 0) * 0.1).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );

}
