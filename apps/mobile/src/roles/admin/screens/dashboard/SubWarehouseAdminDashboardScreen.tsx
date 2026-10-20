import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { fetchMe, type UserMe } from '../../../farmer/api/auth';
import {
  ReceivingFlow,
  receivingRouteFor,
  type ReceivingRoute,
  type ReceivingRouteParams,
} from '../warehouse/receiving-qc';
import {
  NotificationsFlow,
  useUnreadNotificationCount,
  type NotificationsRoute,
  type NotificationsRouteParams,
} from '../warehouse/notifications';
import { ReportsScreen } from '../warehouse/reports';
import { SalesFlow } from '../warehouse/sales-direct';
import { WalletFlow, walletParamsForCustomer } from '../warehouse/wallet-cashtopup';
import {
  HOME_CODES,
  HomeFlow,
  MoreScreen,
  type HomeRoute,
  type HomeRouteParams,
} from '../warehouse/dashboard-home-more';
import {
  CustomersFlow,
  type CustomersRoute,
  type CustomersRouteParams,
} from '../warehouse/customers';
import { BillingFlow } from '../warehouse/billing-invoices';
import { StaffFlow, type AttendanceFilter, type StaffRoute } from '../warehouse/staff-attendance';
import {
  StorageFlow,
  type ActivityModule,
  type StorageRoute,
  type StorageRouteParams,
} from '../warehouse/storage-ops';
import {
  ExpenseDetailScreen,
  FinanceFlow,
  type PermissionCheck,
  type WarehouseScope,
} from '../warehouse/finance-expenses';
import { ProfileFlow, type ProfileRoute } from '../warehouse/profile-settings';
import { InventoryFlow } from '../warehouse/inventory';
import { OrdersFlow } from '../warehouse/orders';
import {
  ReturnsFlow,
  type ReturnsRoute,
  type ReturnsRouteParams,
  type ReturnsStackEntry,
} from '../warehouse/returns-rma';
// Areas with no API, and Staff for Sub, are hidden at their entry points (owner decision 2).
import { isAreaAvailable } from '../warehouse/availability';
import { useAdminMutation, useAdminQuery, useIdempotencyKey } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import {
  getTaskSummary,
  listTasks,
  markTaskDone,
  type TaskItemDto,
  type TaskType,
} from '../../api/tasks';
import {
  formatTaskDetails,
  formatTaskDue,
  formatTaskTitle,
  mapTaskBadgeLabel,
  mapTaskDestination,
  summarizeTaskCounts,
  type SummarizedTaskCounts,
} from '../warehouse/dashboard-home-more/mappers_tasks';
import { getSalesSummary } from '../../api/sales';
import { getDailyCashSummary } from '../../api/finance';
import { mapDailyCashSummary } from '../warehouse/finance-expenses/mappers';
import { formatPaise } from '../../money/paise';
import { parseMoney, toPaise } from '@tohfa/shared-types';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
// Recent Activity (live feed, BR-104): the admin activity client and the shared dashboard mappers.
import { queryViewState } from '../warehouse/shared/queryViewState';
import {
  useWarehouseActivityFeed,
  useWarehouseProfile,
} from '../warehouse/dashboard-home-more/useDashboardHomeData';
import { countLabel, gramsLabel, moneyLabel } from '../warehouse/dashboard-home-more/mappers_dashboardKpis';
import {
  useAllocationDashboard,
  useLowStockAlerts,
  useStockSummary,
} from '../warehouse/inventory/useInventoryData';
import { formatAdminDay } from '../../utils/datetime';
import {
  ACTIVITY_DATE_FILTERS,
  ACTIVITY_DATE_LABEL,
  ACTIVITY_TYPE_FILTERS,
  ACTIVITY_TYPE_LABEL,
  activityRange,
  istDateString,
  type ActivityDateFilter,
  type ActivityTypeFilter,
} from '../warehouse/dashboard-home-more/mappers_dashboardHome';
import {
  ChipGroup,
  StatusBadge,
  WalletButton,
  WalletScreen,
  walletLayout,
} from '../warehouse/wallet-cashtopup/WalletParts';
import { t } from '../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

// ─── Design Tokens (TOHFA Admin App Design System) ───────────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#7A2E14',
  primarySoft: '#FDF3F0',
  primaryBorder: '#EEDCD3',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted: '#5F5E5A',
  border: '#EEDCD3',
  divider: '#EEDCD3',
  greenBadge: '#EAF3DE',
  greenText: '#173404',
  greenDot: '#173404',
  amberBadge: '#FEF3E2',
  amberText: '#854F0B',
  amberIconBg: '#FEF3E2',
  redBadge: '#FCEBEB',
  redText: '#E24B4A',
  redIconBg: '#FCEBEB',
  tealBadge: '#E6F1FB',
  tealText: '#0C447C',
  tabInactive: '#5F5E5A',
  tabBorder: '#EEDCD3',
  linkText: '#F0562A',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function WarehouseHeaderIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#FFFFFF"
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
        stroke="#FFFFFF"
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
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke="#FFFFFF" strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ClipboardClockIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="1.8" />
      <Circle cx="16" cy="16" r="5" stroke={color} strokeWidth="1.8" fill="#FFF" />
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
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" fill="#FFF" />
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

