import { useState } from 'react';
import {
    Calendar,
    Ticket,
    Megaphone,
    BarChart3,
    Settings,
    Search,
    Bell,
    HelpCircle,
    MoreHorizontal,
    TrendingUp,
    Eye,
    Building2,
    Pencil,
    PlusCircle,
    Users,
    Download,
    CheckCircle2,
    Package,
    Clock,
    Layout
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricProps {
    size: number;
    color: string;
    strokeWidth: number;
}

const CreditCardIcon = ({ size, color, strokeWidth }: MetricProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <circle cx="7" cy="15" r="1.5" />
        <circle cx="11" cy="15" r="1.5" />
    </svg>
);

const OrganizerDashboard = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');

    const navItems = [
        { icon: Layout, label: 'Dashboard' },
        { icon: Calendar, label: 'My Events' },
        { icon: Ticket, label: 'Tickets' },
        { icon: Megaphone, label: 'Marketing' },
        { icon: BarChart3, label: 'Reports' },
        { icon: Settings, label: 'Settings' },
    ];

    const stats = [
        {
            label: 'Total Revenue',
            value: '$12,450',
            change: '+12% vs last week',
            icon: CreditCardIcon,
            bgColor: 'rgba(29, 144, 245, 0.1)',
            iconColor: '#1D90F5'
        },
        {
            label: 'Tickets Sold',
            value: '450 / 600',
            change: '+5% new sales',
            icon: Ticket,
            bgColor: 'rgba(251, 191, 36, 0.1)',
            iconColor: '#FBBF24'
        },
        {
            label: 'Page Views',
            value: '1,200',
            change: '+8% traffic increase',
            icon: Eye,
            bgColor: 'rgba(167, 139, 250, 0.1)',
            iconColor: '#A78BFA'
        },
        {
            label: 'Next Payout',
            value: '$3,200',
            change: 'Scheduled: Sept 15',
            icon: Building2,
            bgColor: 'rgba(236, 72, 153, 0.1)',
            iconColor: '#EC4899'
        },
    ];

    return (
        <div className="container-fluid">
            {/* 🟢 Sidebar */}
            <aside className="sidebar">
                <div className="logo-section">
                    <div className="logo-box">
                        <BarChart3 color="#1D90F5" size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, lineHeight: 1.1 }}>Event Manager</h2>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Organizer Console</p>
                    </div>
                </div>

                <nav className="nav-group">
                    {navItems.map((item) => (
                        <div
                            key={item.label}
                            className={`nav-item ${activeTab === item.label ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.label)}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="btn-blue">
                        <PlusCircle size={22} fill="white" color="#1D90F5" /> Create Event
                    </button>
                </div>
            </aside>

            {/* 🔵 Main Content */}
            <main className="main-content">
                <header className="top-header">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dashboard Overview</h2>

                    <div className="search-pill">
                        <Search size={18} color="#8E9BAE" />
                        <input type="text" placeholder="Search events, orders, or analytics" />
                    </div>

                    <div className="header-actions">
                        <div className="action-icon">
                            <Bell size={22} />
                            <div style={{ position: 'absolute', top: 2, right: 2, width: '8px', height: '8px', background: '#FF4D4D', borderRadius: '50%', border: '2px solid var(--bg-main)' }} />
                        </div>
                        <HelpCircle size={22} className="action-icon" />

                        <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(45deg, #1D90F5, #D946EF)', padding: '2px' }}>
                                <img src="https://ui-avatars.com/api/?name=Alex+Morgan&background=11141B&color=fff" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>Alex Morgan</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Organizer</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 🟡 Welcome Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '6px', letterSpacing: '-0.02em' }}>Welcome back, Alex</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>Here is what’s happening with your events today.</p>
                    </div>
                    <div style={{ padding: '10px 20px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, color: '#A0AEC0', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                        Last updated: Just now
                    </div>
                </div>

                {/* 🟣 Stats Grid */}
                <div className="stats-grid">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            className="stat-card"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <MoreHorizontal size={20} color="#57606A" style={{ position: 'absolute', top: 24, right: 24, cursor: 'pointer' }} />
                            <div className="stat-icon-box" style={{ background: stat.bgColor, color: stat.iconColor }}>
                                <stat.icon size={22} color={stat.iconColor} strokeWidth={2.5} />
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px' }}>{stat.value}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: i === 3 ? 'var(--text-muted)' : '#10B981' }}>
                                {i !== 3 && <TrendingUp size={14} />}
                                {stat.change}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 🟠 Velocity & Quick Actions Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    <div className="stat-card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Ticket Sales Velocity</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time sales performance</p>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <select style={{ background: '#161B22', border: '1px solid var(--border)', color: 'white', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, appearance: 'none', cursor: 'pointer', paddingRight: '40px' }}>
                                    <option>Last 7 Days</option>
                                </select>
                                <MoreHorizontal size={14} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%) rotate(90deg)' }} />
                            </div>
                        </div>

                        {/* Minimal Chart Labels */}
                        <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px' }}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flex: 1 }}>
                                    <div style={{ width: '1px', height: '180px', background: 'rgba(255,255,255,0.03)' }} />
                                    <span style={{ fontSize: '0.8rem', color: i === 4 ? 'white' : 'var(--text-muted)', fontWeight: 700 }}>{day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="stat-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '28px' }}>Quick Actions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            {[
                                { label: 'Promotions', icon: Megaphone },
                                { label: 'Ticket Types', icon: Ticket },
                                { label: 'Set Capacity', icon: Users },
                                { label: 'Gen. Report', icon: Download },
                            ].map((action) => (
                                <div key={action.label} className="quick-action-btn" style={{
                                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                                    borderRadius: '16px', padding: '24px 12px', textAlign: 'center', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <action.icon size={20} color="#8E9BAE" />
                                    </div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>{action.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 🔵 Tables & Activity Area */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }}>
                    <div className="stat-card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Upcoming Events</h3>
                            <a href="#" style={{ color: '#1D90F5', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none' }}>View All →</a>
                        </div>

                        <table className="event-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '35%' }}>Event Name</th>
                                    <th style={{ width: '20%' }}>Date</th>
                                    <th style={{ width: '15%' }}>Status</th>
                                    <th style={{ width: '20%' }}>Capacity</th>
                                    <th style={{ width: '10%' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: 'Summer Music Festival', date: 'Aug 24, 2024', status: 'Live', percent: 85, color: '#10B981' },
                                    { name: 'Tech Networking Night', date: 'Sept 02, 2024', status: 'Selling Fast', percent: 42, color: '#1D90F5' },
                                ].map((event, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div className="event-icon-box" style={{ background: i === 0 ? '#EFFFFB' : '#F1F7FF' }}>
                                                    <Package size={22} color={i === 0 ? '#10B981' : '#1D90F5'} />
                                                </div>
                                                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{event.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 700 }}>{event.date}</td>
                                        <td>
                                            <span className={`pill ${i === 0 ? 'pill-green' : 'pill-blue'}`}>{event.status}</span>
                                        </td>
                                        <td>
                                            <div className="progress-container">
                                                <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>{event.percent}%</span>
                                                <div className="progress-bg">
                                                    <div className="progress-bar" style={{ width: `${event.percent}%`, background: event.color }} />
                                                </div>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Sold</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '14px', color: '#57606A' }}>
                                                <Pencil size={18} style={{ cursor: 'pointer' }} />
                                                <MoreHorizontal size={18} style={{ cursor: 'pointer' }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="stat-card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Recent Activity</h3>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock size={14} color="var(--text-muted)" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
                            {[
                                { icon: Ticket, label: 'New ticket purchase', desc: 'Sarah J. bought 2 VIP tickets for Summer Music Festival', time: '2 mins ago', color: '#1E40AF', iconColor: 'white' },
                                { icon: CheckCircle2, label: 'Event Published', desc: '"Tech Networking Night" is now live and public.', time: '2 hours ago', color: '#10B981', iconColor: 'white' },
                                { icon: Megaphone, label: 'Campaign Sent', desc: 'Email campaign sent to 1,200 previous attendees.', time: '5 hours ago', color: '#92400E', iconColor: 'white' },
                            ].map((act, i) => (
                                <div key={i} style={{ display: 'flex', gap: '18px', position: 'relative' }}>
                                    {i < 2 && <div className="activity-line" />}
                                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: act.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                                        <act.icon size={18} color={act.iconColor} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '4px' }}>{act.label}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.4 }}>{act.desc}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, opacity: 0.6 }}>{act.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrganizerDashboard;
