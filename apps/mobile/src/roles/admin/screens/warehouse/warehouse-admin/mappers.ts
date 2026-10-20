/**
 * Pure mapping for the Main warehouse-admin screens (no React, no
 * react-native), so plain-Node vitest covers every decision
 * (tests/mappers_warehouseAdmin.test.ts). Hooks in ./useWarehouseAdminData.ts
 * only fetch; screens only draw.
 *
 * Weights arrive as kg strings (docs/openapi.yaml Quantity) and become integer
 * grams through money/quantity.ts, never through parseFloat. The utilization
 * percent is the server's own figure (BR-66b), passed through unrounded except
 * for display; nothing here compares it against a threshold, because no
 * near-capacity threshold is exposed to clients (root CLAUDE.md 2.7). The only
 * capacity flag is "over capacity", which is a fact (available < 0), not a
 * threshold.
 */
import { ApiError } from '../../../../../shell/api/client';
import type { CreateSubAdminBody, SubAdminDto } from '../../../api/subAdmins';
import type { WarehouseOption } from '../../../api/warehouseList';
import type { WarehouseCapacityDto, WarehouseDto } from '../../../api/warehouses';
import { adminErrorKey } from '../../../api/errors';
import { t, type TranslationKey } from '../../../i18n';
import { formatKg, parseKgToGrams } from '../../../money/quantity';

// ─── Capacity ────────────────────────────────────────────────────────────────

export interface CapacitySummaryView {
  usedLabel: string;
  /** Null when the warehouse has no capacity set. */
  capacityLabel: string | null;
  availableLabel: string | null;
  /** "82.5%"; null without a capacity. */
  percentLabel: string | null;
  /** 0-100 for the bar (over capacity draws full). */
  fillPercent: number;
  /** Available below zero: more stock than the set capacity (BR-66b, never clamped by the server). */
  overCapacity: boolean;
}

function gramsOrNull(kg: string | null | undefined): number | null {
  return kg === null || kg === undefined ? null : parseKgToGrams(kg);
}

export function toCapacitySummary(dto: WarehouseCapacityDto): CapacitySummaryView {
  const used = parseKgToGrams(dto.usedKg) ?? 0;
  const capacity = gramsOrNull(dto.capacityKg);
  const available = gramsOrNull(dto.availableKg);
  const percent =
    capacity !== null && typeof dto.utilizationPercent === 'number' && Number.isFinite(dto.utilizationPercent)
      ? dto.utilizationPercent
      : null;
  return {
    usedLabel: formatKg(used),
    capacityLabel: capacity === null ? null : formatKg(capacity),
    availableLabel: available === null ? null : formatKg(available),
    percentLabel: percent === null ? null : t('warehouseAdmin.percent', { value: String(percent) }),
    fillPercent: percent === null ? 0 : Math.min(100, Math.max(0, percent)),
    overCapacity: available !== null && available < 0,
  };
}

// ─── Warehouse identity ──────────────────────────────────────────────────────

export function warehouseKindLabel(type: 'MAIN' | 'SUB'): string {
  return type === 'MAIN' ? t('warehouseAdmin.kind.MAIN') : t('warehouseAdmin.kind.SUB');
}

export function warehouseStatusLabel(isActive: boolean): string {
  return isActive ? t('warehouseAdmin.status.active') : t('warehouseAdmin.status.inactive');
}

function nonBlank(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** "address, city, pincode" from the parts that are set; null when none is. */
export function formatWarehouseAddress(dto: Pick<WarehouseDto, 'address' | 'city' | 'pincode'>): string | null {
  const parts = [dto.address, dto.city, dto.pincode].map(nonBlank).filter((p): p is string => p !== null);
  return parts.length === 0 ? null : parts.join(', ');
}

/** Code, city and kind for a card subtitle, skipping what is not set. */
export function warehouseMetaLine(option: WarehouseOption): string {
  return [option.warehouseCode, option.city, warehouseKindLabel(option.type)]
    .filter((p): p is string => p !== null && p !== '')
    .join(' · ');
}

// ─── Overview search / filter ────────────────────────────────────────────────

export type OverviewFilter = 'all' | 'active' | 'inactive';
export const OVERVIEW_FILTERS: readonly OverviewFilter[] = ['all', 'active', 'inactive'];

export function overviewFilterLabel(filter: OverviewFilter): string {
  if (filter === 'active') return t('warehouseAdmin.overview.filter.active');
  if (filter === 'inactive') return t('warehouseAdmin.overview.filter.inactive');
  return t('warehouseAdmin.overview.filter.all');
}

/** Case-insensitive match on name, code or city, then the active filter. */
export function filterWarehouses(
  options: readonly WarehouseOption[],
  query: string,
  filter: OverviewFilter,
): WarehouseOption[] {
  const q = query.trim().toLowerCase();
  return options.filter((o) => {
    const matches =
      q === '' ||
      o.warehouseName.toLowerCase().includes(q) ||
      o.warehouseCode.toLowerCase().includes(q) ||
      (o.city ?? '').toLowerCase().includes(q);
    const status = filter === 'all' || (filter === 'active' ? o.isActive : !o.isActive);
    return matches && status;
  });
}

// ─── Sub Warehouse Admin assignments ─────────────────────────────────────────

/** Live SWA names per warehouse uuid. */
export function subAdminNamesByWarehouse(admins: readonly SubAdminDto[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const a of admins) {
    const names = out.get(a.warehouseId) ?? [];
    names.push(a.fullName);
    out.set(a.warehouseId, names);
  }
  return out;
}

/** Active warehouses with no live Sub Warehouse Admin. A MAIN warehouse is run by the Main admin, so it is not listed. */
export function warehousesWithoutSubAdmin(
  options: readonly WarehouseOption[],
  admins: readonly SubAdminDto[],
): WarehouseOption[] {
  const staffed = new Set(admins.map((a) => a.warehouseId));
  return options.filter((o) => o.isActive && o.type === 'SUB' && !staffed.has(o.warehouseId));
}

export function subAdminStatusLabel(status: SubAdminDto['status']): string {
  if (status === 'ACTIVE') return t('warehouseAdmin.swa.status.ACTIVE');
  if (status === 'PENDING') return t('warehouseAdmin.swa.status.PENDING');
  return t('warehouseAdmin.swa.status.DISABLED');
}

export function subAdminStatusTone(status: SubAdminDto['status']): 'success' | 'warning' | 'danger' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PENDING') return 'warning';
  return 'danger';
}

