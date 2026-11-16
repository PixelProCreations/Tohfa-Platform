/**
 * Static option lists for the alert-threshold form (ComplianceTierThresholdsScreen).
 * `value` is what the form emits in AlertThresholdData and what the list screen
 * hands back when editing; `labelKey` is what the user reads.
 */
import type { ComponentType } from 'react';
import type { TranslationKey } from '../../i18n';
import {
  BuildingWarehouseIcon,
  CashBillIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  GearSettingsIcon,
  HistoryClockIcon,
  PackageBoxIcon,
  RepeatIcon,
  ShoppingCartIcon,
  UserAvatarIcon,
  type AdminIconProps,
} from '../../components/AdminIcons';

export interface CategoryOption {
  value: string;
  labelKey: TranslationKey;
  icon: ComponentType<AdminIconProps>;
}

export interface LabelledOption {
  value: string;
  labelKey: TranslationKey;
}

export const CATEGORY_OPTIONS: readonly CategoryOption[] = [
  { value: 'Stock', labelKey: 'saThresholds.category.stock', icon: PackageBoxIcon },
  { value: 'Warehouse Capacity', labelKey: 'saThresholds.category.warehouseCapacity', icon: BuildingWarehouseIcon },
  { value: 'Stock Aging', labelKey: 'saThresholds.category.stockAging', icon: HistoryClockIcon },
  { value: 'No Stock Update', labelKey: 'saThresholds.category.noStockUpdate', icon: RepeatIcon },
  { value: 'Product Quality', labelKey: 'saThresholds.category.productQuality', icon: CheckCircleIcon },
  { value: 'Farmer Operations', labelKey: 'saThresholds.category.farmerOperations', icon: UserAvatarIcon },
  { value: 'Customer Orders', labelKey: 'saThresholds.category.customerOrders', icon: ShoppingCartIcon },
  { value: 'Finance & Payments', labelKey: 'saThresholds.category.financePayments', icon: CashBillIcon },
  { value: 'Audit & Compliance', labelKey: 'saThresholds.category.auditCompliance', icon: ClipboardListIcon },
  { value: 'System & Integration', labelKey: 'saThresholds.category.systemIntegration', icon: GearSettingsIcon },
];

export const CONDITION_OPTIONS: readonly LabelledOption[] = [
  { value: 'Stock is less than or equal to', labelKey: 'saThresholds.condition.stockLte' },
  { value: 'Stock is greater than', labelKey: 'saThresholds.condition.stockGt' },
  { value: 'Capacity reaches above percentage', labelKey: 'saThresholds.condition.capacityAbove' },
  { value: 'Aging days exceed', labelKey: 'saThresholds.condition.agingExceed' },
  { value: 'Audit score is below', labelKey: 'saThresholds.condition.auditBelow' },
];

/** Numbers, not copy: they are not translated. */
export const VALUE_OPTIONS: readonly string[] = ['25', '50', '100', '200', '500', '1000'];

export const UNIT_OPTIONS: readonly LabelledOption[] = [
  { value: 'Kg', labelKey: 'saThresholds.unit.kg' },
  { value: 'Boxes', labelKey: 'saThresholds.unit.boxes' },
  { value: 'Liters', labelKey: 'saThresholds.unit.liters' },
  { value: 'Days', labelKey: 'saThresholds.unit.days' },
  { value: '%', labelKey: 'saThresholds.unit.percent' },
];

export const NOTIFY_ROLE_OPTIONS: readonly LabelledOption[] = [
  { value: 'TOHFA Admins', labelKey: 'saThresholds.role.tohfaAdmins' },
  { value: 'Warehouse Admins', labelKey: 'saThresholds.role.warehouseAdmins' },
  { value: 'Farmer Admins', labelKey: 'saThresholds.role.farmerAdmins' },
  { value: 'Customer', labelKey: 'saThresholds.role.customer' },
  { value: 'Farmer', labelKey: 'saThresholds.role.farmer' },
];

/** Max description length the form allows. */
export const DESCRIPTION_MAX = 250;

/** docs/rbac.json codes the threshold screens check. */
export const THRESHOLD_CODES = {
  alert: 'alert.threshold.configure',
  tier: 'audit.tier.configure_thresholds',
} as const;
