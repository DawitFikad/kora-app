import { useState, useEffect } from 'react';
import DecisionModal from './DecisionModal';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { AdminService } from '../../../core/api/admin.service';
import { exportToCSV } from '../../../core/utils/export';
import { Download, Loader2, Check, X, Building2, MapPin, Calendar, Mail, Phone, Edit3 } from 'lucide-react';

export const OrganizerApprovalsView = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
    const [approvedOrganizers, setApprovedOrganizers] = useState<any[]>([]);
    const [rejectedOrganizers, setRejectedOrganizers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
    const [decisionOpen, setDecisionOpen] = useState(false);
    const [decisionContext, setDecisionContext] = useState<any>(null);

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
            alert(err.error || 'Failed to review organizer');
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
            alert(err.error || 'Failed to update commission');
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

    const currentList = activeTab === 'pending' ? pendingOrganizers : activeTab === 'approved' ? approvedOrganizers : rejectedOrganizers;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Tab Navigation & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-sidebar)', padding: '6px', borderRadius: '16px', width: 'fit-content', border: '1px solid var(--border)' }}>
                    {(['pending', 'approved', 'rejected'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: activeTab === tab ? 'var(--bg-active)' : 'transparent',
                                color: activeTab === tab ? 'white' : 'var(--text-muted)',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab === 'pending' ? t('admin.approvals.pending_tab') : tab === 'approved' ? t('admin.approvals.approved_tab') : t('admin.approvals.rejected_tab')}
                            {tab === 'pending' && pendingOrganizers.length > 0 && (
                                <span style={{ marginLeft: '8px', padding: '2px 6px', background: '#EF4444', color: 'white', borderRadius: '6px', fontSize: '0.65rem' }}>
                                    {pendingOrganizers.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => exportToCSV(currentList.map(o => ({
                        Organization: o.organizationName,
                        Email: o.contactEmail,
                        City: o.city,
                        Status: o.status
                    })), 'organizers.csv')}
                    className="btn-blue"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px' }}
                >
                    <Download size={18} />
                    {t('admin.export', 'Export CSV')}
                </button>
            </div>

            <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
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
                            currentList.map((org) => (
                                <tr key={org.id}>
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
                                                <button onClick={() => fetchData()} style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
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
        </motion.div>
    );
};
