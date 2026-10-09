/**
 * Building blocks shared by the finance hub, revenue, voucher and expense
 * category screens (design module M11).
 *
 * The frame (orange header, scope pill / all-warehouses selector, cards, KPI
 * tiles, chips, notes, empty state) is the wallet area's WalletParts, already
 * on the admin theme; this file adds only what is finance-specific: the rbac
 * codes the finance screens check, the interim voucher gate, the quick-action
 * tile grid and a few icons.
 *
 * `can` only decides what is worth rendering; the server re-checks every code
 * and applies the warehouse scope (CLAUDE.md 2.1).
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { EmptyState, WalletScreen } from '../wallet-cashtopup/WalletParts';
import type { PermissionCheck, VoucherType, WarehouseScope } from './types';

/** docs/rbac.json codes the finance screens check (each one exists there). */
export const FINANCE_CODES = {
  /** Finance hub. MAIN_WH_ADMIN view, SUB_WH_ADMIN own (rbac 1.2.0). */
  dashboard: 'finance.dashboard.view',
  /** Revenue / sales income. MAIN all, SUB own. */
  salesIncome: 'finance.sales_income.view',
  /** Expense log (list + add). MAIN all, SUB own. No approve/edit/cancel code exists. */
  expenseLog: 'finance.expense.log',
  /** Finance reports. MAIN view (read-only), SUB own. */
  reportExport: 'report.export.file',
  /** Wallet cash top-up hub. MAIN all, SUB all. */
  cashTopUp: 'wallet.cash_topup.process',
  /** View Order from a revenue record. */
  orderList: 'order.list.view_all',
  /** View Invoice from a revenue record. */
  invoiceView: 'invoice.view_own',
} as const;

/**
 * Interim voucher gate. No rbac code covers vouchers (SPEC_GAPS, FINAL_LIST
 * #42/#43); until one exists a voucher is shown to whoever may see the data it
 * vouches for: an expense voucher with finance.expense.log, a revenue voucher
 * with finance.sales_income.view.
 */
export function canSeeVoucherType(can: PermissionCheck, type: VoucherType): boolean {
  return can(type === 'Expense' ? FINANCE_CODES.expenseLog : FINANCE_CODES.salesIncome);
}

/** Header label for the scope: the Sub warehouse's name, or 'All Warehouses' for Main. */
export function scopeLabel(scope: WarehouseScope): string {
  return scope.warehouseId === undefined ? 'All Warehouses' : (scope.warehouseName ?? scope.warehouseId);
}

/** '₹3,450' from whole rupees (mock display values only; never used to move money). */
export function rupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/** A screen the viewer's role does not include: header + explanation, nothing else. */
export function FinanceNotAvailable({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack: () => void;
}) {
  return (
    <WalletScreen title={title} onBack={onBack}>
      <EmptyState title={`${title} unavailable`} subtitle={message} />
    </WalletScreen>
  );
}

// ─── Quick-action tiles ──────────────────────────────────────────────────────

export interface FinanceAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

/** Grid of quick-action tiles; Sub used three columns, Main two (ported from its hub). */
export function ActionGrid({ actions, columns }: { actions: readonly FinanceAction[]; columns: 2 | 3 }) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.key}
          style={[styles.tile, columns === 2 ? styles.tileHalf : styles.tileThird]}
          onPress={action.onPress}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          {action.icon}
          <Text style={styles.tileLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/** Label / value row of a breakdown table; `divider` draws the rule above it. */
export function TableRow({
  label,
  value,
  total = false,
  divider = false,
}: {
  label: string;
  value: string;
  total?: boolean;
  divider?: boolean;
}) {
  return (
    <>
      {divider ? <View style={styles.tableDivider} /> : null}
      <View style={styles.tableRow}>
        <Text style={total ? styles.tableTotalLabel : styles.tableLabel}>{label}</Text>
        <Text style={total ? styles.tableTotalValue : styles.tableValue}>{value}</Text>
      </View>
    </>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
}

export function PlusCircleIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function TrendUpIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 7l-7 7-4-4-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 7h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ListDocIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 7h8M8 11h8M8 15h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function VoucherIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 9h10M7 13h10M7 17h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function DailyCashIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function LedgerIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 8h10M7 12h10M7 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function ReportFileIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GridIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function WalletIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7a2 2 0 0 1 2-2h13v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="7" width="18" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="16.5" cy="13.5" r="1.5" fill={color} />
    </Svg>
  );
}

export function TruckIcon({ size = 18, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="19" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="19" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function BellIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShieldIcon({ size = 16, color = adminColors.warning.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PadlockIcon({ size = 16, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 1 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="16" r="1.5" fill={color} />
    </Svg>
  );
}

export function FilterIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="4" cy="12" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="14" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  tile: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  tileThird: { width: '31.5%' },
  tileHalf: { width: '48.5%' },
  tileLabel: { ...adminType.caption, color: adminColors.ink, textAlign: 'center' },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm,
  },
  tableDivider: { height: 1, backgroundColor: adminColors.border },
  tableLabel: { ...adminType.body, color: adminColors.ink },
  tableValue: { ...adminType.rowTitle, color: adminColors.ink },
  tableTotalLabel: { ...adminType.rowTitle, color: adminColors.ink },
  tableTotalValue: { ...adminType.sectionHead, color: adminColors.brandDeep },
});
