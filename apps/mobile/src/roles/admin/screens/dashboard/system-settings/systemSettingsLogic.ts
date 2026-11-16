/**
 * Pure logic for the System Settings & Audit Log flow (no React, no RN), so it
 * is unit-testable in plain Node.
 *
 * What GET /admin/audit-log (`AuditLogEntry`) carries and how the design's
 * fields map onto it:
 *   title          -> `action` (the action code; there is no display label)
 *   subtitle       -> `entityType` + the first characters of `entityId`
 *   timestamp      -> `at`, as "10 Oct 2026, 11:24 AM" in IST
 *   Action Type    -> the verb at the end of `action` (create / update / ...)
 *   Module         -> `entityType`
 *   Performed By   -> `actorId` (short) + `actorRole`, or the actor type
 *   Affected User  -> `entityId` when the entity is a person, else the dash
 *   IP Address     -> `ip`
 *   Device/Browser -> not in the API: always the dash
 *   Change Details -> `changedFields` with their `before` / `after` values
 */
import type { AuditLogEntryDto } from '../../../api/auditLog';
import { hasKey, t, type TranslationKey } from '../../../i18n';
import { formatAdminDay, formatAdminTime } from '../../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';

/** docs/rbac.json codes the flow checks. */
export const SYSTEM_SETTINGS_CODES = {
  config: 'system.config.manage',
  auditView: 'auditlog.view',
  auditExport: 'auditlog.export',
  integrationKeys: 'system.integration_key.manage',
  dbExport: 'system.db_export.raw',
} as const;

export type SystemSettingsScreen =
  | 'hub'
  | 'config'
  | 'audit_logs'
  | 'log_details'
  | 'filter_logs'
  | 'integration_keys'
  | 'add_integration'
  | 'integration_detail'
  | 'edit_integration'
  | 'emergency_export';

export type SystemSettingsEntryScreen = 'hub' | 'config' | 'audit_logs' | 'integration_keys' | 'emergency_export';

// ─── Audit log rows ──────────────────────────────────────────────────────────

/** The design's four icon/tone variants, plus delete (same icon as update). */
export type AuditActionKind = 'create' | 'update' | 'generate' | 'export' | 'delete';

const KIND_PATTERNS: readonly [AuditActionKind, RegExp][] = [
  ['export', /export|download/],
  ['generate', /generate|key|token/],
  ['create', /create|add|register|submit|invite|onboard/],
  ['delete', /delete|remove|revoke|archive|deactivate/],
];

/** The verb at the end of an action code ("payout.approve" -> "approve"). */
export function actionVerb(action: string): string {
  const parts = action.split('.');
  return (parts[parts.length - 1] ?? action).toLowerCase();
}

export function actionKind(action: string): AuditActionKind {
  const verb = actionVerb(action);
  for (const [kind, pattern] of KIND_PATTERNS) if (pattern.test(verb)) return kind;
  return 'update';
}

const KIND_LABEL: Record<AuditActionKind, TranslationKey> = {
  create: 'saSettings.actionKind.create',
  update: 'saSettings.actionKind.update',
  generate: 'saSettings.actionKind.generate',
  export: 'saSettings.actionKind.export',
  delete: 'saSettings.actionKind.delete',
};

/** "Create" for create-like verbs; any other verb is shown as the server sent it. */
export function actionTypeLabel(action: string): string {
  const verb = actionVerb(action);
  const kind = actionKind(action);
  if (kind !== 'update' || /update|edit|change|configure|set/.test(verb)) return t(KIND_LABEL[kind]);
  return verb.length > 0 ? verb : ADMIN_NO_VALUE;
}

const SHORT_ID = 8;

export function shortId(id: string | null): string {
  return id === null || id.length === 0 ? ADMIN_NO_VALUE : id.slice(0, SHORT_ID).toUpperCase();
}

export function roleLabel(role: string | null): string {
  if (role === null || role.length === 0) return ADMIN_NO_VALUE;
  const key = `saSettings.role.${role}`;
  return hasKey(key) ? t(key) : role;
}

export function performedBy(dto: AuditLogEntryDto): string {
  if (dto.actorType !== 'USER') {
    const key = `saSettings.actorType.${dto.actorType}`;
    return hasKey(key) ? t(key) : dto.actorType;
  }
  return t('saSettings.log.performedBy', { id: shortId(dto.actorId), role: roleLabel(dto.actorRole) });
}

const PERSON_ENTITY = /user|farmer|customer|admin|staff|account/i;

export function affectedUser(dto: AuditLogEntryDto): string {
  return PERSON_ENTITY.test(dto.entityType) && dto.entityId !== null ? shortId(dto.entityId) : ADMIN_NO_VALUE;
}

/** "10 Oct 2026, 11:24 AM" (IST), or the dash when `at` is not a date. */
export function auditTimestamp(at: string): string {
  const day = formatAdminDay(at);
  if (day === '') return ADMIN_NO_VALUE;
  return t('saSettings.log.timestamp', { day, time: formatAdminTime(at) });
}

export interface AuditLogRow {
  id: string;
  dto: AuditLogEntryDto;
  title: string;
  subtitle: string;
  timestamp: string;
  kind: AuditActionKind;
  actionType: string;
  module: string;
  performedBy: string;
  affectedUser: string;
  ip: string;
  /** Not in `AuditLogEntry`: always the dash. */
  device: string;
}

