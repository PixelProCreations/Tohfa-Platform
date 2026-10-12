/**
 * Live warehouse alerts and the caller's own dismiss / snooze state on them
 * (docs/openapi.yaml: /admin/alerts; BR-77, BR-78; permission alert.own.view).
 *
 * Alerts are derived on the server at every call, inside the caller's
 * warehouse scope; dismiss and snooze change only this user's list. Neither
 * moves money and a replay is harmless, so no Idempotency-Key is sent.
 *
 * The snooze length is NOT decided here: the server caps `until` with
 * system_config.alert_snooze_max_hours and the spec gives no default length,
 * so a caller must supply the instant (root CLAUDE.md 2.7).
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { GenericProblemCode } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';

/** docs/openapi.yaml `AlertType`. */
export type AlertType = 'BATCH_NEAR_EXPIRY' | 'LOW_STOCK' | 'CAPACITY_NEAR_FULL';

/** docs/openapi.yaml `WorklistRefType`. */
export type WorklistRefType = 'RETURN_REQUEST' | 'GOODS_RECEIPT' | 'ORDER' | 'INVENTORY_BATCH' | 'WAREHOUSE';

/** docs/openapi.yaml `WorklistParams`: machine values to format and translate, never prose. */
export type WorklistParams = Record<string, string | number | boolean | null>;

/** docs/openapi.yaml `AlertItem`. */
export interface AlertItemDto {
  /** `<type>:<refId>`, or `low_stock:<warehouse>:<crop>:<grade>`; pass back verbatim. */
  itemKey: string;
  type: AlertType;
  /** Translation key `alert.<type lower-case>.message`. */
  messageKey: string;
  refType: WorklistRefType;
  refId: string;
  warehouseId: string;
  /** When the condition began; null for point-in-time alerts. */
  since: string | null;
  params: WorklistParams;
  state: 'ACTIVE' | 'SNOOZED';
  snoozedUntil: string | null;
}

/** docs/openapi.yaml `TaskAlertState`: the caller's state after dismiss / snooze. */
export interface TaskAlertStateDto {
  itemKey: string;
  state: 'DONE' | 'DISMISSED' | 'SNOOZED';
  snoozedUntil: string | null;
  updatedAt: string;
}

/** `state` of GET /admin/alerts: active (default) or still snoozed. Dismissed alerts are in neither. */
export type AlertListState = 'active' | 'snoozed';

export interface ListAlertsParams {
  type?: AlertType | undefined;
  /** Only the caller's own warehouse (or, for Main, one it can see); omit for the whole scope. */
  warehouseId?: string | undefined;
  state?: AlertListState | undefined;
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
}

/** Problem codes these endpoints document (401, 403, 404, 422, 500). */
export const ERROR_CODES: readonly GenericProblemCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

function alertPath(itemKey: string, action: 'dismiss' | 'snooze'): string {
  return `/admin/alerts/${encodeURIComponent(itemKey)}/${action}`;
}

export function listAlerts(params: ListAlertsParams = {}, signal?: AbortSignal): Promise<Page<AlertItemDto>> {
  return adminGet<Page<AlertItemDto>>(
    '/admin/alerts',
    {
      type: params.type,
      warehouseId: params.warehouseId,
      state: params.state,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

/** Hides this alert from the caller's own lists until its condition clears (BR-78). */
export function dismissAlert(itemKey: string): Promise<TaskAlertStateDto> {
  return adminPost<TaskAlertStateDto>(alertPath(itemKey, 'dismiss'), undefined);
}

/**
 * Hides this alert from the caller's active list until `until` (BR-78). The
 * server checks the range (future, within alert_snooze_max_hours) and answers
 * 422 on `body.until`; this only refuses a value that is not an instant at all.
 */
export async function snoozeAlert(itemKey: string, until: string | Date): Promise<TaskAlertStateDto> {
  const instant = until instanceof Date ? until.getTime() : Date.parse(until);
  if (!Number.isFinite(instant)) throw new RangeError('snoozeAlert: until is not a date-time');
  const body = { until: until instanceof Date ? until.toISOString() : until };
  return adminPost<TaskAlertStateDto>(alertPath(itemKey, 'snooze'), body);
}
