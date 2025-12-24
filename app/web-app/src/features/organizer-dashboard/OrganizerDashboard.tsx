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
    Layout,
    Filter,
    Plus,
    ChevronRight,
    User,
    CreditCard,
    Target,
    Share2,
    DollarSign,
    PieChart,
    Shield,
    Smartphone,
    Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Shared Components ---

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

const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '6px', letterSpacing: '-0.02em' }}>{title}</h1>
            {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: '12px' }}>{actions}</div>}
    </div>
);

// --- Sub-Pages Components ---

const DashboardView = () => {
    const stats = [
        { label: 'Total Revenue', value: '$12,450', change: '+12% vs last week', icon: CreditCardIcon, bgColor: 'rgba(29, 144, 245, 0.1)', iconColor: '#1D90F5' },
        { label: 'Tickets Sold', value: '450 / 600', change: '+5% new sales', icon: Ticket, bgColor: 'rgba(251, 191, 36, 0.1)', iconColor: '#FBBF24' },
        { label: 'Page Views', value: '1,200', change: '+8% traffic increase', icon: Eye, bgColor: 'rgba(167, 139, 250, 0.1)', iconColor: '#A78BFA' },
        { label: 'Next Payout', value: '$3,200', change: 'Scheduled: Sept 15', icon: Building2, bgColor: 'rgba(236, 72, 153, 0.1)', iconColor: '#EC4899' },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Welcome back, Alex" subtitle="Here is what’s happening with your events today." />

            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
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
        </motion.div>
    );
};

