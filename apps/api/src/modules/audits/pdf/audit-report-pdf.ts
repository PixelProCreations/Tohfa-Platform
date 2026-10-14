/**
 * TOHFA audit report PDF, rendered on demand for a COMPLETED audit.
 *
 * Same renderer and conventions as invoices/pdf/invoice-pdf.ts (pdfkit, colours
 * from @tohfa/design-tokens). Layout is flowing text rather than fixed
 * coordinates because the findings list has no upper bound; pdfkit paginates.
 *
 * WHAT IS (AND IS NOT) ON THIS PAGE. The report goes to the farmer and to
 * admins, never to a customer, so farm name and farm location are allowed
 * here (BR-16 governs customer responses). Aadhaar and mobile numbers are
 * NOT: the input type has no field for them, so the caller cannot pass them
 * even by accident (BR-33). No money appears on an audit report.
 */
import PDFDocument from 'pdfkit';
import { tokens } from '@tohfa/design-tokens';

export interface AuditReportPdfInput {
  auditId: string;
  farmerName: string;
  tohfaFarmerId: string;
  farmName: string | null;
  farmLocation: string | null;
  zoneName: string | null;
  fiscalYear: string;
  quarter: number;
  auditType: string;
  auditorName: string | null;
  externalAgencyName: string | null;
  scheduledFor: string;
  startedAt: string | null;
  completedAt: string | null;
  totalScore: number | null;
  maxScore: number;
  tier: string | null;
  majorViolationsCount: number;
  summary: string | null;
  categories: Array<{ code: string; name: string; score: number | null; maxScore: number; remarks: string | null }>;
  findings: Array<{
    severity: string;
    categoryName: string | null;
    description: string;
    correctiveAction: string | null;
    dueDate: string | null;
    resolvedAt: string | null;
    resolutionNote: string | null;
  }>;
  generatedAt: string;
}

/** Dates on the report are shown in India time, whatever the server's zone. */
function formatIst(iso: string | null): string {
  if (iso === null) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function renderAuditReportPdf(input: AuditReportPdfInput): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', compress: false });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      const primary = tokens.color.primary.hex;
      const primaryDark = tokens.color.primaryDark.hex;
      const pale = tokens.color.primaryPale.hex;
      const border = tokens.neutral.neutral300.hex;
      const grey = tokens.neutral.neutral600.hex;
      const black = tokens.neutral.neutral950.hex;
      const danger = tokens.color.error.hex;
      const left = 40;
      const width = 515;

      // 1. Header
      doc.rect(left, 40, width, 60).fill(pale);
      doc.rect(left, 40, width, 60).stroke(border);
      doc.fillColor(primary).fontSize(18).font('Helvetica-Bold').text('TOHFA FARM AUDIT REPORT', 55, 52);
      doc
        .fillColor(grey)
        .fontSize(9)
        .font('Helvetica')
        .text(`Audit ${input.auditId}`, 55, 76)
        .text(`Generated ${formatIst(input.generatedAt)}`, 355, 76, { width: 185, align: 'right' });

      // 2. Who / where / when
      doc.y = 115;
      const field = (label: string, value: string): void => {
        doc.fillColor(grey).fontSize(9).font('Helvetica-Bold').text(`${label}: `, left, doc.y, { continued: true });
        doc.fillColor(black).font('Helvetica').text(value);
      };
      field('Farmer', `${input.farmerName} (${input.tohfaFarmerId})`);
      field('Farm', input.farmName ?? '-');
      field('Farm location', input.farmLocation ?? '-');
      field('Zone', input.zoneName ?? '-');
      field('Fiscal year / quarter', `${input.fiscalYear}  Q${input.quarter}`);
      field('Audit type', input.auditType);
      field(
        input.auditType === 'EXTERNAL' ? 'Agency' : 'Auditor',
        (input.auditType === 'EXTERNAL' ? input.externalAgencyName : input.auditorName) ?? '-',
      );
      field('Scheduled', formatIst(input.scheduledFor));
      field('Started', formatIst(input.startedAt));
      field('Completed', formatIst(input.completedAt));

      // 3. Category scores
      doc.moveDown();
      const tableTop = doc.y;
      doc.rect(left, tableTop, width, 20).fill(primaryDark);
      doc
        .fillColor(tokens.neutral.white.hex)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Category', left + 8, tableTop + 6, { width: 200 })
        .text('Score', left + 215, tableTop + 6, { width: 60, align: 'right' })
        .text('Remarks', left + 290, tableTop + 6, { width: 215 });
      let rowY = tableTop + 20;
      for (const category of input.categories) {
        const remarks = category.remarks ?? '';
        const rowHeight = Math.max(18, doc.heightOfString(remarks, { width: 215 }) + 8);
        if (rowY + rowHeight > doc.page.height - 60) {
          doc.addPage();
          rowY = 40;
        }
        doc.rect(left, rowY, width, rowHeight).stroke(border);
        doc
          .fillColor(black)
          .fontSize(9)
          .font('Helvetica')
          .text(category.name, left + 8, rowY + 5, { width: 200 })
          .text(
            category.score === null ? '-' : `${category.score} / ${category.maxScore}`,
            left + 215,
            rowY + 5,
            { width: 60, align: 'right' },
          )
          .text(remarks, left + 290, rowY + 5, { width: 215 });
        rowY += rowHeight;
      }

      // 4. Total and tier
      doc.y = rowY + 12;
      doc
        .fillColor(primary)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(
          `Total: ${input.totalScore === null ? '-' : input.totalScore} / ${input.maxScore}    Tier: ${input.tier ?? '-'}`,
          left,
        );
      doc
        .fillColor(input.majorViolationsCount > 0 ? danger : grey)
        .fontSize(9)
        .font('Helvetica')
        .text(`Major violations: ${input.majorViolationsCount}`, left);

      // 5. Summary
      if (input.summary !== null && input.summary.length > 0) {
        doc.moveDown();
        doc.fillColor(primaryDark).fontSize(11).font('Helvetica-Bold').text('Summary', left);
        doc.fillColor(black).fontSize(9).font('Helvetica').text(input.summary, left, doc.y, { width });
      }

      // 6. Findings
      doc.moveDown();
      doc.fillColor(primaryDark).fontSize(11).font('Helvetica-Bold').text(`Findings (${input.findings.length})`, left);
      if (input.findings.length === 0) {
        doc.fillColor(grey).fontSize(9).font('Helvetica').text('No findings were recorded.', left);
      }
      input.findings.forEach((finding, index) => {
        doc.moveDown(0.5);
        doc
          .fillColor(finding.severity === 'MAJOR' ? danger : black)
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(
            `${index + 1}. [${finding.severity}]${finding.categoryName === null ? '' : ` ${finding.categoryName}`}`,
            left,
          );
        doc.fillColor(black).font('Helvetica').text(finding.description, left + 12, doc.y, { width: width - 12 });
        if (finding.correctiveAction !== null) {
          doc.fillColor(grey).text(`Corrective action: ${finding.correctiveAction}`, left + 12, doc.y, {
            width: width - 12,
          });
        }
        doc
          .fillColor(grey)
          .text(
            `Due: ${finding.dueDate ?? '-'}    Status: ${finding.resolvedAt === null ? 'Open' : `Resolved ${formatIst(finding.resolvedAt)}`}`,
            left + 12,
          );
        if (finding.resolutionNote !== null) {
          doc.text(`Resolution: ${finding.resolutionNote}`, left + 12, doc.y, { width: width - 12 });
        }
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
