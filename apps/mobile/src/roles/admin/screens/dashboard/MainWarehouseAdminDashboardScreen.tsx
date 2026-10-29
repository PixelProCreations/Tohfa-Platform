import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
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
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { OverviewDashboardCard } from '../../components';
import { fetchMe, hasSessionCredentials, type UserMe } from '../../../farmer/api/auth';
import {
  HOME_CODES,
  HomeFlow,
  MoreScreen,
  type AttentionFilter,
  type HomeTarget,
} from '../warehouse/dashboard-home-more';
import { EmptyState } from '../warehouse/wallet-cashtopup/WalletParts';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { formatKg, parseKgToGrams } from '../../money/quantity';
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
import { InventoryFlow, WarehouseSelector } from '../warehouse/inventory';
import { ReturnsFlow } from '../warehouse/returns-rma';
import { SalesFlow, type SalesRoute, type SalesRouteParams } from '../warehouse/sales-direct';
import { StaffFlow, type StaffRouteParams } from '../warehouse/staff-attendance';
import { StorageFlow, type ActivityModule, type StorageRouteParams } from '../warehouse/storage-ops';
import { TransfersFlow, type TransferRoute } from '../warehouse/transfers';
import { WarehouseAdminFlow, type WarehouseAdminRoute } from '../warehouse/warehouse-admin';
import { ReceivingFlow, receivingRouteFor } from '../warehouse/receiving-qc';
import {
  NotificationsFlow,
  type NotificationsRoute,
} from '../warehouse/notifications';
import { nearFullSignalOf, type CapacityTone } from '../warehouse/warehouse-admin/overviewFigures';
import { useWarehouseNetwork } from '../warehouse/warehouse-admin/useWarehouseNetwork';
import { dismissAlert } from '../../api/alerts';
import {
  countGoodsReceiptsWithStatus,
  countOrdersWithStatus,
  getActiveAlerts,
  getActiveBatches,
  getOpenPurchaseOrders,
  getRecentActivityPages,
  getUnreadNotificationCount,
  getWarehousePerformances,
} from '../../api/dashboardFeeds';
import { adminErrorKey } from '../../api/errors';
import { useAdminMutation, useAdminQuery } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { getSalesSummary } from '../../api/sales';
import { listWarehouseTransfers } from '../../api/warehouseTransfers';
import { t } from '../../i18n';
import { istDay } from '../../utils/datetime';
import {
  ALERT_TYPE_FILTERS,
  FIGURE_PLACEHOLDER,
  activityTimelineLine,
  alertFilterLabel,
  combineStatus,
  countLabel,
  deriveCapacityRows,
  deriveExpectedToday,
  deriveOpenIssues,
  deriveProductStock,
  deriveReceiptFigures,
  deriveTransfers,
  figureOr,
  filterDashboardAlerts,
  filterProductStock,
  findWarehouseByName,
  formatKgFigure,
  greetingText,
  mergeRecentActivity,
  salesRevenueText,
  sectionStatus,
  sumOrdersPlaced,
  toDashboardAlerts,
  toLowStockItems,
  toOverviewCards,
  toWarehouseOptions,
  warehouseShortName,
  type AlertTypeFilter,
  type DashboardAlert,
  type Derived,
  type QueryLike,
  type SectionStatus,
} from './mappers_mainDashboard';

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
  primary: adminColors.brand,
  headerBg: adminColors.brand,
  headerBgDark: adminColors.brandDeep,
  headerPillBg: adminColors.brandDeep,
  headerText: adminColors.onBrand,

  orangeDeep: adminColors.brandDeep,
  primarySoft: adminColors.brandTint,
  pageBg: adminColors.canvas,

  // Neutrals (Page 1)
  textInk: adminColors.ink,
  textSecondary: adminColors.muted,
  textMuted: adminColors.muted,
  border: adminColors.border,
  borderLight: adminColors.canvas,
  cardBg: adminColors.card,
  primaryBorder: adminColors.border,

  // Semantic Colors (Page 2)
  amber: adminColors.warning.text,
  amberBg: adminColors.warning.bg,
  green: adminColors.success.text,
  greenBg: adminColors.success.bg,
  greenText: adminColors.success.text,

  red: adminColors.danger.text,
  redBg: adminColors.danger.bg,
  redBorder: adminColors.danger.border,

  tabInactive: adminColors.muted,
  tabActive: adminColors.brand,
  tabBorder: adminColors.border,
  goldProgress: adminColors.warning.text,
  greenProgress: adminColors.success.text,
  trackBg: adminColors.border,
  divider: adminColors.border,
  goldBg: adminColors.warning.bg,
  greenPillBg: adminColors.success.bg,
  brandBrown: adminColors.brandDeep,
  subTextMuted: adminColors.muted,
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
  | 'manage_swas'
  | 'storage_locations'
  | 'location_detail'
  | 'warehouse_capacity'
  | 'warehouse_activity'
  | 'operational_issues'
  | 'report_operational_issue'
  | 'staff'
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
  | 'warehouse_profile'
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

function BellOutlineIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
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

function ChevronRightGrayIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterFunnelWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 20, color = adminColors.danger.text }: { size?: number; color?: string }) {
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



function StockVerificationIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 7h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 17h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
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
  warehouse_overview: 'WarehouseOverview',
  warehouse_city_detail: 'WarehouseCityDetail',
  manage_swas: 'ManageSubWarehouseAdmins',
  warehouse_performance: 'WarehousePerformance',
  warehouse_capacity: 'WarehouseCapacity',
};

/** Old Main inventory sub-views -> shared InventoryFlow route keys (design ids). */
const INVENTORY_ENTRY = {
  stock_ledger: 'M3S06',
  verify_stock: 'M3S10',
  stock_adjustment_approval: 'M3S17',
  low_stock_alerts: 'M3S09',
} as const;

/**
 * Main-only screens opened from the shared More menu. The old
 * MainWarehouseMoreScreen rendered these itself as local fallbacks; the shared
 * MoreScreen is role-neutral, so this shell supplies them via onNavigateTo*.
 */
type MainMoreSubScreen = 'wallet' | 'returns' | 'finance' | 'reports' | 'staff' | 'admin' | 'settings';

/** Recent Activity rows the Home card shows (the design's two). */
const RECENT_ACTIVITY_ROWS = 2;
/** Warehouse brief cards on the Home (the design's two; "View All" opens every warehouse). */
const HOME_BRIEF_CARDS = 2;

/** Home brief-bar colour per capacity tone: the design's green unless the server flagged the warehouse (CAPACITY_NEAR_FULL). */
const HOME_CAPACITY_BAR: Record<CapacityTone, string> = {
  neutral: PALETTE.greenProgress,
  nearFull: PALETTE.goldProgress,
  over: PALETTE.red,
};

/** One data source of a dashboard section: its state, what it threw, and how to run it again. */
interface Source {
  status: SectionStatus;
  error: unknown;
  retry: () => void;
}

function sourceOf(query: QueryLike & { refetch: () => unknown }, derived?: Derived<unknown> | null): Source {
  const failedDerivation = derived !== undefined && derived !== null && !derived.ok;
  return {
    status: failedDerivation ? 'error' : sectionStatus(query),
    // A malformed server value is worded as the generic admin error (adminErrorKey).
    error: failedDerivation ? new Error('dashboard data') : query.error,
    retry: () => {
      void query.refetch();
    },
  };
}

function statusOf(sources: readonly Source[]): SectionStatus {
  return combineStatus(sources.map((x) => x.status));
}

/** The error-with-Retry block for a group of sources, or null while none failed. */
function SourcesError({ sources }: { sources: readonly Source[] }) {
  const failed = sources.filter((x) => x.status === 'error');
  if (failed.length === 0) return null;
  return <AdminErrorState error={failed[0]?.error} onRetry={() => failed.forEach((x) => x.retry())} />;
}

/** The value of a Derived, or `fallback` (never drawn: a status gate stands in front of it). */
function valueOr<T>(d: Derived<T> | null, fallback: T): T {
  return d !== null && d.ok ? d.value : fallback;
}

const NO_ITEMS: readonly never[] = [];