const MyEventsView = () => {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <PageHeader
                title="My Events"
                subtitle="Manage and track all your scheduled events."
                actions={
                    <>
                        <button className="btn-blue" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                            <Plus size={18} /> Create New Event
                        </button>
                    </>
                }
            />

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {['All Events', 'Pubished', 'Drafts', 'Past Events'].map((filter, i) => (
                    <button key={i} style={{
                        padding: '8px 16px', borderRadius: '100px', background: i === 0 ? 'var(--bg-active)' : 'rgba(255,255,255,0.05)',
                        border: 'none', color: i === 0 ? 'white' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                    }}>
                        {filter}
                    </button>
                ))}
                <button style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <Filter size={16} /> Filters
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {[
                    { name: 'Summer Music Festival 2024', date: 'Aug 24, 2024', status: 'Live', sales: '85%', venues: 'Millennium Hall', img: 'https://images.unsplash.com/photo-1459749411177-042180ce673b?w=400&q=80' },
                    { name: 'Tech Networking Night', date: 'Sept 02, 2024', status: 'Selling Fast', sales: '42%', venues: 'Skylight Hotel', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80' },
                    { name: 'Gospel Concert Live', date: 'Oct 15, 2024', status: 'Upcoming', sales: '0%', venues: 'Addis Ababa Stadium', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80' },
                    { name: 'Digital Art Expo', date: 'Nov 10, 2024', status: 'Draft', sales: '-', venues: 'Museum of Modern Art', img: 'https://images.unsplash.com/photo-1545235617-946f02a58938?w=400&q=80' },
                ].map((event, i) => (
                    <div key={i} className="stat-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ height: '160px', width: '100%', position: 'relative' }}>
                            <img src={event.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                <span className={`pill ${event.status === 'Live' ? 'pill-green' : 'pill-blue'}`} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>{event.status}</span>
                            </div>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>{event.name}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <Calendar size={14} /> {event.date}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <Globe size={14} /> {event.venues}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Ticket Sales: </span>
                                    <span style={{ color: '#10B981' }}>{event.sales}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Pencil size={16} /></button>
                                    <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><BarChart3 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const TicketsView = () => {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Ticket Management" subtitle="Create and manage ticket tiers, pricing and availability." />

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                <div className="stat-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Active Ticket Tiers</h3>
                        <button className="btn-blue" style={{ padding: '8px 16px', fontSize: '0.85rem' }}><Plus size={16} /> Add Tier</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { name: 'Early Bird', price: '$45.00', sold: '150/150', status: 'Sold Out', color: '#EF4444' },
                            { name: 'General Admission', price: '$65.00', sold: '245/400', status: 'Active', color: '#10B981' },
                            { name: 'VIP Experience', price: '$120.00', sold: '55/100', status: 'Few Left', color: '#FBBF24' },
                        ].map((tier, i) => (
                            <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ticket size={20} color="var(--text-muted)" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: 800 }}>{tier.name}</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tier.price}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>{tier.sold}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tickets Sold</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: tier.color, display: 'block', marginBottom: '4px' }}>{tier.status}</span>
                                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><Settings size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Inventory Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Capacity</span>
                                <span style={{ fontWeight: 800 }}>650</span>
                            </div>
                            <div className="progress-bg" style={{ width: '100%', height: '8px' }}>
                                <div className="progress-bar" style={{ width: '69%', background: 'var(--bg-active)' }} />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>450/650 tickets issued across all tiers.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>RESERVED</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900 }}>42</p>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>CHECKED IN</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900 }}>12</p>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <button className="btn-blue" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                                Manage Hold & Allocations
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const MarketingView = () => {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PageHeader title="Marketing & Buzz" subtitle="Grow your audience with powerful promotion tools." />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {[
                    { label: 'Total Reach', value: '45.2k', change: '+18%', icon: Target },
                    { label: 'Attribution', value: '3.4%', change: '+0.5%', icon: Share2 },
                    { label: 'Promo Conversion', value: '12.8%', change: '+2.1%', icon: TrendingUp },
                ].map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon-box" style={{ background: 'rgba(29, 144, 245, 0.1)', color: '#1D90F5', marginBottom: '16px' }}>
                            <stat.icon size={20} />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{stat.label}</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stat.value}</h3>
                        <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800 }}>{stat.change} ↑</span>
                    </div>
                ))}
            </div>

            <div className="stat-card" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Active Campaigns</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                        { name: 'Early Bird Blast', channel: 'Email/SMS', perf: '8.2k Clicks', status: 'Running', date: 'Started Today' },
                        { name: 'Facebook Ad Set - Summer Fest', channel: 'Paid Social', perf: '2.4k Views', status: 'Running', date: 'Scheduled for 7 days' },
                        { name: 'Influencer Tracking - Addis Buzz', channel: 'Influencers', perf: '450 Sales', status: 'Active', date: 'Permanent' },
                    ].map((camp, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontWeight: 800 }}>{camp.name}</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>via {camp.channel}</p>
                            </div>
                            <div style={{ flex: 1, textAlign: 'center' }}>
                                <p style={{ fontWeight: 900 }}>{camp.perf}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Performance</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <button style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>View Insights</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const ReportsView = () => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageHeader
                title="Financial Reports"
                subtitle="Detailed breakdown of sales, taxes, and payouts."
                actions={<button className="btn-blue" style={{ background: '#161B22', color: 'white' }}><Download size={18} /> Export CSV</button>}
            />

            <div className="stats-grid">
                {[
                    { label: 'Gross Sales', value: '$42,500', icon: DollarSign, color: '#1D90F5' },
                    { label: 'Total Payouts', value: '$38,200', icon: CreditCard, color: '#10B981' },
                    { label: 'Processing Fees', value: '$1,840', icon: Shield, color: '#EF4444' },
                    { label: 'Available Balance', value: '$2,460', icon: Package, color: '#FBBF24' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{s.label}</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{s.value}</h3>
                    </div>
                ))}
            </div>

            <div className="stat-card" style={{ padding: '0' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Transaction History</h3>
                </div>
                <table className="event-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { id: '#ORD-9021', name: 'Abinet Kebede', date: 'Oct 12, 2:45 PM', amount: '$130.00', status: 'Completed' },
                            { id: '#ORD-9020', name: 'Sara Mohammed', date: 'Oct 12, 1:12 PM', amount: '$65.00', status: 'Completed' },
                            { id: '#ORD-9019', name: 'Elias Tadesse', date: 'Oct 11, 11:20 PM', amount: '$195.00', status: 'Processing' },
                            { id: '#ORD-9018', name: 'Lily Thompson', date: 'Oct 11, 8:05 PM', amount: '$65.00', status: 'Completed' },
                        ].map((tx, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 800, color: '#1D90F5' }}>{tx.id}</td>
                                <td style={{ fontWeight: 700 }}>{tx.name}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{tx.date}</td>
                                <td style={{ fontWeight: 800 }}>{tx.amount}</td>
                                <td><span className="pill pill-green" style={{ background: tx.status === 'Processing' ? 'rgba(251, 191, 36, 0.1)' : undefined, color: tx.status === 'Processing' ? '#FBBF24' : undefined }}>{tx.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

const SettingsView = () => {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <PageHeader title="Profile Settings" subtitle="Control your organization profile and account preferences." />

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['General', 'Payout Methods', 'Team Access', 'Notifications', 'Security', 'Billing'].map((tab, i) => (
                        <div key={i} style={{
                            padding: '12px 16px', borderRadius: '10px', background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
                            color: i === 0 ? 'white' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer'
                        }}>
                            {tab}
                        </div>
                    ))}
                </div>

                <div className="stat-card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Public Profile</h3>

                    <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', alignItems: 'center' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '20px', background: 'linear-gradient(45deg, #1D90F5, #D946EF)', padding: '4px' }}>
                            <img src="https://ui-avatars.com/api/?name=Alex+Morgan&background=11141B&color=fff&size=128" style={{ width: '100%', height: '100%', borderRadius: '16px' }} />
                        </div>
                        <div>
                            <button className="btn-blue" style={{ background: 'white', color: 'black', padding: '8px 16px', fontSize: '0.85rem' }}>Change Logo</button>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>At least 512x512px. JPG or PNG only.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Organization Name</label>
                            <input type="text" defaultValue="Alex Morgan Events" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>Contact Email</label>
                            <input type="email" defaultValue="alex@events.com" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>About the Organizer</label>
                        <textarea rows={4} defaultValue="The leading event management firm in Addis Ababa, specializing in music festivals and tech networking events." style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', color: 'white', resize: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn-blue" style={{ padding: '12px 24px' }}>Save Changes</button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// --- Main Application Component ---

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

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard': return <DashboardView />;
            case 'My Events': return <MyEventsView />;
            case 'Tickets': return <TicketsView />;
            case 'Marketing': return <MarketingView />;
            case 'Reports': return <ReportsView />;
            case 'Settings': return <SettingsView />;
            default: return <DashboardView />;
        }
    }

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
                    <div style={{ opacity: activeTab === 'Dashboard' ? 1 : 0, pointerEvents: activeTab === 'Dashboard' ? 'all' : 'none' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dashboard Overview</h2>
                    </div>

                    <div className="search-pill">
                        <Search size={18} color="#8E9BAE" />
                        <input type="text" placeholder={`Search ${activeTab.toLowerCase()}...`} />
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

                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>

            </main>
        </div>
    );
};

export default OrganizerDashboard;