// ─── Create Sub Warehouse Admin ──────────────────────────────────────────────

export interface SubAdminDraft {
  fullName: string;
  mobile: string;
  warehouseId: string;
}

export type SubAdminDraftField = 'fullName' | 'mobile' | 'warehouseId';
export type SubAdminDraftErrors = Partial<Record<SubAdminDraftField, TranslationKey>>;

/** The server's E.164 pattern (sub-admins.schema.ts). UX only: the server is the authority. */
const E164 = /^\+[1-9][0-9]{7,14}$/;
const FULL_NAME_MAX = 120;

/** Typed mobile without spaces, dashes or brackets ("+91 98765-43210" -> "+919876543210"). */
export function normalizeMobile(input: string): string {
  return input.replace(/[\s\-().]/g, '');
}

/** Field errors as i18n keys; an empty object means the draft can be sent. */
export function validateSubAdminDraft(draft: SubAdminDraft): SubAdminDraftErrors {
  const errors: SubAdminDraftErrors = {};
  const name = draft.fullName.trim();
  if (name === '') errors.fullName = 'warehouseAdmin.swa.validation.nameRequired';
  else if (name.length > FULL_NAME_MAX) errors.fullName = 'warehouseAdmin.swa.validation.nameTooLong';
  if (!E164.test(normalizeMobile(draft.mobile))) errors.mobile = 'warehouseAdmin.swa.validation.mobileFormat';
  // BR-25: a Sub Warehouse Admin is bound to exactly one warehouse.
  if (draft.warehouseId === '') errors.warehouseId = 'warehouseAdmin.swa.validation.warehouseRequired';
  return errors;
}

export function hasDraftErrors(errors: SubAdminDraftErrors, fields: readonly SubAdminDraftField[]): boolean {
  return fields.some((f) => errors[f] !== undefined);
}

export function toCreateSubAdminBody(draft: SubAdminDraft): CreateSubAdminBody {
  return { fullName: draft.fullName.trim(), mobile: normalizeMobile(draft.mobile), warehouseId: draft.warehouseId };
}

/**
 * The message for a failed create. The server answers both "mobile already
 * registered" and "warehouse already has its maximum of admins" with 409
 * CONFLICT and no `meta.reason`; the field errors tell them apart
 * (`body.mobile` only on the first). Everything else goes through the shared
 * adminErrorKey.
 */
export function createSubAdminErrorKey(err: unknown): TranslationKey {
  if (err instanceof ApiError) {
    const fields = err.problem.errors ?? {};
    if (err.is('CONFLICT')) {
      return fields['body.mobile'] !== undefined
        ? 'warehouseAdmin.swa.error.mobileTaken'
        : 'warehouseAdmin.swa.error.warehouseFull';
    }
    if (err.is('VALIDATION_FAILED') && fields['body.warehouseId'] !== undefined) {
      return 'warehouseAdmin.swa.error.warehouseInvalid';
    }
  }
  return adminErrorKey(err);
}

// ─── Figures ─────────────────────────────────────────────────────────────────

/** A figure that may still be loading or may have failed, as the hooks return it. */
export interface FigureSource<T> {
  data: T | undefined;
  isLoading: boolean;
  error: unknown;
}

/**
 * The text for one KPI: the formatted value once it is here, "…" while it
 * loads, "—" when it failed or was not asked for. Never a made-up zero.
 */
export function figureLabel<T>(source: FigureSource<T> | undefined, format: (value: T) => string): string {
  if (source === undefined) return t('warehouseAdmin.figure.unavailable');
  if (source.data !== undefined) return format(source.data);
  if (source.isLoading) return t('warehouseAdmin.figure.loading');
  return t('warehouseAdmin.figure.unavailable');
}

export function countLabel(n: number): string {
  return String(n);
}

// ─── Flow helper ─────────────────────────────────────────────────────────────

/**
 * The uuid for a display name the Performance screen hands back ('Ooty
 * Warehouse' or 'Ooty'); undefined when no live warehouse matches.
 */
export function warehouseIdForName(options: readonly WarehouseOption[], name: string): string | undefined {
  const key = name.trim().replace(/ Warehouse$/i, '').toLowerCase();
  if (key === '') return undefined;
  return options.find((o) => o.warehouseName.toLowerCase().startsWith(key))?.warehouseId;
}