function WarningTriangleIcon({ color = '#D97706', size = 16 }: { color?: string; size?: number }) {
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

function InfoCircleIcon({ color = '#2563EB', size = 16 }: { color?: string; size?: number }) {
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
      <Path d="M10 2v7.31L4.69 19.34A2 2 0 0 0 6.44 22h11.12a2 2 0 0 0 1.75-2.66L14 9.31V2M8.5 2h7M7 16h10" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExclamationCircleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BrokenCrateIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke="#DC2626" strokeWidth="2" />
      <Path d="M8 8l3 4-2 4 5-3 2 5" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
 * Opens the shared returns flow on the return of a customer issue. A customer
 * issue IS a return request, so its id is the return uuid: the flow reads the
 * live return by it (plan phase 10; ReturnsFlow passes it through
 * returnIdParam, so anything that is not a uuid shows "not found"). The params
 * are memoised because ReturnsFlow restarts its stack when they change.
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
  const initialParams = useMemo<ReturnsRouteParams>(() => ({ returnId: params.issue?.id }), [params]);
  return (
    <ReturnsFlow
      scope={scope}
      can={can}
      initialScreen="RmaDetail"
      initialParams={initialParams}
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
  /** Omitted when the operational issues area is hidden (no API yet). */
  onNavigateToOperationalIssues?: (() => void) | undefined;
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

function OverviewTruckIcon({ size = 20, color = '#8B4513' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="5" width="14" height="12" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M15 8h4l3 3v6h-7V8z" stroke={color} strokeWidth="1.8" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="17.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function OverviewReceiptIcon({ size = 20, color = '#8B4513' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 7h8M8 11h8M8 15h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function OverviewBoxIcon({ size = 20, color = '#8B4513' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function OverviewRegisterIcon({ size = 20, color = '#8B4513' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="6" y="14" width="12" height="8" rx="1" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function OverviewCashIcon({ size = 20, color = '#8B4513' }: { size?: number; color?: string }) {
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
  onOpenSales,
  onOpenCash,
  taskCounts,
  salesRevenueText,
  salesTxnCountText,
  cashTopUpText,
  warehouseLabel,
  warehouseId,
}: {
  onBack: () => void;
  onOpenReceiving?: () => void;
  onOpenOrders?: () => void;
  onOpenInventory?: () => void;
  onOpenSales?: () => void;
  onOpenCash?: () => void;
  taskCounts?: SummarizedTaskCounts | undefined;
  salesRevenueText?: string | undefined;
  salesTxnCountText?: string | undefined;
  cashTopUpText?: string | undefined;
  warehouseLabel?: string | undefined;
  /** The Sub admin's own warehouse (BR-30), for the live low-stock count. */
  warehouseId?: string | undefined;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const categories = ['All', 'Receiving', 'Orders', 'Inventory', 'Sales', 'Cash Top-Up'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0562A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />
      <View style={{ backgroundColor: '#F0562A', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>Today's Overview</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 }}>{warehouseLabel ? `Assigned Warehouse · ${warehouseLabel}` : 'Warehouse Overview'}</Text>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: '#F8F5F0' }}>
        <View style={{ paddingVertical: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: active ? '#F0562A' : '#FFFFFF',
                    borderRadius: 20,
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: active ? '#F0562A' : '#ECE8E3',
                  }}
                >
                  <Text style={{ color: active ? '#FFFFFF' : '#4A4A4A', fontWeight: '700', fontSize: 13 }}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
          {(activeCategory === 'All' || activeCategory === 'Receiving') && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenReceiving}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#ECE8E3',
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FDF1E8', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <OverviewTruckIcon size={20} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>Receiving</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>{taskCounts ? String(taskCounts.qcPending).padStart(2, '0') : t('dashboardHome.noValue')}</Text>
                  <Text style={{ fontSize: 13, color: '#666666', marginTop: 2 }}>pending QC</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {(activeCategory === 'All' || activeCategory === 'Orders') && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenOrders}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#ECE8E3',
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FDF1E8', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <OverviewReceiptIcon size={20} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>Orders</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>{taskCounts ? String(taskCounts.ordersActionable).padStart(2, '0') : t('dashboardHome.noValue')}</Text>
                  <Text style={{ fontSize: 13, color: '#666666', marginTop: 2 }}>actionable</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>{taskCounts ? String(taskCounts.readyForPickup).padStart(2, '0') : t('dashboardHome.noValue')}</Text>
                  <Text style={{ fontSize: 13, color: '#666666', marginTop: 2 }}>ready pickup</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {(activeCategory === 'All' || activeCategory === 'Inventory') && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenInventory}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#ECE8E3',
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FDF1E8', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <OverviewBoxIcon size={20} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>Inventory</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                  {warehouseId !== undefined ? (
                    <SubLowStockCount warehouseId={warehouseId} style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }} />
                  ) : (
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>{t('dashboardHome.noValue')}</Text>
                  )}
                  <Text style={{ fontSize: 13, color: '#666666', marginTop: 2 }}>low stock</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {(activeCategory === 'All' || activeCategory === 'Sales') && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenSales}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#ECE8E3',
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FDF1E8', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <OverviewRegisterIcon size={20} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>Sales</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>{salesTxnCountText ?? t('dashboardHome.noValue')}</Text>
                  <Text style={{ fontSize: 13, color: '#666666', marginTop: 2 }}>transactions</Text>
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>{salesRevenueText ?? t('dashboardHome.noValue')}</Text>
                  <Text style={{ fontSize: 13, color: '#666666', marginTop: 2 }}>today's total</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {(activeCategory === 'All' || activeCategory === 'Cash Top-Up') && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenCash}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#ECE8E3',
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#FDF1E8', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <OverviewCashIcon size={20} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>Cash Top-Up</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>{cashTopUpText ?? t('dashboardHome.noValue')}</Text>
                  <Text style={{ fontSize: 13, color: '#666666', marginTop: 2 }}>today's total</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/**
 * Recent Activity: the live activity feed of this warehouse (GET
 * /v1/warehouses/{id}/activity, warehouse.activity.view, Sub = own, BR-104):
 * stock movements, goods receipts, transfers, issues, returns and documents,
 * newest first, cursor paged. The date chips send the inclusive IST from/to
 * the API takes; the type chips are exactly the API's types (the old Cash /
 * QC / Orders filters had no source and are gone). An event carries no actor
 * name and no free text, so neither is shown.
 */
function SubWarehouseRecentActivityView({
  warehouseId,
  onBack,
}: {
  warehouseId: string | undefined;
  onBack: () => void;
}) {
  const [dateFilter, setDateFilter] = useState<ActivityDateFilter>('today');
  const [typeFilter, setTypeFilter] = useState<ActivityTypeFilter>('all');
  const range = useMemo(() => activityRange(dateFilter, new Date()), [dateFilter]);
  const feed = useWarehouseActivityFeed(warehouseId, typeFilter === 'all' ? undefined : typeFilter, range);
  const viewState = queryViewState({ isLoading: feed.isLoading, error: feed.error, itemCount: feed.items.length });

  return (
    <WalletScreen title={t('dashboardHome.activity.title')} onBack={onBack}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={activityStyles.filters}>
          <ChipGroup
            options={ACTIVITY_DATE_FILTERS}
            value={dateFilter}
            onChange={setDateFilter}
            labelOf={(f) => t(ACTIVITY_DATE_LABEL[f])}
          />
          <ChipGroup
            options={ACTIVITY_TYPE_FILTERS}
            value={typeFilter}
            onChange={setTypeFilter}
            labelOf={(f) => t(ACTIVITY_TYPE_LABEL[f])}
          />
        </View>

        {viewState === 'loading' ? (
          <AdminLoadingState />
        ) : viewState === 'error' ? (
          <AdminErrorState error={feed.error} onRetry={feed.refresh} />
        ) : viewState === 'empty' ? (
          <AdminEmptyState title={t('dashboardHome.activity.empty')} />
        ) : (
          feed.items.map((item) => (
            <View key={item.key} style={activityStyles.card}>
              <View style={activityStyles.rowBetween}>
                <Text style={activityStyles.title}>{item.reference}</Text>
                <StatusBadge label={item.typeLabel} tone="brandSoft" />
              </View>
              {[item.qty, item.direction, item.status].some((v) => v !== null) ? (
                <Text style={activityStyles.subtitle}>
                  {[item.qty, item.direction, item.status].filter((v): v is string => v !== null).join(' · ')}
                </Text>
              ) : null}
              <Text style={activityStyles.meta}>{item.when}</Text>
            </View>
          ))
        )}
        {feed.hasMore ? <WalletButton label={t('dashboardHome.loadMore')} variant="outline" onPress={feed.loadMore} /> : null}
      </ScrollView>
    </WalletScreen>
  );
}

const activityStyles = StyleSheet.create({
  filters: { marginTop: adminSpacing.sm, marginBottom: adminSpacing.md, gap: adminSpacing.sm },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: adminSpacing.sm },
  title: { ...adminType.sectionHead, color: adminColors.ink, flex: 1 },
  subtitle: { ...adminType.body, color: adminColors.muted },
  meta: { ...adminType.rowMeta, color: adminColors.muted },
});

function getTaskIcon(type: TaskType) {
  switch (type) {
    case 'GOODS_RECEIPT_QC':
      return <FlaskIcon />;
    case 'ORDER_PACK':
      return <PackageBagIcon />;
    case 'ORDER_DISPATCH':
      return <DeliveryTruckIcon />;
    case 'ORDER_PICKUP_OTP':
      return <PersonCheckIcon />;
    case 'RETURN_INSPECTION':
      return <BrokenCrateIcon />;
    case 'RETURN_APPROVAL':
      return <ExclamationCircleIcon />;
  }
}

function getTaskIconBg(type: TaskType): string {
  switch (type) {
    case 'GOODS_RECEIPT_QC':
    case 'ORDER_PACK':
    case 'ORDER_PICKUP_OTP':
      return PALETTE.amberIconBg;
    case 'ORDER_DISPATCH':
      return PALETTE.tealBadge;
    case 'RETURN_INSPECTION':
    case 'RETURN_APPROVAL':
      return PALETTE.redIconBg;
  }
}

/** Recent Activity rows on Home: a list length, not a business limit. */
const SUB_RECENT_ACTIVITY_ROWS = 3;

/**
 * The live LOW_STOCK alert count of this warehouse (GET /admin/alerts, BR-77);
 * the dash until it loads. Shares the inventory area's query key, so every
 * place that shows it costs one read.
 */
function SubLowStockCount({ warehouseId, style }: { warehouseId: string; style: StyleProp<TextStyle> }) {
  const alerts = useLowStockAlerts(warehouseId);
  const count = alerts.isLoading || alerts.error ? null : alerts.items.length;
  return <Text style={style}>{countLabel(count)}</Text>;
}

/**
 * Inventory Snapshot + Stock Allocation from the live batches, allocations and
 * LOW_STOCK alerts (useStockSummary / useAllocationDashboard). The old
 * "Verification Pending" row had no read and is gone.
 */
function SubInventorySections({
  warehouseId,
  onOpenInventory,
  onOpenAllocation,
}: {
  warehouseId: string;
  onOpenInventory: () => void;
  onOpenAllocation: () => void;
}) {
  const stock = useStockSummary(warehouseId);
  const allocation = useAllocationDashboard(warehouseId);
  const stockKnown = !stock.isLoading && !stock.error;
  const allocationKnown = !allocation.isLoading && !allocation.error;
  return (
    <>
      <Text style={styles.sectionHeading}>Inventory Snapshot</Text>
      <View style={styles.infoTableCard}>
        <View style={styles.infoTableRow}>
          <Text style={styles.infoTableLabel}>Available Stock</Text>
          <Text style={styles.infoTableValue}>{gramsLabel(stockKnown ? stock.summary.totalAvailableGrams : null)}</Text>
        </View>
        <View style={styles.infoTableRow}>
          <Text style={styles.infoTableLabel}>Reserved</Text>
          <Text style={styles.infoTableValue}>{gramsLabel(stockKnown ? stock.summary.totalReservedGrams : null)}</Text>
        </View>
        <View style={styles.infoTableRow}>
          <Text style={styles.infoTableLabel}>Allocated</Text>
          <Text style={styles.infoTableValue}>{gramsLabel(stock.allocatedGrams)}</Text>
        </View>
        <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoTableLabel}>Low Stock</Text>
          <Text style={[styles.infoTableValue, styles.overviewNumberDanger]}>{countLabel(stock.lowStockCount)}</Text>
        </View>
        <TouchableOpacity style={styles.tableLinkButton} onPress={onOpenInventory} activeOpacity={0.7}>
          <Text style={styles.linkButtonText}>View Inventory →</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeading}>Stock Allocation</Text>
      <View style={styles.infoTableCard}>
        {allocation.dashboard.channels.map((channel, index) => (
          <View
            key={channel.channel}
            style={[styles.infoTableRow, index === allocation.dashboard.channels.length - 1 ? { borderBottomWidth: 0 } : null]}
          >
            <Text style={styles.infoTableLabel}>{channel.label}</Text>
            <Text style={styles.infoTableValue}>{gramsLabel(allocationKnown ? channel.allocatedGrams : null)}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.tableLinkButton} onPress={onOpenAllocation} activeOpacity={0.7}>
          <Text style={styles.linkButtonText}>View Allocation Detail →</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

/** The newest live events of this warehouse (GET /warehouses/{id}/activity, BR-104). */
function SubRecentActivityCard({ warehouseId }: { warehouseId: string }) {
  const feed = useWarehouseActivityFeed(warehouseId, undefined, {});
  const rows = feed.items.slice(0, SUB_RECENT_ACTIVITY_ROWS);
  if (feed.isLoading) return <AdminLoadingState />;
  if (feed.error) return <AdminErrorState error={feed.error} onRetry={feed.refresh} />;
  if (rows.length === 0) return <AdminEmptyState title={t('mainDashboard.activity.none')} />;
  return (
    <View style={styles.activityCardContainer}>
      {rows.map((row, index) => (
        <React.Fragment key={row.key}>
          {index > 0 ? <View style={styles.cardDivider} /> : null}
          <View style={styles.activityItemRow}>
            <View style={styles.activityIconBox}>
              {row.type === 'GOODS_RECEIPT' ? <ReceiveGoodsActionIcon /> : <PackageBagIcon />}
            </View>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.activityItemTitle}>{row.typeLabel}</Text>
              <Text style={styles.activityItemSub}>{row.qty === null ? row.reference : t('mainDashboard.activity.sub', { warehouse: row.reference, qty: row.qty })}</Text>
              <Text style={styles.activityTimeText}>{row.when}</Text>
            </View>
          </View>
        </React.Fragment>
      ))}
    </View>
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
}: SubWarehouseAdminDashboardScreenProps) {
  const [showTodayOverview, setShowTodayOverview] = useState(initialShowTodayOverview);
  const [showRecentActivity, setShowRecentActivity] = useState(
    initialShowRecentActivity && isAreaAvailable('warehouseActivity', can),
  );
  useEffect(() => {
    if (initialShowTodayOverview) {
      setShowTodayOverview(true);
    }
  }, [initialShowTodayOverview]);
  useEffect(() => {
    if (initialShowRecentActivity && isAreaAvailable('warehouseActivity', can)) {
      setShowRecentActivity(true);
    }
  }, [initialShowRecentActivity, can]);
  const [activeTab, setActiveTab] = useState<SubWHTab>(initialTab || 'Home');
  // The Receiving tab: ReceivingFlow (dashboard, shipments, search & filters,
  // shipment detail, wizard, history, quality issues) owns its stack (W4).
  // This entry only says where the tab opens.
  const [receivingEntry, setReceivingEntry] = useState<{
    screen: ReceivingRoute;
    params?: ReceivingRouteParams | undefined;
  }>(() => receivingRouteFor(initialReceivingSubView));
  const openReceiving = (screen: ReceivingRoute = 'Dashboard', params?: ReceivingRouteParams) => {
    setReceivingEntry({ screen, params });
    setActiveTab('Receiving');
  };
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
  // The bell badge: the server's unread total (GET /notifications). The
  // NotificationsFlow owns the list and the read writes, which refetch this.
  const unreadNotifCount = useUnreadNotificationCount();

  /** Switch tab; the Receiving tab opens on its dashboard. */
  const navigateTo = (tab: SubWHTab) => {
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
      if (showNotifications) {
        setShowNotifications(false);
        return true;
      }
      if (showOrdersModule) {
        setShowOrdersModule(false);
        if (returnToNotificationsOnBack) {
          setReturnToNotificationsOnBack(false);
          setShowNotifications(true);
        }
        return true;
      }
      if (activeTab === 'Inventory' && returnToNotificationsOnBack) {
        setInventoryInitialScreen(undefined);
        setReturnToNotificationsOnBack(false);
        setShowNotifications(true);
        return true;
      }
      // ReceivingFlow walks its own stack (its listener handles the press).
      if (activeTab === 'Receiving') return false;
      if (activeTab !== 'Home') {
        setActiveTab('Home');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [activeTab, showNotifications, showOrdersModule]);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => { });
  }, []);

  const userName = user?.fullName?.split(' ')[0] ?? 'Suresh';
  // Home is locked to the assigned warehouse (scope), never a written-in name.
  const warehouseLabel = scope.warehouseName ?? scope.warehouseId ?? '';
  const warehouseShort = warehouseLabel.replace(/ Warehouse$/, '');
  // Home section gates (FINAL_LIST 26; SUB own for all three). The server
  // filters again; these only decide which cards are worth drawing.
  const canOrders = can(HOME_CODES.orderList);
  const canStock = can(HOME_CODES.batchView);
  const canSales = can(HOME_CODES.salesIncome);

  // The IST calendar day (the server's date params), not the UTC one toISOString gives.
  const todayIso = useMemo(() => istDateString(new Date()), []);
  // GET /admin/sales/summary is authorised by sales.dashboard.view (BR-96), not the income code.
  const canSalesSummary = can('sales.dashboard.view');
  const warehouseProfile = useWarehouseProfile(scope.warehouseId);

  // Live task summary query (BR-77)
  const taskSummaryQuery = useAdminQuery(
    adminKeys.scoped('tasks', scope.warehouseId, { resource: 'summary' }),
    (signal) => getTaskSummary({ warehouseId: scope.warehouseId }, signal),
  );
  const taskSummary = taskSummaryQuery.data;
  const taskCounts = useMemo(() => summarizeTaskCounts(taskSummary), [taskSummary]);
  // Task figures are the dash until the summary loads, never a fake 00.
  const taskCountText = (count: number) => (taskSummary === undefined ? countLabel(null) : String(count).padStart(2, '0'));

  // Live open tasks query (BR-77)
  const openTasksQuery = useAdminQuery(
    adminKeys.scoped('tasks', scope.warehouseId, { resource: 'open-tasks' }),
    (signal) => listTasks({ state: 'open', warehouseId: scope.warehouseId }, signal),
  );
  const openTasks = useMemo(() => openTasksQuery.data?.items ?? [], [openTasksQuery.data]);

  // Live sales summary query (BR-96)
  const salesSummaryQuery = useAdminQuery(
    adminKeys.scoped('sales', scope.warehouseId, { resource: 'summary', from: todayIso, to: todayIso }),
    (signal) => getSalesSummary({ warehouseId: scope.warehouseId, from: todayIso, to: todayIso }, signal),
    { enabled: canSales && canSalesSummary },
  );
  const salesSummary = salesSummaryQuery.data;

  // Live daily cash summary query (BR-74)
  const dailyCashQuery = useAdminQuery(
    adminKeys.scoped('finance', scope.warehouseId, { resource: 'daily-summary', date: todayIso }),
    (signal) => getDailyCashSummary({ warehouseId: scope.warehouseId, date: todayIso }, signal),
  );
  const dailyCashSummary = useMemo(
    () => (dailyCashQuery.data ? mapDailyCashSummary(dailyCashQuery.data) : undefined),
    [dailyCashQuery.data],
  );

  // markTaskDone mutation with Idempotency-Key (BR-78)
  const idempotency = useIdempotencyKey();
  const markDoneMutation = useAdminMutation({
    mutationFn: ({ itemKey, idempotencyKey }: { itemKey: string; idempotencyKey: string }) =>
      markTaskDone(itemKey, idempotencyKey),
    invalidates: [adminKeys.scoped('tasks', scope.warehouseId)],
  });

  const handleMarkDone = (task: TaskItemDto) => {
    const key = idempotency.keyFor(task.itemKey);
    markDoneMutation.mutate({ itemKey: task.itemKey, idempotencyKey: key });
  };

  const handleOpenTask = (task: TaskItemDto) => {
    const dest = mapTaskDestination(task);
    if (dest.module === 'receiving') {
      openReceiving('Shipments', { shipmentId: dest.refId });
    } else if (dest.module === 'orders') {
      setOrdersInitialScreen('M5S04');
      setOrdersInitialParams({ orderId: dest.refId });
      setShowOrdersModule(true);
    } else if (dest.module === 'returns') {
      openReturns('ReturnsIssues');
    }
  };

  // Unloaded money reads as the dash, never as a fake ₹0.
  const salesRevenueText = useMemo(() => moneyLabel(salesSummary?.revenue), [salesSummary]);

  const salesTxnCountText = useMemo(() => {
    if (!salesSummary) return countLabel(null);
    return t('mainDashboard.sub.transactions', { count: salesSummary.count });
  }, [salesSummary]);

  const cashTopUpText = useMemo(() => {
    if (!dailyCashSummary) return countLabel(null);
    return formatPaise(dailyCashSummary.cashTopUpsPaise);
  }, [dailyCashSummary]);

  const formatChannelRevenue = (...channels: string[]) => {
    if (!salesSummary) return countLabel(null);
    const totalPaise = salesSummary.byChannel
      .filter((c) => channels.includes(c.channel))
      .reduce((sum, c) => {
        try {
          return sum + toPaise(parseMoney(String(c.revenue || '0')));
        } catch {
          return sum;
        }
      }, 0);
    return formatPaise(totalPaise);
  };


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
        onNavigateToOperationalIssues={isAreaAvailable('operationalIssues', can) ? () => {
          setTaskOrderNo(null);
          setHomeEntry(null);
          setStorageEntry({ screen: 'OperationalIssues' });
        } : undefined}
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

  if (notificationsEntry !== null) {
    return (
      <NotificationsFlow
        scope={scope}
        can={can}
        initialScreen={notificationsEntry.screen}
        initialParams={notificationsEntry.params}
        onBack={() => setNotificationsEntry(null)}
        onTabChange={(tab) => {
          setNotificationsEntry(null);
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
          setReturnToNotificationsOnBack(true);
          if (target === 'ReviewReceiving') {
            // The one-page review had no API: pick the order to receive instead.
            setReturnToNotificationsOnBack(false);
            openReceiving('Shipments');
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
            // The alert carries no receipt id: open the live Receiving History.
            setNotificationsEntry(null);
            openReceiving('History');
          } else if (alert.record === 'LowStock') {
            setNotificationsEntry(null);
            setInventoryInitialScreen('M3S09');
            setInventoryInitialParams(null);
            setActiveTab('Inventory');
          } else if (alert.record === 'Transfer' && isAreaAvailable('interWarehouseTransfers', can)) {
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
          // Back from Storage List → go back to Profile or Operations
          setShowStorageInfo(false);
          if (!showProfile) setStorageEntry({ screen: 'Operations' });
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
        // Stock verification has no server API (availability.ts).
        if (!isAreaAvailable('stockCounts', can)) break;
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
        if (isAreaAvailable('staff', can)) setStaffEntry({ screen: 'Attendance', filter: 'All' });
        break;
      case 'qc':
        setNotificationsEntry({
          screen: 'NotificationDetail',
          params: {
            notification: {
              id: 'qc-1',
              category: 'quality',
              title: 'QC Required',
              message: 'Tomato batch GR-1024 is waiting for quality inspection.',
              timestamp: '10 minutes ago',
              isRead: false,
              reference: 'GR-1024',
              target: 'ReviewReceiving',
            },
          },
        });
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

  if (showTodayOverview) {
    return (
      <SubWarehouseTodayOverviewView
        onBack={() => setShowTodayOverview(false)}
        onOpenReceiving={() => {
          setShowTodayOverview(false);
          openReceiving();
        }}
        onOpenOrders={() => {
          setShowTodayOverview(false);
          setShowOrdersModule(true);
        }}
        onOpenInventory={() => {
          setShowTodayOverview(false);
          setInventoryInitialScreen('M3S01');
          setActiveTab('Inventory');
        }}
        onOpenSales={() => {
          setShowTodayOverview(false);
          setShowSalesScreen(true);
        }}
        onOpenCash={() => {
          setShowTodayOverview(false);
          setShowCashTopUp(true);
        }}
        taskCounts={taskSummary === undefined ? undefined : taskCounts}
        warehouseId={scope.warehouseId}
        salesRevenueText={salesRevenueText}
        salesTxnCountText={salesTxnCountText}
        cashTopUpText={cashTopUpText}
        warehouseLabel={warehouseLabel}
      />
    );
  }

  if (showRecentActivity) {
    return (
      <SubWarehouseRecentActivityView
        warehouseId={scope.warehouseId}
        onBack={() => setShowRecentActivity(false)}
      />
    );
  }

  if (showProfile) {
    return (
      <ProfileFlow
        scope={scope}
        can={can}
        initialScreen={profileInitialScreen}
        onBack={() => setShowProfile(false)}
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
          setActiveTab('More');
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
          setActiveTab('More');
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
        onBack={() => setShowCashTopUp(false)}
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
            setActiveTab('More');
          } else if (fromOrders && returnToNotificationsOnBack) {
            setReturnToNotificationsOnBack(false);
            setShowNotifications(true);
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
                initialParams={{ orderId: p.orderId, customerName: c?.name }}
                onBack={nav.back}
                onTabChange={(tab) => {
                  setCustomersEntry(null);
                  setActiveTab(tab);
                }}
                onNavigateToOperationalIssues={isAreaAvailable('operationalIssues', can) ? () => {
                  setCustomersEntry(null);
                  setStorageEntry({ screen: 'OperationalIssues' });
                } : undefined}
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
          setActiveTab('More');
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
            setActiveTab('More');
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
        onBack={() => setStaffEntry(null)}
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
          setActiveTab('More');
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
          setActiveTab('More');
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
            {/* ─── Top Brand Header Banner (#F0562A) ─── */}
            <View style={styles.headerBanner}>
              <View style={styles.headerTopRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.headerGreeting}>Good Morning, {userName}</Text>
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

              <Text style={styles.headerDate}>{formatAdminDay(new Date())}</Text>

              <View style={styles.assignedWarehousePill}>
                <LockBadgeIcon />
                <Text style={styles.assignedWarehouseText}>Assigned Warehouse · Cannot switch</Text>
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
                    <Text style={styles.operationalText}>
                      {warehouseProfile.data === undefined
                        ? t('dashboardHome.noValue')
                        : t(warehouseProfile.data.isActive ? 'dashboardHome.snapshot.active' : 'dashboardHome.snapshot.inactive')}
                    </Text>
                  </View>
                </View>

                {/* Open QC tasks (GET /admin/tasks/summary); the old shipment count and sync time had no source. */}
                <View style={styles.statusCardRight}>
                  <Text style={styles.receivingLabel}>{t('mainDashboard.sub.awaitingQc')}</Text>
                  <Text style={styles.receivingValue}>{taskCountText(taskCounts.qcPending)}</Text>
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
                <View style={styles.overviewCard}>
                  <View style={styles.overviewIconWrap}>
                    <ClipboardClockIcon />
                  </View>
                  <Text style={styles.overviewNumber}>{taskCountText(taskCounts.ordersActionable)}</Text>
                  <Text style={styles.overviewTitle}>Pending Orders</Text>
                  <Text style={styles.overviewSub}>{taskCounts.ordersActionable} need action</Text>
                </View>

                {/* 2. Ready for Pickup */}
                <View style={styles.overviewCard}>
                  <View style={styles.overviewIconWrap}>
                    <PersonCheckIcon />
                  </View>
                  <Text style={styles.overviewNumber}>{taskCountText(taskCounts.readyForPickup)}</Text>
                  <Text style={styles.overviewTitle}>Ready for Pickup</Text>
                  <Text style={styles.overviewSub}>{taskCounts.readyForPickup} customers expected</Text>
                </View>
                </>
                ) : null}

                {/* 3. Today's Receiving */}
                <View style={styles.overviewCard}>
                  <View style={styles.overviewIconWrap}>
                    <DeliveryTruckIcon />
                  </View>
                  <Text style={styles.overviewNumber}>{taskCountText(taskCounts.qcPending)}</Text>
                  <Text style={styles.overviewTitle}>Today's Receiving</Text>
                  <Text style={styles.overviewSub}>{taskCounts.qcPending} awaiting QC</Text>
                </View>

                {/* 4. Low Stock Items */}
                {canStock ? (
                <View style={styles.overviewCard}>
                  <View style={styles.overviewIconWrap}>
                    <BoxIcon color={PALETTE.primary} />
                  </View>
                  {/* LOW_STOCK is an alert, not a task type: the count is the live alert list (BR-77). */}
                  {scope.warehouseId !== undefined ? (
                    <SubLowStockCount warehouseId={scope.warehouseId} style={[styles.overviewNumber, styles.overviewNumberDanger]} />
                  ) : null}
                  <Text style={styles.overviewTitle}>Low Stock Items</Text>
                  <Text style={[styles.overviewSub, { color: '#E11D48' }]}>Needs attention</Text>
                </View>
                ) : null}

                {/* 5. Today's Sales */}
                {canSales ? (
                <View style={styles.overviewCard}>
                  <View style={styles.overviewIconWrap}>
                    <BanknotesIcon />
                  </View>
                  <Text style={styles.overviewNumber}>{salesRevenueText}</Text>
                  <Text style={styles.overviewTitle}>Today's Sales</Text>
                  <Text style={styles.overviewSub}>{salesTxnCountText}</Text>
                </View>
                ) : null}

                {/* 6. Cash Top-Ups */}
                <View style={styles.overviewCard}>
                  <View style={styles.overviewIconWrap}>
                    <WalletIcon />
                  </View>
                  <Text style={styles.overviewNumber}>{cashTopUpText}</Text>
                  <Text style={styles.overviewTitle}>Cash Top-Ups</Text>
                  <Text style={styles.overviewSub}>Daily total</Text>
                </View>
              </View>

              {/* 3. Quick Actions */}
              <Text style={styles.sectionHeading}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: '#F0562A', borderWidth: 1, backgroundColor: '#FFF5F0' }]}
                  onPress={() => openReceiving('Shipments')}
                >
                  <ReceiveGoodsActionIcon />
                  <Text style={styles.quickActionLabel}>Receive Goods</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: '#F0562A', borderWidth: 1, backgroundColor: '#FFF5F0' }]}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseSales');
                    } else {
                      setShowSalesScreen(true);
                    }
                  }}
                >
                  <CashRegisterActionIcon />
                  <Text style={styles.quickActionLabel}>New Sale</Text>
                </Pressable>

                {canOrders ? (
                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: '#F0562A', borderWidth: 1, backgroundColor: '#FFF5F0' }]}
                  onPress={() => setShowOrdersModule(true)}
                >
                  <ViewOrdersActionIcon />
                  <Text style={styles.quickActionLabel}>View Orders</Text>
                </Pressable>
                ) : null}

                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: '#F0562A', borderWidth: 1, backgroundColor: '#FFF5F0' }]}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseCashTopUp');
                    } else {
                      setActiveTab('More');
                    }
                  }}
                >
                  <CashTopUpActionIcon />
                  <Text style={styles.quickActionLabel}>Cash Top-Up</Text>
                </Pressable>

                {canStock ? (
                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: '#F0562A', borderWidth: 1, backgroundColor: '#FFF5F0' }]}
                  onPress={() => setActiveTab('Inventory')}
                >
                  <StockVerifyActionIcon />
                  <Text style={[styles.quickActionLabel, { color: PALETTE.textInk }]}>Stock Verify</Text>
                </Pressable>
                ) : null}

                {isAreaAvailable('warehouseActivity', can) ? (
                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: '#F0562A', borderWidth: 1, backgroundColor: '#FFF5F0' }]}
                  onPress={() => setShowRecentActivity(true)}
                >
                  <ActivityHistoryActionIcon />
                  <Text style={styles.quickActionLabel}>Activity</Text>
                </Pressable>
                ) : null}
              </View>

              {/* 4. Needs Attention */}
              <View style={styles.sectionHeaderRow}>
                <WarningTriangleIcon color="#D97706" size={17} />
                <Text style={[styles.sectionHeading, { marginTop: 0, marginBottom: 0 }]}>Needs Attention</Text>
                {openTasks.length > 0 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{openTasks.length}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.alertList}>
                {openTasksQuery.isPending ? (
                  <AdminLoadingState label="Loading tasks..." />
                ) : openTasks.length === 0 ? (
                  <View style={styles.emptyTasksCard}>
                    <Text style={styles.emptyTasksTitle}>All caught up!</Text>
                    <Text style={styles.emptyTasksSub}>No pending tasks needing attention right now.</Text>
                  </View>
                ) : (
                  openTasks.map((task) => {
                    const title = formatTaskTitle(task);
                    const details = formatTaskDetails(task);
                    const due = formatTaskDue(task.dueOn);
                    const isPendingDone = markDoneMutation.isPending && markDoneMutation.variables?.itemKey === task.itemKey;

                    return (
                      <TouchableOpacity
                        key={task.itemKey}
                        style={styles.alertCard}
                        onPress={() => handleOpenTask(task)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.alertIconCircle, { backgroundColor: getTaskIconBg(task.type) }]}>
                          {getTaskIcon(task.type)}
                        </View>
                        <View style={styles.alertCardTextWrap}>
                          <View style={styles.taskCardHeaderRow}>
                            <Text style={styles.alertCardTitle}>{title}</Text>
                            <View style={styles.taskTypeBadge}>
                              <Text style={styles.taskTypeBadgeText}>{mapTaskBadgeLabel(task.type)}</Text>
                            </View>
                          </View>
                          {details ? (
                            <Text style={styles.alertCardSub} numberOfLines={2}>
                              {details}
                            </Text>
                          ) : null}
                          <View style={styles.taskFooterRow}>
                            {due ? <Text style={styles.taskDueText}>{due}</Text> : <View />}
                            <TouchableOpacity
                              style={[styles.taskDoneBtn, isPendingDone && styles.taskDoneBtnDisabled]}
                              disabled={markDoneMutation.isPending}
                              onPress={(e) => {
                                e.stopPropagation?.();
                                handleMarkDone(task);
                              }}
                              activeOpacity={0.8}
                              accessibilityRole="button"
                              accessibilityLabel={`Mark ${title} as done`}
                            >
                              <Text style={styles.taskDoneBtnText}>{isPendingDone ? 'Saving...' : 'Done'}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              {/* 5. Today's Receiving */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.sectionHeading}>Today's Receiving</Text>
                <Text style={styles.sectionHeaderSub}>
                  {taskCounts.qcPending > 0 ? `${taskCounts.qcPending} Pending QC` : 'All QC Done'}
                </Text>
              </View>

              <View style={styles.cardStack}>
                {openTasks.filter((t) => t.type === 'GOODS_RECEIPT_QC').slice(0, 3).map((task) => (
                  <TouchableOpacity
                    key={task.itemKey}
                    style={styles.orderReceivingCard}
                    onPress={() => handleOpenTask(task)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.itemCodeBold}>
                        {String(task.params['grnNumber'] ?? task.refId.slice(0, 8))}
                      </Text>
                      <View style={styles.awaitingQcBadge}>
                        <Text style={styles.awaitingQcText}>Awaiting QC</Text>
                      </View>
                    </View>
                    <Text style={styles.routeText}>Warehouse → {warehouseShort}</Text>
                    <Text style={styles.produceTitle}>
                      {String(task.params['produce'] ?? task.params['cropName'] ?? task.params['productName'] ?? 'Goods Receipt')}
                    </Text>
                    <View style={styles.rowBetween}>
                      <Text style={styles.detailText}>
                        {task.params['grossQtyKg'] ? `Received: ${task.params['grossQtyKg']} KG` : ''}
                      </Text>
                      <Text style={styles.timeText}>{formatTaskDue(task.dueOn) ?? ''}</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => {
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
                <Text style={styles.sectionHeading}>Today's Orders</Text>
                <Text style={styles.sectionHeaderSub}>
                  {taskCounts.ordersActionable > 0 ? `${taskCounts.ordersActionable} Orders Need Action` : 'All Actioned'}
                </Text>
              </View>

              <View style={styles.cardStack}>
                {openTasks.filter((t) => t.type.startsWith('ORDER_')).slice(0, 3).map((task) => (
                  <TouchableOpacity
                    key={task.itemKey}
                    style={styles.orderReceivingCard}
                    onPress={() => handleOpenTask(task)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.itemCodeBold}>
                        {String(task.params['orderNumber'] ?? task.refId.slice(0, 8))}
                      </Text>
                      <View style={styles.readyPickupBadge}>
                        <Text style={styles.readyPickupText}>{mapTaskBadgeLabel(task.type)}</Text>
                      </View>
                    </View>
                    <Text style={styles.produceTitle}>
                      {String(task.params['customerName'] ?? task.params['customer'] ?? 'Customer Order')}
                    </Text>
                    <View style={styles.rowBetween}>
                      <Text style={styles.detailText}>
                        {task.params['produce'] ? String(task.params['produce']) : ''}
                      </Text>
                      <Text style={styles.timeText}>{formatTaskDue(task.dueOn) ?? ''}</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => setShowOrdersModule(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View All Orders →</Text>
                </TouchableOpacity>
              </View>

              {/* 7. Order Status Summary */}
              <Text style={styles.sectionHeading}>Order Status Summary</Text>
              <View style={styles.statusSummaryGrid}>
                <View style={styles.statusSummaryTile}>
                  <Text style={styles.statusSummaryNum}>
                    {String(taskSummary?.byType['ORDER_PACK'] ?? 0).padStart(2, '0')}
                  </Text>
                  <Text style={styles.statusSummaryLabel}>PACKING</Text>
                </View>
                <View style={styles.statusSummaryTile}>
                  <Text style={styles.statusSummaryNum}>
                    {String(taskSummary?.byType['ORDER_DISPATCH'] ?? 0).padStart(2, '0')}
                  </Text>
                  <Text style={styles.statusSummaryLabel}>DISPATCH</Text>
                </View>
                <View style={styles.statusSummaryTile}>
                  <Text style={styles.statusSummaryNum}>
                    {String(taskSummary?.byType['ORDER_PICKUP_OTP'] ?? 0).padStart(2, '0')}
                  </Text>
                  <Text style={styles.statusSummaryLabel}>PICKUP OTP</Text>
                </View>
                <View style={styles.statusSummaryTile}>
                  <Text style={styles.statusSummaryNum}>
                    {String(taskCounts.ordersActionable).padStart(2, '0')}
                  </Text>
                  <Text style={styles.statusSummaryLabel}>ACTIONABLE</Text>
                </View>
              </View>
              </>
              ) : null}

              {/* 8. Inventory Snapshot + 9. Stock Allocation: inventory.batch.view */}
              {canStock ? (
              <>
              {scope.warehouseId !== undefined ? (
                <SubInventorySections
                  warehouseId={scope.warehouseId}
                  onOpenInventory={() => setActiveTab('Inventory')}
                  onOpenAllocation={() => {
                    setInventoryInitialScreen('M3S02');
                    setInventoryInitialParams({ initialTab: 'Allocation' });
                    setActiveTab('Inventory');
                  }}
                />
              ) : null}
              </>
              ) : null}

              {/* 10. Today's Sales Summary: finance.sales_income.view */}
              {canSales ? (
              <>
              <Text style={styles.sectionHeading}>Today's Sales Summary</Text>
              <View style={styles.infoTableCard}>
                <View style={styles.salesHeaderRow}>
                  <Text style={styles.salesTotalAmount}>{salesRevenueText}</Text>
                  <Text style={styles.salesTxnCount}>{salesTxnCountText}</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Online</Text>
                  <Text style={styles.infoTableValue}>{formatChannelRevenue('ONLINE')}</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Market</Text>
                  <Text style={styles.infoTableValue}>{formatChannelRevenue('MARKET', 'DIRECT')}</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>HORECA</Text>
                  <Text style={styles.infoTableValue}>{formatChannelRevenue('HORECA')}</Text>
                </View>
                <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoTableLabel}>B2B</Text>
                  <Text style={styles.infoTableValue}>{formatChannelRevenue('B2B')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.tableLinkButton}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseSales');
                    } else {
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
                  <Text style={styles.salesTotalAmount}>
                    {dailyCashSummary ? formatPaise(dailyCashSummary.expectedClosingPaise) : t('dashboardHome.noValue')}
                  </Text>
                  <Text style={styles.salesTxnCount}>
                    {dailyCashSummary?.closed ? 'Closed' : 'Active today'}
                  </Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Cash Top-Ups</Text>
                  <Text style={styles.infoTableValue}>{cashTopUpText}</Text>
                </View>
                <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoTableLabel}>Cash Sales</Text>
                  <Text style={styles.infoTableValue}>
                    {dailyCashSummary ? formatPaise(dailyCashSummary.cashSalesPaise) : t('dashboardHome.noValue')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.tableLinkButton}
                  onPress={() => setShowWalletOperations(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View History →</Text>
                </TouchableOpacity>
              </View>

              {/* 12. Recent Activity: gated by warehouseActivity */}
              {isAreaAvailable('warehouseActivity', can) ? (
                <>
                  <View style={styles.sectionHeaderBetween}>
                    <Text style={styles.sectionHeading}>Recent Activity</Text>
                    {isAreaAvailable('warehouseActivity', can) ? (
                      <TouchableOpacity
                        onPress={() => setShowRecentActivity(true)}
                        activeOpacity={0.75}
                        style={{ paddingVertical: 4 }}
                      >
                        <Text style={styles.viewAllText}>View all</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {scope.warehouseId !== undefined ? <SubRecentActivityCard warehouseId={scope.warehouseId} /> : null}
                </>
              ) : null}

              {/* 13. Warehouse Alerts */}
              <Text style={styles.sectionHeading}>Warehouse Alerts</Text>
              <View style={styles.alertsContainerCard}>
                <View style={styles.alertBulletRow}>
                  <WarningTriangleIcon color="#D97706" size={16} />
                  <Text style={styles.alertBulletText}>
                    {taskCounts.qcPending} QC check{taskCounts.qcPending === 1 ? '' : 's'} pending
                  </Text>
                </View>
                {canStock ? (
                  <View style={styles.alertBulletRow}>
                    <WarningTriangleIcon color="#D97706" size={16} />
                    <Text style={styles.alertBulletText}>
                      {scope.warehouseId !== undefined ? <SubLowStockCount warehouseId={scope.warehouseId} style={styles.alertBulletText} /> : null}
                      {' '}{t('mainDashboard.sub.lowStockProducts')}
                    </Text>
                  </View>
                ) : null}
                {canOrders ? (
                  <View style={styles.alertBulletRow}>
                    <InfoCircleIcon color="#2563EB" size={16} />
                    <Text style={styles.alertBulletText}>
                      {taskCounts.readyForPickup} pickup{taskCounts.readyForPickup === 1 ? '' : 's'} scheduled today
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
            onBack={() => {
              setActiveTab('Home');
              setReceivingEntry({ screen: 'Dashboard' });
            }}
            onTabChange={(tab) => {
              if (tab === 'Receiving') openReceiving();
              else setActiveTab(tab);
            }}
            unreadNotifications={unreadNotifCount}
            onOpenNotifications={() => setShowNotifications(true)}
            onOpenOperationalIssues={
              isAreaAvailable('operationalIssues', can) ? () => setStorageEntry({ screen: 'OperationalIssues' }) : undefined
            }
            onViewBatch={(batchId) => {
              setInventoryInitialScreen('M3S05');
              setInventoryInitialParams({ batchId });
              setActiveTab('Inventory');
            }}
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
                setActiveTab('Home');
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
              } else if (onBack) {
                onBack();
              }
            }}
            onTabChange={(tab) => {
              setShowOrdersModule(false);
              setOrdersInitialScreen('M5S01');
              setOrdersInitialParams(null);
              setReturnToNotificationsOnBack(false);
              setActiveTab(tab);
            }}
            onNavigateToOperationalIssues={isAreaAvailable('operationalIssues', can) ? () => {
              setShowOrdersModule(false);
              setStorageEntry({ screen: 'OperationalIssues' });
            } : undefined}
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
                setProfileInitialScreen('WarehouseProfile');
                setShowProfile(true);
              }
            }}
            onNavigateToWallet={() => {
              if (onNavigate) onNavigate('WarehouseWalletOperations');
              else setShowWalletOperations(true);
            }}
            onNavigateToOrders={() => {
              setShowOrdersModule(true);
            }}
            onNavigateToSales={() => {
              if (onNavigate) onNavigate('SubWarehouseSales');
              else setShowSalesScreen(true);
            }}
            onNavigateToReports={() => {
              setShowReportsScreen(true);
            }}
            onNavigateToReturns={() => {
              if (onNavigate) onNavigate('SubWarehouseReturnsIssues');
              else openReturns('ReturnsIssues');
            }}
            onNavigateToReturnHistory={() => {
              if (onNavigate) onNavigate('SubWarehouseReturnHistory');
              else openReturns('ReturnHistory');
            }}
            onNavigateToCustomers={() => {
              if (onNavigate) onNavigate('SubWarehouseCustomerList');
              else openCustomers('CustomersList');
            }}
            onNavigateToBilling={() => {
              if (onNavigate) onNavigate('SubWarehouseBillingHub');
              else setShowBilling(true);
            }}
            onNavigateToStaff={isAreaAvailable('staff', can) ? () => {
              if (onNavigate) onNavigate('SubWarehouseStaff');
              else setStaffEntry({ screen: 'Staff' });
            } : undefined}
            onNavigateToAttendance={isAreaAvailable('staff', can) ? () => {
              if (onNavigate) onNavigate('SubWarehouseTodayAttendance');
              else setStaffEntry({ screen: 'Attendance', filter: 'All' });
            } : undefined}
            onNavigateToFinance={() => {
              if (onNavigate) onNavigate('SubWarehouseFinance');
              else setShowFinanceScreen(true);
            }}
            onNavigateToWarehouseOperations={() => {
              setStorageEntry({ screen: 'Operations' });
            }}
            onNavigateToStorageLocations={() => {
              setShowStorageInfo(true);
            }}
            onNavigateToReceiveGoods={() => {
              openReceiving('Shipments');
            }}
            onNavigateToStockVerification={isAreaAvailable('stockCounts', can) ? () => {
              setInventoryInitialScreen('M3S10');
              setActiveTab('Inventory');
            } : undefined}
            onNavigateToSettings={() => {
              if (onNavigate) onNavigate('SubWarehouseSettings');
              else setShowSettingsScreen(true);
            }}
            onLogout={onSignOut}
          />
        )}
      </View>

      {/* ─── Bottom Navigation Bar (Home; the Receiving flow draws its own on its dashboard) ─── */}
      {activeTab === 'Home' && !showOrdersModule && (
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
            onPress={() => openReceiving()}
            accessibilityRole="tab"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ReceivingTabIcon active={false} />
            <Text style={styles.tabLabel}>Receiving</Text>
          </TouchableOpacity>

          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('Inventory')}
            accessibilityRole="tab"
          >
            <InventoryTabIcon active={false} />
            <Text style={styles.tabLabel}>Inventory</Text>
          </Pressable>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigateTo('More')}
            accessibilityRole="tab"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreTabIcon active={false} />
            <Text style={styles.tabLabel}>More</Text>
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
    color: '#FFF2EE',
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
    color: '#FFFFFF',
    letterSpacing: -0.4,
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
  notifBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#DC2626',
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
    color: '#FFFFFF',
  },
  headerDate: {
    fontSize: 12,
    color: '#FFE2D9',
    marginTop: 5,
    marginBottom: 8,
  },
  assignedWarehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 11,
    paddingVertical: 4.5,
  },
  assignedWarehouseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
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
    shadowColor: '#000',
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
    shadowColor: '#000',
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
  overviewNumberDanger: {
    color: adminColors.danger.text,
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
    shadowColor: '#000',
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
  countBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    marginLeft: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  taskCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskTypeBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  taskTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  taskFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  taskDueText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  taskDoneBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  taskDoneBtnDisabled: {
    opacity: 0.6,
  },
  taskDoneBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyTasksCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 8,
  },
  emptyTasksTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  emptyTasksSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 4,
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
