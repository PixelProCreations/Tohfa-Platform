/**
 * Serviceability and service-area requests (BR-171).
 *
 * A pincode is serviceable when it is an active row of served_pincodes; a lat/lng is serviceable
 * when the nearest public pickup point is within serviceability.pickup_radius_km (system_config).
 * Delivery is only ever offered for a served pincode that says so.
 */
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { pickupPointsRepo, type PickupPointsRepo } from '../pickup-points/pickup-points.repo.js';
import { haversineKm } from '../pickup-points/pickup-points.service.js';
import {
  serviceabilityRepo,
  type AreaRequestRow,
  type ServiceabilityRepo,
} from './serviceability.repo.js';
import type {
  AdminAreaRequest,
  AreaRequest,
  CreateAreaRequestBody,
  ListAreaRequestsQuery,
  ServiceabilityQuery,
  ServiceabilityResponse,
} from './serviceability.schema.js';

export const RADIUS_KEY = 'serviceability.pickup_radius_km';

export function normalizeKey(...parts: string[]): string {
  return parts.map((p) => p.trim().toLowerCase().replace(/\s+/g, ' ')).join('|');
}

export function normalizeContact(contact: string): string {
  const digits = contact.replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(-10) : contact.trim().toLowerCase();
}

function toAreaRequest(r: AreaRequestRow): AreaRequest {
  return {
    id: r.id, area: r.area, locality: r.locality, city: r.city, pincode: r.pincode,
    status: r.status, createdAt: r.created_at.toISOString(),
  };
}

export interface ServiceabilityService {
  check(q: ServiceabilityQuery): Promise<ServiceabilityResponse>;
  createRequest(
    body: CreateAreaRequestBody,
    who: { customerId: string | null; ip: string | null },
  ): Promise<{ request: AreaRequest; created: boolean }>;
  listRequests(q: ListAreaRequestsQuery): Promise<{ items: AdminAreaRequest[] }>;
}

export function createServiceabilityService(
  deps: { repo?: ServiceabilityRepo; pickupRepo?: PickupPointsRepo; db?: Executor } = {},
): ServiceabilityService {
  const repo = deps.repo ?? serviceabilityRepo;
  const pickupRepo = deps.pickupRepo ?? pickupPointsRepo;
  const db = deps.db ?? pool;

  async function radiusKm(): Promise<number> {
    const raw = await repo.getNumberConfig(db, RADIUS_KEY);
    const n = Number(raw);
    // Fail closed: a missing or non-positive value is a deployment error, not a default.
    if (raw === null || !Number.isFinite(n) || n <= 0) {
      throw new AppError('INTERNAL', { detail: `system_config ${RADIUS_KEY} is missing or invalid.` });
    }
    return n;
  }

  return {
    async check(q) {
      let serviceable = false;
      let deliveryAvailable = false;
      let nearestPickupPointId: string | undefined;

      if (q.pincode !== undefined) {
        const served = await repo.getServedPincode(db, q.pincode);
        if (served !== null) {
          serviceable = true;
          deliveryAvailable = served.delivery_available;
          if (served.warehouse_id !== null) nearestPickupPointId = served.warehouse_id;
        }
      }

      if (q.lat !== undefined && q.lng !== undefined) {
        const points = await pickupRepo.listPublic(db);
        let best: { id: string; km: number } | null = null;
        for (const p of points) {
          if (p.lat === null || p.lng === null) continue;
          const km = haversineKm(q.lat, q.lng, Number(p.lat), Number(p.lng));
          if (best === null || km < best.km) best = { id: p.id, km };
        }
        if (best !== null) {
          nearestPickupPointId = best.id;
          if (best.km <= (await radiusKm())) serviceable = true;
        }
      }

      return {
        serviceable,
        deliveryAvailable: serviceable && deliveryAvailable,
        ...(nearestPickupPointId !== undefined ? { nearestPickupPointId } : {}),
      };
    },

    async createRequest(body, who) {
      // One request per (who, area): a customer by id, else by contact, else by client IP.
      const requesterKey =
        who.customerId !== null
          ? `customer:${who.customerId}`
          : body.contact !== undefined
            ? `contact:${normalizeContact(body.contact)}`
            : `ip:${who.ip ?? 'unknown'}`;
      const { row, created } = await repo.insertAreaRequest(db, {
        requesterKey,
        areaKey: normalizeKey(body.area, body.locality, body.city),
        customerId: who.customerId,
        area: body.area,
        locality: body.locality,
        city: body.city,
        pincode: body.pincode ?? null,
        contact: body.contact ?? null,
      });
      return { request: toAreaRequest(row), created };
    },

    async listRequests(q) {
      const rows = await repo.listAreaRequests(db, q.status, q.limit);
      return { items: rows.map((r) => ({ ...toAreaRequest(r), contact: r.contact, customerId: r.customer_id })) };
    },
  };
}

export const serviceabilityService: ServiceabilityService = createServiceabilityService();
