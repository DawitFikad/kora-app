import React, { useState, useEffect } from 'react';
import DecisionModal from './DecisionModal';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';
import { exportToCSV } from '../../../core/utils/export';
import { Download, Loader2, Check, X, ShieldCheck } from 'lucide-react';

export const OrganizerApprovalsView = () => {
    const { t } = useTranslation();
    const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
    const [approvedOrganizers, setApprovedOrganizers] = useState<any[]>([]);
    const [rejectedOrganizers, setRejectedOrganizers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
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
            setPendingOrganizers(pending);
            setApprovedOrganizers(approved);
            setRejectedOrganizers(rejected);
        } catch (err: any) {
            setError(err.error || 'Failed to load organizers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReview = async (id: number, status: 'APPROVED' | 'REJECTED', commission?: any) => {
        // open modal to collect reason and optional commission
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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader
                title={t('admin.organizers')}
                subtitle={t('admin.organizer_approvals_desc', 'Review and process official organizer registration applications.')}
                actions={
                    <button
                        onClick={() => exportToCSV(pendingOrganizers.map(o => ({
                            Organization: o.organizationName,
                            Contact: o.contactPhone,
                            Email: o.contactEmail,
                            City: o.city,
                            Details: o.payoutDetails,
                            Status: o.status,
                            Joined: o.createdAt
                        })), 'organizer_applications.csv')}
                        className="btn-blue" style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        <Download size={16} /> {t('admin.export_list', 'Export List')}
                    </button>
                }
            />

            {error && (
                <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '12px', marginBottom: '24px', fontWeight: 600 }}>
                    {error}
                </div>
            )}

            {/* 🟠 Pending Section */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#F59E0B', width: '12px', height: '12px', borderRadius: '50%' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>Moderation Queue ({pendingOrganizers.length})</h3>
                </div>

                <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ORGANIZATION</th>
                                <th>CONTACT</th>
                                <th>CITY</th>
                                <th style={{ textAlign: 'right' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingOrganizers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                        No pending organizers found.
                                    </td>
                                </tr>
                            ) : (
                                pendingOrganizers.map((org) => (
                                    <tr key={org.id}>
                                        <td>
                                            <p style={{ fontWeight: 800, color: 'var(--text-main)' }}>{org.organizationName}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reg: {new Date(org.createdAt).toLocaleDateString()}</p>
                                            {org.documents && org.documents.length > 0 && (
                                                <div style={{ marginTop: 8 }}>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800 }}>Documents</div>
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                                        {org.documents.map((d: any, idx: number) => (
                                                            <a key={idx} href={d.url || '#'} target="_blank" rel="noreferrer" style={{ padding: '6px 8px', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-main)', textDecoration: 'none' }}>{d.name || `Doc ${idx + 1}`}</a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <p style={{ fontSize: '0.9rem' }}>{org.contactPhone}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{org.contactEmail}</p>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <div>{org.city}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Risk: <strong style={{ color: org.documents && org.documents.length > 0 ? (new Date(org.createdAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 ? '#10B981' : '#F59E0B') : '#EF4444' }}>{org.documents && org.documents.length > 0 ? (new Date(org.createdAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000 ? 'Low' : 'Medium') : 'High'}</strong></div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                                <input
                                                    type="number"
                                                    id={`org-comm-${org.id}`}
                                                    placeholder="Comm %"
                                                    defaultValue={10}
                                                    style={{ width: '80px', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-main)' }}
                                                />
                                                <input
                                                    type="number"
                                                    id={`org-conv-${org.id}`}
                                                    placeholder="Fixed Fee"
                                                    defaultValue={0}
                                                    style={{ width: '80px', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-main)' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    disabled={processingId === org.id}
                                                    onClick={() => {
                                                        const comm = (document.getElementById(`org-comm-${org.id}`) as HTMLInputElement).value;
                                                        const conv = (document.getElementById(`org-conv-${org.id}`) as HTMLInputElement).value;
                                                        handleReview(org.id, 'APPROVED', { feePercentage: Number(comm), feeFixed: Number(conv), feeType: 'PERCENTAGE' });
                                                    }}
                                                    style={{ background: '#10B981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    {processingId === org.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={16} />}
                                                    Approve
                                                </button>
                                                <button
                                                        onClick={() => handleReview(org.id, 'REJECTED')}
                                                    disabled={processingId === org.id}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

                {/* Decision Modal */}
                {decisionOpen && (
                    <DecisionModal
                        open={decisionOpen}
                        title={`${decisionContext?.status} Organizer`}
                        showCommission={true}
                        initialCommission={decisionContext?.commission}
                        onCancel={() => { setDecisionOpen(false); setDecisionContext(null); }}
                        onConfirm={(p: any) => confirmDecision(p)}
                    />
                )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* 🟢 Approved Section */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10B981', marginBottom: '20px' }}>Verified Partners ({approvedOrganizers.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {approvedOrganizers.length > 0 ? approvedOrganizers.map((org) => (
                            <div key={org.id} style={{ display: 'flex', flexDirection: 'column', padding: '16px', background: 'var(--bg-subtle)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editingOrgId === org.id ? '16px' : '0' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)' }}>{org.organizationName}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{org.feePercentage}% + ETB {org.feeFixed} | {org.city}</p>
                                    </div>
                                    {editingOrgId === org.id ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setEditingOrgId(null)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem' }}>Cancel</button>
                                            <button
                                                onClick={() => {
                                                    const comm = (document.getElementById(`edit-comm-${org.id}`) as HTMLInputElement).value;
                                                    const conv = (document.getElementById(`edit-conv-${org.id}`) as HTMLInputElement).value;
                                                    handleUpdateCommission(org.id, { feePercentage: Number(comm), feeFixed: Number(conv), feeType: 'PERCENTAGE' });
                                                }}
                                                style={{ background: 'var(--bg-active)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                                            >Save</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setEditingOrgId(org.id)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Edit Settings</button>
                                    )}
                                </div>

                                {editingOrgId === org.id && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Percent %</label>
                                            <input
                                                type="number"
                                                id={`edit-comm-${org.id}`}
                                                defaultValue={org.feePercentage}
                                                style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'white' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Fixed Fee</label>
                                            <input
                                                type="number"
                                                id={`edit-conv-${org.id}`}
                                                defaultValue={org.feeFixed}
                                                style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', color: 'white' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )) : <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No verified partners yet.</p>}
                    </div>
                </div>

                {/* 🔴 Rejected Section */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#EF4444', marginBottom: '20px' }}>Rejected Applications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {rejectedOrganizers.length > 0 ? rejectedOrganizers.map((org) => (
                            <div key={org.id} style={{ display: 'flex', flexDirection: 'column', padding: '16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)' }}>{org.organizationName}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{org.city || '—'} · {org.contactEmail || 'No email'}</p>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#EF4444' }}>Rejected</span>
                                </div>
                                <p style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Submitted {new Date(org.createdAt).toLocaleDateString()}</p>
                            </div>
                        )) : (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No rejected applications yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
