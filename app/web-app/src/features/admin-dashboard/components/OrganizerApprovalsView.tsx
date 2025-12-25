import { motion } from 'framer-motion';
import { AdminPageHeader } from './AdminPageHeader';

export const OrganizerApprovalsView = () => {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <AdminPageHeader title="Organizer Verification" subtitle="Review business credentials and verify event organizers (12 pending)" />

            <div className="admin-card" style={{ padding: '0' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ORGANIZATION</th>
                            <th>REPRESENTATIVE</th>
                            <th>DOCUMENTS</th>
                            <th>RISK LEVEL</th>
                            <th style={{ textAlign: 'right' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { org: 'Ethio-Jazz Events', rep: 'Dr. Elias T.', docs: 'Business License, ID', risk: 'Low', color: '#10B981' },
                            { org: 'Nightlife Addis', rep: 'Sara M.', docs: 'ID Only (Missing License)', risk: 'High', color: '#EF4444' },
                            { org: 'Tech Summit Co.', rep: 'Michael B.', docs: 'VAT, License, ID', risk: 'Low', color: '#10B981' },
                        ].map((org, i) => (
                            <tr key={i}>
                                <td><p style={{ fontWeight: 800 }}>{org.org}</p></td>
                                <td>{org.rep}</td>
                                <td style={{ fontSize: '0.8rem', color: '#3B82F6', fontWeight: 700 }}>{org.docs}</td>
                                <td><span style={{ color: org.color, fontWeight: 900 }}>{org.risk}</span></td>
                                <td style={{ textAlign: 'right' }}>
                                    <button style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>Verify Profile</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};
