import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  calendarRepo,
  type CalendarRepo,
} from './calendar.repo.js';
import type {
  CalendarItemCategory,
  CalendarItemResponse,
  CalendarQuery,
  CalendarResponse,
  CreatePlatformEventBody,
  PlatformEventResponse,
  UpdatePlatformEventBody,
} from './calendar.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface CalendarServiceDeps {
  repo: CalendarRepo;
  db: Executor;
  runTx: TransactionRunner;
}

function ownFarmerId(scope: ResolvedScope): string {
  if (scope.farmerId === undefined) {
    throw new AppError('FORBIDDEN', { detail: 'Endpoint requires a farmer identity.' });
  }
  return scope.farmerId;
}

export interface CalendarService {
  getFarmerCalendar(scope: ResolvedScope, query: CalendarQuery): Promise<CalendarResponse>;
  listPlatformEvents(scope: ResolvedScope): Promise<PlatformEventResponse[]>;
  getPlatformEvent(scope: ResolvedScope, id: string): Promise<PlatformEventResponse>;
  createPlatformEvent(scope: ResolvedScope, body: CreatePlatformEventBody): Promise<PlatformEventResponse>;
  updatePlatformEvent(scope: ResolvedScope, id: string, body: UpdatePlatformEventBody): Promise<PlatformEventResponse>;
  deletePlatformEvent(scope: ResolvedScope, id: string): Promise<void>;
}

export function createCalendarService(deps: CalendarServiceDeps = {
  repo: calendarRepo,
  db: pool,
  runTx: withTransaction,
}): CalendarService {
  const { repo, db, runTx } = deps;

  return {
    async getFarmerCalendar(scope, query) {
      const farmerId = ownFarmerId(scope);

      const [platformEvents, audits, certificates, cropHarvests] = await Promise.all([
        repo.listPlatformEventsForFarmer(db, query.from, query.to),
        repo.listAuditsForFarmer(db, farmerId, query.from, query.to),
        repo.listCertificateExpiriesForFarmer(db, farmerId, query.from, query.to),
        repo.listCropHarvestsForFarmer(db, farmerId, query.from, query.to),
      ]);

      const items: CalendarItemResponse[] = [];

      for (const event of platformEvents) {
        items.push({
          id: `platform-${event.id}`,
          category: 'PLATFORM_EVENT' as CalendarItemCategory,
          title: event.title,
          description: event.description,
          date: event.eventDate,
          metadata: {
            eventId: event.id,
            eventType: event.eventType,
            startTime: event.startTime,
            endTime: event.endTime,
            locationName: event.locationName,
          },
        });
      }

      for (const audit of audits) {
        items.push({
          id: `audit-${audit.id}`,
          category: 'AUDIT' as CalendarItemCategory,
          title: `Farm Audit (Q${audit.quarter} FY ${audit.fiscalYear})`,
          description: `Scheduled ${audit.auditType} audit (Status: ${audit.status})`,
          date: audit.scheduledFor,
          metadata: {
            auditId: audit.id,
            auditType: audit.auditType,
            status: audit.status,
            farmId: audit.farmId,
          },
        });
      }

      for (const cert of certificates) {
        items.push({
          id: `cert-${cert.id}`,
          category: 'CERTIFICATE_EXPIRY' as CalendarItemCategory,
          title: `Certificate Expiry: ${cert.certType}`,
          description: `Certification ${cert.certNumber ? `(${cert.certNumber}) ` : ''}expires`,
          date: cert.expiresOn,
          metadata: {
            certificateId: cert.id,
            certType: cert.certType,
            certNumber: cert.certNumber,
          },
        });
      }

      for (const crop of cropHarvests) {
        items.push({
          id: `crop-${crop.id}`,
          category: 'CROP_HARVEST' as CalendarItemCategory,
          title: `Expected Harvest: ${crop.cropName}`,
          description: `Harvest expected on ${crop.plotName ? `plot ${crop.plotName}` : 'plot'}`,
          date: crop.expectedHarvestOn,
          metadata: {
            farmCropId: crop.id,
            cropName: crop.cropName,
            status: crop.status,
          },
        });
      }

      items.sort((a, b) => a.date.localeCompare(b.date));

      return {
        from: query.from,
        to: query.to,
        items,
      };
    },

    async listPlatformEvents(_scope) {
      return repo.listAllPlatformEvents(db);
    },

    async getPlatformEvent(_scope, id) {
      const event = await repo.findPlatformEventById(db, id);
      if (!event) {
        throw new AppError('NOT_FOUND', { detail: `Platform event with id "${id}" not found.` });
      }
      return event;
    },

    async createPlatformEvent(scope, body) {
      return runTx(async (tx) => {
        const created = await repo.createPlatformEvent(tx, body);

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
          actionCode: 'platform_event.create',
          entityType: 'platform_event',
          entityId: created.id,
          after: created,
        });

        return created;
      });
    },

    async updatePlatformEvent(scope, id, body) {
      return runTx(async (tx) => {
        const before = await repo.findPlatformEventById(tx, id);
        if (!before) {
          throw new AppError('NOT_FOUND', { detail: `Platform event with id "${id}" not found.` });
        }

        const updated = await repo.updatePlatformEvent(tx, id, body);
        if (!updated) {
          throw new AppError('NOT_FOUND', { detail: `Platform event with id "${id}" not found.` });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
          actionCode: 'platform_event.update',
          entityType: 'platform_event',
          entityId: id,
          before,
          after: updated,
          changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
        });

        return updated;
      });
    },

    async deletePlatformEvent(scope, id) {
      return runTx(async (tx) => {
        const before = await repo.findPlatformEventById(tx, id);
        if (!before) {
          throw new AppError('NOT_FOUND', { detail: `Platform event with id "${id}" not found.` });
        }

        const deleted = await repo.softDeletePlatformEvent(tx, id);
        if (!deleted) {
          throw new AppError('NOT_FOUND', { detail: `Platform event with id "${id}" not found.` });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
          actionCode: 'platform_event.delete',
          entityType: 'platform_event',
          entityId: id,
          before,
        });
      });
    },
  };
}

export const calendarService: CalendarService = createCalendarService();
