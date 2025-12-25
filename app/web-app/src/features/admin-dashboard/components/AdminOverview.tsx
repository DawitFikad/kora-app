import { motion } from 'framer-motion';
import {
    DollarSign,
    TrendingUp,
    CheckCircle2,
    Calendar,
    Download,
    UserPlus,
    Activity,
    ShieldAlert,
    AlertTriangle,
    Filter
} from 'lucide-react';
import { CreditCard } from './CustomIcons';

export const AdminOverview = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* 🟢 Top Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                    { label: 'Review Pending', sub: '46 items waiting', icon: ShieldAlert, color: '#3B82F6', iconBg: 'rgba(59, 130, 246, 0.1)' },
                    { label: 'Export Report', sub: 'CSV or PDF', icon: Download, color: '#A78BFA', iconBg: 'rgba(167, 139, 250, 0.1)' },
                    { label: 'Invite Admin', sub: 'Manage access', icon: UserPlus, color: '#F59E0B', iconBg: 'rgba(245, 158, 11, 0.1)' },
                    { label: 'System Status', sub: 'All systems operational', icon: Activity, color: '#10B981', iconBg: 'rgba(16, 185, 129, 0.1)' },
                ].map((item, i) => (
                    <div key={i} className="admin-stat-card-mini">
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                            <item.icon size={20} color={item.color} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '2px' }}>{item.label}</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>Performance Overview</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total GMV</p>
                        <DollarSign size={18} color="var(--text-muted)" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>$1,240,500</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '0.8rem', fontWeight: 700 }}>
                        <TrendingUp size={14} /> +12% vs last month
                    </div>
                </div>

                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Payouts</p>
                        <CreditCard size={18} color="var(--text-muted)" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>$980,000</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Net disbursed</p>
                </div>

                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Organizer Approvals</p>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={12} color="white" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>12</h2>
                    <p style={{ fontSize: '0.8rem', color: '#3B82F6', fontWeight: 700 }}>Action Required</p>
                </div>

                <div className="admin-stat-card-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Event Approvals</p>
                        <Calendar size={18} color="#F59E0B" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>34</h2>
                    <p style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 700 }}>Pending Review</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* 🔵 Revenue Chart Area */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Revenue Trends</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gross Merchandise Value vs. Payouts</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                            <button style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>30 Days</button>
                            <button style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>90 Days</button>
                        </div>
                    </div>

                    <div style={{ height: '240px', width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', paddingBottom: '30px' }}>
                        {/* Mock SVG Path for Line Chart */}
                        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,180 Q100,160 200,190 T400,140 T600,80 T800,120" fill="none" stroke="#3B82F6" strokeWidth="3" />
                            <path d="M0,180 Q100,160 200,190 T400,140 T600,80 T800,120 L800,240 L0,240 Z" fill="url(#chartGradient)" />
                            <circle cx="600" cy="80" r="4" fill="#3B82F6" />
                            <rect x="550" y="45" width="80" height="25" rx="4" fill="#1A212D" stroke="rgba(255,255,255,0.1)" />
                            <text x="562" y="62" fill="white" fontSize="10" fontWeight="700">$24.5k GMV</text>
                        </svg>

                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                            <span>Aug 01</span>
                            <span>Aug 08</span>
                            <span>Aug 15</span>
                            <span>Aug 22</span>
                            <span>Aug 29</span>
                        </div>
                    </div>
                </div>

                {/* 🟡 Fraud Alerts Sidebar */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Fraud Alerts</h3>
                        <a href="#" style={{ fontSize: '0.8rem', color: '#3B82F6', textDecoration: 'none', fontWeight: 700 }}>View All</a>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { title: 'Suspicious Ticket Bulk Buy', user: 'User ID: #8821', time: '5 mins ago', type: 'error' },
                            { title: 'Organizer IP Mismatch', user: 'Org: Neon Nights', time: '1 hr ago', type: 'warning' },
                        ].map((alert, i) => (
                            <div key={i} style={{ padding: '16px', borderRadius: '12px', background: alert.type === 'error' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)', border: `1px solid ${alert.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'}` }}>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                    {alert.type === 'error' ? <AlertTriangle size={18} color="#EF4444" /> : <ShieldAlert size={18} color="#F59E0B" />}
                                    <div>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '2px' }}>{alert.title}</h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alert.user} • {alert.time}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button style={{ background: alert.type === 'error' ? '#EF4444' : '#F59E0B', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>Investigate</button>
                                    <button style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: '6px 12px', fontSize: '0.7rem', fontWeight: 800 }}>Dismiss</button>
                                </div>
                            </div>
                        ))}
                        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <CheckCircle2 size={18} color="#10B981" />
                            <div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>All systems normal</h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last scan: 2 mins ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🟣 Needs Attention Table */}
            <div className="admin-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Needs Attention</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending approvals and flagged items</p>
                    </div>
                    <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', color: 'white', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={16} /> Filter
                    </button>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ENTITY</th>
                            <th>TYPE</th>
                            <th>SUBMITTED</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { name: 'Millennium Music Festival', type: 'Event Approval', user: 'Abel Tesfaye (Organizer)', date: 'Oct 24, 2024', status: 'Pending Review', statusColor: '#F59E0B' },
                            { name: 'Red Sea Events Ltd', type: 'New Organizer', user: 'Selam Gebre (Admin)', date: 'Oct 23, 2024', status: 'Identity Check', statusColor: '#3B82F6' },
                            { name: 'Gospel Night Live', type: 'Event Approval', user: 'Dawit Solomon (Organizer)', date: 'Oct 23, 2024', status: 'Pending Review', statusColor: '#F59E0B' },
                            { name: 'User #9210 Audit', type: 'Fraud Flag', user: 'System (Auto)', date: 'Oct 22, 2024', status: 'Risk Level High', statusColor: '#EF4444' },
                        ].map((row, i) => (
                            <tr key={i}>
                                <td>
                                    <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{row.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.user}</p>
                                </td>
                                <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.type}</td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{row.date}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: row.statusColor }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: row.statusColor }}>{row.status}</span>
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>Manage</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};
