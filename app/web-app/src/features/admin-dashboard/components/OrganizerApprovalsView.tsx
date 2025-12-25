import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';
import { Loader2, Check, X, ShieldCheck, ChevronDown, ChevronUp, Mail, Phone, MapPin } from 'lucide-react';

export const OrganizerApprovalsView = () => {
    const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
    const [approvedOrganizers, setApprovedOrganizers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [expandedOrgId, setExpandedOrgId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [pending, approved]: any = await Promise.all([
                AdminService.getPendingOrganizers(),
                AdminService.getApprovedOrganizers()
            ]);
            setPendingOrganizers(pending);
            setApprovedOrganizers(approved);
        } catch (err: any) {
            setError(err.error || 'Failed to load organizers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReview = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            setProcessingId(id);
            await AdminService.reviewOrganizer(id, status, `Reviewed by admin at ${new Date().toLocaleString()}`);
            fetchData(); // Refresh both lists
        } catch (err: any) {
            alert(err.error || 'Failed to review organizer');
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
                title="Organizer Verification"
                subtitle={`Verification queue and verified business partners.`}
            />

            {error && (
                <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '12px', marginBottom: '24px', fontWeight: 600 }}>
                    {error}
                </div>
            )}

            {/* 🟠 Pending Section */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 900 }}>
                        {pendingOrganizers.length} PENDING
                    </div>
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
                                            <p style={{ fontWeight: 800, color: 'white' }}>{org.organizationName}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reg: {new Date(org.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td>
                                            <p style={{ fontSize: '0.9rem' }}>{org.contactPhone}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{org.contactEmail}</p>
                                        </td>
                                        <td>{org.city}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleReview(org.id, 'APPROVED')}
                                                    disabled={processingId === org.id}
                                                    style={{ background: '#10B981', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                >
                                                    {processingId === org.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
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

            {/* 🟢 Approved Section */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 900 }}>
                        {approvedOrganizers.length} VERIFIED PARTNERS
                    </div>
                </div>

                <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ORGANIZATION</th>
                                <th>VERIFIED SINCE</th>
                                <th>CITY</th>
                                <th style={{ textAlign: 'right' }}>DETAILS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvedOrganizers.map((org) => (
                                <React.Fragment key={org.id}>
                                    <tr
                                        onClick={() => setExpandedOrgId(expandedOrgId === org.id ? null : org.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '6px', borderRadius: '50%' }}>
                                                    <ShieldCheck size={16} />
                                                </div>
                                                <span style={{ fontWeight: 800 }}>{org.organizationName}</span>
                                            </div>
                                        </td>
                                        <td>{new Date(org.updatedAt).toLocaleDateString()}</td>
                                        <td>{org.city}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            {expandedOrgId === org.id ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                                        </td>
                                    </tr>
                                    <AnimatePresence>
                                        {expandedOrgId === org.id && (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '0', background: 'rgba(255,255,255,0.01)' }}>
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{ overflow: 'hidden', padding: '24px' }}
                                                    >
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                                                            <div className="detail-item">
                                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Business Email</p>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                                                    <Mail size={14} color="#3B82F6" /> {org.contactEmail}
                                                                </div>
                                                            </div>
                                                            <div className="detail-item">
                                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Phone Support</p>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                                                    <Phone size={14} color="#10B981" /> {org.contactPhone}
                                                                </div>
                                                            </div>
                                                            <div className="detail-item">
                                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Primary Hub</p>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                                                                    <MapPin size={14} color="#EF4444" /> {org.city || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Financial Configuration</p>
                                                            <div style={{ background: '#0B0E14', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                                <p style={{ fontSize: '0.85rem' }}><strong>Payout Details:</strong> {org.payoutDetails || 'No bank info provided'}</p>
                                                                <p style={{ fontSize: '0.85rem', marginTop: '4px' }}><strong>Admin Note:</strong> <span style={{ color: 'var(--text-muted)' }}>{org.adminNote || 'No review notes found.'}</span></p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};
