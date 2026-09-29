/**
 * pest.service — business logic for Pest Management (FR-F07).
 *
 * Two kinds of data, two authorization shapes:
 *
 *  - `pest_library` and `weather_risk_notes` are global, admin-curated
 *    reference content (`pest_library.view`, a `view`-scoped permission).
 *    They are not farmer-owned, so there is no ownership check — the
 *    middleware's `view` scope already guarantees read-only access.
 *
 *  - `pest_detections`, `pest_treatment_logs` and `pest_treatment_reminders`
 *    are plot-scoped, farmer-owned rows under ONE `own`-scoped permission,
 *    `farmer.pest.manage_own` — the same one-permission-covers-several-tables
 *    pattern `farmer.soil.manage_own` uses (soil.service.ts). A pest record
 *    is only ever reached through a plot on a farm the actor owns
 *    (`requireOwnPlot`, soil's exact join). A plot/farm that exists but
 *    belongs to another farmer 404s, never 403 (root CLAUDE.md §2.1, BR-36):
 *    a 403 would confirm the row's existence to an actor not allowed to know
 *    about it.
 *
 * BR-38 boundary (docs/rules.md, "Open contradictions" row 19; header of
 * db/migrations/0023_pest_management.sql): nothing in this service generates
 * advisory content, schedules anything, or writes a row the farmer did not
 * explicitly ask for in the same request. The only values computed server-side
 * are:
 *   - `resolved_at` / `completed_at` — the database clock at the moment the
 *     farmer's own PATCH changes the status (never a client timestamp);
 *   - `next_application_date` — plain calendar arithmetic
 *     (appliedOn + intervalDays) over two numbers the farmer supplied in the
 *     same body, only when they did not supply the date themself;
 *   - the analytics summary — on-demand counting over the farmer's own rows.
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  pestRepo,
  type MonthCount,
  type PestDetection,
  type PestDetectionPatch,
  type PestLibraryEntry,
  type PestRepo,
  type PestTreatmentLog,
  type PestTreatmentReminder,
  type PestTreatmentReminderPatch,
  type WeatherRiskNote,
} from './pest.repo.js';
import type {
  CreatePestDetectionBody,
  CreatePestTreatmentLogBody,
  CreatePestTreatmentReminderBody,
  ListPestLibraryQuery,
  PestAnalyticsSummaryResponse,
  UpdatePestDetectionBody,
  UpdatePestTreatmentReminderBody,
} from './pest.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface PestServiceDeps {
  repo: PestRepo;
  runTx: TransactionRunner;
  db: Executor;
}

// ---------------------------------------------------------------------------
// pure helpers (exported for tests)
// ---------------------------------------------------------------------------

/**
 * appliedOn + intervalDays as a calendar date. UTC arithmetic on a
 * YYYY-MM-DD string, so no local-timezone/DST shift can move the result by a
 * day. Arithmetic, not advice: both inputs are the farmer's own values.
 */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Season buckets for `detectionsBySeason`, keyed by calendar month of
 * `detected_on`.
 *
 * JUDGMENT CALL, not a documented rule: no season definition exists anywhere
 * in docs/rules.md, the migrations or the seeds (pest_library.season is free
 * text such as "Monsoon"/"Year-round", and crop_master.season_months is a
 * per-crop list, not a calendar). This split — Jun-Sep Monsoon (south-west
 * monsoon), Oct-Jan Winter, Feb-May Summer — is a reasonable Nilgiris default
 * chosen for this endpoint. If the client supplies a definition it belongs in
 * system_config (CLAUDE.md §2.7) and this table should be fed from there.
 */
export const PEST_SEASONS: ReadonlyArray<{ season: string; months: readonly number[] }> = [
  { season: 'Summer', months: [2, 3, 4, 5] },
  { season: 'Monsoon', months: [6, 7, 8, 9] },
  { season: 'Winter', months: [10, 11, 12, 1] },
];

/** Every season is always present (zero-filled), in the fixed order above. */
export function bucketBySeason(monthCounts: MonthCount[]): Array<{ season: string; count: number }> {
  return PEST_SEASONS.map(({ season, months }) => ({
    season,
    count: monthCounts
      .filter((row) => months.includes(row.month))
      .reduce((sum, row) => sum + row.count, 0),
  }));
}

