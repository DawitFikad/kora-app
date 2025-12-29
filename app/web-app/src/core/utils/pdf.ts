import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (data: any[], columns: string[], filename: string, title?: string) => {
    const doc = new jsPDF() as any;

    if (title) {
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    }

    const tableRows: any[] = [];
    data.forEach(item => {
        const rowData: any[] = [];
        columns.forEach(col => {
            rowData.push(item[col]);
        });
        tableRows.push(rowData);
    });

    doc.autoTable({
        head: [columns.map(c => c.toUpperCase())],
        body: tableRows,
        startY: title ? 40 : 20,
        theme: 'striped',
        headStyles: { fillColor: [29, 144, 245], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 8 }
    });

    doc.save(filename);
};
