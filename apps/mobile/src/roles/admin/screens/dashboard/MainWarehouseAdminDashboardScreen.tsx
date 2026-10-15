import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors, adminSpacing } from '../../theme';
import { fetchMe, hasSessionCredentials, type UserMe } from '../../../farmer/api/auth';
import {
  HOME_CODES,
  HomeFlow,
  MoreScreen,
  type AttentionFilter,
  type HomeTarget,
} from '../warehouse/dashboard-home-more';
import { EmptyState } from '../warehouse/wallet-cashtopup/WalletParts';
import { ProfileFlow } from '../warehouse/profile-settings';
import { warehouseIdForName as warehouseIdForOptionName } from '../warehouse/warehouse-admin/mappers';
import { CustomersFlow, type CustomersRouteParams } from '../warehouse/customers';
import { BillingFlow } from '../warehouse/billing-invoices';
import { WalletFlow, walletParamsForCustomer } from '../warehouse/wallet-cashtopup';
import { FinanceFlow } from '../warehouse/finance-expenses';
import { ReportsScreen } from '../warehouse/reports';
import { makeCan } from '../../permissions/can';
import { useWarehousePermissions } from '../../permissions/useWarehousePermissions';
import type { WarehouseScope } from '../warehouse/finance-expenses';
import { OrdersFlow } from '../warehouse/orders';
import { InventoryFlow } from '../warehouse/inventory';
import { ReturnsFlow, type ReturnsRouteParams, type ReturnsStackEntry } from '../warehouse/returns-rma';
import { SalesFlow, type SalesRoute, type SalesRouteParams } from '../warehouse/sales-direct';
import { StaffFlow, type StaffRouteParams } from '../warehouse/staff-attendance';
import { StorageFlow, type ActivityModule, type StorageRouteParams } from '../warehouse/storage-ops';
import { TransfersFlow, type TransferRoute } from '../warehouse/transfers';
import { WarehouseAdminFlow, type WarehouseAdminRoute } from '../warehouse/warehouse-admin';
import { ReceivingFlow, receivingRouteFor } from '../warehouse/receiving-qc';
import {
  NotificationsFlow,
  useUnreadNotificationCount,
  type NotificationsRoute,
} from '../warehouse/notifications';
import { t } from '../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';
import { useWarehouseOptions } from '../warehouse/shared/useWarehouseOptions';
import type { WarehouseOption } from '../../api/warehouseList';
import { useAllBatches, useLowStockAlerts, useLowStockRows, useStockSummary } from '../warehouse/inventory/useInventoryData';
import {
  consolidateStock,
  filterConsolidated,
  todayRange,
  toOverviewCard,
  toTrackedTransfer,
  warehouseLabel,
  warehouseStockRows,
  type OverviewCard,
} from '../warehouse/dashboard-home-more/mappers_dashboardHome';
import {
  useAttentionAlerts,
  useRecentTransfers,
  useTaskSummary,
  useTransferStatusCounts,
  useWarehouseCapacities,
} from '../warehouse/dashboard-home-more/useDashboardHomeData';
import { summarizeTaskCounts } from '../warehouse/dashboard-home-more/mappers_tasks';
import {
  activitySubLine,
  activityTimelineLine,
  capacityFigures,
  countLabel,
  gramsLabel,
  kpiWarehouseIds,
  mergeRecentActivity,
  moneyLabel,
  monthToDateRange,
  pendingTransferCount,
  performanceFigures,
  type RecentActivityRow,
} from '../warehouse/dashboard-home-more/mappers_dashboardKpis';
import {
  useDashboardSalesSummary,
  useOpenIssueCount,
  useRecentActivityPages,
  useWarehousesPerformance,
} from '../warehouse/dashboard-home-more/useDashboardKpis';

/**
 * Receiving tab entry keys. Every key except the transfer ones opens the
 * shared ReceivingFlow on the matching route (receivingRouteFor, W4); the
 * flow owns the stack from there.
 */
export type ReceivingSubView =
  | 'dashboard'
  | 'incoming_shipments'
  | 'search_filters'
  | 'shipment_detail'
  | 'start_receiving'
  | 'quantity_verification'
  | 'quality_check'
  | 'grade_product_verification'
  | 'damage_mismatch_report'
  | 'acceptance_decision'
  | 'partial_acceptance'
  | 'goods_receipt_summary'
  | 'batch_assignment'
  | 'storage_location_assignment'
  | 'receiving_history'
  | 'receiving_history_detail'
  | 'transfer_receiving'
  | 'transfer_receiving_inspection';

// ─── Design Tokens (Exact match to TOHFA Admin App Design System v1.0 PDF) ───
const PALETTE = {
  // Brand Palette (Page 1)
  primary: '#F0562A', // Orange - Primary actions, active states, icons
  headerBg: '#F0562A', // Brand Terracotta Orange
  headerBgDark: '#D9481E',
  headerPillBg: 'rgba(255, 255, 255, 0.22)',
  headerText: '#FFFFFF',

  orangeDeep: '#7A2E14', // Orange Deep - Section headings, emphasis text
  primarySoft: '#FDF3F0', // Orange Tint - Icon chips, role badges, active pills
  pageBg: '#F3EFE9', // Background - App canvas soft cream

  // Neutrals (Page 1)
  textInk: '#1A1A1A', // Ink - Primary text
  textSecondary: '#5F5E5A', // Muted - Secondary text
  textMuted: '#5F5E5A', // Muted text
  border: '#EEDCD3', // Border - Card and input borders
  borderLight: '#F8F3ED',
  cardBg: '#FFFFFF', // Card - Card surfaces
  primaryBorder: '#EEDCD3',

  // Semantic Colors (Page 2)
  amber: '#854F0B', // Warning (#854F0B)
  amberBg: '#FEF3E2', // Warning BG (#FEF3E2)
  green: '#173404', // Success (#173404)
  greenBg: '#EAF3DE', // Success BG (#EAF3DE)
  greenText: '#1E8E5A',

  red: '#E24B4A', // Danger (#E24B4A)
  redBg: '#FCEBEB', // Danger BG (#FCEBEB)
  redBorder: '#FCA5A5',

  tabInactive: '#5F5E5A',
  tabActive: '#F0562A',
  tabBorder: '#EEDCD3',
  goldProgress: '#B8860B',
  greenProgress: '#0D684D',
  trackBg: '#EBE5DC',
  divider: '#F2ECE5',
  goldBg: '#FEF9E7',
  greenPillBg: '#E6F7F2',
  brandBrown: '#5C3D2E',
  subTextMuted: '#8C827A',
};

export type MainWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

type WarehouseSubView =
  | 'overview'
  | 'warehouse_operations'
  | 'warehouse_overview'
  | 'warehouse_comparison'
  | 'warehouse_city_detail'
  | 'dashboard_operations'
  | 'todays_operations'
  | 'todays_operations_overview'
  | 'warehouse_performance'
  | 'manage_warehouses'
  | 'manage_swas'
  | 'storage_locations'
  | 'location_detail'
  | 'material_handling'
  | 'warehouse_capacity'
  | 'warehouse_activity'
  | 'operational_issues'
  | 'report_operational_issue'
  | 'staff_attendance'
  | 'operations_history'
  | 'incoming_goods_ops'
  | 'order_fulfilment_ops'
  | 'quality_issues_ops'
  | 'activity_timeline_ops'
  | 'stock_and_transfer'
  | 'consolidated_stock'
  | 'low_stock_surplus'
  | 'transfer_tracking'
  | 'alerts_action_center'
  | 'alert_detail'
  | 'quick_actions_overview'
  // Sales hub "Needs Attention" card (shared HomeFlow NeedsAttention, W4 dashboard part 2)
  | 'needs_attention'
  | 'stock_ledger'
  | 'verify_stock'
  | 'stock_adjustment_approval'
  | 'low_stock_alerts'
  | 'inter_warehouse_transfer'
  | 'initiate_new_transfer'
  | 'warehouse_settings'
  | 'sales'
  | 'direct_sale_new'
  | 'customer_orders'
  | 'warehouse_notifications'
  | 'profile'
  // Module 7: Customers (the shared CustomersFlow owns its own sub-screens, W4)
  | 'customers_list'
  // Module 9: Billing & Invoices (the shared BillingFlow owns its own sub-screens, W4)
  | 'billing_invoices';

// ─── SVG Icons (Matching D01 Screenshots) ───────────────────────────────────

function Grid4SquaresIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  // Lucide LayoutDashboard (exact match to design top-left greeting icon)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="9" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="14" y="3" width="7" height="5" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="14" y="12" width="7" height="9" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="16" width="7" height="5" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellOutlineIcon({ size = 20, color = '#1E1612' }: { size?: number; color?: string }) {
  // Lucide Bell (exact match to notification bell)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileHeaderIcon({ size = 19, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.9" />
      <Circle cx="12" cy="9.5" r="3" stroke={color} strokeWidth="1.9" />
      <Path
        d="M6.8 17.8c1.3-2.1 3.2-2.6 5.2-2.6s3.9.5 5.2 2.6"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BuildingWarehouseIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  // Lucide Building2 (exact match to warehouse filter building icon)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 6h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 10h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 18h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownWhiteIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m6 9 6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightGrayIcon({ size = 16, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 20, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function TruckIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function InboxReceiveIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13h4l2 3h4l2-3h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 7v5M9 9.5l3 3 3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TransferArrowsIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  // Heroicons arrows-right-left (exact match to design)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.5 7.5h13.5m0 0L16.5 3m4.5 4.5L16.5 12M16.5 16.5H3m0 0L7.5 12m-4.5 4.5L7.5 21"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HorizontalTransferIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 7h12m0 0l-3.5-3.5M20 7l-3.5 3.5M16 17H4m0 0l3.5 3.5M4 17l3.5-3.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StockBoxIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="5" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M5 9v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 13h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowLeftWhiteIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ScaleBalanceIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 21h10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 3v18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendingUpLineIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m22 7-8.5 8.5-5-5L2 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 7h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CapacityCircularIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12a9 9 0 1 1-6.219-8.56" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function GearCogIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
}

/**
 * Main sub-screen lists that read live data (each a component so its queries
 * run only while the sub-view is open). They replaced the OVERVIEW_WAREHOUSES,
 * CONSOLIDATED_PRODUCTS, LOW_STOCK_ITEMS and TRACKING_TRANSFERS literals.
 */

