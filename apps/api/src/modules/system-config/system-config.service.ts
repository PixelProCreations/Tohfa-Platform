import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { systemConfigRepo, type SystemConfigRow } from './system-config.repo.js';
import type { SystemConfigItemResponse, UpdateSystemConfigBody } from './system-config.schema.js';

/**
 * Explicit whitelist of business-configurable keys (D12).
 * Security, OTP, retention, internal auth, and rating-scale locks remain read-only.
 */
const EDITABLE_BUSINESS_KEYS = new Set<string>([
  'alert_batch_expiry_days',
  'alert_capacity_utilization_percent',
  'alert_snooze_max_hours',
  'alert_threshold_audit_overdue_days',
  'alert_threshold_stock_pct',
  'asset_service_due_soon_days',
  'calendar_max_range_days',
  'cart_lock_hours',
  'cart_low_stock_threshold_kg',
  'cash_topup_cap',
  'catalog.recent_searches_max',
  'catalog.trending_min_searchers',
  'catalog.trending_window_days',
  'cert_expiry_max_future_days',
  'cert_expiry_max_past_days',
  'cert_expiry_warning_days',
  'counter_offer_window_hours',
  'critical_stock_threshold_kg',
  'delivery_fee',
  'delivery_slot_cutoff_minutes',
  'finance_report_max_range_days',
  'free_delivery_threshold',
  'free_tier_limits_enabled',
  'free_tier_listing_limit',
  'handling_fee',
  'help.contact.email',
  'help.contact.phone',
  'home_delivery_enabled',
  'invoice_seller_address',
  'invoice_seller_gstin',
  'invoice_seller_legal_name',
  'invoice_seller_state_code',
  'low_stock_threshold_kg',
  'max_counter_rounds',
  'payout_dual_approval_threshold',
  'retail_gst_rate_percent',
  'serviceability.pickup_radius_km',
  'staff_attendance_max_range_days',
  'subscription_fee',
  'subscription_period_months',
  'transfer_high_value_threshold_paise',
  'wallet_transfer.enabled',
  'wallet_transfer.max_daily',
  'wallet_transfer.max_daily_count',
  'wallet_transfer.max_per_month',
  'wallet_transfer.max_per_txn',
  'wallet_transfer.min_amount',
  'warehouse_document_expiry_warning_days',
]);

function isEditableKey(row: SystemConfigRow): boolean {
  return !row.isSecret && EDITABLE_BUSINESS_KEYS.has(row.key);
}

function toResponse(row: SystemConfigRow): SystemConfigItemResponse {
  return {
    id: row.id,
    key: row.key,
    value: row.isSecret ? '******' : row.value,
    dataType: row.dataType,
    description: row.description,
    isEditable: isEditableKey(row),
    updatedAt: row.updatedAt === null ? null : row.updatedAt.toISOString(),
  };
}

function validateTypedValue(row: SystemConfigRow, value: unknown): void {
  switch (row.dataType) {
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new AppError('VALIDATION_FAILED', {
          detail: `Key "${row.key}" expects a non-negative number.`,
        });
      }
      if ((row.key.endsWith('_percent') || row.key.endsWith('_pct')) && value > 100) {
        throw new AppError('VALIDATION_FAILED', {
          detail: `Percentage key "${row.key}" must be between 0 and 100.`,
        });
      }
      if (
        (row.key.endsWith('_days') ||
          row.key.endsWith('_hours') ||
          row.key.endsWith('_minutes') ||
          row.key.endsWith('_months') ||
          row.key.endsWith('_rounds') ||
          row.key.endsWith('_count') ||
          row.key.endsWith('_limit')) &&
        !Number.isInteger(value)
      ) {
        throw new AppError('VALIDATION_FAILED', {
          detail: `Key "${row.key}" must be a whole integer.`,
        });
      }
      break;
    }
    case 'boolean': {
      if (typeof value !== 'boolean') {
        throw new AppError('VALIDATION_FAILED', {
          detail: `Key "${row.key}" expects a boolean.`,
        });
      }
      break;
    }
    case 'string': {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new AppError('VALIDATION_FAILED', {
          detail: `Key "${row.key}" expects a non-empty string.`,
        });
      }
      break;
    }
    case 'json': {
      if (value === null || typeof value !== 'object') {
        throw new AppError('VALIDATION_FAILED', {
          detail: `Key "${row.key}" expects a JSON object or array.`,
        });
      }
      break;
    }
  }
}

export const systemConfigService = {
  async list() {
    const rows = await systemConfigRepo.listAll(pool);
    return { items: rows.map(toResponse) };
  },

  async update(scope: ResolvedScope, key: string, body: UpdateSystemConfigBody): Promise<SystemConfigItemResponse> {
    return withTransaction(async (tx) => {
      const before = await systemConfigRepo.findByKeyForUpdate(tx, key);
      if (before === null) {
        throw new AppError('NOT_FOUND', { detail: `Unknown system_config key "${key}".` });
      }
      if (!isEditableKey(before)) {
        throw new AppError('FORBIDDEN', {
          detail: `System config key "${key}" is read-only infrastructure or locked setting.`,
        });
      }

      validateTypedValue(before, body.value);

      const updated = await systemConfigRepo.updateValue(tx, key, body.value, scope.userId);
      if (updated === null) {
        throw new AppError('NOT_FOUND', { detail: `Unknown system_config key "${key}".` });
      }

      const beforeOut = toResponse(before);
      const afterOut = toResponse(updated);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'system_config.update',
        entityType: 'system_config',
        entityId: updated.id,
        before: { key: beforeOut.key, value: beforeOut.value },
        after: { key: afterOut.key, value: afterOut.value, reason: body.reason ?? null },
        changedFields: changedFields({ value: beforeOut.value }, { value: afterOut.value }),
      });

      return afterOut;
    });
  },
};
