import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { adminColors, adminSpacing, adminType } from '../../theme';
import { fetchMe, hasSessionCredentials, type UserMe } from '../../../farmer/api/auth';
import {
  HOME_CODES,
  HomeFlow,
  MoreScreen,
  type AttentionFilter,
  type HomeTarget,
} from '../warehouse/dashboard-home-more';
import { ChipGroup, EmptyState } from '../warehouse/wallet-cashtopup/WalletParts';
import { ProfileFlow } from '../warehouse/profile-settings';
import { CustomersFlow, type CustomersRouteParams } from '../warehouse/customers';
import { BillingFlow } from '../warehouse/billing-invoices';
import { WalletFlow, walletParamsForCustomer } from '../warehouse/wallet-cashtopup';
import { FinanceFlow } from '../warehouse/finance-expenses';
import { ReportsScreen } from '../warehouse/reports';
import { makeCan } from '../../permissions/can';
import { useWarehousePermissions } from '../../permissions/useWarehousePermissions';
import type { WarehouseScope } from '../warehouse/finance-expenses';
import { OrdersFlow } from '../warehouse/orders';
import { InventoryFlow, MainInventoryDashboard, useMainInventoryOverview, type MainInventoryTarget } from '../warehouse/inventory';
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
import { useAdminMutation, useAdminQuery } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { listWarehouses, type WarehouseDto } from '../../api/warehouses';
import { listWarehouseTransfers } from '../../api/warehouseTransfers';
import { getOpenIssueCounts } from '../../api/dashboardFeeds';
import { useDashboardSalesSummary, useRecentActivityPages, useWarehousesPerformance } from '../warehouse/dashboard-home-more/useDashboardKpis';
import { activitySubLine, activityTimelineLine, mergeRecentActivity } from '../warehouse/dashboard-home-more/mappers_dashboardKpis';
import { toWarehouseOptions as toListOptions } from '../../api/warehouseList';
import { listBatches, type BatchDto } from '../../api/inventory';
import { listGoodsReceipts, type GoodsReceiptDto } from '../../api/receiving';
import { dismissAlert, listAlerts, snoozeAlert, type AlertItemDto } from '../../api/alerts';
import { ALERT_FILTER_LABEL, ALERT_STATE_FILTERS, snoozeUntil, type AlertStateFilter } from '../warehouse/dashboard-home-more/mappers_dashboardHome';
import { getTaskSummary, listTasks, type TaskItemDto } from '../../api/tasks';
import { getSalesSummary } from '../../api/sales';
import { AdminEmptyState, AdminErrorState } from '../warehouse/shared/AsyncStates';
import { SectionGate, derivedSource, mergeSources, retryFailed, sourceOf } from './MainDashboardParts';
import { adminErrorKey } from '../../api/errors';
import { isOnIstDay, istDay, relativeTime } from '../../utils/datetime';
import { t } from '../../i18n';
import {
  DASHBOARD_PAGE_LIMIT,
  EMPTY_ISSUE_FIGURES,
  EMPTY_PERFORMANCE,
  EMPTY_RECEIPT_FIGURES,
  EMPTY_STOCK_FIGURES,
  EMPTY_TRANSFER_FIGURES,
  FIGURE_PLACEHOLDER,
  barWidthPercent,
  capacityLevel,
  ALERT_TYPE_FILTERS,
  collectPages,
  countDashboardAlerts,
  coveredWarehouseIds,
  countLabel,
  dashboardAccess,
  derivePerformance,
  deriveOpenIssues,
  deriveReceiptFigures,
  deriveSalesCount,
  deriveStockFigures,
  deriveTransfers,
  figureOrPlaceholder,
  filterDashboardAlerts,
  findWarehouseByName,
  formatUtilization,
  greetingKey,
  monthToDateRange,
  openTaskCount,
  receiptsOnDay,
  salesRevenueText,
  scopeStockFigures,
  filterStockProducts,
  toDashboardAlerts,
  toLowStockItems,
  toRecentActivity,
  toWarehouseOptions,
  warehouseShortName,
  type AlertTarget,
  type AlertTypeFilter,
  type DashboardAlert,
} from './mappers_mainDashboard';
import { formatKg } from '../../money/quantity';

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
// Entries that have a token in the admin theme point at it (same value, no visual
// change); the rest are literals still waiting for one (admin_theme_guard ratchet).
const PALETTE = {
  // Brand Palette (Page 1)
  primary: adminColors.brand, // Orange - Primary actions, active states, icons
  headerBg: adminColors.brand, // Brand Terracotta Orange
  headerBgDark: '#D9481E',
  headerPillBg: 'rgba(255, 255, 255, 0.22)',
  headerText: adminColors.onBrand,

  orangeDeep: adminColors.brandDeep, // Orange Deep - Section headings, emphasis text
  primarySoft: adminColors.brandTint, // Orange Tint - Icon chips, role badges, active pills
  pageBg: adminColors.canvas, // Background - App canvas soft cream

  // Neutrals (Page 1)
  textInk: adminColors.ink, // Ink - Primary text
  textSecondary: adminColors.muted, // Muted - Secondary text
  textMuted: adminColors.muted, // Muted text
  border: adminColors.border, // Border - Card and input borders
  borderLight: '#F8F3ED',
  cardBg: adminColors.card, // Card - Card surfaces
  primaryBorder: adminColors.border,

  // Semantic Colors (Page 2)
  amber: adminColors.warning.text, // Warning (#854F0B)
  amberBg: adminColors.warning.bg, // Warning BG (#FEF3E2)
  green: adminColors.success.text, // Success (#173404)
  greenBg: adminColors.success.bg, // Success BG (#EAF3DE)
  greenText: '#1E8E5A',

  red: adminColors.danger.text, // Danger (#E24B4A)
  redBg: adminColors.danger.bg, // Danger BG (#FCEBEB)
  redBorder: '#FCA5A5',

  tabInactive: adminColors.muted,
  tabActive: adminColors.brand,
  tabBorder: adminColors.border,
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
  // Inventory tab overview destinations (shared InventoryFlow routes)
  | 'inventory_stock'
  | 'inventory_allocation'
  | 'inventory_verification'
  | 'inventory_variance'
  // Receiving "View Batch": the batch a goods receipt was stocked as (BR-106)
  | 'inventory_batch_detail'
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

function Grid4SquaresIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function ProfileHeaderIcon({ size = 19, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function BuildingWarehouseIcon({ size = 16, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function ChevronDownWhiteIcon({ size = 14, color = adminColors.onBrand }: { size?: number; color?: string }) {
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
      <Path d="M4 13h4l2 3h4l2-3h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v5M9 9.5l3 3 3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8h.01M12 12v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

function StockBoxIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="5" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M5 9v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 13h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowLeftWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function AlertEscalationIcon({ size = 20, color = PALETTE.red }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertClockIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
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

// Stable empty lists, so a query that has no data yet does not hand useMemo a new [] every render.
const NO_WAREHOUSES: WarehouseDto[] = [];
const NO_BATCHES: BatchDto[] = [];
const NO_TASKS: TaskItemDto[] = [];
const NO_RECEIPTS: GoodsReceiptDto[] = [];
const NO_ALERTS: AlertItemDto[] = [];
/**
 * Recent Activity shows two rows, but a task whose title the app cannot word is
 * hidden, so a few more are fetched to fill them. A page size, not a threshold.
 */
const ACTIVITY_FETCH_LIMIT = 10;
/** Rows of live events in Recent Activity: a list length, not a business limit. */
const RECENT_ACTIVITY_ROWS = 3;

/** The sub-view each alert type opens as its related record. */
const ALERT_TARGET_ROUTE: Record<AlertTarget, WarehouseSubView> = {
  lowStock: 'low_stock_alerts',
  capacity: 'warehouse_capacity',
  inventory: 'stock_ledger',
  operations: 'warehouse_operations',
};

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

/** Main inventory sub-views -> shared InventoryFlow route keys (design ids). */
const INVENTORY_ENTRY = {
  stock_ledger: 'M3S06',
  verify_stock: 'M3S11',
  stock_adjustment_approval: 'M3S17',
  low_stock_alerts: 'M3S09',
  inventory_stock: 'M3S02',
  inventory_allocation: 'M3S07',
  inventory_verification: 'M3S10',
  inventory_variance: 'M3S12',
  inventory_batch_detail: 'M3S05',
} as const;

type InventoryEntryView = keyof typeof INVENTORY_ENTRY;

function isInventoryEntry(view: WarehouseSubView): view is InventoryEntryView {
  return Object.prototype.hasOwnProperty.call(INVENTORY_ENTRY, view);
}

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
  // The warehouse scope of every Home / Inventory query: a live warehouse uuid, or
  // undefined for all of them. Selection is kept by uuid, never by display name.
  const [filterWarehouseId, setFilterWarehouseId] = useState<string | undefined>(undefined);
  const [showFilterModal, setShowFilterModal] = useState(false);
  // The warehouse the detail / settings / ledger views open on, and the storage
  // location opened from the list: nothing until the admin picks one.
  const [detailWarehouseId, setDetailWarehouseId] = useState<string | undefined>(undefined);
  // Receiving "View Batch" target: a batch uuid the API returned on a receipt or quality check.
  const [receivingBatchId, setReceivingBatchId] = useState<string | undefined>(undefined);
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  /** Filter the Sales hub's Needs Attention card opened the queue on. */
  const [attentionCategory, setAttentionCategory] = useState<AttentionFilter>('all');
  const [selectedAlert, setSelectedAlert] = useState<DashboardAlert | null>(null);
  const [alertWarehouseId, setAlertWarehouseId] = useState<string | undefined>(undefined);
  // The Alerts & Action Center lists the caller's active alerts or the ones they snoozed (BR-78).
  const [alertState, setAlertState] = useState<AlertStateFilter>('active');
  const [alertTypeFilter, setAlertTypeFilter] = useState<AlertTypeFilter>('all');
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

  // The IST day: the sales summary counts Asia/Kolkata days (BR-96), so a UTC
  // date would show yesterday's figures between 00:00 and 05:30 IST.
  const now = new Date();
  const today = istDay(now);

  // Every query waits for warehouse.all.view: without it (or until /auth/me
  // answers) the Home shows a note and nothing is requested.
  const live = { enabled: canAllView };
  // Optional sources are fetched and drawn only with their own rbac code (the old shell did the same).
  const access = dashboardAccess(can);

  // Live warehouses query (GET /warehouses, warehouse.all.view): the API's own
  // isActive filter, no seed-code list.
  const warehousesQuery = useAdminQuery(
    adminKeys.scoped('warehouses', undefined, { pageSize: 100, isActive: true }),
    (signal) => listWarehouses({ isActive: true, pageSize: 100 }, signal),
    live,
  );
  const warehouses = warehousesQuery.data?.items ?? NO_WAREHOUSES;

  // Live-backed flows take the uuid (BR-30); screens still on design samples
  // key their rows by the seed code, so they are given the live code instead.
  const warehouseOptions: readonly WarehouseScope[] = useMemo(() => toWarehouseOptions(warehouses), [warehouses]);
  const selectedWarehouseId = filterWarehouseId;
  const detailWarehouse = warehouses.find((w) => w.id === detailWarehouseId);
  const filterWarehouse = warehouses.find((w) => w.id === filterWarehouseId);
  const filterLabel = filterWarehouse === undefined ? t('mainDashboard.allWarehouses') : warehouseShortName(filterWarehouse.name);
  // Memoised: InventoryFlow restarts its stack whenever initialParams changes identity.
  const ledgerParams = useMemo(
    () => (detailWarehouse === undefined ? null : { warehouseName: detailWarehouse.name }),
    [detailWarehouse],
  );
  const batchDetailParams = useMemo(
    () => (receivingBatchId === undefined ? null : { batchId: receivingBatchId }),
    [receivingBatchId],
  );
  const openWarehouseDetail = (warehouseId: string | undefined) => {
    setDetailWarehouseId(warehouseId);
    navigateWh('warehouse_city_detail');
  };

  // Live batches (GET /admin/batches): ACTIVE only, every page up to the cap.
  const batchesQuery = useAdminQuery(
    adminKeys.scoped('inventory', selectedWarehouseId, { resource: 'batches', status: 'ACTIVE', limit: DASHBOARD_PAGE_LIMIT }),
    (signal) =>
      collectPages((cursor) =>
        listBatches({ warehouseId: selectedWarehouseId, status: 'ACTIVE', limit: DASHBOARD_PAGE_LIMIT, cursor }, signal),
      ),
    live,
  );
  const batches = batchesQuery.data?.items ?? NO_BATCHES;

  // Live tasks: the exact counts come from the summary (GET /admin/tasks/summary);
  // the open list only feeds Recent Activity, so one page of it is enough.
  const taskSummaryQuery = useAdminQuery(
    adminKeys.scoped('tasks', selectedWarehouseId, { resource: 'summary' }),
    (signal) => getTaskSummary({ warehouseId: selectedWarehouseId }, signal),
    live,
  );
  const taskSummary = taskSummaryQuery.data;

  const openTasksQuery = useAdminQuery(
    adminKeys.scoped('tasks', selectedWarehouseId, { resource: 'open-tasks', limit: ACTIVITY_FETCH_LIMIT }),
    (signal) => listTasks({ state: 'open', warehouseId: selectedWarehouseId, limit: ACTIVITY_FETCH_LIMIT }, signal),
    live,
  );
  const openTasks = openTasksQuery.data?.items ?? NO_TASKS;

  // Live sales summary (GET /admin/sales/summary) for the IST day.
  const salesSummaryQuery = useAdminQuery(
    adminKeys.scoped('sales', selectedWarehouseId, { resource: 'summary', from: today, to: today }),
    (signal) => getSalesSummary({ warehouseId: selectedWarehouseId, from: today, to: today }, signal),
    { enabled: canAllView && access.sales },
  );
  const salesSummary = salesSummaryQuery.data;

  // Live goods receipts (GET /admin/goods-receipts), newest first; today's only.
  const goodsReceiptsQuery = useAdminQuery(
    adminKeys.scoped('receiving', selectedWarehouseId, { resource: 'grn', day: today, limit: DASHBOARD_PAGE_LIMIT }),
    (signal) =>
      collectPages(
        (cursor) => listGoodsReceipts({ warehouseId: selectedWarehouseId, limit: DASHBOARD_PAGE_LIMIT, cursor }, signal),
        { isDone: (page) => page.some((g) => !isOnIstDay(g.receivedAt, today)) },
      ),
    live,
  );
  const goodsReceipts = useMemo(
    () => receiptsOnDay(goodsReceiptsQuery.data?.items ?? NO_RECEIPTS, today),
    [goodsReceiptsQuery.data, today],
  );

  // Live inter-warehouse transfers (GET /warehouse-transfers, BR-102), newest
  // first; the first page is enough because the figures say when it is not all.
  const transfersQuery = useAdminQuery(
    adminKeys.scoped('transfers', selectedWarehouseId, { resource: 'list', pageSize: DASHBOARD_PAGE_LIMIT }),
    (signal) => listWarehouseTransfers({ warehouseId: selectedWarehouseId, pageSize: DASHBOARD_PAGE_LIMIT }, signal),
    { enabled: canAllView && access.transfers },
  );

  // Live open issues (GET /warehouses/{id}/issues, BR-103): the exact totals of the covered
  // warehouses. Alerts are warnings the server derives; issues are what staff reported.
  const coveredIds = useMemo(() => coveredWarehouseIds(warehouses, selectedWarehouseId), [warehouses, selectedWarehouseId]);
  const issuesQuery = useAdminQuery(
    adminKeys.scoped('warehouseIssues', selectedWarehouseId, { resource: 'open-count', ids: coveredIds.join(',') }),
    (signal) => getOpenIssueCounts(coveredIds, signal),
    { enabled: canAllView && access.issues && warehousesQuery.data !== undefined },
  );

  // Server-exact performance (GET /warehouses/{id}/performance, BR-80) of the covered warehouses:
  // today (for the returns count) and, only while Warehouse Performance is open, the IST month so far.
  const perfTodayQuery = useWarehousesPerformance(coveredIds, { from: today, to: today }, canAllView && warehousesQuery.data !== undefined);
  const perfMtdQuery = useWarehousesPerformance(coveredIds, monthToDateRange(now), canAllView && whSubView === 'warehouse_performance');
  const salesMtdQuery = useDashboardSalesSummary(selectedWarehouseId, monthToDateRange(now), canAllView && access.sales && whSubView === 'warehouse_performance');

  // The newest events of the covered warehouses (GET /warehouses/{id}/activity, BR-104): stock
  // movements, receipts, transfers, issues, returns, documents. Needs warehouse.activity.view.
  const activityQuery = useRecentActivityPages(coveredIds, RECENT_ACTIVITY_ROWS, canAllView && access.activity && warehousesQuery.data !== undefined);

  // Live alerts (GET /admin/alerts): the active ones. Snoozed and dismissed
  // alerts are not fetched, so there is no resolved view.
  const alertsQuery = useAdminQuery(
    adminKeys.scoped('alerts', selectedWarehouseId, { resource: 'list', state: 'active', limit: DASHBOARD_PAGE_LIMIT }),
    (signal) =>
      collectPages((cursor) =>
        listAlerts({ warehouseId: selectedWarehouseId, state: 'active', limit: DASHBOARD_PAGE_LIMIT, cursor }, signal),
      ),
    live,
  );
  const liveAlerts = alertsQuery.data?.items ?? NO_ALERTS;

  // The alerts the caller snoozed (BR-78): read only while that list is shown.
  const snoozedAlertsQuery = useAdminQuery(
    adminKeys.scoped('alerts', selectedWarehouseId, { resource: 'list', state: 'snoozed', limit: DASHBOARD_PAGE_LIMIT }),
    (signal) =>
      collectPages((cursor) =>
        listAlerts({ warehouseId: selectedWarehouseId, state: 'snoozed', limit: DASHBOARD_PAGE_LIMIT, cursor }, signal),
      ),
    { enabled: canAllView && alertState === 'snoozed' },
  );

  // A list the page cap cut short: its totals say so instead of looking whole.
  const listsPartial =
    [batchesQuery.data, goodsReceiptsQuery.data, alertsQuery.data].some(
      (collected) => collected !== undefined && !collected.complete,
    );

  // Every query's state, so no section draws a figure the server has not sent.
  const warehousesSrc = sourceOf(warehousesQuery);
  const batchesSrc = sourceOf(batchesQuery);
  const openTasksSrc = sourceOf(openTasksQuery);
  const salesSrc = sourceOf(salesSummaryQuery);
  const receiptsSrc = sourceOf(goodsReceiptsQuery);
  const alertsSrc = sourceOf(alertsQuery);
  const snoozedAlertsSrc = sourceOf(snoozedAlertsQuery);
  const transfersRawSrc = sourceOf(transfersQuery);
  const issuesSrc = sourceOf(issuesQuery);
  const perfTodaySrc = sourceOf(perfTodayQuery);
  const activitySrc = sourceOf(activityQuery);
  const perfMtdSrc = sourceOf(perfMtdQuery);
  const salesMtdSrc = sourceOf(salesMtdQuery);
  const taskSummarySrc = sourceOf(taskSummaryQuery);

  // The Inventory tab overview (8 cards + sections), shared with the Sub shell. Main sends the
  // header filter's warehouse uuid, or none for all of them; the server scopes every read again
  // (BR-30). Each source is fetched only with its own rbac code (mainInventoryAccess).
  const inventoryWarehouses = useMemo(() => warehouses.map((w) => ({ warehouseId: w.id, name: w.name })), [warehouses]);
  const inventoryOverview = useMainInventoryOverview({
    can,
    warehouseId: selectedWarehouseId,
    warehouses: inventoryWarehouses,
    warehousesSource: warehousesSrc,
    enabled: canAllView && activeTab === 'Inventory',
  });

  const alertsList: DashboardAlert[] = useMemo(
    () => toDashboardAlerts(liveAlerts, warehouses, now),
    // `now` changes every render, so the relative time is as of the last data change.
    [liveAlerts, warehouses],
  );
  const snoozedAlertsList: DashboardAlert[] = useMemo(
    () => toDashboardAlerts(snoozedAlertsQuery.data?.items ?? NO_ALERTS, warehouses, now),
    [snoozedAlertsQuery.data, warehouses],
  );

  // POST /admin/alerts/{itemKey}/dismiss (alert.own.view) hides the alert from
  // THIS admin's lists only; other admins keep seeing it (BR-78). So the button
  // says "Dismiss for me", is offered only with alert.own.view, and reports
  // success only after the server accepted it.
  const dismissMutation = useAdminMutation({
    mutationFn: (itemKey: string) => dismissAlert(itemKey),
    invalidates: [adminKeys.scoped('alerts', selectedWarehouseId)],
  });
  const canDismissAlert = can('alert.own.view');
  // POST /admin/alerts/{itemKey}/snooze hides the alert from THIS admin's active list for an hour
  // (the design's snooze; the server caps it with system_config.alert_snooze_max_hours). Same rules
  // as dismiss: only with alert.own.view, success only after the server accepted it.
  const snoozeMutation = useAdminMutation({
    mutationFn: (itemKey: string) => snoozeAlert(itemKey, snoozeUntil(new Date())),
    invalidates: [adminKeys.scoped('alerts', selectedWarehouseId)],
  });
  const handleSnoozeAlert = async (alert: DashboardAlert) => {
    try {
      await snoozeMutation.mutateAsync(alert.id);
    } catch {
      // Not shown as success: the failure renders from snoozeMutation.error.
      return;
    }
    Alert.alert(t('mainDashboard.alert.snoozed.title'), t('mainDashboard.alert.snoozed.body', { title: alert.title }));
    snoozeMutation.reset();
    goBackWh();
  };
  const handleDismissAlert = async (alert: DashboardAlert) => {
    try {
      await dismissMutation.mutateAsync(alert.id);
    } catch {
      // Not shown as success: the failure renders from dismissMutation.error.
      return;
    }
    Alert.alert(t('mainDashboard.alert.dismissed.title'), t('mainDashboard.alert.dismissed.body', { title: alert.title }));
    dismissMutation.reset();
    goBackWh();
  };

  // Every figure comes from the pure derivations in ./mappers_mainDashboard.ts:
  // weights as integer grams, money as integer paise, capacity never clamped
  // (BR-66b). A malformed value from the server makes that derivation fail,
  // which draws the same error state a failed request does, never a zero.
  const stockD = useMemo(() => deriveStockFigures(batches, warehouses), [batches, warehouses]);
  // The filter narrows the batches at the API; scoping the rows keeps the cards, the capacity and the
  // warehouse count on the warehouse(s) it covers (the old shell's filter did the same for every KPI).
  const stockFig = stockD.ok ? scopeStockFigures(stockD.value, selectedWarehouseId) : EMPTY_STOCK_FIGURES;
  const receiptsD = useMemo(() => deriveReceiptFigures(goodsReceipts), [goodsReceipts]);
  const receiptFig = receiptsD.ok ? receiptsD.value : EMPTY_RECEIPT_FIGURES;
  const revenueD = useMemo(() => (salesSummary === undefined ? null : salesRevenueText(salesSummary)), [salesSummary]);
  const salesRevenueLabel = revenueD !== null && revenueD.ok ? revenueD.value : FIGURE_PLACEHOLDER;
  const salesCountD = useMemo(() => (salesSummary === undefined ? null : deriveSalesCount(salesSummary)), [salesSummary]);
  const salesCount = salesCountD !== null && salesCountD.ok ? salesCountD.value : 0;
  const issuesD = useMemo(
    () => (issuesQuery.data === undefined ? null : deriveOpenIssues(issuesQuery.data, coveredIds)),
    [issuesQuery.data, coveredIds],
  );
  const issueFig = issuesD !== null && issuesD.ok ? issuesD.value : EMPTY_ISSUE_FIGURES;

  // A section's source: its queries plus the derivation built from them.
  const stockSrc = mergeSources(
    warehousesSrc,
    batchesSrc,
    derivedSource(stockD, () => {
      void warehousesQuery.refetch();
      void batchesQuery.refetch();
    }),
  );
  const receiptsFigSrc = mergeSources(receiptsSrc, derivedSource(receiptsD, () => void goodsReceiptsQuery.refetch()));
  const transfersD = useMemo(
    () =>
      transfersQuery.data === undefined
        ? null
        : deriveTransfers(transfersQuery.data.items, transfersQuery.data.total, warehouses),
    [transfersQuery.data, warehouses],
  );
  const transferFig = transfersD !== null && transfersD.ok ? transfersD.value : EMPTY_TRANSFER_FIGURES;
  const transfersSrc = mergeSources(
    transfersRawSrc,
    warehousesSrc,
    derivedSource(transfersD, () => void transfersQuery.refetch()),
  );
  const revenueSrc = mergeSources(
    salesSrc,
    derivedSource(revenueD, () => void salesSummaryQuery.refetch()),
    derivedSource(salesCountD, () => void salesSummaryQuery.refetch()),
  );
  const perfTodayD = useMemo(() => (perfTodayQuery.data === undefined ? null : derivePerformance(perfTodayQuery.data)), [perfTodayQuery.data]);
  const perfToday = perfTodayD !== null && perfTodayD.ok ? perfTodayD.value : EMPTY_PERFORMANCE;
  const perfTodayFigSrc = mergeSources(perfTodaySrc, derivedSource(perfTodayD, () => void perfTodayQuery.refetch()));
  const perfMtdD = useMemo(() => (perfMtdQuery.data === undefined ? null : derivePerformance(perfMtdQuery.data)), [perfMtdQuery.data]);
  const perfMtd = perfMtdD !== null && perfMtdD.ok ? perfMtdD.value : EMPTY_PERFORMANCE;
  const perfMtdFigSrc = mergeSources(perfMtdSrc, derivedSource(perfMtdD, () => void perfMtdQuery.refetch()));
  const salesMtdRevenueD = useMemo(
    () => (salesMtdQuery.data === undefined ? null : salesRevenueText(salesMtdQuery.data)),
    [salesMtdQuery.data],
  );
  const salesMtdCountD = useMemo(() => (salesMtdQuery.data === undefined ? null : deriveSalesCount(salesMtdQuery.data)), [salesMtdQuery.data]);
  const salesMtdFigSrc = mergeSources(
    salesMtdSrc,
    derivedSource(salesMtdRevenueD, () => void salesMtdQuery.refetch()),
    derivedSource(salesMtdCountD, () => void salesMtdQuery.refetch()),
  );
  const issuesFigSrc = mergeSources(issuesSrc, derivedSource(issuesD, () => void issuesQuery.refetch()));

  const homeKpiSources = [
    stockSrc,
    receiptsFigSrc,
    ...(access.transfers ? [transfersSrc] : []),
    perfTodayFigSrc,
    ...(access.sales ? [revenueSrc] : []),
    ...(access.issues ? [issuesFigSrc] : []),
  ];

  const qualityIssuesCount =
    receiptFig.discrepancies + (taskSummary === undefined ? 0 : openTaskCount(taskSummary, 'GOODS_RECEIPT_QC'));
  const activityRows = useMemo(() => toRecentActivity(openTasks, warehouses, now), [openTasks, warehouses]);
  const activityFeed = useMemo(
    () => mergeRecentActivity(activityQuery.pages, toListOptions(warehouses), now, RECENT_ACTIVITY_ROWS),
    // `now` changes every render, so the relative time is as of the last data change.
    [activityQuery.pages, warehouses],
  );

  const lowStockItems = useMemo(
    () => toLowStockItems(liveAlerts, batches, warehouses),
    [liveAlerts, batches, warehouses],
  );

  const firstName = user?.fullName?.trim().split(' ')[0];
  const displayName = firstName ? firstName : t('mainDashboard.greeting.fallbackName');

  const navigateWh = (view: WarehouseSubView) => {
    setWhHistory((prev) => [...prev, whSubView]);
    setWhSubView(view);
  };

  /**
   * Receiving "View Batch" (design M2-12A "Assign Batch"): BR-106 creates the
   * batch inside the quality check, so receiving only ever opens it, in the
   * shared inventory batch detail (GET /admin/batches/{id}).
   */
  const openReceivingBatch = (batchId: string) => {
    setReceivingBatchId(batchId);
    setActiveTab('Home');
    navigateWh('inventory_batch_detail');
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
  /** Inventory tab overview taps -> this shell's sub-views and tabs. */
  const openInventoryTarget = (target: MainInventoryTarget) => {
    switch (target) {
      case 'stockList':
        navigateWh('inventory_stock');
        return;
      case 'allocation':
        navigateWh('inventory_allocation');
        return;
      case 'lowStock':
        navigateWh('low_stock_alerts');
        return;
      case 'verification':
        navigateWh('inventory_verification');
        return;
      case 'varianceReview':
        navigateWh('inventory_variance');
        return;
      case 'adjustments':
        // M3S17 without an adjustment id: the PENDING approval queue.
        navigateWh('stock_adjustment_approval');
        return;
      case 'ledger':
        navigateWh('stock_ledger');
        return;
      case 'transferReceiving':
        openTab('Receiving');
        setReceivingSubView('transfer_receiving');
        return;
      case 'createTransfer':
        navigateWh('initiate_new_transfer');
        return;
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

  /** The pinned Initiate Stock Transfer button: drawn only with transfer.inter_warehouse.initiate (the server checks again). */
  const renderInitiateTransferBar = () =>
    access.transferInitiate ? (
      <View style={styles.fixedBottomBar}>
        <TouchableOpacity
          style={styles.initiateTransferBtn}
          onPress={() => navigateWh('initiate_new_transfer')}
          activeOpacity={0.8}
        >
          <TransferArrowsWhiteIcon size={18} />
          <Text style={styles.initiateTransferBtnText}>{t('dashboardHome.stockTransfer.initiate')}</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  const renderWarehouseOverviewScreen = () => {
    if (!canAllView) {
      return (
        <View style={styles.subScreenContainer}>
          <View style={styles.subHeaderBanner}>
            <View style={styles.subHeaderRow}>
              <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7}>
                <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
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
              <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Warehouse Overview</Text>
          </View>
          <Text style={styles.subHeaderSubtitle}>{t('mainDashboard.overview.subtitle')}</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          <SectionGate sources={[stockSrc, receiptsSrc, ...(access.issues ? [issuesFigSrc] : [])]}>
          {warehouses.length === 0 ? <AdminEmptyState title={t('mainDashboard.noWarehouses')} /> : null}
          {stockFig.warehouses.map((row) => {
            const level = capacityLevel(row.utilizationBp);
            const capLabel = row.utilizationBp === null ? FIGURE_PLACEHOLDER : formatUtilization(row.utilizationBp);
            const capBg =
              level === 'danger' ? PALETTE.redBg : level === 'warn' ? PALETTE.amberBg : level === 'ok' ? PALETTE.greenBg : PALETTE.borderLight;
            const capColor =
              level === 'danger' ? PALETTE.red : level === 'warn' ? PALETTE.amber : level === 'ok' ? PALETTE.greenText : PALETTE.textMuted;
            const progColor = level === 'danger' ? PALETTE.red : PALETTE.primary;
            const progWidth = `${barWidthPercent(row.utilizationBp)}%` as const;
            const stockStr = formatKg(row.stockGrams);
            const receiptsCount = goodsReceipts.filter((g) => g.warehouseId === row.warehouseId).length;
            const whName = row.name;

            return (
              <TouchableOpacity
                key={row.warehouseId}
                style={styles.whOverviewCard}
                onPress={() => openWarehouseDetail(row.warehouseId)}
                activeOpacity={0.8}
              >
                <View style={styles.whOverviewHeaderRow}>
                  <Text style={styles.whOverviewTitle}>{whName}</Text>
                  <View style={[styles.whCapacityPill, { backgroundColor: capBg }]}>
                    <Text style={[styles.whCapacityPillText, { color: capColor }]}>{capLabel}</Text>
                  </View>
                </View>

                <View style={styles.whProgressBarTrack}>
                  <View style={[styles.whProgressBarFill, { width: progWidth, backgroundColor: progColor }]} />
                </View>

                <View style={styles.whOverviewStatsRow}>
                  <View style={styles.whOverviewStatCol}>
                    <Text style={styles.whOverviewStatLabel}>Stock</Text>
                    <Text style={styles.whOverviewStatVal}>{stockStr}</Text>
                  </View>
                  <View style={styles.whOverviewStatCol}>
                    <Text style={styles.whOverviewStatLabel}>Receipts</Text>
                    <Text style={styles.whOverviewStatVal}>{receiptsCount}</Text>
                  </View>
                  {access.issues ? (
                    <View style={styles.whOverviewStatCol}>
                      <Text style={styles.whOverviewStatLabel}>Issues</Text>
                      <Text style={styles.whOverviewStatVal}>{issueFig.byWarehouse[row.warehouseId] ?? 0}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}

          </SectionGate>

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
                <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
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
              <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Warehouse Comparison</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewSectionHeading}>Warehouse Comparison</Text>

          <SectionGate sources={[stockSrc]}>
          {stockFig.warehouses.length === 0 ? <AdminEmptyState title={t('mainDashboard.noWarehouses')} /> : null}
          <View style={styles.comparisonCard}>
            {stockFig.warehouses.map((row, idx) => {
              const whName = row.name;
              const comparisonStat =
                row.utilizationBp === null
                  ? t('mainDashboard.comparison.statNoCapacity', { stock: formatKg(row.stockGrams) })
                  : t('mainDashboard.comparison.stat', {
                      stock: formatKg(row.stockGrams),
                      utilization: formatUtilization(row.utilizationBp),
                    });
              return (
                <React.Fragment key={row.warehouseId}>
                  {idx > 0 && <View style={styles.rowDivider} />}
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonWhName}>{whName}</Text>
                    <Text style={styles.comparisonWhStat}>{comparisonStat}</Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
          </SectionGate>

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
                <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
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
              <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Warehouse Performance</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewSectionHeading}>Warehouse Performance</Text>

          <SectionGate sources={[receiptsFigSrc, ...(access.sales ? [revenueSrc] : []), openTasksSrc, taskSummarySrc]}>
          <View style={styles.metricsGridCard}>
            <View style={styles.twoByTwoRow}>
              <View style={styles.twoByTwoCol}>
                <Text style={styles.twoByTwoLabel}>Receipts Today</Text>
                <Text style={styles.twoByTwoVal}>{formatKg(receiptFig.grossGrams)}</Text>
              </View>
              {access.sales ? (
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>Sales Today</Text>
                  <Text style={styles.twoByTwoVal}>{salesRevenueLabel}</Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.twoByTwoRow, { marginTop: 18 }]}>
              <View style={styles.twoByTwoCol}>
                <Text style={styles.twoByTwoLabel}>Quality Issues</Text>
                <Text style={styles.twoByTwoVal}>{qualityIssuesCount}</Text>
              </View>
              <View style={styles.twoByTwoCol}>
                <Text style={styles.twoByTwoLabel}>Open Tasks</Text>
                <Text style={styles.twoByTwoVal}>{taskSummary?.open ?? openTasks.length}</Text>
              </View>
            </View>
          </View>
          </SectionGate>

          {/* Month to date: the server's exact counts (BR-80) and paid sales (BR-96) over the IST month so far */}
          <Text style={styles.overviewSectionHeading}>{t('mainDashboard.performance.monthToDate')}</Text>
          <Text style={styles.whOverviewStatLabel}>
            {t('mainDashboard.performance.range', { from: monthToDateRange(now).from, to: monthToDateRange(now).to, scope: filterLabel })}
          </Text>
          <SectionGate sources={[perfMtdFigSrc, ...(access.sales ? [salesMtdFigSrc] : [])]}>
            <View style={styles.metricsGridCard}>
              <View style={styles.twoByTwoRow}>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.receipts')}</Text>
                  <Text style={styles.twoByTwoVal}>{perfMtd.goodsReceipts}</Text>
                </View>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.received')}</Text>
                  <Text style={styles.twoByTwoVal}>{formatKg(perfMtd.grossGrams)}</Text>
                </View>
              </View>
              <View style={[styles.twoByTwoRow, { marginTop: 18 }]}>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.ordersPlaced')}</Text>
                  <Text style={styles.twoByTwoVal}>{perfMtd.ordersPlaced}</Text>
                </View>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.ordersFulfilled')}</Text>
                  <Text style={styles.twoByTwoVal}>{perfMtd.ordersFulfilled}</Text>
                </View>
              </View>
              <View style={[styles.twoByTwoRow, { marginTop: 18 }]}>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.rejected')}</Text>
                  <Text style={styles.twoByTwoVal}>{formatKg(perfMtd.rejectedGrams)}</Text>
                </View>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.returns')}</Text>
                  <Text style={styles.twoByTwoVal}>{perfMtd.returnsRequested}</Text>
                </View>
              </View>
              {access.sales ? (
                <View style={[styles.twoByTwoRow, { marginTop: 18 }]}>
                  <View style={styles.twoByTwoCol}>
                    <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.sales')}</Text>
                    <Text style={styles.twoByTwoVal}>{salesMtdRevenueD !== null && salesMtdRevenueD.ok ? salesMtdRevenueD.value : FIGURE_PLACEHOLDER}</Text>
                  </View>
                  <View style={styles.twoByTwoCol}>
                    <Text style={styles.twoByTwoLabel}>{t('mainDashboard.performance.salesCount')}</Text>
                    <Text style={styles.twoByTwoVal}>{salesMtdCountD !== null && salesMtdCountD.ok ? salesMtdCountD.value : FIGURE_PLACEHOLDER}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </SectionGate>

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
                <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
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
              <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Capacity Summary</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewSectionHeading}>Warehouse Capacity Summary</Text>

          <SectionGate sources={[stockSrc]}>
          <View style={styles.metricsGridCard}>
            <View style={styles.twoByTwoRow}>
              <View style={styles.twoByTwoCol}>
                <Text style={styles.twoByTwoLabel}>Used Capacity</Text>
                <Text style={styles.twoByTwoVal}>
                  {stockFig.capacity.warehousesWithCapacity === 0 ? FIGURE_PLACEHOLDER : formatKg(stockFig.capacity.usedGrams)}
                </Text>
              </View>
              <View style={styles.twoByTwoCol}>
                <Text style={styles.twoByTwoLabel}>Available Capacity</Text>
                <Text style={styles.twoByTwoVal}>
                  {stockFig.capacity.availableGrams === null ? FIGURE_PLACEHOLDER : formatKg(stockFig.capacity.availableGrams)}
                </Text>
              </View>
            </View>
            <View style={[styles.twoByTwoRow, { marginTop: 18 }]}>
              <View style={styles.twoByTwoCol}>
                <Text style={styles.twoByTwoLabel}>Active Warehouses</Text>
                <Text style={styles.twoByTwoVal}>{stockFig.warehouses.length}</Text>
              </View>
              <View style={styles.twoByTwoCol}>
                <Text style={styles.twoByTwoLabel}>Utilization</Text>
                <Text style={styles.twoByTwoVal}>
                  {stockFig.capacity.utilizationBp === null ? FIGURE_PLACEHOLDER : formatUtilization(stockFig.capacity.utilizationBp)}
                </Text>
              </View>
            </View>
          </View>
          </SectionGate>

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
              <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Manage Warehouses</Text>
          </View>
          <Text style={styles.subHeaderSubtitle}>Configure and monitor warehouse hubs</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewSectionHeading}>Warehouse Hubs</Text>

          <SectionGate sources={[warehousesSrc]}>
          {warehouses.length === 0 ? <AdminEmptyState title={t('mainDashboard.noWarehouses')} /> : null}
          {warehouses.map((wh) => {
            const displayName = wh.name.endsWith('Warehouse') ? wh.name : `${wh.name} Warehouse`;
            return (
              <View key={wh.id} style={styles.whOverviewCard}>
                <View style={styles.whOverviewHeaderRow}>
                  <Text style={styles.whOverviewTitle}>{displayName}</Text>
                  <View style={[styles.whCapacityPill, { backgroundColor: PALETTE.greenPillBg }]}>
                    <Text style={[styles.whCapacityPillText, { color: PALETTE.greenProgress }]}>{wh.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>

                <Text style={[styles.whOverviewStatLabel, { marginTop: 4 }]}>
                  {[wh.code, wh.address ?? wh.city].filter((part): part is string => typeof part === 'string' && part.trim() !== '').join(' · ')}
                </Text>

                <View style={styles.manageBtnRow}>
                  <TouchableOpacity
                    style={styles.manageWhActionBtn}
                    onPress={() => openWarehouseDetail(wh.id)}
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
            );
          })}

          </SectionGate>

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
                <Text style={[styles.manageWhActionText, { color: adminColors.onBrand }]}>Manage SWA Accounts</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  };

  const renderAlertsActionCenterScreen = () => {
    // The API has no priority or read state, so the chips are the real ones: Active / Snoozed
    // (the caller's own BR-78 state), the alert type, and the warehouse.
    const stateList = alertState === 'active' ? alertsList : snoozedAlertsList;
    const inWarehouse = stateList.filter(
      (alert) => alertWarehouseId === undefined || alert.warehouseId === alertWarehouseId,
    );
    const alertTypeCounts = countDashboardAlerts(inWarehouse);
    const visibleAlerts = filterDashboardAlerts(inWarehouse, alertTypeFilter);
    const alertFilterWarehouse = warehouses.find((w) => w.id === alertWarehouseId);
    const alertFilterLabel =
      alertFilterWarehouse === undefined ? t('mainDashboard.allWarehouses') : warehouseShortName(alertFilterWarehouse.name);

    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.subHeaderRow}>
            <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Alerts & Action Center</Text>
          </View>
          <Text style={styles.subHeaderSubtitle}>Warehouse-level problems requiring attention</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          {/* Warehouse filter */}
          <View style={styles.actionCenterFiltersRow}>
            <TouchableOpacity
              style={styles.actionCenterChip}
              onPress={() => {
                // All, then each live warehouse in turn.
                const ids: (string | undefined)[] = [undefined, ...warehouses.map((w) => w.id)];
                const next = (ids.indexOf(alertWarehouseId) + 1) % ids.length;
                setAlertWarehouseId(ids[next]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.actionCenterChipText}>
                {`${alertFilterLabel} ▾`}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionCenterFiltersRow}>
            <ChipGroup
              options={ALERT_STATE_FILTERS}
              value={alertState}
              onChange={setAlertState}
              labelOf={(f) => t(f === 'active' ? 'alerts.filter.active' : 'alerts.filter.snoozed')}
            />
          </View>
          <View style={styles.actionCenterFiltersRow}>
            <ChipGroup
              options={ALERT_TYPE_FILTERS}
              value={alertTypeFilter}
              onChange={setAlertTypeFilter}
              labelOf={(f) => t('dashboardHome.alerts.filterCount', { label: t(ALERT_FILTER_LABEL[f]), count: alertTypeCounts[f] })}
            />
          </View>

          <View style={{ height: 6 }} />

          {/* Alerts List */}
          <SectionGate sources={[alertState === 'active' ? alertsSrc : snoozedAlertsSrc, warehousesSrc]}>
          {visibleAlerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={styles.actionCenterAlertCard}
              onPress={() => {
                dismissMutation.reset();
                snoozeMutation.reset();
                setSelectedAlert(alert);
                navigateWh('alert_detail');
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.alertAccentBar,
                  { backgroundColor: PALETTE.primary },
                ]}
              />
              <View style={styles.actionCenterCardContent}>
                {alert.type === 'LOW_STOCK' ? (
                  <WarningTriangleIcon size={22} color={PALETTE.red} />
                ) : alert.type === 'CAPACITY_NEAR_FULL' ? (
                  <AlertEscalationIcon size={22} color={PALETTE.red} />
                ) : (
                  <AlertClockIcon size={22} color={PALETTE.primary} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionCenterAlertTitle}>{`${alert.warehouse}: ${alert.title}`}</Text>
                  <Text style={styles.actionCenterAlertSub}>{alert.detail}</Text>
                  {alert.snoozedUntil !== null ? (
                    <Text style={styles.actionCenterAlertSub}>{t('alerts.snoozedUntil', { time: alert.snoozedUntil })}</Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {visibleAlerts.length === 0 &&
            (alertState === 'snoozed' ? (
              <EmptyState title={t('alerts.empty.snoozed')} subtitle={t('mainDashboard.alerts.empty.subtitle')} />
            ) : (
              <EmptyState title={t('mainDashboard.alerts.empty.title')} subtitle={t('mainDashboard.alerts.empty.subtitle')} />
            ))}
          </SectionGate>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  };

  const renderAlertDetailScreen = () => {
    if (!selectedAlert) {
      return (
        <View style={styles.subScreenContainer}>
          <View style={styles.subHeaderBanner}>
            <View style={styles.subHeaderRow}>
              <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.subHeaderTitle}>Alert Detail</Text>
            </View>
          </View>
          <EmptyState title="No alert selected" subtitle="Please select an alert from the Alerts & Action Center." />
        </View>
      );
    }

    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.subHeaderRow}>
            <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Alert Detail</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewSectionHeading}>Alert Detail</Text>

          <View style={styles.alertDetailCard}>
            <View style={styles.alertDetailGridRow}>
              <View style={styles.alertDetailGridCol}>
                <Text style={styles.alertDetailFieldLabel}>{t('mainDashboard.alert.type')}</Text>
                <Text style={styles.alertDetailFieldValue}>{selectedAlert.title}</Text>
              </View>
              <View style={styles.alertDetailGridCol}>
                <Text style={styles.alertDetailFieldLabel}>{t('mainDashboard.alert.warehouse')}</Text>
                <Text style={styles.alertDetailFieldValue}>{selectedAlert.warehouse}</Text>
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.alertDetailFieldLabel}>{t('mainDashboard.alert.since')}</Text>
              <Text style={styles.alertDetailFieldValue}>{selectedAlert.time}</Text>
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.alertDetailFieldLabel}>{t('mainDashboard.alert.description')}</Text>
              <Text style={[styles.alertDetailFieldValue, { fontWeight: '500', lineHeight: 20 }]}>
                {selectedAlert.detail}
              </Text>
            </View>

            <View style={styles.alertDetailBtnRow}>
              <TouchableOpacity
                style={styles.openRelatedBtn}
                onPress={() => {
                  navigateWh(ALERT_TARGET_ROUTE[selectedAlert.target]);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.openRelatedBtnText}>Open Related Record</Text>
              </TouchableOpacity>

              {canDismissAlert && !selectedAlert.snoozed ? (
                <TouchableOpacity
                  style={styles.acknowledgeBtn}
                  onPress={() => {
                    void handleSnoozeAlert(selectedAlert);
                  }}
                  disabled={snoozeMutation.isPending || dismissMutation.isPending}
                  activeOpacity={0.8}
                >
                  <Text style={styles.acknowledgeBtnText}>
                    {snoozeMutation.isPending ? t('mainDashboard.alert.snoozing') : t('dashboardHome.alerts.snooze')}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {canDismissAlert ? (
                <TouchableOpacity
                  style={styles.acknowledgeBtn}
                  onPress={() => {
                    void handleDismissAlert(selectedAlert);
                  }}
                  disabled={dismissMutation.isPending || snoozeMutation.isPending}
                  activeOpacity={0.8}
                >
                  <Text style={styles.acknowledgeBtnText}>
                    {dismissMutation.isPending ? t('mainDashboard.alert.dismissing') : t('mainDashboard.alert.dismiss')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {dismissMutation.isError ? (
              <Text style={styles.dismissErrorText}>{t(adminErrorKey(dismissMutation.error))}</Text>
            ) : null}
            {snoozeMutation.isError ? (
              <Text style={styles.dismissErrorText}>{t(adminErrorKey(snoozeMutation.error))}</Text>
            ) : null}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  };

  const renderStockAndTransferScreen = () => {
    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.subHeaderRow}>
            <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ArrowLeftWhiteIcon size={22} color={PALETTE.headerText} />
            </TouchableOpacity>
            <Text style={styles.subHeaderTitle}>Stock & Transfer Overview</Text>
          </View>
          <Text style={styles.subHeaderSubtitle}>Consolidated inventory + inter-warehouse transfers</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollWithFooter} showsVerticalScrollIndicator={false}>
          {/* 1. Consolidated Stock Section */}
          <View style={styles.overviewSectionHeaderRow}>
            <Text style={styles.overviewSectionTitle}>Consolidated Stock</Text>
            <TouchableOpacity onPress={() => navigateWh('consolidated_stock')} activeOpacity={0.7}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>
          <SectionGate sources={[stockSrc]}>
          <View style={styles.stockTableCard}>
            {stockFig.warehouses.map((row, idx) => {
              return (
                <React.Fragment key={row.warehouseId}>
                  {idx > 0 && <View style={styles.stockTableRowDivider} />}
                  <View style={styles.stockTableRow}>
                    <Text style={styles.stockTableLabel}>{row.name}</Text>
                    <Text style={styles.stockTableVal}>{formatKg(row.stockGrams)}</Text>
                  </View>
                </React.Fragment>
              );
            })}
            <View style={styles.stockTableRowDivider} />
            <View style={styles.stockTableRow}>
              <Text style={styles.stockTableTotalLabel}>Total</Text>
              <Text style={styles.stockTableTotalVal}>{formatKg(stockFig.totalGrams)}</Text>
            </View>
          </View>
          </SectionGate>

          {/* 2. Low Stock & Surplus Section */}
          <View style={styles.overviewSectionHeaderRow}>
            <Text style={styles.overviewSectionTitle}>Low Stock & Surplus</Text>
            <TouchableOpacity onPress={() => navigateWh('low_stock_surplus')} activeOpacity={0.7}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>
          <SectionGate sources={[alertsSrc, warehousesSrc]}>
          <TouchableOpacity style={styles.lowStockSummaryCard} onPress={() => navigateWh('low_stock_surplus')} activeOpacity={0.8}>
            <Text style={styles.lowStockSummaryText}>
              {lowStockItems.length > 0
                ? `${lowStockItems.length} products flagged with low stock across warehouses`
                : 'All warehouse products are within standard stock target levels'}
            </Text>
          </TouchableOpacity>
          </SectionGate>

          {/* 3. Transfers Section: needs transfer.inter_warehouse.view */}
          {access.transfers ? (
            <>
              <View style={styles.overviewSectionHeaderRow}>
                <Text style={styles.overviewSectionTitle}>Transfers</Text>
                <TouchableOpacity onPress={() => navigateWh('transfer_tracking')} activeOpacity={0.7}>
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <SectionGate sources={[transfersSrc]}>
              <View style={styles.stockTableCard}>
                <View style={styles.stockTableRow}>
                  <Text style={styles.stockTableLabel}>Pending</Text>
                  <Text style={styles.stockTableVal}>{countLabel(transferFig.counts.pendingApproval, transferFig.counts.exact)}</Text>
                </View>
                <View style={styles.stockTableRowDivider} />
                <View style={styles.stockTableRow}>
                  <Text style={styles.stockTableLabel}>In Transit</Text>
                  <Text style={styles.stockTableVal}>{countLabel(transferFig.counts.inTransit, transferFig.counts.exact)}</Text>
                </View>
                <View style={styles.stockTableRowDivider} />
                <View style={styles.stockTableRow}>
                  <Text style={styles.stockTableLabel}>Received</Text>
                  <Text style={styles.stockTableVal}>{countLabel(transferFig.counts.received, transferFig.counts.exact)}</Text>
                </View>
                <View style={styles.stockTableRowDivider} />
                <View style={styles.stockTableRow}>
                  <Text style={styles.stockTableLabel}>Exceptions</Text>
                  <Text style={[styles.stockTableVal, { color: PALETTE.red }]}>
                    {countLabel(transferFig.counts.discrepancies, transferFig.counts.exact)}
                  </Text>
                </View>
              </View>
              </SectionGate>
            </>
          ) : null}

          <View style={{ height: 90 }} />
        </ScrollView>

        {renderInitiateTransferBar()}
      </View>
    );
  };

  const renderConsolidatedStockScreen = () => {
    const filteredProducts = filterStockProducts(stockFig.products, stockSearchQuery);

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
              placeholder={t('mainDashboard.stock.searchPlaceholder')}
              placeholderTextColor={PALETTE.subTextMuted}
              value={stockSearchQuery}
              onChangeText={setStockSearchQuery}
            />
          </View>

          {/* Product Cards */}
          <SectionGate sources={[stockSrc]}>
          {filteredProducts.map((p) => (
            <View key={p.key} style={styles.consolidatedProductCard}>
              <Text style={styles.consolidatedProductTitle}>{p.label}</Text>
              {p.rows.map((row) => (
                <View key={row.warehouseId}>
                  <View style={styles.stockTableRowDivider} />
                  <View style={styles.stockTableRow}>
                    <Text style={styles.stockTableLabel}>{row.warehouse}</Text>
                    <Text style={styles.stockTableVal}>{formatKg(row.grams)}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.stockTableRowDivider} />
              <View style={styles.stockTableRow}>
                <Text style={styles.stockTableTotalLabel}>Total</Text>
                <Text style={styles.stockTableTotalVal}>{formatKg(p.totalGrams)}</Text>
              </View>
            </View>
          ))}

          {filteredProducts.length === 0 && (
            <EmptyState title="No matching stock" subtitle="No products match your search keyword." />
          )}
          </SectionGate>

          <View style={{ height: 90 }} />
        </ScrollView>

        {renderInitiateTransferBar()}
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

          <SectionGate sources={[alertsSrc, warehousesSrc]}>
          {lowStockItems.map((item, idx) => (
            <View key={`${item.product}-${item.warehouse}-${idx}`} style={styles.lowStockDetailCard}>
              <View style={styles.alertDetailGridRow}>
                <View style={styles.alertDetailGridCol}>
                  <Text style={styles.alertDetailFieldLabel}>Product</Text>
                  <Text style={styles.alertDetailFieldValue}>{item.product}</Text>
                </View>
                <View style={styles.alertDetailGridCol}>
                  <Text style={styles.alertDetailFieldLabel}>Warehouse</Text>
                  <Text style={styles.alertDetailFieldValue}>{item.warehouse}</Text>
                </View>
              </View>

              <View style={[styles.alertDetailGridRow, { marginTop: 14 }]}>
                <View style={styles.alertDetailGridCol}>
                  <Text style={styles.alertDetailFieldLabel}>Current</Text>
                  <Text style={styles.alertDetailFieldValue}>{item.current}</Text>
                </View>
                <View style={styles.alertDetailGridCol}>
                  <Text style={styles.alertDetailFieldLabel}>Target</Text>
                  <Text style={styles.alertDetailFieldValue}>{item.target}</Text>
                </View>
              </View>
            </View>
          ))}

          {lowStockItems.length === 0 && (
            <EmptyState title="No Low Stock" subtitle="All warehouses are stocked within target levels." />
          )}
          </SectionGate>

          <View style={{ height: 90 }} />
        </ScrollView>

        {renderInitiateTransferBar()}
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

          {!access.transfers ? <AdminEmptyState title={t('mainDashboard.notAvailable')} /> : null}
          {access.transfers ? (
          <SectionGate sources={[transfersSrc]}>
          <View style={styles.trackingCard}>
            {transferFig.rows.map((t, idx) => {
              const isLast = idx === transferFig.rows.length - 1;
              const isTransit = t.kind === 'inTransit';
              return (
                <View key={t.id}>
                  <View style={styles.trackingItemRow}>
                    <View style={styles.trackingIconWrap}>
                      <TransferArrowsIcon size={18} color={PALETTE.primary} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.trackingHeaderRow}>
                        <Text style={styles.trackingTitleText}>
                          {t.id} · {t.route}
                        </Text>
                        <View
                          style={[
                            styles.trackingBadgePill,
                            { backgroundColor: isTransit ? adminColors.info.bg : PALETTE.greenPillBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.trackingBadgeText,
                              { color: isTransit ? adminColors.info.text : PALETTE.greenProgress },
                            ]}
                          >
                            {t.statusLabel}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.trackingSubText}>{t.details}</Text>
                    </View>
                  </View>
                  {!isLast && <View style={styles.stockTableRowDivider} />}
                </View>
              );
            })}

            {transferFig.rows.length === 0 && (
              <EmptyState title={t('mainDashboard.transfer.empty.title')} subtitle={t('mainDashboard.transfer.empty.subtitle')} />
            )}
          </View>
          </SectionGate>
          ) : null}

          <View style={{ height: 90 }} />
        </ScrollView>

        {renderInitiateTransferBar()}
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
                  <Grid4SquaresIcon size={20} color={adminColors.onBrand} />
                  <Text style={styles.headerGreetingText}>{t(greetingKey(now), { name: displayName })}</Text>
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
                    <BellOutlineIcon size={19} color={adminColors.onBrand} />
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
                    <ProfileHeaderIcon size={19} color={adminColors.onBrand} />
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
              <Text style={styles.sectionHeading}>Today's Overview</Text>
              <View style={styles.kpiGrid}>
                {/* Total Stock: opens the capacity summary */}
                <TouchableOpacity style={styles.kpiCard} onPress={() => navigateWh('warehouse_capacity')} activeOpacity={0.75}>
                  <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.totalStock')}</Text>
                  <Text style={styles.kpiValue}>
                    {figureOrPlaceholder(stockSrc.status, () => formatKg(stockFig.totalGrams))}
                  </Text>
                  <Text style={styles.kpiSub}>{t('mainDashboard.kpi.inStock')}</Text>
                </TouchableOpacity>

                {/* Incoming Goods: opens Receiving */}
                <TouchableOpacity style={styles.kpiCard} onPress={() => openTab('Receiving')} activeOpacity={0.75}>
                  <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.incoming')}</Text>
                  <Text style={styles.kpiValue}>
                    {figureOrPlaceholder(receiptsFigSrc.status, () => formatKg(receiptFig.grossGrams))}
                  </Text>
                  <Text style={styles.kpiSub}>{t('mainDashboard.kpi.receivedToday')}</Text>
                </TouchableOpacity>

                {/* Pending Transfers: opens the transfer list */}
                {access.transfers ? (
                  <TouchableOpacity style={styles.kpiCard} onPress={() => navigateWh('inter_warehouse_transfer')} activeOpacity={0.75}>
                    <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.pendingTransfers')}</Text>
                    <Text style={styles.kpiValue}>
                      {figureOrPlaceholder(transfersSrc.status, () => countLabel(transferFig.counts.open, transferFig.counts.exact))}
                    </Text>
                    <Text style={styles.kpiSub}>{t('mainDashboard.kpi.notYetReceived')}</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Today's Orders: opens the order list */}
                <TouchableOpacity style={styles.kpiCard} onPress={() => navigateWh('customer_orders')} activeOpacity={0.75}>
                  <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.orders')}</Text>
                  <Text style={styles.kpiValue}>
                    {figureOrPlaceholder(perfTodayFigSrc.status, () => String(perfToday.ordersPlaced))}
                  </Text>
                  <Text style={styles.kpiSub}>{t('mainDashboard.kpi.ordersSub')}</Text>
                </TouchableOpacity>

                {/* Sales: today's paid revenue and how many sales stand behind it */}
                {access.sales ? (
                  <TouchableOpacity
                    style={styles.kpiCard}
                    onPress={() => navigateWh('sales')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.sales')}</Text>
                    <Text style={styles.kpiValue}>{figureOrPlaceholder(revenueSrc.status, () => salesRevenueLabel)}</Text>
                    <Text style={styles.kpiSub}>
                      {t('mainDashboard.kpi.salesSub', { count: figureOrPlaceholder(revenueSrc.status, () => String(salesCount)) })}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* Open Issues: the real operational issues (BR-103), not the alert count */}
                {access.issues ? (
                  <TouchableOpacity style={styles.kpiCard} onPress={() => navigateWh('operational_issues')} activeOpacity={0.75}>
                    <Text style={styles.kpiLabel}>{t('mainDashboard.kpi.openIssues')}</Text>
                    <Text style={styles.kpiValue}>
                      {figureOrPlaceholder(issuesFigSrc.status, () => String(issueFig.total))}
                    </Text>
                    <Text style={styles.kpiSub}>{t('mainDashboard.kpi.openIssuesSub')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {homeKpiSources.some((s) => s.status === 'error') ? (
                <AdminErrorState
                  error={homeKpiSources.find((s) => s.status === 'error')?.error}
                  onRetry={() => retryFailed(homeKpiSources)}
                />
              ) : null}
              {listsPartial ? <Text style={styles.partialNote}>{t('mainDashboard.partial')}</Text> : null}

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

              {/* Warehouse Progress Cards */}
              <SectionGate sources={[stockSrc]}>
              {stockFig.warehouses.length === 0 ? <AdminEmptyState title={t('mainDashboard.noWarehouses')} /> : null}
              {stockFig.warehouses.map((row) => {
                const whName = row.name;
                const level = capacityLevel(row.utilizationBp);
                const fillWidth = `${barWidthPercent(row.utilizationBp)}%` as const;
                const fillColor = level === 'danger' ? PALETTE.red : level === 'warn' ? PALETTE.goldProgress : PALETTE.greenProgress;
                return (
                  <TouchableOpacity
                    key={row.warehouseId}
                    style={styles.whProgressCard}
                    onPress={() => openWarehouseDetail(row.warehouseId)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.whProgressTopRow}>
                      <Text style={styles.whProgressTitle}>{whName}</Text>
                      <ChevronRightGrayIcon size={16} />
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: fillWidth, backgroundColor: fillColor }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
              </SectionGate>

              {/* ─── 3. Today's Operations ─── */}
              <Text style={styles.sectionHeading}>Today's Operations</Text>
              <SectionGate sources={[receiptsFigSrc, taskSummarySrc, perfTodayFigSrc, ...(access.activity ? [activitySrc] : [])]}>
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
                  <Text style={styles.operationsTitle}>Incoming Goods</Text>
                  <View style={styles.operationsMetricsRow}>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.awaitingQc')} <Text style={styles.operationsMetricBold}>{receiptFig.awaitingQc}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      Arrived <Text style={styles.operationsMetricBold}>{receiptFig.arrived}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      Discrepancies <Text style={styles.operationsMetricRed}>{receiptFig.discrepancies}</Text>
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.operationsDivider} />

                {/* Order Fulfilment */}
                <TouchableOpacity
                  style={styles.operationsSection}
                  onPress={() => navigateWh('customer_orders')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.operationsTitle}>{t('mainDashboard.ops.orders')}</Text>
                  <View style={styles.operationsMetricsRow}>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.placed')} <Text style={styles.operationsMetricBold}>{perfToday.ordersPlaced}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.fulfilled')} <Text style={styles.operationsMetricBold}>{perfToday.ordersFulfilled}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.cancelled')} <Text style={styles.operationsMetricRed}>{perfToday.ordersCancelled}</Text>
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.operationsDivider} />

                {/* Quality Issues */}
                <TouchableOpacity
                  style={styles.operationsSection}
                  onPress={() => navigateWh('operational_issues')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.operationsTitle}>Quality Issues</Text>
                  <View style={styles.operationsMetricsRow}>
                    <Text style={styles.operationsMetricText}>
                      Pending <Text style={styles.operationsMetricBold}>{taskSummary === undefined ? FIGURE_PLACEHOLDER : openTaskCount(taskSummary, 'GOODS_RECEIPT_QC')}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      Damage <Text style={styles.operationsMetricBold}>{receiptFig.damaged}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      Rejected <Text style={styles.operationsMetricRed}>{receiptFig.rejected}</Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.returns')} <Text style={styles.operationsMetricBold}>{perfToday.returnsRequested}</Text>
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.operationsDivider} />

                {/* Warehouse-wise Activity Timeline */}
                <TouchableOpacity
                  style={styles.operationsSection}
                  onPress={() => navigateWh('activity_timeline_ops')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.operationsTitle}>Warehouse-wise Activity Timeline</Text>
                  <Text style={styles.operationsTimelineSub}>
                    {access.activity
                      ? activityTimelineLine(activityFeed[0])
                      : goodsReceipts[0]
                        ? t('mainDashboard.timeline.goodsReceived', {
                            grn: goodsReceipts[0].grnNumber,
                            time: relativeTime(goodsReceipts[0].receivedAt, now),
                          })
                        : t('mainDashboard.timeline.empty')}
                  </Text>
                </TouchableOpacity>
              </View>
              </SectionGate>

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
              <SectionGate sources={[alertsSrc, warehousesSrc]}>
              {alertsList.length > 0 ? (
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => {
                    dismissMutation.reset();
                    setSelectedAlert(alertsList[0]!);
                    navigateWh('alert_detail');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.alertAccentBar} />
                  <View style={styles.alertContentRow}>
                    <WarningTriangleIcon size={24} color={PALETTE.red} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.alertTitle}>{`${alertsList[0]!.warehouse}: ${alertsList[0]!.title}`}</Text>
                      <Text style={styles.alertSub}>{alertsList[0]!.detail}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.alertCard}>
                  <View style={[styles.alertAccentBar, { backgroundColor: PALETTE.green }]} />
                  <View style={styles.alertContentRow}>
                    <InfoCircleIcon size={24} color={PALETTE.green} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.alertTitle}>All Warehouses Normal</Text>
                      <Text style={styles.alertSub}>No active alerts or stock exceptions reported</Text>
                    </View>
                  </View>
                </View>
              )}
              </SectionGate>

              {/* ─── 5. Recent Activity ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Recent Activity</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('warehouse_activity')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <SectionGate sources={[openTasksSrc, ...(access.activity ? [activitySrc] : [])]}>
              <View style={styles.recentActivityCard}>
                {/* The newest events (BR-104), then the open tasks #128 lists. */}
                {activityFeed.map((row, idx) => (
                  <React.Fragment key={row.key}>
                    {idx > 0 && <View style={styles.activityDivider} />}
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
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.activityTitle}>
                          {t('mainDashboard.activity.title', { type: row.typeLabel, reference: row.reference })}
                        </Text>
                        <Text style={styles.activitySub}>{activitySubLine(row)}</Text>
                      </View>
                      <Text style={styles.activityTime}>{row.when}</Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
                {activityRows.map((row, idx) => {
                  return (
                    <React.Fragment key={row.id}>
                      {(idx > 0 || activityFeed.length > 0) && <View style={styles.activityDivider} />}
                      <TouchableOpacity
                        style={styles.activityItemRow}
                        onPress={() => navigateWh('activity_timeline_ops')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.activityIconBox}>
                          <TruckIcon size={18} color={PALETTE.primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.activityTitle}>{row.title}</Text>
                          <Text style={styles.activitySub}>{row.subtitle}</Text>
                        </View>
                        <Text style={styles.activityTime}>{row.time}</Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
                {activityFeed.length === 0 && activityRows.length === 0 && (
                  <View style={{ padding: 16 }}>
                    <Text style={[styles.activitySub, { textAlign: 'center' }]}>{t('mainDashboard.activity.none')}</Text>
                  </View>
                )}
              </View>
              </SectionGate>

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
              onViewBatch={openReceivingBatch}
            />
          )
        )}

        {/* ─── Inventory Tab: the shared overview (8 stat cards + sections) ─── */}
        {/* Like Home, the all-warehouses view needs warehouse.all.view; without it a note renders. */}
        {activeTab === 'Inventory' && whSubView === 'overview' && !canAllView && (
          <View style={styles.scroll}>
            <AdminEmptyState title={t('mainDashboard.notAvailable')} />
          </View>
        )}
        {activeTab === 'Inventory' && whSubView === 'overview' && canAllView && (
          <MainInventoryDashboard
            overview={inventoryOverview}
            header={
              <View style={styles.headerBanner}>
                <View style={styles.headerTopRow}>
                  <View style={styles.headerTitleWrap}>
                    <Grid4SquaresIcon size={20} color={adminColors.onBrand} />
                    <Text style={styles.headerGreetingText}>{t('mainDashboard.inventory.title')}</Text>
                  </View>
                </View>

                {/* Warehouse filter pill: the same filter (and modal) as Home */}
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
            }
            onOpen={openInventoryTarget}
            onOpenWarehouse={(warehouseId) => {
              setDetailWarehouseId(warehouseId);
              navigateWh('stock_ledger');
            }}
            extraPendingRows={[
              {
                // Main-only: returns waiting for approval, from the task summary (GET /admin/tasks/summary).
                key: 'returnsApproval',
                label: t('mainDashboard.pending.returnsApproval'),
                value: figureOrPlaceholder(taskSummarySrc.status, () =>
                  String(taskSummary === undefined ? 0 : openTaskCount(taskSummary, 'RETURN_APPROVAL')),
                ),
                onPress: () => openTab('More', 'returns'),
              },
            ]}
          />
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
              warehouseOptions={warehouseOptions}
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
              warehouseOptions={warehouseOptions}
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
              // Open Issues / Operations History tiles need warehouse.all.view. Capacity,
              // issues and activity open inside the flow.
              <StorageFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen="Operations"
                onBack={goBackWh}
                onOpenModule={openMainModule}
                onOpenNotifications={() => navigateWh('warehouse_notifications')}
                onOpenWarehouseOverview={() => navigateWh('warehouse_overview')}
                onSelectWarehouse={(whName) => openWarehouseDetail(findWarehouseByName(warehouses, whName)?.id)}
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
                initialParams={whSubView === 'warehouse_city_detail' ? { warehouseId: detailWarehouseId } : undefined}
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
                warehouseOptions={warehouseOptions}
                initialWarehouseId={detailWarehouseId}
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
              renderStockAndTransferScreen()
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
            ) : whSubView === 'alerts_action_center' ? (
              renderAlertsActionCenterScreen()
            ) : whSubView === 'alert_detail' ? (
              renderAlertDetailScreen()
            ) : isInventoryEntry(whSubView) ? (
              // The four Main-only inventory screens were folded into the shared
              // inventory area (W4); each old sub-view opens the flow on its survivor,
              // and the Inventory tab overview opens the flow on the screen it summarises.
              <InventoryFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                initialScreen={INVENTORY_ENTRY[whSubView]}
                initialParams={
                  whSubView === 'stock_ledger' ? ledgerParams : whSubView === 'inventory_batch_detail' ? batchDetailParams : null
                }
                warehouseOptions={warehouseOptions}
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
                initialWarehouseId={detailWarehouseId}
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
                onViewBatch={openReceivingBatch}
              />
            ) : whSubView === 'order_fulfilment_ops' ? (
              <OrdersFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                warehouseOptions={warehouseOptions}
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
                onViewBatch={openReceivingBatch}
              />
            ) : whSubView === 'customers_list' ? (
              // Shared customer flow (W4); MAIN_WAREHOUSE_SCOPE lists every warehouse's
              // customers with the all-warehouses selector. Wallet, cash top-up (the
              // wallet operations hub), order detail and RMA open inside the flow;
              // New Sale goes to the Main direct-sale flow.
              <CustomersFlow
                scope={MAIN_WAREHOUSE_SCOPE}
                can={can}
                warehouseOptions={warehouseOptions}
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
                        warehouseOptions={warehouseOptions}
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
                warehouseOptions={warehouseOptions}
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
                warehouseOptions={warehouseOptions}
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
            <Text style={styles.filterModalTitle}>Select Warehouse Scope</Text>
            {[{ id: undefined, label: t('mainDashboard.allWarehouses') }, ...warehouses.map((w) => ({ id: w.id, label: warehouseShortName(w.name) }))].map(
              (option) => {
                const isSelected = filterWarehouseId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id ?? 'all'}
                    style={[styles.filterOptionRow, isSelected && styles.filterOptionRowActive]}
                    onPress={() => {
                      setFilterWarehouseId(option.id);
                      if (option.id !== undefined) setDetailWarehouseId(option.id);
                      setShowFilterModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>{option.label}</Text>
                    {isSelected && <Text style={styles.filterCheckmark}>✓</Text>}
                  </TouchableOpacity>
                );
              },
            )}
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
    color: adminColors.onBrand,
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
    color: adminColors.onBrand,
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
    color: adminColors.onBrand,
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
    backgroundColor: adminColors.card,
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
    backgroundColor: adminColors.card,
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
    color: adminColors.onBrand,
  },
  subHeaderSubtitle: {
    fontSize: 13,
    color: adminColors.onBrand,
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
    flexWrap: 'wrap',
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
  partialNote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
  },
  dismissErrorText: {
    marginTop: adminSpacing.md,
    color: adminColors.danger.text,
    textAlign: 'center',
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

