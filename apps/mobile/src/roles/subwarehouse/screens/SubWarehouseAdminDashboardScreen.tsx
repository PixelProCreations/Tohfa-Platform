import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
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
import { fetchMe, type UserMe } from '../../farmer/api/auth';
import { AdminProfileScreen } from '../../admin/screens/dashboard/AdminProfileScreen';
import {
  ALERT_RECEIPT_ID,
  GoodsReceivingWizardScreen,
  ReceivingHistoryDetailScreen,
  type ReceivingWizardStep,
} from '../../admin/screens/warehouse/receiving-qc';
import {
  NotificationsFlow,
  SUB_NOTIFICATIONS,
  type NotificationItem,
  type NotificationsRoute,
  type NotificationsRouteParams,
} from '../../admin/screens/warehouse/notifications';
import {
  IncomingShipmentsScreen,
  ReceivingHistoryScreen,
  ReceivingSearchFiltersScreen,
  ShipmentDetailScreen,
} from '../../admin/screens/warehouse';
import { SubWarehouseOverviewScreen } from './SubWarehouseOverviewScreen';
import { SubWarehouseTodayOverviewScreen } from './SubWarehouseTodayOverviewScreen';
import { ReportsScreen } from '../../admin/screens/warehouse/reports';
import { SalesFlow } from '../../admin/screens/warehouse/sales-direct';
import { WalletFlow, walletParamsForCustomer } from '../../admin/screens/warehouse/wallet-cashtopup';
import { MoreScreen } from '../../admin/screens/warehouse/dashboard-home-more';
import {
  CustomersFlow,
  type CustomersRoute,
  type CustomersRouteParams,
} from '../../admin/screens/warehouse/customers';
import { BillingFlow } from '../../admin/screens/warehouse/billing-invoices';
import { SubWarehouseTaskActionCenterScreen } from './SubWarehouseTaskActionCenterScreen';
import { SubWarehouseTaskDetailScreen } from './SubWarehouseTaskDetailScreen';
import { StaffFlow, type AttendanceFilter, type StaffRoute } from '../../admin/screens/warehouse/staff-attendance';
import {
  StorageFlow,
  type ActivityModule,
  type StorageRoute,
  type StorageRouteParams,
} from '../../admin/screens/warehouse/storage-ops';
import { SubWarehouseWarehouseOperationsScreen } from './SubWarehouseWarehouseOperationsScreen';
import {
  ExpenseDetailScreen,
  FinanceFlow,
  type PermissionCheck,
  type WarehouseScope,
} from '../../admin/screens/warehouse/finance-expenses';
import { ProfileFlow } from '../../admin/screens/warehouse/profile-settings';
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

function ClockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#D97706" strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#9E9690" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── SVG Icons for Goods Receiving Screen (Mockup 2 & 3) ──────────────────────

function DeliveryTruckWhiteIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 18H9"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="17" cy="18" r="2" stroke="#FFFFFF" strokeWidth="2.2" />
      <Circle cx="7" cy="18" r="2" stroke="#FFFFFF" strokeWidth="2.2" />
    </Svg>
  );
}

function BellWhiteIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WhiteLockIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke="#FFFFFF" strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFFFFF" strokeWidth="2.2" />
    </Svg>
  );
}

function CalendarOutlineIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke="#1E1612" strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke="#1E1612" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ThreeDotsInCircleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke="#1E1612" strokeWidth="2" />
      <Circle cx="8" cy="12" r="1.3" fill="#1E1612" />
      <Circle cx="12" cy="12" r="1.3" fill="#1E1612" />
      <Circle cx="16" cy="12" r="1.3" fill="#1E1612" />
    </Svg>
  );
}

function FlaskOutlineIcon({ color = '#1E1612' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M9 3h6M10 3v5l-6 11a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2l-6-11V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PartiallyAcceptedIcon({ color = '#1E1612', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top row: horizontal bar and checkmark */}
      <Path d="M4 8h5.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <Path d="M13 8l2 2 4.5-4.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Bottom row: horizontal bar and cross */}
      <Path d="M4 16h5.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <Path d="M14 13.5l4.5 4.5M18.5 13.5l-4.5 4.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckmarkInCircleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke="#1E1612" strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke="#1E1612" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertCircleIcon({ color = '#1E1612' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="12.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="12" cy="16" r="1.2" fill={color} />
    </Svg>
  );
}

function StartReceivingBoxIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2.5" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M12 7v5.5M9.5 10l2.5 2.5L14.5 10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7.5 14.5v1.5h9v-1.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningAmberTriangleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#1E1612" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9v4M12 17h.01" stroke="#1E1612" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function DamageBrokenImageIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke="#E11D48" strokeWidth="2" />
      <Path d="M3 15l5-5 4 4 3-3 6 6" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightGrayIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#9E9690" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightRedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BackArrowWhiteIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Line x1="3" y1="6" x2="21" y2="6" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="3" y1="18" x2="21" y2="18" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="8" cy="6" r="2.5" fill="#F0562A" stroke="#FFFFFF" strokeWidth="2" />
      <Circle cx="16" cy="12" r="2.5" fill="#F0562A" stroke="#FFFFFF" strokeWidth="2" />
      <Circle cx="10" cy="18" r="2.5" fill="#F0562A" stroke="#FFFFFF" strokeWidth="2" />
    </Svg>
  );
}

function SearchGlassGrayIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function FlagOutlineIcon({ color = '#1E1612' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarOutlineSmallIcon({ color = '#1E1612' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StarOutlineIcon({ color = '#1E1612' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseSourceIcon({ color = '#1E1612' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SproutOutlineIcon({ color = '#1E1612' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M7 20h10M12 20V10M12 10a5 5 0 0 1 5-5h2v2a5 5 0 0 1-5 5h-2zM12 13a4 4 0 0 0-4-4H6v1.5a4 4 0 0 0 4 4h2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FunnelFilterWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StartReceivingPlayIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4l14 8-14 8V4z" fill="#FFFFFF" />
    </Svg>
  );
}

function ArrowRightGrayIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface ShipmentItem {
  id: string;
  code: string;
  reference: string;
  status: 'Expected' | 'Arrived' | 'Receiving' | 'Awaiting QC' | 'Mismatch' | 'Completed' | 'Rejected' | 'Partially Accepted';
  statusColor: string;
  statusBg: string;
  badgeLabel?: string;
  from: string;
  to: string;
  produce: string;
  grade: string;
  expectedQty: number;
  receivedQty?: number;
  acceptedQty?: number;
  rejectedQty?: number;
  dispatchDate: string;
  expectedArrival: string;
  actualArrival?: string;
  batchSource: string;
  dispatchStatus?: string;
  hasReview?: boolean;
}

const INITIAL_SHIPMENTS: ShipmentItem[] = [
  {
    id: '1',
    code: 'GR-1024',
    reference: 'PO-2026-0024',
    status: 'Awaiting QC',
    badgeLabel: 'Awaiting QC',
    statusColor: '#B45309',
    statusBg: '#FEF3C7',
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Tomato',
    grade: 'Grade 1',
    expectedQty: 150,
    receivedQty: 145,
    acceptedQty: 140,
    rejectedQty: 5,
    actualArrival: '24 Sep · 10:30 AM',
    dispatchDate: '23 Sep 2026',
    expectedArrival: '24 Sep 2026',
    batchSource: 'Internal only',
  },
  {
    id: '2',
    code: 'GR-1021',
    reference: 'PO-2026-0021',
    status: 'Mismatch',
    badgeLabel: 'Mismatch',
    statusColor: '#DC2626',
    statusBg: '#FEE2E2',
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Carrot',
    grade: 'Grade 1',
    expectedQty: 100,
    receivedQty: 95,
    dispatchDate: '22 Sep 2026',
    expectedArrival: '23 Sep 2026',
    actualArrival: '23 Sep · 11:15 AM',
    batchSource: 'Internal only',
    hasReview: true,
  },
  {
    id: '3',
    code: 'GR-1026',
    reference: 'PO-2026-0026',
    status: 'Expected',
    badgeLabel: 'Expected',
    statusColor: '#C2410C',
    statusBg: '#FFEDD5',
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Beetroot',
    grade: 'Grade 1',
    expectedQty: 60,
    dispatchStatus: 'Today',
    dispatchDate: '24 Sep 2026',
    expectedArrival: '25 Sep 2026',
    actualArrival: 'Pending',
    batchSource: 'Internal only',
  },
  {
    id: '4',
    code: 'GR-1023',
    reference: 'PO-2026-0023',
    status: 'Completed',
    badgeLabel: 'Completed',
    statusColor: '#15803D',
    statusBg: '#DCFCE7',
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Carrot',
    grade: 'Grade 1',
    expectedQty: 80,
    receivedQty: 80,
    acceptedQty: 80,
    dispatchDate: '22 Sep 2026',
    expectedArrival: '23 Sep 2026',
    actualArrival: '23 Sep · 09:00 AM',
    batchSource: 'Internal only',
  },
  {
    id: '5',
    code: 'GR-1018',
    reference: 'PO-2026-0018',
    status: 'Rejected',
    badgeLabel: 'Rejected',
    statusColor: '#DC2626',
    statusBg: '#FEE2E2',
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Spinach',
    grade: 'Grade 2',
    expectedQty: 30,
    receivedQty: 30,
    rejectedQty: 30,
    dispatchDate: '21 Sep 2026',
    expectedArrival: '22 Sep 2026',
    actualArrival: '22 Sep · 02:30 PM',
    batchSource: 'Purchase Order',
  },
];

interface ReceivingHistoryItem {
  id: string;
  code: string;
  status: 'Accepted' | 'Partial' | 'Rejected';
  badgeLabel: string;
  badgeBg: string;
  badgeColor: string;
  produce: string;
  grade: string;
  receivedQty: number;
  acceptedQty?: number;
  rejectedQty?: number;
  date: string;
}

const RECEIVING_HISTORY_ITEMS: ReceivingHistoryItem[] = [
  {
    id: 'h1',
    code: 'GR-1024',
    status: 'Partial',
    badgeLabel: 'Partially Accepted',
    badgeBg: '#FDF4E7',
    badgeColor: '#92400E',
    produce: 'Tomato',
    grade: 'Grade 1',
    receivedQty: 145,
    acceptedQty: 140,
    rejectedQty: 5,
    date: '24 Sep 2026',
  },
  {
    id: 'h2',
    code: 'GR-1023',
    status: 'Accepted',
    badgeLabel: 'Accepted',
    badgeBg: '#DCFCE7',
    badgeColor: '#15803D',
    produce: 'Carrot',
    grade: 'Grade 1',
    receivedQty: 80,
    acceptedQty: 80,
    date: '24 Sep 2026',
  },
  {
    id: 'h3',
    code: 'GR-1018',
    status: 'Rejected',
    badgeLabel: 'Rejected',
    badgeBg: '#FEE2E2',
    badgeColor: '#DC2626',
    produce: 'Spinach',
    grade: 'Grade 2',
    receivedQty: 30,
    rejectedQty: 30,
    date: '22 Sep 2026',
  },
];

interface SubWarehouseAdminDashboardScreenProps {
  /** Warehouse this Sub Warehouse admin is assigned to; handed to shared warehouse screens. */
  scope: WarehouseScope;
  /** docs/rbac.json permission check for the signed-in admin (roles/admin/permissions/can.ts). */
  can: PermissionCheck;
  onSignOut: () => void;
  onNavigate?: (screen: string, params?: any) => void;
  onBack?: () => void;
  initialShowOrders?: boolean;
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
  const initialParams = useMemo(() => {
    const issue = params.issue;
    const c = params.customer;
    const rmaId = (issue?.issueNo ?? 'ISSUE-00231').replace('ISSUE', 'RMA');
    const rma: RmaRecord = {
      id: rmaId.toLowerCase(),
      rmaId,
      orderId: issue?.orderNo ?? 'ORD-00251',
      customerName: c?.name ?? 'Rajesh Kumar',
      customerId: c?.code ?? c?.id ?? 'CUS-00291',
      customerPhone: c?.phone ?? '+91 98765 43210',
      orderDate: issue?.dateText ?? '24 Sep 2026',
      salesChannel: 'Direct Sale',
      paymentStatus: 'Paid',
      productName: issue?.product ?? 'Tomato',
      grade: 'Grade 1',
      quantityPurchased: issue?.quantity ?? '2 KG',
      unitPrice: '₹100 / KG',
      lineTotal: '₹200',
      issueCategory: (issue?.category as RmaRecord['issueCategory'] | undefined) ?? 'Quality',
      reportedDate: issue?.dateText ?? '24 Sep 2026',
      timestampText: '24 Sep 2026 · 10:45 AM',
      description: issue?.description ?? 'Customer reported quality issue.',
      ticketId: issue?.issueNo ?? 'ISSUE-00231',
      requestedQuantity: issue?.quantity ?? '2 KG',
      requestedResolution: 'Replacement / Refund',
      status: 'Under Review',
    };
    return { rma };
  }, [params]);
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

export function SubWarehouseAdminDashboardScreen({
  scope,
  can,
  onSignOut,
  onNavigate,
  onBack,
  initialShowOrders = false,
  initialTab,
  initialReceivingSubView,
  initialInventoryScreen,
}: SubWarehouseAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<SubWHTab>(initialTab || 'Home');
  const [receivingSubView, setReceivingSubView] = useState<
    'overview' | 'incoming_shipments' | 'search_filters' | 'shipment_detail' | 'receiving_history'
  >(initialReceivingSubView || 'overview');
  const [receivingHistoryFilterTab, setReceivingHistoryFilterTab] = useState<
    'All' | 'Accepted' | 'Partial' | 'Rejected'
  >('All');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentItem>(INITIAL_SHIPMENTS[0]!);
  const [shipmentsFilterTab, setShipmentsFilterTab] = useState<
    'All' | 'Expected' | 'Arrived' | 'Receiving' | 'QC Pending' | 'Completed' | 'Rejected'
  >('All');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Expected');
  const [filterDate, setFilterDate] = useState<string>('Today');
  const [filterGrade, setFilterGrade] = useState<string>('Grade 1');
  const [filterSource, setFilterSource] = useState<string>('Main Warehouse');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [selectedReceivingCard, setSelectedReceivingCard] = useState<string | null>(null);
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
  const [showTodayOverview, setShowTodayOverview] = useState(false);
  const [showSalesScreen, setShowSalesScreen] = useState(false);
  const [showWarehouseOverview, setShowWarehouseOverview] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWarehouseOperations, setShowWarehouseOperations] = useState(false);
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
  const [showTasks, setShowTasks] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(undefined);
  const [showExpenseRecord, setShowExpenseRecord] = useState(false);
  const [showGoodsReceiptDetail, setShowGoodsReceiptDetail] = useState(false);


  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
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

  const [showIncomingShipmentsScreen, setShowIncomingShipmentsScreen] = useState(false);
  const [incomingShipmentsTab, setIncomingShipmentsTab] = useState<
    'All' | 'Expected' | 'Arrived' | 'In Progress' | 'Completed'
  >('All');
  const [showReceivingSearchFilters, setShowReceivingSearchFilters] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('GR-1024');
  const [showShipmentDetailScreen, setShowShipmentDetailScreen] = useState(false);
  const [showReceivingHistoryScreen, setShowReceivingHistoryScreen] = useState(false);
  const [receivingHistoryFilter, setReceivingHistoryFilter] = useState<
    'All' | 'Accepted' | 'Partially Accepted' | 'Rejected'
  >('All');
  const [selectedGrnId, setSelectedGrnId] = useState<string>('GRN-000839');
  const [showReceivingHistoryDetail, setShowReceivingHistoryDetail] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (initialReceivingSubView) {
      setReceivingSubView(initialReceivingSubView);
    }
    if (initialInventoryScreen) {
      setInventoryInitialScreen(initialInventoryScreen);
    }
  }, [initialTab, initialReceivingSubView, initialInventoryScreen]);
  const [user, setUser] = useState<UserMe | null>(null);
  const [notifications, setNotifications] = useState<readonly NotificationItem[]>(SUB_NOTIFICATIONS);

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(item => (item.id === id ? { ...item, isRead: true } : item))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  interface NavHistoryItem {
    tab: SubWHTab;
    receivingSubView: 'overview' | 'incoming_shipments' | 'search_filters' | 'shipment_detail' | 'receiving_history';
    selectedShipment?: ShipmentItem;
  }

  const [history, setHistory] = useState<NavHistoryItem[]>([
    { tab: 'Home', receivingSubView: 'overview' },
  ]);

  const navigateTo = (
    tab: SubWHTab,
    subView: 'overview' | 'incoming_shipments' | 'search_filters' | 'shipment_detail' | 'receiving_history' = 'overview',
    shipment?: ShipmentItem
  ) => {
    if (shipment) {
      setSelectedShipment(shipment);
    }
    setActiveTab(tab);
    setReceivingSubView(subView);
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (
        last &&
        last.tab === tab &&
        last.receivingSubView === subView &&
        (!shipment || last.selectedShipment?.code === shipment.code)
      ) {
        return prev;
      }
      return [
        ...prev,
        { tab, receivingSubView: subView, selectedShipment: shipment ?? selectedShipment },
      ];
    });
  };

  const goBack = () => {
    if (history.length > 1) {
      const nextHistory = history.slice(0, -1);
      const prev = nextHistory[nextHistory.length - 1]!;
      setHistory(nextHistory);
      setActiveTab(prev.tab);
      setReceivingSubView(prev.receivingSubView);
      if (prev.selectedShipment) {
        setSelectedShipment(prev.selectedShipment);
      }
    } else {
      if (activeTab === 'Receiving') {
        if (receivingSubView !== 'overview') {
          setReceivingSubView('overview');
        } else {
          setActiveTab('Home');
        }
      } else {
        setActiveTab('Home');
      }
    }
  };

  const [showOrdersModule, setShowOrdersModule] = useState(initialShowOrders);
  const [ordersInitialScreen, setOrdersInitialScreen] = useState<string>('M5S01');
  const [ordersInitialParams, setOrdersInitialParams] = useState<any>(null);

  useEffect(() => {
    if (initialShowOrders) {
      setShowOrdersModule(true);
      setOrdersInitialScreen('M5S01');
      setOrdersInitialParams(null);
    }
  }, [initialShowOrders]);

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
      if (showIncomingShipmentsScreen) {
        setShowIncomingShipmentsScreen(false);
        return true;
      }
      if (showReceivingSearchFilters) {
        setShowReceivingSearchFilters(false);
        return true;
      }
      if (showShipmentDetailScreen) {
        setShowShipmentDetailScreen(false);
        return true;
      }
      if (showReceivingHistoryScreen) {
        setShowReceivingHistoryScreen(false);
        return true;
      }
      if (showReceivingHistoryDetail) {
        setShowReceivingHistoryDetail(false);
        return true;
      }
      if (receivingWizardStep !== null) {
        setReceivingWizardStep(null);
        return true;
      }
      if (history.length > 1) {
        goBack();
        return true;
      }
      if (activeTab === 'Receiving' && receivingSubView !== 'overview') {
        setReceivingSubView('overview');
        return true;
      }
      if (activeTab !== 'Home') {
        setActiveTab('Home');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [history, receivingWizardStep, activeTab, receivingSubView, showNotifications, showOrdersModule]);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => { });
  }, []);

  const userName = user?.fullName?.split(' ')[0] ?? 'Suresh';

  if (showTaskDetail) {
    return (
      <SubWarehouseTaskDetailScreen
        onBack={() => setShowTaskDetail(false)}
        onMarkInProgress={() => {
          Alert.alert('Task Updated', 'Task marked as In Progress');
          setShowTaskDetail(false);
        }}
      />
    );
  }

  if (showOrderDetail) {
    return (
      <OrdersModule
        scope={scope}
        can={can}
        initialScreen="M5S04"
        initialParams={{
          orderId: selectedOrder?.orderNo || 'ORD-00251',
          customerName: selectedOrder?.customer || selectedCustomer?.name || 'Rajesh Kumar',
        }}
        onBack={() => setShowOrderDetail(false)}
        onTabChange={(tab) => {
          setShowOrderDetail(false);
          setCustomersEntry(null);
          setActiveTab(tab);
        }}
        onNavigateToOperationalIssues={() => {
          setShowOrderDetail(false);
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
        receiptId={ALERT_RECEIPT_ID}
        onBack={() => setShowGoodsReceiptDetail(false)}
        onTakeAction={() => {
          setShowGoodsReceiptDetail(false);
          setReceivingWizardStep('damage_mismatch');
        }}
      />
    );
  }

  if (showTasks) {
    return (
      <SubWarehouseTaskActionCenterScreen
        onBack={() => setShowTasks(false)}
        onNavigateToTaskDetail={() => setShowTaskDetail(true)}
        onNavigateToOrderDetail={() => setShowOrderDetail(true)}
        onStartTask={(t) => {
          if (t?.id === 'TSK-002' || t?.title?.includes('Pickup')) {
            setShowOrderDetail(true);
          } else {
            setShowTaskDetail(true);
          }
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
          navigateTo('Receiving', 'overview');
        }}
        onBackToShipments={() => {
          setReceivingWizardStep(null);
          navigateTo('Receiving', 'incoming_shipments');
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
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
        onBack={() => setNotificationsEntry(null)}
        onTabChange={(tab) => {
          setNotificationsEntry(null);
          if (tab === 'Receiving') {
            setActiveTab('Receiving');
            navigateTo('Receiving', 'overview');
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
            setShowReviewReceiving(true);
          } else if (target === 'Receiving') {
            navigateTo('Receiving', 'overview');
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
            setShowGoodsReceiptDetail(true);
          } else if (alert.record === 'LowStock') {
            setNotificationsEntry(null);
            setInventoryInitialScreen('M3S09');
            setInventoryInitialParams(null);
            setActiveTab('Inventory');
          } else if (alert.record === 'Transfer') {
            onNavigate?.('InterWarehouseTransfer');
          }
        }}
      />
    );
  }

  if (showTodayOverview) {
    return (
      <SubWarehouseTodayOverviewScreen
        onBack={() => setShowTodayOverview(false)}
        onTabChange={(tab) => {
          setShowTodayOverview(false);
          if (tab === 'Receiving') {
            setActiveTab('Receiving');
            navigateTo('Receiving', 'overview');
          } else if (tab === 'Inventory') {
            setInventoryInitialScreen('M3S01');
            setInventoryInitialParams(null);
            setActiveTab('Inventory');
          } else {
            setActiveTab(tab);
          }
        }}
        onNavigateToSection={(section) => {
          setShowTodayOverview(false);
          if (section === 'Receiving') {
            setShowReviewReceiving(true);
          } else if (section === 'Inventory') {
            setInventoryInitialScreen('M3S01');
            setInventoryInitialParams(null);
            setActiveTab('Inventory');
          } else if (section === 'Orders') {
            openCustomers('CustomerOrders');
          } else if (section === 'Sales') {
            setShowSalesScreen(true);
          } else if (section === 'Cash Top-Up') {
            setShowWalletOperations(true);
          }
        }}
      />
    );
  }

  if (showWarehouseOverview) {
    return (
      <SubWarehouseOverviewScreen
        warehouseName="Coonoor Warehouse"
        warehouseId="COO-WH-001"
        onBack={() => setShowWarehouseOverview(false)}
        onTabChange={(tab) => {
          setShowWarehouseOverview(false);
          setActiveTab(tab);
        }}
        onNavigateToInventory={() => {
          setShowWarehouseOverview(false);
          setInventoryInitialScreen('M3S01');
          setInventoryInitialParams(null);
          setActiveTab('Inventory');
        }}
        onNavigateToReceiving={() => {
          setShowWarehouseOverview(false);
          navigateTo('Receiving', 'overview');
        }}
        onNavigateToOrders={() => {
          setShowWarehouseOverview(false);
          setOrdersInitialScreen('M5S01');
          setOrdersInitialParams(null);
          setShowOrdersModule(true);
        }}
        onNavigateToOperations={() => {
          setShowWarehouseOverview(false);
          setShowWalletOperations(true);
        }}
      />
    );
  }

  if (selectedStorageLocationId) {
    const openStock = () => {
      setSelectedStorageLocationId(null);
      setShowStorageInfo(false);
      setShowWarehouseOperations(false);
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
          if (!showProfile) setShowWarehouseOperations(true);
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

  if (showWarehouseOperations) {
    return (
      <SubWarehouseWarehouseOperationsScreen
        onBack={() => setShowWarehouseOperations(false)}
        onNavigateToStorageLocations={() => {
          setShowWarehouseOperations(false);
          setShowStorageInfo(true);
        }}
        onNavigateToCapacity={() => {
          setShowWarehouseOperations(false);
          setStorageEntry({ screen: 'Capacity' });
        }}
        onNavigateToMaterialHandling={() => {
          setShowWarehouseOperations(false);
          setStorageEntry({ screen: 'MaterialHandling' });
        }}
        onNavigateToOperationalIssues={() => {
          setShowWarehouseOperations(false);
          setStorageEntry({ screen: 'OperationalIssues' });
        }}
        onNavigateToStaffAttendance={() => {
          setShowWarehouseOperations(false);
          setStaffEntry({ screen: 'Attendance', filter: 'All' });
        }}
        onNavigateToReceiveGoods={() => {
          setShowWarehouseOperations(false);
          setReceivingSubView('incoming_shipments');
          setActiveTab('Receiving');
        }}
        onNavigateToStockVerification={() => {
          setShowWarehouseOperations(false);
          setInventoryInitialScreen('M3S10');
          setActiveTab('Inventory');
        }}
        onNavigateToWarehouseActivity={() => {
          setShowWarehouseOperations(false);
          setStorageEntry({ screen: 'Activity' });
        }}
        onNavigateToTodayOperations={() => {
          setShowWarehouseOperations(false);
          setStorageEntry({ screen: 'Activity', params: { activityPreset: 'Today' } });
        }}
        onTabChange={(tab) => {
          setShowWarehouseOperations(false);
          setActiveTab(tab);
        }}
      />
    );
  }

  /** Modules outside storage-ops that own an activity record or a Today tile (StorageFlow onOpenModule). */
  const openModule = (module: ActivityModule) => {
    switch (module) {
      case 'receiving':
        setReceivingSubView('incoming_shipments');
        setActiveTab('Receiving');
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
        setStaffEntry({ screen: 'Attendance', filter: 'All' });
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
      // Shared storage-ops flow (W4, M4 part A), scope-locked to this warehouse.
      // Add Material / Add Stock / Receive / Issue need inventory.material_handling.manage (SUB own);
      // capacity is view-only (SUB has no warehouse.capacity.set, so no Manage Capacity Limits).
      <StorageFlow
        scope={scope}
        can={can}
        initialScreen={storageEntry.screen}
        initialParams={storageEntry.params}
        onBack={() => {
          const close = storageEntry.closeOnBack === true;
          setStorageEntry(null);
          if (!close) setShowWarehouseOperations(true);
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
        shipment={INITIAL_SHIPMENTS[0]}
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
          navigateTo('Receiving', 'overview');
        }}
      />
    );
  }

  if (showProfile) {
    // Warehouse Profile (+ Storage / Operating / Contact / Documents) is the
    // shared ProfileFlow (W4 part B). A storage location opens the shell's detail.
    return (
      <ProfileFlow
        scope={scope}
        can={can}
        initialScreen="WarehouseProfile"
        onBack={() => setShowProfile(false)}
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
            ? () => {
                setShowSalesScreen(false);
                onNavigate('SubWarehouseNeedsAttention');
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
        initialParams={walletParamsForCustomer(
          selectedCustomer ? { name: selectedCustomer.name, code: selectedCustomer.code } : undefined,
        )}
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

  if (showIncomingShipmentsScreen) {
    return (
      <IncomingShipmentsScreen
        initialFilterTab={incomingShipmentsTab}
        onBack={() => setShowIncomingShipmentsScreen(false)}
        onOpenFilters={() => setShowReceivingSearchFilters(true)}
        onSelectShipment={(shipmentId) => {
          setSelectedShipmentId(shipmentId);
          setShowShipmentDetailScreen(true);
        }}
      />
    );
  }

  if (showReceivingSearchFilters) {
    return (
      <ReceivingSearchFiltersScreen
        onBack={() => setShowReceivingSearchFilters(false)}
        onApplyFilters={() => setShowReceivingSearchFilters(false)}
      />
    );
  }

  if (showShipmentDetailScreen) {
    return (
      <ShipmentDetailScreen
        shipmentId={selectedShipmentId}
        onBack={() => setShowShipmentDetailScreen(false)}
        onStartReceiving={() => {
          setShowShipmentDetailScreen(false);
          setReceivingWizardStep('start_receiving');
        }}
      />
    );
  }

  if (showReceivingHistoryScreen) {
    return (
      <ReceivingHistoryScreen
        initialFilter={receivingHistoryFilter}
        onBack={() => setShowReceivingHistoryScreen(false)}
        onSelectRecord={(grnId) => {
          setSelectedGrnId(grnId);
          setShowReceivingHistoryDetail(true);
        }}
      />
    );
  }

  if (showReceivingHistoryDetail) {
    return (
      <ReceivingHistoryDetailScreen
        scope={scope}
        can={can}
        receiptId={selectedGrnId}
        onBack={() => setShowReceivingHistoryDetail(false)}
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
                        setShowWarehouseOverview(true);
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <WarehouseHeaderIcon />
                    <Text style={styles.warehouseNameText}>Coonoor Warehouse</Text>
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
                        onNavigate('SubWarehouseProfile');
                      } else {
                        setShowProfile(true);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <ProfileHeaderIcon />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.headerDate}>Thursday, 24 September 2026</Text>

              <View style={styles.assignedWarehousePill}>
                <LockBadgeIcon />
                <Text style={styles.assignedWarehouseText}>Assigned Warehouse · Cannot switch</Text>
              </View>
            </View>

            {/* ─── Main Content Container ─── */}
            <View style={styles.mainContainer}>
              {/* 1. Operational Status Card */}
              <TouchableOpacity
                style={styles.statusCard}
                onPress={() => {
                  if (onNavigate) {
                    onNavigate('SubWarehouseOverview');
                  } else {
                    setShowWarehouseOverview(true);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.statusCardLeft}>
                  <Text style={styles.statusWarehouseTitle}>Coonoor Warehouse</Text>
                  <View style={styles.operationalRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.operationalText}>Operational</Text>
                  </View>
                </View>

                <View style={styles.statusCardRight}>
                  <Text style={styles.receivingLabel}>Today's receiving</Text>
                  <Text style={styles.receivingValue}>3 shipments</Text>
                  <Text style={styles.syncText}>Last sync: 2 min ago</Text>
                </View>
              </TouchableOpacity>

              {/* 2. Today's Overview Grid */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={[styles.sectionHeading, { marginTop: 0, marginBottom: 0 }]}>Today's Overview</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseTodayOverview');
                    } else {
                      setShowTodayOverview(true);
                    }
                  }}
                  activeOpacity={0.75}
                  style={{ paddingVertical: 4 }}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.overviewGrid}>
                {/* 1. Pending Orders */}
                <Pressable
                  style={({ pressed }) => [styles.overviewCard, pressed && { borderColor: '#F0562A', borderWidth: 1 }]}
                  onPress={() => setShowOrdersModule(true)}
                >
                  <View style={styles.overviewIconWrap}>
                    <ClipboardClockIcon />
                  </View>
                  <Text style={styles.overviewNumber}>12</Text>
                  <Text style={styles.overviewTitle}>Pending Orders</Text>
                  <Text style={styles.overviewSub}>8 need action</Text>
                </Pressable>

                {/* 2. Ready for Pickup */}
                <Pressable
                  style={({ pressed }) => [styles.overviewCard, pressed && { borderColor: '#F0562A', borderWidth: 1 }]}
                  onPress={() => setShowOrdersModule(true)}
                >
                  <View style={styles.overviewIconWrap}>
                    <PersonCheckIcon />
                  </View>
                  <Text style={styles.overviewNumber}>08</Text>
                  <Text style={styles.overviewTitle}>Ready for Pickup</Text>
                  <Text style={styles.overviewSub}>3 customers expected</Text>
                </Pressable>

                {/* 3. Today's Receiving */}
                <Pressable
                  style={({ pressed }) => [styles.overviewCard, pressed && { borderColor: '#F0562A', borderWidth: 1 }]}
                  onPress={() => navigateTo('Receiving', 'overview')}
                >
                  <View style={styles.overviewIconWrap}>
                    <DeliveryTruckIcon />
                  </View>
                  <Text style={styles.overviewNumber}>03</Text>
                  <Text style={styles.overviewTitle}>Today's Receiving</Text>
                  <Text style={styles.overviewSub}>1 awaiting QC</Text>
                </Pressable>

                {/* 4. Low Stock Items */}
                <Pressable
                  style={({ pressed }) => [styles.overviewCard, pressed && { borderColor: '#F0562A', borderWidth: 1 }]}
                  onPress={() => setActiveTab('Inventory')}
                >
                  <View style={styles.overviewIconWrap}>
                    <BoxIcon color={PALETTE.primary} />
                  </View>
                  <Text style={[styles.overviewNumber, { color: '#E11D48' }]}>05</Text>
                  <Text style={styles.overviewTitle}>Low Stock Items</Text>
                  <Text style={[styles.overviewSub, { color: '#E11D48' }]}>Needs attention</Text>
                </Pressable>

                {/* 5. Today's Sales */}
                <Pressable
                  style={({ pressed }) => [styles.overviewCard, pressed && { borderColor: '#F0562A', borderWidth: 1 }]}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseSales');
                    } else {
                      setShowSalesScreen(true);
                    }
                  }}
                >
                  <View style={styles.overviewIconWrap}>
                    <BanknotesIcon />
                  </View>
                  <Text style={styles.overviewNumber}>₹24,850</Text>
                  <Text style={styles.overviewTitle}>Today's Sales</Text>
                  <Text style={styles.overviewSub}>42 transactions</Text>
                </Pressable>

                {/* 6. Cash Top-Ups */}
                <Pressable
                  style={({ pressed }) => [styles.overviewCard, pressed && { borderColor: '#F0562A', borderWidth: 1 }]}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('WarehouseWalletOperations');
                    } else {
                      setActiveTab('More');
                    }
                  }}
                >
                  <View style={styles.overviewIconWrap}>
                    <WalletIcon />
                  </View>
                  <Text style={styles.overviewNumber}>₹18,500</Text>
                  <Text style={styles.overviewTitle}>Cash Top-Ups</Text>
                  <Text style={styles.overviewSub}>12 transactions</Text>
                </Pressable>
              </View>

              {/* 3. Quick Actions */}
              <Text style={styles.sectionHeading}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: '#F0562A', borderWidth: 1, backgroundColor: '#FFF5F0' }]}
                  onPress={() => setReceivingWizardStep('start_receiving')}
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

                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: '#F0562A', borderWidth: 1, backgroundColor: '#FFF5F0' }]}
                  onPress={() => setShowOrdersModule(true)}
                >
                  <ViewOrdersActionIcon />
                  <Text style={styles.quickActionLabel}>View Orders</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: '#F0562A', borderWidth: 1, backgroundColor: '#FFF5F0' }]}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('WarehouseWalletOperations');
                    } else {
                      setActiveTab('More');
                    }
                  }}
                >
                  <CashTopUpActionIcon />
                  <Text style={styles.quickActionLabel}>Cash Top-Up</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: '#F0562A', borderWidth: 1, backgroundColor: '#FFF5F0' }]}
                  onPress={() => setActiveTab('Inventory')}
                >
                  <StockVerifyActionIcon />
                  <Text style={[styles.quickActionLabel, { color: PALETTE.textInk }]}>Stock Verify</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.quickActionBtn, pressed && { borderColor: '#F0562A', borderWidth: 1, backgroundColor: '#FFF5F0' }]}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseRecentActivity');
                    } else {
                      setStorageEntry({ screen: 'Activity', params: { activityPreset: 'Today' }, closeOnBack: true });
                    }
                  }}
                >
                  <ActivityHistoryActionIcon />
                  <Text style={styles.quickActionLabel}>Activity</Text>
                </Pressable>
              </View>

              {/* 4. Needs Attention */}
              <View style={styles.sectionHeaderRow}>
                <WarningTriangleIcon color="#D97706" size={17} />
                <Text style={[styles.sectionHeading, { marginTop: 0, marginBottom: 0 }]}>Needs Attention</Text>
              </View>

              <View style={styles.alertList}>
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => {
                    setSelectedShipment(INITIAL_SHIPMENTS[0]!);
                    setReceivingWizardStep('receiving_in_progress');
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.amberIconBg }]}>
                    <FlaskIcon />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>QC Pending</Text>
                    <Text style={styles.alertCardSub}>
                      Tomato — Batch GR-1024 · Received 95 KG, awaiting quality check
                    </Text>
                  </View>
                  <ChevronRight />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => {
                    setSelectedShipment(INITIAL_SHIPMENTS[1]!);
                    setReceivingWizardStep('quantity_verification');
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.redIconBg }]}>
                    <ExclamationCircleIcon />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>Quantity Mismatch</Text>
                    <Text style={styles.alertCardSub}>Expected 100 KG, received 95 KG</Text>
                  </View>
                  <ChevronRight />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => {
                    setSelectedShipment(INITIAL_SHIPMENTS[4]!);
                    setReceivingWizardStep('rejected_goods');
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.redIconBg }]}>
                    <BrokenCrateIcon />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>Damage Report</Text>
                    <Text style={styles.alertCardSub}>2 crates reported damaged on today's receiving</Text>
                  </View>
                  <ChevronRight />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => Alert.alert('Pickup Pending', '3 customers are waiting for order pickup.')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.amberIconBg }]}>
                    <ClockIcon />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>Pickup Pending</Text>
                    <Text style={styles.alertCardSub}>3 customers are waiting for order pickup</Text>
                  </View>
                  <ChevronRight />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => Alert.alert('Low Stock Alert', 'Carrot — Grade 1 · Available 12 KG.')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.alertIconCircle, { backgroundColor: PALETTE.amberIconBg }]}>
                    <BoxIcon color="#D97706" />
                  </View>
                  <View style={styles.alertCardTextWrap}>
                    <Text style={styles.alertCardTitle}>Low Stock</Text>
                    <Text style={styles.alertCardSub}>Carrot — Grade 1 · Available 12 KG</Text>
                  </View>
                  <ChevronRight />
                </TouchableOpacity>
              </View>

              {/* 5. Today's Receiving */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.sectionHeading}>Today's Receiving</Text>
                <Text style={styles.sectionHeaderSub}>3 Shipments</Text>
              </View>

              <View style={styles.cardStack}>
                <TouchableOpacity
                  style={styles.orderReceivingCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    navigateTo('Receiving', 'shipment_detail', INITIAL_SHIPMENTS[0]!);
                  }}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.itemCodeBold}>GR-00124</Text>
                    <View style={styles.awaitingQcBadge}>
                      <Text style={styles.awaitingQcText}>Awaiting QC</Text>
                    </View>
                  </View>
                  <Text style={styles.routeText}>Main Warehouse → Coonoor</Text>
                  <Text style={styles.produceTitle}>Tomato · Grade 1</Text>
                  <View style={styles.rowBetween}>
                    <Text style={styles.detailText}>Expected: 150 KG</Text>
                    <Text style={styles.timeText}>09:40 AM</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.orderReceivingCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    navigateTo('Receiving', 'shipment_detail', INITIAL_SHIPMENTS[3]!);
                  }}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.itemCodeBold}>GR-00123</Text>
                    <View style={styles.qcCompletedBadge}>
                      <Text style={styles.qcCompletedText}>✓ QC Completed</Text>
                    </View>
                  </View>
                  <Text style={styles.routeText}>Main Warehouse → Coonoor</Text>
                  <Text style={styles.produceTitle}>Carrot · Grade 1</Text>
                  <Text style={styles.detailText}>Received: 80 KG</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => {
                    navigateTo('Receiving', 'overview');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View All Receiving →</Text>
                </TouchableOpacity>
              </View>

              {/* 6. Today's Orders */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.sectionHeading}>Today's Orders</Text>
                <Text style={styles.sectionHeaderSub}>12 Orders</Text>
              </View>

              <View style={styles.cardStack}>
                <View style={styles.orderReceivingCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.itemCodeBold}>#ORD-10245</Text>
                    <View style={styles.readyPickupBadge}>
                      <Text style={styles.readyPickupText}>Ready for Pickup</Text>
                    </View>
                  </View>
                  <Text style={styles.produceTitle}>Rahul Kumar · 3 Items</Text>
                  <Text style={styles.detailText}>₹850 · Pickup Today · 4:00 PM</Text>
                </View>

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
                  <Text style={styles.statusSummaryNum}>04</Text>
                  <Text style={styles.statusSummaryLabel}>NEW</Text>
                </View>
                <View style={styles.statusSummaryTile}>
                  <Text style={styles.statusSummaryNum}>03</Text>
                  <Text style={styles.statusSummaryLabel}>PACKING</Text>
                </View>
                <View style={styles.statusSummaryTile}>
                  <Text style={styles.statusSummaryNum}>08</Text>
                  <Text style={styles.statusSummaryLabel}>READY</Text>
                </View>
                <View style={styles.statusSummaryTile}>
                  <Text style={styles.statusSummaryNum}>27</Text>
                  <Text style={styles.statusSummaryLabel}>COMPLETED</Text>
                </View>
              </View>

              {/* 8. Inventory Snapshot */}
              <Text style={styles.sectionHeading}>Inventory Snapshot</Text>
              <View style={styles.infoTableCard}>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Available Stock</Text>
                  <Text style={styles.infoTableValue}>1,245 KG</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Reserved</Text>
                  <Text style={styles.infoTableValue}>320 KG</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Allocated</Text>
                  <Text style={styles.infoTableValue}>580 KG</Text>
                </View>
                <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoTableLabel}>Low Stock</Text>
                  <Text style={[styles.infoTableValue, { color: '#E11D48' }]}>05</Text>
                </View>
                <TouchableOpacity
                  style={styles.tableLinkButton}
                  onPress={() => setActiveTab('Inventory')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View Inventory →</Text>
                </TouchableOpacity>
              </View>

              {/* 9. Stock Allocation */}
              <Text style={styles.sectionHeading}>Stock Allocation</Text>
              <View style={styles.infoTableCard}>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>ONLINE</Text>
                  <Text style={styles.infoTableValue}>420 KG</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>LIVE MARKET</Text>
                  <Text style={styles.infoTableValue}>120 KG</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>RESERVE</Text>
                  <Text style={styles.infoTableValue}>80 KG</Text>
                </View>
                <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoTableLabel}>BUFFER</Text>
                  <Text style={styles.infoTableValue}>60 KG</Text>
                </View>
                <TouchableOpacity
                  style={styles.tableLinkButton}
                  onPress={() => {
                    setInventoryInitialScreen('M3S02');
                    setInventoryInitialParams({ initialTab: 'Allocation' });
                    setActiveTab('Inventory');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View Allocation Detail →</Text>
                </TouchableOpacity>
              </View>

              {/* 10. Today's Sales Summary */}
              <Text style={styles.sectionHeading}>Today's Sales Summary</Text>
              <View style={styles.infoTableCard}>
                <View style={styles.salesHeaderRow}>
                  <Text style={styles.salesTotalAmount}>₹24,850</Text>
                  <Text style={styles.salesTxnCount}>42 transactions</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Online</Text>
                  <Text style={styles.infoTableValue}>₹12,400</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>Market</Text>
                  <Text style={styles.infoTableValue}>₹7,250</Text>
                </View>
                <View style={styles.infoTableRow}>
                  <Text style={styles.infoTableLabel}>HORECA</Text>
                  <Text style={styles.infoTableValue}>₹3,200</Text>
                </View>
                <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoTableLabel}>B2B</Text>
                  <Text style={styles.infoTableValue}>₹2,000</Text>
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

              {/* 11. Cash Operations */}
              <Text style={styles.sectionHeading}>Cash Operations</Text>
              <View style={styles.infoTableCard}>
                <View style={styles.salesHeaderRow}>
                  <Text style={styles.salesTotalAmount}>₹18,500</Text>
                  <Text style={styles.salesTxnCount}>12 transactions</Text>
                </View>
                <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoTableLabel}>Last transaction</Text>
                  <Text style={styles.infoTableValue}>₹1,500 · 11:42 AM</Text>
                </View>
                <TouchableOpacity
                  style={styles.tableLinkButton}
                  onPress={() => setShowWalletOperations(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkButtonText}>View History →</Text>
                </TouchableOpacity>
              </View>

              {/* 12. Recent Activity */}
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.sectionHeading}>Recent Activity</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseRecentActivity');
                    } else {
                      setStorageEntry({ screen: 'Activity', params: { activityPreset: 'Today' }, closeOnBack: true });
                    }
                  }}
                  activeOpacity={0.75}
                  style={{ paddingVertical: 4 }}
                >
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.activityCardContainer}>
                {/* Activity 1 */}
                <TouchableOpacity
                  style={styles.activityItemRow}
                  activeOpacity={0.7}
                  onPress={() => navigateTo('Receiving', 'overview')}
                >
                  <View style={styles.activityIconBox}>
                    <ReceiveGoodsActionIcon />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.activityItemTitle}>Goods Received</Text>
                    <Text style={styles.activityItemSub}>GR-00124 · 150 KG Tomato</Text>
                    <Text style={styles.activityTimeText}>10:42 AM</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.cardDivider} />

                {/* Activity 2 */}
                <TouchableOpacity
                  style={styles.activityItemRow}
                  activeOpacity={0.7}
                  onPress={() => setShowOrdersModule(true)}
                >
                  <View style={styles.activityIconBox}>
                    <PackageBagIcon />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.activityItemTitle}>Order Packed</Text>
                    <Text style={styles.activityItemSub}>ORD-10242</Text>
                    <Text style={styles.activityTimeText}>10:20 AM</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.cardDivider} />

                {/* Activity 3 */}
                <TouchableOpacity
                  style={styles.activityItemRow}
                  activeOpacity={0.7}
                  onPress={() => setShowWalletOperations(true)}
                >
                  <View style={styles.activityIconBox}>
                    <CashTopUpActionIcon />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.activityItemTitle}>Cash Top-Up</Text>
                    <Text style={styles.activityItemSub}>₹2,000 · Customer CUS-1042</Text>
                    <Text style={styles.activityTimeText}>09:55 AM</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 13. Warehouse Alerts */}
              <Text style={styles.sectionHeading}>Warehouse Alerts</Text>
              <View style={styles.alertsContainerCard}>
                <View style={styles.alertBulletRow}>
                  <WarningTriangleIcon color="#D97706" size={16} />
                  <Text style={styles.alertBulletText}>2 QC checks pending</Text>
                </View>
                <View style={styles.alertBulletRow}>
                  <WarningTriangleIcon color="#D97706" size={16} />
                  <Text style={styles.alertBulletText}>5 low-stock products</Text>
                </View>
                <View style={styles.alertBulletRow}>
                  <InfoCircleIcon color="#2563EB" size={16} />
                  <Text style={styles.alertBulletText}>3 pickups scheduled today</Text>
                </View>
              </View>

              <View style={{ height: 28 }} />
            </View>
          </ScrollView>
        )}

        {/* ─── Receiving Tab ─── */}
        {activeTab === 'Receiving' && !showOrdersModule && (
          <View style={styles.receivingContainer}>
            {/* 1. VIEW: Incoming Shipments (Image 2) */}
            {receivingSubView === 'incoming_shipments' && (
              <View style={{ flex: 1, backgroundColor: PALETTE.pageBg }}>
                {/* Header matching Image 2 */}
                <View style={styles.shipmentsHeaderBanner}>
                  <TouchableOpacity
                    style={styles.shipmentsBackBtn}
                    onPress={goBack}
                    activeOpacity={0.7}
                  >
                    <BackArrowWhiteIcon />
                  </TouchableOpacity>

                  <Text style={styles.shipmentsHeaderTitle}>Incoming Shipments</Text>

                  <TouchableOpacity
                    style={styles.shipmentsFilterBtn}
                    onPress={() => navigateTo('Receiving', 'search_filters')}
                    activeOpacity={0.75}
                  >
                    <FilterSlidersWhiteIcon />
                  </TouchableOpacity>
                </View>

                {/* Filter Pills matching Image 1 */}
                <View style={styles.shipmentFilterPillsContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.shipmentFilterPillsScroll}
                  >
                    {(['All', 'Expected', 'Arrived', 'Receiving', 'QC Pending', 'Completed', 'Rejected'] as const).map(tab => {
                      const isActive = shipmentsFilterTab === tab;
                      return (
                        <TouchableOpacity
                          key={tab}
                          style={[styles.shipmentFilterPill, isActive && styles.shipmentFilterPillActive]}
                          onPress={() => setShipmentsFilterTab(tab)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.shipmentFilterPillText, isActive && styles.shipmentFilterPillTextActive]}>
                            {tab}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Shipment Cards matching Image 1 & 2 */}
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.shipmentsListScrollContent}
                  showsVerticalScrollIndicator={true}
                  decelerationRate={0.985}
                  scrollEventThrottle={16}
                >
                  {INITIAL_SHIPMENTS.filter(item => {
                    if (shipmentsFilterTab === 'Expected') {
                      if (item.status !== 'Expected') return false;
                    } else if (shipmentsFilterTab === 'Arrived') {
                      if (item.status !== 'Arrived' && item.status !== 'Awaiting QC') return false;
                    } else if (shipmentsFilterTab === 'Receiving') {
                      if (item.status !== 'Receiving' && item.status !== 'Awaiting QC' && item.status !== 'Mismatch' && item.status !== 'Partially Accepted') return false;
                    } else if (shipmentsFilterTab === 'QC Pending') {
                      if (item.status !== 'Awaiting QC' && item.status !== 'Partially Accepted') return false;
                    } else if (shipmentsFilterTab === 'Completed') {
                      if (item.status !== 'Completed') return false;
                    } else if (shipmentsFilterTab === 'Rejected') {
                      if (item.status !== 'Rejected' && item.status !== 'Mismatch') return false;
                    }
                    if (filterSearch) {
                      const q = filterSearch.toLowerCase();
                      if (!item.code.toLowerCase().includes(q) && !item.produce.toLowerCase().includes(q)) {
                        return false;
                      }
                    }
                    return true;
                  }).map(item => (
                    <TouchableOpacity
                      key={item.code}
                      style={styles.shipmentCard}
                      activeOpacity={0.8}
                      onPress={() => {
                        navigateTo('Receiving', 'shipment_detail', item);
                      }}
                    >
                      <View style={styles.shipmentCardTopRow}>
                        <Text style={styles.shipmentCardCode}>{item.code}</Text>
                        <View style={[styles.shipmentCardStatusBadge, { backgroundColor: item.statusBg }]}>
                          <Text style={[styles.shipmentCardStatusText, { color: item.statusColor }]}>
                            {item.badgeLabel ?? item.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.shipmentRouteRow}>
                        <ArrowRightGrayIcon />
                        <Text style={styles.shipmentRouteText}>{item.from} → {item.to}</Text>
                      </View>

                      <Text style={styles.shipmentProduceTitle}>{item.produce} · {item.grade}</Text>

                      <View style={styles.shipmentStatsRow}>
                        {item.status === 'Completed' ? (
                          <>
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Received</Text>
                              <Text style={styles.shipmentStatVal}>{item.receivedQty ?? item.expectedQty} KG</Text>
                            </View>
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Accepted</Text>
                              <Text style={styles.shipmentStatVal}>{item.acceptedQty ?? item.expectedQty} KG</Text>
                            </View>
                          </>
                        ) : item.status === 'Rejected' ? (
                          <>
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Received</Text>
                              <Text style={styles.shipmentStatVal}>{item.receivedQty ?? item.expectedQty} KG</Text>
                            </View>
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Rejected</Text>
                              <Text style={styles.shipmentStatVal}>{item.rejectedQty ?? item.expectedQty} KG</Text>
                            </View>
                          </>
                        ) : item.status === 'Mismatch' ? (
                          <>
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Expected</Text>
                              <Text style={styles.shipmentStatVal}>{item.expectedQty} KG</Text>
                            </View>
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Received</Text>
                              <Text style={styles.shipmentStatVal}>{item.receivedQty} KG</Text>
                            </View>
                          </>
                        ) : item.status === 'Expected' ? (
                          <>
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Expected</Text>
                              <Text style={styles.shipmentStatVal}>{item.expectedQty} KG</Text>
                            </View>
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Dispatch</Text>
                              <Text style={styles.shipmentStatVal}>{item.dispatchStatus ?? 'Today'}</Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Expected</Text>
                              <Text style={styles.shipmentStatVal}>{item.expectedQty} KG</Text>
                            </View>
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Arrived</Text>
                              <Text style={styles.shipmentStatVal}>
                                {item.actualArrival ? item.actualArrival.split('·')[1]?.trim() ?? '10:30 AM' : '10:30 AM'}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>

                      {item.hasReview && (
                        <View style={styles.shipmentReviewRow}>
                          <TouchableOpacity
                            onPress={() => {
                              navigateTo('Receiving', 'shipment_detail', item);
                            }}
                            activeOpacity={0.7}
                            style={styles.reviewBtn}
                          >
                            <Text style={styles.reviewBtnText}>Review &gt;</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                  <View style={{ height: 24 }} />
                </ScrollView>
              </View>
            )}

            {/* 2. VIEW: Search & Filters (Image 3) */}
            {receivingSubView === 'search_filters' && (
              <View style={{ flex: 1, backgroundColor: PALETTE.pageBg }}>
                {/* Header */}
                <View style={styles.searchHeaderBanner}>
                  <TouchableOpacity
                    style={styles.shipmentsBackBtn}
                    onPress={goBack}
                    activeOpacity={0.7}
                  >
                    <BackArrowWhiteIcon />
                  </TouchableOpacity>
                  <Text style={styles.searchHeaderTitle}>Search &amp; Filters</Text>
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.searchScrollContent} showsVerticalScrollIndicator={false}>
                  {/* Search Input Box */}
                  <View style={styles.searchBarBox}>
                    <SearchGlassGrayIcon />
                    <TextInput
                      style={styles.searchBarInput}
                      placeholder="Search shipment / GR number / product"
                      placeholderTextColor="#9CA3AF"
                      value={filterSearch}
                      onChangeText={setFilterSearch}
                    />
                  </View>

                  {/* Status Section */}
                  <View style={styles.filterSection}>
                    <View style={styles.filterSectionTitleRow}>
                      <FlagOutlineIcon />
                      <Text style={styles.filterSectionTitle}>Status</Text>
                    </View>
                    <View style={styles.filterChipsWrap}>
                      {[
                        'Expected',
                        'Arrived',
                        'Receiving',
                        'QC Pending',
                        'Partially Accepted',
                        'Accepted',
                        'Rejected',
                        'Completed',
                      ].map(st => {
                        const isSelected = filterStatus === st;
                        return (
                          <TouchableOpacity
                            key={st}
                            style={[styles.filterChip, isSelected && styles.filterChipActive]}
                            onPress={() => setFilterStatus(st)}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                              {st}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Date Section */}
                  <View style={styles.filterSection}>
                    <View style={styles.filterSectionTitleRow}>
                      <CalendarOutlineSmallIcon />
                      <Text style={styles.filterSectionTitle}>Date</Text>
                    </View>
                    <View style={styles.filterChipsWrap}>
                      {['Today', 'Yesterday', 'Last 7 Days', 'Custom'].map(d => {
                        const isSelected = filterDate === d;
                        return (
                          <TouchableOpacity
                            key={d}
                            style={[styles.filterChip, isSelected && styles.filterChipActive]}
                            onPress={() => setFilterDate(d)}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                              {d}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Grade Section */}
                  <View style={styles.filterSection}>
                    <View style={styles.filterSectionTitleRow}>
                      <StarOutlineIcon />
                      <Text style={styles.filterSectionTitle}>Grade</Text>
                    </View>
                    <View style={styles.filterChipsWrap}>
                      {['Grade 1', 'Grade 2', 'Grade 3'].map(g => {
                        const isSelected = filterGrade === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            style={[styles.filterChip, isSelected && styles.filterChipActive]}
                            onPress={() => setFilterGrade(g)}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                              {g}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Source Section */}
                  <View style={styles.filterSection}>
                    <View style={styles.filterSectionTitleRow}>
                      <WarehouseSourceIcon />
                      <Text style={styles.filterSectionTitle}>Source</Text>
                    </View>
                    <View style={styles.filterChipsWrap}>
                      {['Main Warehouse', 'Purchase Order'].map(src => {
                        const isSelected = filterSource === src;
                        return (
                          <TouchableOpacity
                            key={src}
                            style={[styles.filterChip, isSelected && styles.filterChipActive]}
                            onPress={() => setFilterSource(src)}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                              {src}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Product Section */}
                  <View style={styles.filterSection}>
                    <View style={styles.filterSectionTitleRow}>
                      <SproutOutlineIcon />
                      <Text style={styles.filterSectionTitle}>Product</Text>
                    </View>
                    <TextInput
                      style={styles.productSearchInput}
                      placeholder="Search crop / product"
                      placeholderTextColor="#9CA3AF"
                      value={filterProduct}
                      onChangeText={setFilterProduct}
                    />
                  </View>

                  {/* Locked Warehouse Banner */}
                  <View style={styles.warehouseLockCard}>
                    <WhiteLockIcon />
                    <Text style={styles.warehouseLockCardText}>
                      No warehouse selector — results always scoped to Coonoor Warehouse.
                    </Text>
                  </View>

                  {/* Apply Filters Button */}
                  <TouchableOpacity
                    style={styles.applyFilterBtn}
                    onPress={() => {
                      if (filterStatus === 'Expected') setShipmentsFilterTab('Expected');
                      else if (filterStatus === 'Arrived') setShipmentsFilterTab('Arrived');
                      else if (filterStatus === 'QC Pending') setShipmentsFilterTab('QC Pending');
                      else if (filterStatus === 'Completed') setShipmentsFilterTab('Completed');
                      else if (filterStatus === 'Rejected') setShipmentsFilterTab('Rejected');
                      else setShipmentsFilterTab('Receiving');
                      goBack();
                    }}
                    activeOpacity={0.85}
                  >
                    <FunnelFilterWhiteIcon />
                    <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
                  </TouchableOpacity>

                  <View style={{ height: 40 }} />
                </ScrollView>
              </View>
            )}

            {/* 3. VIEW: Shipment Detail (Image 4 / Screen 4) */}
            {receivingSubView === 'shipment_detail' && (
              <View style={{ flex: 1, backgroundColor: PALETTE.pageBg }}>
                {/* Header */}
                <View style={styles.detailHeaderBanner}>
                  <View style={styles.detailHeaderTopRow}>
                    <View style={styles.detailHeaderLeft}>
                      <TouchableOpacity
                        style={styles.shipmentsBackBtn}
                        onPress={goBack}
                        activeOpacity={0.7}
                      >
                        <BackArrowWhiteIcon />
                      </TouchableOpacity>
                      <Text style={styles.detailHeaderTitle}>{selectedShipment.code}</Text>
                    </View>
                    <View style={styles.detailStatusPill}>
                      <Text style={styles.detailStatusText}>
                        {selectedShipment.status === 'Awaiting QC' ? 'Arrived' : selectedShipment.badgeLabel ?? selectedShipment.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailLockPill}>
                    <WhiteLockIcon />
                    <Text style={styles.detailLockText}>Coonoor Warehouse</Text>
                  </View>
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.detailScrollContent} showsVerticalScrollIndicator={false}>
                  {/* Route & Metadata Card */}
                  <View style={styles.detailCard}>
                    <View style={styles.detailRouteCard}>
                      <View style={styles.detailRouteCol}>
                        <Text style={styles.detailRouteTag}>SOURCE</Text>
                        <Text style={styles.detailRouteName}>{selectedShipment.from}</Text>
                      </View>
                      <ArrowRightGrayIcon />
                      <View style={[styles.detailRouteCol, { alignItems: 'flex-end' }]}>
                        <Text style={styles.detailRouteTag}>DESTINATION</Text>
                        <Text style={styles.detailRouteName}>Coonoor Warehouse</Text>
                      </View>
                    </View>

                    <View style={styles.detailGrid}>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailColLabel}>Shipment ID</Text>
                        <Text style={styles.detailColValue}>{selectedShipment.code}</Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailColLabel}>Reference</Text>
                        <Text style={styles.detailColValue}>{selectedShipment.reference}</Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailColLabel}>Dispatch Date</Text>
                        <Text style={styles.detailColValue}>{selectedShipment.dispatchDate}</Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailColLabel}>Expected Arrival</Text>
                        <Text style={styles.detailColValue}>{selectedShipment.expectedArrival}</Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailColLabel}>Actual Arrival</Text>
                        <Text style={styles.detailColValue}>{selectedShipment.actualArrival ?? '24 Sep · 10:30 AM'}</Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailColLabel}>Batch / Source</Text>
                        <Text style={styles.detailColValue}>{selectedShipment.batchSource}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Items Section */}
                  <Text style={styles.detailSectionHeader}>Items</Text>
                  <View style={styles.detailItemCard}>
                    <View>
                      <Text style={styles.detailItemTitle}>{selectedShipment.produce}</Text>
                      <Text style={styles.detailItemGrade}>{selectedShipment.grade}</Text>
                    </View>
                    <Text style={styles.detailItemQty}>{selectedShipment.expectedQty} KG</Text>
                  </View>

                  {/* Start Receiving Button */}
                  <TouchableOpacity
                    style={styles.startReceivingCtaBtn}
                    onPress={() => {
                      if (selectedShipment.status === 'Awaiting QC' || selectedShipment.status === 'Receiving') {
                        setReceivingWizardStep('receiving_in_progress');
                      } else {
                        setReceivingWizardStep('start_receiving');
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <StartReceivingPlayIcon />
                    <Text style={styles.startReceivingCtaText}>
                      {selectedShipment.status === 'Awaiting QC' || selectedShipment.status === 'Receiving'
                        ? 'Receiving in Progress'
                        : 'Start Receiving'}
                    </Text>
                  </TouchableOpacity>

                  <View style={{ height: 40 }} />
                </ScrollView>
              </View>
            )}

            {/* 4. VIEW: Receiving History (Reference Image) */}
            {receivingSubView === 'receiving_history' && (
              <View style={{ flex: 1, backgroundColor: PALETTE.pageBg }}>
                {/* Header */}
                <View style={styles.historyHeaderBanner}>
                  <TouchableOpacity
                    style={styles.shipmentsBackBtn}
                    onPress={goBack}
                    activeOpacity={0.7}
                  >
                    <BackArrowWhiteIcon />
                  </TouchableOpacity>
                  <Text style={styles.historyHeaderTitle}>Receiving History</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.historySearchContainer}>
                  <SearchGlassGrayIcon />
                  <TextInput
                    style={styles.historySearchInput}
                    placeholder="Search GR number / product"
                    placeholderTextColor="#6B7280"
                    value={historySearchQuery}
                    onChangeText={setHistorySearchQuery}
                  />
                </View>

                {/* Filter Pills */}
                <View style={styles.historyFilterPillsContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.historyFilterPillsScroll}
                  >
                    {(['All', 'Accepted', 'Partial', 'Rejected'] as const).map(tab => {
                      const isActive = receivingHistoryFilterTab === tab;
                      return (
                        <TouchableOpacity
                          key={tab}
                          style={[styles.historyFilterPill, isActive && styles.historyFilterPillActive]}
                          onPress={() => setReceivingHistoryFilterTab(tab)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.historyFilterPillText, isActive && styles.historyFilterPillTextActive]}>
                            {tab}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Receiving History Cards */}
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.historyListScrollContent}
                  showsVerticalScrollIndicator={true}
                  decelerationRate={0.985}
                  scrollEventThrottle={16}
                >
                  {RECEIVING_HISTORY_ITEMS.filter(item => {
                    if (receivingHistoryFilterTab === 'Accepted' && item.status !== 'Accepted') return false;
                    if (receivingHistoryFilterTab === 'Partial' && item.status !== 'Partial') return false;
                    if (receivingHistoryFilterTab === 'Rejected' && item.status !== 'Rejected') return false;
                    if (historySearchQuery) {
                      const q = historySearchQuery.toLowerCase();
                      if (!item.code.toLowerCase().includes(q) && !item.produce.toLowerCase().includes(q)) {
                        return false;
                      }
                    }
                    return true;
                  }).map(item => {
                    const matchedShipment = INITIAL_SHIPMENTS.find(s => s.code === item.code);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.shipmentCard}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (matchedShipment) {
                            navigateTo('Receiving', 'shipment_detail', matchedShipment);
                          }
                        }}
                      >
                        <View style={styles.shipmentCardTopRow}>
                          <Text style={styles.shipmentCardCode}>{item.code}</Text>
                          <View style={[styles.shipmentCardStatusBadge, { backgroundColor: item.badgeBg }]}>
                            <Text style={[styles.shipmentCardStatusText, { color: item.badgeColor }]}>
                              {item.badgeLabel}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.shipmentProduceTitle}>{item.produce} · {item.grade}</Text>

                        <View style={styles.shipmentStatsRow}>
                          <View style={styles.shipmentStatCol}>
                            <Text style={styles.shipmentStatLabel}>Received</Text>
                            <Text style={styles.shipmentStatVal}>{item.receivedQty} KG</Text>
                          </View>
                          {item.acceptedQty !== undefined && (
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Accepted</Text>
                              <Text style={styles.shipmentStatVal}>{item.acceptedQty} KG</Text>
                            </View>
                          )}
                          {item.rejectedQty !== undefined && (
                            <View style={styles.shipmentStatCol}>
                              <Text style={styles.shipmentStatLabel}>Rejected</Text>
                              <Text style={styles.shipmentStatVal}>{item.rejectedQty} KG</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.historyCardDate}>{item.date}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{ height: 28 }} />
                </ScrollView>
              </View>
            )}

            {/* 5. VIEW: Overview (Today's Receiving Overview) */}
            {receivingSubView === 'overview' && (
              <>
                <View style={styles.receivingHeaderBanner}>
                  <View style={styles.receivingHeaderTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <TouchableOpacity
                        style={styles.receivingBackBtn}
                        onPress={() => {
                          if (history.length > 1) {
                            goBack();
                          } else {
                            setActiveTab('Home');
                          }
                        }}
                        activeOpacity={0.75}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <ArrowBackIcon size={22} color="#FFFFFF" />
                      </TouchableOpacity>

                      <View style={styles.receivingHeaderTitleRow}>
                        <DeliveryTruckWhiteIcon />
                        <Text style={styles.receivingHeaderTitle}>Goods Receiving</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.receivingBellBtn}
                      onPress={() => setShowNotifications(true)}
                      activeOpacity={0.8}
                    >
                      <BellWhiteIcon />
                      {unreadNotifCount > 0 && (
                        <View style={styles.receivingNotifBadge}>
                          <Text style={styles.receivingNotifBadgeText}>
                            {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.receivingLockPill}>
                    <WhiteLockIcon />
                    <Text style={styles.receivingLockPillText}>Coonoor Warehouse</Text>
                  </View>
                </View>

                {/* Scrollable Content */}
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.receivingScrollContent}
                  showsVerticalScrollIndicator={true}
                  decelerationRate={0.985}
                  scrollEventThrottle={16}
                >
                  {/* 1. Today's Receiving Overview (6 Boxes) */}
                  <Text style={styles.receivingSectionTitle}>Today's Receiving Overview</Text>
                  <View style={styles.receivingGrid}>
                    {/* 1. Expected Today */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'expected' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
                        setSelectedReceivingCard('expected');
                        setShipmentsFilterTab('Expected');
                        setFilterStatus('Expected');
                        navigateTo('Receiving', 'incoming_shipments');
                      }}
                      activeOpacity={0.8}
                    >
                      <CalendarOutlineIcon />
                      <Text style={styles.receivingOverviewNum}>03</Text>
                      <Text style={styles.receivingOverviewLabel}>Expected Today</Text>
                    </TouchableOpacity>

                    {/* 2. Awaiting Receiving */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'awaiting' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
                        setSelectedReceivingCard('awaiting');
                        setShipmentsFilterTab('Receiving');
                        setFilterStatus('Receiving');
                        navigateTo('Receiving', 'incoming_shipments');
                      }}
                      activeOpacity={0.8}
                    >
                      <ThreeDotsInCircleIcon />
                      <Text style={styles.receivingOverviewNum}>02</Text>
                      <Text style={styles.receivingOverviewLabel}>Awaiting Receiving</Text>
                    </TouchableOpacity>

                    {/* 3. Awaiting QC */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'qc' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
                        setSelectedReceivingCard('qc');
                        setSelectedShipment(INITIAL_SHIPMENTS[0]!); // The shipment that is Awaiting QC
                        setReceivingWizardStep('quality_check');
                      }}
                      activeOpacity={0.8}
                    >
                      <FlaskOutlineIcon />
                      <Text style={[styles.receivingOverviewNum, { color: '#E11D48' }]}>01</Text>
                      <Text style={styles.receivingOverviewLabel}>Awaiting QC</Text>
                    </TouchableOpacity>

                    {/* 4. Partially Accepted */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'partially' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
                        setSelectedReceivingCard('partially');
                        setReceivingHistoryFilterTab('Partial');
                        navigateTo('Receiving', 'receiving_history');
                      }}
                      activeOpacity={0.8}
                    >
                      <PartiallyAcceptedIcon />
                      <Text style={styles.receivingOverviewNum}>01</Text>
                      <Text style={styles.receivingOverviewLabel}>Partially Accepted</Text>
                    </TouchableOpacity>

                    {/* 5. Completed Today */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'completed' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
                        setSelectedReceivingCard('completed');
                        setReceivingHistoryFilterTab('Accepted');
                        navigateTo('Receiving', 'receiving_history');
                      }}
                      activeOpacity={0.8}
                    >
                      <CheckmarkInCircleIcon />
                      <Text style={styles.receivingOverviewNum}>05</Text>
                      <Text style={styles.receivingOverviewLabel}>Completed Today</Text>
                    </TouchableOpacity>

                    {/* 6. Issues */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'issues' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
                        setStorageEntry({ screen: 'OperationalIssues' });
                      }}
                      activeOpacity={0.8}
                    >
                      <AlertCircleIcon color="#1E1612" />
                      <Text style={[styles.receivingOverviewNum, { color: '#E11D48' }]}>02</Text>
                      <Text style={styles.receivingOverviewLabel}>Issues</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 2. Start Receiving CTA Button */}
                  <TouchableOpacity
                    style={styles.startReceivingBtn}
                    onPress={() => {
                      setSelectedShipment(INITIAL_SHIPMENTS[0]!);
                      setReceivingWizardStep('start_receiving');
                    }}
                    activeOpacity={0.85}
                  >
                    <StartReceivingBoxIcon />
                    <Text style={styles.startReceivingBtnText}>Start Receiving</Text>
                  </TouchableOpacity>

                  {/* 3. Needs Attention Section */}
                  <View style={styles.needsAttentionHeader}>
                    <WarningAmberTriangleIcon />
                    <Text style={styles.needsAttentionTitle}>Needs Attention</Text>
                  </View>

                  <View style={styles.needsAttentionStack}>
                    {/* Item 1: QC Pending */}
                    <TouchableOpacity
                      style={styles.attentionCard}
                      onPress={() => {
                        setSelectedShipment(INITIAL_SHIPMENTS[0]!);
                        setReceivingWizardStep('quality_check');
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.attentionLeftBar, { backgroundColor: '#B47D16' }]} />
                      <View style={styles.attentionIconBox}>
                        <FlaskOutlineIcon color="#B47D16" />
                      </View>
                      <View style={styles.attentionTextBox}>
                        <Text style={styles.attentionCardTitle}>QC Pending</Text>
                        <Text style={styles.attentionCardSub}>Tomato — GR-1024</Text>
                      </View>
                      <ChevronRightGrayIcon />
                    </TouchableOpacity>

                    {/* Item 2: Quantity Mismatch */}
                    <TouchableOpacity
                      style={styles.attentionCard}
                      onPress={() => {
                        // GR-1021 quantity mismatch -> the wizard's Partial Acceptance step
                        setSelectedShipment(INITIAL_SHIPMENTS[1]!);
                        setReceivingWizardStep('partial_acceptance');
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.attentionLeftBar, { backgroundColor: '#E11D48' }]} />
                      <View style={styles.attentionIconBox}>
                        <AlertCircleIcon color="#E11D48" />
                      </View>
                      <View style={styles.attentionTextBox}>
                        <Text style={styles.attentionCardTitle}>Quantity Mismatch</Text>
                        <Text style={styles.attentionCardSub}>Carrot — GR-1021</Text>
                      </View>
                      <ChevronRightRedIcon />
                    </TouchableOpacity>

                    {/* Item 3: Damage Report */}
                    <TouchableOpacity
                      style={styles.attentionCard}
                      onPress={() => {
                        setStorageEntry({ screen: 'OperationalIssues' });
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.attentionLeftBar, { backgroundColor: '#E11D48' }]} />
                      <View style={styles.attentionIconBox}>
                        <DamageBrokenImageIcon />
                      </View>
                      <View style={styles.attentionTextBox}>
                        <Text style={styles.attentionCardTitle}>Damage Report</Text>
                        <Text style={styles.attentionCardSub}>Beans — GR-1020</Text>
                      </View>
                      <ChevronRightRedIcon />
                    </TouchableOpacity>
                  </View>

                  {/* 4. Recent Receiving Section */}
                  <View style={styles.recentReceivingHeaderRow}>
                    <Text style={styles.recentReceivingTitle}>Recent Receiving</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setReceivingHistoryFilter('All');
                        setShowReceivingHistoryScreen(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.recentReceivingViewAll}>View all</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.recentReceivingStack}>
                    {/* GR-1024 */}
                    <TouchableOpacity
                      style={styles.recentCard}
                      onPress={() => {
                        // GR-1024 awaiting QC -> the wizard's Quality step
                        setSelectedShipment(INITIAL_SHIPMENTS[0]!);
                        setReceivingWizardStep('quality_check');
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.recentCardHeader}>
                        <Text style={styles.recentCardCode}>GR-1024</Text>
                        <View style={styles.awaitingQcBadgePill}>
                          <Text style={styles.awaitingQcBadgeText}>Awaiting QC</Text>
                        </View>
                      </View>
                      <Text style={styles.recentCardProduce}>Tomato · Grade 1</Text>
                      <Text style={styles.recentCardQuantity}>150 KG</Text>
                    </TouchableOpacity>

                    {/* GR-1023 */}
                    <TouchableOpacity
                      style={styles.recentCard}
                      onPress={() => {
                        setSelectedGrnId('GRN-000839');
                        setShowReceivingHistoryDetail(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.recentCardHeader}>
                        <Text style={styles.recentCardCode}>GR-1023</Text>
                        <View style={styles.completedBadgePill}>
                          <Text style={styles.completedBadgeText}>Completed</Text>
                        </View>
                      </View>
                      <Text style={styles.recentCardProduce}>Carrot · Grade 1</Text>
                      <Text style={styles.recentCardQuantity}>80 KG</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ height: 28 }} />
                </ScrollView>
              </>
            )}
          </View>
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
              if (onNavigate) onNavigate('SubWarehouseProfile');
              else setShowProfile(true);
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
            onNavigateToStaff={() => {
              if (onNavigate) onNavigate('SubWarehouseStaff');
              else setStaffEntry({ screen: 'Staff' });
            }}
            onNavigateToAttendance={() => {
              if (onNavigate) onNavigate('SubWarehouseTodayAttendance');
              else setStaffEntry({ screen: 'Attendance', filter: 'All' });
            }}
            onNavigateToFinance={() => {
              if (onNavigate) onNavigate('SubWarehouseFinance');
              else setShowFinanceScreen(true);
            }}
            onNavigateToWarehouseOperations={() => {
              setShowWarehouseOperations(true);
            }}
            onNavigateToStorageLocations={() => {
              setShowStorageInfo(true);
            }}
            onNavigateToCapacity={() => {
              setStorageEntry({ screen: 'Capacity' });
            }}
            onNavigateToMaterialHandling={() => {
              setStorageEntry({ screen: 'MaterialHandling' });
            }}
            onNavigateToOperationalIssues={() => {
              setStorageEntry({ screen: 'OperationalIssues' });
            }}
            onNavigateToWarehouseActivity={() => {
              setStorageEntry({ screen: 'Activity' });
            }}
            onNavigateToTodayOperations={() => {
              setStorageEntry({ screen: 'Activity', params: { activityPreset: 'Today' } });
            }}
            onNavigateToReceiveGoods={() => {
              setReceivingSubView('incoming_shipments');
              setActiveTab('Receiving');
            }}
            onNavigateToStockVerification={() => {
              setInventoryInitialScreen('M3S10');
              setActiveTab('Inventory');
            }}
            onNavigateToSettings={() => {
              if (onNavigate) onNavigate('SubWarehouseSettings');
              else setShowSettingsScreen(true);
            }}
            onLogout={onSignOut}
          />
        )}
      </View>

      {/* ─── Bottom Navigation Bar (Rendered only for Main Sections: Home, Goods Receiving Overview) ─── */}
      {(activeTab === 'Home' || (activeTab === 'Receiving' && receivingSubView === 'overview')) && !showOrdersModule && (
        <View style={styles.bottomTabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigateTo('Home', 'overview')}
            accessibilityRole="tab"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <HomeTabIcon active={activeTab === 'Home'} />
            <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigateTo('Receiving', 'overview')}
            accessibilityRole="tab"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ReceivingTabIcon active={activeTab === 'Receiving'} />
            <Text style={[styles.tabLabel, activeTab === 'Receiving' && styles.tabLabelActive]}>Receiving</Text>
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
            onPress={() => navigateTo('More', 'overview')}
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
  tabContentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  tabHeaderBox: {
    marginBottom: 14,
  },
  tabMainHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.3,
  },
  tabSubHeading: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 3,
  },

  // ─── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
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
  quickActionBtnHighlight: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primarySoft,
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

  // ─── Primary Action Button (in tabs) ───────────────────────────────────────
  primaryActionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Receiving Screen (Matching Mockup Screens 2 & 3) ─────────────────────
  receivingContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  receivingHeaderBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
  },
  receivingHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receivingHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receivingHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  receivingBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receivingBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  receivingNotifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  receivingNotifBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  receivingLockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  receivingLockPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  receivingScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  receivingSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  receivingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 16,
  },
  receivingOverviewCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
  },
  receivingOverviewCardActive: {
    borderColor: PALETTE.primary,
    borderWidth: 1.5,
  },
  receivingOverviewNum: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 10,
    marginBottom: 2,
  },
  receivingOverviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  startReceivingBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  startReceivingBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  needsAttentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  needsAttentionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1612',
  },
  needsAttentionStack: {
    gap: 12,
    marginBottom: 20,
  },
  attentionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingLeft: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE8',
    overflow: 'hidden',
    position: 'relative',
  },
  attentionLeftBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  attentionIconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  attentionTextBox: {
    flex: 1,
  },
  attentionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1612',
  },
  attentionCardSub: {
    fontSize: 14,
    color: '#1E1612',
    fontWeight: '600',
    marginTop: 2,
  },
  recentReceivingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentReceivingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  recentReceivingViewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9A3412',
  },
  recentReceivingStack: {
    gap: 10,
  },
  recentCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  recentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recentCardCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  awaitingQcBadgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  awaitingQcBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  completedBadgePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  recentCardProduce: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  recentCardQuantity: {
    fontSize: 12.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },

  // ─── Incoming Shipments (Image 2) ──────────────────────────────────────────
  shipmentsHeaderBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shipmentsBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  shipmentsHeaderTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    flex: 1,
    marginLeft: 8,
  },
  shipmentsFilterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipmentFilterPillsContainer: {
    backgroundColor: PALETTE.pageBg,
    paddingVertical: 12,
  },
  shipmentFilterPillsScroll: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
  },
  shipmentFilterPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  shipmentFilterPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: PALETTE.primary,
    borderWidth: 1.5,
  },
  shipmentFilterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  shipmentFilterPillTextActive: {
    color: '#9A3412',
    fontWeight: '800',
  },
  historyHeaderBanner: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  historyHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  historySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historySearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  historyFilterPillsContainer: {
    backgroundColor: PALETTE.pageBg,
    paddingVertical: 12,
  },
  historyFilterPillsScroll: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
  },
  historyFilterPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  historyFilterPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: PALETTE.primary,
    borderWidth: 1.5,
  },
  historyFilterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  historyFilterPillTextActive: {
    color: '#9A3412',
    fontWeight: '800',
  },
  historyListScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  historyCardDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'right',
  },
  shipmentsListScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  shipmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE4DB',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  shipmentCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  shipmentCardCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
  },
  shipmentCardStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  shipmentCardStatusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  shipmentRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  shipmentRouteText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  shipmentProduceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1612',
    marginBottom: 12,
  },
  shipmentStatsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  shipmentStatCol: {
    minWidth: 70,
  },
  shipmentStatLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  shipmentStatVal: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1612',
  },
  shipmentReviewRow: {
    alignItems: 'flex-end',
    marginTop: -16,
  },
  reviewBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#9A3412',
  },

  // ─── Search & Filters (Image 3) ───────────────────────────────────────────
  searchHeaderBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  searchScrollContent: {
    paddingBottom: 40,
  },
  searchBarBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 18,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E1612',
    padding: 0,
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  filterSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  filterSectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1612',
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: '#FFF5ED',
    borderColor: PALETTE.primary,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
  },
  filterChipTextActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  productSearchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#1E1612',
  },
  warehouseLockCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDBA74',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 24,
  },
  warehouseLockCardText: {
    fontSize: 12.5,
    color: '#7C2D12',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  applyFilterBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  applyFilterBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ─── Shipment Detail (Image 4 / Screen 4) ──────────────────────────────────
  detailHeaderBanner: {
    backgroundColor: PALETTE.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 46,
  },
  detailHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  detailStatusPill: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  detailLockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  detailLockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailScrollContent: {
    paddingBottom: 40,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  detailRouteCard: {
    backgroundColor: '#F7F5F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRouteCol: {
    flex: 1,
  },
  detailRouteTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  detailRouteName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1612',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  detailCol: {
    width: '50%',
  },
  detailColLabel: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailColValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E1612',
  },
  detailSectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1612',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  detailItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1612',
  },
  detailItemGrade: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  detailItemQty: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
  },
  startReceivingCtaBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  startReceivingCtaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
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