/**
 * Dependencies are injected with defaults. Production code calls
 * `pestService`; tests call `createPestService({ repo: fake })`.
 */
export function createPestService(deps: Partial<PestServiceDeps> = {}): PestService {
  const repo = deps.repo ?? pestRepo;
  const runTx = deps.runTx ?? withTransaction;
  const db = deps.db ?? pool;

  /**
   * A `FARMER` role always carries `scope.farmerId` once `own` scope resolves
   * (see requirePermission.ts#resolveScope) — this only trips if a token was
   * minted before farmer approval finished, which is a provisioning bug, not
   * a normal 403/404 case. Mirrors soil.service.ts#requireFarmerId.
   */
  function requireFarmerId(scope: ResolvedScope): string {
    if (scope.farmerId === undefined) {
      throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found for actor.' });
    }
    return scope.farmerId;
  }

  /** Cross-scope reads return 404, never 403 — root CLAUDE.md §2.1, BR-36. Soil's exact join. */
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

  /**
   * Farm-only ownership for the farm-wide analytics endpoint. farms.service.ts
   * has a `requireOwnFarm`, but it is a closure over FarmsRepo and not
   * exported; soil only has the heavier `findOwnedFarmSummary` (joins users
   * for the PDF). So this is a local one-query check with the same
   * 404-not-403 behaviour.
   */
  async function requireOwnFarm(tx: Executor, scope: ResolvedScope, farmId: string): Promise<string> {
    const farmerId = requireFarmerId(scope);
    const ownedFarmId = await repo.findOwnedFarmId(tx, { farmerId, farmId });
    if (ownedFarmId === null) {
      throw new AppError('NOT_FOUND', { detail: 'Farm not found.' });
    }
    return ownedFarmId;
  }

  /** A `photoUploadId` must reference an upload the caller themself created (mirrors soil). */
  async function requireOwnUpload(tx: Executor, scope: ResolvedScope, uploadId: string): Promise<void> {
    const ownerId = await repo.findUploadOwner(tx, uploadId);
    if (ownerId === undefined) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: 'photoUploadId does not reference an existing upload.',
      });
    }
    if (ownerId !== scope.userId) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: 'photoUploadId does not reference an upload you own.',
      });
    }
  }

  /**
   * A body-supplied `pestLibraryId` must reference a real catalog entry. 422
   * VALIDATION_FAILED (the same class as the upload check), not 404: the path
   * resource exists — it is a field in the body that is invalid. Soil has no
   * shared-reference-data FK precedent that says otherwise.
   */
  async function requirePestLibraryEntry(tx: Executor, pestLibraryId: string): Promise<PestLibraryEntry> {
    const entry = await repo.findPestLibraryEntryById(tx, pestLibraryId);
    if (entry === null) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: 'pestLibraryId does not reference an existing pest library entry.',
      });
    }
    return entry;
  }

  /** A body-supplied `farmCropId` must be a planting on this same plot. */
  async function requireFarmCropOnPlot(tx: Executor, plotId: string, farmCropId: string): Promise<void> {
    if (!(await repo.farmCropExistsOnPlot(tx, plotId, farmCropId))) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: 'farmCropId does not reference a crop on this plot.',
      });
    }
  }

  /**
   * A body-supplied `detectionId` must be a detection on this same plot. One
   * message for "missing" and "on someone else's plot" so the check cannot be
   * used to probe for another farmer's detection ids (BR-36 spirit).
   */
  async function requireDetectionOnPlot(tx: Executor, plotId: string, detectionId: string): Promise<void> {
    if ((await repo.findDetectionById(tx, plotId, detectionId)) === null) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: 'detectionId does not reference a detection on this plot.',
      });
    }
  }

  return {
    // -----------------------------------------------------------------------
    // pest_library + weather_risk_notes (global reference content)
    // -----------------------------------------------------------------------

    async listPestLibrary(query) {
      return repo.listPestLibrary(db, {
        ...(query.q !== undefined ? { q: query.q } : {}),
        ...(query.crop !== undefined ? { crop: query.crop } : {}),
      });
    },

    async getPestLibraryEntry(pestLibraryId) {
      const entry = await repo.findPestLibraryEntryById(db, pestLibraryId);
      if (entry === null) {
        throw new AppError('NOT_FOUND', { detail: 'Pest library entry not found.' });
      }
      return entry;
    },

    /**
     * Currently-valid notes only (a null bound is open-ended). Not farmer-
     * scoped: weather_risk_notes is admin-authored regional content every
     * farmer reads; the route still requires auth + `pest_library.view`.
     */
    async listWeatherRiskNotes() {
      return repo.listCurrentWeatherRiskNotes(db);
    },

    // -----------------------------------------------------------------------
    // pest_detections
    // -----------------------------------------------------------------------

    async listDetections(scope, farmId, plotId) {
      await requireOwnPlot(db, scope, farmId, plotId);
      return repo.listDetections(db, plotId);
    },

    async getDetection(scope, farmId, plotId, detectionId) {
      await requireOwnPlot(db, scope, farmId, plotId);
      const detection = await repo.findDetectionById(db, plotId, detectionId);
      if (detection === null) {
        throw new AppError('NOT_FOUND', { detail: 'Pest detection not found.' });
      }
      return detection;
    },

    async createDetection(scope, farmId, plotId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);

        // Decision: when the farmer picked a catalog entry but left
        // scientificName blank, snapshot the catalog's scientificName onto the
        // row. This is the same copy-at-log-time pattern 0023 documents for
        // treatment logs' interval/phi days — it records the entry the farmer
        // explicitly selected, it is not an inferred diagnosis. An explicit
        // client value always wins, and pestName is never overwritten.
        let scientificName = body.scientificName ?? null;
        if (body.pestLibraryId !== undefined) {
          const entry = await requirePestLibraryEntry(tx, body.pestLibraryId);
          if (body.scientificName === undefined) scientificName = entry.scientificName;
        }
        if (body.farmCropId !== undefined) await requireFarmCropOnPlot(tx, plotId, body.farmCropId);
        if (body.photoUploadId !== undefined) await requireOwnUpload(tx, scope, body.photoUploadId);

        const detection = await repo.insertDetection(tx, {
          plotId,
          farmCropId: body.farmCropId ?? null,
          pestLibraryId: body.pestLibraryId ?? null,
          pestName: body.pestName,
          scientificName,
          cropLabel: body.cropLabel ?? null,
          severity: body.severity,
          detectedOn: body.detectedOn,
          notes: body.notes ?? null,
          photoUploadId: body.photoUploadId ?? null,
        });

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.pest.detection.create',
          entityType: 'pest_detection',
          entityId: detection.id,
          after: { plotId, pestName: detection.pestName, severity: detection.severity },
        });
        return detection;
      });
    },

    /**
     * PATCH semantics — only what the body explicitly says changes; the only
     * server-derived values are the `resolved_at` timestamp and the clearing
     * that a reopen implies:
     *
     *  - `status` absent: status and resolved_at are untouched.
     *  - `status: Resolved` and the row was NOT already Resolved: resolved_at
     *    is stamped with the DB clock (`now()`), never a client value.
     *  - `status: Resolved` and the row was already Resolved: resolved_at is
     *    kept (re-sending the same status does not move the timestamp).
     *  - `status: Ongoing | Recurring` (a reopen, or a non-resolved status
     *    change): resolved_at AND resolution_effective are cleared — the
     *    farmer's earlier "did it work?" assessment belonged to a resolution
     *    that no longer stands.
     *  - `resolutionEffective` is the farmer's own assessment and is written
     *    only when present in the body. It may be non-null only if the row
     *    ends up Resolved; sending `resolutionEffective: true|false` for a row
     *    that is (or is being moved to) Ongoing/Recurring is contradictory and
     *    rejected as 422 rather than silently dropped or silently resolving
     *    the detection. Nothing is inferred from it: `resolutionEffective`
     *    alone never changes `status`.
     */
    async updateDetection(scope, farmId, plotId, detectionId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        const existing = await repo.findDetectionById(tx, plotId, detectionId);
        if (existing === null) {
          throw new AppError('NOT_FOUND', { detail: 'Pest detection not found.' });
        }

        const resultingStatus = body.status ?? existing.status;
        const hasEffectiveKey = Object.prototype.hasOwnProperty.call(body, 'resolutionEffective');
        const hasNotesKey = Object.prototype.hasOwnProperty.call(body, 'notes');

        if (
          hasEffectiveKey &&
          body.resolutionEffective !== null &&
          body.resolutionEffective !== undefined &&
          resultingStatus !== 'Resolved'
        ) {
          throw new AppError('VALIDATION_FAILED', {
            status: 422,
            detail: 'resolutionEffective can only be set on a detection whose status is Resolved.',
          });
        }

        const patch: PestDetectionPatch = {};
        if (body.status !== undefined) {
          patch.status = body.status;
          if (body.status === 'Resolved') {
            if (existing.status !== 'Resolved') patch.resolvedAt = 'NOW';
          } else {
            patch.resolvedAt = null;
            patch.resolutionEffective = null;
          }
        }
        if (hasEffectiveKey) patch.resolutionEffective = body.resolutionEffective ?? null;
        if (hasNotesKey) patch.notes = body.notes ?? null;

        const updated = await repo.updateDetection(tx, plotId, detectionId, patch);
        if (updated === null) {
          throw new AppError('NOT_FOUND', { detail: 'Pest detection not found.' });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.pest.detection.update',
          entityType: 'pest_detection',
          entityId: detectionId,
          before: {
            status: existing.status,
            resolvedAt: existing.resolvedAt,
            resolutionEffective: existing.resolutionEffective,
          },
          after: {
            status: updated.status,
            resolvedAt: updated.resolvedAt,
            resolutionEffective: updated.resolutionEffective,
          },
        });
        return updated;
      });
    },

    // -----------------------------------------------------------------------
    // pest_treatment_logs
    // -----------------------------------------------------------------------

    async listTreatmentLogs(scope, farmId, plotId) {
      await requireOwnPlot(db, scope, farmId, plotId);
      return repo.listTreatmentLogs(db, plotId);
    },

    async createTreatmentLog(scope, farmId, plotId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        if (body.pestLibraryId !== undefined) await requirePestLibraryEntry(tx, body.pestLibraryId);
        if (body.farmCropId !== undefined) await requireFarmCropOnPlot(tx, plotId, body.farmCropId);
        if (body.detectionId !== undefined) await requireDetectionOnPlot(tx, plotId, body.detectionId);
        if (body.photoUploadId !== undefined) await requireOwnUpload(tx, scope, body.photoUploadId);

        // An explicit client nextApplicationDate always wins. Otherwise, when
        // the farmer gave both appliedOn and intervalDays, the next date is
        // their sum — arithmetic over the farmer's own inputs, not a
        // system-suggested schedule (BR-38). With no intervalDays it stays null.
        const nextApplicationDate =
          body.nextApplicationDate ??
          (body.intervalDays !== undefined ? addDays(body.appliedOn, body.intervalDays) : null);

        const log = await repo.insertTreatmentLog(tx, {
          plotId,
          farmCropId: body.farmCropId ?? null,
          detectionId: body.detectionId ?? null,
          pestLibraryId: body.pestLibraryId ?? null,
          pestName: body.pestName,
          category: body.category,
          severity: body.severity,
          treatment: body.treatment,
          intervalDays: body.intervalDays ?? null,
          phiDays: body.phiDays ?? null,
          appliedOn: body.appliedOn,
          nextApplicationDate,
          photoUploadId: body.photoUploadId ?? null,
        });

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.pest.treatment_log.create',
          entityType: 'pest_treatment_log',
          entityId: log.id,
          after: { plotId, treatment: log.treatment, appliedOn: log.appliedOn, detectionId: log.detectionId },
        });
        return log;
      });
    },

    // -----------------------------------------------------------------------
    // pest_treatment_reminders
    // -----------------------------------------------------------------------

    async listReminders(scope, farmId, plotId) {
      await requireOwnPlot(db, scope, farmId, plotId);
      return repo.listReminders(db, plotId);
    },

    async createReminder(scope, farmId, plotId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        if (body.detectionId !== undefined) await requireDetectionOnPlot(tx, plotId, body.detectionId);

        const reminder = await repo.insertReminder(tx, {
          plotId,
          detectionId: body.detectionId ?? null,
          title: body.title,
          targetPest: body.targetPest ?? null,
          dueDate: body.dueDate,
          repeatInterval: body.repeatInterval,
          notes: body.notes ?? null,
        });

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.pest.reminder.create',
          entityType: 'pest_treatment_reminder',
          entityId: reminder.id,
          after: { plotId, title: reminder.title, dueDate: reminder.dueDate },
        });
        return reminder;
      });
    },

    /**
     * Only the fields present in the body change. `status: Completed` on a
     * reminder that was not already Completed stamps completed_at with the DB
     * clock (`now()`); the body cannot carry a completedAt (`.strict()`), so a
     * client timestamp is never trusted. Re-sending Completed keeps the
     * original timestamp. `status: Upcoming` clears completed_at.
     */
    async updateReminder(scope, farmId, plotId, reminderId, body) {
      return runTx(async (tx) => {
        await requireOwnPlot(tx, scope, farmId, plotId);
        const existing = await repo.findReminderById(tx, plotId, reminderId);
        if (existing === null) {
          throw new AppError('NOT_FOUND', { detail: 'Pest treatment reminder not found.' });
        }

        const patch: PestTreatmentReminderPatch = {};
        if (body.title !== undefined) patch.title = body.title;
        if (body.dueDate !== undefined) patch.dueDate = body.dueDate;
        if (Object.prototype.hasOwnProperty.call(body, 'notes')) patch.notes = body.notes ?? null;
        if (body.status !== undefined) {
          patch.status = body.status;
          if (body.status === 'Completed') {
            if (existing.status !== 'Completed') patch.completedAt = 'NOW';
          } else {
            patch.completedAt = null;
          }
        }

        const updated = await repo.updateReminder(tx, plotId, reminderId, patch);
        if (updated === null) {
          throw new AppError('NOT_FOUND', { detail: 'Pest treatment reminder not found.' });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.pest.reminder.update',
          entityType: 'pest_treatment_reminder',
          entityId: reminderId,
          before: { status: existing.status, dueDate: existing.dueDate, completedAt: existing.completedAt },
          after: { status: updated.status, dueDate: updated.dueDate, completedAt: updated.completedAt },
        });
        return updated;
      });
    },

    // -----------------------------------------------------------------------
    // analytics
    // -----------------------------------------------------------------------

    /**
     * On-demand, read-only aggregation of the farmer's OWN already-logged
     * detections and treatment logs across every plot on one of their own
     * farms. Not a scheduled job, not a risk model, not advice, and nothing is
     * written — it does not reopen BR-38 (docs/openapi.yaml
     * getMyPestAnalyticsSummary): counting rows the farmer typed is the same
     * kind of arithmetic BR-40 allows for soil labels, applied to counting.
     */
    async getAnalyticsSummary(scope, farmId) {
      await requireOwnFarm(db, scope, farmId);
      const [monthCounts, mostAffectedCrops, treatmentEffectiveness] = await Promise.all([
        repo.countDetectionsByMonth(db, farmId),
        repo.countDetectionsByCrop(db, farmId),
        repo.tallyTreatmentEffectiveness(db, farmId),
      ]);
      return {
        detectionsBySeason: bucketBySeason(monthCounts),
        mostAffectedCrops,
        treatmentEffectiveness,
      };
    },
  };
}

