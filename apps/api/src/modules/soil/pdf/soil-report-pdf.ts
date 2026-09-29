import PDFDocument from 'pdfkit';
import { tokens } from '@tohfa/design-tokens';
import type { ClassificationBands, SoilMetricKey } from '../soil.repo.js';

export interface SoilReportPlotData {
  id: string;
  name: string;
  areaAcres: number | null;
  soilType: string | null;
  sunExposure: string | null;
  irrigationType: string | null;
  soilTests: Array<{
    testDate: string;
    nextDueDate: string;
    organicCarbonPct: number;
    ph: number;
    ecDsPerM: number;
    tdsPpm: number | null;
    nitrogenKgPerHa: number | null;
    phosphorusKgPerHa: number | null;
    potassiumKgPerHa: number | null;
    limeStatus: string | null;
    organicCarbonLabel: string;
    phLabel: string;
    ecLabel: string;
    tdsLabel: string | null;
  }>;
  amendments: Array<{
    amendmentType: string;
    quantityKg: number;
    appliedDate: string;
    notes: string | null;
  }>;
  moistureObservations: Array<{
    level: string;
    observedAt: string;
  }>;
  erosionNotes: Array<{
    riskLevel: string;
    practiceNotes: string | null;
    loggedAt: string;
  }>;
  cropRotationSequence: Array<{
    sequenceOrder: number;
    cropName: string;
    plannedDate: string | null;
    status: string;
  }>;
  coverCropWindow: {
    coverCropType: string;
    windowStart: string;
    windowEnd: string;
  } | null;
}

export interface RenderSoilReportOptions {
  farmName: string;
  farmerName: string;
  farmerId: string;
  location: string;
  totalAcres: number | null;
  period: '3 months' | '6 months' | 'All time';
  generatedAt: string;
  includes: {
    tests: boolean;
    amendments: boolean;
    moistureErosion: boolean;
    rotation: boolean;
  };
  plots: SoilReportPlotData[];
}

