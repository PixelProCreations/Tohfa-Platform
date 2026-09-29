/**
 * soil.service — business logic for a farmer's soil diary (FR-F06): lab test
 * records, amendments, moisture/erosion observations and the crop rotation
 * plan, all scoped to a single plot.
 *
 * `farmer.soil.manage_own` is a single `own`-scoped permission covering all
 * six tables (five from db/migrations/0021_soil_management.sql plus
 * `cover_crop_windows` from 0022) — a soil record is only ever reached
 * through a plot on a farm the actor owns, exactly like `farmer.farm.manage_own`
 * covers both `farms` and `plots`. Ownership is enforced by joining
 * `plots -> farms -> farmer_id` (`requireOwnPlot` below, mirroring
 * farms.service.ts's `requireOwnPlot`/`requireOwnFarm` pair). A plot that
 * exists but belongs to another farmer's farm 404s, never 403 (root
 * CLAUDE.md §2.1, BR-36): a 403 would confirm the row's existence to an actor
 * not allowed to know about it.
 *
 * BR-40: every classification label (organicCarbonLabel, phLabel, ecLabel,
 * tdsLabel, nitrogenLabel, phosphorusLabel, potassiumLabel) is produced by
 * the ONE `classifySoilMetric` function below, fed by bands read from
 * `system_config` in a single batched query — never a per-route literal.
 *
 * BR-38 boundary: nothing in this service generates advisory/recommendation
 * text. `getSoilHealthSummary`'s `trendDirection` is pure arithmetic over the
 * plot's own numbers (does the raw reading rise, fall, or hold — never a
 * judgement about whether that change is agronomically good); `riskLevel` on
 * an erosion note and the whole crop rotation plan are 100% farmer-entered,
 * never system-suggested.
 */
import crypto from 'node:crypto';
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import { config } from '../../config.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { renderSoilReportPdf, type SoilReportPlotData } from './pdf/soil-report-pdf.js';
import {
  soilRepo,
  type ClassificationBands,
  type CoverCropWindow,
  type SoilAmendment,
  type SoilMetricKey,
  type SoilMoistureObservation,
  type SoilRepo,
  type SoilTestRecord,
  type ErosionNote,
} from './soil.repo.js';
import type {
  CreateCoverCropWindowBody,
  CreateErosionNoteBody,
  CreateSoilAmendmentBody,
  CreateSoilMoistureBody,
  CreateSoilTestBody,
  CropRotationGetResponse,
  ExportSoilReportQuery,
  ExportSoilReportResponse,
  HealthSummaryMetricResponse,
  PutCropRotationBody,
  SoilHealthSummaryResponse,
  SoilTestRecordResponse,
  UpdateSoilAmendmentBody,
} from './soil.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface SoilServiceDeps {
  repo: SoilRepo;
  runTx: TransactionRunner;
  db: Executor;
}

/**
 * Turns one metric's raw reading into its configured label. `metric` is not
 * used for arithmetic — it only makes a malformed-bands error legible — the
 * comparison itself is the same three-way band check for every metric,
 * which is exactly BR-40's point: one function, no per-metric copies.
 */
export function classifySoilMetric(
  metric: SoilMetricKey,
  value: number,
  bands: ClassificationBands,
): string {
  if (!Number.isFinite(bands.low) || !Number.isFinite(bands.high) || bands.low > bands.high) {
    throw new Error(
      `system_config bands for "${metric}" are malformed (low=${String(bands.low)}, high=${String(bands.high)}).`,
    );
  }
  if (value < bands.low) return bands.belowLabel;
  if (value > bands.high) return bands.aboveLabel;
  return bands.insideLabel;
}

