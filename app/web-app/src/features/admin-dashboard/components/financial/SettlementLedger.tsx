import React, { useEffect, useState } from 'react';
import { AdminService } from '../../../../core/api/admin.service';
import { downloadBlobAsCSV } from './csvExport';

export const SettlementLedger: React.FC = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        AdminService.getSettlementLedger({ limit: 100 })
            .then((res: any) => { if (mounted) setRows(res?.data || res || []); })
            .catch(() => setRows([]))
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false };
    }, []);

    const handleExport = async () => {
        try {
            const blob = await AdminService.exportSettlementLedgerCSV({ format: 'csv' });
            downloadBlobAsCSV(blob, 'settlement_ledger.csv');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div>
            <h2>Settlement Ledger (append-only)</h2>
            <p className="text-muted">Immutable rows; corrections appear as compensating transactions.</p>
            <div style={{ margin: '8px 0' }}>
                <button className="btn-blue" onClick={handleExport}>Export CSV</button>
            </div>
            {loading ? <div>Loading ledger...</div> : (
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Ref ID</th>
                            <th>Timestamp</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && <tr><td colSpan={5}>No ledger rows</td></tr>}
                        {rows.map((r, i) => (
                            <tr key={r.refId || i}>
                                <td>{r.refId}</td>
                                <td>{r.timestamp}</td>
                                <td>{r.type}</td>
                                <td>{r.amount}</td>
                                <td>{r.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default SettlementLedger;
