import React, { useEffect, useState } from 'react';
import { AdminService } from '../../../../core/api/admin.service';
import { downloadBlobAsCSV } from './csvExport';

export const GMVDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        AdminService.getGMV({ range: '30d' })
            .then((res: any) => {
                if (!mounted) return;
                setRows(res?.data || res || []);
            })
            .catch(() => setRows([]))
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false };
    }, []);

    const handleExport = async () => {
        try {
            const blob = await AdminService.exportSettlementLedgerCSV({ type: 'gmv', range: '30d' });
            downloadBlobAsCSV(blob, 'gmv_export.csv');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div>
            <h2>GMV (preview)</h2>
            <p className="text-muted">By date / city / organizer / category — read-only preview</p>
            <div style={{ margin: '12px 0' }}>
                <button className="btn-blue" onClick={handleExport}>Export CSV</button>
            </div>
            {loading ? <div>Loading...</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>City</th>
                            <th>Organizer</th>
                            <th>Category</th>
                            <th>GMV</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && <tr><td colSpan={5}>No data</td></tr>}
                        {rows.map((r, i) => (
                            <tr key={i}>
                                <td>{r.date}</td>
                                <td>{r.city}</td>
                                <td>{r.organizer}</td>
                                <td>{r.category}</td>
                                <td>{r.gmv}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default GMVDashboard;