function withClassificationLabels(
  record: SoilTestRecord,
  bands: Record<SoilMetricKey, ClassificationBands>,
): SoilTestRecordResponse {
  return {
    ...record,
    organicCarbonLabel: classifySoilMetric('organicCarbon', record.organicCarbonPct, bands.organicCarbon),
    phLabel: classifySoilMetric('ph', record.ph, bands.ph),
    ecLabel: classifySoilMetric('ec', record.ecDsPerM, bands.ec),
    tdsLabel: record.tdsPpm === null ? null : classifySoilMetric('tds', record.tdsPpm, bands.tds),
    nitrogenLabel:
      record.nitrogenKgPerHa === null
        ? null
        : classifySoilMetric('nitrogen', record.nitrogenKgPerHa, bands.nitrogen),
    phosphorusLabel:
      record.phosphorusKgPerHa === null
        ? null
        : classifySoilMetric('phosphorus', record.phosphorusKgPerHa, bands.phosphorus),
    potassiumLabel:
      record.potassiumKgPerHa === null
        ? null
        : classifySoilMetric('potassium', record.potassiumKgPerHa, bands.potassium),
  };
}

/** Avoids floating-point noise in deltaValue (e.g. 6.8 - 6.5 === 0.2999999999999998). */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Builds one metric's health-tracker summary from the plot's own soil test
 * records, oldest first. Pure arithmetic — see the BR-38 boundary note at the
 * top of this file.
 */
function buildMetricSummary(
  recordsAscending: SoilTestRecord[],
  pick: (record: SoilTestRecord) => number | null,
): HealthSummaryMetricResponse {
  const points = recordsAscending
    .map((record) => ({ month: record.testDate.slice(0, 7), value: pick(record) }))
    .filter((point): point is { month: string; value: number } => point.value !== null)
    .slice(-6);

  const current = points.at(-1) ?? null;
  const previous = points.length >= 2 ? (points[points.length - 2] ?? null) : null;

  const currentValue = current?.value ?? null;
  const previousValue = previous?.value ?? null;
  const deltaValue =
    currentValue !== null && previousValue !== null ? round2(currentValue - previousValue) : null;

  // Tracks the raw rise/fall of the number only — not a judgement about
  // whether that direction is agronomically good for this metric (that call
  // is exactly the advisory territory BR-38 blocks; see file header).
  const trendDirection: HealthSummaryMetricResponse['trendDirection'] =
    deltaValue === null ? null : deltaValue > 0 ? 'improving' : deltaValue < 0 ? 'declining' : 'flat';

  return {
    currentValue,
    previousValue,
    deltaValue,
    trendDirection,
    chartPoints: points.map((point) => ({ month: point.month, value: point.value })),
  };
}

/**
 * Dependencies are injected with defaults. Production code calls
 * `soilService`; tests call `createSoilService({ repo: fake })`.
 */
