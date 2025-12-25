import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminService } from '../../../core/api/admin.service';
import { Loader2, Check, X } from 'lucide-react';

export const OrganizerApprovalsView = () => {
    const [organizers, setOrganizers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchOrganizers = async () => {
        try {
            setIsLoading(true);
            const data: any = await AdminService.getPendingOrganizers();
            setOrganizers(data);
        } catch (err: any) {
            setError(err.error || 'Failed to load organizers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const handleReview = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            setProcessingId(id);
            await AdminService.reviewOrganizer(id, status, `Reviewed by admin at ${new Date().toLocaleString()}`);
            // Remove from list or update status
            setOrganizers(prev => prev.filter(org => org.id !== id));
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

    const pendingCount = organizers.filter(o => o.status === 'PENDING').length;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader
                title="Organizer Verification"
                subtitle={`Review business credentials and verify event organizers (${pendingCount} pending)`}
            />

            {error && (
                <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '12px', marginBottom: '24px', fontWeight: 600 }}>
                    {error}
                </div>
            )}

            <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ORGANIZATION</th>
                            <th>CONTACT</th>
                            <th>CITY</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'right' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {organizers.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No pending organizers found.
                                </td>
                            </tr>
                        ) : (
                            organizers.map((org) => (
                                <tr key={org.id}>
                                    <td>
                                        <p style={{ fontWeight: 800, color: 'white' }}>{org.organizationName}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered: {new Date(org.createdAt).toLocaleDateString()}</p>
                                    </td>
                                    <td>
                                        <p style={{ fontSize: '0.9rem' }}>{org.contactPhone}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{org.contactEmail}</p>
                                    </td>
                                    <td>{org.city}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            background: org.status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            color: org.status === 'PENDING' ? '#F59E0B' : '#10B981'
                                        }}>
                                            {org.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleReview(org.id, 'APPROVED')}
                                                disabled={processingId === org.id}
                                                style={{
                                                    background: '#10B981', color: 'white', border: 'none',
                                                    width: '36px', height: '36px', borderRadius: '10px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                                title="Approve"
                                            >
                                                {processingId === org.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleReview(org.id, 'REJECTED')}
                                                disabled={processingId === org.id}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)',
                                                    width: '36px', height: '36px', borderRadius: '10px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer'
                                                }}
                                                title="Reject"
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
        </motion.div>
    );
};
