import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../admin/theme';
import { fetchMe, type UserMe } from '../../farmer/api/auth';
import { OverviewDashboardCard } from '../../admin/components';
import {
  GoodsReceivingWizardScreen,
  ReceivingFlow,
  ReceivingHistoryDetailScreen,
  receivingRouteFor,
  type IncomingShipment,
  type ReceivingRoute,
  type ReceivingRouteParams,
  type ReceivingWizardStep,
} from '../../admin/screens/warehouse/receiving-qc';
import {
  NotificationsFlow,
  type NotificationItem,
  type NotificationsRoute,
  type NotificationsRouteParams,
} from '../../admin/screens/warehouse/notifications';
import { useAdminQuery } from '../../admin/api/hooks';
import { adminKeys } from '../../admin/api/queryKeys';
import {
  countGoodsReceiptsWithStatus,
  countOrdersWithStatus,
  getActiveAlerts,
  getActiveBatches,
  getGoodsReceiptsOnDay,
  getOpenPurchaseOrders,
  getRecentActivityPages,
  getUnreadNotificationCount,
} from '../../admin/api/dashboardFeeds';
import { listAdminOrders } from '../../admin/api/orders';
import { getCashTopupsReport, getSalesReport } from '../../admin/api/reports';
import { getInventoryOverview, listAllocations } from '../../admin/api/inventory';
import { formatKg, parseKgToGrams } from '../../admin/money/quantity';
import { t } from '../../admin/i18n';
import { formatAdminDate, formatAdminTime, istDay } from '../../admin/utils/datetime';
import { formatPaise, parseRupeesToPaise } from '../../admin/money/paise';
import { greetingText } from '../../admin/screens/dashboard/mappers_mainDashboard';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../admin/screens/warehouse/shared/AsyncStates';
import {
  buildSubRmaRecord,
  deriveSubCashSummary,
  deriveSubLowStockAlert,
  deriveSubLowStockCount,
  deriveSubReceivingKpi,
  deriveSubSalesSummary,
  deriveSubTodayReceiving,
  filterSubActivities,
  mapSubWarehouseActivity,
} from './mappers_subDashboard';
import { ReportsScreen } from '../../admin/screens/warehouse/reports';
import { SalesFlow } from '../../admin/screens/warehouse/sales-direct';
import { WalletFlow, walletParamsForCustomer } from '../../admin/screens/warehouse/wallet-cashtopup';
import {
  HOME_CODES,
  HomeFlow,
  MoreScreen,
  type HomeRoute,
  type HomeRouteParams,
} from '../../admin/screens/warehouse/dashboard-home-more';
import {
  CustomersFlow,
  type CustomersRoute,
  type CustomersRouteParams,
} from '../../admin/screens/warehouse/customers';
import { BillingFlow } from '../../admin/screens/warehouse/billing-invoices';
import { StaffFlow, type AttendanceFilter, type StaffRoute } from '../../admin/screens/warehouse/staff-attendance';
import {
  StorageFlow,
  type ActivityModule,
  type StorageRoute,
  type StorageRouteParams,
} from '../../admin/screens/warehouse/storage-ops';
import {
  ExpenseDetailScreen,
  FinanceFlow,
  type PermissionCheck,
  type WarehouseScope,
} from '../../admin/screens/warehouse/finance-expenses';
import { ProfileFlow, type ProfileRoute } from '../../admin/screens/warehouse/profile-settings';
import { InventoryFlow } from '../../admin/screens/warehouse/inventory';
import { OrdersFlow } from '../../admin/screens/warehouse/orders';
import {
  ReturnsFlow,
  type ReturnsRoute,
  type ReturnsRouteParams,
  type ReturnsStackEntry,
  type RmaRecord,
} from '../../admin/screens/warehouse/returns-rma';

// ─── Design Tokens (TOHFA Admin App Design System) ───────────────────────────
const PALETTE = {
  primary: adminColors.brand,
  primaryDark: adminColors.brandDeep,
  primarySoft: adminColors.brandTint,
  primaryBorder: adminColors.border,
  pageBg: adminColors.canvas,
  cardBg: adminColors.card,
  textInk: adminColors.ink,
  textSecondary: adminColors.muted,
  textMuted: adminColors.muted,
  border: adminColors.border,
  divider: adminColors.border,
  greenBadge: adminColors.success.bg,
  greenText: adminColors.success.text,
  greenDot: adminColors.success.text,
  amberBadge: adminColors.warning.bg,
  amberText: adminColors.warning.text,
  amberIconBg: adminColors.warning.bg,
  redBadge: adminColors.danger.bg,
  redText: adminColors.danger.text,
  redIconBg: adminColors.danger.bg,
  tealBadge: adminColors.info.bg,
  tealText: adminColors.info.text,
  tabInactive: adminColors.muted,
  tabBorder: adminColors.border,
  linkText: adminColors.brand,
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function WarehouseHeaderIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileHeaderIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockBadgeIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={adminColors.onBrand} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ClipboardClockIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="1.8" />
      <Circle cx="16" cy="16" r="5" stroke={color} strokeWidth="1.8" fill={adminColors.onBrand} />
      <Path d="M16 14v2l1.5 1.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PersonCheckIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M16 11l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeliveryTruckIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="19" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="19" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function BoxIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="5" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M10 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BanknotesIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" fill={adminColors.onBrand} />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 6V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10h-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WalletIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PackageBagIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 6h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceiveGoodsActionIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="5" rx="1" stroke={color} strokeWidth="1.8" />
      <Path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 12v5m-3-3l3 3 3-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CashRegisterActionIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="6" y="14" width="12" height="8" rx="1" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ViewOrdersActionIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 8H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16 12H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M13 16H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CashTopUpActionIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function StockVerifyActionIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.6" />
      <Path d="M8.5 12.5l2.5 2.5 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ActivityHistoryActionIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3.05 11a9 9 0 1 1 .5 4m-.5-4v-5m0 5h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ color = adminColors.warning.text, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ color = adminColors.info.text, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FlaskIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M10 2v7.31L4.69 19.34A2 2 0 0 0 6.44 22h11.12a2 2 0 0 0 1.75-2.66L14 9.31V2M8.5 2h7M7 16h10" stroke={adminColors.warning.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExclamationCircleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={adminColors.danger.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BrokenCrateIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path d="M8 8l3 4-2 4 5-3 2 5" stroke={adminColors.danger.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.warning.text} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={adminColors.warning.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={adminColors.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 14h4l2 3h4l2-3h4v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 3v9M8 8l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

interface SubWarehouseAdminDashboardScreenProps {
  /** Warehouse this Sub Warehouse admin is assigned to; handed to shared warehouse screens. */
  scope: WarehouseScope;
  /** docs/rbac.json permission check for the signed-in admin (roles/admin/permissions/can.ts). */
  can: PermissionCheck;
  onSignOut: () => void;
  onNavigate?: (screen: string, params?: any) => void;
  onBack?: () => void;
  initialShowOrders?: boolean;
  initialOrdersScreen?: string;
  initialOrdersParams?: any;
  initialShowTodayOverview?: boolean;
  initialShowRecentActivity?: boolean;
  initialTab?: SubWHTab;
  initialReceivingSubView?: 'overview' | 'incoming_shipments' | 'search_filters' | 'shipment_detail';
  initialInventoryScreen?: string;
  onTabChange?: (tab: SubWHTab) => void;
}

// ─── Inventory Module ────────────────────────────────────────────────────────
// The inventory screens and their navigator live in admin/screens/warehouse/inventory
// (shared with the Main shell). This wrapper only passes the Sub scope through.
function InventoryModule({
  scope,
  can,
  onBack,
  onTabChange,
  initialScreen = 'M3S01',
  initialParams = null,
}: {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  initialScreen?: string | undefined;
  initialParams?: any | undefined;
}) {
  return (
    <InventoryFlow
      scope={scope}
      can={can}
      initialScreen={initialScreen}
      initialParams={initialParams}
      onBack={onBack}
      onTabChange={onTabChange}
    />
  );
}

// ─── Customer issue -> RMA ───────────────────────────────────────────────────
/** The RMA list sits beneath an RMA opened from a customer issue. */
const ISSUE_RMA_BACK_STACK: ReturnsStackEntry[] = [{ screen: 'ReturnsIssues' }];

/**
 * Opens the shared returns flow on the RMA of a customer issue. The issue is
 * mapped to an RmaRecord (mock mapping, as before the customers wave); the
 * params are memoised because ReturnsFlow restarts its stack when they change.
 */
function CustomerIssueRmaFlow({
  scope,
  can,
  params,
  onBack,
  onTabChange,
}: {
  scope: WarehouseScope;
  can: PermissionCheck;
  params: CustomersRouteParams;
  onBack: () => void;
  onTabChange: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
}) {
  const rma = useMemo(() => buildSubRmaRecord(params.issue, params.customer), [params.issue, params.customer]);

  if (!rma) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: adminColors.canvas }}>
        <AdminErrorState
          title="Customer Issue Not Found"
          message="Issue or customer details are missing for this RMA."
          onRetry={onBack}
          retryLabel="Go back"
        />
      </SafeAreaView>
    );
  }

  return (
    <ReturnsFlow
      scope={scope}
      can={can}
      initialScreen="RmaDetail"
      initialParams={{ rma }}
      initialBackStack={ISSUE_RMA_BACK_STACK}
      onBack={onBack}
      onTabChange={onTabChange}
    />
  );
}

// ─── Orders Module ───────────────────────────────────────────────────────────
// The order screens and their navigator live in admin/screens/warehouse/orders
// (shared with the Main shell). This wrapper only adds what the Sub shell owns:
// its operational-issues screens ('M4S09') and its tab handling.
export function OrdersModule({
  scope,
  can,
  initialScreen = 'M5S01',
  initialParams = null,
  onBack,
  onTabChange,
  onNavigateToOperationalIssues,
}: {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: string;
  initialParams?: any;
  onBack: () => void;
  onTabChange?: (tab: SubWHTab) => void;
  onNavigateToOperationalIssues?: () => void;
}) {
  return (
    <OrdersFlow
      scope={scope}
      can={can}
      initialScreen={initialScreen}
      initialParams={initialParams}
      onBack={onBack}
      onTabChange={(tab) => {
        // Home closes the module; any other tab closes it and switches tab.
        onBack();
        if (tab !== 'Home') onTabChange?.(tab);
      }}
      onViewIssue={onNavigateToOperationalIssues}
      renderExternalScreen={(screen, _params, nav) => {
        switch (screen) {
          case 'M4S09':
          case 'OperationalIssues':
            // Reached only when the host gave no onNavigateToOperationalIssues
            // (OrderIssueScreen's View Issue prefers onViewIssue). The shared
            // storage-ops flow owns the issue list, its detail and the report form.
            return <StorageFlow scope={scope} can={can} initialScreen="OperationalIssues" onBack={nav.back} />;
          case 'OperationalIssueDetail':
            return <StorageFlow scope={scope} can={can} initialScreen="OperationalIssueDetail" onBack={nav.back} />;
          default:
            return null;
        }
      }}
    />
  );
}

function OverviewTruckIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="5" width="14" height="12" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M15 8h4l3 3v6h-7V8z" stroke={color} strokeWidth="1.8" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="17.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function OverviewReceiptIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 7h8M8 11h8M8 15h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function OverviewBoxIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M10 14h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function OverviewRegisterIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M7 9l1.5-6h7L17 9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 5h6M9 7h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="6" y="14" width="12" height="7" rx="1" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="17.5" r="1" fill={color} />
    </Svg>
  );
}

function OverviewCashIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="1.8" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SubWarehouseTodayOverviewView({
  onBack,
  onOpenReceiving,
  onOpenOrders,
  onOpenInventory,
  onOpenStockVerification,
  onOpenSales,
  onOpenCash,
  onNavigateTab,
  dateText,
  warehouseLabel,
  receiving,
  orders,
  inventory,
  sales,
  cash,
}: {
  onBack: () => void;
  dateText: string;
  warehouseLabel: string;
  receiving: { totalText: string; pendingText: string; completedText: string };
  orders: { pendingText: string; readyText: string; completedText: string };
  inventory: { lowStockText: string; verificationPendingText: string };
  sales: { countText: string; totalText: string };
  cash: { countText: string; totalText: string };
  onOpenReceiving?: () => void;
  onOpenOrders?: () => void;
  onOpenInventory?: () => void;
  onOpenStockVerification?: () => void;
  onOpenSales?: () => void;
  onOpenCash?: () => void;
  onNavigateTab?: (tab: SubWHTab) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const categories = ['All', 'Receiving', 'Orders', 'Inventory', 'Sales', 'Cash Top-Up'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: adminColors.brand }}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={{ backgroundColor: adminColors.brand, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={adminColors.onBrand} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 21, fontWeight: '800', color: adminColors.onBrand, letterSpacing: -0.3 }}>Today's Overview</Text>
            <Text style={{ fontSize: 13.5, fontWeight: '500', color: adminColors.onBrand, marginTop: 2 }}>{`${dateText} · ${warehouseLabel}`}</Text>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: adminColors.canvas }}>
        <View style={{ backgroundColor: adminColors.canvas, paddingVertical: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: active ? adminColors.brand : adminColors.card,
                    borderRadius: 22,
                    paddingHorizontal: 20,
                    paddingVertical: 9,
                    borderWidth: 1,
                    borderColor: active ? adminColors.brand : adminColors.border,
                  }}
                >
                  <Text style={{ color: active ? adminColors.onBrand : adminColors.muted, fontWeight: '700', fontSize: 13.5 }}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {(activeCategory === 'All' || activeCategory === 'Receiving') && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenReceiving}
              style={{
                backgroundColor: adminColors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: adminColors.border,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: adminColors.brandTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <OverviewTruckIcon size={20} color={adminColors.brandDeep} />
                </View>
                <Text style={{ fontSize: 16.5, fontWeight: '800', color: adminColors.ink }}>Receiving</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{receiving.totalText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>total</Text>
                </View>
                <View style={{ flex: 1.2 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{receiving.pendingText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>pending QC</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{receiving.completedText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>completed</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {(activeCategory === 'All' || activeCategory === 'Orders') && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenOrders}
              style={{
                backgroundColor: adminColors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: adminColors.border,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: adminColors.brandTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <OverviewReceiptIcon size={20} color={adminColors.brandDeep} />
                </View>
                <Text style={{ fontSize: 16.5, fontWeight: '800', color: adminColors.ink }}>Orders</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{orders.pendingText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>pending</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{orders.readyText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>ready</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{orders.completedText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>completed</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {(activeCategory === 'All' || activeCategory === 'Inventory') && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenStockVerification ?? onOpenInventory}
              style={{
                backgroundColor: adminColors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: adminColors.border,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: adminColors.brandTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <OverviewBoxIcon size={20} color={adminColors.brandDeep} />
                </View>
                <Text style={{ fontSize: 16.5, fontWeight: '800', color: adminColors.ink }}>Inventory</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{inventory.lowStockText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>low stock</Text>
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{inventory.verificationPendingText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>verification pending</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {(activeCategory === 'All' || activeCategory === 'Sales') && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenSales}
              style={{
                backgroundColor: adminColors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: adminColors.border,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: adminColors.brandTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <OverviewRegisterIcon size={20} color={adminColors.brandDeep} />
                </View>
                <Text style={{ fontSize: 16.5, fontWeight: '800', color: adminColors.ink }}>Sales</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{sales.countText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>transactions</Text>
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{sales.totalText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>today's total</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {(activeCategory === 'All' || activeCategory === 'Cash Top-Up') && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenCash}
              style={{
                backgroundColor: adminColors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: adminColors.border,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: adminColors.brandTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <OverviewCashIcon size={20} color={adminColors.brandDeep} />
                </View>
                <Text style={{ fontSize: 16.5, fontWeight: '800', color: adminColors.ink }}>Cash Top-Up</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{cash.countText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>transactions</Text>
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: adminColors.ink }}>{cash.totalText}</Text>
                  <Text style={{ fontSize: 13, color: adminColors.muted, marginTop: 2, fontWeight: '500' }}>today's total</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: adminColors.card,
          borderTopWidth: 1,
          borderTopColor: adminColors.border,
          paddingVertical: 8,
          paddingHorizontal: 12,
          justifyContent: 'space-around',
        }}>
          <TouchableOpacity
            style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
            onPress={() => (onNavigateTab ? onNavigateTab('Home') : onBack())}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <HomeTabIcon active={false} />
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: adminColors.muted, marginTop: 3 }}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
            onPress={() => (onOpenReceiving ? onOpenReceiving() : onNavigateTab?.('Receiving'))}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <ReceivingTabIcon active={false} />
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: adminColors.muted, marginTop: 3 }}>Receiving</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
            onPress={() => (onOpenStockVerification ? onOpenStockVerification() : onOpenInventory ? onOpenInventory() : onNavigateTab?.('Inventory'))}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <InventoryTabIcon active={false} />
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: adminColors.muted, marginTop: 3 }}>Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
            onPress={() => (onNavigateTab ? onNavigateTab('More') : undefined)}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <MoreTabIcon active={false} />
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: adminColors.muted, marginTop: 3 }}>More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SubWarehouseRecentActivityView({
  onBack,
  onOpenReceiving,
  onOpenOrders,
  onOpenCash,
  onOpenQC,
  onOpenInventory,
  warehouseId,
  canActivity = true,
}: {
  onBack: () => void;
  onOpenReceiving?: ((shipmentId?: string) => void) | undefined;
  onOpenOrders?: ((orderId?: string) => void) | undefined;
  onOpenCash?: (() => void) | undefined;
  onOpenQC?: ((shipmentId?: string) => void) | undefined;
  onOpenInventory?: (() => void) | undefined;
  warehouseId: string;
  canActivity?: boolean;
}) {
  const [dateFilter, setDateFilter] = useState<'Today' | 'Yesterday' | 'This Week' | 'All Time'>('Today');
  const [activityFilter, setActivityFilter] = useState<'All Activities' | 'Inventory' | 'Receiving' | 'Orders' | 'Cash' | 'QC'>('All Activities');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showActivityMenu, setShowActivityMenu] = useState(false);

  const activityQuery = useAdminQuery(
    adminKeys.scoped('warehouseActivity', warehouseId, { resource: 'recent', limit: 50 }),
    (signal) => getRecentActivityPages([warehouseId], 50, signal),
    { enabled: canActivity },
  );

  const now = useMemo(() => new Date(), []);
  const rawEvents = activityQuery.data?.[0]?.items ?? [];
  const activities = useMemo(() => mapSubWarehouseActivity(rawEvents, now), [rawEvents, now]);
  const filtered = useMemo(
    () => filterSubActivities(activities, dateFilter, activityFilter),
    [activities, dateFilter, activityFilter],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: adminColors.brand }}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {/* Brand Orange Header */}
      <View style={{ backgroundColor: adminColors.brand, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={adminColors.onBrand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: adminColors.onBrand }}>Recent Activity</Text>
        </View>
      </View>

      {/* Main Body */}
      <View style={{ flex: 1, backgroundColor: adminColors.canvas }}>
        {/* Filter Buttons */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 12 }}>
          {/* Date Filter Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setShowDateMenu(!showDateMenu);
              setShowActivityMenu(false);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: adminColors.card,
              borderRadius: 12,
              paddingVertical: 9,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: adminColors.border,
              shadowColor: adminColors.ink,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: adminColors.ink, marginRight: 8 }}>{dateFilter}</Text>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke={adminColors.muted} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          {/* Activity Filter Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setShowActivityMenu(!showActivityMenu);
              setShowDateMenu(false);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: adminColors.card,
              borderRadius: 12,
              paddingVertical: 9,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: adminColors.border,
              shadowColor: adminColors.ink,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: adminColors.ink, marginRight: 8 }}>{activityFilter}</Text>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke={adminColors.muted} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Date Filter Options Dropdown */}
        {showDateMenu && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 10,
              backgroundColor: adminColors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: adminColors.border,
              paddingVertical: 4,
              elevation: 3,
              shadowColor: adminColors.ink,
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            {(['Today', 'Yesterday', 'This Week', 'All Time'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  setDateFilter(opt);
                  setShowDateMenu(false);
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  backgroundColor: dateFilter === opt ? adminColors.brandTint : adminColors.card,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: dateFilter === opt ? '700' : '500', color: dateFilter === opt ? adminColors.brand : adminColors.ink }}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Activity Filter Options Dropdown */}
        {showActivityMenu && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 10,
              backgroundColor: adminColors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: adminColors.border,
              paddingVertical: 4,
              elevation: 3,
              shadowColor: adminColors.ink,
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            {(['All Activities', 'Inventory', 'Receiving', 'Orders', 'Cash', 'QC'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  setActivityFilter(opt);
                  setShowActivityMenu(false);
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  backgroundColor: activityFilter === opt ? adminColors.brandTint : adminColors.card,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: activityFilter === opt ? '700' : '500', color: activityFilter === opt ? adminColors.brand : adminColors.ink }}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Activity Cards List */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
          {activityQuery.isLoading ? (
            <AdminLoadingState />
          ) : activityQuery.isError ? (
            <AdminErrorState error={activityQuery.error} onRetry={activityQuery.refetch} />
          ) : filtered.length === 0 ? (
            <AdminEmptyState title="No recent activity" subtitle="No events matching the selected filters." />
          ) : (
            filtered.map((item) => {
              const handleCardPress = () => {
                if (item.type === 'Receiving') {
                  onOpenReceiving?.(item.reference);
                } else if (item.type === 'Orders') {
                  onOpenOrders?.(item.reference);
                } else if (item.type === 'Cash') {
                  onOpenCash?.();
                } else if (item.type === 'QC') {
                  onOpenQC?.(item.reference);
                } else if (item.type === 'Inventory') {
                  onOpenInventory?.();
                }
              };

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={handleCardPress}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  style={{
                    backgroundColor: adminColors.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: adminColors.border,
                    padding: 16,
                    marginBottom: 14,
                    shadowColor: adminColors.ink,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  {/* Header: Title + Badge */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: adminColors.ink }}>{item.title}</Text>
                    <View
                      style={{
                        backgroundColor: adminColors.brandTint,
                        paddingHorizontal: 12,
                        paddingVertical: 3,
                        borderRadius: 14,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: adminColors.brand }}>{item.badge}</Text>
                    </View>
                  </View>

                  {/* Subtitle */}
                  <Text style={{ fontSize: 13.5, color: adminColors.muted, marginBottom: 14 }}>
                    {item.subtitle}
                  </Text>

                  {/* Footer: Reference & Time */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: adminColors.muted }}>{item.reference}</Text>
                    <Text style={{ fontSize: 12, color: adminColors.muted }}>{item.timeText}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export function SubWarehouseAdminDashboardScreen({
  scope,
  can,
  onSignOut,
  onNavigate,
  onBack,
  initialShowOrders = false,
  initialOrdersScreen = 'M5S01',
  initialOrdersParams = null,
  initialShowTodayOverview = false,
  initialShowRecentActivity = false,
  initialTab,
  initialReceivingSubView,
  initialInventoryScreen,
  onTabChange,
}: SubWarehouseAdminDashboardScreenProps) {
  const [showTodayOverview, setShowTodayOverview] = useState(initialShowTodayOverview);
  const [showRecentActivity, setShowRecentActivity] = useState(initialShowRecentActivity);
  useEffect(() => {
    if (initialShowTodayOverview) {
      setShowTodayOverview(true);
    }
  }, [initialShowTodayOverview]);
  useEffect(() => {
    if (initialShowRecentActivity) {
      setShowRecentActivity(true);
    }
  }, [initialShowRecentActivity]);
  const [activeTab, setActiveTab] = useState<SubWHTab>(initialTab || 'Home');
  const [returnToTabOnBack, setReturnToTabOnBack] = useState<SubWHTab | null>(null);

  const onTabChangeRef = useRef(onTabChange);
  onTabChangeRef.current = onTabChange;
  const prevTabRef = useRef<SubWHTab>(activeTab);

  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      onTabChangeRef.current?.(activeTab);
    }
  }, [activeTab]);
  // The Receiving tab: ReceivingFlow (dashboard, shipments, search & filters,
  // shipment detail, wizard, history, quality issues) owns its stack (W4).
  // This entry only says where the tab opens.
  const [receivingEntry, setReceivingEntry] = useState<{
    screen: ReceivingRoute;
    params?: ReceivingRouteParams | undefined;
  }>(() => receivingRouteFor(initialReceivingSubView));
  const [subReceivingRoute, setSubReceivingRoute] = useState<ReceivingRoute>(
    () => receivingRouteFor(initialReceivingSubView).screen
  );
  const openReceiving = (screen: ReceivingRoute = 'Dashboard', params?: ReceivingRouteParams) => {
    setReceivingEntry({ screen, params });
    setSubReceivingRoute(screen);
    setActiveTab('Receiving');
  };
  // Shipment the Home-tab receiving shortcuts open the wizard on.
  const [selectedShipment, setSelectedShipment] = useState<IncomingShipment | undefined>(undefined);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [receivingWizardStep, setReceivingWizardStep] = useState<ReceivingWizardStep | null>(null);
  // The open notifications module: NotificationsFlow (list, detail, approval
  // alerts; system messages + message history are list filters) owns its stack
  // from here on (W4). `showNotifications` / `setShowNotifications` keep the
  // shell's many bell entries and back paths unchanged.
  const [notificationsEntry, setNotificationsEntry] = useState<{
    screen: NotificationsRoute;
    params?: NotificationsRouteParams | undefined;
  } | null>(null);
  const showNotifications = notificationsEntry !== null;
  const setShowNotifications = (open: boolean) => setNotificationsEntry(open ? { screen: 'Notifications' } : null);
  const [returnToNotificationsOnBack, setReturnToNotificationsOnBack] = useState(false);
  const [showSalesScreen, setShowSalesScreen] = useState(false);
  // The open Home-tab module: HomeFlow (warehouse snapshot, tasks) owns its stack (W4).
  const [homeEntry, setHomeEntry] = useState<{ screen: HomeRoute; params?: HomeRouteParams | undefined } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileInitialScreen, setProfileInitialScreen] = useState<ProfileRoute>('WarehouseProfile');
  const [selectedStorageLocationId, setSelectedStorageLocationId] = useState<string | null>(null);
  // The open storage-ops module (W4, M4 part A): StorageFlow owns the stack from here on.
  // closeOnBack: opened from the Home tab (Recent Activity), so back closes the flow
  // instead of returning to the Warehouse Operations hub.
  const [storageEntry, setStorageEntry] = useState<{
    screen: StorageRoute;
    params?: StorageRouteParams | undefined;
    closeOnBack?: boolean | undefined;
  } | null>(null);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [showReviewReceiving, setShowReviewReceiving] = useState(false);
  // The open customer module: CustomersFlow (list, search, details, orders,
  // purchases, issues, support, filters) owns its stack from here on (W4).
  const [customersEntry, setCustomersEntry] = useState<{
    screen: CustomersRoute;
    params?: CustomersRouteParams | undefined;
  } | null>(null);
  const openCustomers = (screen: CustomersRoute = 'CustomersList', params?: CustomersRouteParams) =>
    setCustomersEntry({ screen, params });
  const [showCashTopUp, setShowCashTopUp] = useState(false);
  // The open billing module: BillingFlow (hub, list, filters, detail, generate,
  // wizard, generated) owns its stack from here on (W4).
  const [showBilling, setShowBilling] = useState(false);
  // Order a HomeFlow task opened (Task / Action Center order tasks); null = closed.
  const [taskOrderNo, setTaskOrderNo] = useState<string | null>(null);
  const [showExpenseRecord, setShowExpenseRecord] = useState(false);
  const [showGoodsReceiptDetail, setShowGoodsReceiptDetail] = useState(false);

  const [showWalletOperations, setShowWalletOperations] = useState(false);
  // The open returns (RMA) module: ReturnsFlow owns the stack from here on.
  const [returnsEntry, setReturnsEntry] = useState<{
    screen: ReturnsRoute;
    params?: ReturnsRouteParams | undefined;
    backStack?: ReturnsStackEntry[] | undefined;
  } | null>(null);
  const openReturns = (
    screen: ReturnsRoute = 'ReturnsIssues',
    params?: ReturnsRouteParams,
    backStack?: ReturnsStackEntry[],
  ) => setReturnsEntry({ screen, params, backStack });
  // The open staff & attendance module: StaffFlow owns the stack from here on.
  const [staffEntry, setStaffEntry] = useState<{ screen: StaffRoute; filter?: AttendanceFilter } | null>(null);
  const [showReportsScreen, setShowReportsScreen] = useState(false);
  const [showFinanceScreen, setShowFinanceScreen] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [inventoryInitialScreen, setInventoryInitialScreen] = useState<string | undefined>(initialInventoryScreen || 'M3S01');
  const [inventoryInitialParams, setInventoryInitialParams] = useState<any>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (initialReceivingSubView) {
      setReceivingEntry(receivingRouteFor(initialReceivingSubView));
    }
    if (initialInventoryScreen) {
      setInventoryInitialScreen(initialInventoryScreen);
    }
  }, [initialTab, initialReceivingSubView, initialInventoryScreen]);
  const [user, setUser] = useState<UserMe | null>(null);

  /** Switch tab; the Receiving tab opens on its dashboard. */
  const navigateTo = (tab: SubWHTab) => {
    setReturnToTabOnBack(null);
    onTabChange?.(tab);
    if (tab === 'Receiving') openReceiving();
    else setActiveTab(tab);
  };

  const [showOrdersModule, setShowOrdersModule] = useState(initialShowOrders);
  const [ordersInitialScreen, setOrdersInitialScreen] = useState<string>(initialOrdersScreen);
  const [ordersInitialParams, setOrdersInitialParams] = useState<any>(initialOrdersParams);

  useEffect(() => {
    if (initialShowOrders) {
      setShowOrdersModule(true);
      setOrdersInitialScreen(initialOrdersScreen);
      setOrdersInitialParams(initialOrdersParams);
    }
  }, [initialShowOrders, initialOrdersScreen, initialOrdersParams]);

  useEffect(() => {
    const onHardwareBack = () => {
      if (selectedStorageLocationId !== null) {
        setSelectedStorageLocationId(null);
        setShowStorageInfo(true);
        return true;
      }
      if (showStorageInfo) {
        setShowStorageInfo(false);
        if (storageEntry) setStorageEntry({ screen: 'Operations' });
        else if (returnToTabOnBack) {
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
        }
        return true;
      }
      if (storageEntry !== null) {
        const close = storageEntry.closeOnBack === true || storageEntry.screen === 'Operations';
        setStorageEntry(close ? null : { screen: 'Operations' });
        if (close && returnToTabOnBack) {
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
        }
        return true;
      }
      if (showReviewReceiving) {
        setShowReviewReceiving(false);
        if (returnToNotificationsOnBack) {
          setReturnToNotificationsOnBack(false);
          setShowNotifications(true);
        }
        return true;
      }
      if (showTodayOverview) {
        setShowTodayOverview(false);
        if (returnToTabOnBack) {
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
        }
        return true;
      }
      if (showRecentActivity) {
        setShowRecentActivity(false);
        if (returnToTabOnBack) {
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
        }
        return true;
      }
      if (showProfile) {
        setShowProfile(false);
        if (returnToTabOnBack) {
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
        }
        return true;
      }
      if (showReportsScreen) {
        setShowReportsScreen(false);
        setActiveTab(returnToTabOnBack || 'More');
        setReturnToTabOnBack(null);
        return true;
      }
      if (showSalesScreen) {
        setShowSalesScreen(false);
        setActiveTab(returnToTabOnBack || 'More');
        setReturnToTabOnBack(null);
        return true;
      }
      if (showCashTopUp) {
        setShowCashTopUp(false);
        if (returnToTabOnBack) {
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
        }
        return true;
      }
      if (customersEntry !== null) {
        const fromOrders = customersEntry.screen === 'CustomerOrders';
        setCustomersEntry(null);
        if (customersEntry.screen === 'CustomersList') {
          setActiveTab(returnToTabOnBack || 'More');
          setReturnToTabOnBack(null);
        } else if (fromOrders && returnToNotificationsOnBack) {
          setReturnToNotificationsOnBack(false);
          setShowNotifications(true);
        } else if (returnToTabOnBack) {
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
        }
        return true;
      }
      if (showBilling) {
        setShowBilling(false);
        setActiveTab(returnToTabOnBack || 'More');
        setReturnToTabOnBack(null);
        return true;
      }
      if (showWalletOperations) {
        setShowWalletOperations(false);
        if (returnToNotificationsOnBack) {
          setReturnToNotificationsOnBack(false);
          setShowNotifications(true);
        } else {
          setActiveTab(returnToTabOnBack || 'More');
          setReturnToTabOnBack(null);
        }
        return true;
      }
      if (returnsEntry !== null) {
        setReturnsEntry(null);
        if (returnToNotificationsOnBack) {
          setReturnToNotificationsOnBack(false);
          setShowNotifications(true);
        } else if (returnToTabOnBack) {
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
        }
        return true;
      }
      if (staffEntry !== null) {
        setStaffEntry(null);
        if (returnToTabOnBack) {
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
        }
        return true;
      }
      if (showFinanceScreen) {
        setShowFinanceScreen(false);
        setActiveTab(returnToTabOnBack || 'More');
        setReturnToTabOnBack(null);
        return true;
      }
      if (showSettingsScreen) {
        setShowSettingsScreen(false);
        setActiveTab(returnToTabOnBack || 'More');
        setReturnToTabOnBack(null);
        return true;
      }
      if (homeEntry !== null) {
        setHomeEntry(null);
        return true;
      }
      if (taskOrderNo !== null) {
        setTaskOrderNo(null);
        return true;
      }
      if (showNotifications) {
        setShowNotifications(false);
        return true;
      }
      if (showOrdersModule) {
        setShowOrdersModule(false);
        if (returnToNotificationsOnBack) {
          setReturnToNotificationsOnBack(false);
          setShowNotifications(true);
        } else if (returnToTabOnBack) {
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
        }
        return true;
      }
      if (activeTab === 'Inventory') {
        if (returnToNotificationsOnBack) {
          setInventoryInitialScreen(undefined);
          setReturnToNotificationsOnBack(false);
          setShowNotifications(true);
          return true;
        }
        if (returnToTabOnBack) {
          setInventoryInitialScreen(undefined);
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
          return true;
        }
        setActiveTab('Home');
        return true;
      }
      if (receivingWizardStep !== null) {
        setReceivingWizardStep(null);
        return true;
      }
      // ReceivingFlow walks its own stack (its listener handles the press).
      if (activeTab === 'Receiving') return false;
      if (activeTab !== 'Home') {
        if (returnToTabOnBack) {
          setActiveTab(returnToTabOnBack);
          setReturnToTabOnBack(null);
          return true;
        }
        setActiveTab('Home');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [
    receivingWizardStep,
    activeTab,
    showNotifications,
    showOrdersModule,
    returnToNotificationsOnBack,
    returnToTabOnBack,
    selectedStorageLocationId,
    showStorageInfo,
    storageEntry,
    showReviewReceiving,
    showTodayOverview,
    showRecentActivity,
    showProfile,
    showReportsScreen,
    showSalesScreen,
    showCashTopUp,
    customersEntry,
    showBilling,
    showWalletOperations,
    returnsEntry,
    staffEntry,
    showFinanceScreen,
    showSettingsScreen,
    homeEntry,
    taskOrderNo,
  ]);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => { });
  }, []);

  const now = useMemo(() => new Date(), []);
  const today = istDay(now);

  const canOrders = can(HOME_CODES.orderList);
  const canStock = can(HOME_CODES.batchView);
  const canSales = can(HOME_CODES.salesIncome);
  const canActivity = can('warehouse.activity.view');
  const canAlerts = can('alert.own.view');
  const canReceipts = can('inventory.goods_receipt.record');
  const canPOs = can('purchase.order.view');
  const canNotifications = can('notification.own.view');

  // Bell badge: Unread notification count (BR-65)
  const unreadQuery = useAdminQuery(
    adminKeys.scoped('notifications', undefined, { resource: 'unread-count' }),
    (signal) => getUnreadNotificationCount(signal),
    { enabled: canNotifications },
  );
  const unreadNotifCount = unreadQuery.data ?? 0;

  // Open POs (BR-119)
  const openPosQuery = useAdminQuery(
    adminKeys.scoped('receiving', scope.warehouseId, { resource: 'open-pos' }),
    (signal) => getOpenPurchaseOrders(scope.warehouseId, signal),
    { enabled: canPOs },
  );

  // Awaiting QC receipts count (BR-119)
  const awaitingQcQuery = useAdminQuery(
    adminKeys.scoped('receiving', scope.warehouseId, { resource: 'count', status: 'AWAITING_QC' }),
    (signal) => countGoodsReceiptsWithStatus('AWAITING_QC', scope.warehouseId, signal),
    { enabled: canReceipts },
  );

  // Today's receipts (BR-119, BR-120)
  const receiptsTodayQuery = useAdminQuery(
    adminKeys.scoped('receiving', scope.warehouseId, { resource: 'grn-day', day: today }),
    (signal) => getGoodsReceiptsOnDay(scope.warehouseId, today, signal),
    { enabled: canReceipts },
  );

  // Active alerts (BR-77)
  const alertsQuery = useAdminQuery(
    adminKeys.scoped('alerts', scope.warehouseId, { resource: 'list', state: 'active' }),
    (signal) => getActiveAlerts(scope.warehouseId, signal),
    { enabled: canAlerts },
  );

  // Batches for low stock crop name lookup
  const batchesQuery = useAdminQuery(
    adminKeys.scoped('inventory', scope.warehouseId, { resource: 'batches', status: 'ACTIVE' }),
    (signal) => getActiveBatches(scope.warehouseId, signal),
    { enabled: canStock },
  );

  // Recent activity for warehouse and Home preview (BR-104)
  const activityQuery = useAdminQuery(
    adminKeys.scoped('warehouseActivity', scope.warehouseId, { resource: 'recent', limit: 10 }),
    (signal) => getRecentActivityPages([scope.warehouseId ?? ''], 10, signal),
    { enabled: canActivity },
  );

  // Orders for Home preview (BR-101)
  const ordersQuery = useAdminQuery(
    adminKeys.scoped('orders', scope.warehouseId, { resource: 'list', limit: 10 }),
    (signal) => listAdminOrders({ warehouseId: scope.warehouseId, limit: 10 }, signal),
    { enabled: canOrders },
  );

  // Order counts by status (BR-101)
  const confirmedCountQuery = useAdminQuery(
    adminKeys.scoped('orders', scope.warehouseId, { resource: 'count', status: 'CONFIRMED' }),
    (signal) => countOrdersWithStatus('CONFIRMED', scope.warehouseId, signal),
    { enabled: canOrders },
  );

  const packingCountQuery = useAdminQuery(
    adminKeys.scoped('orders', scope.warehouseId, { resource: 'count', status: 'PACKED' }),
    (signal) => countOrdersWithStatus('PACKED', scope.warehouseId, signal),
    { enabled: canOrders },
  );

  // Ready for pickup orders count (BR-101)
  const readyOrdersQuery = useAdminQuery(
    adminKeys.scoped('orders', scope.warehouseId, { resource: 'count', status: 'READY_FOR_PICKUP' }),
    (signal) => countOrdersWithStatus('READY_FOR_PICKUP', scope.warehouseId, signal),
    { enabled: canOrders },
  );

  const completedCountQuery = useAdminQuery(
    adminKeys.scoped('orders', scope.warehouseId, { resource: 'count', status: 'DELIVERED' }),
    (signal) => countOrdersWithStatus('DELIVERED', scope.warehouseId, signal),
    { enabled: canOrders },
  );

  const formatOrderCount = (q: { isLoading: boolean; error: unknown; data?: { count: number } | undefined }) => {
    if (q.isLoading) return '—';
    if (q.error || q.data === undefined) return '—';
    return String(q.data.count).padStart(2, '0');
  };

  // Inventory overview (BR-116)
  const inventoryOverviewQuery = useAdminQuery(
    adminKeys.scoped('inventory', scope.warehouseId, { resource: 'overview' }),
    (signal) => getInventoryOverview(signal),
    { enabled: canStock },
  );

  // Allocations for today (BR-116)
  const canAllocations = can('allocation.dashboard.view');
  const allocationsQuery = useAdminQuery(
    adminKeys.scoped('inventory', scope.warehouseId, { resource: 'allocations', day: today }),
    (signal) => listAllocations({ warehouseId: scope.warehouseId, allocationDate: today, limit: 100 }, signal),
    { enabled: canAllocations },
  );

  const pendingOrdersText = useMemo(() => {
    if (confirmedCountQuery.isLoading || packingCountQuery.isLoading || readyOrdersQuery.isLoading) {
      return '—';
    }
    if (confirmedCountQuery.isError || packingCountQuery.isError || readyOrdersQuery.isError) {
      return t('home.tile.error');
    }
    const confirmedCount = confirmedCountQuery.data?.count ?? 0;
    const packingCount = packingCountQuery.data?.count ?? 0;
    const readyCount = readyOrdersQuery.data?.count ?? 0;
    const sum = confirmedCount + packingCount + readyCount;
    const isExact =
      (confirmedCountQuery.data?.exact ?? true) &&
      (packingCountQuery.data?.exact ?? true) &&
      (readyOrdersQuery.data?.exact ?? true);
    return `${String(sum).padStart(2, '0')}${isExact ? '' : '+'}`;
  }, [
    confirmedCountQuery.isLoading,
    confirmedCountQuery.isError,
    confirmedCountQuery.data,
    packingCountQuery.isLoading,
    packingCountQuery.isError,
    packingCountQuery.data,
    readyOrdersQuery.isLoading,
    readyOrdersQuery.isError,
    readyOrdersQuery.data,
  ]);

  const readyOrdersText = useMemo(() => {
    if (readyOrdersQuery.isLoading) return '—';
    if (readyOrdersQuery.isError || readyOrdersQuery.data === undefined) return '—';
    return `${String(readyOrdersQuery.data.count).padStart(2, '0')}${readyOrdersQuery.data.exact ? '' : '+'}`;
  }, [readyOrdersQuery.isLoading, readyOrdersQuery.isError, readyOrdersQuery.data]);

  const completedOrdersText = useMemo(() => {
    if (completedCountQuery.isLoading) return '—';
    if (completedCountQuery.isError || completedCountQuery.data === undefined) return '—';
    return `${String(completedCountQuery.data.count).padStart(2, '0')}${completedCountQuery.data.exact ? '' : '+'}`;
  }, [completedCountQuery.isLoading, completedCountQuery.isError, completedCountQuery.data]);

  const verificationPendingText = useMemo(() => {
    if (inventoryOverviewQuery.isLoading) return '—';
    if (inventoryOverviewQuery.isError || inventoryOverviewQuery.data === undefined) return '—';
    return String(inventoryOverviewQuery.data.unreconciledVerificationCount).padStart(2, '0');
  }, [inventoryOverviewQuery.isLoading, inventoryOverviewQuery.isError, inventoryOverviewQuery.data]);

  const reservedGrams = useMemo(() => {
    if (!batchesQuery.data?.items) return null;
    let total = 0;
    for (const b of batchesQuery.data.items) {
      if (b.qtyReservedKg) {
        const g = parseKgToGrams(b.qtyReservedKg);
        if (g !== null) total += g;
      }
    }
    return total;
  }, [batchesQuery.data?.items]);
  const reservedStockText = reservedGrams !== null ? formatKg(reservedGrams) : '—';

  const whOverview = inventoryOverviewQuery.data?.warehouses?.[0];
  const availGrams = whOverview?.availableQtyKg ? parseKgToGrams(whOverview.availableQtyKg) : null;
  const availableStockText = availGrams !== null ? formatKg(availGrams) : '—';
  const lowStockNum = inventoryOverviewQuery.data?.lowStockCount;
  const lowStockSnapshotText = lowStockNum !== null && lowStockNum !== undefined ? String(lowStockNum).padStart(2, '0') : '—';

  const allocationChannels = useMemo(() => {
    if (!allocationsQuery.data?.items) return null;
    const items = allocationsQuery.data.items;
    if (items.length === 0) return [];
    const map: Record<string, number> = {
      ONLINE: 0,
      LIVE_MARKET: 0,
      RESERVE: 0,
      BUFFER: 0,
    };
    for (const item of items) {
      if (item.channel && item.allocatedQtyKg) {
        const g = parseKgToGrams(item.allocatedQtyKg);
        if (g !== null) {
          map[item.channel] = (map[item.channel] ?? 0) + g;
        }
      }
    }
    return [
      { channel: 'ONLINE', label: t('allocation.channel.ONLINE'), valueText: formatKg(map.ONLINE ?? 0) },
      { channel: 'LIVE_MARKET', label: t('allocation.channel.LIVE_MARKET'), valueText: formatKg(map.LIVE_MARKET ?? 0) },
      { channel: 'RESERVE', label: t('allocation.channel.RESERVE'), valueText: formatKg(map.RESERVE ?? 0) },
      { channel: 'BUFFER', label: t('allocation.channel.BUFFER'), valueText: formatKg(map.BUFFER ?? 0) },
    ];
  }, [allocationsQuery.data?.items]);

  // Today's sales and cash top-ups (BR-64): read-only, warehouse-scoped aggregates
  const canCashTopup = can('wallet.cash_topup.process');
  const salesReportQuery = useAdminQuery(
    adminKeys.scoped('reports', scope.warehouseId, { resource: 'sales', day: today }),
    (signal) => getSalesReport({ from: today, to: today, warehouseId: scope.warehouseId }, signal),
    { enabled: canSales },
  );
  const cashReportQuery = useAdminQuery(
    adminKeys.scoped('reports', scope.warehouseId, { resource: 'cash-topups', day: today }),
    (signal) => getCashTopupsReport({ from: today, to: today, warehouseId: scope.warehouseId }, signal),
    { enabled: canCashTopup },
  );
  const salesSummary = useMemo(() => deriveSubSalesSummary(salesReportQuery.data), [salesReportQuery.data]);
  const cashSummary = useMemo(() => deriveSubCashSummary(cashReportQuery.data), [cashReportQuery.data]);
  const lowStockCountText = useMemo(() => deriveSubLowStockCount(alertsQuery.data?.items), [alertsQuery.data]);

  const userName = user?.fullName?.split(' ')[0] ?? '';
  // Home is locked to the assigned warehouse (scope), never a written-in name.
  const warehouseLabel = scope.warehouseName ?? '';
  const warehouseShort = warehouseLabel.replace(/ Warehouse$/, '');

  const receivingKpi = useMemo(
    () => deriveSubReceivingKpi(openPosQuery.data?.items, openPosQuery.data?.complete ?? true, awaitingQcQuery.data),
    [openPosQuery.data, awaitingQcQuery.data],
  );

  const todayReceivingItems = useMemo(
    () => deriveSubTodayReceiving(receiptsTodayQuery.data?.items, warehouseShort),
    [receiptsTodayQuery.data, warehouseShort],
  );

  const cropNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of batchesQuery.data?.items ?? []) {
      if (b.cropId && b.cropName) map.set(b.cropId, b.cropName);
    }
    return map;
  }, [batchesQuery.data]);

  const lowStockView = useMemo(
    () => deriveSubLowStockAlert(alertsQuery.data?.items, cropNames),
    [alertsQuery.data, cropNames],
  );

  const homeActivityPreview = useMemo(
    () => mapSubWarehouseActivity(activityQuery.data?.[0]?.items ?? [], now).slice(0, 3),
    [activityQuery.data, now],
  );

  const awaitingQcFirstReceipt = useMemo(
    () => receiptsTodayQuery.data?.items.find((r) => r.status === 'AWAITING_QC'),
    [receiptsTodayQuery.data],
  );

  const awaitingQcCount = awaitingQcQuery.data?.count ?? 0;
  const readyOrdersCount = readyOrdersQuery.data?.count ?? 0;

  if (taskOrderNo !== null) {
    // Order detail of a HomeFlow order task; back returns to the task list.
    return (
      <OrdersModule
        scope={scope}
        can={can}
        initialScreen="M5S04"
        initialParams={{ orderId: taskOrderNo }}
        onBack={() => setTaskOrderNo(null)}
        onTabChange={(tab) => {
          setTaskOrderNo(null);
          setHomeEntry(null);
          setActiveTab(tab);
        }}
        onNavigateToOperationalIssues={() => {
          setTaskOrderNo(null);
          setHomeEntry(null);
          setStorageEntry({ screen: 'OperationalIssues' });
        }}
      />
    );
  }

  if (showExpenseRecord) {
    return (
      // The old SubWarehouseExpenseRecordScreen duplicated this record with an
      // 'Approve / Review' button; no rbac code grants expense approval, so the
      // shared read-only ExpenseDetailScreen is shown instead (FINAL_LIST #35).
      <ExpenseDetailScreen scope={scope} can={can} onBack={() => setShowExpenseRecord(false)} />
    );
  }

  if (showGoodsReceiptDetail) {
    return (
      // Was SubWarehouseGoodsReceiptDetailScreen, absorbed by the shared receipt detail (W4).
      // "Take Action" reconciles the variance in the wizard's Damage / Mismatch step.
      <ReceivingHistoryDetailScreen
        scope={scope}
        can={can}
        receiptId={selectedReceiptId ?? ''}
        onBack={() => setShowGoodsReceiptDetail(false)}
        onTakeAction={() => {
          setShowGoodsReceiptDetail(false);
          setReceivingWizardStep('damage_mismatch');
        }}
      />
    );
  }

  if (receivingWizardStep !== null) {
    return (
      <GoodsReceivingWizardScreen
        scope={scope}
        can={can}
        initialStep={receivingWizardStep}
        shipment={selectedShipment}
        receiverName={userName}
        onBack={() => setReceivingWizardStep(null)}
        onFinish={() => {
          setReceivingWizardStep(null);
          openReceiving();
        }}
        onBackToShipments={() => {
          setReceivingWizardStep(null);
          openReceiving('Shipments');
        }}
        onViewHistory={() => {
          setReceivingWizardStep(null);
          openReceiving('History');
        }}
        onViewBatch={(batchId) => {
          setReceivingWizardStep(null);
          setInventoryInitialScreen('M3S05');
          setInventoryInitialParams({ batchId }); // pass parameter if M3S05 uses it
          setActiveTab('Inventory');
        }}
      />
    );
  }

  if (notificationsEntry !== null) {
    return (
      <NotificationsFlow
        scope={scope}
        can={can}
        initialScreen={notificationsEntry.screen}
        initialParams={notificationsEntry.params}
        onBack={() => {
          setNotificationsEntry(null);
          void unreadQuery.refetch();
        }}
        onTabChange={(tab) => {
          setNotificationsEntry(null);
          void unreadQuery.refetch();
          if (tab === 'Receiving') {
            setActiveTab('Receiving');
            openReceiving();
          } else if (tab === 'Inventory') {
            setInventoryInitialScreen('M3S01');
            setInventoryInitialParams(null);
            setActiveTab('Inventory');
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenTarget={(target) => {
          setNotificationsEntry(null);
          void unreadQuery.refetch();
          if (target === 'ReviewReceiving') {
            setShowReviewReceiving(true);
          } else if (target === 'Receiving') {
            openReceiving();
          } else if (target === 'Stock') {
            setInventoryInitialScreen('M3S02');
            setInventoryInitialParams(null);
            setActiveTab('Inventory');
          } else if (target === 'Orders') {
            setOrdersInitialScreen('M5S01');
            setShowOrdersModule(true);
          } else if (target === 'Wallet') {
            setShowWalletOperations(true);
          } else {
            openReturns('ReturnsIssues');
          }
        }}
        onOpenAlertRecord={(alert) => {
          // Coming back from the record reopens the alerts, not the list.
          setNotificationsEntry({ screen: 'ApprovalAlerts' });
          if (alert.record === 'ExpenseRecord') {
            setShowExpenseRecord(true);
          } else if (alert.record === 'GoodsReceipt') {
            setSelectedReceiptId(alert.reference);
            setShowGoodsReceiptDetail(true);
          } else if (alert.record === 'LowStock') {
            setNotificationsEntry(null);
            setInventoryInitialScreen('M3S09');
            setInventoryInitialParams(null);
            setActiveTab('Inventory');
          } else if (alert.record === 'Transfer') {
            // App.tsx opens the shared TransfersFlow on the Sub scope (incoming only).
            onNavigate?.('InterWarehouseTransfer', { transferScope: 'sub' });
          }
        }}
      />
    );
  }

  if (homeEntry !== null) {
    // Shared HomeFlow (W4 dashboard part 2): Warehouse Snapshot and the task screens, scope-locked
    // to this warehouse. The order-detail early return above sits on top of it (taskOrderNo).
    return (
      <HomeFlow
        scope={scope}
        can={can}
        initialScreen={homeEntry.screen}
        initialParams={homeEntry.params}
        onBack={() => setHomeEntry(null)}
        onTabChange={(tab) => {
          setHomeEntry(null);
          setActiveTab(tab);
        }}
        onOpenTarget={(target, ref) => {
          if (target === 'OrderDetail') {
            // Keep the flow open underneath: back from the order returns to the tasks.
            setTaskOrderNo(ref ?? '');
            return;
          }
          setHomeEntry(null);
          if (target === 'Inventory') {
            setInventoryInitialScreen('M3S01');
            setInventoryInitialParams(null);
            setActiveTab('Inventory');
          } else if (target === 'ReceivingDashboard') {
            openReceiving();
          } else if (target === 'Orders') {
            setOrdersInitialScreen('M5S01');
            setOrdersInitialParams(null);
            setShowOrdersModule(true);
          } else if (target === 'Operations') {
            setStorageEntry({ screen: 'Operations' });
          }
        }}
      />
    );
  }

  if (selectedStorageLocationId) {
    const openStock = () => {
      setSelectedStorageLocationId(null);
      setShowStorageInfo(false);
      setInventoryInitialScreen('M3S02');
      setActiveTab('Inventory');
    };
    return (
      // Shared storage-ops location detail (W4, M4-S04), scope-locked to this
      // warehouse; View Stock needs inventory.batch.view (SUB own).
      <StorageFlow
        scope={scope}
        can={can}
        initialScreen="StorageLocationDetail"
        initialParams={{ locationId: selectedStorageLocationId }}
        onBack={() => {
          // Back from detail → go back to Storage Info list
          setSelectedStorageLocationId(null);
          setShowStorageInfo(true);
        }}
        onViewStock={openStock}
        onViewProductDetail={openStock}
        onTabChange={(tab) => {
          setSelectedStorageLocationId(null);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (showStorageInfo) {
    // Storage Information lives in the shared profile-settings area (W4 part B);
    // the location detail stays here (selectedStorageLocationId, above).
    return (
      <ProfileFlow
        scope={scope}
        can={can}
        initialScreen="StorageInfo"
        onBack={() => {
          // Back from Storage List → go back to Profile or Operations or previous tab
          setShowStorageInfo(false);
          if (showProfile) {
            // stays in profile
          } else if (storageEntry) {
            setStorageEntry({ screen: 'Operations' });
          } else if (returnToTabOnBack) {
            setActiveTab(returnToTabOnBack);
            setReturnToTabOnBack(null);
          }
        }}
        onTabChange={(tab) => {
          setShowStorageInfo(false);
          setActiveTab(tab);
        }}
        onSelectStorageLocation={(id) => {
          setShowStorageInfo(false);
          setSelectedStorageLocationId(id);
        }}
      />
    );
  }

  /** Modules outside storage-ops that own an activity record or a Today tile (StorageFlow onOpenModule). */
  const openModule = (module: ActivityModule) => {
    switch (module) {
      case 'receiving':
        openReceiving('Shipments');
        break;
      case 'verification':
        setInventoryInitialScreen('M3S10');
        setActiveTab('Inventory');
        break;
      case 'storage':
        if (onNavigate) onNavigate('SubWarehouseStorageInfo');
        else setShowStorageInfo(true);
        break;
      case 'orders':
        setOrdersInitialScreen('M5S01');
        setOrdersInitialParams(null);
        setShowOrdersModule(true);
        break;
      case 'cash':
        setShowCashTopUp(true);
        break;
      case 'staff':
        setStaffEntry({ screen: 'Staff' });
        break;
      case 'qc':
        openReceiving('Shipments');
        break;
      default:
        break;
    }
  };

  if (storageEntry) {
    return (
      // Shared storage-ops flow (W4, M4 parts A and B), scope-locked to this warehouse:
      // the Warehouse Operations hub, capacity, activity and operational issues.
      // Capacity is view-only (SUB has no warehouse.capacity.set, so no Manage Capacity Limits).
      <StorageFlow
        scope={scope}
        can={can}
        initialScreen={storageEntry.screen}
        initialParams={storageEntry.params}
        onBack={() => {
          // Back from the hub (or an entry opened from Home) closes the flow; a
          // module opened directly returns to the hub, as the old screens did.
          const close = storageEntry.closeOnBack === true || storageEntry.screen === 'Operations';
          setStorageEntry(close ? null : { screen: 'Operations' });
          if (close && returnToTabOnBack) {
            setActiveTab(returnToTabOnBack);
            setReturnToTabOnBack(null);
          }
        }}
        onOpenNotifications={() => {
          setStorageEntry(null);
          if (onNavigate) {
            onNavigate('SubWarehouseNotifications');
          } else {
            setShowNotifications(true);
          }
        }}
        onOpenModule={(module) => {
          // Activity records / Today tiles owned by modules outside storage-ops.
          setStorageEntry(null);
          openModule(module);
        }}
        onTabChange={(tab) => {
          setStorageEntry(null);
          setActiveTab(tab);
        }}
        onViewStock={() => {
          setStorageEntry(null);
          setSelectedStorageLocationId(null);
          setShowStorageInfo(false);
          setInventoryInitialScreen('M3S02');
          setActiveTab('Inventory');
        }}
        onViewProductDetail={() => {
          setStorageEntry(null);
          setSelectedStorageLocationId(null);
          setShowStorageInfo(false);
          setInventoryInitialScreen('M3S02');
          setActiveTab('Inventory');
        }}
      />
    );
  }

  if (showReviewReceiving) {
    return (
      // Was SubWarehouseReviewReceivingScreen: now the wizard's one-page Review step (W4).
      <GoodsReceivingWizardScreen
        scope={scope}
        can={can}
        initialStep="review_receiving"
        shipment={selectedShipment}
        receiverName={userName}
        onBack={() => {
          setShowReviewReceiving(false);
          if (returnToNotificationsOnBack) {
            setReturnToNotificationsOnBack(false);
            setShowNotifications(true);
          }
        }}
        onFinish={() => {
          setShowReviewReceiving(false);
          openReceiving();
        }}
      />
    );
  }

  if (showTodayOverview) {
    return (
      <SubWarehouseTodayOverviewView
        dateText={formatAdminDate(now, now)}
        warehouseLabel={warehouseLabel}
        receiving={{
          totalText:
            receiptsTodayQuery.isLoading || receiptsTodayQuery.isError
              ? '—'
              : `${String(todayReceivingItems.length).padStart(2, '0')}${receiptsTodayQuery.data?.complete === false ? '+' : ''}`,
          pendingText:
            awaitingQcQuery.isLoading || awaitingQcQuery.isError || awaitingQcQuery.data === undefined
              ? '—'
              : `${String(awaitingQcQuery.data.count).padStart(2, '0')}${awaitingQcQuery.data.exact ? '' : '+'}`,
          completedText:
            receiptsTodayQuery.isLoading || receiptsTodayQuery.isError
              ? '—'
              : `${String(todayReceivingItems.filter((i) => !i.isAwaitingQc).length).padStart(2, '0')}`,
        }}
        orders={{
          pendingText: pendingOrdersText,
          readyText: readyOrdersText,
          completedText: completedOrdersText,
        }}
        inventory={{
          lowStockText: lowStockCountText,
          verificationPendingText,
        }}
        sales={{ countText: salesSummary.countNumberText, totalText: salesSummary.totalText }}
        cash={{ countText: cashSummary.countNumberText, totalText: cashSummary.totalText }}
        onBack={() => {
          setShowTodayOverview(false);
          if (returnToTabOnBack) {
            setActiveTab(returnToTabOnBack);
            setReturnToTabOnBack(null);
          }
        }}
        onOpenReceiving={() => {
          setShowTodayOverview(false);
          setReturnToTabOnBack('Home');
          openReceiving();
        }}
        onOpenOrders={() => {
          setShowTodayOverview(false);
          setReturnToTabOnBack('Home');
          setOrdersInitialScreen('M5S02');
          setOrdersInitialParams(null);
          setShowOrdersModule(true);
        }}
        onOpenInventory={() => {
          setShowTodayOverview(false);
          setReturnToTabOnBack('Home');
          setInventoryInitialScreen('M3S10');
          setActiveTab('Inventory');
        }}
        onOpenStockVerification={() => {
          setShowTodayOverview(false);
          setReturnToTabOnBack('Home');
          setInventoryInitialScreen('M3S10');
          setActiveTab('Inventory');
        }}
        onOpenSales={() => {
          setShowTodayOverview(false);
          setReturnToTabOnBack('Home');
          setShowSalesScreen(true);
        }}
        onOpenCash={() => {
          setShowTodayOverview(false);
          setReturnToTabOnBack('Home');
          setShowCashTopUp(true);
        }}
        onNavigateTab={(tab) => {
          setShowTodayOverview(false);
          if (tab === 'Home') {
            setActiveTab('Home');
          } else if (tab === 'Receiving') {
            openReceiving();
          } else if (tab === 'Inventory') {
            setInventoryInitialScreen('M3S10');
            setActiveTab('Inventory');
          } else if (tab === 'More') {
            setActiveTab('More');
          }
        }}
      />
    );
  }

  if (showRecentActivity) {
    return (
      <SubWarehouseRecentActivityView
        warehouseId={scope.warehouseId ?? ''}
        canActivity={canActivity}
        onBack={() => {
          setShowRecentActivity(false);
          if (returnToTabOnBack) {
            setActiveTab(returnToTabOnBack);
            setReturnToTabOnBack(null);
          }
        }}
        onOpenReceiving={(shipmentId) => {
          setShowRecentActivity(false);
          setReturnToTabOnBack('Home');
          if (shipmentId) {
            openReceiving('ShipmentDetail', { shipmentId });
          } else {
            openReceiving('Shipments');
          }
        }}
        onOpenOrders={(orderId) => {
          setShowRecentActivity(false);
          setReturnToTabOnBack('Home');
          if (orderId) {
            setOrdersInitialScreen('M5S02');
            setOrdersInitialParams({ orderId, orderNo: orderId });
          } else {
            setOrdersInitialScreen('M5S01');
            setOrdersInitialParams(null);
          }
          setShowOrdersModule(true);
        }}
        onOpenCash={() => {
          setShowRecentActivity(false);
          setReturnToTabOnBack('Home');
          setShowCashTopUp(true);
        }}
        onOpenQC={(shipmentId) => {
          setShowRecentActivity(false);
          setReturnToTabOnBack('Home');
          if (shipmentId) {
            openReceiving('ShipmentDetail', { shipmentId });
          } else {
            openReceiving('Shipments');
          }
        }}
        onOpenInventory={() => {
          setShowRecentActivity(false);
          setReturnToTabOnBack('Home');
          setInventoryInitialScreen('M3S10');
          setActiveTab('Inventory');
        }}
      />
    );
  }

  if (showProfile) {
    return (
      <ProfileFlow
        scope={scope}
        can={can}
        initialScreen={profileInitialScreen}
        onBack={() => {
          setShowProfile(false);
          if (returnToTabOnBack) {
            setActiveTab(returnToTabOnBack);
            setReturnToTabOnBack(null);
          }
        }}
        onLogout={onSignOut}
        onTabChange={(tab) => {
          setShowProfile(false);
          setActiveTab(tab);
        }}
        onSelectStorageLocation={(id) => {
          setShowProfile(false);
          setSelectedStorageLocationId(id);
        }}
      />
    );
  }

  if (showReportsScreen) {
    return (
      <ReportsScreen
        scope={scope}
        can={can}
        canExport={can('report.export.file')}
        onBack={() => {
          setShowReportsScreen(false);
          setActiveTab(returnToTabOnBack || 'More');
          setReturnToTabOnBack(null);
        }}
        onTabChange={(tab) => {
          setShowReportsScreen(false);
          setActiveTab(tab);
        }}
        onNavigateToNotifications={() => {
          setShowReportsScreen(false);
          if (onNavigate) {
            onNavigate('SubWarehouseNotifications');
          } else {
            setShowNotifications(true);
          }
        }}
      />
    );
  }

  if (showSalesScreen) {
    return (
      // The shared direct sales flow (admin/screens/warehouse/sales-direct).
      <SalesFlow
        scope={scope}
        can={can}
        onBack={() => {
          setShowSalesScreen(false);
          setActiveTab(returnToTabOnBack || 'More');
          setReturnToTabOnBack(null);
        }}
        onTabChange={(tab) => {
          setShowSalesScreen(false);
          setActiveTab(tab);
        }}
        onNavigateToNotifications={() => {
          setShowSalesScreen(false);
          if (onNavigate) {
            onNavigate('SubWarehouseNotifications');
          } else {
            setShowNotifications(true);
          }
        }}
        onNavigateToNeedsAttention={
          onNavigate
            ? (category) => {
                setShowSalesScreen(false);
                onNavigate('SubWarehouseNeedsAttention', category ? { category } : undefined);
              }
            : undefined
        }
      />
    );
  }

  if (showCashTopUp) {
    // Cash top-up wizard of the shared wallet flow (admin/screens/warehouse/wallet-cashtopup).
    return (
      <WalletFlow
        scope={scope}
        can={can}
        initialScreen="CashTopUp"
        // No customer is preselected from Home (the old selectedCustomer was never set).
        initialParams={walletParamsForCustomer(undefined)}
        onBack={() => {
          setShowCashTopUp(false);
          if (returnToTabOnBack) {
            setActiveTab(returnToTabOnBack);
            setReturnToTabOnBack(null);
          }
        }}
        onTabChange={(tab) => {
          setShowCashTopUp(false);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (customersEntry) {
    // The customer screens and their navigator live in
    // admin/screens/warehouse/customers (shared with the Main shell and App.tsx).
    // Wallet, cash top-up, new sale, order detail and the RMA open inside the
    // flow, so back returns to the customer screen that opened them.
    return (
      <CustomersFlow
        scope={scope}
        can={can}
        initialScreen={customersEntry.screen}
        initialParams={customersEntry.params}
        onBack={() => {
          const fromOrders = customersEntry.screen === 'CustomerOrders';
          setCustomersEntry(null);
          if (customersEntry.screen === 'CustomersList') {
            setActiveTab(returnToTabOnBack || 'More');
            setReturnToTabOnBack(null);
          } else if (fromOrders && returnToNotificationsOnBack) {
            setReturnToNotificationsOnBack(false);
            setShowNotifications(true);
          } else if (returnToTabOnBack) {
            setActiveTab(returnToTabOnBack);
            setReturnToTabOnBack(null);
          }
        }}
        onTabChange={(tab) => {
          setCustomersEntry(null);
          setActiveTab(tab);
        }}
        onNavigateToNotifications={() => {
          if (onNavigate) onNavigate('SubWarehouseNotifications');
          else setShowNotifications(true);
        }}
        renderExternalScreen={(target, p, nav) => {
          const c = p.customer;
          if (target === 'CustomerWallet' || target === 'CashTopUp') {
            // The shared wallet flow, opened on the customer's wallet or cash
            // top-up; back from its first screen returns to the customer screen.
            return (
              <WalletFlow
                scope={scope}
                can={can}
                initialScreen={target}
                initialParams={walletParamsForCustomer(c)}
                onBack={nav.back}
                onTabChange={(tab) => {
                  setCustomersEntry(null);
                  setActiveTab(tab);
                }}
              />
            );
          }
          if (target === 'NewSale') {
            return (
              <SalesFlow
                scope={scope}
                can={can}
                initialScreen="NewSale"
                initialParams={{ customerName: c?.name, customerCode: c?.code }}
                onBack={nav.back}
              />
            );
          }
          if (target === 'OrderDetail') {
            return (
              <OrdersModule
                scope={scope}
                can={can}
                initialScreen="M5S04"
                initialParams={{ orderId: p.order?.orderNo ?? p.orderNo, customerName: c?.name }}
                onBack={nav.back}
                onTabChange={(tab) => {
                  setCustomersEntry(null);
                  setActiveTab(tab);
                }}
                onNavigateToOperationalIssues={() => {
                  setCustomersEntry(null);
                  setStorageEntry({ screen: 'OperationalIssues' });
                }}
              />
            );
          }
          if (target === 'RmaDetail') {
            return (
              <CustomerIssueRmaFlow
                scope={scope}
                can={can}
                params={p}
                onBack={nav.back}
                onTabChange={(tab) => {
                  setCustomersEntry(null);
                  setActiveTab(tab);
                }}
              />
            );
          }
          return null;
        }}
      />
    );
  }

  if (showBilling) {
    // The billing & invoice screens and their navigator live in
    // admin/screens/warehouse/billing-invoices (shared with the Main shell).
    return (
      <BillingFlow
        scope={scope}
        can={can}
        onBack={() => {
          setShowBilling(false);
          setActiveTab(returnToTabOnBack || 'More');
          setReturnToTabOnBack(null);
        }}
        onTabChange={(tab) => {
          setShowBilling(false);
          setActiveTab(tab);
        }}
        onNavigateToNotifications={() => {
          if (onNavigate) onNavigate('SubWarehouseNotifications');
          else setShowNotifications(true);
        }}
      />
    );
  }

  if (showWalletOperations) {
    // The wallet hub and every wallet / cash top-up screen behind it are the
    // shared WalletFlow (admin/screens/warehouse/wallet-cashtopup).
    return (
      <WalletFlow
        scope={scope}
        can={can}
        onBack={() => {
          setShowWalletOperations(false);
          if (returnToNotificationsOnBack) {
            setReturnToNotificationsOnBack(false);
            setShowNotifications(true);
          } else {
            setActiveTab(returnToTabOnBack || 'More');
            setReturnToTabOnBack(null);
          }
        }}
        onTabChange={(tab) => {
          setShowWalletOperations(false);
          setActiveTab(tab);
        }}
        onNavigateToNotifications={() => {
          setShowWalletOperations(false);
          if (onNavigate) {
            onNavigate('SubWarehouseNotifications');
          } else {
            setShowNotifications(true);
          }
        }}
        onNavigateToProfile={() => {
          setShowWalletOperations(false);
          if (onNavigate) {
            onNavigate('SubWarehouseProfile');
          } else {
            setShowProfile(true);
          }
        }}
      />
    );
  }

  if (returnsEntry) {
    // The RMA screens and their navigator live in admin/screens/warehouse/returns-rma
    // (shared with the Main shell); this only passes the Sub scope through.
    return (
      <ReturnsFlow
        scope={scope}
        can={can}
        initialScreen={returnsEntry.screen}
        initialParams={returnsEntry.params}
        initialBackStack={returnsEntry.backStack}
        onBack={() => {
          setReturnsEntry(null);
          if (returnToNotificationsOnBack) {
            setReturnToNotificationsOnBack(false);
            setShowNotifications(true);
          } else if (returnToTabOnBack) {
            setActiveTab(returnToTabOnBack);
            setReturnToTabOnBack(null);
          }
        }}
        onTabChange={(tab) => {
          setReturnsEntry(null);
          setActiveTab(tab);
        }}
        onNavigateToNotifications={() => {
          setReturnsEntry(null);
          if (onNavigate) {
            onNavigate('SubWarehouseNotifications');
          } else {
            setShowNotifications(true);
          }
        }}
      />
    );
  }

  if (staffEntry) {
    return (
      // Shared staff & attendance flow (W4, M14), scope-locked to this warehouse.
      // The roster routes need warehouse.staff.list_view (SUB own); attendance is ungated.
      <StaffFlow
        scope={scope}
        can={can}
        initialScreen={staffEntry.screen}
        initialParams={{ attendanceFilter: staffEntry.filter }}
        onBack={() => {
          setStaffEntry(null);
          if (returnToTabOnBack) {
            setActiveTab(returnToTabOnBack);
            setReturnToTabOnBack(null);
          }
        }}
        onTabChange={(tab) => {
          setStaffEntry(null);
          setActiveTab(tab);
        }}
        onAssignDelivery={() => {
          setStaffEntry(null);
          setOrdersInitialScreen('M5S02');
          setOrdersInitialParams({ fulfillment: 'Delivery' });
          setShowOrdersModule(true);
        }}
      />
    );
  }

  if (showFinanceScreen) {
    return (
      // Shared finance flow (W4), scope-locked to this warehouse.
      <FinanceFlow
        scope={scope}
        can={can}
        onBack={() => {
          setShowFinanceScreen(false);
          setActiveTab(returnToTabOnBack || 'More');
          setReturnToTabOnBack(null);
        }}
        onTabChange={(tab) => {
          setShowFinanceScreen(false);
          setActiveTab(tab);
        }}
        onOpenWallet={() => {
          setShowFinanceScreen(false);
          setShowWalletOperations(true);
        }}
      />
    );
  }

  if (showSettingsScreen) {
    return (
      <ProfileFlow
        scope={scope}
        can={can}
        initialScreen="Settings"
        onBack={() => {
          setShowSettingsScreen(false);
          setActiveTab(returnToTabOnBack || 'More');
          setReturnToTabOnBack(null);
        }}
        onLogout={onSignOut}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <View style={{ flex: 1 }}>
        {activeTab === 'Home' && !showOrdersModule && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            decelerationRate={0.985}
            scrollEventThrottle={16}
            overScrollMode="never"
            bounces={true}
            nestedScrollEnabled={true}
          >
            {/* ─── Top Brand Header Banner ─── */}
            <View style={styles.headerBanner}>
              <View style={styles.headerTopRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.headerGreeting}>{greetingText(now, user?.fullName)}</Text>
                  <TouchableOpacity
                    style={styles.warehouseNameRow}
                    onPress={() => {
                      if (onNavigate) {
                        onNavigate('SubWarehouseOverview');
                      } else {
                        setHomeEntry({ screen: 'WarehouseSnapshot' });
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <WarehouseHeaderIcon />
                    <Text style={styles.warehouseNameText}>{warehouseLabel}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => {
                      if (onNavigate) {
                        onNavigate('SubWarehouseNotifications');
                      } else {
                        setShowNotifications(true);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <BellIcon />
                    {unreadNotifCount > 0 && (
                      <View style={styles.notifBadge}>
                        <Text style={styles.notifBadgeText}>
                          {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => {
                      if (onNavigate) {
                        onNavigate('SubWarehouseUserProfile');
                      } else {
                        setProfileInitialScreen('UserProfile');
                        setShowProfile(true);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <ProfileHeaderIcon />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.headerDate}>{formatAdminDate(now, now)}</Text>

              <View style={styles.assignedWarehousePill}>
                <LockBadgeIcon />
                <Text style={styles.assignedWarehouseText}>
                  {`${(warehouseLabel.replace(/\s*·\s*(Active|Assigned Warehouse)$/, '').includes('Warehouse') ? warehouseLabel.replace(/\s*·\s*(Active|Assigned Warehouse)$/, '') : `${warehouseLabel.replace(/\s*·\s*(Active|Assigned Warehouse)$/, '')} Warehouse`)} · Assigned Warehouse`}
                </Text>
              </View>
            </View>

            {/* ─── Main Content Container ─── */}
            <View style={styles.mainContainer}>
              {/* 1. Operational Status Card */}
              <View style={styles.statusCard}>
                <View style={styles.statusCardLeft}>
                  <Text style={styles.statusWarehouseTitle}>{warehouseLabel}</Text>
                  <View style={styles.operationalRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.operationalText}>Operational</Text>
                  </View>
                </View>

                <View style={styles.statusCardRight}>
                  <Text style={styles.receivingLabel}>Today's receiving</Text>
                  <Text style={styles.receivingValue}>
                    {receiptsTodayQuery.isLoading
                      ? '—'
                      : `${todayReceivingItems.length}${receiptsTodayQuery.data?.complete === false ? '+' : ''} ${todayReceivingItems.length === 1 ? 'shipment' : 'shipments'}`}
                  </Text>
                </View>
              </View>

              {/* 2. Today's Overview Grid */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={[styles.sectionHeading, { marginTop: 0, marginBottom: 0 }]}>Today's Overview</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowTodayOverview(true);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.overviewGrid}>
                {canOrders ? (
                  <>
                    {/* 1. Pending Orders */}
                    <OverviewDashboardCard
                      value={pendingOrdersText}
                      title="Pending Orders"
                      subtitle={t('home.pending_orders.subtitle')}
                      icon="orders"
                      onPress={() => {
                        setOrdersInitialScreen('M5S02');
                        setOrdersInitialParams(null);
                        setShowOrdersModule(true);
                      }}
                    />

                    {/* 2. Ready for Pickup */}
                    <OverviewDashboardCard
                      value={readyOrdersQuery.isLoading ? '—' : String(readyOrdersQuery.data?.count ?? 0).padStart(2, '0')}
                      title="Ready for Pickup"
                      subtitle={`${readyOrdersQuery.data?.count ?? 0} expected`}
                      icon="pickup"
                      onPress={() => {
                        setReturnToTabOnBack('Home');
                        setOrdersInitialScreen('M5S09');
                        setOrdersInitialParams(null);
                        setShowOrdersModule(true);
                      }}
                    />
                  </>
                ) : null}

                {/* 3. Today's Receiving */}
                <OverviewDashboardCard
                  value={receivingKpi.countText}
                  title="Today's Receiving"
                  subtitle={receivingKpi.awaitingText}
                  icon="receiving"
                  onPress={() => {
                    setReturnToTabOnBack('Home');
                    openReceiving('Dashboard');
                  }}
                />

                {/* 4. Low Stock Items (Stock Verification) */}
                {canStock ? (
                  <OverviewDashboardCard
                    value={lowStockCountText}
                    title="Low Stock Items"
                    subtitle="Needs attention"
                    icon="inventory"
                    tone="danger"
                    onPress={() => {
                      setReturnToTabOnBack('Home');
                      setInventoryInitialScreen('M3S10');
                      setActiveTab('Inventory');
                    }}
                  />
                ) : null}

                {/* 5. Today's Sales */}
                {canSales ? (
                  <OverviewDashboardCard
                    value={salesSummary.totalText}
                    title="Today's Sales"
                    subtitle={salesSummary.countText}
                    icon="sales"
                    onPress={() => {
                      if (onNavigate) {
                        onNavigate('SubWarehouseSales');
                      } else {
                        setReturnToTabOnBack('Home');
                        setShowSalesScreen(true);
                      }
                    }}
                  />
                ) : null}

                {/* 6. Cash Top-Ups */}
                <OverviewDashboardCard
                  value={cashSummary.totalText}
                  title="Cash Top-Ups"
                  subtitle={cashSummary.countText}
                  icon="cash"
                  onPress={() => {
                    setReturnToTabOnBack('Home');
                    setShowCashTopUp(true);
                  }}
                />
              </View>

              {/* 3. Quick Actions */}
              <Text style={styles.sectionHeading}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: adminColors.brand, borderWidth: 1, backgroundColor: adminColors.brandTint }]}
                  onPress={() => setReceivingWizardStep('start_receiving')}
                >
                  <ReceiveGoodsActionIcon />
                  <Text style={styles.quickActionLabel}>Receive Goods</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: adminColors.brand, borderWidth: 1, backgroundColor: adminColors.brandTint }]}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseSales');
                    } else {
                      setReturnToTabOnBack('Home');
                      setShowSalesScreen(true);
                    }
                  }}
                >
                  <CashRegisterActionIcon />
                  <Text style={styles.quickActionLabel}>New Sale</Text>
                </Pressable>

                {canOrders ? (
                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: adminColors.brand, borderWidth: 1, backgroundColor: adminColors.brandTint }]}
                  onPress={() => {
                    setReturnToTabOnBack('Home');
                    setShowOrdersModule(true);
                  }}
                >
                  <ViewOrdersActionIcon />
                  <Text style={styles.quickActionLabel}>View Orders</Text>
                </Pressable>
                ) : null}

                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: adminColors.brand, borderWidth: 1, backgroundColor: adminColors.brandTint }]}
                  onPress={() => {
                    setReturnToTabOnBack('Home');
                    setShowCashTopUp(true);
                  }}
                >
                  <CashTopUpActionIcon />
                  <Text style={styles.quickActionLabel}>Cash Top-Up</Text>
                </Pressable>

                {canStock ? (
                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: adminColors.brand, borderWidth: 1, backgroundColor: adminColors.brandTint }]}
                  onPress={() => {
                    setReturnToTabOnBack('Home');
                    setInventoryInitialScreen('M3S10');
                    setActiveTab('Inventory');
                  }}
                >
                  <StockVerifyActionIcon />
                  <Text style={[styles.quickActionLabel, { color: PALETTE.textInk }]}>Stock Verify</Text>
                </Pressable>
                ) : null}

                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: adminColors.brand, borderWidth: 1, backgroundColor: adminColors.brandTint }]}
                  onPress={() => {
                    setReturnToTabOnBack('Home');
                    setShowRecentActivity(true);
                  }}
                >
                  <ActivityHistoryActionIcon />
                  <Text style={styles.quickActionLabel}>Activity</Text>
                </Pressable>
              </View>

              {/* 4. Needs Attention */}
              <View style={styles.sectionHeaderRow}>
                <WarningTriangleIcon color={adminColors.warning.text} size={17} />
                <Text style={[styles.sectionHeading, { marginTop: 0, marginBottom: 0 }]}>Needs Attention</Text>
              </View>

              <View style={styles.alertList}>
                {(awaitingQcFirstReceipt || awaitingQcCount > 0) ? (
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() =>
                    awaitingQcFirstReceipt
                      ? openReceiving('ShipmentDetail', { shipmentId: awaitingQcFirstReceipt.grnNumber })
                      : openReceiving('Shipments')
                  }
                  activeOpacity={0.7}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.amberIconBg }]}>
                    <FlaskIcon />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>QC Pending</Text>
                    <Text style={styles.alertCardSub}>
                      {awaitingQcFirstReceipt
                        ? (() => {
                            const grams = awaitingQcFirstReceipt.grossQtyKg ? parseKgToGrams(awaitingQcFirstReceipt.grossQtyKg) : null;
                            const qtyStr = grams !== null ? formatKg(grams) : '';
                            const crop = awaitingQcFirstReceipt.cropName ?? '';
                            const grn = `Batch ${awaitingQcFirstReceipt.grnNumber}`;
                            return t('home.attention.qc_pending.detail', { crop, grn, qtyKg: qtyStr });
                          })()
                        : `${awaitingQcCount} shipment(s) awaiting quality check`}
                    </Text>
                  </View>
                </TouchableOpacity>
                ) : null}

                {canOrders && readyOrdersCount > 0 ? (
                <View style={styles.alertCard}>
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.amberIconBg }]}>
                    <ClockIcon />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>Pickup Pending</Text>
                    <Text style={styles.alertCardSub}>{readyOrdersCount} customer(s) are waiting for order pickup</Text>
                  </View>
                </View>
                ) : null}

                {canStock && lowStockView.hasAlert ? (
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => {
                    setReturnToTabOnBack('Home');
                    setInventoryInitialScreen('M3S10');
                    setActiveTab('Inventory');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.amberIconBg }]}>
                    <BoxIcon color={adminColors.warning.text} />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>{lowStockView.title}</Text>
                    <Text style={styles.alertCardSub}>{lowStockView.subText}</Text>
                  </View>
                </TouchableOpacity>
                ) : null}
              </View>

              {/* 5. Today's Receiving */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.sectionHeading}>Today's Receiving</Text>
                <Text style={styles.sectionHeaderSub}>
                  {receiptsTodayQuery.isLoading
                    ? '...'
                    : `${todayReceivingItems.length}${receiptsTodayQuery.data?.complete === false ? '+' : ''} Shipment${todayReceivingItems.length === 1 ? '' : 's'}`}
                </Text>
              </View>

              <View style={styles.cardStack}>
                {receiptsTodayQuery.isLoading ? (
                  <AdminLoadingState label="Loading today's receiving..." />
                ) : receiptsTodayQuery.isError ? (
                  <AdminErrorState
                    error={receiptsTodayQuery.error}
                    onRetry={() => receiptsTodayQuery.refetch()}
                  />
                ) : todayReceivingItems.length === 0 ? (
                  <AdminEmptyState
                    title="No shipments today"
                    subtitle="Incoming receipts for today will appear here."
                  />
                ) : (
                  todayReceivingItems.slice(0, 3).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.orderReceivingCard}
                      onPress={() => {
                        setReturnToTabOnBack('Home');
                        openReceiving('ShipmentDetail', { shipmentId: item.grnNumber });
                      }}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`View incoming shipments for ${item.grnNumber}`}
                    >
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.itemCodeBold}>{item.grnNumber}</Text>
                        {item.isAwaitingQc ? (
                          <View style={styles.awaitingQcBadge}>
                            <Text style={styles.awaitingQcText}>{item.status}</Text>
                          </View>
                        ) : (
                          <View style={styles.qcCompletedBadge}>
                            <Text style={styles.qcCompletedText}>{item.status}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.routeText}>{item.route}</Text>
                      <Text style={styles.produceTitle}>{item.produceTitle}</Text>
                      <View style={styles.rowBetween}>
                        <Text style={styles.detailText}>{item.detailText}</Text>
                        {item.timeText ? <Text style={styles.timeText}>{item.timeText}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  ))
                )}

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => {
                    setReturnToTabOnBack('Home');
                    openReceiving();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View All Receiving →</Text>
                </TouchableOpacity>
              </View>

              {/* 6. Today's Orders + 7. Order Status Summary: order.list.view_all */}
              {canOrders ? (
              <>
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.sectionHeading}>{t('home.recent_orders')}</Text>
                <Text style={styles.sectionHeaderSub}>
                  {ordersQuery.isLoading
                    ? '...'
                    : `${ordersQuery.data?.items.length ?? 0} Order${(ordersQuery.data?.items.length ?? 0) === 1 ? '' : 's'}`}
                </Text>
              </View>

              <View style={styles.cardStack}>
                {ordersQuery.isLoading ? (
                  <AdminLoadingState label="Loading today's orders..." />
                ) : ordersQuery.isError ? (
                  <AdminErrorState
                    error={ordersQuery.error}
                    onRetry={() => ordersQuery.refetch()}
                  />
                ) : (ordersQuery.data?.items.length ?? 0) === 0 ? (
                  <AdminEmptyState
                    title="No orders today"
                    subtitle="Customer orders placed today will appear here."
                  />
                ) : (
                  (ordersQuery.data?.items ?? []).slice(0, 3).map((order) => (
                    <TouchableOpacity
                      key={order.id}
                      style={styles.orderReceivingCard}
                      onPress={() => {
                        setReturnToTabOnBack('Home');
                        setOrdersInitialScreen('M5S02');
                        setOrdersInitialParams({ orderId: order.id, orderNo: order.orderNumber });
                        setShowOrdersModule(true);
                      }}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                    >
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.itemCodeBold}>#{order.orderNumber}</Text>
                        <View style={styles.readyPickupBadge}>
                          <Text style={styles.readyPickupText}>{order.status.replace(/_/g, ' ')}</Text>
                        </View>
                      </View>
                      <Text style={styles.produceTitle}>
                        {order.itemCount ? `${order.itemCount} Item${order.itemCount === 1 ? '' : 's'}` : 'Order Items'}
                      </Text>
                      <Text style={styles.detailText}>
                        {(() => {
                          const paise = parseRupeesToPaise(String(order.totalAmount));
                          const moneyText = paise === null ? '—' : formatPaise(paise);
                          return `${moneyText} · ${formatAdminTime(order.placedAt)}`;
                        })()}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => {
                    setReturnToTabOnBack('Home');
                    setOrdersInitialScreen('M5S02');
                    setOrdersInitialParams(null);
                    setShowOrdersModule(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View All Orders →</Text>
                </TouchableOpacity>
              </View>

              {/* 7. Order Status Summary */}
              <Text style={styles.sectionHeading}>Order Status Summary</Text>
              <View style={styles.statusSummaryGrid}>
                    <TouchableOpacity
                      style={styles.statusSummaryTile}
                      onPress={() => {
                        setReturnToTabOnBack('Home');
                        setOrdersInitialScreen('M5S02');
                        setOrdersInitialParams({ defaultFilter: 'Confirmed' });
                        setShowOrdersModule(true);
                      }}
                      activeOpacity={0.75}
                    >
                  <Text style={styles.statusSummaryNum}>{formatOrderCount(confirmedCountQuery)}</Text>
                  <Text style={styles.statusSummaryLabel}>NEW</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.statusSummaryTile}
                      onPress={() => {
                        setReturnToTabOnBack('Home');
                        setOrdersInitialScreen('M5S02');
                        setOrdersInitialParams({ defaultFilter: 'Packing' });
                        setShowOrdersModule(true);
                      }}
                      activeOpacity={0.75}
                    >
                  <Text style={styles.statusSummaryNum}>{formatOrderCount(packingCountQuery)}</Text>
                  <Text style={styles.statusSummaryLabel}>PACKING</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.statusSummaryTile}
                      onPress={() => {
                        setReturnToTabOnBack('Home');
                        setOrdersInitialScreen('M5S09');
                        setOrdersInitialParams(null);
                        setShowOrdersModule(true);
                      }}
                      activeOpacity={0.75}
                    >
                  <Text style={styles.statusSummaryNum}>{formatOrderCount(readyOrdersQuery)}</Text>
                  <Text style={styles.statusSummaryLabel}>READY</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.statusSummaryTile}
                      onPress={() => {
                        setReturnToTabOnBack('Home');
                        setOrdersInitialScreen('M5S02');
                        setOrdersInitialParams({ defaultFilter: 'Completed' });
                        setShowOrdersModule(true);
                      }}
                      activeOpacity={0.75}
                    >
                  <Text style={styles.statusSummaryNum}>{formatOrderCount(completedCountQuery)}</Text>
                  <Text style={styles.statusSummaryLabel}>COMPLETED</Text>
                    </TouchableOpacity>
              </View>
              </>
              ) : null}

              {/* 8. Inventory Snapshot: inventory.batch.view */}
              {canStock ? (
              <>
              <Text style={styles.sectionHeading}>Inventory Snapshot</Text>
              {inventoryOverviewQuery.isLoading ? (
                <AdminLoadingState label="Loading inventory..." />
              ) : inventoryOverviewQuery.isError ? (
                <AdminErrorState
                  error={inventoryOverviewQuery.error}
                  onRetry={() => inventoryOverviewQuery.refetch()}
                />
              ) : (
                <View style={styles.infoTableCard}>
                  <View style={styles.infoTableRow}>
                    <Text style={styles.infoTableLabel}>Available Stock</Text>
                    <Text style={styles.infoTableValue}>{availableStockText}</Text>
                  </View>
                  <View style={styles.infoTableRow}>
                    <Text style={styles.infoTableLabel}>Reserved</Text>
                    <Text style={styles.infoTableValue}>{reservedStockText}</Text>
                  </View>
                  <View style={styles.infoTableRow}>
                    <Text style={styles.infoTableLabel}>Low Stock</Text>
                    <Text style={[styles.infoTableValue, { color: adminColors.danger.text }]}>{lowStockSnapshotText}</Text>
                  </View>
                  {/* Ported from the absorbed Today's Overview (Inventory card). */}
                  <TouchableOpacity
                    style={[styles.infoTableRow, { borderBottomWidth: 0 }]}
                    onPress={() => {
                      setReturnToTabOnBack('Home');
                      setInventoryInitialScreen('M3S10');
                      setActiveTab('Inventory');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.infoTableLabel}>Verification Pending</Text>
                    <Text style={styles.infoTableValue}>{verificationPendingText}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.tableLinkButton}
                    onPress={() => {
                      setReturnToTabOnBack('Home');
                      setInventoryInitialScreen('M3S10');
                      setActiveTab('Inventory');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.linkButtonText}>View Inventory →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 9. Stock Allocation */}
              {canAllocations ? (
              <>
              <Text style={styles.sectionHeading}>Stock Allocation</Text>
              {allocationsQuery.isLoading ? (
                <AdminLoadingState label="Loading allocations..." />
              ) : allocationsQuery.isError ? (
                <AdminErrorState
                  error={allocationsQuery.error}
                  onRetry={() => allocationsQuery.refetch()}
                />
              ) : (allocationsQuery.data?.items.length ?? 0) === 0 ? (
                <AdminEmptyState
                  title={t('allocation.empty')}
                  subtitle="No channel allocations scheduled for today."
                />
              ) : (
                <View style={styles.infoTableCard}>
                  {allocationChannels?.map((ch, idx) => (
                    <View
                      key={ch.channel}
                      style={[
                        styles.infoTableRow,
                        idx === (allocationChannels.length - 1) ? { borderBottomWidth: 0 } : null,
                      ]}
                    >
                      <Text style={styles.infoTableLabel}>{ch.label}</Text>
                      <Text style={styles.infoTableValue}>{ch.valueText}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.tableLinkButton}
                    onPress={() => {
                      setReturnToTabOnBack('Home');
                      setInventoryInitialScreen('M3S02');
                      setInventoryInitialParams({ initialTab: 'Allocation' });
                      setActiveTab('Inventory');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.linkButtonText}>View Allocation Detail →</Text>
                  </TouchableOpacity>
                </View>
              )}
              </>
              ) : null}
              </>
              ) : null}

              {/* 10. Today's Sales Summary: finance.sales_income.view */}
              {canSales ? (
              <>
              <Text style={styles.sectionHeading}>Today's Sales Summary</Text>
              <View style={styles.infoTableCard}>
                <View style={styles.salesHeaderRow}>
                  <Text style={styles.salesTotalAmount}>{salesSummary.totalText}</Text>
                  <Text style={styles.salesTxnCount}>{salesSummary.countText}</Text>
                </View>
                {salesSummary.channels.map((channel, index) => (
                  <View
                    key={channel.key}
                    style={[styles.infoTableRow, index === salesSummary.channels.length - 1 ? { borderBottomWidth: 0 } : null]}
                  >
                    <Text style={styles.infoTableLabel}>{channel.label}</Text>
                    <Text style={styles.infoTableValue}>{channel.totalText}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.tableLinkButton}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseSales');
                    } else {
                      setReturnToTabOnBack('Home');
                      setShowSalesScreen(true);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View Sales Report →</Text>
                </TouchableOpacity>
              </View>
              </>
              ) : null}

              {/* 11. Cash Operations */}
              <Text style={styles.sectionHeading}>Cash Operations</Text>
              <View style={styles.infoTableCard}>
                <View style={styles.salesHeaderRow}>
                  <Text style={styles.salesTotalAmount}>{cashSummary.totalText}</Text>
                  <Text style={styles.salesTxnCount}>{cashSummary.countText}</Text>
                </View>
                <TouchableOpacity
                  style={styles.tableLinkButton}
                  onPress={() => {
                    setReturnToTabOnBack('Home');
                    setShowWalletOperations(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View History →</Text>
                </TouchableOpacity>
              </View>

              {/* 12. Recent Activity */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.sectionHeading}>Recent Activity</Text>
                <TouchableOpacity
                  onPress={() => setShowRecentActivity(true)}
                  activeOpacity={0.75}
                  style={{ paddingVertical: 4 }}
                >
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.activityCardContainer}>
                {activityQuery.isLoading ? (
                  <AdminLoadingState label="Loading recent activity..." />
                ) : activityQuery.isError ? (
                  <AdminErrorState
                    error={activityQuery.error}
                    onRetry={() => activityQuery.refetch()}
                  />
                ) : homeActivityPreview.length === 0 ? (
                  <AdminEmptyState
                    title="No recent activity"
                    subtitle="Recent activity events will appear here."
                  />
                ) : (
                  homeActivityPreview.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {index > 0 ? <View style={styles.cardDivider} /> : null}
                      <TouchableOpacity
                        style={styles.activityItemRow}
                        onPress={() => {
                          setReturnToTabOnBack('Home');
                          if (item.type === 'Receiving' || item.type === 'QC') {
                            if (item.reference) {
                              openReceiving('ShipmentDetail', { shipmentId: item.reference });
                            } else {
                              openReceiving('Shipments');
                            }
                          } else if (item.type === 'Orders') {
                            if (item.reference) {
                              setOrdersInitialScreen('M5S02');
                              setOrdersInitialParams({ orderId: item.reference, orderNo: item.reference });
                            } else {
                              setOrdersInitialScreen('M5S01');
                              setOrdersInitialParams(null);
                            }
                            setShowOrdersModule(true);
                          } else if (item.type === 'Cash') {
                            setShowCashTopUp(true);
                          } else if (item.type === 'Inventory') {
                            setInventoryInitialScreen('M3S10');
                            setActiveTab('Inventory');
                          }
                        }}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={`View details for ${item.title}`}
                      >
                        <View style={styles.activityIconBox}>
                          {item.type === 'Receiving' || item.type === 'QC' ? (
                            <ReceiveGoodsActionIcon />
                          ) : item.type === 'Orders' ? (
                            <PackageBagIcon />
                          ) : item.type === 'Cash' ? (
                            <CashTopUpActionIcon />
                          ) : (
                            <BoxIcon color={adminColors.brand} />
                          )}
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.activityItemTitle}>{item.title}</Text>
                          <Text style={styles.activityItemSub}>{item.subtitle}</Text>
                          <Text style={styles.activityTimeText}>{item.timeText}</Text>
                        </View>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))
                )}
              </View>

              {/* 13. Warehouse Alerts */}
              <Text style={styles.sectionHeading}>Warehouse Alerts</Text>
              <View style={styles.alertsContainerCard}>
                <View style={styles.alertBulletRow}>
                  <WarningTriangleIcon color={adminColors.warning.text} size={16} />
                  <Text style={styles.alertBulletText}>
                    {`${awaitingQcCount} QC check${awaitingQcCount === 1 ? '' : 's'} pending`}
                  </Text>
                </View>
                {canStock ? (
                  <View style={styles.alertBulletRow}>
                    <WarningTriangleIcon color={adminColors.warning.text} size={16} />
                    <Text style={styles.alertBulletText}>
                      {`${(alertsQuery.data?.items ?? []).filter((a) => a.type === 'LOW_STOCK').length} low-stock product${(alertsQuery.data?.items ?? []).filter((a) => a.type === 'LOW_STOCK').length === 1 ? '' : 's'}`}
                    </Text>
                  </View>
                ) : null}
                {canOrders ? (
                  <View style={styles.alertBulletRow}>
                    <InfoCircleIcon color={adminColors.info.text} size={16} />
                    <Text style={styles.alertBulletText}>
                      {`${readyOrdersCount} pickup${readyOrdersCount === 1 ? '' : 's'} scheduled today`}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={{ height: 28 }} />
            </View>
          </ScrollView>
        )}

        {/* ─── Receiving Tab: the shared receiving flow (W4) ─── */}
        {activeTab === 'Receiving' && !showOrdersModule && (
          <ReceivingFlow
            scope={scope}
            can={can}
            initialScreen={receivingEntry.screen}
            initialParams={receivingEntry.params}
            receiverName={userName}
            onScreenChange={(route) => setSubReceivingRoute(route)}
            onBack={() => {
              setActiveTab(returnToTabOnBack || 'Home');
              setReturnToTabOnBack(null);
              setReceivingEntry({ screen: 'Dashboard' });
              setSubReceivingRoute('Dashboard');
            }}
            onTabChange={(tab) => {
              if (tab === 'Receiving') openReceiving();
              else setActiveTab(tab);
            }}
            unreadNotifications={unreadNotifCount}
            onOpenNotifications={() => setShowNotifications(true)}
            onOpenOperationalIssues={() => setStorageEntry({ screen: 'OperationalIssues' })}
          />
        )}

        {/* ─── Inventory Tab ─── */}
        {activeTab === 'Inventory' && !showOrdersModule && (
          <InventoryModule
            scope={scope}
            can={can}
            initialScreen={inventoryInitialScreen}
            initialParams={inventoryInitialParams}
            onBack={() => {
              setInventoryInitialScreen(undefined);
              if (returnToNotificationsOnBack) {
                setReturnToNotificationsOnBack(false);
                setShowNotifications(true);
              } else if (initialInventoryScreen && onBack) {
                onBack();
              } else {
                setActiveTab(returnToTabOnBack || 'Home');
                setReturnToTabOnBack(null);
              }
            }}
            onTabChange={(tab) => {
              setInventoryInitialScreen(undefined);
              setReturnToNotificationsOnBack(false);
              setActiveTab(tab);
            }}
          />
        )}

        {/* ─── Orders Module ─── */}
        {showOrdersModule && (
          <OrdersModule
            key={`orders-${ordersInitialScreen}-${ordersInitialParams?.fulfillment ?? ''}`}
            scope={scope}
            can={can}
            initialScreen={ordersInitialScreen}
            initialParams={ordersInitialParams}
            onBack={() => {
              setShowOrdersModule(false);
              setOrdersInitialScreen('M5S01');
              setOrdersInitialParams(null);
              if (returnToNotificationsOnBack) {
                setReturnToNotificationsOnBack(false);
                setShowNotifications(true);
              } else if (initialShowOrders && onBack) {
                onBack();
              } else if (returnToTabOnBack) {
                setActiveTab(returnToTabOnBack);
                setReturnToTabOnBack(null);
              }
            }}
            onTabChange={(tab) => {
              setShowOrdersModule(false);
              setOrdersInitialScreen('M5S01');
              setOrdersInitialParams(null);
              setReturnToNotificationsOnBack(false);
              setActiveTab(tab);
            }}
            onNavigateToOperationalIssues={() => {
              setShowOrdersModule(false);
              setStorageEntry({ screen: 'OperationalIssues' });
            }}
          />
        )}

        {/* ─── More Modules Directory Tab (Modules 5 to 16) ─── */}
        {activeTab === 'More' && !showOrdersModule && (
          <MoreScreen
            scope={scope}
            can={can}
            onBack={() => setActiveTab('Home')}
            onNavigateToDashboard={() => setActiveTab('Home')}
            onTabChange={(tab) => {
              if (tab === 'More') return;
              setActiveTab(tab);
            }}
            onNavigateToNotifications={() => {
              if (onNavigate) onNavigate('SubWarehouseNotifications');
              else setShowNotifications(true);
            }}
            onNavigateToProfile={() => {
              if (onNavigate) {
                onNavigate('SubWarehouseProfile');
              } else {
                setReturnToTabOnBack('More');
                setProfileInitialScreen('WarehouseProfile');
                setShowProfile(true);
              }
            }}
            onNavigateToWallet={() => {
              if (onNavigate) onNavigate('WarehouseWalletOperations');
              else {
                setReturnToTabOnBack('More');
                setShowWalletOperations(true);
              }
            }}
            onNavigateToOrders={() => {
              setReturnToTabOnBack('More');
              setShowOrdersModule(true);
            }}
            onNavigateToSales={() => {
              if (onNavigate) onNavigate('SubWarehouseSales');
              else {
                setReturnToTabOnBack('More');
                setShowSalesScreen(true);
              }
            }}
            onNavigateToReports={() => {
              setReturnToTabOnBack('More');
              setShowReportsScreen(true);
            }}
            onNavigateToReturns={() => {
              if (onNavigate) onNavigate('SubWarehouseReturnsIssues');
              else {
                setReturnToTabOnBack('More');
                openReturns('ReturnsIssues');
              }
            }}
            onNavigateToReturnHistory={() => {
              if (onNavigate) onNavigate('SubWarehouseReturnHistory');
              else {
                setReturnToTabOnBack('More');
                openReturns('ReturnHistory');
              }
            }}
            onNavigateToCustomers={() => {
              if (onNavigate) onNavigate('SubWarehouseCustomerList');
              else {
                setReturnToTabOnBack('More');
                openCustomers('CustomersList');
              }
            }}
            onNavigateToBilling={() => {
              if (onNavigate) onNavigate('SubWarehouseBillingHub');
              else {
                setReturnToTabOnBack('More');
                setShowBilling(true);
              }
            }}
            onNavigateToStaff={() => {
              if (onNavigate) onNavigate('SubWarehouseStaff');
              else {
                setReturnToTabOnBack('More');
                setStaffEntry({ screen: 'Staff' });
              }
            }}
            onNavigateToAttendance={() => {
              if (onNavigate) onNavigate('SubWarehouseTodayAttendance');
              else {
                setReturnToTabOnBack('More');
                setStaffEntry({ screen: 'Attendance', filter: 'All' });
              }
            }}
            onNavigateToFinance={() => {
              if (onNavigate) onNavigate('SubWarehouseFinance');
              else {
                setReturnToTabOnBack('More');
                setShowFinanceScreen(true);
              }
            }}
            onNavigateToWarehouseOperations={() => {
              setReturnToTabOnBack('More');
              setStorageEntry({ screen: 'Operations' });
            }}
            onNavigateToStorageLocations={() => {
              setReturnToTabOnBack('More');
              setShowStorageInfo(true);
            }}
            onNavigateToReceiveGoods={() => {
              setReturnToTabOnBack('More');
              openReceiving('Shipments');
            }}
            onNavigateToStockVerification={() => {
              setReturnToTabOnBack('More');
              setInventoryInitialScreen('M3S10');
              setActiveTab('Inventory');
            }}
            onNavigateToSettings={() => {
              if (onNavigate) onNavigate('SubWarehouseSettings');
              else {
                setReturnToTabOnBack('More');
                setShowSettingsScreen(true);
              }
            }}
            onLogout={onSignOut}
          />
        )}
      </View>

      {/* ─── Bottom Navigation Bar (Home, More ONLY — Receiving and Inventory render their own) ─── */}
      {((activeTab === 'Home' && !showOrdersModule) ||
        (activeTab === 'More' && !showOrdersModule)) && (
        <View style={styles.bottomTabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigateTo('Home')}
            accessibilityRole="tab"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <HomeTabIcon active={activeTab === 'Home'} />
            <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigateTo('Receiving')}
            accessibilityRole="tab"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ReceivingTabIcon active={(activeTab as string) === 'Receiving'} />
            <Text style={[styles.tabLabel, (activeTab as string) === 'Receiving' && styles.tabLabelActive]}>Receiving</Text>
          </TouchableOpacity>

          <Pressable
            style={styles.tabItem}
            onPress={() => navigateTo('Inventory')}
            accessibilityRole="tab"
          >
            <InventoryTabIcon active={(activeTab as string) === 'Inventory'} />
            <Text style={[styles.tabLabel, (activeTab as string) === 'Inventory' && styles.tabLabelActive]}>Inventory</Text>
          </Pressable>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigateTo('More')}
            accessibilityRole="tab"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreTabIcon active={activeTab === 'More'} />
            <Text style={[styles.tabLabel, activeTab === 'More' && styles.tabLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // ─── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerGreeting: {
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.brandTint,
    marginBottom: 3,
  },
  warehouseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  warehouseNameText: {
    fontSize: 19,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: adminColors.danger.text,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  headerDate: {
    fontSize: 12,
    color: adminColors.brandTint,
    marginTop: 5,
    marginBottom: 8,
  },
  assignedWarehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: adminColors.headerPill.bg,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.headerPill.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  assignedWarehouseText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.onBrand,
  },

  // ─── Status Card ───────────────────────────────────────────────────────────
  statusCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
    shadowColor: adminColors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statusCardLeft: {
    flex: 1,
  },
  statusWarehouseTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  operationalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: PALETTE.greenDot,
  },
  operationalText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  statusCardRight: {
    alignItems: 'flex-end',
  },
  receivingLabel: {
    fontSize: 10.5,
    color: PALETTE.textSecondary,
  },
  receivingValue: {
    fontSize: 19,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 1,
  },
  syncText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.textMuted,
    marginTop: 2,
  },

  // ─── Section Headings ──────────────────────────────────────────────────────
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.primaryDark,
    marginTop: 6,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 10,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  sectionHeaderSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.linkText,
  },

  // ─── Today's Overview Grid ─────────────────────────────────────────────────
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 14,
  },
  overviewCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: adminColors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  overviewIconWrap: {
    width: 24,
    height: 24,
    marginBottom: 6,
    justifyContent: 'center',
  },
  overviewNumber: {
    fontSize: 19,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.4,
  },
  overviewTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 3,
  },
  overviewSub: {
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },

  // ─── Quick Actions ─────────────────────────────────────────────────────────
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
    marginBottom: 14,
  },
  quickActionBtn: {
    width: '31.6%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: adminColors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 6,
  },
  quickActionLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
  },

  // ─── Alert Cards (Needs Attention) ─────────────────────────────────────────
  alertList: {
    gap: 8,
    marginBottom: 14,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  alertIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  alertCardTextWrap: {
    flex: 1,
    paddingRight: 6,
  },
  alertCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  alertCardSub: {
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
    lineHeight: 14.5,
  },

  // ─── Stack & Order / Receiving Cards ───────────────────────────────────────
  cardStack: {
    gap: 8,
    marginBottom: 14,
  },
  orderReceivingCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  itemCodeBold: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  awaitingQcBadge: {
    backgroundColor: PALETTE.amberBadge,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  awaitingQcText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.amberText,
  },
  qcCompletedBadge: {
    backgroundColor: PALETTE.tealBadge,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  qcCompletedText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.tealText,
  },
  readyPickupBadge: {
    backgroundColor: PALETTE.tealBadge,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readyPickupText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.tealText,
  },
  routeText: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  produceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 11,
    color: PALETTE.textSecondary,
  },
  timeText: {
    fontSize: 11,
    color: PALETTE.textSecondary,
  },
  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.linkText,
  },

  // ─── Status Summary Row ────────────────────────────────────────────────────
  statusSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 7,
  },
  statusSummaryTile: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  statusSummaryNum: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  statusSummaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },

  // ─── Info Table Card ───────────────────────────────────────────────────────
  infoTableCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
  },
  infoTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8.5,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  infoTableLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  infoTableValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  tableLinkButton: {
    marginTop: 6,
    paddingTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  salesTotalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.primary,
    letterSpacing: -0.4,
  },
  salesTxnCount: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },

  // ─── Recent Activity (Matching Screenshot) ─────────────────────────────────
  activityCardContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  activityItemSub: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  activityTimeText: {
    fontSize: 10.5,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },

  // ─── Warehouse Alerts Card (Matching Screenshot) ───────────────────────────
  alertsContainerCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
    gap: 12,
  },
  alertBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  alertBulletText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: PALETTE.textInk,
  },






  // ─── Bottom Tab Bar ────────────────────────────────────────────────────────
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 7,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 2.5,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
});