export function createSoilService(deps: Partial<SoilServiceDeps> = {}): SoilService {
  const repo = deps.repo ?? soilRepo;
  const runTx = deps.runTx ?? withTransaction;
  const db = deps.db ?? pool;

  /**
   * A `FARMER` role always carries `scope.farmerId` once `own` scope resolves
   * (see requirePermission.ts#resolveScope) — this only trips if a token was
   * minted before farmer approval finished, which is a provisioning bug, not
   * a normal 403/404 case. Mirrors farms.service.ts#requireFarmerId.
   */
  function requireFarmerId(scope: ResolvedScope): string {
    if (scope.farmerId === undefined) {
      throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found for actor.' });
    }
    return scope.farmerId;
  }

  /**
   * Cross-scope reads return an empty result set / 404, never 403 — root
   * CLAUDE.md §2.1, BR-36. Mirrors farms.service.ts's
   * requireOwnFarm/requireOwnPlot pair, collapsed into one join.
   */
  async function requireOwnPlot(
    tx: Executor,
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
  ): Promise<string> {
    const farmerId = requireFarmerId(scope);
    const ownedPlotId = await repo.findOwnedPlotId(tx, { farmerId, farmId, plotId });
    if (ownedPlotId === null) {
      throw new AppError('NOT_FOUND', { detail: 'Plot not found.' });
    }
    return ownedPlotId;
  }

  /** A `labReportUploadId` must reference an upload the caller themself created. */
  async function requireOwnUpload(tx: Executor, scope: ResolvedScope, uploadId: string): Promise<void> {
    const ownerId = await repo.findUploadOwner(tx, uploadId);
    if (ownerId === undefined) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: 'labReportUploadId does not reference an existing upload.',
      });
    }
    if (ownerId !== scope.userId) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: 'labReportUploadId does not reference an upload you own.',
      });
    }
  }

  return {
    // -----------------------------------------------------------------------
    // soil_test_records
    // -----------------------------------------------------------------------

    async listSoilTests(scope, farmId, plotId) {
      await requireOwnPlot(db, scope, farmId, plotId);
      const records = await repo.listSoilTests(db, plotId);
      if (records.length === 0) return [];
      const bands = await repo.getClassificationBands(db);
      return records.map((record) => withClassificationLabels(record, bands));
    },

    async getSoilTest(scope, farmId, plotId, testId) {
      await requireOwnPlot(db, scope, farmId, plotId);
      const record = await repo.findSoilTestById(db, plotId, testId);
      if (record === null) {
        throw new AppError('NOT_FOUND', { detail: 'Soil test record not found.' });
      }
      const bands = await repo.getClassificationBands(db);
      return withClassificationLabels(record, bands);
    },

    async createSoilTest(scope, farmId, plotId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        if (body.labReportUploadId !== undefined) {
          await requireOwnUpload(tx, scope, body.labReportUploadId);
        }

        const record = await repo.insertSoilTest(tx, {
          plotId,
          testDate: body.testDate,
          nextDueDate: body.nextDueDate,
          organicCarbonPct: body.organicCarbonPct,
          ph: body.ph,
          ecDsPerM: body.ecDsPerM,
          tdsPpm: body.tdsPpm ?? null,
          nitrogenKgPerHa: body.nitrogenKgPerHa ?? null,
          phosphorusKgPerHa: body.phosphorusKgPerHa ?? null,
          potassiumKgPerHa: body.potassiumKgPerHa ?? null,
          limeStatus: body.limeStatus ?? null,
          labReportUploadId: body.labReportUploadId ?? null,
        });

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.soil.test.create',
          entityType: 'soil_test_record',
          entityId: record.id,
          after: { plotId, testDate: record.testDate },
        });

        const bands = await repo.getClassificationBands(tx);
        return withClassificationLabels(record, bands);
      });
    },

    async getSoilHealthSummary(scope, farmId, plotId) {
      await requireOwnPlot(db, scope, farmId, plotId);
      const recordsNewestFirst = await repo.listSoilTests(db, plotId);
      const recordsAscending = [...recordsNewestFirst].reverse();

      return {
        ph: buildMetricSummary(recordsAscending, (record) => record.ph),
        organicCarbon: buildMetricSummary(recordsAscending, (record) => record.organicCarbonPct),
        tds: buildMetricSummary(recordsAscending, (record) => record.tdsPpm),
      };
    },

    // -----------------------------------------------------------------------
    // soil_amendments
    // -----------------------------------------------------------------------

    async listSoilAmendments(scope, farmId, plotId) {
      await requireOwnPlot(db, scope, farmId, plotId);
      return repo.listSoilAmendments(db, plotId);
    },

    async createSoilAmendment(scope, farmId, plotId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        const amendment = await repo.insertSoilAmendment(tx, {
          plotId,
          amendmentType: body.amendmentType,
          quantityKg: body.quantityKg,
          appliedDate: body.appliedDate,
          notes: body.notes ?? null,
        });
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.soil.amendment.create',
          entityType: 'soil_amendment',
          entityId: amendment.id,
          after: { plotId, amendmentType: amendment.amendmentType },
        });
        return amendment;
      });
    },

    async updateSoilAmendment(scope, farmId, plotId, amendmentId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        const existing = await repo.findSoilAmendmentById(tx, plotId, amendmentId);
        if (existing === null) {
          throw new AppError('NOT_FOUND', { detail: 'Soil amendment not found.' });
        }

        const hasNotesKey = Object.prototype.hasOwnProperty.call(body, 'notes');
        const updated = await repo.updateSoilAmendment(tx, plotId, amendmentId, {
          ...(body.amendmentType !== undefined ? { amendmentType: body.amendmentType } : {}),
          ...(body.quantityKg !== undefined ? { quantityKg: body.quantityKg } : {}),
          ...(body.appliedDate !== undefined ? { appliedDate: body.appliedDate } : {}),
          ...(hasNotesKey ? { notes: body.notes ?? null } : {}),
        });
        if (updated === null) {
          throw new AppError('NOT_FOUND', { detail: 'Soil amendment not found.' });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.soil.amendment.update',
          entityType: 'soil_amendment',
          entityId: amendmentId,
          before: { amendmentType: existing.amendmentType, quantityKg: existing.quantityKg },
          after: { amendmentType: updated.amendmentType, quantityKg: updated.quantityKg },
        });
        return updated;
      });
    },

    async removeSoilAmendment(scope, farmId, plotId, amendmentId) {
      await runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        const existing = await repo.findSoilAmendmentById(tx, plotId, amendmentId);
        if (existing === null) {
          throw new AppError('NOT_FOUND', { detail: 'Soil amendment not found.' });
        }
        const deleted = await repo.deleteSoilAmendment(tx, plotId, amendmentId);
        if (!deleted) {
          throw new AppError('NOT_FOUND', { detail: 'Soil amendment not found.' });
        }
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.soil.amendment.delete',
          entityType: 'soil_amendment',
          entityId: amendmentId,
          before: { amendmentType: existing.amendmentType },
        });
      });
    },

    // -----------------------------------------------------------------------
    // soil_moisture_observations
    // -----------------------------------------------------------------------

    async listSoilMoisture(scope, farmId, plotId) {
      await requireOwnPlot(db, scope, farmId, plotId);
      return repo.listSoilMoisture(db, plotId);
    },

    async createSoilMoisture(scope, farmId, plotId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        const observation = await repo.insertSoilMoisture(tx, {
          plotId,
          level: body.level,
          observedAt: body.observedAt ?? null,
          // Never client-supplied — the authenticated actor logged this observation.
          observedBy: scope.userId,
        });
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.soil.moisture.create',
          entityType: 'soil_moisture_observation',
          entityId: observation.id,
          after: { plotId, level: observation.level },
        });
        return observation;
      });
    },

    // -----------------------------------------------------------------------
    // erosion_conservation_notes
    // -----------------------------------------------------------------------

    async listErosionNotes(scope, farmId, plotId) {
      await requireOwnPlot(db, scope, farmId, plotId);
      return repo.listErosionNotes(db, plotId);
    },

    async createErosionNote(scope, farmId, plotId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        const note = await repo.insertErosionNote(tx, {
          plotId,
          riskLevel: body.riskLevel,
          practiceNotes: body.practiceNotes ?? null,
          loggedAt: body.loggedAt ?? null,
        });
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.soil.erosion_note.create',
          entityType: 'erosion_conservation_note',
          entityId: note.id,
          after: { plotId, riskLevel: note.riskLevel },
        });
        return note;
      });
    },

    // -----------------------------------------------------------------------
    // crop_rotation_entries + cover_crop_windows
    // -----------------------------------------------------------------------

    async getCropRotation(scope, farmId, plotId) {
      await requireOwnPlot(db, scope, farmId, plotId);
      const [sequence, coverCropWindow] = await Promise.all([
        repo.listCropRotation(db, plotId),
        repo.findCurrentCoverCropWindow(db, plotId),
      ]);
      return { sequence, coverCropWindow };
    },

    async putCropRotation(scope, farmId, plotId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        const sequence = await repo.replaceCropRotationSequence(
          tx,
          plotId,
          body.sequence.map((entry) => ({
            sequenceOrder: entry.sequenceOrder,
            cropName: entry.cropName,
            plannedDate: entry.plannedDate ?? null,
            status: entry.status,
          })),
        );
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.soil.crop_rotation.replace',
          entityType: 'crop_rotation_plan',
          entityId: plotId,
          after: { plotId, entryCount: sequence.length },
        });
        const coverCropWindow = await repo.findCurrentCoverCropWindow(tx, plotId);
        return { sequence, coverCropWindow };
      });
    },

    async createCoverCropWindow(scope, farmId, plotId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        const window = await repo.insertCoverCropWindow(tx, {
          plotId,
          coverCropType: body.coverCropType,
          windowStart: body.windowStart,
          windowEnd: body.windowEnd,
        });
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.soil.cover_crop_window.create',
          entityType: 'cover_crop_window',
          entityId: window.id,
          after: { plotId, coverCropType: window.coverCropType },
        });
        return window;
      });
    },

    // -----------------------------------------------------------------------
    // PDF Report Export (FR-F06)
    // -----------------------------------------------------------------------

    generateSignedDownloadUrl(farmId: string, query: ExportSoilReportQuery): ExportSoilReportResponse {
      const expiresAt = Date.now() + 15 * 60 * 1000;
      const payload = `${farmId}:${expiresAt}:${query.period}:${query.include ?? ''}:${query.plotId ?? ''}`;
      const token = crypto
        .createHmac('sha256', config.JWT_SECRET)
        .update(payload)
        .digest('hex');

      const searchParams = new URLSearchParams();
      searchParams.set('token', token);
      searchParams.set('expires', String(expiresAt));
      searchParams.set('period', query.period);
      if (query.include) searchParams.set('include', query.include);
      if (query.plotId) searchParams.set('plotId', query.plotId);

      const periodSlug = query.period.replace(/\s+/g, '_');
      const fileName = `Soil_Health_Report_${periodSlug}.pdf`;

      return {
        downloadUrl: `/v1/farms/${farmId}/soil-reports/export?${searchParams.toString()}`,
        fileName,
        expiresAt,
      };
    },

    verifyDownloadSignature(farmId: string, query: ExportSoilReportQuery, token: string, expires: number): boolean {
      if (Date.now() > expires) {
        return false;
      }
      const payload = `${farmId}:${expires}:${query.period}:${query.include ?? ''}:${query.plotId ?? ''}`;
      const expectedToken = crypto
        .createHmac('sha256', config.JWT_SECRET)
        .update(payload)
        .digest('hex');

      if (typeof token !== 'string' || token.length !== expectedToken.length) {
        return false;
      }
      try {
        const bufA = Buffer.from(token, 'utf8');
        const bufB = Buffer.from(expectedToken, 'utf8');
        if (bufA.length !== bufB.length) return false;
        return crypto.timingSafeEqual(bufA, bufB);
      } catch {
        return false;
      }
    },

    async getSoilReportDownloadLink(
      scope: ResolvedScope,
      farmId: string,
      query: ExportSoilReportQuery,
    ): Promise<ExportSoilReportResponse> {
      const farmerId = requireFarmerId(scope);
      const farm = await repo.findOwnedFarmSummary(db, farmId, farmerId);
      if (!farm) {
        throw new AppError('NOT_FOUND', { detail: 'Farm not found.' });
      }
      return this.generateSignedDownloadUrl(farmId, query);
    },

    async exportSoilReportPdf(
      scope: ResolvedScope | undefined,
      farmId: string,
      query: ExportSoilReportQuery,
    ): Promise<Buffer> {
      let isVerified = false;
      if (query.token && query.expires) {
        isVerified = this.verifyDownloadSignature(farmId, query, query.token, query.expires);
        if (!isVerified) {
          throw new AppError('FORBIDDEN', { detail: 'Download signature is invalid or expired.' });
        }
      } else if (scope) {
        isVerified = true;
      } else {
        throw new AppError('UNAUTHENTICATED', { detail: 'Authentication or valid signed download link required.' });
      }

      // Fetch farm details
      let farmSummary = null;
      if (scope?.farmerId) {
        farmSummary = await repo.findOwnedFarmSummary(db, farmId, scope.farmerId);
      } else {
        const farmRes = await db.query<{
          farm_id: string;
          farm_name: string;
          district: string;
          taluk: string | null;
          village: string | null;
          area_acres: string | null;
          farmer_id: string;
          farmer_name: string;
          farmer_mobile: string;
          tohfa_farmer_id: string;
        }>(
          `SELECT f.id AS farm_id, f.name AS farm_name, f.district, f.taluk, f.village, f.area_acres,
                  fm.id AS farmer_id, u.full_name AS farmer_name, u.mobile AS farmer_mobile, fm.tohfa_farmer_id
             FROM farms f
             JOIN farmers fm ON fm.id = f.farmer_id
             JOIN users u ON u.id = fm.user_id
            WHERE f.id = $1 AND f.deleted_at IS NULL
            LIMIT 1`,
          [farmId],
        );
        const row = farmRes.rows[0];
        if (row) {
          farmSummary = {
            farmId: row.farm_id,
            farmName: row.farm_name,
            district: row.district,
            taluk: row.taluk,
            village: row.village,
            totalAcres: row.area_acres == null ? null : Number(row.area_acres),
            farmerId: row.farmer_id,
            farmerName: row.farmer_name,
            farmerMobile: row.farmer_mobile,
            tohfaFarmerId: row.tohfa_farmer_id,
          };
        }
      }

      if (!farmSummary) {
        throw new AppError('NOT_FOUND', { detail: 'Farm not found.' });
      }

      // Fetch plots
      let plots = await repo.listPlotsForFarm(db, farmId);
      if (query.plotId) {
        plots = plots.filter((p) => p.id === query.plotId);
      }

      // Compute date cutoff
      const now = Date.now();
      let cutoffIso: string | null = null;
      if (query.period === '3 months') {
        cutoffIso = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      } else if (query.period === '6 months') {
        cutoffIso = new Date(now - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      }

      const includeList = query.include ? query.include.split(',').map((s) => s.trim()) : ['tests', 'amendments', 'moisture_erosion'];
      const includes = {
        tests: includeList.includes('tests'),
        amendments: includeList.includes('amendments'),
        moistureErosion: includeList.includes('moisture_erosion') || includeList.includes('moisture') || includeList.includes('erosion'),
        rotation: includeList.includes('rotation') || includeList.includes('crop_rotation'),
      };

      const bands = await repo.getClassificationBands(db);
      const plotData: SoilReportPlotData[] = [];

      for (const plot of plots) {
        let soilTests: SoilReportPlotData['soilTests'] = [];
        if (includes.tests) {
          const rawTests = await repo.listSoilTests(db, plot.id);
          const classified = rawTests.map((t) => withClassificationLabels(t, bands));
          soilTests = (cutoffIso ? classified.filter((t) => t.testDate >= cutoffIso!) : classified).map((t) => ({
            testDate: t.testDate,
            nextDueDate: t.nextDueDate,
            organicCarbonPct: t.organicCarbonPct,
            ph: t.ph,
            ecDsPerM: t.ecDsPerM,
            tdsPpm: t.tdsPpm,
            nitrogenKgPerHa: t.nitrogenKgPerHa,
            phosphorusKgPerHa: t.phosphorusKgPerHa,
            potassiumKgPerHa: t.potassiumKgPerHa,
            limeStatus: t.limeStatus,
            organicCarbonLabel: t.organicCarbonLabel,
            phLabel: t.phLabel,
            ecLabel: t.ecLabel,
            tdsLabel: t.tdsLabel,
          }));
        }

        let amendments: SoilReportPlotData['amendments'] = [];
        if (includes.amendments) {
          const rawAmendments = await repo.listSoilAmendments(db, plot.id);
          amendments = (cutoffIso ? rawAmendments.filter((a) => a.appliedDate >= cutoffIso!) : rawAmendments).map((a) => ({
            amendmentType: a.amendmentType,
            quantityKg: a.quantityKg,
            appliedDate: a.appliedDate,
            notes: a.notes,
          }));
        }

        let moistureObservations: SoilReportPlotData['moistureObservations'] = [];
        let erosionNotes: SoilReportPlotData['erosionNotes'] = [];
        if (includes.moistureErosion) {
          const rawMoisture = await repo.listSoilMoisture(db, plot.id);
          moistureObservations = (cutoffIso ? rawMoisture.filter((m) => m.observedAt.slice(0, 10) >= cutoffIso!) : rawMoisture).map((m) => ({
            level: m.level,
            observedAt: m.observedAt,
          }));

          const rawErosion = await repo.listErosionNotes(db, plot.id);
          erosionNotes = (cutoffIso ? rawErosion.filter((e) => e.loggedAt.slice(0, 10) >= cutoffIso!) : rawErosion).map((e) => ({
            riskLevel: e.riskLevel,
            practiceNotes: e.practiceNotes,
            loggedAt: e.loggedAt,
          }));
        }

        let cropRotationSequence: SoilReportPlotData['cropRotationSequence'] = [];
        let coverCropWindow: SoilReportPlotData['coverCropWindow'] = null;
        if (includes.rotation) {
          const rawRotation = await repo.listCropRotation(db, plot.id);
          cropRotationSequence = rawRotation.map((r) => ({
            sequenceOrder: r.sequenceOrder,
            cropName: r.cropName,
            plannedDate: r.plannedDate,
            status: r.status,
          }));

          const rawWindow = await repo.findCurrentCoverCropWindow(db, plot.id);
          if (rawWindow) {
            coverCropWindow = {
              coverCropType: rawWindow.coverCropType,
              windowStart: rawWindow.windowStart,
              windowEnd: rawWindow.windowEnd,
            };
          }
        }

        plotData.push({
          id: plot.id,
          name: plot.name,
          areaAcres: plot.areaAcres,
          soilType: plot.soilType,
          sunExposure: plot.sunExposure,
          irrigationType: plot.irrigationType,
          soilTests,
          amendments,
          moistureObservations,
          erosionNotes,
          cropRotationSequence,
          coverCropWindow,
        });
      }

      const locationParts = [farmSummary.village, farmSummary.taluk, farmSummary.district].filter(Boolean);
      const location = locationParts.join(', ') || 'The Nilgiris, Tamil Nadu';

      return renderSoilReportPdf({
        farmName: farmSummary.farmName,
        farmerName: farmSummary.farmerName,
        farmerId: farmSummary.tohfaFarmerId,
        location,
        totalAcres: farmSummary.totalAcres,
        period: query.period,
        generatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        includes,
        plots: plotData,
      });
    },
  };
}

