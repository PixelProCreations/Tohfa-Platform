import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import type { Actor } from '../../auth/requireAuth.js';
import {
  deliveryPartnersRepo,
  type DeliveryPartnersRepo,
  type DeliveryPartnerRecord,
} from './delivery-partners.repo.js';
import type {
  CreateDeliveryPartnerRequest,
  DeliveryPartner,
  UpdateDeliveryPartnerRequest,
} from './delivery-partners.schema.js';

function toDto(record: DeliveryPartnerRecord): DeliveryPartner {
  return {
    id: record.id,
    name: record.name,
    phone: record.phone,
    vehicleRef: record.vehicleRef,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
  };
}

export interface DeliveryPartnersService {
  list(status?: 'active' | 'inactive' | 'all'): Promise<DeliveryPartner[]>;
  listActive(): Promise<DeliveryPartner[]>;
  getById(id: string): Promise<DeliveryPartner>;
  create(actor: Actor, input: CreateDeliveryPartnerRequest): Promise<DeliveryPartner>;
  update(actor: Actor, id: string, input: UpdateDeliveryPartnerRequest): Promise<DeliveryPartner>;
  softDelete(actor: Actor, id: string): Promise<void>;
}

export function createDeliveryPartnersService(opts: {
  repo?: DeliveryPartnersRepo;
  db?: Executor;
} = {}): DeliveryPartnersService {
  const repo = opts.repo ?? deliveryPartnersRepo;
  const db = opts.db ?? pool;

  return {
    async list(status = 'active') {
      const records = await repo.list(db, status);
      return records.map(toDto);
    },

    async listActive() {
      const records = await repo.listActive(db);
      return records.map(toDto);
    },

    async getById(id: string) {
      const record = await repo.findById(db, id);
      if (!record || record.deletedAt) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Delivery partner ${id} not found.`,
        });
      }
      return toDto(record);
    },

    async create(actor, input) {
      return withTransaction(async (tx) => {
        const created = await repo.create(tx, {
          name: input.name,
          phone: input.phone,
          vehicleRef: input.vehicleRef ?? null,
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'delivery.partner.manage',
          entityType: 'delivery_partners',
          entityId: created.id,
          after: {
            name: created.name,
            phone: created.phone,
            vehicleRef: created.vehicleRef,
            isActive: created.isActive,
          },
        });

        return toDto(created);
      });
    },

    async update(actor, id, input) {
      return withTransaction(async (tx) => {
        const existing = await repo.findById(tx, id);
        if (!existing || existing.deletedAt) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Delivery partner ${id} not found.`,
          });
        }

        const updated = await repo.update(tx, id, {
          name: input.name,
          phone: input.phone,
          vehicleRef: input.vehicleRef,
          isActive: input.isActive,
        });

        if (!updated) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Delivery partner ${id} not found.`,
          });
        }

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'delivery.partner.manage',
          entityType: 'delivery_partners',
          entityId: id,
          before: {
            name: existing.name,
            phone: existing.phone,
            vehicleRef: existing.vehicleRef,
            isActive: existing.isActive,
          },
          after: {
            name: updated.name,
            phone: updated.phone,
            vehicleRef: updated.vehicleRef,
            isActive: updated.isActive,
          },
        });

        return toDto(updated);
      });
    },

    async softDelete(actor, id) {
      await withTransaction(async (tx) => {
        const existing = await repo.findById(tx, id);
        if (!existing || existing.deletedAt) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Delivery partner ${id} not found.`,
          });
        }

        await repo.softDelete(tx, id);

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'delivery.partner.manage',
          entityType: 'delivery_partners',
          entityId: id,
          before: {
            isActive: existing.isActive,
            deletedAt: null,
          },
          after: {
            isActive: false,
            deletedAt: new Date().toISOString(),
          },
        });
      });
    },
  };
}

export const deliveryPartnersService = createDeliveryPartnersService();