export interface MainWarehouseAdminDashboardScreenProps {
  onSignOut: () => void;
  /** Kept for hosts (App.tsx passes it); the shell no longer leaves to an App key (Create SWA is in-shell, W4). */
  onNavigate?: (screen: string) => void;
  initialTab?: MainWHTab;
  initialMoreSubScreen?: MainMoreSubScreen | null;
  initialWhSubView?: WarehouseSubView;
  initialInventoryScreen?: string;
  initialInventoryParams?: any;
}

export function MainWarehouseAdminDashboardScreen({
  onSignOut,
  onNavigate,
  initialTab,
  initialMoreSubScreen,
  initialWhSubView,
  initialInventoryScreen,
  initialInventoryParams,
}: MainWarehouseAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<MainWHTab>(initialTab || 'Home');
  const [receivingSubView, setReceivingSubView] = useState<ReceivingSubView>('dashboard');
  const [activeReceivingRoute, setActiveReceivingRoute] = useState<string>('Dashboard');
  const [whSubView, setWhSubView] = useState<WarehouseSubView>('overview');
  const [ordersInitialScreen, setOrdersInitialScreen] = useState<string>('M5S01');
  const [ordersInitialParams, setOrdersInitialParams] = useState<Record<string, unknown> | null>(null);
  const [returnToMoreSubScreen, setReturnToMoreSubScreen] = useState<MainMoreSubScreen | null>(null);
  const [moreSubScreen, setMoreSubScreen] = useState<MainMoreSubScreen | null>(initialMoreSubScreen || null);
  const [inventoryInitialScreen, setInventoryInitialScreen] = useState<string | undefined>(
    initialInventoryScreen || 'M3S01'
  );
  const [inventoryInitialParams, setInventoryInitialParams] = useState<any>(
    initialInventoryParams || null
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (initialMoreSubScreen !== undefined) {
      setMoreSubScreen(initialMoreSubScreen);
    }
    if (initialWhSubView) {
      setWhSubView(initialWhSubView);
    }
    if (initialInventoryScreen) {
      setInventoryInitialScreen(initialInventoryScreen);
    }
    if (initialInventoryParams !== undefined) {
      setInventoryInitialParams(initialInventoryParams);
    }
  }, [initialTab, initialMoreSubScreen, initialWhSubView, initialInventoryScreen, initialInventoryParams]);
  const [whHistory, setWhHistory] = useState<WarehouseSubView[]>([]);
  const [selectedWHFilter, setSelectedWHFilter] = useState('All Warehouses');
  const [selectedWHName, setSelectedWHName] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  /** Filter the Sales hub's Needs Attention card opened the queue on. */
  const [attentionCategory, setAttentionCategory] = useState<AttentionFilter>('all');
  const [selectedAlert, setSelectedAlert] = useState<DashboardAlert | null>(null);
  // Alerts & Action Center filters: a live warehouse uuid (undefined = all) and an API alert type.
  const [alertWhFilter, setAlertWhFilter] = useState<string | undefined>(undefined);
  const [alertCategoryFilter, setAlertCategoryFilter] = useState<AlertTypeFilter>('all');
  const [showAlertsFilterModal, setShowAlertsFilterModal] = useState(false);
  const [tempAlertWh, setTempAlertWh] = useState<string | undefined>(undefined);
  const [tempAlertCategory, setTempAlertCategory] = useState<AlertTypeFilter>('all');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [user, setUser] = useState<UserMe | null>(null);
  // Permissions come from GET /v1/auth/me, retried until it answers: the demo
  // sign-in opens this shell without waiting for its token, so a one-shot fetch
  // could leave every gate closed for the session. Until a list arrives makeCan
  // fails closed; in __DEV__ only, after the retries, the MAIN_WH_ADMIN grants
  // from docs/rbac.json stand in (../../permissions/warehousePermissions.ts).
  // The server still authorises every call (CLAUDE.md 2.1).
  const { permissions, isLoading } = useWarehousePermissions({
    enabled: true,
    adminRole: 'MAIN_WH_ADMIN',
    isDev: __DEV__,
    loadPermissions: async () => {
      const me = await fetchMe();
      setUser(me);
      return me.permissions ?? [];
    },
    hasCredentials: hasSessionCredentials,
  });
  const can = useMemo(() => makeCan(permissions), [permissions]);
  const canAllView = can(HOME_CODES.allView);
  // The Notifications list (not D01-D05) still runs on its own sample list; the Home bell reads the server's unread total.


  // ─── Live data (D01 Home, D02, D04 Stock & Transfer, D05 Alerts) ─────────────
  // The IST day: the sales summary and receipts count Asia/Kolkata days (BR-96).
  const now = new Date();
  const today = istDay(now);
  // Nothing is requested without warehouse.all.view (until /auth/me answers the Home shows the loader).
  const net = useWarehouseNetwork({
    can,
    enabled: canAllView,
    // The header filter is kept by name (the other tabs read it); the live uuid is looked up from it (BR-30).
    warehouseId: undefined,
    today,
  });
  const liveFilterWarehouse =
    selectedWHFilter === 'All Warehouses' ? undefined : findWarehouseByName(net.warehouses, selectedWHFilter);
  const liveWarehouseId = liveFilterWarehouse?.id;
  // Scoped to the header filter. With no filter this is the same query (same key) as `net`.
  const home = useWarehouseNetwork({ can, enabled: canAllView, warehouseId: liveWarehouseId, today });
  const access = home.access;
  const listed = home.warehousesQuery.data !== undefined;
  const coveredKey = home.coveredIds.join(',');
  const selectedWHId = liveWarehouseId;
  const homeSelectorOptions: readonly WarehouseScope[] = useMemo(() => toWarehouseOptions(net.warehouses), [net.warehouses]);
  const warehouseIdForName = useCallback(
    (name: string): string | undefined => findWarehouseByName(net.warehouses, name)?.id,
    [net.warehouses],
  );

  const handleSelectWarehouseScope = (whId: string | undefined) => {
    if (whId === undefined) {
      setSelectedWHFilter('All Warehouses');
    } else {
      const match = net.warehouses.find((w) => w.id === whId);
      if (match) {
        setSelectedWHFilter(warehouseShortName(match.name));
        setSelectedWHName(match.name);
      }
    }
  };

  // GET /warehouse-transfers (BR-102), newest first; the counts say when the page is not every transfer.
  const transfersQuery = useAdminQuery(
    adminKeys.scoped('transfers', liveWarehouseId, { resource: 'list', pageSize: 100 }),
    (signal) => listWarehouseTransfers({ warehouseId: liveWarehouseId, pageSize: 100 }, signal),
    { enabled: canAllView && access.transfers },
  );
  // GET /admin/sales/summary for the IST day (BR-96).
  const salesQuery = useAdminQuery(
    adminKeys.scoped('sales', liveWarehouseId, { resource: 'summary', from: today, to: today }),
    (signal) => getSalesSummary({ warehouseId: liveWarehouseId, from: today, to: today }, signal),
    { enabled: canAllView && access.sales },
  );
  // GET /warehouses/{id}/performance for today (BR-80): orders placed, exact.
  const perfTodayQuery = useAdminQuery(
    adminKeys.scoped('warehouses', liveWarehouseId, { resource: 'performance', from: today, to: today, ids: coveredKey }),
    (signal) => getWarehousePerformances(home.coveredIds, { from: today, to: today }, signal),
    { enabled: canAllView && listed },
  );
  // GET /admin/purchase-orders still open: what is expected today.
  const openPosQuery = useAdminQuery(
    adminKeys.scoped('receiving', liveWarehouseId, { resource: 'open-pos' }),
    (signal) => getOpenPurchaseOrders(liveWarehouseId, signal),
    { enabled: canAllView && access.purchaseOrders },
  );
  // GET /admin/orders?status=READY_FOR_PICKUP, every page (the list has no total).
  const readyOrdersQuery = useAdminQuery(
    adminKeys.scoped('orders', liveWarehouseId, { resource: 'count', status: 'READY_FOR_PICKUP' }),
    (signal) => countOrdersWithStatus('READY_FOR_PICKUP', liveWarehouseId, signal),
    { enabled: canAllView && access.orders },
  );
  // GET /admin/goods-receipts?status=AWAITING_QC, every page: receipts still waiting for their quality check.
  const awaitingQcQuery = useAdminQuery(
    adminKeys.scoped('receiving', liveWarehouseId, { resource: 'count', status: 'AWAITING_QC' }),
    (signal) => countGoodsReceiptsWithStatus('AWAITING_QC', liveWarehouseId, signal),
    { enabled: canAllView && access.receipts },
  );
  // GET /warehouses/{id}/activity first page of each covered warehouse (BR-104).
  const activityQuery = useAdminQuery(
    adminKeys.scoped('warehouseActivity', liveWarehouseId, { resource: 'recent', ids: coveredKey, limit: 5 }),
    (signal) => getRecentActivityPages(home.coveredIds, 5, signal),
    { enabled: canAllView && listed && access.activity },
  );
  // GET /admin/batches ACTIVE: product names and per-product stock, read only where they are shown.
  const batchesQuery = useAdminQuery(
    adminKeys.scoped('inventory', liveWarehouseId, { resource: 'batches', status: 'ACTIVE' }),
    (signal) => getActiveBatches(liveWarehouseId, signal),
    { enabled: canAllView && access.batches && (whSubView === 'consolidated_stock' || whSubView === 'low_stock_surplus') },
  );
  // The Alerts & Action Center lists every warehouse's alerts (its own filter narrows them).
  const allAlertsQuery = useAdminQuery(
    adminKeys.scoped('alerts', undefined, { resource: 'list', state: 'active' }),
    (signal) => getActiveAlerts(undefined, signal),
    { enabled: canAllView && access.alerts },
  );
  // The bell badge: the server's unread total (BR-65).
  const unreadQuery = useAdminQuery(
    adminKeys.scoped('notifications', undefined, { resource: 'unread-count' }),
    (signal) => getUnreadNotificationCount(signal),
    { enabled: can('notification.own.view') },
  );
  const unreadNotifCount = unreadQuery.data ?? 0;
  // POST /admin/alerts/{itemKey}/dismiss: "Acknowledge" hides the alert from THIS admin's lists
  // until its condition changes; other admins keep seeing it (BR-78).
  const dismissMutation = useAdminMutation({
    mutationFn: (itemKey: string) => dismissAlert(itemKey),
    invalidates: [adminKeys.module('alerts')],
  });

  // Every figure comes from the pure derivations in ./mappers_mainDashboard.ts. A malformed
  // server value fails its derivation, which draws the error state, never a zero.
  const capacityD = useMemo(
    () => (home.capacitiesQuery.data === undefined ? null : deriveCapacityRows(home.warehouses, home.capacitiesQuery.data)),
    [home.warehouses, home.capacitiesQuery.data],
  );
  const capacityFig = valueOr(capacityD, { rows: [], totalUsedGrams: 0 });
  const receiptsD = useMemo(
    () => (home.receiptsTodayQuery.data === undefined ? null : deriveReceiptFigures(home.receiptsTodayQuery.data.items)),
    [home.receiptsTodayQuery.data],
  );
  const receiptFig = valueOr(receiptsD, { arrived: 0, discrepancies: 0, damaged: 0, rejected: 0, grossGramsByWarehouse: {} });
  const receiptsExact = home.receiptsTodayQuery.data?.complete ?? true;
  const expectedD = useMemo(
    () => (openPosQuery.data === undefined ? null : deriveExpectedToday(openPosQuery.data.items, today)),
    [openPosQuery.data, today],
  );
  const expectedFig = valueOr(expectedD, { count: 0, grams: 0 });
  const expectedExact = openPosQuery.data?.complete ?? true;
  const ordersPlacedD = useMemo(() => (perfTodayQuery.data === undefined ? null : sumOrdersPlaced(perfTodayQuery.data)), [perfTodayQuery.data]);
  const revenueD = useMemo(() => (salesQuery.data === undefined ? null : salesRevenueText(salesQuery.data)), [salesQuery.data]);
  const issuesD = useMemo(
    () => (home.issuesQuery.data === undefined ? null : deriveOpenIssues(home.issuesQuery.data, home.coveredIds)),
    [home.issuesQuery.data, home.coveredIds],
  );
  const transfersD = useMemo(
    () => (transfersQuery.data === undefined ? null : deriveTransfers(transfersQuery.data.items, transfersQuery.data.total, net.warehouses)),
    [transfersQuery.data, net.warehouses],
  );
  const transferFig = valueOr(transfersD, {
    counts: { pendingApproval: 0, inTransit: 0, received: 0, cancelled: 0, discrepancies: 0, open: 0, exact: true },
    rows: [],
  });
  const homeAlerts = useMemo(
    () => toDashboardAlerts(home.alertsQuery.data?.items ?? NO_ITEMS, net.warehouses, now),
    // `now` changes every render, so the times are as of the last data change.
    [home.alertsQuery.data, net.warehouses],
  );
  const centerAlerts = useMemo(
    () => toDashboardAlerts(allAlertsQuery.data?.items ?? NO_ITEMS, net.warehouses, now),
    [allAlertsQuery.data, net.warehouses],
  );
  const activityRows = useMemo(
    () => mergeRecentActivity(activityQuery.data ?? NO_ITEMS, net.warehouses, now, RECENT_ACTIVITY_ROWS),
    [activityQuery.data, net.warehouses],
  );
  const productStockD = useMemo(
    () => (batchesQuery.data === undefined ? null : deriveProductStock(batchesQuery.data.items, net.warehouses)),
    [batchesQuery.data, net.warehouses],
  );
  const lowStockItems = useMemo(
    () => toLowStockItems(home.alertsQuery.data?.items ?? NO_ITEMS, batchesQuery.data?.items ?? NO_ITEMS, net.warehouses),
    [home.alertsQuery.data, batchesQuery.data, net.warehouses],
  );
  const lowStockCount = lowStockItems.length;
  const homeCards = toOverviewCards(capacityFig.rows, nearFullSignalOf(home.alertsQuery.data), null, null).slice(0, HOME_BRIEF_CARDS);

  const stockSrc: Source[] = [sourceOf(home.warehousesQuery), sourceOf(home.capacitiesQuery, capacityD)];
  const receiptsSrc = sourceOf(home.receiptsTodayQuery, receiptsD);
  const expectedSrc = sourceOf(openPosQuery, expectedD);
  const transfersSrc = sourceOf(transfersQuery, transfersD);
  const ordersPlacedSrc = sourceOf(perfTodayQuery, ordersPlacedD);
  const revenueSrc = sourceOf(salesQuery, revenueD);
  const issuesSrc = sourceOf(home.issuesQuery, issuesD);
  const readySrc = sourceOf(readyOrdersQuery);
  const awaitingQcSrc = sourceOf(awaitingQcQuery);
  const activitySrc = sourceOf(activityQuery);
  const homeAlertsSrc = sourceOf(home.alertsQuery);
  const centerAlertsSrc: Source[] = [sourceOf(allAlertsQuery), sourceOf(net.warehousesQuery)];
  const batchesSrc = sourceOf(batchesQuery, productStockD);
  const stockStatus = statusOf(stockSrc);
  const kpiSources: Source[] = [
    ...stockSrc,
    ordersPlacedSrc,
    ...(access.purchaseOrders ? [expectedSrc] : []),
    ...(access.transfers ? [transfersSrc] : []),
    ...(access.sales ? [revenueSrc] : []),
    ...(access.issues ? [issuesSrc] : []),
  ];
  const opsSources: Source[] = [
    ...(access.purchaseOrders ? [expectedSrc] : []),
    ...(access.receipts ? [receiptsSrc, awaitingQcSrc] : []),
    ...(access.orders ? [readySrc] : []),
    ...(access.activity ? [activitySrc] : []),
  ];
  const kgFigure = (grams: number, exact: boolean) => `${formatKgFigure(grams)}${exact ? '' : '+'}`;

  const navigateWh = (view: WarehouseSubView) => {
    setWhHistory((prev) => [...prev, whSubView]);
    setWhSubView(view);
  };

  const goBackWh = () => {
    setOrdersInitialScreen('M5S01');
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
    setOrdersInitialScreen('M5S01');
    setReturnToMoreSubScreen(null);
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
    else if (module === 'staff') navigateWh('staff');
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
      onExportActivity={() => Alert.alert('Export Successful', 'Operational history log has been exported to CSV.')}
    />
  );

  const renderNotificationsFlow = (initialScreen: NotificationsRoute) => (
    <NotificationsFlow
      scope={MAIN_WAREHOUSE_SCOPE}
      can={can}
      initialScreen={initialScreen}
      onBack={() => {
        goBackWh();
        void unreadQuery.refetch();
      }}
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



  const renderWarehouseComparisonScreen = () => {
    if (isLoading || net.warehousesQuery.isLoading || net.capacitiesQuery.isLoading) {
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
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={adminColors.brand} />
          </View>
        </View>
      );
    }

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

    if (net.warehousesQuery.error || net.capacitiesQuery.error) {
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
          <AdminErrorState
            error={net.warehousesQuery.error ?? net.capacitiesQuery.error}
            onRetry={() => {
              void net.warehousesQuery.refetch();
              void net.capacitiesQuery.refetch();
            }}
          />
        </View>
      );
    }

    const capacities = net.capacitiesQuery.data;

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

          <View style={styles.comparisonCard}>
            {net.warehouses.map((wh, idx) => {
              const cap = capacities?.get(wh.id);
              const usedGrams = cap?.usedKg ? parseKgToGrams(cap.usedKg) : null;
              const usedFormatted = usedGrams !== null ? formatKg(usedGrams) : '—';
              const utilPct = cap?.utilizationPercent != null ? `${Math.floor(cap.utilizationPercent)}%` : '—';
              const comparisonStat = `${usedFormatted} · ${utilPct}`;

              return (
                <React.Fragment key={wh.id}>
                  {idx > 0 && <View style={styles.rowDivider} />}
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonWhName}>{wh.name}</Text>
                    <Text style={styles.comparisonWhStat}>{comparisonStat}</Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderAlertsActionCenterScreen = () => {
    // GET /admin/alerts (BR-77), every warehouse; the filter narrows by warehouse uuid and API alert type.
    const visibleAlerts = filterDashboardAlerts(centerAlerts, { warehouseId: alertWhFilter, type: alertCategoryFilter });
    const alertsStatus = statusOf(centerAlertsSrc);
    const hasActiveAlertFilters = alertWhFilter !== undefined || alertCategoryFilter !== 'all';

    // The design's Status (Unread / Resolved) and Priority sections are not drawn: AlertItem
    // carries neither a read state nor a priority, and none is invented.
    const ALERT_WAREHOUSES: readonly { id: string | undefined; label: string }[] = [
      { id: undefined, label: t('mainDashboard.allWarehouses') },
      ...net.warehouses.map((w) => ({ id: w.id, label: w.name })),
    ];

    return (
      <View style={styles.subScreenContainer}>
        <View style={styles.subHeaderBanner}>
          <View style={styles.alertsHeaderTopRow}>
            <View style={styles.subHeaderRow}>
              <TouchableOpacity onPress={goBackWh} style={styles.backBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.subHeaderTitle}>Alerts & Action Center</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setTempAlertWh(alertWhFilter);
                setTempAlertCategory(alertCategoryFilter);
                setShowAlertsFilterModal(true);
              }}
              style={styles.alertsHeaderFilterBtn}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={{ position: 'relative' }}>
                <FilterFunnelWhiteIcon size={20} color={adminColors.onBrand} />
                {hasActiveAlertFilters && <View style={styles.alertsFilterActiveDot} />}
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.subHeaderSubtitle}>Warehouse-level problems requiring attention</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.subScrollPad} showsVerticalScrollIndicator={false}>
          <View style={{ height: 4 }} />

          {alertsStatus === 'loading' ? <AdminLoadingState /> : null}
          <SourcesError sources={centerAlertsSrc} />

          {/* Alerts List */}
          {alertsStatus === 'ready' && visibleAlerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={styles.actionCenterAlertCard}
              onPress={() => {
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
                  <Text style={styles.actionCenterAlertTitle}>{alert.title}</Text>
                  <Text style={styles.actionCenterAlertSub}>{alert.subtitle}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {alertsStatus === 'ready' && visibleAlerts.length === 0 && (
            <EmptyState title="No alerts" subtitle="There are no active alerts matching your filter criteria." />
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Filter Full Screen Modal matching Screen 2 */}
        <Modal
          visible={showAlertsFilterModal}
          animationType="slide"
          onRequestClose={() => setShowAlertsFilterModal(false)}
        >
          <SafeAreaView style={styles.alertsFullScreenFilterModal}>
            <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

            {/* Top Orange Header */}
            <View style={styles.alertsFilterModalHeader}>
              <TouchableOpacity
                onPress={() => setShowAlertsFilterModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <ArrowLeftWhiteIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.alertsFilterModalTitle}>Filter Alerts & Actions</Text>
              <TouchableOpacity
                onPress={() => setShowAlertsFilterModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.alertsFilterCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.alertsFilterModalScroll}
              contentContainerStyle={styles.alertsFilterModalScrollContent}
            >
              {/* Section 1: Warehouse */}
              <View style={styles.alertsFilterSection}>
                <Text style={styles.alertsFilterSectionTitle}>WAREHOUSE</Text>
                <View style={styles.alertsChipWrap}>
                  {ALERT_WAREHOUSES.map((wh) => {
                    const active = tempAlertWh === wh.id;
                    return (
                      <TouchableOpacity
                        key={wh.id ?? 'all'}
                        style={[styles.alertsFilterChip, active && styles.alertsFilterChipActive]}
                        onPress={() => setTempAlertWh(wh.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.alertsFilterChipText, active && styles.alertsFilterChipTextActive]}>
                          {wh.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Section 2: Channel / Category */}
              <View style={styles.alertsFilterSection}>
                <Text style={styles.alertsFilterSectionTitle}>CHANNEL / CATEGORY</Text>
                <View style={styles.alertsChipWrap}>
                  {ALERT_TYPE_FILTERS.map((cat) => {
                    const active = tempAlertCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.alertsFilterChip, active && styles.alertsFilterChipActive]}
                        onPress={() => setTempAlertCategory(cat)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.alertsFilterChipText, active && styles.alertsFilterChipTextActive]}>
                          {alertFilterLabel(cat)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            </ScrollView>

            {/* Modal Footer Buttons */}
            <View style={styles.alertsFilterFooter}>
              <TouchableOpacity
                style={styles.alertsModalApplyBtn}
                onPress={() => {
                  setAlertWhFilter(tempAlertWh);
                  setAlertCategoryFilter(tempAlertCategory);
                  setShowAlertsFilterModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.alertsModalApplyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alertsModalResetBtn}
                onPress={() => {
                  setTempAlertWh(undefined);
                  setTempAlertCategory('all');
                  setAlertWhFilter(undefined);
                  setAlertCategoryFilter('all');
                  setShowAlertsFilterModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.alertsModalResetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    );
  };

  /** "Open Related Record": the screen that owns the alert's subject. */
  const openAlertRecord = (alert: DashboardAlert) => {
    if (alert.target === 'lowStock') navigateWh('low_stock_alerts');
    else if (alert.target === 'capacity') navigateWh('warehouse_overview');
    else openTab('Inventory');
  };

  /** "Acknowledge" = POST /admin/alerts/{itemKey}/dismiss: success is reported only after the server accepted it (BR-78). */
  const acknowledgeAlert = async (alert: DashboardAlert) => {
    try {
      await dismissMutation.mutateAsync(alert.id);
    } catch (err) {
      Alert.alert(t('mainDashboard.alert.acknowledgeFailed.title'), t(adminErrorKey(err)));
      return;
    }
    Alert.alert(t('mainDashboard.alert.acknowledged.title'), t('mainDashboard.alert.acknowledged.body', { title: alert.title }));
    dismissMutation.reset();
    goBackWh();
  };

  const renderAlertDetailScreen = () => {
    const alert = selectedAlert;
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

          {alert === null ? (
            <EmptyState title="No alerts" subtitle="There are no active alerts matching your filter criteria." />
          ) : (
          <View style={styles.alertDetailCard}>
            {/* Alert ID and Priority are not drawn: the itemKey is not a human number and AlertItem has no priority. */}
            <View style={styles.alertDetailGridRow}>
              <View style={styles.alertDetailGridCol}>
                <Text style={styles.alertDetailFieldLabel}>{t('mainDashboard.alert.detail.category')}</Text>
                <Text style={styles.alertDetailFieldValue}>{alert.typeLabel}</Text>
              </View>
            </View>

            <View style={[styles.alertDetailGridRow, { marginTop: 14 }]}>
              <View style={styles.alertDetailGridCol}>
                <Text style={styles.alertDetailFieldLabel}>{t('mainDashboard.alert.detail.warehouse')}</Text>
                <Text style={styles.alertDetailFieldValue}>{alert.warehouse}</Text>
              </View>
            </View>

            {alert.time !== '' ? (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.alertDetailFieldLabel}>{t('mainDashboard.alert.detail.time')}</Text>
              <Text style={styles.alertDetailFieldValue}>{alert.time}</Text>
            </View>
            ) : null}

            <View style={{ marginTop: 14 }}>
              <Text style={styles.alertDetailFieldLabel}>{t('mainDashboard.alert.detail.description')}</Text>
              <Text style={[styles.alertDetailFieldValue, { fontWeight: '500', lineHeight: 20 }]}>
                {alert.description}
              </Text>
            </View>

            <View style={styles.alertDetailBtnRow}>
              <TouchableOpacity
                style={styles.openRelatedBtn}
                onPress={() => openAlertRecord(alert)}
                activeOpacity={0.8}
              >
                <Text style={styles.openRelatedBtnText}>Open Related Record</Text>
              </TouchableOpacity>

              {access.alerts ? (
              <TouchableOpacity
                style={styles.acknowledgeBtn}
                onPress={() => {
                  void acknowledgeAlert(alert);
                }}
                disabled={dismissMutation.isPending}
                activeOpacity={0.8}
              >
                <Text style={styles.acknowledgeBtnText}>Acknowledge</Text>
              </TouchableOpacity>
              ) : null}
            </View>
          </View>
          )}

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
          {stockStatus === 'loading' ? <AdminLoadingState /> : null}
          <SourcesError sources={stockSrc} />
          {stockStatus === 'ready' ? (
          <View style={styles.stockTableCard}>
            {/* Each covered warehouse's stock in use (GET /warehouses/{id}/capacity usedKg, BR-66). */}
            {capacityFig.rows.map((row) => (
              <React.Fragment key={row.warehouseId}>
                <View style={styles.stockTableRow}>
                  <Text style={styles.stockTableLabel}>{row.name}</Text>
                  <Text style={styles.stockTableVal}>{t('mainDashboard.kgUpper', { value: formatKgFigure(row.usedGrams) })}</Text>
                </View>
                <View style={styles.stockTableRowDivider} />
              </React.Fragment>
            ))}
            <View style={styles.stockTableRow}>
              <Text style={styles.stockTableTotalLabel}>{t('mainDashboard.stock.total')}</Text>
              <Text style={styles.stockTableTotalVal}>
                {t('mainDashboard.kgUpper', { value: formatKgFigure(capacityFig.totalUsedGrams) })}
              </Text>
            </View>
          </View>
          ) : null}

          {/* 2. Low Stock & Surplus Section */}
          <View style={styles.overviewSectionHeaderRow}>
            <Text style={styles.overviewSectionTitle}>Low Stock & Surplus</Text>
            <TouchableOpacity onPress={() => navigateWh('low_stock_surplus')} activeOpacity={0.7}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.lowStockSummaryCard} onPress={() => navigateWh('low_stock_surplus')} activeOpacity={0.8}>
            {/* LOW_STOCK alerts (BR-77). "Surplus" is not drawn: no API figure says a warehouse has surplus. */}
            <Text style={styles.lowStockSummaryText}>
              {figureOr(homeAlertsSrc.status, () =>
                lowStockCount === 0
                  ? t('mainDashboard.lowStock.none')
                  : t('mainDashboard.lowStock.summary', { count: countLabel(lowStockCount, home.alertsQuery.data?.complete ?? true) }),
              )}
            </Text>
          </TouchableOpacity>

          {/* 3. Transfers Section */}
          <View style={styles.overviewSectionHeaderRow}>
            <Text style={styles.overviewSectionTitle}>Transfers</Text>
            <TouchableOpacity onPress={() => navigateWh('transfer_tracking')} activeOpacity={0.7}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>
          {access.transfers ? (
          <View style={styles.stockTableCard}>
            {/* GET /warehouse-transfers (BR-102); "Exceptions" = received short (hasDiscrepancy). */}
            <View style={styles.stockTableRow}>
              <Text style={styles.stockTableLabel}>Pending</Text>
              <Text style={styles.stockTableVal}>
                {figureOr(transfersSrc.status, () => countLabel(transferFig.counts.pendingApproval, transferFig.counts.exact))}
              </Text>
            </View>
            <View style={styles.stockTableRowDivider} />
            <View style={styles.stockTableRow}>
              <Text style={styles.stockTableLabel}>In Transit</Text>
              <Text style={styles.stockTableVal}>
                {figureOr(transfersSrc.status, () => countLabel(transferFig.counts.inTransit, transferFig.counts.exact))}
              </Text>
            </View>
            <View style={styles.stockTableRowDivider} />
            <View style={styles.stockTableRow}>
              <Text style={styles.stockTableLabel}>Received</Text>
              <Text style={styles.stockTableVal}>
                {figureOr(transfersSrc.status, () => countLabel(transferFig.counts.received, transferFig.counts.exact))}
              </Text>
            </View>
            <View style={styles.stockTableRowDivider} />
            <View style={styles.stockTableRow}>
              <Text style={styles.stockTableLabel}>Exceptions</Text>
              <Text style={[styles.stockTableVal, { color: PALETTE.red }]}>
                {figureOr(transfersSrc.status, () => countLabel(transferFig.counts.discrepancies, transferFig.counts.exact))}
              </Text>
            </View>
          </View>
          ) : null}
          {access.transfers ? <SourcesError sources={[transfersSrc]} /> : null}

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Pinned Bottom Button */}
        <View style={styles.fixedBottomBar}>
          <TouchableOpacity
            style={styles.initiateTransferBtn}
            onPress={() => {
              if (can(HOME_CODES.transferInitiate)) {
                navigateWh('initiate_new_transfer');
              } else {
                Alert.alert('Permission Denied', 'Transfer initiation requires transfer.inter_warehouse.initiate permission.');
              }
            }}
            activeOpacity={0.8}
          >
            <TransferArrowsWhiteIcon size={18} />
            <Text style={styles.initiateTransferBtnText}>Initiate Stock Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderConsolidatedStockScreen = () => {
    // GET /admin/batches ACTIVE, per product and grade, per warehouse (integer grams).
    const products = valueOr(productStockD, []);
    const filteredProducts = filterProductStock(products, stockSearchQuery);

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

          {batchesSrc.status === 'loading' ? <AdminLoadingState /> : null}
          <SourcesError sources={[batchesSrc]} />

          {/* Product Cards */}
          {batchesSrc.status === 'ready' && filteredProducts.map((p) => (
            <View key={p.key} style={styles.consolidatedProductCard}>
              <Text style={styles.consolidatedProductTitle}>{p.label}</Text>
              {p.rows.map((row) => (
                <View key={row.warehouseId}>
                  <View style={styles.stockTableRowDivider} />
                  <View style={styles.stockTableRow}>
                    <Text style={styles.stockTableLabel}>{row.warehouse}</Text>
                    <Text style={styles.stockTableVal}>{t('mainDashboard.kgUpper', { value: formatKgFigure(row.grams) })}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.stockTableRowDivider} />
              <View style={styles.stockTableRow}>
                <Text style={styles.stockTableTotalLabel}>Total</Text>
                <Text style={styles.stockTableTotalVal}>{t('mainDashboard.kgUpper', { value: formatKgFigure(p.totalGrams) })}</Text>
              </View>
            </View>
          ))}

          {batchesSrc.status === 'ready' && products.length === 0 && <EmptyState title={t('mainDashboard.stock.none')} />}
          {batchesSrc.status === 'ready' && products.length > 0 && filteredProducts.length === 0 && (
            <EmptyState title="No matching stock" subtitle="No products match your search keyword." />
          )}

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Pinned Bottom Button */}
        <View style={styles.fixedBottomBar}>
          <TouchableOpacity
            style={styles.initiateTransferBtn}
            onPress={() => {
              if (can(HOME_CODES.transferInitiate)) {
                navigateWh('initiate_new_transfer');
              } else {
                Alert.alert('Permission Denied', 'Transfer initiation requires transfer.inter_warehouse.initiate permission.');
              }
            }}
            activeOpacity={0.8}
          >
            <TransferArrowsWhiteIcon size={18} />
            <Text style={styles.initiateTransferBtnText}>Initiate Stock Transfer</Text>
          </TouchableOpacity>
        </View>
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

          {/* LOW_STOCK alerts: current = the server's totalQtyKg, target = its thresholdKg (no surplus figure exists). */}
          {statusOf([homeAlertsSrc, batchesSrc]) === 'loading' ? <AdminLoadingState /> : null}
          <SourcesError sources={[homeAlertsSrc, batchesSrc]} />
          {statusOf([homeAlertsSrc, batchesSrc]) === 'ready' && lowStockItems.length === 0 ? (
            <EmptyState title={t('mainDashboard.lowStock.none')} />
          ) : null}
          {statusOf([homeAlertsSrc, batchesSrc]) === 'ready' && lowStockItems.map((item) => (
            <View key={item.id} style={styles.lowStockDetailCard}>
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

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Pinned Bottom Button */}
        <View style={styles.fixedBottomBar}>
          <TouchableOpacity
            style={styles.initiateTransferBtn}
            onPress={() => {
              if (can(HOME_CODES.transferInitiate)) {
                navigateWh('initiate_new_transfer');
              } else {
                Alert.alert('Permission Denied', 'Transfer initiation requires transfer.inter_warehouse.initiate permission.');
              }
            }}
            activeOpacity={0.8}
          >
            <TransferArrowsWhiteIcon size={18} />
            <Text style={styles.initiateTransferBtnText}>Initiate Stock Transfer</Text>
          </TouchableOpacity>
        </View>
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

          {transfersSrc.status === 'loading' ? <AdminLoadingState /> : null}
          <SourcesError sources={[transfersSrc]} />
          {transfersSrc.status === 'ready' && transferFig.rows.length === 0 ? <EmptyState title={t('mainDashboard.transfer.none')} /> : null}
          {transfersSrc.status === 'ready' && transferFig.rows.length > 0 ? (
          <View style={styles.trackingCard}>
            {transferFig.rows.map((tr, idx) => {
              const isLast = idx === transferFig.rows.length - 1;
              const isTransit = tr.kind !== 'received';
              return (
                <View key={tr.id}>
                  <View style={styles.trackingItemRow}>
                    <View style={styles.trackingIconWrap}>
                      <TransferArrowsIcon size={18} color={PALETTE.primary} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.trackingHeaderRow}>
                        <Text style={styles.trackingTitleText}>
                          {tr.id} · {tr.route}
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
                            {tr.statusLabel}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.trackingSubText}>{tr.details}</Text>
                    </View>
                  </View>
                  {!isLast && <View style={styles.stockTableRowDivider} />}
                </View>
              );
            })}
          </View>
          ) : null}

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Pinned Bottom Button */}
        <View style={styles.fixedBottomBar}>
          <TouchableOpacity
            style={styles.initiateTransferBtn}
            onPress={() => {
              if (can(HOME_CODES.transferInitiate)) {
                navigateWh('initiate_new_transfer');
              } else {
                Alert.alert('Permission Denied', 'Transfer initiation requires transfer.inter_warehouse.initiate permission.');
              }
            }}
            activeOpacity={0.8}
          >
            <TransferArrowsWhiteIcon size={18} />
            <Text style={styles.initiateTransferBtnText}>Initiate Stock Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      <View style={{ flex: 1 }}>
        {/* ─── Main Dashboard View (Module 1 - Main Dashboard) ─── */}
        {/* Multi-warehouse Home needs warehouse.all.view; while permissions are loading show indicator. */}
        {activeTab === 'Home' && whSubView === 'overview' && isLoading && (
          <View style={[styles.scroll, styles.loadingCenter]}>
            <ActivityIndicator size="large" color={adminColors.brand} />
          </View>
        )}
        {activeTab === 'Home' && whSubView === 'overview' && !isLoading && !canAllView && (
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
                  <Text style={styles.headerGreetingText}>{greetingText(now, user?.fullName)}</Text>
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
                    <BellOutlineIcon size={20} color={adminColors.onBrand} />
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
              <WarehouseSelector
                scope={MAIN_WAREHOUSE_SCOPE}
                options={homeSelectorOptions}
                selectedId={liveWarehouseId}
                onSelect={handleSelectWarehouseScope}
              />
            </View>

            {/* Content Container */}
            <View style={styles.contentBody}>
              {/* ─── 1. Today's Overview (KPI Grid) ─── */}
              <Text style={styles.sectionHeading}>Today's Overview</Text>
              <View style={styles.kpiGrid}>
                {/* Total Stock */}
                <OverviewDashboardCard
                  value={figureOr(stockStatus, () => formatKgFigure(capacityFig.totalUsedGrams))}
                  title="Total Stock"
                  subtitle="KG in warehouse"
                  icon="inventory"
                  onPress={() => {
                    setActiveTab('Inventory');
                    setWhSubView('overview');
                    setWhHistory([]);
                  }}
                />

                {/* Incoming Goods: ordered kg of the open purchase orders due today */}
                {access.purchaseOrders ? (
                <OverviewDashboardCard
                  value={figureOr(expectedSrc.status, () => kgFigure(expectedFig.grams, expectedExact))}
                  title="Incoming Goods"
                  subtitle="KG expected today"
                  icon="receiving"
                  onPress={() => {
                    setActiveTab('Receiving');
                    setReceivingSubView('incoming_shipments');
                    setWhSubView('overview');
                    setWhHistory([]);
                  }}
                />
                ) : null}

                {/* Pending Transfers: pending approval + in transit (BR-102) */}
                {access.transfers ? (
                <OverviewDashboardCard
                  value={figureOr(transfersSrc.status, () => countLabel(transferFig.counts.open, transferFig.counts.exact))}
                  title="Pending Transfers"
                  subtitle="Transfers active"
                  icon="truck"
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                />
                ) : null}

                {/* Today's Orders */}
                <OverviewDashboardCard
                  value={figureOr(ordersPlacedSrc.status, () => String(valueOr(ordersPlacedD, 0)))}
                  title="Today's Orders"
                  subtitle="Customer orders"
                  icon="orders"
                  onPress={() => {
                    setOrdersInitialScreen('M5S02');
                    navigateWh('customer_orders');
                  }}
                />

                {/* Sales: today's paid revenue (BR-96) */}
                {access.sales ? (
                <OverviewDashboardCard
                  value={figureOr(revenueSrc.status, () => valueOr(revenueD, FIGURE_PLACEHOLDER))}
                  title="Today's Sales"
                  subtitle="Direct sales"
                  icon="sales"
                  onPress={() => navigateWh('sales')}
                />
                ) : null}

                {/* Open Issues: open + in-progress operational issues (BR-103) */}
                {access.issues ? (
                <OverviewDashboardCard
                  value={figureOr(issuesSrc.status, () => String(valueOr(issuesD, { total: 0, byWarehouse: {} }).total))}
                  title="Open Issues"
                  subtitle="Needs attention"
                  icon="alert"
                  tone={issuesSrc.status === 'ready' && valueOr(issuesD, { total: 0, byWarehouse: {} }).total > 0 ? 'danger' : 'default'}
                  onPress={() => navigateWh('operational_issues')}
                />
                ) : null}
              </View>
              <SourcesError sources={kpiSources} />

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

              {/* Brief capacity bars (GET /warehouses/{id}/capacity, near full from CAPACITY_NEAR_FULL) */}
              {stockStatus === 'loading' ? <AdminLoadingState /> : null}
              <SourcesError sources={stockSrc} />
              {stockStatus === 'ready' && homeCards.length === 0 ? <EmptyState title={t('mainDashboard.overview.none')} /> : null}
              {stockStatus === 'ready' &&
                homeCards.map((card) => (
              <TouchableOpacity
                key={card.warehouseId}
                style={styles.whProgressCard}
                onPress={() => {
                  setSelectedWHName(net.warehouses.find((w) => w.id === card.warehouseId)?.name ?? card.name);
                  navigateWh('warehouse_city_detail');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.whProgressTopRow}>
                  <Text style={styles.whProgressTitle}>{card.name}</Text>
                  <ChevronRightGrayIcon size={16} />
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${card.barWidth}%`, backgroundColor: HOME_CAPACITY_BAR[card.tone] }]} />
                </View>
              </TouchableOpacity>
                ))}

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
                  <Text style={styles.operationsTitle}>Incoming Goods</Text>
                  <View style={styles.operationsMetricsRow}>
                    {access.purchaseOrders ? (
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.expected')}{' '}
                      <Text style={styles.operationsMetricBold}>
                        {figureOr(expectedSrc.status, () => countLabel(expectedFig.count, expectedExact))}
                      </Text>
                    </Text>
                    ) : null}
                    {access.receipts ? (
                    <>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.arrived')}{' '}
                      <Text style={styles.operationsMetricBold}>
                        {figureOr(receiptsSrc.status, () => countLabel(receiptFig.arrived, receiptsExact))}
                      </Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.discrepancies')}{' '}
                      <Text style={styles.operationsMetricRed}>
                        {figureOr(receiptsSrc.status, () => countLabel(receiptFig.discrepancies, receiptsExact))}
                      </Text>
                    </Text>
                    </>
                    ) : null}
                  </View>
                </TouchableOpacity>

                <View style={styles.operationsDivider} />

                {/* Order Fulfilment — each metric deep-links to its own OrdersFlow screen. */}
                <View style={styles.operationsSection}>
                  <TouchableOpacity
                    onPress={() => {
                      setOrdersInitialScreen('M5S02');
                      navigateWh('customer_orders');
                    }}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                  >
                    <Text style={styles.operationsTitle}>Order Fulfilment</Text>
                  </TouchableOpacity>
                  <View style={styles.operationsMetricsRow}>
                    {access.orders ? (
                    <TouchableOpacity
                      onPress={() => {
                        setOrdersInitialScreen('M5S09');
                        navigateWh('customer_orders');
                      }}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                    >
                      <Text style={styles.operationsMetricText}>
                        {t('mainDashboard.ops.ready')}{' '}
                        <Text style={styles.operationsMetricBold}>
                          {figureOr(readySrc.status, () => countLabel(readyOrdersQuery.data?.count ?? 0, readyOrdersQuery.data?.exact ?? true))}
                        </Text>
                      </Text>
                    </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <View style={styles.operationsDivider} />

                {/* Quality Issues */}
                <TouchableOpacity
                  style={styles.operationsSection}
                  onPress={() => navigateWh('operational_issues')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.operationsTitle}>Quality Issues</Text>
                  {access.receipts ? (
                  <View style={styles.operationsMetricsRow}>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.pending')}{' '}
                      <Text style={styles.operationsMetricBold}>
                        {figureOr(awaitingQcSrc.status, () => countLabel(awaitingQcQuery.data?.count ?? 0, awaitingQcQuery.data?.exact ?? true))}
                      </Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.damage')}{' '}
                      <Text style={styles.operationsMetricBold}>
                        {figureOr(receiptsSrc.status, () => countLabel(receiptFig.damaged, receiptsExact))}
                      </Text>
                    </Text>
                    <Text style={styles.operationsMetricText}>
                      {t('mainDashboard.ops.rejected')}{' '}
                      <Text style={styles.operationsMetricRed}>
                        {figureOr(receiptsSrc.status, () => countLabel(receiptFig.rejected, receiptsExact))}
                      </Text>
                    </Text>
                  </View>
                  ) : null}
                </TouchableOpacity>

                <View style={styles.operationsDivider} />

                {/* Warehouse-wise Activity Timeline */}
                <TouchableOpacity
                  style={styles.operationsSection}
                  onPress={() => navigateWh('activity_timeline_ops')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.operationsTitle}>Warehouse-wise Activity Timeline</Text>
                  {access.activity ? (
                  <Text style={styles.operationsTimelineSub}>
                    {figureOr(activitySrc.status, () => activityTimelineLine(activityRows[0]))}
                  </Text>
                  ) : null}
                </TouchableOpacity>
              </View>
              <SourcesError sources={opsSources} />

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
              {access.alerts ? (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => {
                  setSelectedAlert(homeAlerts[0] ?? null);
                  navigateWh('alerts_action_center');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.alertAccentBar} />
                <View style={styles.alertContentRow}>
                  <WarningTriangleIcon size={24} color={PALETTE.red} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.alertTitle}>
                      {figureOr(homeAlertsSrc.status, () => homeAlerts[0]?.title ?? t('mainDashboard.alert.none'))}
                    </Text>
                    <Text style={styles.alertSub}>Warehouse exceptions, escalations and transfer issues</Text>
                  </View>
                </View>
              </TouchableOpacity>
              ) : null}
              {access.alerts ? <SourcesError sources={[homeAlertsSrc]} /> : null}

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
              {access.activity ? (
              <View style={styles.recentActivityCard}>
                {/* The newest events of the covered warehouses (GET /warehouses/{id}/activity, BR-104) */}
                {activitySrc.status === 'loading' ? <AdminLoadingState /> : null}
                {activitySrc.status === 'ready' && activityRows.length === 0 ? (
                  <View style={styles.activityItemRow}>
                    <Text style={styles.activitySub}>{t('mainDashboard.activity.none')}</Text>
                  </View>
                ) : null}
                {activitySrc.status === 'ready' &&
                  activityRows.map((row, idx) => (
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
                    <Text style={styles.activityTitle}>{row.title}</Text>
                    <Text style={styles.activitySub}>{row.warehouse}</Text>
                  </View>
                  <Text style={styles.activityTime}>{row.time}</Text>
                </TouchableOpacity>
                </React.Fragment>
                  ))}
              </View>
              ) : null}
              {access.activity ? <SourcesError sources={[activitySrc]} /> : null}

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
                    navigateWh('warehouse_overview');
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
              onScreenChange={(route) => setActiveReceivingRoute(route)}
              onBack={() => {
                if (receivingSubView !== 'dashboard') {
                  setReceivingSubView('dashboard');
                } else {
                  setActiveTab('Home');
                  setWhSubView('overview');
                }
                setActiveReceivingRoute('Dashboard');
              }}
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

        {/* ─── Inventory Tab ─── */}
        {activeTab === 'Inventory' && whSubView === 'overview' && (
          <InventoryFlow
            scope={
              selectedWHId
                ? { warehouseId: selectedWHId, warehouseName: selectedWHName }
                : MAIN_WAREHOUSE_SCOPE
            }
            can={can}
            initialScreen={inventoryInitialScreen || 'M3S01'}
            initialParams={inventoryInitialParams}
            onBack={() => {
              setInventoryInitialScreen(undefined);
              setInventoryInitialParams(null);
              setActiveTab('Home');
              setWhSubView('overview');
            }}
            onInitiateTransfer={() => navigateWh('initiate_new_transfer')}
            warehouseOptions={homeSelectorOptions}
            onTabChange={(tab) => {
              setInventoryInitialScreen(undefined);
              setInventoryInitialParams(null);
              handleMoreTabChange(tab);
            }}
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
                setOrdersInitialScreen('M5S02');
                setReturnToMoreSubScreen('finance');
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
              onAssignDelivery={(driver) => {
                setOrdersInitialScreen('M5S01');
                setOrdersInitialParams({
                  warehouseId: driver?.warehouseId,
                });
                setReturnToMoreSubScreen('staff');
                setMoreSubScreen(null);
                navigateWh('customer_orders');
              }}
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
            />
          ) : (
            <WarehouseAdminFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen="WarehouseOverview"
              onBack={() => setMoreSubScreen(null)}
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
            onProfileCardPress={() => setMoreSubScreen('admin')}
            onNavigateToWarehouseManagement={() => setMoreSubScreen('admin')}
            onNavigateToWallet={() => setMoreSubScreen('wallet')}
            onNavigateToReturns={() => setMoreSubScreen('returns')}
            onNavigateToFinance={() => setMoreSubScreen('finance')}
            onNavigateToReports={() => setMoreSubScreen('reports')}
            onNavigateToStaff={() => setMoreSubScreen('staff')}
            onNavigateToAttendance={() => navigateWh('staff_attendance')}
            onNavigateToOrders={() => {
              setOrdersInitialScreen('M5S01');
              navigateWh('customer_orders');
            }}
            onNavigateToSales={() => navigateWh('sales')}
            onNavigateToCustomers={() => navigateWh('customers_list')}
            onNavigateToBilling={() => navigateWh('billing_invoices')}
            onNavigateToWarehouseOperations={() => navigateWh('warehouse_operations')}
            onNavigateToProfile={() => navigateWh('warehouse_profile')}
            onNavigateToNotifications={() => navigateWh('warehouse_notifications')}
            // The More row is the account hub ("Manage account and application settings",
            // FINAL_LIST #84); warehouse settings stay reachable from Warehouse Overview.
            onNavigateToSettings={() => setMoreSubScreen('settings')}
          />
        )}

        {/* ─── Sub Views for Interactive Navigation (shared across all tabs) ─── */}
        {whSubView !== 'overview' && (
          whSubView === 'warehouse_profile' ? (
            // Warehouse Profile screen (WarehouseInfoScreen in ProfileFlow)
            // Notice: no onTabChange passed, so no bottom nav bar is rendered in Warehouse Profile or its inner screens
            <ProfileFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen="WarehouseProfile"
              onBack={goBackWh}
              onLogout={onSignOut}
            />
          ) : whSubView === 'profile' ? (
            // The admin's own profile is the shared UserProfileScreen (W4, absorbs
            // MainWarehouseProfileScreen); Main sees the all-warehouses account.
            <ProfileFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen="UserProfile"
              onBack={goBackWh}
              onLogout={onSignOut}
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
            // Open Issues / Operations History tiles need warehouse.all.view.
            // Capacity, issues and activity open inside the flow.
            <StorageFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen="Operations"
              onBack={goBackWh}
              onOpenModule={openMainModule}
              onExportActivity={() => Alert.alert('Export Successful', 'Operational history log has been exported to CSV.')}
              onOpenNotifications={() => navigateWh('warehouse_notifications')}
              onOpenWarehouseOverview={() => navigateWh('warehouse_overview')}
              onSelectWarehouse={(whName) => {
                setSelectedWHName(whName);
                navigateWh('warehouse_city_detail');
              }}
              onManageCapacity={() => navigateWh('warehouse_settings')}
            />
          ) : whSubView === 'warehouse_comparison' ? (
            renderWarehouseComparisonScreen()
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
              onManageWarehouses={() => navigateWh('manage_swas')}
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
            selectedLocationId ? (
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
            ) : (
              <AdminEmptyState title="No storage location" subtitle="Select a storage location to view its details." />
            )
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
          ) : whSubView === 'staff' ? (
            <StaffFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen="Staff"
              onBack={goBackWh}
              onTabChange={handleMoreTabChange}
              onAssignDelivery={(driver) => {
                setOrdersInitialScreen('M5S01');
                setOrdersInitialParams({
                  warehouseId: driver?.warehouseId,
                });
                navigateWh('customer_orders');
              }}
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
          ) : whSubView === 'stock_ledger' ||
            whSubView === 'verify_stock' ||
            whSubView === 'stock_adjustment_approval' ||
            whSubView === 'low_stock_alerts' ? (
            // The four Main-only inventory screens were folded into the shared
            // inventory area (W4); each old sub-view opens the flow on its survivor.
            <InventoryFlow
              scope={
                selectedWHId
                  ? { warehouseId: selectedWHId, warehouseName: selectedWHName }
                  : MAIN_WAREHOUSE_SCOPE
              }
              can={can}
              initialScreen={INVENTORY_ENTRY[whSubView]}
              initialParams={whSubView === 'stock_ledger' ? { warehouseName: selectedWHName } : null}
              onBack={goBackWh}
              onInitiateTransfer={() => navigateWh('inter_warehouse_transfer')}
              warehouseOptions={homeSelectorOptions}
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
              initialScreen={ordersInitialScreen}
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
                      initialParams={{ orderId: p.order?.orderNo ?? p.orderNo, customerName: p.customer?.name }}
                      onBack={nav.back}
                      onViewIssue={() => navigateWh('operational_issues')}
                    />
                  );
                }
                if (target === 'RmaDetail') {
                  return (
                    <ReturnsFlow scope={MAIN_WAREHOUSE_SCOPE} can={can} initialScreen="ReturnsIssues" onBack={nav.back} />
                  );
                }
                return null;
              }}
            />
          ) : whSubView === 'customer_orders' ? (
            <OrdersFlow
              scope={MAIN_WAREHOUSE_SCOPE}
              can={can}
              initialScreen={ordersInitialScreen}
              initialParams={ordersInitialParams}
              onBack={() => {
                setOrdersInitialScreen('M5S01');
                setOrdersInitialParams(null);
                if (returnToMoreSubScreen) {
                  const target = returnToMoreSubScreen;
                  setReturnToMoreSubScreen(null);
                  setWhSubView('overview');
                  setMoreSubScreen(target);
                } else {
                  goBackWh();
                }
              }}
              onViewIssue={() => navigateWh('operational_issues')}
              onTabChange={(tab) => {
                setOrdersInitialScreen('M5S01');
                setOrdersInitialParams(null);
                setReturnToMoreSubScreen(null);
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

      {/* ─── Bottom Navigation Tab Bar (Home, Receiving, Inventory, More ONLY) ─── */}
      {((activeTab === 'Home' && whSubView === 'overview') ||
        (activeTab === 'Receiving' && receivingSubView === 'dashboard' && activeReceivingRoute === 'Dashboard') ||
        (activeTab === 'Inventory' && whSubView === 'overview') ||
        (activeTab === 'More' && whSubView === 'overview' && moreSubScreen === null)) && (
          <View style={styles.bottomTabBar}>
            {/* Home */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                setActiveTab('Home');
                setMoreSubScreen(null);
                setWhSubView('overview');
                setWhHistory([]);
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
                setMoreSubScreen(null);
                setReceivingSubView('dashboard');
                setActiveReceivingRoute('Dashboard');
                setWhSubView('overview');
                setWhHistory([]);
              }}
              accessibilityRole="tab"
              activeOpacity={0.7}
            >
              <ReceivingTabNavIcon active={activeTab === 'Receiving'} />
              <Text style={[styles.tabLabel, activeTab === 'Receiving' && styles.tabLabelActive]}>Receiving</Text>
            </TouchableOpacity>

            {/* Inventory */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => {
                setActiveTab('Inventory');
                setMoreSubScreen(null);
                setWhSubView('overview');
                setWhHistory([]);
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
                setMoreSubScreen(null);
                setWhSubView('overview');
                setWhHistory([]);
              }}
              accessibilityRole="tab"
              activeOpacity={0.7}
            >
              <MoreTabNavIcon active={(activeTab as string) === 'More'} />
              <Text style={[styles.tabLabel, (activeTab as string) === 'More' && styles.tabLabelActive]}>More</Text>
            </TouchableOpacity>
          </View>
        )}
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
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: adminColors.danger.text,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  notificationBadgeText: {
    color: adminColors.onBrand,
    fontSize: 9,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: adminColors.onBrand,
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
    shadowColor: adminColors.ink,
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
    shadowColor: adminColors.ink,
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
    backgroundColor: PALETTE.cardBg,
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
  summaryDivider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  inventoryActivityText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.ink,
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
    backgroundColor: adminColors.toast.bg,
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
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  greenBadgeText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.success.text,
  },
  needsAttentionAlertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: adminColors.brandTint,
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
  alertsHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertsHeaderFilterBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertsFilterActiveDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.onBrand,
    borderWidth: 1.5,
    borderColor: PALETTE.headerBg,
  },
  alertsFullScreenFilterModal: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  alertsFilterModalHeader: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertsFilterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  alertsFilterCloseText: {
    fontSize: 20,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  alertsFilterModalScroll: {
    flex: 1,
  },
  alertsFilterModalScrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  alertsFilterSection: {
    marginBottom: 22,
  },
  alertsFilterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.muted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  alertsChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  alertsFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  alertsFilterChipActive: {
    backgroundColor: adminColors.card,
    borderColor: PALETTE.headerBg,
  },
  alertsFilterChipText: {
    fontSize: 13.5,
    color: adminColors.ink,
    fontWeight: '500',
  },
  alertsFilterChipTextActive: {
    color: PALETTE.headerBg,
    fontWeight: '700',
  },
  alertsFilterFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  alertsModalApplyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: PALETTE.headerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertsModalApplyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  alertsModalResetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertsModalResetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
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
    shadowColor: adminColors.ink,
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
    shadowColor: adminColors.ink,
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
    shadowColor: adminColors.ink,
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
    shadowColor: adminColors.ink,
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
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: adminSpacing.xxl,
  },
});

