import { useState, useEffect } from 'react';
import DecisionModal from './DecisionModal';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminService } from '../../../core/api/admin.service';
import { exportToCSV } from '../../../core/utils/export';
import { exportToPDF } from '../../../core/utils/pdf';
import { Download, Loader2, Check, X, Building2, MapPin, Calendar, Mail, Phone, Edit3, FileText, Image, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Pagination from '../../../core/components/Pagination';
import { useDialog } from '../../../core/context/DialogContext';

export const OrganizerApprovalsView = () => {
    const { t } = useTranslation();
    const dialog = useDialog();
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('approved');
    const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
    const [approvedOrganizers, setApprovedOrganizers] = useState<any[]>([]);
    const [rejectedOrganizers, setRejectedOrganizers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
    const [decisionOpen, setDecisionOpen] = useState(false);
    const [decisionContext, setDecisionContext] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const pageSize = 10;

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [pending, approved, rejected]: any = await Promise.all([
                AdminService.getPendingOrganizers(),
                AdminService.getApprovedOrganizers(),
                AdminService.getRejectedOrganizers()
            ]);
            setPendingOrganizers(pending || []);
            setApprovedOrganizers(approved || []);
            setRejectedOrganizers(rejected || []);
        } catch (err) {
            console.error('Failed to load organizers', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const handleReview = (id: number, status: 'APPROVED' | 'REJECTED', commission?: any) => {
        setDecisionContext({ type: 'organizer', id, status, commission });
        setDecisionOpen(true);
    };

    const confirmDecision = async (payload: { reason: string; commission?: any }) => {
        if (!decisionContext) return;
        const { id, status } = decisionContext;
        try {
            setProcessingId(id);
            await AdminService.reviewOrganizer(id, status, payload.reason, payload.commission);
            setDecisionOpen(false);
            setDecisionContext(null);
            fetchData();
        } catch (err: any) {
            await dialog.alert({ title: t('common.error', 'Error'), message: err?.error || t('admin.team.failed', 'Action failed') });
        } finally {
            setProcessingId(null);
        }
    };

    const handleUpdateCommission = async (id: number, commission: any) => {
        try {
            setProcessingId(id);
            await AdminService.reviewOrganizer(id, 'APPROVED', `Commission update by admin`, commission);
            setEditingOrgId(null);
            fetchData();
        } catch (err: any) {
            await dialog.alert({ title: t('common.error', 'Error'), message: err?.error || t('admin.team.failed', 'Action failed') });
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    const allItems = activeTab === 'pending' ? pendingOrganizers : activeTab === 'approved' ? approvedOrganizers : rejectedOrganizers;
    const startIndex = (currentPage - 1) * pageSize;
    const currentList = allItems.slice(startIndex, startIndex + pageSize);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* 📑 Premium Control Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px',
                background: 'var(--bg-card)',
                padding: '24px',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    background: 'var(--bg-subtle)',
                    padding: '8px',
                    borderRadius: '20px',
                    width: 'fit-content',
                    border: '1px solid var(--border)'
                }}>
                    {[
                        { id: 'approved', label: 'Active Partners', icon: CheckCircle2, color: '#10B981' },
                        { id: 'pending', label: 'Pending Review', icon: Clock, color: '#F59E0B', count: pendingOrganizers.length },
                        { id: 'rejected', label: 'Removed/Rejected', icon: XCircle, color: '#EF4444' },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '14px 28px',
                                    borderRadius: '16px',
                                    border: isActive ? `1px solid ${tab.color}40` : '1px solid transparent',
                                    background: isActive ? 'var(--bg-card)' : 'transparent',
                                    color: isActive ? tab.color : 'var(--text-muted)',
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isActive ? `0 10px 20px ${tab.color}15` : 'none',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Icon size={18} color={isActive ? tab.color : 'var(--text-muted)'} />
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span style={{
                                        marginLeft: '6px',
                                        padding: '2px 8px',
                                        background: tab.color,
                                        color: 'white',
                                        borderRadius: '8px',
                                        fontSize: '0.7rem',
                                        fontWeight: 900,
                                        boxShadow: `0 4px 10px ${tab.color}40`
                                    }}>
                                        {tab.count}
                                    </span>
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="premiumTabGlow"
                                        style={{
                                            position: 'absolute',
                                            bottom: '-2px',
                                            left: '20%',
                                            right: '20%',
                                            height: '2.5px',
                                            background: tab.color,
                                            boxShadow: `0 0 15px ${tab.color}`,
                                            borderRadius: '100px'
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        onClick={() => {
                            setIsExporting(true);
                            exportToCSV(allItems.map(o => ({
                                Organization: o.organizationName,
                                Email: o.contactEmail,
                                City: o.city,
                                Status: o.status,
                                Joined: new Date(o.createdAt).toLocaleDateString()
                            })), 'organizers_report.csv');
                            setTimeout(() => setIsExporting(false), 2000);
                        }}
                        disabled={isExporting}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 28px',
                            borderRadius: '18px',
                            fontWeight: 900,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0,0,0,0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} color="var(--primary)" />}
                        {t('admin.export', 'Export Data')}
                    </button>
                    <button
                        onClick={() => {
                            setIsExporting(true);
                            exportToPDF(allItems.map(o => ({
                                'Org Name': o.organizationName,
                                'Email': o.contactEmail,
                                'City': o.city,
                                'Status': o.status
                            })), ['Org Name', 'Email', 'City', 'Status'], 'organizers_full_report.pdf', 'Organizer Comprehensive Directory');
                            setTimeout(() => setIsExporting(false), 2000);
                        }}
                        disabled={isExporting}
                        style={{
                            background: '#FF0000',
                            color: 'white',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 28px',
                            borderRadius: '18px',
                            fontWeight: 950,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 8px 20px -5px rgba(59, 130, 246, 0.4)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 15px 30px -8px rgba(59, 130, 246, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 20px -5px rgba(59, 130, 246, 0.4)';
                        }}
                    >
                        <FileText size={20} />
                        Detailed PDF
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="admin-card"
                    style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '24px' }}
                >
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>#</th>
                                <th>{t('admin.approvals.organizer_name')}</th>
                                <th>{t('admin.approvals.contact_info')}</th>
                                <th>{t('admin.approvals.location')}</th>
                                {activeTab === 'approved' && <th>{t('admin.approvals.commission_config')}</th>}
                                <th style={{ textAlign: 'right' }}>{t('admin.approvals.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                                        <Building2 size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                        <p>{activeTab === 'pending' ? t('admin.approvals.no_pending') : activeTab === 'approved' ? t('admin.approvals.no_approved') : t('admin.approvals.no_rejected')}</p>
                                    </td>
                                </tr>
                            ) : (
                                currentList.map((org, index) => (
                                    <tr key={org.id}>
                                        <td style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {startIndex + index + 1}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Building2 size={20} color="var(--primary)" />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 800, color: 'var(--text-main)' }}>{org.organizationName}</p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        <Calendar size={10} />
                                                        {new Date(org.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                    <Mail size={12} color="var(--text-muted)" />
                                                    {org.contactEmail}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    <Phone size={12} />
                                                    {org.contactPhone}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                <MapPin size={12} color="var(--primary)" />
                                                {org.city}
                                            </div>
                                        </td>
                                        {activeTab === 'approved' && (
                                            <td>
                                                {editingOrgId === org.id ? (
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <input
                                                            type="number"
                                                            className="admin-input-small"
                                                            style={{ width: '60px' }}
                                                            defaultValue={org.feePercentage}
                                                            id={`rate-${org.id}`}
                                                        />
                                                        <input
                                                            type="number"
                                                            className="admin-input-small"
                                                            style={{ width: '60px' }}
                                                            defaultValue={org.feeFixed}
                                                            id={`fixed-${org.id}`}
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateCommission(org.id, {
                                                                feePercentage: parseFloat((document.getElementById(`rate-${org.id}`) as HTMLInputElement).value),
                                                                feeFixed: parseFloat((document.getElementById(`fixed-${org.id}`) as HTMLInputElement).value),
                                                                feeType: 'PERCENTAGE'
                                                            })}
                                                            className="btn-blue-icon-small"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{org.feePercentage}% + {org.feeFixed} ETB</span>
                                                        <button onClick={() => setEditingOrgId(org.id)} style={{ padding: '4px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                            <Edit3 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                        <td style={{ textAlign: 'right' }}>
                                            {activeTab === 'pending' ? (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {(org.businessLicense || org.eventPoster) && (
                                                        <div style={{ display: 'flex', gap: '4px', marginRight: '8px' }}>
                                                            {org.businessLicense && (
                                                                <a
                                                                    href={org.businessLicense}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                    title={t('admin.approvals.view_license', 'View Business License')}
                                                                >
                                                                    <FileText size={16} />
                                                                </a>
                                                            )}
                                                            {org.eventPoster && (
                                                                <a
                                                                    href={org.eventPoster}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                    title={t('admin.approvals.view_poster', 'View Event Poster')}
                                                                >
                                                                    <Image size={16} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => handleReview(org.id, 'APPROVED')}
                                                        style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        {processingId === org.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={16} />}
                                                        {t('admin.approvals.approve')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReview(org.id, 'REJECTED')}
                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => setSelectedItem(org)} style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
                                                        {t('admin.overview.details')}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </motion.div>
            </AnimatePresence>

            <div style={{ marginTop: '32px' }}>
                <Pagination
                    currentPage={currentPage}
                    totalItems={allItems.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            </div>

            {decisionOpen && (
                <DecisionModal
                    open={decisionOpen}
                    title={`${decisionContext?.status === 'APPROVED' ? t('admin.approvals.approve') : t('admin.approvals.reject')} ${t('admin.sidebar.organizers_nav')}`}
                    showCommission={decisionContext?.status === 'APPROVED'}
                    initialCommission={decisionContext?.commission}
                    onCancel={() => { setDecisionOpen(false); setDecisionContext(null); }}
                    onConfirm={(p: any) => confirmDecision(p)}
                />
            )}

            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedItem(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)', borderRadius: '32px', border: '1px solid var(--border)', padding: '40px', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{t('admin.overview.details')}</p>
                                    <h2 style={{ margin: 0, fontWeight: 950, fontSize: '1.8rem' }}>{selectedItem.organizationName}</h2>
                                </div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setSelectedItem(null)}>
                                    <X size={18} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>{t('admin.decision.reason_label')}</p>
                                    <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', lineHeight: 1.6, fontWeight: 600 }}>
                                        {selectedItem.adminNote || selectedItem.rejectionReason || selectedItem.statusReason || t('admin.decision.no_reason', 'No specific reason or note provided.')}
                                    </p>
                                </div>

                                {selectedItem.status === 'APPROVED' && selectedItem.feePercentage !== undefined && (
                                    <div style={{ padding: '20px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#10B981', textTransform: 'uppercase', marginBottom: '8px' }}>{t('admin.approvals.commission_config')}</p>
                                        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>
                                            {selectedItem.feePercentage}% + {selectedItem.feeFixed} ETB
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setSelectedItem(null)} style={{ marginTop: '32px', width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 950, fontSize: '0.9rem', cursor: 'pointer' }}>
                                {t('common.close', 'Close')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