/** Consolidated stock per product across every warehouse: ACTIVE batches, available kg (GET /admin/batches). */
function MainConsolidatedStockList({ options, query }: { options: readonly WarehouseOption[]; query: string }) {
  const batches = useAllBatches(undefined);
  const products = useMemo(
    () => filterConsolidated(consolidateStock(batches.items, options), query),
    [batches.items, options, query],
  );
  const state = queryViewState({ isLoading: batches.isLoading, error: batches.error, itemCount: batches.items.length });
  if (state === 'loading') return <AdminLoadingState />;
  if (state === 'error') return <AdminErrorState error={batches.error} onRetry={batches.refresh} />;
  if (products.length === 0) return <AdminEmptyState title={t('dashboardHome.consolidated.empty')} />;
  return (
    <>
      {products.map((p) => (
        <View key={p.key} style={styles.consolidatedProductCard}>
          <Text style={styles.consolidatedProductTitle}>{p.label}</Text>
          {p.rows.map((row) => (
            <View key={row.warehouseId}>
              <View style={styles.stockTableRowDivider} />
              <View style={styles.stockTableRow}>
                <Text style={styles.stockTableLabel}>{row.name}</Text>
                <Text style={styles.stockTableVal}>{row.value}</Text>
              </View>
            </View>
          ))}
          <View style={styles.stockTableRowDivider} />
          <View style={styles.stockTableRow}>
            <Text style={styles.stockTableTotalLabel}>{t('dashboardHome.total')}</Text>
            <Text style={styles.stockTableTotalVal}>{p.total}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

/** The server's LOW_STOCK alerts of every warehouse (BR-77); the threshold is server config. */
function MainLowStockList({ options }: { options: readonly WarehouseOption[] }) {
  const low = useLowStockRows(undefined);
  const state = queryViewState({ isLoading: low.isLoading, error: low.error, itemCount: low.rows.length });
  if (state === 'loading') return <AdminLoadingState />;
  if (state === 'error') return <AdminErrorState error={low.error} onRetry={low.refresh} />;
  if (state === 'empty') return <AdminEmptyState title={t('dashboardHome.lowStock.empty')} />;
  return (
    <>
      {low.rows.map((item) => (
        <View key={item.id} style={styles.lowStockDetailCard}>
          <View style={styles.alertDetailGridRow}>
            <View style={styles.alertDetailGridCol}>
              <Text style={styles.alertDetailFieldLabel}>{t('dashboardHome.lowStock.product')}</Text>
              <Text style={styles.alertDetailFieldValue}>{item.name}</Text>
            </View>
            <View style={styles.alertDetailGridCol}>
              <Text style={styles.alertDetailFieldLabel}>{t('dashboardHome.lowStock.warehouse')}</Text>
              <Text style={styles.alertDetailFieldValue}>{warehouseLabel(options, item.warehouseId)}</Text>
            </View>
          </View>
          <View style={[styles.alertDetailGridRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.alertDetailGridCol}>
              <Text style={styles.alertDetailFieldLabel}>{t('dashboardHome.lowStock.current')}</Text>
              <Text style={styles.alertDetailFieldValue}>{item.available}</Text>
            </View>
            <View style={styles.alertDetailGridCol}>
              <Text style={styles.alertDetailFieldLabel}>{t('dashboardHome.lowStock.threshold')}</Text>
              <Text style={styles.alertDetailFieldValue}>{item.threshold}</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

/**
 * Inventory tab KPIs: available, allocated and LOW_STOCK figures from the live
 * batches / allocations / alerts walk (useStockSummary), plus today's received
 * kg from the Home performance read. Mounted only on the Inventory tab, so the
 * walk does not run while the admin is on Home. The old "Adjustments Awaiting
 * Approval" count had no read here and is shown as a link without a figure.
 */
function MainInventoryKpis({
  warehouseId,
  incomingToday,
  onOpenLedger,
  onOpenLowStock,
}: {
  warehouseId: string | undefined;
  incomingToday: string | null;
  onOpenLedger: () => void;
  onOpenLowStock: () => void;
}) {
  const stock = useStockSummary(warehouseId);
  const known = !stock.isLoading && !stock.error;
  return (
    <>
      {stock.error ? <AdminErrorState error={stock.error} onRetry={stock.refresh} /> : null}
      <View style={styles.kpiGrid}>
        <TouchableOpacity style={styles.kpiCard} onPress={onOpenLedger} activeOpacity={0.8}>
          <Text style={styles.kpiLabel}>{t('mainDashboard.inventory.available')}</Text>
          <Text style={styles.kpiValue}>{known ? gramsLabel(stock.summary.totalAvailableGrams) : gramsLabel(null)}</Text>
          <Text style={styles.kpiSub}>{t('mainDashboard.inventory.reservedSub', { qty: known ? gramsLabel(stock.summary.totalReservedGrams) : gramsLabel(null) })}</Text>
        </TouchableOpacity>

        {incomingToday !== null ? (
          <TouchableOpacity style={styles.kpiCard} onPress={onOpenLedger} activeOpacity={0.8}>
            <Text style={styles.kpiLabel}>{t('mainDashboard.inventory.incomingToday')}</Text>
            <Text style={styles.kpiValue}>{incomingToday}</Text>
            <Text style={styles.kpiSub}>{t('mainDashboard.inventory.incomingSub')}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.kpiCard} onPress={onOpenLedger} activeOpacity={0.8}>
          <Text style={styles.kpiLabel}>{t('mainDashboard.inventory.allocated')}</Text>
          <Text style={styles.kpiValue}>{gramsLabel(stock.allocatedGrams)}</Text>
          <Text style={styles.kpiSub}>{t('mainDashboard.inventory.allocatedSub')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kpiCard} onPress={onOpenLowStock} activeOpacity={0.8}>
          <Text style={styles.kpiLabel}>{t('mainDashboard.inventory.lowStock')}</Text>
          <Text style={styles.kpiValue}>{countLabel(stock.lowStockCount)}</Text>
          <Text style={styles.kpiSub}>{t('mainDashboard.inventory.lowStockSub')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

/** The LOW_STOCK alert count for a Pending Actions row (same query key as the KPI, so one read). */
function MainLowStockCount({ warehouseId }: { warehouseId: string | undefined }) {
  const alerts = useLowStockAlerts(warehouseId);
  const count = alerts.isLoading || alerts.error ? null : alerts.items.length;
  return <Text style={[styles.summaryItemValue, styles.summaryItemValueBrand]}>{countLabel(count)}</Text>;
}

/** The newest inter-warehouse transfers (GET /warehouse-transfers, first page). */
function MainTransferTrackingList({ options }: { options: readonly WarehouseOption[] }) {
  const transfers = useRecentTransfers(true);
  const items = transfers.data?.items ?? [];
  const state = queryViewState({ isLoading: transfers.isPending, error: transfers.error, itemCount: items.length });
  if (state === 'loading') return <AdminLoadingState />;
  if (state === 'error') return <AdminErrorState error={transfers.error} onRetry={() => void transfers.refetch()} />;
  if (state === 'empty') return <AdminEmptyState title={t('dashboardHome.transfer.empty')} />;
  const now = new Date();
  const rows = items.map((dto) => toTrackedTransfer(dto, options, now));
  return (
    <View style={styles.trackingCard}>
      {rows.map((row, idx) => {
        const isTransit = row.status === 'IN_TRANSIT';
        return (
          <View key={row.id}>
            <View style={styles.trackingItemRow}>
              <View style={styles.trackingIconWrap}>
                <TransferArrowsIcon size={18} color={PALETTE.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.trackingHeaderRow}>
                  <Text style={styles.trackingTitleText}>{t('dashboardHome.transfer.titleWithRoute', { number: row.title, route: row.route })}</Text>
                  <View style={[styles.trackingBadgePill, { backgroundColor: isTransit ? adminColors.info.bg : PALETTE.greenPillBg }]}>
                    <Text style={[styles.trackingBadgeText, { color: isTransit ? adminColors.info.text : PALETTE.greenProgress }]}>
                      {row.statusLabel}
                    </Text>
                  </View>
                </View>
                <Text style={styles.trackingSubText}>{row.when}</Text>
              </View>
            </View>
            {idx < rows.length - 1 && <View style={styles.stockTableRowDivider} />}
          </View>
        );
      })}
    </View>
  );
}

function TransferArrowsWhiteIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" stroke={PALETTE.headerText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = PALETTE.subTextMuted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Navigation Tab Icons ─────────────────────────────────────────────

function HomeTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21v-7h6v7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13h4l2 3h4l2-3h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 7v5M9 9.5l3 3 3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="5" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M5 9v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V9" stroke={color} strokeWidth="2" />
      <Path d="M10 13h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

/** The Main Warehouse admin sees every warehouse: no warehouseId (see finance-expenses/types.ts). */
/** External customer routes the Main shell draws inside CustomersFlow (New Sale leaves for the direct-sale flow). */
const MAIN_CUSTOMER_INLINE_ROUTES = ['CustomerWallet', 'CashTopUp', 'OrderDetail', 'RmaDetail'] as const;
const MAIN_WAREHOUSE_SCOPE: WarehouseScope = {};
/** StaffFlow entry params for the attendance overview (stable, so the flow does not restart). */
const ATTENDANCE_ALL_PARAMS: StaffRouteParams = { attendanceFilter: 'All' };
/** StorageFlow entry params for Main's Report Operational Issue sub-view (stable). */
const REPORT_OPERATIONAL_PARAMS: StorageRouteParams = { reportMode: 'operational' };
/** StorageFlow entry params for the activity log presets (stable). */
const ACTIVITY_TODAY_PARAMS: StorageRouteParams = { activityPreset: 'Today' };
const ACTIVITY_ALL_PARAMS: StorageRouteParams = { activityPreset: 'All' };
/** The return queue sits beneath a return opened from a customer issue. */
const ISSUE_RETURN_BACK_STACK: ReturnsStackEntry[] = [{ screen: 'ReturnsIssues' }];

/**
 * A customer issue's "View Return": a customer issue is a return request, so
 * its id is the return uuid and the flow reads that live return (plan phase
 * 10). The params are memoised because ReturnsFlow restarts its stack when
 * they change.
 */
function IssueReturnFlow({ can, returnId, onBack }: { can: (code: string) => boolean; returnId: string | undefined; onBack: () => void }) {
  const initialParams = useMemo<ReturnsRouteParams>(() => ({ returnId }), [returnId]);
  return (
    <ReturnsFlow
      scope={MAIN_WAREHOUSE_SCOPE}
      can={can}
      initialScreen="RmaDetail"
      initialParams={initialParams}
      initialBackStack={ISSUE_RETURN_BACK_STACK}
      onBack={onBack}
    />
  );
}

/**
 * Main sales sub-views -> shared SalesFlow entries (W4). The Main shell used to
 * render its own slices from DirectSaleScreens.tsx (deleted); it now opens the
 * same flow as the Sub shell with MAIN_WAREHOUSE_SCOPE (all four warehouses,
 * owner decision). Market Day / HORECA / B2B / History are reached from the
 * Sales hub inside the flow, so only the two entries the shell produces remain.
 */
const MAIN_SALES_ENTRY: Partial<Record<WarehouseSubView, { screen: SalesRoute; params?: SalesRouteParams }>> = {
  sales: { screen: 'Sales' },
  direct_sale_new: { screen: 'NewSale' },
};


/**
 * Old transfer sub-views -> shared TransfersFlow entry routes (W4). The detail
 * is only ever opened from the list, which now lives inside the flow.
 */
const TRANSFER_ENTRY: Partial<Record<WarehouseSubView, TransferRoute>> = {
  inter_warehouse_transfer: 'Transfers',
  initiate_new_transfer: 'InitiateNewTransfer',
};

/**
 * Old warehouse-admin sub-views -> WarehouseAdminFlow entry routes (W4).
 * ManageWarehousesScreen was absorbed into Warehouse Overview, so
 * 'manage_warehouses' opens the overview; 'manage_swas' is the Create SWA
 * quick action (it used to open the Sub roster key 'SubWarehouseStaff').
 */
const WAREHOUSE_ADMIN_ENTRY: Partial<Record<WarehouseSubView, WarehouseAdminRoute>> = {
  warehouse_city_detail: 'WarehouseCityDetail',
  manage_swas: 'ManageSubWarehouseAdmins',
};

/** Old Main inventory sub-views -> shared InventoryFlow route keys (design ids). */
const INVENTORY_ENTRY = {
  stock_ledger: 'M3S06',
  verify_stock: 'M3S11',
  stock_adjustment_approval: 'M3S17',
  low_stock_alerts: 'M3S09',
} as const;

/**
 * docs/rbac.json codes the live dashboard figures read (each exists there).
 * A figure whose code is missing is not fetched and not drawn; the server
 * authorises every read again (root CLAUDE.md 2.1).
 */
const MAIN_KPI_CODES = {
  /** GET /warehouses/{id}/performance (BR-80). MAIN all, SUB none. */
  performance: 'warehouse.all.view',
  /** GET /admin/sales/summary (BR-96). MAIN own (= all four), SUB own. */
  salesSummary: 'sales.dashboard.view',
  /** GET /warehouse-transfers totals. MAIN all, SUB own. */
  transfers: 'transfer.inter_warehouse.view',
  /** GET /warehouses/{id}/issues totals (BR-103). MAIN all, SUB own. */
  issues: 'warehouse.issue.view',
  /** GET /warehouses/{id}/activity (BR-104). MAIN all, SUB own. */
  activity: 'warehouse.activity.view',
  /** Batches, allocations and LOW_STOCK alerts (Inventory tab). MAIN all, SUB own. */
  stock: 'inventory.batch.view',
} as const;

/** Rows in Home's Recent Activity card: a list length, not a business limit. */
const RECENT_ACTIVITY_ROWS = 3;

/**
 * Main-only screens opened from the shared More menu. The old
 * MainWarehouseMoreScreen rendered these itself as local fallbacks; the shared
 * MoreScreen is role-neutral, so this shell supplies them via onNavigateTo*.
 */
type MainMoreSubScreen = 'wallet' | 'returns' | 'finance' | 'reports' | 'staff' | 'admin' | 'settings';

export interface MainWarehouseAdminDashboardScreenProps {
  onSignOut: () => void;
  /** Kept for hosts (App.tsx passes it); the shell no longer leaves to an App key (Create SWA is in-shell, W4). */
  onNavigate?: (screen: string) => void;
}

export function MainWarehouseAdminDashboardScreen({ onSignOut }: MainWarehouseAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<MainWHTab>('Home');
  const [receivingSubView, setReceivingSubView] = useState<ReceivingSubView>('dashboard');
  const [whSubView, setWhSubView] = useState<WarehouseSubView>('overview');
  const [moreSubScreen, setMoreSubScreen] = useState<MainMoreSubScreen | null>(null);
  const [whHistory, setWhHistory] = useState<WarehouseSubView[]>([]);
  /** The header filter: one warehouse uuid, or undefined for every warehouse. */
  const [filterWarehouseId, setFilterWarehouseId] = useState<string | undefined>(undefined);
  const [showFilterModal, setShowFilterModal] = useState(false);
  // Set from a tapped live row before any sub-view reads it; '' resolves to no warehouse.
  const [selectedWHName, setSelectedWHName] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  /** Filter the Sales hub's Needs Attention card opened the queue on. */
  const [attentionCategory, setAttentionCategory] = useState<AttentionFilter>('all');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [user, setUser] = useState<UserMe | null>(null);
  // Permissions come from GET /v1/auth/me, retried until it answers: the demo
  // sign-in opens this shell without waiting for its token, so a one-shot fetch
  // could leave every gate closed for the session. Until a list arrives makeCan
  // fails closed; in __DEV__ only, after the retries, the MAIN_WH_ADMIN grants
  // from docs/rbac.json stand in (../../permissions/warehousePermissions.ts).
  // The server still authorises every call (CLAUDE.md 2.1).
  const { permissions } = useWarehousePermissions({
    enabled: true,
    adminRole: 'MAIN_WH_ADMIN',
    isDev: __DEV__,
    loadSession: async () => {
      const me = await fetchMe();
      setUser(me);
      return { permissions: me.permissions ?? [], roles: me.roles ?? [] };
    },
    hasCredentials: hasSessionCredentials,
  });
  const can = useMemo(() => makeCan(permissions), [permissions]);
  const canAllView = can(HOME_CODES.allView);
  // The bell badge: the server's unread total; NotificationsFlow owns the list and the read writes.
  const unreadNotifCount = useUnreadNotificationCount();
  // Live warehouse cards (GET /warehouses + each warehouse's capacity) and the
  // first active alert (GET /admin/alerts); they replaced the literal blocks.
  const warehouseList = useWarehouseOptions({ enabled: canAllView });
  const warehouseCapacities = useWarehouseCapacities(
    warehouseList.options.map((o) => o.warehouseId),
    canAllView,
  );
  const overviewCards: OverviewCard[] = useMemo(
    () => warehouseList.options.map((o) => toOverviewCard(o, warehouseCapacities.data?.get(o.warehouseId))),
    [warehouseList.options, warehouseCapacities.data],
  );
  const overviewLoading = warehouseList.isLoading;
  const overviewError = warehouseList.error ?? warehouseCapacities.error;
  const retryOverview = () => {
    warehouseList.refresh();
    void warehouseCapacities.refetch();
  };
  const activeAlerts = useAttentionAlerts(MAIN_WAREHOUSE_SCOPE, 'active');
  const firstAlert = activeAlerts.items[0];

  // ─── Live KPI figures (Home grid, Today's Operations, Inventory tab, Performance, Capacity) ───
  // Each one comes from an existing endpoint and follows the header filter
  // (one warehouse, or all); an unloaded or ungranted figure shows the dash.
  const kpiIds = useMemo(
    () => kpiWarehouseIds(warehouseList.options, filterWarehouseId),
    [warehouseList.options, filterWarehouseId],
  );
  const today = todayRange(new Date());
  const monthToDate = monthToDateRange(new Date());
  const canPerformance = can(MAIN_KPI_CODES.performance);
  const canSalesSummary = can(MAIN_KPI_CODES.salesSummary);
  const canTransfers = can(MAIN_KPI_CODES.transfers);
  const canIssues = can(MAIN_KPI_CODES.issues);
  const canActivity = can(MAIN_KPI_CODES.activity);
  const canStock = can(MAIN_KPI_CODES.stock);
  const todayPerformance = useWarehousesPerformance(kpiIds, today, canPerformance);
  const todayFigures = performanceFigures(todayPerformance.data);
  const mtdPerformance = useWarehousesPerformance(
    kpiIds,
    monthToDate,
    canPerformance && whSubView === 'warehouse_performance',
  );
  const mtdFigures = performanceFigures(mtdPerformance.data);
  const todaySales = useDashboardSalesSummary(filterWarehouseId, today, canSalesSummary);
  const mtdSales = useDashboardSalesSummary(
    filterWarehouseId,
    monthToDate,
    canSalesSummary && whSubView === 'warehouse_performance',
  );
  const transferCounts = useTransferStatusCounts(filterWarehouseId, canTransfers);
  const openIssues = useOpenIssueCount(kpiIds, canIssues);
  const taskSummary = useTaskSummary({ warehouseId: filterWarehouseId });
  const qcPending = taskSummary.data === undefined ? null : summarizeTaskCounts(taskSummary.data).qcPending;
  const capacityTotals = capacityFigures(kpiIds, warehouseCapacities.data);
  const stockRows = useMemo(
    () =>
      warehouseStockRows(
        warehouseList.options.filter((o) => kpiIds.includes(o.warehouseId)),
        warehouseCapacities.data,
      ),
    [warehouseList.options, kpiIds, warehouseCapacities.data],
  );
  const recentActivityPages = useRecentActivityPages(kpiIds, RECENT_ACTIVITY_ROWS, canActivity);
  const recentActivity: RecentActivityRow[] = useMemo(
    () => mergeRecentActivity(recentActivityPages.pages, warehouseList.options, new Date(), RECENT_ACTIVITY_ROWS),
    [recentActivityPages.pages, warehouseList.options],
  );
  const filterLabel =
    filterWarehouseId === undefined ? t('mainDashboard.filter.all') : warehouseLabel(warehouseList.options, filterWarehouseId);
  // The overview passes display names; resolve them to the real uuid (never a fixture code).
  const warehouseIdForName = (name: string): string | undefined => warehouseIdForOptionName(warehouseList.options, name);

  const navigateWh = (view: WarehouseSubView) => {
    setWhHistory((prev) => [...prev, whSubView]);
    setWhSubView(view);
  };

  const goBackWh = () => {
    if (whHistory.length > 0) {
      setWhHistory((prev) => {
        const next = [...prev];
        const last = next.pop();
        if (last) setWhSubView(last);
        return next;
      });
    } else {
      setActiveTab('Home');
      setWhSubView('overview');
    }
  };

  const handleMoreTabChange = (tab: MainWHTab) => {
    setActiveTab(tab);
    setWhSubView('overview');
    setWhHistory([]);
    setMoreSubScreen(null);
  };

  // The old MainWarehouseMoreScreen kept its sub-screen in local state, so it
  // reset whenever the More tab unmounted. Keep that: leaving the tab closes it.
  useEffect(() => {
    if (activeTab !== 'More') setMoreSubScreen(null);
  }, [activeTab]);

  // The signed-in admin's own name (GET /auth/me), never a written-in one.
  const greeting =
    user?.fullName !== undefined && user.fullName !== null && user.fullName !== ''
      ? t('mainDashboard.greeting', { name: user.fullName })
      : t('mainDashboard.greetingNoName');

  /** Leave the sub-views for a tab (notification targets that live on a tab). */
  const openTab = (tab: MainWHTab, more?: MainMoreSubScreen) => {
    setActiveTab(tab);
    setWhSubView('overview');
    setWhHistory([]);
    if (tab === 'Receiving') setReceivingSubView('dashboard');
    if (more !== undefined) setMoreSubScreen(more);
  };

  // Shared notifications flow (W4): the bell opens the list, Home's alerts /
  // escalations open the approval / exception alerts. MAIN_WAREHOUSE_SCOPE =
  // all four warehouses; targets are opened only when their code passes.
  /** Modules outside storage-ops that own an activity record or a Today tile (StorageFlow onOpenModule). */
  const openMainModule = (module: ActivityModule) => {
    if (module === 'receiving') openTab('Receiving');
    else if (module === 'storage') navigateWh('storage_locations');
    else if (module === 'verification') navigateWh('verify_stock');
    else if (module === 'orders') navigateWh('order_fulfilment_ops');
    else if (module === 'qc') navigateWh('quality_issues_ops');
    else if (module === 'staff') navigateWh('staff_attendance');
    else if (module === 'cash') openTab('More', 'wallet');
  };
  /**
   * HomeFlow targets -> this shell's sub-views / tabs. Create SWA opens Manage
   * Sub Warehouse Admins (W4 warehouse-admin); the Quick Actions screen only
   * draws it with admin.sub_wh_admin.create (it used to be drawn inert).
   */
  const openHomeTarget = (target: HomeTarget) => {
    if (target === 'TransferList') navigateWh('inter_warehouse_transfer');
    else if (target === 'InitiateTransfer') navigateWh('initiate_new_transfer');
    else if (target === 'ReceivingDashboard') openTab('Receiving');
    else if (target === 'WarehouseOverview') navigateWh('warehouse_overview');
    else if (target === 'Inventory') openTab('Inventory');
    else if (target === 'LowStock' || target === 'Escalations') navigateWh('alerts_action_center');
    else if (target === 'CreateSwa') navigateWh('manage_swas');
    else if (target === 'Reports') navigateWh('dashboard_operations');
    else if (target === 'WarehouseTargets') navigateWh('warehouse_settings');
    else if (target === 'Orders' || target === 'OrderDetail' || target === 'Operations') {
      // Intentional no-op: only the single-warehouse Snapshot and the task queue
      // emit these, and this shell opens HomeFlow on Quick Actions / Stock &
      // Transfer only (neither navigates to them). Wire them here if that changes.
    }
  };
  /** Warehouse activity sub-views (shared storage-ops, W4 part B), all warehouses. */
  const renderActivityFlow = (params: StorageRouteParams) => (
    <StorageFlow
      scope={MAIN_WAREHOUSE_SCOPE}
      can={can}
      initialScreen="Activity"
      initialParams={params}
      onBack={goBackWh}
      onOpenModule={openMainModule}
    />
  );

  const renderNotificationsFlow = (initialScreen: NotificationsRoute) => (
    <NotificationsFlow
      scope={MAIN_WAREHOUSE_SCOPE}
      can={can}
      initialScreen={initialScreen}
      onBack={goBackWh}
      onOpenTarget={(target) => {
        if (target === 'ReviewReceiving' || target === 'Receiving') openTab('Receiving');
        else if (target === 'Stock') navigateWh('low_stock_alerts');
        else if (target === 'Orders') navigateWh('customer_orders');
        else if (target === 'Wallet') openTab('More', 'wallet');
        else openTab('More', 'returns');
      }}
      onOpenAlertRecord={(alert) => {
        if (alert.record === 'LowStock') navigateWh('low_stock_alerts');
        else if (alert.record === 'Transfer') navigateWh('inter_warehouse_transfer');
        else if (alert.record === 'GoodsReceipt') openTab('Receiving');
        else if (alert.record === 'ExpenseRecord') openTab('More', 'finance');
      }}
    />
  );

  const renderWarehouseOverviewScreen = () => {
    if (!canAllView) {
      return (
        <View style={styles.subScreenContainer}>
          <View style={styles.subHeaderBanner}>
            <View style={styles.subHeaderRow}>
              <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7}>
                <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.subHeaderTitle}>Warehouse Overview</Text>
            </View>
          </View>
          <EmptyState
            title="Multi-warehouse view not available"
            subtitle="The all-warehouses overview needs warehouse.all.view."
          />
        </View>
      );
    }

    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.subHeaderRow}>
            <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Warehouse Overview</Text>
          </View>
          <Text style={styles.subHeaderSubtitle}>All 4 warehouses at a glance</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          {/* Live cards: GET /warehouses + capacity. Receipts / issues per warehouse were fixture figures and are dropped. */}
          {overviewLoading ? (
            <AdminLoadingState />
          ) : overviewError ? (
            <AdminErrorState error={overviewError} onRetry={retryOverview} />
          ) : overviewCards.length === 0 ? (
            <AdminEmptyState title={t('dashboardHome.warehouses.empty')} />
          ) : (
            overviewCards.map((wh) => (
              <TouchableOpacity
                key={wh.warehouseId}
                style={styles.whOverviewCard}
                onPress={() => {
                  setSelectedWHName(wh.name);
                  navigateWh('warehouse_city_detail');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.whOverviewHeaderRow}>
                  <Text style={styles.whOverviewTitle}>{wh.name}</Text>
                  <View style={[styles.whCapacityPill, { backgroundColor: wh.overCapacity ? adminColors.warning.bg : adminColors.brandTint }]}>
                    <Text style={[styles.whCapacityPillText, { color: wh.overCapacity ? adminColors.warning.text : adminColors.brandDeep }]}>
                      {wh.capacityLabel}
                    </Text>
                  </View>
                </View>

                {wh.progressPercent !== null ? (
                  <View style={styles.whProgressBarTrack}>
                    <View
                      style={[
                        styles.whProgressBarFill,
                        { width: `${wh.progressPercent}%`, backgroundColor: wh.overCapacity ? adminColors.warning.text : PALETTE.primary },
                      ]}
                    />
                  </View>
                ) : null}

                <View style={styles.whOverviewStatsRow}>
                  <View style={styles.whOverviewStatCol}>
                    <Text style={styles.whOverviewStatLabel}>{t('dashboardHome.warehouses.stock')}</Text>
                    <Text style={styles.whOverviewStatVal}>{wh.stockLabel}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          <Text style={styles.overviewSectionHeading}>More Views</Text>

          <View style={styles.moreViewsGrid}>
            <TouchableOpacity
              style={styles.moreViewTile}
              onPress={() => navigateWh('warehouse_comparison')}
              activeOpacity={0.8}
            >
              <ScaleBalanceIcon size={24} color={PALETTE.primary} />
              <Text style={styles.moreViewTileLabel}>Comparison</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreViewTile}
              onPress={() => navigateWh('warehouse_performance')}
              activeOpacity={0.8}
            >
              <TrendingUpLineIcon size={24} color={PALETTE.primary} />
              <Text style={styles.moreViewTileLabel}>Performance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreViewTile}
              onPress={() => navigateWh('warehouse_capacity')}
              activeOpacity={0.8}
            >
              <CapacityCircularIcon size={24} color={PALETTE.primary} />
              <Text style={styles.moreViewTileLabel}>Capacity Summary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreViewTile}
              onPress={() => navigateWh('manage_warehouses')}
              activeOpacity={0.8}
            >
              <GearCogIcon size={24} color={PALETTE.primary} />
              <Text style={styles.moreViewTileLabel}>Manage Warehouses</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderWarehouseComparisonScreen = () => {
    if (!canAllView) {
      return (
        <View style={styles.subScreenContainer}>
          <View style={styles.subHeaderBanner}>
            <View style={styles.subHeaderRow}>
              <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7}>
                <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.subHeaderTitle}>Warehouse Comparison</Text>
            </View>
          </View>
          <EmptyState title="Not available" subtitle="Comparison requires warehouse.all.view." />
        </View>
      );
    }

    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.subHeaderRow}>
            <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Warehouse Comparison</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewSectionHeading}>Warehouse Comparison</Text>

          <View style={styles.comparisonCard}>
            {overviewLoading ? (
              <AdminLoadingState />
            ) : overviewError ? (
              <AdminErrorState error={overviewError} onRetry={retryOverview} />
            ) : (
              overviewCards.map((wh, idx) => (
                <React.Fragment key={wh.warehouseId}>
                  {idx > 0 && <View style={styles.rowDivider} />}
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonWhName}>{wh.name}</Text>
                    <Text style={styles.comparisonWhStat}>{wh.comparisonLabel}</Text>
                  </View>
                </React.Fragment>
              ))
            )}
          </View>

          <View style={styles.overviewNoticeBox}>
            <Text style={styles.overviewNoticeText}>
              Common units and the same time period across every row — this is a side-by-side comparison, not four separate summaries.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderWarehousePerformanceScreen = () => {
    if (!canAllView) {
      return (
        <View style={styles.subScreenContainer}>
          <View style={styles.subHeaderBanner}>
            <View style={styles.subHeaderRow}>
              <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7}>
                <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.subHeaderTitle}>Warehouse Performance</Text>
            </View>
          </View>
          <EmptyState title="Not available" subtitle="Performance requires warehouse.all.view." />
        </View>
      );
    }

    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.subHeaderRow}>
            <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Warehouse Performance</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewSectionHeading}>Warehouse Performance</Text>
          <Text style={styles.whOverviewStatLabel}>{t('mainDashboard.performance.range', { from: monthToDate.from, to: monthToDate.to, scope: filterLabel })}</Text>

          {/* Month-to-date exact counts (GET /warehouses/{id}/performance, summed) and paid sales
              (GET /admin/sales/summary). The old quality-issue and turnaround tiles had no source and are gone. */}
          {mtdPerformance.isPending ? (
            <AdminLoadingState />
          ) : mtdPerformance.error ? (
            <AdminErrorState error={mtdPerformance.error} onRetry={() => void mtdPerformance.refetch()} />
          ) : (
            <View style={styles.metricsGridCard}>
              <View style={styles.twoByTwoRow}>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.receipts')}</Text>
                  <Text style={styles.twoByTwoVal}>{mtdFigures.receipts}</Text>
                </View>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.received')}</Text>
                  <Text style={styles.twoByTwoVal}>{mtdFigures.receivedKg}</Text>
                </View>
              </View>
              <View style={[styles.twoByTwoRow, styles.twoByTwoRowSpaced]}>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.ordersPlaced')}</Text>
                  <Text style={styles.twoByTwoVal}>{mtdFigures.ordersPlaced}</Text>
                </View>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.ordersFulfilled')}</Text>
                  <Text style={styles.twoByTwoVal}>{mtdFigures.ordersFulfilled}</Text>
                </View>
              </View>
              <View style={[styles.twoByTwoRow, styles.twoByTwoRowSpaced]}>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.rejected')}</Text>
                  <Text style={styles.twoByTwoVal}>{mtdFigures.rejectedKg}</Text>
                </View>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.returns')}</Text>
                  <Text style={styles.twoByTwoVal}>{mtdFigures.returnsRequested}</Text>
                </View>
              </View>
              {canSalesSummary ? (
                <View style={[styles.twoByTwoRow, styles.twoByTwoRowSpaced]}>
                  <View style={styles.twoByTwoCol}>
                    <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.sales')}</Text>
                    <Text style={styles.twoByTwoVal}>{moneyLabel(mtdSales.data?.revenue)}</Text>
                  </View>
                  <View style={styles.twoByTwoCol}>
                    <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.salesCount')}</Text>
                    <Text style={styles.twoByTwoVal}>{countLabel(mtdSales.data?.count)}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.overviewNoticeBox}>
            <Text style={styles.overviewNoticeText}>
              Only metrics actually defined by the backend are shown — no invented performance figures.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderWarehouseCapacityScreen = () => {
    if (!canAllView) {
      return (
        <View style={styles.subScreenContainer}>
          <View style={styles.subHeaderBanner}>
            <View style={styles.subHeaderRow}>
              <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7}>
                <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.subHeaderTitle}>Capacity Summary</Text>
            </View>
          </View>
          <EmptyState title="Not available" subtitle="Capacity summary requires warehouse.all.view." />
        </View>
      );
    }

    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.subHeaderRow}>
            <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Capacity Summary</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewSectionHeading}>Warehouse Capacity Summary</Text>

          <Text style={styles.whOverviewStatLabel}>{filterLabel}</Text>

          {/* Summed GET /warehouses/{id}/capacity of the covered warehouses. The old
              storage-area count had no source on this read and is gone. */}
          {overviewLoading ? (
            <AdminLoadingState />
          ) : overviewError ? (
            <AdminErrorState error={overviewError} onRetry={retryOverview} />
          ) : (
            <View style={styles.metricsGridCard}>
              <View style={styles.twoByTwoRow}>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.capacity.used')}</Text>
                  <Text style={styles.twoByTwoVal}>{capacityTotals.used}</Text>
                </View>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.capacity.available')}</Text>
                  <Text style={styles.twoByTwoVal}>{capacityTotals.available}</Text>
                </View>
              </View>
              <View style={[styles.twoByTwoRow, styles.twoByTwoRowSpaced]}>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.capacity.utilization')}</Text>
                  <Text style={styles.twoByTwoVal}>{capacityTotals.utilization}</Text>
                </View>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.capacity.warehouses')}</Text>
                  <Text style={styles.twoByTwoVal}>{countLabel(kpiIds.length)}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.overviewNoticeBox}>
            <Text style={styles.overviewNoticeText}>
              Capacity exceptions (a warehouse nearing its configured limit) are flagged here for visibility only — not resolved from this screen.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderManageWarehousesScreen = () => {
    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.subHeaderRow}>
            <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Manage Warehouses</Text>
          </View>
          <Text style={styles.subHeaderSubtitle}>Configure and monitor warehouse hubs</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewSectionHeading}>Warehouse Hubs</Text>

          {overviewLoading ? <AdminLoadingState /> : null}
          {!overviewLoading && overviewError ? <AdminErrorState error={overviewError} onRetry={retryOverview} /> : null}
          {overviewCards.map((wh) => (
            <View key={wh.warehouseId} style={styles.whOverviewCard}>
              <View style={styles.whOverviewHeaderRow}>
                <Text style={styles.whOverviewTitle}>{wh.name}</Text>
                <View style={[styles.whCapacityPill, { backgroundColor: wh.isActive ? PALETTE.greenPillBg : adminColors.warning.bg }]}>
                  <Text style={[styles.whCapacityPillText, { color: wh.isActive ? PALETTE.greenProgress : adminColors.warning.text }]}>
                    {t(wh.isActive ? 'dashboardHome.snapshot.active' : 'dashboardHome.snapshot.inactive')}
                  </Text>
                </View>
              </View>

              <Text style={[styles.whOverviewStatLabel, { marginTop: 4 }]}>
                {wh.city === null ? wh.code : t('dashboardHome.warehouses.cityCode', { city: wh.city, code: wh.code })}
              </Text>

              <View style={styles.manageBtnRow}>
                <TouchableOpacity
                  style={styles.manageWhActionBtn}
                  onPress={() => {
                    setSelectedWHName(wh.name);
                    navigateWh('warehouse_city_detail');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.manageWhActionText}>View Details</Text>
                </TouchableOpacity>

                {can('warehouse.capacity.set') && (
                  <TouchableOpacity
                    style={[styles.manageWhActionBtn, styles.manageWhSecondaryBtn]}
                    onPress={() => navigateWh('warehouse_settings')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.manageWhActionText, { color: PALETTE.primary }]}>Capacity Limits</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {can('admin.sub_wh_admin.create') && (
            <View style={[styles.whOverviewCard, { marginTop: 4, borderColor: PALETTE.border }]}>
              <Text style={styles.whOverviewTitle}>Sub-Warehouse Admins</Text>
              <Text style={[styles.whOverviewStatLabel, { marginTop: 4 }]}>
                Manage role access, account status, and credentials for regional sub-warehouse admins.
              </Text>
              <TouchableOpacity
                style={[styles.manageWhActionBtn, { marginTop: 12, backgroundColor: PALETTE.primary }]}
                onPress={() => navigateWh('manage_swas')}
                activeOpacity={0.8}
              >
                <Text style={[styles.manageWhActionText, { color: '#FFFFFF' }]}>Manage SWA Accounts</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  };

  const renderConsolidatedStockScreen = () => {
    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.subHeaderRow}>
            <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ArrowLeftWhiteIcon size={22} color={PALETTE.headerText} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Consolidated Stock</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollWithFooter} showsVerticalScrollIndicator={false}>
          {/* Search Box */}
          <View style={styles.stockSearchBar}>
            <SearchIcon size={18} color={PALETTE.subTextMuted} />
            <TextInput
              style={styles.stockSearchInput}
              placeholder="Product, grade, batch..."
              placeholderTextColor={PALETTE.subTextMuted}
              value={stockSearchQuery}
              onChangeText={setStockSearchQuery}
            />
          </View>

          {/* Product cards: live batches of every warehouse (MainConsolidatedStockList). */}
          <MainConsolidatedStockList options={warehouseList.options} query={stockSearchQuery} />

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Pinned Bottom Button: drawn only with transfer.inter_warehouse.initiate (the server checks again). */}
        {can(HOME_CODES.transferInitiate) ? (
          <View style={styles.fixedBottomBar}>
            <TouchableOpacity
              style={styles.initiateTransferBtn}
              onPress={() => navigateWh('initiate_new_transfer')}
              activeOpacity={0.8}
            >
              <TransferArrowsWhiteIcon size={18} />
              <Text style={styles.initiateTransferBtnText}>Initiate Stock Transfer</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  const renderLowStockSurplusScreen = () => {
    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.subHeaderRow}>
            <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ArrowLeftWhiteIcon size={22} color={PALETTE.headerText} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Low Stock & Surplus</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollWithFooter} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewSectionHeading}>Low Stock & Surplus</Text>

          {/* The server's LOW_STOCK alerts; "surplus" has no endpoint and is not shown. */}
          <MainLowStockList options={warehouseList.options} />

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Pinned Bottom Button: drawn only with transfer.inter_warehouse.initiate (the server checks again). */}
        {can(HOME_CODES.transferInitiate) ? (
          <View style={styles.fixedBottomBar}>
            <TouchableOpacity
              style={styles.initiateTransferBtn}
              onPress={() => navigateWh('initiate_new_transfer')}
              activeOpacity={0.8}
            >
              <TransferArrowsWhiteIcon size={18} />
              <Text style={styles.initiateTransferBtnText}>Initiate Stock Transfer</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  const renderTransferTrackingScreen = () => {
    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.subHeaderRow}>
            <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ArrowLeftWhiteIcon size={22} color={PALETTE.headerText} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Transfer Tracking</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollWithFooter} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewSectionHeading}>Transfer Tracking</Text>

          <MainTransferTrackingList options={warehouseList.options} />

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Pinned Bottom Button: drawn only with transfer.inter_warehouse.initiate (the server checks again). */}
        {can(HOME_CODES.transferInitiate) ? (
          <View style={styles.fixedBottomBar}>
            <TouchableOpacity
              style={styles.initiateTransferBtn}
              onPress={() => navigateWh('initiate_new_transfer')}
              activeOpacity={0.8}
            >
              <TransferArrowsWhiteIcon size={18} />
              <Text style={styles.initiateTransferBtnText}>Initiate Stock Transfer</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      <View style={{ flex: 1 }}>
        {/* ─── Main Dashboard View (Module 1 - Main Dashboard) ─── */}
        {/* FINAL_LIST 20: the multi-warehouse Home needs warehouse.all.view (MAIN all, SUB none);
            without it (or until /auth/me resolves: makeCan fails closed) a note renders instead. */}
        {activeTab === 'Home' && whSubView === 'overview' && !canAllView && (
          <View style={styles.scroll}>
            <EmptyState
              title="Multi-warehouse view not available"
              subtitle="The Main Warehouse dashboard needs warehouse.all.view."
            />
          </View>
        )}
        {activeTab === 'Home' && whSubView === 'overview' && canAllView && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Orange Header Section */}
            <View style={styles.headerBanner}>
              {/* Top Greeting Row */}
              <View style={styles.headerTopRow}>
                <View style={styles.headerTitleWrap}>
                  <Grid4SquaresIcon size={20} color="#FFFFFF" />
                  <Text style={styles.headerGreetingText}>{greeting}</Text>
                </View>

                {/* Header Actions: Notification Bell + Profile Button */}
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => {
                      navigateWh('warehouse_notifications');
                    }}
                    activeOpacity={0.8}
                  >
                    <BellOutlineIcon size={19} color="#FFFFFF" />
                    {unreadNotifCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => {
                      navigateWh('profile');
                    }}
                    activeOpacity={0.8}
                  >
                    <ProfileHeaderIcon size={19} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Subtitle */}
              <Text style={styles.headerSubtitle}>Main Warehouse Admin · Today</Text>

              {/* Warehouse Dropdown Filter Pill */}
              <TouchableOpacity
                style={styles.whFilterPill}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.8}
              >
                <BuildingWarehouseIcon size={16} color={adminColors.onBrand} />
                <Text style={styles.whFilterPillText}>{filterLabel}</Text>
                <ChevronDownWhiteIcon size={13} color={adminColors.onBrand} />
              </TouchableOpacity>
            </View>

            {/* Content Container */}
            <View style={styles.contentBody}>
              {/* ─── 1. Today's Overview (KPI Grid) ─── */}
              {/* Live figures for the filtered warehouses; a tile whose read the admin
                  is not granted is not drawn, an unloaded one shows the dash. */}
              <Text style={styles.sectionHeading}>{t('mainDashboard.kpi.heading')}</Text>
              <View style={styles.kpiGrid}>
                {/* Total Stock: capacity usedKg (ACTIVE batches), summed */}
                <TouchableOpacity style={styles.kpiCard} onPress={() => navigateWh('warehouse_capacity')} activeOpacity={0.75}>
                  <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.totalStock')}</Text>
                  <Text style={styles.kpiValue}>{stockRows.total}</Text>
                  <Text style={styles.kpiSub}>{t('mainDashboard.kpi.totalStockSub')}</Text>
                </TouchableOpacity>

                {canPerformance ? (
                  <>
                    {/* Incoming Goods: today's goods-receipt gross kg */}
                    <TouchableOpacity style={styles.kpiCard} onPress={() => openTab('Receiving')} activeOpacity={0.75}>
                      <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.incoming')}</Text>
                      <Text style={styles.kpiValue}>{todayFigures.receivedKg}</Text>
                      <Text style={styles.kpiSub}>{t('mainDashboard.kpi.incomingSub', { count: todayFigures.receipts })}</Text>
                    </TouchableOpacity>

                    {/* Today's Orders: orders placed today */}
                    <TouchableOpacity style={styles.kpiCard} onPress={() => navigateWh('customer_orders')} activeOpacity={0.75}>
                      <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.orders')}</Text>
                      <Text style={styles.kpiValue}>{todayFigures.ordersPlaced}</Text>
                      <Text style={styles.kpiSub}>{t('mainDashboard.kpi.ordersSub')}</Text>
                    </TouchableOpacity>
                  </>
                ) : null}

                {/* Pending Transfers: awaiting approval + in transit */}
                {canTransfers ? (
                  <TouchableOpacity style={styles.kpiCard} onPress={() => navigateWh('inter_warehouse_transfer')} activeOpacity={0.75}>
                    <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.pendingTransfers')}</Text>
                    <Text style={styles.kpiValue}>{countLabel(pendingTransferCount(transferCounts.data))}</Text>
                    <Text style={styles.kpiSub}>{t('mainDashboard.kpi.pendingTransfersSub')}</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Sales: today's paid-and-completed revenue (BR-96) */}
                {canSalesSummary ? (
                  <TouchableOpacity
                    style={styles.kpiCard}
                    onPress={() => navigateWh('sales')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.sales')}</Text>
                    <Text style={styles.kpiValue}>{moneyLabel(todaySales.data?.revenue)}</Text>
                    <Text style={styles.kpiSub}>{t('mainDashboard.kpi.salesSub', { count: countLabel(todaySales.data?.count) })}</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Open Issues: OPEN + IN_PROGRESS operational issues */}
                {canIssues ? (
                  <TouchableOpacity style={styles.kpiCard} onPress={() => navigateWh('operational_issues')} activeOpacity={0.75}>
                    <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.openIssues')}</Text>
                    <Text style={styles.kpiValue}>{countLabel(openIssues.data)}</Text>
                    <Text style={styles.kpiSub}>{t('mainDashboard.kpi.openIssuesSub')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* ─── 2. Warehouse Overview ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Warehouse Overview</Text>
                <TouchableOpacity
                  onPress={() => {
                    navigateWh('warehouse_overview');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>

              {/* Live warehouse cards (GET /warehouses + capacity); they replaced two written-in cards. */}
              {overviewLoading ? (
                <AdminLoadingState />
              ) : overviewError ? (
                <AdminErrorState error={overviewError} onRetry={retryOverview} />
              ) : (
                overviewCards.map((wh) => (
                  <TouchableOpacity
                    key={wh.warehouseId}
                    style={styles.whProgressCard}
                    onPress={() => {
                      setSelectedWHName(wh.name);
                      navigateWh('warehouse_city_detail');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.whProgressTopRow}>
                      <Text style={styles.whProgressTitle}>{wh.name}</Text>
                      <ChevronRightGrayIcon size={16} />
                    </View>
                    {wh.progressPercent !== null ? (
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${wh.progressPercent}%`, backgroundColor: wh.overCapacity ? adminColors.warning.text : PALETTE.primary },
                          ]}
                        />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))
              )}

              {/* ─── 3. Today's Operations ─── */}
              <Text style={styles.sectionHeading}>Today's Operations</Text>
              <View style={styles.operationsCard}>
                {/* Incoming Goods */}
                <TouchableOpacity
                  style={styles.operationsSection}
                  onPress={() => {
                    setActiveTab('Receiving');
                    setReceivingSubView('dashboard');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.operationsTitle}>{t('mainDashboard.ops.incoming')}</Text>
                  {/* Today's goods receipts: count, accepted kg, rejected kg (performance, BR-80). */}
                  <View style={styles.operationsMetricsRow}>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.receipts')} <Text style={styles.operationsMetricBold}>{todayFigures.receipts}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.accepted')} <Text style={styles.operationsMetricBold}>{todayFigures.acceptedKg}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.rejected')} <Text style={styles.operationsMetricRed}>{todayFigures.rejectedKg}</Text>
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.operationsDivider} />

                {/* Order Fulfilment: today's placed / fulfilled / cancelled (performance, BR-80) */}
                <TouchableOpacity
                  style={styles.operationsSection}
                  onPress={() => navigateWh('customer_orders')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.operationsTitle}>{t('mainDashboard.ops.orders')}</Text>
                  <View style={styles.operationsMetricsRow}>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.placed')} <Text style={styles.operationsMetricBold}>{todayFigures.ordersPlaced}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.fulfilled')} <Text style={styles.operationsMetricBold}>{todayFigures.ordersFulfilled}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.cancelled')} <Text style={styles.operationsMetricRed}>{todayFigures.ordersCancelled}</Text>
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.operationsDivider} />

                {/* Quality: open QC tasks (GET /admin/tasks/summary) and today's return requests */}
                <TouchableOpacity
                  style={styles.operationsSection}
                  onPress={() => navigateWh('quality_issues_ops')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.operationsTitle}>{t('mainDashboard.ops.quality')}</Text>
                  <View style={styles.operationsMetricsRow}>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.qcPending')} <Text style={styles.operationsMetricBold}>{countLabel(qcPending)}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.returns')} <Text style={styles.operationsMetricRed}>{todayFigures.returnsRequested}</Text>
                    </Text>
                  </View>
                </TouchableOpacity>

                {canActivity ? (
                  <>
                    <View style={styles.operationsDivider} />

                    {/* Warehouse-wise Activity Timeline: the newest live event over the filtered warehouses */}
                    <TouchableOpacity
                      style={styles.operationsSection}
                      onPress={() => navigateWh('activity_timeline_ops')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.operationsTitle}>{t('mainDashboard.ops.timeline')}</Text>
                      <Text style={styles.operationsTimelineSub}>
                        {recentActivityPages.isPending ? t('async.loading') : activityTimelineLine(recentActivity[0])}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>

              {/* ─── 4. Alerts & Pending Actions ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Alerts & Pending Actions</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('alerts_action_center')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              {/* The first live alert (GET /admin/alerts, active); the list with dismiss / snooze is Needs Attention. */}
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => navigateWh('alerts_action_center')}
                activeOpacity={0.8}
              >
                <View style={styles.alertAccentBar} />
                <View style={styles.alertContentRow}>
                  <WarningTriangleIcon size={24} color={PALETTE.red} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.alertTitle}>
                      {firstAlert !== undefined
                        ? firstAlert.title
                        : activeAlerts.isLoading
                          ? t('async.loading')
                          : t('alerts.empty.active')}
                    </Text>
                    {firstAlert !== undefined ? (
                      <Text style={styles.alertSub}>
                        {t('dashboardHome.alerts.preview', {
                          message: firstAlert.message,
                          warehouse: warehouseLabel(warehouseList.options, firstAlert.warehouseId),
                        })}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>

              {/* ─── 5. Recent Activity ─── */}
              {/* The newest live events (GET /warehouses/{id}/activity, BR-104), merged over the filtered warehouses. */}
              {canActivity ? (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeading}>{t('mainDashboard.activity.heading')}</Text>
                    <TouchableOpacity
                      onPress={() => navigateWh('warehouse_activity')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllLink}>{t('mainDashboard.viewAll')}</Text>
                    </TouchableOpacity>
                  </View>
                  {recentActivityPages.isPending ? (
                    <AdminLoadingState />
                  ) : recentActivityPages.error ? (
                    <AdminErrorState error={recentActivityPages.error} onRetry={() => void recentActivityPages.refetch()} />
                  ) : recentActivity.length === 0 ? (
                    <AdminEmptyState title={t('mainDashboard.activity.none')} />
                  ) : (
                    <View style={styles.recentActivityCard}>
                      {recentActivity.map((row, index) => (
                        <React.Fragment key={row.key}>
                          {index > 0 ? <View style={styles.activityDivider} /> : null}
                          <TouchableOpacity
                            style={styles.activityItemRow}
                            onPress={() => {
                              if (row.type === 'TRANSFER') navigateWh('inter_warehouse_transfer');
                              else if (row.type === 'GOODS_RECEIPT') openTab('Receiving');
                              else navigateWh('warehouse_activity');
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.activityIconBox}>
                              {row.type === 'TRANSFER' ? (
                                <TruckIcon size={18} color={PALETTE.primary} />
                              ) : (
                                <InboxReceiveIcon size={18} color={PALETTE.primary} />
                              )}
                            </View>
                            <View style={styles.activityTextCol}>
                              <Text style={styles.activityTitle}>{t('mainDashboard.activity.title', { type: row.typeLabel, reference: row.reference })}</Text>
                              <Text style={styles.activitySub}>{activitySubLine(row)}</Text>
                            </View>
                            <Text style={styles.activityTime}>{row.when}</Text>
                          </TouchableOpacity>
                        </React.Fragment>
                      ))}
                    </View>
                  )}
                </>
              ) : null}

              {/* ─── 6. Quick Actions ─── */}
              <Text style={styles.sectionHeading}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                {/* 1. Stock Overview */}
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => {
                    navigateWh('stock_and_transfer');
                  }}
                  activeOpacity={0.8}
                >
                  <StockBoxIcon size={26} color={PALETTE.primary} />
                  <Text style={styles.quickActionLabel}>Stock Overview</Text>
                </TouchableOpacity>

                {/* 2. Manage Warehouses */}
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => {
                    navigateWh('manage_warehouses');
                  }}
                  activeOpacity={0.8}
                >
                  <BuildingWarehouseIcon size={26} color={PALETTE.primary} />
                  <Text style={styles.quickActionLabel}>Manage Warehouses</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 16 }} />
            </View>
          </ScrollView>
        )}


        {/* ─── Receiving Tab ─── */}
        {activeTab === 'Receiving' && (
          receivingSubView === 'transfer_receiving' || receivingSubView === 'transfer_receiving_inspection' ? (
            // Shared transfers flow (W4): arrivals for all warehouses; the
            // inspection step opens inside the flow for the tapped transfer
            // (Start Inspection / Complete need transfer.inter_warehouse.receive).
            <TransfersFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen="TransferReceiving"
              onBack={() => setReceivingSubView('dashboard')}
            />
          ) : (
            // Shared receiving flow (W4): dashboard, incoming shipments, search &
            // filters, shipment detail, the wizard, storage assignment, receiving
            // history (+ detail) and quality issues, all warehouses. Every old
            // sub-view key opens the matching route; the flow owns the stack.
            <ReceivingFlow
              key={receivingSubView}
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen={receivingRouteFor(receivingSubView).screen}
              initialParams={receivingRouteFor(receivingSubView).params}
              receiverName={user?.fullName}
              finishTo="History"
              onBack={() => {
                if (receivingSubView !== 'dashboard') {
                  setReceivingSubView('dashboard');
                } else {
                  setActiveTab('Home');
                  setWhSubView('overview');
                }
              }}
              onTabChange={handleMoreTabChange}
              onOpenTransferReceiving={() => setReceivingSubView('transfer_receiving')}
              onOpenOperationalIssues={() => {
                setActiveTab('Home');
                navigateWh('operational_issues');
              }}
              onOpenTimeline={() => {
                setActiveTab('Home');
                navigateWh('activity_timeline_ops');
              }}
            />
          )
        )}

        {/* ─── Inventory Tab (Image 1 Mockup · #F0562A) ─── */}
        {activeTab === 'Inventory' && whSubView === 'overview' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Banner */}
            <View style={styles.headerBanner}>
              {/* Header Title Row */}
              <View style={styles.headerTopRow}>
                <View style={styles.headerTitleWrap}>
                  <Grid4SquaresIcon size={20} color="#FFFFFF" />
                  <Text style={styles.headerGreetingText}>Inventory & Stock</Text>
                </View>
              </View>

              {/* Warehouse Dropdown Filter Pill */}
              <TouchableOpacity
                style={styles.whFilterPill}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.8}
              >
                <BuildingWarehouseIcon size={15} color={adminColors.onBrand} />
                <Text style={styles.whFilterPillText}>{filterLabel}</Text>
                <ChevronDownWhiteIcon size={13} color={adminColors.onBrand} />
              </TouchableOpacity>
            </View>

            {/* Content Container */}
            <View style={styles.contentBody}>
              {/* 1. KPI grid: live stock figures (inventory.batch.view) */}
              {canStock ? (
                <MainInventoryKpis
                  warehouseId={filterWarehouseId}
                  incomingToday={canPerformance ? todayFigures.receivedKg : null}
                  onOpenLedger={() => {
                    setSelectedWHName(filterWarehouseId === undefined ? '' : filterLabel);
                    navigateWh('stock_ledger');
                  }}
                  onOpenLowStock={() => navigateWh('low_stock_alerts')}
                />
              ) : null}

              {/* 2. Warehouse Summary: each warehouse's stock (capacity usedKg) */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>{t('mainDashboard.inventory.summary')}</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('stock_ledger')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>{t('mainDashboard.view')}</Text>
                </TouchableOpacity>
              </View>
              {overviewLoading ? (
                <AdminLoadingState />
              ) : overviewError ? (
                <AdminErrorState error={overviewError} onRetry={retryOverview} />
              ) : stockRows.rows.length === 0 ? (
                <AdminEmptyState title={t('dashboardHome.warehouses.empty')} />
              ) : (
                <View style={styles.summaryListCard}>
                  {stockRows.rows.map((row, index) => (
                    <React.Fragment key={row.warehouseId}>
                      {index > 0 ? <View style={styles.summaryDivider} /> : null}
                      <TouchableOpacity
                        style={styles.summaryItemRow}
                        onPress={() => {
                          setSelectedWHName(row.label);
                          navigateWh('stock_ledger');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.summaryItemName}>{row.label}</Text>
                        <Text style={styles.summaryItemValue}>{row.value}</Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              )}

              {/* 3. Inventory Activity */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Inventory Activity</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('stock_ledger')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View →</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.summaryListCard}
                onPress={() => navigateWh('stock_ledger')}
                activeOpacity={0.8}
              >
                <Text style={styles.inventoryActivityText}>
                  Receipt → Batch Created → Allocation → Reservation → Sale / Transfer / Adjustment
                </Text>
              </TouchableOpacity>

              {/* 4. Pending Actions */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Pending Actions</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('low_stock_alerts')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryListCard}>
                <TouchableOpacity
                  style={styles.summaryItemRow}
                  onPress={() => navigateWh('low_stock_alerts')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.summaryItemName}>Low Stock Alerts</Text>
                  {canStock ? <MainLowStockCount warehouseId={filterWarehouseId} /> : null}
                </TouchableOpacity>

                <View style={styles.summaryDivider} />

                {/* No count: the old "2" had no read behind it; the queue itself is live. */}
                <TouchableOpacity
                  style={styles.summaryItemRow}
                  onPress={() => navigateWh('stock_adjustment_approval')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.summaryItemName}>Adjustments Awaiting Approval</Text>
                  <ChevronRightGrayIcon size={16} />
                </TouchableOpacity>
              </View>

              {/* 5. Quick Actions. The Stock Verification tile was removed: it opened PhysicalCountScreen
                  with no batch, which then showed a sample batch and submitted nowhere real. */}
              <View style={styles.quickActionsDualRow}>
                <TouchableOpacity
                  style={styles.quickActionDualCard}
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                  activeOpacity={0.8}
                >
                  <HorizontalTransferIcon size={26} color={PALETTE.primary} />
                  <Text style={styles.quickActionDualLabel}>Inter-Warehouse Transfer</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </View>
          </ScrollView>
        )}

        {/* ─── More Tab ─── */}
        {activeTab === 'More' && whSubView === 'overview' && moreSubScreen !== null && (
          moreSubScreen === 'wallet' ? (
            <WalletFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              onBack={() => setMoreSubScreen(null)}
              onTabChange={handleMoreTabChange}
              onNavigateToNotifications={() => {
                setMoreSubScreen(null);
                navigateWh('warehouse_notifications');
              }}
            />
          ) : moreSubScreen === 'finance' ? (
            // Shared finance flow (W4); MAIN_WAREHOUSE_SCOPE shows all four warehouses.
            <FinanceFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              onBack={() => setMoreSubScreen(null)}
              onTabChange={handleMoreTabChange}
              onNavigateToNotifications={() => {
                setMoreSubScreen(null);
                navigateWh('warehouse_notifications');
              }}
              onOpenWallet={() => setMoreSubScreen('wallet')}
              onNavigateToCustomerOrders={() => {
                setMoreSubScreen(null);
                navigateWh('customer_orders');
              }}
              onNavigateToInvoiceList={() => {
                setMoreSubScreen(null);
                navigateWh('billing_invoices');
              }}
            />
          ) : moreSubScreen === 'reports' ? (
            // Shared reports hub (W4); MAIN_WAREHOUSE_SCOPE shows the All-warehouses selector.
            // MAIN holds report.export.file as `view` only, so Generate/Download stay off.
            <ReportsScreen
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              canExport={false}
              onBack={() => setMoreSubScreen(null)}
              onNavigateToNotifications={() => {
                setMoreSubScreen(null);
                navigateWh('warehouse_notifications');
              }}
            />
          ) : moreSubScreen === 'returns' ? (
            // Shared RMA flow (W4); MAIN_WAREHOUSE_SCOPE shows the all-warehouses selector.
            <ReturnsFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              onBack={() => setMoreSubScreen(null)}
              onTabChange={handleMoreTabChange}
            />
          ) : moreSubScreen === 'staff' ? (
            // Shared staff & attendance flow (W4, M14) replaces the nested
            // MainWarehouseStaff* / MainWarehouseAttendance screens. The roster needs
            // warehouse.staff.list_view (MAIN all); MAIN_WAREHOUSE_SCOPE shows the selector.
            <StaffFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen="Staff"
              onBack={() => setMoreSubScreen(null)}
              onTabChange={handleMoreTabChange}
            />
          ) : moreSubScreen === 'settings' ? (
            // Shared account hub (W4): Profile, Notification Settings, Security,
            // Change Password, Session & Security, Help & Support, About, Logout.
            <ProfileFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen="Settings"
              onBack={() => setMoreSubScreen(null)}
              onLogout={onSignOut}
              onTabChange={handleMoreTabChange}
            />
          ) : (
            // The old Warehouse Management hub (MainWarehouseAdminScreen) was absorbed into the
            // shared Warehouse Overview (W4 warehouse-admin); its Add Warehouse action was dropped (BR-23).
            <WarehouseAdminFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen="WarehouseOverview"
              onBack={() => setMoreSubScreen(null)}
              onNavigateComparison={() => {
                setMoreSubScreen(null);
                navigateWh('stock_and_transfer');
              }}
            />
          )
        )}
        {activeTab === 'More' && whSubView === 'overview' && moreSubScreen === null && (
          <MoreScreen
            scope={MAIN_WAREHOUSE_SCOPE}
            can={can}
            onBack={() => setActiveTab('Home')}
            onNavigateToDashboard={() => {
              setActiveTab('Home');
              setWhSubView('overview');
              setWhHistory([]);
            }}
            onLogout={onSignOut}
            onTabChange={handleMoreTabChange}
            // The admin hub lists every warehouse (FINAL_LIST: warehouse.all.view).
            onProfileCardPress={can('warehouse.all.view') ? () => setMoreSubScreen('admin') : undefined}
            onNavigateToWallet={() => setMoreSubScreen('wallet')}
            onNavigateToReturns={() => setMoreSubScreen('returns')}
            onNavigateToFinance={() => setMoreSubScreen('finance')}
            onNavigateToReports={() => setMoreSubScreen('reports')}
            onNavigateToStaff={() => setMoreSubScreen('staff')}
            onNavigateToOrders={() => navigateWh('customer_orders')}
            onNavigateToSales={() => navigateWh('sales')}
            onNavigateToCustomers={() => navigateWh('customers_list')}
            onNavigateToBilling={() => navigateWh('billing_invoices')}
            onNavigateToWarehouseOperations={() => navigateWh('warehouse_operations')}
            onNavigateToProfile={() => navigateWh('profile')}
            onNavigateToNotifications={() => navigateWh('warehouse_notifications')}
            // The More row is the account hub ("Manage account and application settings",
            // FINAL_LIST #84); warehouse settings stay reachable from Warehouse Overview.
            onNavigateToSettings={() => setMoreSubScreen('settings')}
          />
        )}

        {/* ─── Sub Views for Interactive Navigation (shared across all tabs) ─── */}
        {whSubView !== 'overview' && (
          whSubView === 'profile' ? (
            // The admin's own profile is the shared UserProfileScreen (W4, absorbs
            // MainWarehouseProfileScreen); Main sees the all-warehouses account.
            <ProfileFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen="UserProfile"
              onBack={goBackWh}
              onLogout={onSignOut}
              onTabChange={handleMoreTabChange}
            />
          ) : whSubView === 'dashboard_operations' ||
            whSubView === 'todays_operations' ||
            whSubView === 'todays_operations_overview' ? (
              // Today's Operations (Monitoring + Overview, M4-S02 / M1-S02) folded into the
              // shared Warehouse Activity as its Today preset: the six-tile strip and the
              // monitoring card show for the all-warehouses scope.
              renderActivityFlow(ACTIVITY_TODAY_PARAMS)
            ) : whSubView === 'warehouse_operations' ? (
              // Shared storage-ops hub (W4, M4-S01): all warehouses with the shared
              // selector (replaces the shell's filter modal here); per-warehouse cards,
              // Open Issues / Operations History tiles need warehouse.all.view. Materials,
              // capacity, issues and activity open inside the flow.
              <StorageFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="Operations"
                onBack={goBackWh}
                onOpenModule={openMainModule}
                onOpenNotifications={() => navigateWh('warehouse_notifications')}
                onOpenWarehouseOverview={() => navigateWh('warehouse_overview')}
                onSelectWarehouse={(whName) => {
                  setSelectedWHName(whName);
                  navigateWh('warehouse_city_detail');
                }}
                onManageCapacity={() => navigateWh('warehouse_settings')}
              />
            ) : whSubView === 'warehouse_overview' ? (
              renderWarehouseOverviewScreen()
            ) : whSubView === 'warehouse_comparison' ? (
              renderWarehouseComparisonScreen()
            ) : whSubView === 'manage_warehouses' ? (
              renderManageWarehousesScreen()
            ) : WAREHOUSE_ADMIN_ENTRY[whSubView] !== undefined ? (
              // Main warehouse-admin flow (W4): City Detail -> Settings / Capacity / Documents;
              // Manage SWAs. Guarded on warehouse.all.view / admin.sub_wh_admin.create.
              <WarehouseAdminFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen={WAREHOUSE_ADMIN_ENTRY[whSubView]}
                initialParams={whSubView === 'warehouse_city_detail' ? { warehouseId: warehouseIdForName(selectedWHName) } : undefined}
                onBack={goBackWh}
                onNavigateComparison={() => navigateWh('warehouse_comparison')}
                onViewOperationsHistory={() => navigateWh('operations_history')}
                onViewStaffAttendance={() => navigateWh('staff_attendance')}
              />
            ) : whSubView === 'warehouse_notifications' ? (
              renderNotificationsFlow('Notifications')
            ) : whSubView === 'storage_locations' ? (
              // StorageLocationsScreen was absorbed into the shared StorageInfoScreen
              // (W4 part B): Main sees all four warehouses plus the storage hierarchy.
              <ProfileFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="StorageInfo"
                onBack={() => navigateWh('warehouse_operations')}
                onSelectStorageLocation={(locId) => {
                  setSelectedLocationId(locId);
                  navigateWh('location_detail');
                }}
              />
            ) : whSubView === 'location_detail' ? (
              // Shared storage-ops location detail (W4, M4-S04); Main's Location Information
              // card and occupancy bar were ported. View Stock needs inventory.batch.view.
              <StorageFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="StorageLocationDetail"
                initialParams={{ locationId: selectedLocationId }}
                onBack={() => navigateWh('storage_locations')}
                onViewStock={() => {
                  setActiveTab('Inventory');
                  setWhSubView('overview');
                }}
              />
            ) : whSubView === 'material_handling' ? (
              // Shared storage-ops flow (W4, M4 part A): Main's Receive / Issue / History
              // actions were ported into the shared screens (inventory.material_handling.manage).
              <StorageFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="MaterialHandling"
                onBack={() => navigateWh('warehouse_operations')}
                onViewActivity={() => navigateWh('warehouse_activity')}
              />
            ) : whSubView === 'warehouse_capacity' ? (
              renderWarehouseCapacityScreen()
            ) : whSubView === 'warehouse_activity' || whSubView === 'operations_history' || whSubView === 'activity_timeline_ops' ? (
              // Warehouse Activity, Operations History and Activity Timeline (M4-S08) are the
              // shared activity log (All preset): search, warehouse selector, rows with
              // warehouse + operator, detail, and CSV export with report.export.file.
              renderActivityFlow(ACTIVITY_ALL_PARAMS)
            ) : whSubView === 'operational_issues' || whSubView === 'report_operational_issue' ? (
              // Shared storage-ops issues (W4, M4-S09 / M4-S09R): Main sees every
              // warehouse's issues with the selector and opens their detail. The
              // report form (operational mode, with Main's warehouse / rack /
              // severity fields) needs support.ticket.create_own, which MAIN does
              // not hold today, so the Report button is replaced by a note.
              <StorageFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen={whSubView === 'report_operational_issue' ? 'ReportIssue' : 'OperationalIssues'}
                initialParams={whSubView === 'report_operational_issue' ? REPORT_OPERATIONAL_PARAMS : undefined}
                onBack={() => navigateWh('warehouse_operations')}
              />
            ) : whSubView === 'staff_attendance' ? (
              // The dropped Staff & Attendance hub was Main's only attendance entry
              // (Manage SWAs card, operations hub); it opens the shared Attendance
              // overview now (W4, M14). Attendance has no rbac code (ungated).
              <StaffFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="Attendance"
                initialParams={ATTENDANCE_ALL_PARAMS}
                onBack={goBackWh}
              />
            ) : whSubView === 'needs_attention' ? (
              // Sales hub Needs Attention (W4s-4): the shared queue, all four warehouses.
              <HomeFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="NeedsAttention"
                initialParams={{ category: attentionCategory }}
                onBack={goBackWh}
              />
            ) : whSubView === 'stock_and_transfer' ? (
              // Shared live Stock & Transfer overview (capacity per warehouse, LOW_STOCK alerts,
              // transfer totals); its "View All" links open this shell's live sub-views.
              <HomeFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="StockAndTransfer"
                onBack={goBackWh}
                onOpenTarget={(target) => {
                  if (target === 'WarehouseOverview') navigateWh('consolidated_stock');
                  else if (target === 'LowStock') navigateWh('low_stock_surplus');
                  else if (target === 'TransferList') navigateWh('transfer_tracking');
                  else openHomeTarget(target);
                }}
              />
            ) : whSubView === 'consolidated_stock' ? (
              renderConsolidatedStockScreen()
            ) : whSubView === 'low_stock_surplus' ? (
              renderLowStockSurplusScreen()
            ) : whSubView === 'transfer_tracking' ? (
              renderTransferTrackingScreen()
            ) : whSubView === 'quick_actions_overview' ? (
              <HomeFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="QuickActions"
                onBack={goBackWh}
                onOpenTarget={openHomeTarget}
              />
            ) : whSubView === 'alerts_action_center' || whSubView === 'alert_detail' ? (
              // Live alerts with dismiss / snooze (GET /admin/alerts), all warehouses in scope.
              <HomeFlow scope={MAIN_WAREHOUSE_SCOPE} can={can} initialScreen="NeedsAttention" onBack={goBackWh} />
            ) : whSubView === 'stock_ledger' ||
              whSubView === 'verify_stock' ||
              whSubView === 'stock_adjustment_approval' ||
              whSubView === 'low_stock_alerts' ? (
              // The four Main-only inventory screens were folded into the shared
              // inventory area (W4); each old sub-view opens the flow on its survivor.
              <InventoryFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen={INVENTORY_ENTRY[whSubView]}
                initialParams={whSubView === 'stock_ledger' ? { warehouseName: selectedWHName } : null}
                onBack={goBackWh}
                onInitiateTransfer={() => navigateWh('inter_warehouse_transfer')}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setWhSubView('overview');
                  setWhHistory([]);
                }}
              />
            ) : TRANSFER_ENTRY[whSubView] !== undefined ? (
              // Shared transfers flow (W4): list -> detail -> receiving -> inspection,
              // list -> initiate. The flow owns the (mock) transfer list; Initiate
              // and Cancel need transfer.inter_warehouse.initiate (MAIN all).
              <TransfersFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen={TRANSFER_ENTRY[whSubView]}
                onBack={goBackWh}
              />
            ) : whSubView === 'warehouse_settings' ? (
              // Shared profile-settings WarehouseSettingsScreen (W4 part B), route-guarded
              // on warehouse.capacity.set; opens on the warehouse the overview showed.
              <ProfileFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="WarehouseSettings"
                initialWarehouseId={warehouseIdForName(selectedWHName)}
                onBack={goBackWh}
              />
            ) : whSubView === 'warehouse_performance' ? (
              renderWarehousePerformanceScreen()
            ) : whSubView === 'incoming_goods_ops' ? (
              // Incoming Goods was the receiving summary again: it is the shared
              // receiving dashboard now (W4), opened from the operations hub.
              <ReceivingFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="Dashboard"
                receiverName={user?.fullName}
                finishTo="History"
                onBack={goBackWh}
                onOpenTransferReceiving={() => {
                  setActiveTab('Receiving');
                  setReceivingSubView('transfer_receiving');
                }}
                onOpenOperationalIssues={() => navigateWh('operational_issues')}
                onOpenTimeline={() => navigateWh('activity_timeline_ops')}
              />
            ) : whSubView === 'order_fulfilment_ops' ? (
              <OrdersFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                onBack={goBackWh}
                onViewIssue={() => navigateWh('operational_issues')}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setWhSubView('overview');
                  setWhHistory([]);
                }}
              />
            ) : whSubView === 'quality_issues_ops' ? (
              // Shared receiving Quality Issues (W4, read-only list); issues open the
              // wizard step / shipment inside the flow, damage reports Operational Issues.
              <ReceivingFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="QualityIssues"
                receiverName={user?.fullName}
                finishTo="History"
                onBack={goBackWh}
                onOpenOperationalIssues={() => navigateWh('operational_issues')}
                onOpenTimeline={() => navigateWh('activity_timeline_ops')}
              />
            ) : whSubView === 'customers_list' ? (
              // Shared customer flow (W4); MAIN_WAREHOUSE_SCOPE lists every warehouse's
              // customers with the all-warehouses selector. Wallet, cash top-up (the
              // wallet operations hub), order detail and RMA open inside the flow;
              // New Sale goes to the Main direct-sale flow.
              <CustomersFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                onBack={goBackWh}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setWhSubView('overview');
                  setWhHistory([]);
                }}
                onNavigateToNotifications={() => navigateWh('warehouse_notifications')}
                inlineExternalRoutes={MAIN_CUSTOMER_INLINE_ROUTES}
                onOpenExternal={(target) => {
                  if (target === 'NewSale') navigateWh('direct_sale_new');
                }}
                renderExternalScreen={(target, p: CustomersRouteParams, nav) => {
                  if (target === 'CustomerWallet' || target === 'CashTopUp') {
                    // The shared wallet flow opened on this customer's wallet or
                    // cash top-up (prefilled; resolves SPEC_GAPS W4h-7 for top-ups).
                    return (
                      <WalletFlow
                        scope={MAIN_WAREHOUSE_SCOPE}
                        can={can}
                        initialScreen={target}
                        initialParams={walletParamsForCustomer(p.customer)}
                        onBack={nav.back}
                      />
                    );
                  }
                  if (target === 'OrderDetail') {
                    return (
                      <OrdersFlow
                        scope={MAIN_WAREHOUSE_SCOPE}
                        can={can}
                        initialScreen="M5S04"
                        initialParams={{ orderId: p.orderId, customerName: p.customer?.name }}
                        onBack={nav.back}
                        onViewIssue={() => navigateWh('operational_issues')}
                      />
                    );
                  }
                  if (target === 'RmaDetail') {
                    return <IssueReturnFlow can={can} returnId={p.issue?.id} onBack={nav.back} />;
                  }
                  return null;
                }}
              />
            ) : whSubView === 'customer_orders' ? (
              <OrdersFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                onBack={goBackWh}
                onViewIssue={() => navigateWh('operational_issues')}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setWhSubView('overview');
                  setWhHistory([]);
                }}
              />
            ) : whSubView === 'billing_invoices' ? (
              // Shared billing flow (W4); MAIN_WAREHOUSE_SCOPE shows the all-warehouses selector.
              <BillingFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                onBack={goBackWh}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setWhSubView('overview');
                  setWhHistory([]);
                }}
              />
            ) : MAIN_SALES_ENTRY[whSubView] !== undefined ? (
              // Shared direct sales flow (warehouse/sales-direct), all warehouses.
              <SalesFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen={MAIN_SALES_ENTRY[whSubView]?.screen}
                initialParams={MAIN_SALES_ENTRY[whSubView]?.params}
                onBack={goBackWh}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setWhSubView('overview');
                  setWhHistory([]);
                }}
                onNavigateToNotifications={() => navigateWh('warehouse_notifications')}
                onNavigateToNeedsAttention={(category) => {
                  setAttentionCategory(category ?? 'all');
                  navigateWh('needs_attention');
                }}
              />
            ) : null
          )}
      </View>

      {/* ─── Bottom Navigation Tab Bar (Home, Receiving, Inventory, More) ─── */}
      {/* Receiving draws its own tab bar (ReceivingFlow dashboard); transfers have none. */}
      {((activeTab === 'Home' &&
          (whSubView === 'overview' ||
            whSubView === 'warehouse_operations' ||
            whSubView === 'warehouse_overview' ||
            whSubView === 'warehouse_city_detail' ||
            whSubView === 'dashboard_operations' ||
            whSubView === 'todays_operations' ||
            whSubView === 'todays_operations_overview' ||
            whSubView === 'storage_locations' ||
            whSubView === 'material_handling' ||
            whSubView === 'warehouse_capacity' ||
            whSubView === 'warehouse_activity' ||
            whSubView === 'operational_issues' ||
            whSubView === 'report_operational_issue' ||
            whSubView === 'staff_attendance' ||
            whSubView === 'operations_history' ||
            whSubView === 'incoming_goods_ops' ||
            whSubView === 'order_fulfilment_ops' ||
            whSubView === 'quality_issues_ops' ||
            whSubView === 'activity_timeline_ops' ||
            whSubView === 'warehouse_performance' ||
            whSubView === 'manage_warehouses' ||
            whSubView === 'warehouse_settings' ||
            whSubView === 'alerts_action_center' ||
            whSubView === 'alert_detail' ||
            whSubView === 'stock_and_transfer' ||
            whSubView === 'consolidated_stock' ||
            whSubView === 'low_stock_surplus' ||
            whSubView === 'transfer_tracking' ||
            whSubView === 'quick_actions_overview' ||
            whSubView === 'sales')) ||
        (activeTab === 'More' && (whSubView !== 'overview' || moreSubScreen === 'returns')) ||
        (activeTab === 'Inventory')) && (
          <View style={styles.bottomTabBar}>
            {/* Home */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                setActiveTab('Home');
                setWhSubView('overview');
                setWhHistory([]);
                setMoreSubScreen(null);
              }}
              accessibilityRole="tab"
              activeOpacity={0.7}
            >
              <HomeTabNavIcon active={activeTab === 'Home'} />
              <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
            </TouchableOpacity>

            {/* Receiving */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                setActiveTab('Receiving');
                setReceivingSubView('dashboard');
                setWhSubView('overview');
                setWhHistory([]);
                setMoreSubScreen(null);
              }}
              accessibilityRole="tab"
              activeOpacity={0.7}
            >
              <ReceivingTabNavIcon active={false} />
              <Text style={styles.tabLabel}>Receiving</Text>
            </TouchableOpacity>

            {/* Inventory */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                setActiveTab('Inventory');
                setWhSubView('overview');
                setWhHistory([]);
                setMoreSubScreen(null);
              }}
              accessibilityRole="tab"
              activeOpacity={0.7}
            >
              <InventoryTabNavIcon active={activeTab === 'Inventory'} />
              <Text style={[styles.tabLabel, activeTab === 'Inventory' && styles.tabLabelActive]}>Inventory</Text>
            </TouchableOpacity>

            {/* More */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                setActiveTab('More');
                setWhSubView('overview');
                setWhHistory([]);
                setMoreSubScreen(null);
              }}
              accessibilityRole="tab"
              activeOpacity={0.7}
            >
              <MoreTabNavIcon active={activeTab === 'More'} />
              <Text style={[styles.tabLabel, activeTab === 'More' && styles.tabLabelActive]}>More</Text>
            </TouchableOpacity>
          </View>
        )}

      {/* ─── Warehouse Filter Dropdown Modal ─── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <View style={styles.filterModalCard}>
            <Text style={styles.filterModalTitle}>{t('mainDashboard.filter.title')}</Text>
            {/* The live warehouse list (GET /warehouses); the pick narrows every KPI read. */}
            {[
              { warehouseId: undefined as string | undefined, label: t('mainDashboard.filter.all') },
              ...warehouseList.options.map((o) => ({ warehouseId: o.warehouseId as string | undefined, label: o.warehouseName })),
            ].map((option) => {
              const isSelected = filterWarehouseId === option.warehouseId;
              return (
                <TouchableOpacity
                  key={option.warehouseId ?? 'all'}
                  style={[styles.filterOptionRow, isSelected && styles.filterOptionRowActive]}
                  onPress={() => {
                    setFilterWarehouseId(option.warehouseId);
                    if (option.warehouseId !== undefined) {
                      setSelectedWHName(option.label);
                    }
                    setShowFilterModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                    {option.label}
                  </Text>
                  {isSelected && <Text style={styles.filterCheckmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingBottom: 24,
  },

  // ─── Header Banner ───
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerGreetingText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#EA580C',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
  },
  whFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: PALETTE.headerPillBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 100, // Full 100px from Design System PDF
    marginTop: 10,
  },
  whFilterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Content Body ───
  contentBody: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  viewAllLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  // ─── KPI Grid (Today's Overview) ───
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'left',
  },
  kpiValue: {
    fontSize: 19, // Design System PDF Page 2: KPI VALUE 19px / 800
    fontWeight: '800', // Bold in all dashboards
    color: PALETTE.textInk,
    marginTop: 4,
    lineHeight: 24,
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  kpiSub: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 2,
    textAlign: 'left',
  },
  kpiLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.primary,
    marginTop: 8,
    textAlign: 'left',
  },
  kpiInfoBanner: {
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
  },
  kpiInfoText: {
    flex: 1,
    fontSize: 12,
    color: PALETTE.orangeDeep,
    lineHeight: 17,
    fontWeight: '500',
  },

  // ─── Warehouse Progress Cards ───
  whProgressCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  whProgressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  whProgressTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: PALETTE.trackBg,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3.5,
  },

  // ─── Operations Card ───
  operationsCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 6,
  },
  operationsSection: {
    paddingVertical: 12,
  },
  operationsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  operationsMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  operationsMetricText: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  operationsMetricBold: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  operationsMetricRed: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.red,
  },
  operationsDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  operationsTimelineSub: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    lineHeight: 16,
  },

  // ─── Alert Card ───
  alertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    position: 'relative',
  },
  alertAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: PALETTE.primary,
  },
  alertContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 14,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  alertSub: {
    fontSize: 12,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },

  // ─── Recent Activity ───
  recentActivityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8, // XS 8px from Design System PDF
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  activitySub: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: PALETTE.textMuted,
    fontWeight: '500',
  },
  activityDivider: {
    height: 1,
    backgroundColor: PALETTE.border,
  },

  // ─── Quick Actions ───
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  quickActionCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
  },

  // ─── Disclaimer ───
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 20,
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 14, // LG 14px from Design System PDF
    padding: 14,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: PALETTE.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },

  // ─── Bottom Tab Bar ───
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  tabLabelActive: {
    color: PALETTE.tabActive,
    fontWeight: '800',
  },

  // ─── Inventory & Stock View Specific Styles ───
  summaryListCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 2,
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryItemName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  summaryItemValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  summaryItemValueBrand: {
    color: PALETTE.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  inventoryActivityText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B433E',
    lineHeight: 18,
  },
  quickActionsDualRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  quickActionDualCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionDualLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 8,
    textAlign: 'center',
  },

  // ─── Filter Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  filterModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  filterModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 14,
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  filterOptionRowActive: {
    backgroundColor: PALETTE.primarySoft,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  filterOptionTextActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  filterCheckmark: {
    fontSize: 15,
    fontWeight: '900',
    color: PALETTE.primary,
  },

  // ─── Sales View Specific Styles ───
  greenBadgePill: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  greenBadgeText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0D6B4F',
  },
  needsAttentionAlertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  needsAttentionIconWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needsAttentionTextWrap: {
    flex: 1,
  },
  needsAttentionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  needsAttentionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  headerBackBtn: {
    padding: 4,
    marginRight: 4,
  },
  subScreenContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  subHeaderBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subHeaderSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
    marginLeft: 34,
  },
  backBtn: {
    padding: 2,
  },
  subScrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  whOverviewCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  whOverviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whOverviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  whCapacityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  whCapacityPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  whProgressBarTrack: {
    height: 6,
    backgroundColor: PALETTE.trackBg,
    borderRadius: 4,
    marginVertical: 10,
    overflow: 'hidden',
  },
  whProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  whOverviewStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  whOverviewStatCol: {
    flex: 1,
  },
  whOverviewStatLabel: {
    fontSize: 11,
    color: PALETTE.subTextMuted,
    fontWeight: '500',
  },
  whOverviewStatVal: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 2,
  },
  overviewSectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.brandBrown,
    marginTop: 10,
    marginBottom: 12,
  },
  moreViewsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  moreViewTile: {
    width: '48%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  moreViewTileLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 8,
  },
  comparisonCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  comparisonWhName: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  comparisonWhStat: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  rowDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  metricsGridCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  twoByTwoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  twoByTwoCol: {
    flex: 1,
  },
  twoByTwoRowSpaced: {
    marginTop: 18,
  },
  twoByTwoLabel: {
    fontSize: 11,
    color: PALETTE.subTextMuted,
    fontWeight: '500',
  },
  twoByTwoVal: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 4,
  },
  overviewNoticeBox: {
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    marginBottom: 20,
  },
  overviewNoticeText: {
    fontSize: 12,
    color: PALETTE.brandBrown,
    lineHeight: 17,
    fontWeight: '500',
  },
  manageBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  manageWhActionBtn: {
    flex: 1,
    backgroundColor: PALETTE.primarySoft,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageWhSecondaryBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
  },
  manageWhActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.orangeDeep,
  },
  actionCenterFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  actionCenterChip: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCenterChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  actionCenterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.brandBrown,
  },
  actionCenterChipTextActive: {
    color: PALETTE.headerText,
    fontWeight: '700',
  },
  actionCenterAlertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  actionCenterCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  actionCenterAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  actionCenterAlertSub: {
    fontSize: 12,
    color: PALETTE.subTextMuted,
    fontWeight: '500',
  },
  alertDetailCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    padding: 18,
    marginTop: 12,
  },
  alertDetailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertDetailGridCol: {
    flex: 1,
  },
  alertDetailFieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.subTextMuted,
    marginBottom: 4,
  },
  alertDetailFieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  alertDetailBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  openRelatedBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openRelatedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  acknowledgeBtn: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acknowledgeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  subScrollWithFooter: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },
  overviewSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  overviewSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.orangeDeep,
  },
  stockTableCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  stockTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  stockTableLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  stockTableVal: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  stockTableRowDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  stockTableTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  stockTableTotalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  lowStockSummaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  lowStockSummaryText: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.brandBrown,
    lineHeight: 18,
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderLight,
  },
  initiateTransferBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  initiateTransferBtnText: {
    color: PALETTE.headerText,
    fontSize: 14,
    fontWeight: '700',
  },
  stockSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8,
  },
  stockSearchInput: {
    flex: 1,
    fontSize: 13,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  consolidatedProductCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  consolidatedProductTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.brandBrown,
    marginBottom: 4,
  },
  lowStockDetailCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    padding: 16,
    marginTop: 12,
  },
  trackingCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: 12,
  },
  trackingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  trackingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackingTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  trackingBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trackingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trackingSubText: {
    fontSize: 12,
    color: PALETTE.subTextMuted,
    fontWeight: '500',
  },
});

