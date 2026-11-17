/**
 * Public pickup points (BR-170). Allow-list serializer; distance is haversine, open-now is computed
 * in Asia/Kolkata from the stored weekly hours. No auth, no internal fields.
 */
import { pool, type Executor } from '../../db/pool.js';
import { pickupPointsRepo, type PickupPointRow, type PickupPointsRepo } from './pickup-points.repo.js';
import { openingHoursSchema, type ListPickupPointsQuery, type PickupPoint } from './pickup-points.schema.js';

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type Hours = NonNullable<ReturnType<typeof parseHours>>;

export function parseHours(raw: unknown) {
  const r = openingHoursSchema.safeParse(raw);
  return r.success ? r.data : null;
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number): number => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(bLat - aLat) / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Local (IST) weekday key and HH:MM for an instant. */
function istParts(now: Date): { day: (typeof DAYS)[number]; hhmm: string } {
  const ist = new Date(now.getTime() + 330 * 60_000);
  const hh = String(ist.getUTCHours()).padStart(2, '0');
  const mm = String(ist.getUTCMinutes()).padStart(2, '0');
  return { day: DAYS[ist.getUTCDay()] as (typeof DAYS)[number], hhmm: `${hh}:${mm}` };
}

export function isOpenNow(hours: Hours | null, now: Date): boolean {
  if (hours === null) return false;
  const { day, hhmm } = istParts(now);
  const d = hours[day];
  return !d.closed && hhmm >= d.open && hhmm < d.close;
}

export function toPickupPoint(row: PickupPointRow, now: Date): PickupPoint {
  const hours = parseHours(row.operating_hours);
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.public_phone,
    openingHours: hours,
    isOpenNow: isOpenNow(hours, now),
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
  };
}

export interface PickupPointsService {
  list(q: ListPickupPointsQuery): Promise<{ items: PickupPoint[] }>;
}

export function createPickupPointsService(
  deps: { repo?: PickupPointsRepo; db?: Executor; now?: () => Date } = {},
): PickupPointsService {
  const repo = deps.repo ?? pickupPointsRepo;
  const db = deps.db ?? pool;
  const now = deps.now ?? (() => new Date());
  return {
    async list(q) {
      const at = now();
      const items = (await repo.listPublic(db)).map((r) => toPickupPoint(r, at));
      if (q.lat === undefined || q.lng === undefined) return { items };
      let nearest: PickupPoint | null = null;
      for (const p of items) {
        p.isNearest = false;
        if (p.lat === null || p.lng === null) {
          p.distanceKm = null;
          continue;
        }
        p.distanceKm = Math.round(haversineKm(q.lat, q.lng, p.lat, p.lng) * 10) / 10;
        if (nearest === null || p.distanceKm < (nearest.distanceKm ?? Infinity)) nearest = p;
      }
      if (nearest !== null) nearest.isNearest = true;
      items.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      return { items };
    },
  };
}

export const pickupPointsService: PickupPointsService = createPickupPointsService();