export function renderSoilReportPdf(options: RenderSoilReportOptions): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', compress: false, bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', (err: Error) => reject(err));

      const primaryColor = tokens.color.primary?.hex ?? '#3F7D32';
      const primaryDark = tokens.color.primaryDark?.hex ?? '#24521C';
      const pageBg = tokens.color.primaryPale?.hex ?? '#F0F7EE';
      const greyBorder = tokens.neutral.neutral300?.hex ?? '#D1D5DB';
      const greyText = tokens.neutral.neutral600?.hex ?? '#4B5563';
      const lightGreyText = tokens.neutral.neutral500?.hex ?? '#6B7280';
      const blackText = tokens.neutral.neutral950?.hex ?? '#111827';
      const white = tokens.neutral.white?.hex ?? '#FFFFFF';
      const alertBg = '#FEF3C7';
      const alertBorder = '#F59E0B';

      let currentY = 40;

      const checkPageBreak = (neededHeight: number) => {
        if (currentY + neededHeight > 750) {
          doc.addPage();
          currentY = 40;
        }
      };

      // ── 1. Top Header Banner ──
      doc.rect(40, currentY, 515, 68).fill(pageBg);
      doc.rect(40, currentY, 515, 68).stroke(greyBorder);

      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold')
         .text('TOHFA AGRICULTURAL ADVISORY', 55, currentY + 12);
      doc.fillColor(greyText).fontSize(8.5).font('Helvetica')
         .text('Soil Health, Nutrition & Conservation Diary', 55, currentY + 32)
         .text('Tohfa Organics Pvt. Ltd. • The Nilgiris, Tamil Nadu • support@tohfa.in', 55, currentY + 46);

      doc.fillColor(primaryDark).fontSize(11).font('Helvetica-Bold')
         .text('SOIL HEALTH REPORT', 320, currentY + 12, { width: 220, align: 'right' });
      doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold')
         .text(`Period: ${options.period}`, 320, currentY + 32, { width: 220, align: 'right' });
      doc.fillColor(greyText).fontSize(7.5).font('Helvetica')
         .text(`Generated: ${options.generatedAt}`, 320, currentY + 46, { width: 220, align: 'right' });

      currentY += 78;

      // ── 2. Farm & Farmer Profile Summary Card ──
      doc.rect(40, currentY, 515, 60).stroke(greyBorder);
      doc.fillColor(primaryDark).fontSize(9.5).font('Helvetica-Bold')
         .text('FARM & GROWER OVERVIEW', 50, currentY + 8);

      doc.fillColor(greyText).fontSize(8).font('Helvetica')
         .text('Farm Name:', 50, currentY + 24)
         .text('Farmer / Grower:', 50, currentY + 36)
         .text('Farmer ID:', 50, currentY + 48);

      doc.fillColor(blackText).fontSize(8).font('Helvetica-Bold')
         .text(options.farmName || 'Primary Farm', 130, currentY + 24)
         .text(options.farmerName || 'Registered Farmer', 130, currentY + 36)
         .text(options.farmerId || 'TOHFA-FARMER', 130, currentY + 48);

      doc.fillColor(greyText).fontSize(8).font('Helvetica')
         .text('Location:', 310, currentY + 24)
         .text('Total Area:', 310, currentY + 36)
         .text('Managed Zones:', 310, currentY + 48);

      doc.fillColor(blackText).fontSize(8).font('Helvetica-Bold')
         .text(options.location || 'The Nilgiris, Tamil Nadu', 380, currentY + 24)
         .text(options.totalAcres != null ? `${options.totalAcres} Acres` : 'N/A', 380, currentY + 36)
         .text(`${options.plots.length} Zone(s)`, 380, currentY + 48);

      currentY += 70;

      // ── 3. Section: Soil Test Records ──
      if (options.includes.tests) {
        checkPageBreak(80);
        doc.rect(40, currentY, 515, 20).fill(primaryDark);
        doc.fillColor(white).fontSize(9).font('Helvetica-Bold')
           .text('1. SOIL LAB TEST RESULTS & CHEMICAL CLASSIFICATION', 50, currentY + 5);
        currentY += 24;

        // Collect all tests across plots
        const allTests = options.plots.flatMap((p) =>
          p.soilTests.map((t) => ({ ...t, plotName: p.name })),
        );

        if (allTests.length === 0) {
          doc.rect(40, currentY, 515, 24).fill(pageBg).stroke(greyBorder);
          doc.fillColor(greyText).fontSize(8).font('Helvetica-Oblique')
             .text('No soil lab tests logged within the selected report period.', 50, currentY + 7);
          currentY += 32;
        } else {
          // Table header
          doc.rect(40, currentY, 515, 18).fill('#E2E8F0');
          doc.fillColor(blackText).fontSize(7.5).font('Helvetica-Bold');
          doc.text('Test Date', 45, currentY + 5, { width: 55 });
          doc.text('Zone / Plot', 105, currentY + 5, { width: 65 });
          doc.text('Org Carbon', 175, currentY + 5, { width: 55 });
          doc.text('pH Value', 235, currentY + 5, { width: 45 });
          doc.text('EC (dS/m)', 285, currentY + 5, { width: 45 });
          doc.text('TDS (ppm)', 335, currentY + 5, { width: 45 });
          doc.text('N-P-K (kg/ha)', 385, currentY + 5, { width: 65 });
          doc.text('Lime / Status', 455, currentY + 5, { width: 95 });
          currentY += 18;

          allTests.forEach((t, i) => {
            checkPageBreak(22);
            const rowBg = i % 2 === 0 ? white : pageBg;
            doc.rect(40, currentY, 515, 20).fill(rowBg).stroke(greyBorder);

            doc.fillColor(blackText).fontSize(7.5).font('Helvetica');
            doc.text(t.testDate, 45, currentY + 5, { width: 55 });
            doc.text(t.plotName, 105, currentY + 5, { width: 65 });
            doc.text(`${t.organicCarbonPct}% (${t.organicCarbonLabel || 'Good'})`, 175, currentY + 5, { width: 55 });
            doc.text(`${t.ph} (${t.phLabel || 'Normal'})`, 235, currentY + 5, { width: 45 });
            doc.text(`${t.ecDsPerM}`, 285, currentY + 5, { width: 45 });
            doc.text(t.tdsPpm != null ? `${t.tdsPpm}` : '-', 335, currentY + 5, { width: 45 });
            
            const npk = [t.nitrogenKgPerHa, t.phosphorusKgPerHa, t.potassiumKgPerHa]
              .map((v) => (v != null ? String(v) : '-'))
              .join('/');
            doc.text(npk, 385, currentY + 5, { width: 65 });
            doc.text(t.limeStatus ? `${t.limeStatus}` : 'Satisfactory', 455, currentY + 5, { width: 95 });

            currentY += 20;
          });
          currentY += 10;
        }
      }

      // ── 4. Section: Soil Amendments Log ──
      if (options.includes.amendments) {
        checkPageBreak(80);
        doc.rect(40, currentY, 515, 20).fill(primaryDark);
        doc.fillColor(white).fontSize(9).font('Helvetica-Bold')
           .text('2. SOIL AMENDMENTS & ORGANIC INPUTS LOG', 50, currentY + 5);
        currentY += 24;

        const allAmendments = options.plots.flatMap((p) =>
          p.amendments.map((a) => ({ ...a, plotName: p.name })),
        );

        if (allAmendments.length === 0) {
          doc.rect(40, currentY, 515, 24).fill(pageBg).stroke(greyBorder);
          doc.fillColor(greyText).fontSize(8).font('Helvetica-Oblique')
             .text('No soil amendments recorded within the selected period.', 50, currentY + 7);
          currentY += 32;
        } else {
          doc.rect(40, currentY, 515, 18).fill('#E2E8F0');
          doc.fillColor(blackText).fontSize(7.5).font('Helvetica-Bold');
          doc.text('Applied Date', 45, currentY + 5, { width: 65 });
          doc.text('Zone / Plot', 115, currentY + 5, { width: 75 });
          doc.text('Amendment / Input Type', 195, currentY + 5, { width: 140 });
          doc.text('Quantity', 340, currentY + 5, { width: 55 });
          doc.text('Notes / Practice Details', 400, currentY + 5, { width: 150 });
          currentY += 18;

          allAmendments.forEach((a, i) => {
            checkPageBreak(22);
            const rowBg = i % 2 === 0 ? white : pageBg;
            doc.rect(40, currentY, 515, 20).fill(rowBg).stroke(greyBorder);

            doc.fillColor(blackText).fontSize(7.5).font('Helvetica');
            doc.text(a.appliedDate, 45, currentY + 5, { width: 65 });
            doc.text(a.plotName, 115, currentY + 5, { width: 75 });
            doc.text(a.amendmentType, 195, currentY + 5, { width: 140 });
            doc.text(`${a.quantityKg} kg`, 340, currentY + 5, { width: 55 });
            doc.text(a.notes || '—', 400, currentY + 5, { width: 150, lineBreak: false });

            currentY += 20;
          });
          currentY += 10;
        }
      }

      // ── 5. Section: Moisture & Erosion Observations ──
      if (options.includes.moistureErosion) {
        checkPageBreak(80);
        doc.rect(40, currentY, 515, 20).fill(primaryDark);
        doc.fillColor(white).fontSize(9).font('Helvetica-Bold')
           .text('3. SOIL MOISTURE TRACKING & EROSION CONSERVATION NOTES', 50, currentY + 5);
        currentY += 24;

        const allMoisture = options.plots.flatMap((p) =>
          p.moistureObservations.map((m) => ({ ...m, plotName: p.name })),
        );
        const allErosion = options.plots.flatMap((p) =>
          p.erosionNotes.map((e) => ({ ...e, plotName: p.name })),
        );

        if (allMoisture.length === 0 && allErosion.length === 0) {
          doc.rect(40, currentY, 515, 24).fill(pageBg).stroke(greyBorder);
          doc.fillColor(greyText).fontSize(8).font('Helvetica-Oblique')
             .text('No moisture observations or erosion notes recorded within this period.', 50, currentY + 7);
          currentY += 32;
        } else {
          if (allMoisture.length > 0) {
            checkPageBreak(40);
            doc.fillColor(primaryDark).fontSize(8.5).font('Helvetica-Bold')
               .text('• Field Moisture Observations:', 45, currentY);
            currentY += 14;

            doc.rect(40, currentY, 515, 16).fill('#E2E8F0');
            doc.fillColor(blackText).fontSize(7.5).font('Helvetica-Bold');
            doc.text('Date Observed', 45, currentY + 4, { width: 100 });
            doc.text('Zone / Plot', 155, currentY + 4, { width: 100 });
            doc.text('Moisture Condition', 265, currentY + 4, { width: 120 });
            currentY += 16;

            allMoisture.forEach((m, i) => {
              checkPageBreak(18);
              const rowBg = i % 2 === 0 ? white : pageBg;
              doc.rect(40, currentY, 515, 16).fill(rowBg).stroke(greyBorder);
              doc.fillColor(blackText).fontSize(7.5).font('Helvetica');
              doc.text(m.observedAt.slice(0, 10), 45, currentY + 4, { width: 100 });
              doc.text(m.plotName, 155, currentY + 4, { width: 100 });
              doc.text(m.level, 265, currentY + 4, { width: 120 });
              currentY += 16;
            });
            currentY += 8;
          }

          if (allErosion.length > 0) {
            checkPageBreak(40);
            doc.fillColor(primaryDark).fontSize(8.5).font('Helvetica-Bold')
               .text('• Erosion Risk & Conservation Practice Notes:', 45, currentY);
            currentY += 14;

            doc.rect(40, currentY, 515, 16).fill('#E2E8F0');
            doc.fillColor(blackText).fontSize(7.5).font('Helvetica-Bold');
            doc.text('Logged Date', 45, currentY + 4, { width: 75 });
            doc.text('Zone / Plot', 125, currentY + 4, { width: 75 });
            doc.text('Erosion Risk', 205, currentY + 4, { width: 80 });
            doc.text('Conservation Practice Notes', 290, currentY + 4, { width: 260 });
            currentY += 16;

            allErosion.forEach((e, i) => {
              checkPageBreak(20);
              const rowBg = i % 2 === 0 ? white : pageBg;
              doc.rect(40, currentY, 515, 18).fill(rowBg).stroke(greyBorder);
              doc.fillColor(blackText).fontSize(7.5).font('Helvetica');
              doc.text(e.loggedAt.slice(0, 10), 45, currentY + 4, { width: 75 });
              doc.text(e.plotName, 125, currentY + 4, { width: 75 });
              doc.text(e.riskLevel, 205, currentY + 4, { width: 80 });
              doc.text(e.practiceNotes || 'Standard contour planting', 290, currentY + 4, { width: 260, lineBreak: false });
              currentY += 18;
            });
            currentY += 10;
          }
        }
      }

      // ── 6. Section: Crop Rotation Plan ──
      if (options.includes.rotation) {
        checkPageBreak(80);
        doc.rect(40, currentY, 515, 20).fill(primaryDark);
        doc.fillColor(white).fontSize(9).font('Helvetica-Bold')
           .text('4. CROP ROTATION SCHEDULE & COVER CROPS', 50, currentY + 5);
        currentY += 24;

        const allRotation = options.plots.flatMap((p) =>
          p.cropRotationSequence.map((r) => ({ ...r, plotName: p.name })),
        );

        if (allRotation.length === 0) {
          doc.rect(40, currentY, 515, 24).fill(pageBg).stroke(greyBorder);
          doc.fillColor(greyText).fontSize(8).font('Helvetica-Oblique')
             .text('No active crop rotation entries configured.', 50, currentY + 7);
          currentY += 32;
        } else {
          doc.rect(40, currentY, 515, 18).fill('#E2E8F0');
          doc.fillColor(blackText).fontSize(7.5).font('Helvetica-Bold');
          doc.text('Seq #', 45, currentY + 5, { width: 35 });
          doc.text('Zone / Plot', 85, currentY + 5, { width: 85 });
          doc.text('Crop Variety / Plant', 175, currentY + 5, { width: 140 });
          doc.text('Planned Date', 320, currentY + 5, { width: 75 });
          doc.text('Rotation Status', 400, currentY + 5, { width: 100 });
          currentY += 18;

          allRotation.forEach((r, i) => {
            checkPageBreak(20);
            const rowBg = i % 2 === 0 ? white : pageBg;
            doc.rect(40, currentY, 515, 18).fill(rowBg).stroke(greyBorder);

            doc.fillColor(blackText).fontSize(7.5).font('Helvetica');
            doc.text(String(r.sequenceOrder), 45, currentY + 4, { width: 35 });
            doc.text(r.plotName, 85, currentY + 4, { width: 85 });
            doc.text(r.cropName, 175, currentY + 4, { width: 140 });
            doc.text(r.plannedDate || 'Upcoming', 320, currentY + 4, { width: 75 });
            doc.text(r.status, 400, currentY + 4, { width: 100 });

            currentY += 18;
          });
          currentY += 10;
        }

        // Cover crop windows if any
        const coverCropPlots = options.plots.filter((p) => p.coverCropWindow != null);
        if (coverCropPlots.length > 0) {
          checkPageBreak(40);
          coverCropPlots.forEach((p) => {
            if (p.coverCropWindow) {
              doc.rect(40, currentY, 515, 20).fill(alertBg).stroke(alertBorder);
              doc.fillColor(primaryDark).fontSize(8).font('Helvetica-Bold')
                 .text(`Cover Crop Window (${p.name}):`, 50, currentY + 5);
              doc.fillColor(blackText).fontSize(8).font('Helvetica')
                 .text(`${p.coverCropWindow.coverCropType}  |  ${p.coverCropWindow.windowStart} to ${p.coverCropWindow.windowEnd}`, 190, currentY + 5);
              currentY += 24;
            }
          });
        }
      }

      // ── 7. Declarations & Compliance Footer (on every page) ──
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        const footerY = 770;
        doc.rect(40, footerY, 515, 36).stroke(greyBorder);
        doc.fillColor(lightGreyText).fontSize(7).font('Helvetica')
           .text('TOHFA Platform • Certified Organic Agricultural Advisory Standards (NPOP / PGS-India)', 50, footerY + 6)
           .text('This is an authentic computer-generated soil diary report verified for organic farm compliance & record keeping.', 50, footerY + 16);

        doc.fillColor(greyText).fontSize(7.5).font('Helvetica')
           .text(`Page ${i + 1} of ${range.count}`, 450, footerY + 10, { width: 95, align: 'right' });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