export interface PestService {
  listPestLibrary(query: ListPestLibraryQuery): Promise<PestLibraryEntry[]>;
  getPestLibraryEntry(pestLibraryId: string): Promise<PestLibraryEntry>;
  listWeatherRiskNotes(): Promise<WeatherRiskNote[]>;

  listDetections(scope: ResolvedScope, farmId: string, plotId: string): Promise<PestDetection[]>;
  getDetection(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    detectionId: string,
  ): Promise<PestDetection>;
  createDetection(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    body: CreatePestDetectionBody,
  ): Promise<PestDetection>;
  updateDetection(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    detectionId: string,
    body: UpdatePestDetectionBody,
  ): Promise<PestDetection>;

  listTreatmentLogs(scope: ResolvedScope, farmId: string, plotId: string): Promise<PestTreatmentLog[]>;
  createTreatmentLog(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    body: CreatePestTreatmentLogBody,
  ): Promise<PestTreatmentLog>;

  listReminders(scope: ResolvedScope, farmId: string, plotId: string): Promise<PestTreatmentReminder[]>;
  createReminder(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    body: CreatePestTreatmentReminderBody,
  ): Promise<PestTreatmentReminder>;
  updateReminder(
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
    reminderId: string,
    body: UpdatePestTreatmentReminderBody,
  ): Promise<PestTreatmentReminder>;

  getAnalyticsSummary(scope: ResolvedScope, farmId: string): Promise<PestAnalyticsSummaryResponse>;
}

/** The production instance. */
export const pestService: PestService = createPestService();
