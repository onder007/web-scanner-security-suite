import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function generateSecurityPdf(findings, summary, stats, url) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text('Security Assessment Report', 14, 20);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
  doc.text(`Target URL: ${url}`, 14, 34);

  // Security Score Calculation
  let score = 100;
  score -= (summary.critical || 0) * 25;
  score -= (summary.high || 0) * 15;
  score -= (summary.medium || 0) * 5;
  score -= (summary.low || 0) * 1;
  score = Math.max(0, score);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`Overall Security Score: ${score}/100`, 14, 46);

  // Stats Table
  doc.autoTable({
    startY: 52,
    head: [['Metrics', 'Value']],
    body: [
      ['Total Findings', summary.total],
      ['Critical', summary.critical || 0],
      ['High', summary.high || 0],
      ['Medium', summary.medium || 0],
      ['URLs Analyzed', stats.urlsAnalyzed],
      ['Forms Found', stats.formsFound]
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  });

  // Detailed Findings
  let currentY = doc.lastAutoTable.finalY + 15;
  
  doc.setFontSize(16);
  doc.text('Detailed Findings', 14, currentY);
  currentY += 8;

  if (findings.length === 0) {
    doc.setFontSize(12);
    doc.text('No vulnerabilities detected.', 14, currentY);
  } else {
    const tableData = findings.map(f => [
      f.severity.toUpperCase(),
      f.category,
      f.title,
      f.evidence.substring(0, 100) + (f.evidence.length > 100 ? '...' : '')
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Severity', 'Category', 'Title', 'Evidence']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold' },
        1: { cellWidth: 40 },
        2: { cellWidth: 50 },
        3: { cellWidth: 'auto' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 0) {
          const sev = data.cell.raw;
          if (sev === 'CRITICAL') data.cell.styles.textColor = [239, 68, 68];
          else if (sev === 'HIGH') data.cell.styles.textColor = [249, 115, 22];
          else if (sev === 'MEDIUM') data.cell.styles.textColor = [245, 158, 11];
          else if (sev === 'LOW') data.cell.styles.textColor = [59, 130, 246];
        }
      }
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Automated assessment only. Manual verification required.',
      14, doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10
    );
  }

  doc.save('security-report.pdf');
}