export interface SoilService {
  listSoilTests(scope: ResolvedScope, farmId: string, plotId: string): Promise<SoilTestRecordResponse[]>;
  getSoilTest(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    testId: string,
  ): Promise<SoilTestRecordResponse>;
  createSoilTest(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    body: CreateSoilTestBody,
  ): Promise<SoilTestRecordResponse>;
  getSoilHealthSummary(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
  ): Promise<SoilHealthSummaryResponse>;

  listSoilAmendments(scope: ResolvedScope, farmId: string, plotId: string): Promise<SoilAmendment[]>;
  createSoilAmendment(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    body: CreateSoilAmendmentBody,
  ): Promise<SoilAmendment>;
  updateSoilAmendment(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    amendmentId: string,
    body: UpdateSoilAmendmentBody,
  ): Promise<SoilAmendment>;
  removeSoilAmendment(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    amendmentId: string,
  ): Promise<void>;

  listSoilMoisture(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
  ): Promise<SoilMoistureObservation[]>;
  createSoilMoisture(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    body: CreateSoilMoistureBody,
  ): Promise<SoilMoistureObservation>;

  listErosionNotes(scope: ResolvedScope, farmId: string, plotId: string): Promise<ErosionNote[]>;
  createErosionNote(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    body: CreateErosionNoteBody,
  ): Promise<ErosionNote>;

  getCropRotation(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
  ): Promise<CropRotationGetResponse>;
  putCropRotation(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    body: PutCropRotationBody,
  ): Promise<CropRotationGetResponse>;
  createCoverCropWindow(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    body: CreateCoverCropWindowBody,
  ): Promise<CoverCropWindow>;

  generateSignedDownloadUrl(farmId: string, query: ExportSoilReportQuery): ExportSoilReportResponse;
  verifyDownloadSignature(farmId: string, query: ExportSoilReportQuery, token: string, expires: number): boolean;
  getSoilReportDownloadLink(
    scope: ResolvedScope,
    farmId: string,
    query: ExportSoilReportQuery,
  ): Promise<ExportSoilReportResponse>;
  exportSoilReportPdf(
    scope: ResolvedScope | undefined,
    farmId: string,
    query: ExportSoilReportQuery,
  ): Promise<Buffer>;
}

/** The production instance. */
export const soilService: SoilService = createSoilService();