export function toAuditLogRow(dto: AuditLogEntryDto): AuditLogRow {
  const entity = dto.entityType.length > 0 ? dto.entityType : ADMIN_NO_VALUE;
  return {
    id: dto.id,
    dto,
    title: dto.action.length > 0 ? dto.action : ADMIN_NO_VALUE,
    subtitle:
      dto.entityId === null ? entity : t('saSettings.log.subtitle', { entity, id: shortId(dto.entityId) }),
    timestamp: auditTimestamp(dto.at),
    kind: actionKind(dto.action),
    actionType: actionTypeLabel(dto.action),
    module: entity,
    performedBy: performedBy(dto),
    affectedUser: affectedUser(dto),
    ip: dto.ip !== null && dto.ip.length > 0 ? dto.ip : ADMIN_NO_VALUE,
    device: ADMIN_NO_VALUE,
  };
}

// ─── Change details ──────────────────────────────────────────────────────────

export interface ChangeBullet {
  key: string;
  value: string;
}

/** A display cap on how many fields the card lists, not a business threshold. */
export const MAX_CHANGE_BULLETS = 12;
const MAX_VALUE_CHARS = 80;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined) return ADMIN_NO_VALUE;
  if (typeof value === 'string') return value.length > 0 ? value : ADMIN_NO_VALUE;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  const json = JSON.stringify(value);
  return json.length > MAX_VALUE_CHARS ? `${json.slice(0, MAX_VALUE_CHARS)}…` : json;
}

/**
 * One bullet per changed field: "before → after" when both images carry it and
 * they differ, else the after value. With nothing recorded there is one
 * Summary bullet carrying the dash, so the card is never empty.
 */
export function changeBullets(dto: AuditLogEntryDto): ChangeBullet[] {
  const after = isRecord(dto.after) ? dto.after : null;
  const before = isRecord(dto.before) ? dto.before : null;
  const fields =
    dto.changedFields !== null && dto.changedFields.length > 0
      ? dto.changedFields
      : after !== null
        ? Object.keys(after)
        : [];
  const bullets = fields.slice(0, MAX_CHANGE_BULLETS).map((field) => {
    const next = formatChangeValue(after?.[field]);
    const hadBefore = before !== null && Object.prototype.hasOwnProperty.call(before, field);
    const prev = hadBefore ? formatChangeValue(before[field]) : null;
    return {
      key: field,
      value: prev !== null && prev !== next ? t('saSettings.logDetails.fromTo', { before: prev, after: next }) : next,
    };
  });
  if (bullets.length > 0) return bullets;
  return [{ key: t('saSettings.logDetails.summary'), value: ADMIN_NO_VALUE }];
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export type AuditDateRange = 'all' | 'today' | 'last7' | 'last30';
export const AUDIT_DATE_RANGES: readonly AuditDateRange[] = ['all', 'today', 'last7', 'last30'];

export const DATE_RANGE_LABEL: Record<AuditDateRange, TranslationKey> = {
  all: 'saSettings.filter.range.all',
  today: 'saSettings.filter.range.today',
  last7: 'saSettings.filter.range.last7',
  last30: 'saSettings.filter.range.last30',
};

/** What the filter screen edits. null = "all". */
export interface AuditFilterDraft {
  dateRange: AuditDateRange;
  action: string | null;
  entityType: string | null;
}

/** What the list query is keyed on: the draft plus the resolved bounds. */
export interface AppliedAuditFilters extends AuditFilterDraft {
  from: string | undefined;
  to: string | undefined;
}

export const DEFAULT_AUDIT_FILTER_DRAFT: AuditFilterDraft = { dateRange: 'all', action: null, entityType: null };
export const DEFAULT_APPLIED_AUDIT_FILTERS: AppliedAuditFilters = {
  ...DEFAULT_AUDIT_FILTER_DRAFT,
  from: undefined,
  to: undefined,
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** Asia/Kolkata is UTC+05:30 with no DST: the admin app's calendar day. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function istMidnight(now: Date): number {
  const local = now.getTime() + IST_OFFSET_MS;
  return local - (local % DAY_MS) - IST_OFFSET_MS;
}

/** Inclusive `from` for a range, resolved against `now` (IST days); `to` is left open. */
export function rangeFrom(range: AuditDateRange, now: Date): string | undefined {
  if (range === 'all') return undefined;
  const daysBack = range === 'today' ? 0 : range === 'last7' ? 6 : 29;
  return new Date(istMidnight(now) - daysBack * DAY_MS).toISOString();
}

export function applyAuditFilters(draft: AuditFilterDraft, now: Date): AppliedAuditFilters {
  return { ...draft, from: rangeFrom(draft.dateRange, now), to: undefined };
}

export function hasActiveAuditFilters(applied: AuditFilterDraft): boolean {
  return applied.dateRange !== 'all' || applied.action !== null || applied.entityType !== null;
}

/** Distinct, sorted, non-empty values (filter options from the loaded entries). */
export function distinctValues(values: readonly string[]): string[] {
  return [...new Set(values.filter((v) => v.length > 0))].sort();
}

// ─── Small helpers ───────────────────────────────────────────────────────────

export function toggleIn<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}
