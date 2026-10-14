import type { Executor } from '../../db/pool.js';
import type {
  CreatePlatformEventBody,
  EventType,
  TargetAudience,
  UpdatePlatformEventBody,
} from './calendar.schema.js';

export interface CalendarPlatformEventRecord {
  id: string;
  title: string;
  description: string | null;
  eventType: EventType;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  targetAudience: TargetAudience;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CalendarAuditItem {
  id: string;
  auditType: string;
  scheduledFor: string;
  status: string;
  farmId: string | null;
  quarter: number;
  fiscalYear: string;
}

export interface CalendarCertificateItem {
  id: string;
  certType: string;
  /** Set exactly when certType is OTHER (certifications_custom_type_name_chk). */
  customTypeName: string | null;
  certNumber: string | null;
  expiresOn: string;
}

export interface CalendarCropHarvestItem {
  id: string;
  cropName: string;
  expectedHarvestOn: string;
  status: string;
  plotName: string | null;
}

interface PlatformEventRow {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  target_audience: string;
  is_published: boolean;
  created_at: Date;
  updated_at: Date | null;
}

function mapEventRow(row: PlatformEventRow): CalendarPlatformEventRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eventType: row.event_type as EventType,
    eventDate: String(row.event_date).slice(0, 10),
    startTime: row.start_time,
    endTime: row.end_time,
    locationName: row.location_name,
    targetAudience: row.target_audience as TargetAudience,
    isPublished: row.is_published,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

/**
 * BR-58a: calendar_max_range_days, seeded as 366 by migration 0040. Same
 * read-and-fall-back shape as the certifications day-count keys; the fallback
 * matches the seeded value, and a fractional or negative value has no meaning as
 * a count of days so it also falls back.
 */
const DEFAULT_CALENDAR_MAX_RANGE_DAYS = 366;

export interface CalendarRepo {
  getCalendarMaxRangeDays(db: Executor): Promise<number>;
  listPlatformEventsForFarmer(db: Executor, from: string, to: string): Promise<CalendarPlatformEventRecord[]>;
  listAuditsForFarmer(db: Executor, farmerId: string, from: string, to: string): Promise<CalendarAuditItem[]>;
  listCertificateExpiriesForFarmer(db: Executor, farmerId: string, from: string, to: string): Promise<CalendarCertificateItem[]>;
  listCropHarvestsForFarmer(db: Executor, farmerId: string, from: string, to: string): Promise<CalendarCropHarvestItem[]>;
  listAllPlatformEvents(
    db: Executor,
    args: { page: number; limit: number },
  ): Promise<{ rows: CalendarPlatformEventRecord[]; total: number }>;
  findPlatformEventById(db: Executor, id: string): Promise<CalendarPlatformEventRecord | null>;
  createPlatformEvent(db: Executor, data: CreatePlatformEventBody): Promise<CalendarPlatformEventRecord>;
  updatePlatformEvent(db: Executor, id: string, patch: UpdatePlatformEventBody): Promise<CalendarPlatformEventRecord | null>;
  softDeletePlatformEvent(db: Executor, id: string): Promise<boolean>;
}

export const calendarRepo: CalendarRepo = {
  async getCalendarMaxRangeDays(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'calendar_max_range_days' LIMIT 1`,
    );
    const val = res.rows[0]?.value;
    const parsed =
      typeof val === 'number' ? val : typeof val === 'string' && val.trim() !== '' ? Number(val) : NaN;
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_CALENDAR_MAX_RANGE_DAYS;
  },

  async listPlatformEventsForFarmer(db, from, to) {
    const result = await db.query<PlatformEventRow>(
      `SELECT id, title, description, event_type, event_date::text,
              start_time, end_time, location_name, target_audience, is_published,
              created_at, updated_at
         FROM platform_events
        WHERE event_date >= $1::date AND event_date <= $2::date
          AND target_audience IN ('ALL', 'FARMER')
          AND is_published = true
          AND deleted_at IS NULL
     ORDER BY event_date ASC, start_time ASC`,
      [from, to],
    );
    return result.rows.map(mapEventRow);
  },

  async listAuditsForFarmer(db, farmerId, from, to) {
    const result = await db.query<{
      id: string;
      audit_type: string;
      scheduled_for: string;
      status: string;
      farm_id: string | null;
      quarter: number;
      fiscal_year: string;
    }>(
      // scheduled_for is a timestamptz: a bare ::date uses the session time zone
      // (UTC), which puts an audit at 01:30 IST on the 10th onto the 9th. The
      // calendar is the farmer's Asia/Kolkata calendar, so every comparison and
      // the selected day use that zone. ORDER BY is qualified so it sorts by the
      // instant, not by the aliased output date.
      `SELECT a.id, a.audit_type,
              (a.scheduled_for AT TIME ZONE 'Asia/Kolkata')::date::text AS scheduled_for,
              a.status, a.farm_id, a.quarter, a.fiscal_year
         FROM audits a
        WHERE a.farmer_id = $1
          AND (a.scheduled_for AT TIME ZONE 'Asia/Kolkata')::date >= $2::date
          AND (a.scheduled_for AT TIME ZONE 'Asia/Kolkata')::date <= $3::date
          AND a.status != 'CANCELLED'
     ORDER BY a.scheduled_for ASC`,
      [farmerId, from, to],
    );
    return result.rows.map((r) => ({
      id: r.id,
      auditType: r.audit_type,
      scheduledFor: String(r.scheduled_for).slice(0, 10),
      status: r.status,
      farmId: r.farm_id,
      quarter: Number(r.quarter),
      fiscalYear: r.fiscal_year,
    }));
  },

  async listCertificateExpiriesForFarmer(db, farmerId, from, to) {
    const result = await db.query<{
      id: string;
      cert_type: string;
      custom_type_name: string | null;
      cert_number: string | null;
      expires_on: string;
    }>(
      `SELECT id, cert_type, custom_type_name, cert_number, expires_on::text
         FROM certifications
        WHERE farmer_id = $1
          AND expires_on >= $2::date AND expires_on <= $3::date
          AND deleted_at IS NULL
     ORDER BY expires_on ASC`,
      [farmerId, from, to],
    );
    return result.rows.map((r) => ({
      id: r.id,
      certType: r.cert_type,
      customTypeName: r.custom_type_name,
      certNumber: r.cert_number,
      expiresOn: String(r.expires_on).slice(0, 10),
    }));
  },

  async listCropHarvestsForFarmer(db, farmerId, from, to) {
    const result = await db.query<{
      id: string;
      crop_name: string;
      expected_harvest_on: string;
      status: string;
      plot_name: string | null;
    }>(
      `SELECT fc.id, cm.name AS crop_name, fc.expected_harvest_on::text, fc.status,
              p.name AS plot_name
         FROM farm_crops fc
         JOIN crop_master cm ON fc.crop_id = cm.id
         JOIN plots p ON fc.plot_id = p.id
         JOIN farms f ON p.farm_id = f.id
        WHERE f.farmer_id = $1
          AND fc.expected_harvest_on >= $2::date AND fc.expected_harvest_on <= $3::date
          AND fc.status IN ('PLANNED', 'GROWING')
          AND fc.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND f.deleted_at IS NULL
     ORDER BY fc.expected_harvest_on ASC`,
      [farmerId, from, to],
    );
    return result.rows.map((r) => ({
      id: r.id,
      cropName: r.crop_name,
      expectedHarvestOn: String(r.expected_harvest_on).slice(0, 10),
      status: r.status,
      plotName: r.plot_name,
    }));
  },

  async listAllPlatformEvents(db, { page, limit }) {
    const count = await db.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM platform_events WHERE deleted_at IS NULL`,
    );
    // id is the final tie-break so two events at the same date and time never
    // swap places between pages.
    const result = await db.query<PlatformEventRow>(
      `SELECT id, title, description, event_type, event_date::text,
              start_time, end_time, location_name, target_audience, is_published,
              created_at, updated_at
         FROM platform_events
        WHERE deleted_at IS NULL
     ORDER BY event_date DESC, start_time DESC, id ASC
        LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit],
    );
    return { rows: result.rows.map(mapEventRow), total: count.rows[0]?.total ?? 0 };
  },

  async findPlatformEventById(db, id) {
    const result = await db.query<PlatformEventRow>(
      `SELECT id, title, description, event_type, event_date::text,
              start_time, end_time, location_name, target_audience, is_published,
              created_at, updated_at
         FROM platform_events
        WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    const row = result.rows[0];
    return row ? mapEventRow(row) : null;
  },

  async createPlatformEvent(db, data) {
    const result = await db.query<PlatformEventRow>(
      `INSERT INTO platform_events (
         title, description, event_type, event_date, start_time, end_time,
         location_name, target_audience, is_published
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title, description, event_type, event_date::text,
                 start_time, end_time, location_name, target_audience, is_published,
                 created_at, updated_at`,
      [
        data.title,
        data.description ?? null,
        data.eventType,
        data.eventDate,
        data.startTime ?? null,
        data.endTime ?? null,
        data.locationName ?? null,
        data.targetAudience ?? 'ALL',
        data.isPublished ?? true,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('INSERT failed');
    return mapEventRow(row);
  },

  async updatePlatformEvent(db, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];

    const addSet = (col: string, val: unknown) => {
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    };

    if (patch.title !== undefined) addSet('title', patch.title);
    if ('description' in patch) addSet('description', patch.description ?? null);
    if (patch.eventType !== undefined) addSet('event_type', patch.eventType);
    if (patch.eventDate !== undefined) addSet('event_date', patch.eventDate);
    if ('startTime' in patch) addSet('start_time', patch.startTime ?? null);
    if ('endTime' in patch) addSet('end_time', patch.endTime ?? null);
    if ('locationName' in patch) addSet('location_name', patch.locationName ?? null);
    if (patch.targetAudience !== undefined) addSet('target_audience', patch.targetAudience);
    if (patch.isPublished !== undefined) addSet('is_published', patch.isPublished);

    const result = await db.query<PlatformEventRow>(
      `UPDATE platform_events
          SET ${sets.join(', ')}
        WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, title, description, event_type, event_date::text,
              start_time, end_time, location_name, target_audience, is_published,
              created_at, updated_at`,
      params,
    );
    const row = result.rows[0];
    return row ? mapEventRow(row) : null;
  },

  async softDeletePlatformEvent(db, id) {
    const result = await db.query(
      `UPDATE platform_events
          SET deleted_at = now()
        WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  },
};
