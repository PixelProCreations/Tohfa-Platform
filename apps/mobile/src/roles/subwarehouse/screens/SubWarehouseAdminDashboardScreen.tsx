import React, { useEffect, useState } from 'react';
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
import { GoodsReceivingWizard, type ReceivingWizardStep } from '../../admin/screens/warehouse/GoodsReceivingWizard';
import { WarehouseNotificationsScreen, type WarehouseNotification } from '../../admin/screens/warehouse/WarehouseNotificationsScreen';
import { SubWarehouseProfileScreen } from './SubWarehouseProfileScreen';
import { SubWarehouseOverviewScreen } from './SubWarehouseOverviewScreen';
import { SubWarehouseRecentActivityScreen } from './SubWarehouseRecentActivityScreen';
import { SubWarehouseNotificationsScreen } from './SubWarehouseNotificationsScreen';
import { SubWarehouseReviewReceivingScreen } from './SubWarehouseReviewReceivingScreen';
import { SubWarehouseTodayOverviewScreen } from './SubWarehouseTodayOverviewScreen';
import { SubWarehouseReportsScreen } from './SubWarehouseReportsScreen';
import { SubWarehouseSalesScreen } from './SubWarehouseSalesScreen';
import { SubWarehouseWalletOperationsScreen } from './SubWarehouseWalletOperationsScreen';
import { SubWarehouseMoreScreen } from './SubWarehouseMoreScreen';
import { SubWarehouseCustomersScreen } from './SubWarehouseCustomersScreen';
import { SubWarehouseCustomerSearchScreen } from './SubWarehouseCustomerSearchScreen';
import { SubWarehouseCustomerDetailsScreen } from './SubWarehouseCustomerDetailsScreen';
import { SubWarehousePurchaseHistoryScreen } from './SubWarehousePurchaseHistoryScreen';
import { SubWarehouseCustomerOrdersScreen } from './SubWarehouseCustomerOrdersScreen';
import { SubWarehouseCustomerWalletScreen } from './SubWarehouseCustomerWalletScreen';
import { SubWarehouseCashTopUpScreen } from './SubWarehouseCashTopUpScreen';
import { SubWarehouseCustomerIssuesScreen } from './SubWarehouseCustomerIssuesScreen';
import { SubWarehouseSupportHistoryScreen } from './SubWarehouseSupportHistoryScreen';
import { SubWarehouseBillingHubScreen } from './SubWarehouseBillingHubScreen';
import { SubWarehouseInvoiceListScreen } from './SubWarehouseInvoiceListScreen';
import { SubWarehouseInvoiceDetailScreen } from './SubWarehouseInvoiceDetailScreen';
import { SubWarehouseGenerateInvoiceScreen } from './SubWarehouseGenerateInvoiceScreen';
import { SubWarehouseGSTInvoiceScreen } from './SubWarehouseGSTInvoiceScreen';
import { SubWarehouseInvoicePreviewScreen } from './SubWarehouseInvoicePreviewScreen';
import { SubWarehouseInvoiceHistoryScreen } from './SubWarehouseInvoiceHistoryScreen';
import { SubWarehouseInvoiceFiltersScreen, InvoiceFilterState } from './SubWarehouseInvoiceFiltersScreen';
import { SubWarehouseInvoiceHistoryFiltersScreen, InvoiceHistoryFilterState } from './SubWarehouseInvoiceHistoryFiltersScreen';
import { SubWarehouseOrderFiltersScreen, OrderFilterState } from './SubWarehouseOrderFiltersScreen';
import { SubWarehousePurchaseFiltersScreen, PurchaseFilterState } from './SubWarehousePurchaseFiltersScreen';
import { SubWarehouseTaskActionCenterScreen } from './SubWarehouseTaskActionCenterScreen';
import { SubWarehouseTaskDetailScreen } from './SubWarehouseTaskDetailScreen';
import { SubWarehouseOrderDetailScreen } from './SubWarehouseOrderDetailScreen';
import { SubWarehouseApprovalAlertsScreen } from './SubWarehouseApprovalAlertsScreen';
import { SubWarehouseExpenseRecordScreen } from './SubWarehouseExpenseRecordScreen';
import { SubWarehouseGoodsReceiptDetailScreen } from './SubWarehouseGoodsReceiptDetailScreen';
import { SubWarehouseSystemMessagesScreen } from './SubWarehouseSystemMessagesScreen';
import { SubWarehouseMessageHistoryScreen } from './SubWarehouseMessageHistoryScreen';
import {
  SubWarehouseReturnsIssuesScreen,
  INITIAL_RMA_ITEMS,
  type RmaRecord,
} from './SubWarehouseReturnsIssuesScreen';
import { SubWarehouseRmaDetailScreen } from './SubWarehouseRmaDetailScreen';
import { SubWarehouseInspectProductScreen } from './SubWarehouseInspectProductScreen';
import { SubWarehouseReviewReturnRequestScreen } from './SubWarehouseReviewReturnRequestScreen';
import { SubWarehouseRejectReturnRequestScreen } from './SubWarehouseRejectReturnRequestScreen';
import { SubWarehouseRequestRejectedScreen } from './SubWarehouseRequestRejectedScreen';
import { SubWarehouseApproveReturnScreen } from './SubWarehouseApproveReturnScreen';
import { SubWarehouseReturnApprovedScreen } from './SubWarehouseReturnApprovedScreen';
import { SubWarehouseRefundStatusScreen } from './SubWarehouseRefundStatusScreen';
import { SubWarehouseRefundFailedScreen } from './SubWarehouseRefundFailedScreen';
import { SubWarehouseRefundCompletedScreen } from './SubWarehouseRefundCompletedScreen';
import {
  SubWarehouseReturnHistoryScreen,
  type ReturnHistoryRecord,
} from './SubWarehouseReturnHistoryScreen';
import { SubWarehouseReturnHistoryDetailScreen } from './SubWarehouseReturnHistoryDetailScreen';
import {
  SubWarehouseStaffScreen,
  type StaffMember,
} from './SubWarehouseStaffScreen';
import { SubWarehouseStaffDetailScreen } from './SubWarehouseStaffDetailScreen';
import { SubWarehouseAttendanceScreen } from './SubWarehouseAttendanceScreen';
import { SubWarehouseTodayAttendanceScreen } from './SubWarehouseTodayAttendanceScreen';
import { SubWarehouseAttendanceHistoryScreen } from './SubWarehouseAttendanceHistoryScreen';
import { SubWarehouseStaffAndAttendanceScreen } from './SubWarehouseStaffAndAttendanceScreen';
import { SubWarehouseAttendanceDetailScreen } from './SubWarehouseAttendanceDetailScreen';
import { SubWarehouseRmaResolutionSuccessScreen } from './SubWarehouseRmaResolutionSuccessScreen';
import { SubWarehouseWarehouseOperationsScreen } from './SubWarehouseWarehouseOperationsScreen';
import { SubWarehouseStorageLocationDetailScreen } from './SubWarehouseStorageLocationDetailScreen';
import { SubWarehouseMaterialHandlingScreen } from './SubWarehouseMaterialHandlingScreen';
import { SubWarehouseMaterialDetailScreen } from './SubWarehouseMaterialDetailScreen';
import { SubWarehouseCapacityScreen } from './SubWarehouseCapacityScreen';
import { SubWarehouseStorageInfoScreen } from './SubWarehouseStorageInfoScreen';
import { SubWarehouseOperationalIssuesScreen } from './SubWarehouseOperationalIssuesScreen';
import { SubWarehouseReportIssueScreen } from './SubWarehouseReportIssueScreen';
import { SubWarehouseIssueSubmittedScreen } from './SubWarehouseIssueSubmittedScreen';
import { SubWarehouseOperationalIssueDetailScreen } from './SubWarehouseOperationalIssueDetailScreen';
import { SubWarehouseWarehouseActivityScreen } from './SubWarehouseWarehouseActivityScreen';
import { SubWarehouseFinanceScreen } from './SubWarehouseFinanceScreen';
import { SubWarehouseSettingsScreen } from './SubWarehouseSettingsScreen';
import {
  M3S01_InventoryDashboard,
  M3S02_StockList,
  M3S03_ProductStockDetail,
  M3S04_BatchList,
  M3S05_BatchDetail,
  M3S06_StockLedger,
  M3S07_AllocationDashboard,
  M3S08_StorageLocationStock,
  M3S09_LowStock,
  M3S10_StockVerification,
  M3S11_PhysicalCount,
  M3S12_VarianceReview,
  M3S13_StockAdjustmentRequest,
  M3S14_AdjustmentHistory,
  M3S15_StockMovementDetail,
  M3S16_InventoryFilters,
  M3S17_AdjustmentDetail,
  M3S18_StockMovementOptions,
} from '../../admin/screens/swa/inventory';
import {
  M5S01_OrdersDashboard,
  M5S02_OrdersList,
  M5S03_SearchFilters,
  M5S04_OrderDetail,
  M5S05_StockCheck,
  M5S06_StockShortage,
  M5S07_Packing,
  M5S08_ConfirmPacking,
  M5S08B_OrderPacked,
  M5S09_ReadyForPickup,
  M5S10_PickupVerification,
  M5S11_PickupOTP,
  M5S12_ConfirmHandover,
  M5S12B_PickupCompleted,
  M5S13_DeliveryPreparation,
  M5S14_Dispatch,
  M5S14B_ConfirmDispatch,
  M5S14C_OrderDispatched,
  M5S15_OrderStatusHistory,
  M5S15B_EventDetail,
  M5S16_OrderIssue,
  M5S16B_IssueSubmitted,
  M5S17_CancelOrder,
  M5S17B_ConfirmCancellation,
  M5S17C_OrderCancelled,
  M5S18_OrderInvoice,
} from '../../admin/screens/swa/orders';

// ─── Design Tokens (Brand Color: #F0562A Unified Subwarehouse Palette) ───────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primarySoft: '#FEF1EC',
  primaryBorder: '#FCD9CE',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  divider: '#F4EFE9',
  greenBadge: '#DCFCE7',
  greenText: '#15803D',
  greenDot: '#10B981',
  amberBadge: '#FEF3C7',
  amberText: '#B45309',
  amberIconBg: '#FEF3C7',
  redBadge: '#FEE2E2',
  redText: '#DC2626',
  redIconBg: '#FEE2E2',
  tealBadge: '#E0F2FE',
  tealText: '#0284C7',
  tabInactive: '#827A74',
  tabBorder: '#EAE4DB',
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
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="14" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12.5v1.5l1 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
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
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BanknotesIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WalletIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 14h.01M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
      <Rect x="4" y="3" width="16" height="18" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7v7M8.5 10.5L12 14l3.5-3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 17h10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CashRegisterActionIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M5 4h14a1 1 0 0 1 1 1v3H4V5a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 12h2M11 12h2M15 12h2M7 16h10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ViewOrdersActionIcon({ color = PALETTE.primary }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 3v18l3-1.5 3 1.5 3-1.5 3 1.5 4-2V3H4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 7h8M8 11h8M8 15h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
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
      <Path d="M1 3h15v13H1V3z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke="#FFFFFF" strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke="#FFFFFF" strokeWidth="2" />
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
      <Path d="M4 14h4l2 3h4l2-3h4v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 3v9M8 8l4 4 4-4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningAmberTriangleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9v4M12 17h.01" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
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
    statusColor: '#B45309',
    statusBg: '#FEF3C7',
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

export const INITIAL_NOTIFICATIONS: WarehouseNotification[] = [
  {
    id: 'n1',
    type: 'quality',
    title: 'GR-1024 Arrived — Pending QC',
    message: 'Tomato · Grade 1 (145 KG) arrived at intake bay. Inspection pending.',
    timestamp: '10m ago',
    isRead: false,
    tag: 'Awaiting QC',
    shipmentCode: 'GR-1024',
  },
  {
    id: 'n2',
    type: 'shipment',
    title: 'New Expected Shipment Today',
    message: 'GR-1025: Carrot · Grade 1 (120 KG) scheduled for arrival from Main Warehouse.',
    timestamp: '35m ago',
    isRead: false,
    tag: 'Expected',
    shipmentCode: 'GR-1025',
  },
  {
    id: 'n3',
    type: 'inventory',
    title: 'Low Stock Alert — Tomato Grade 1',
    message: 'Current inventory is 18 KG, falling below the safe threshold of 25 KG.',
    timestamp: '1h ago',
    isRead: false,
    tag: 'Low Stock',
  },
  {
    id: 'n4',
    type: 'mismatch',
    title: 'Handling Record Pending',
    message: '5 KG of damaged goods rejected on GR-1022 requires recorded disposal.',
    timestamp: '3h ago',
    isRead: true,
    tag: 'Handling Action',
  },
];

interface SubWarehouseAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string) => void;
  onBack?: () => void;
}

// ─── Inventory Module Navigation Component ───────────────────────────────────
function InventoryModule({ onBack, onTabChange }: { onBack: () => void; onTabChange?: (tab: SubWHTab) => void }) {
  const [currentScreen, setCurrentScreen] = useState<string>('M3S01');
  const [screenParams, setScreenParams] = useState<any>(null);
  const [navigationStack, setNavigationStack] = useState<string[]>(['M3S01']);

  const handleNavigate = (screen: string, params?: any) => {
    setNavigationStack(prev => [...prev, screen]);
    setCurrentScreen(screen);
    setScreenParams(params || null);
  };

  const handleBack = () => {
    if (navigationStack.length > 1) {
      const newStack = [...navigationStack];
      newStack.pop(); // Remove current screen
      const previousScreen = newStack[newStack.length - 1];
      setNavigationStack(newStack);
      if (previousScreen) {
        setCurrentScreen(previousScreen);
      }
      setScreenParams(null);
    } else {
      // At root (M3S01), exit to main dashboard
      onBack();
    }
  };

  // Render the appropriate screen based on currentScreen state
  switch (currentScreen) {
    case 'M3S01':
      return <M3S01_InventoryDashboard onNavigate={handleNavigate} onBack={handleBack} onTabChange={onTabChange} />;
    case 'M3S02':
      return <M3S02_StockList onNavigate={handleNavigate} onBack={handleBack} onTabChange={onTabChange} />;
    case 'M3S03':
      return <M3S03_ProductStockDetail onNavigate={handleNavigate} onBack={handleBack} onTabChange={onTabChange} />;
    case 'M3S04':
      return <M3S04_BatchList onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M3S05':
      return <M3S05_BatchDetail onNavigate={handleNavigate} onBack={handleBack} onTabChange={onTabChange} />;
    case 'M3S06':
      return <M3S06_StockLedger onNavigate={handleNavigate} onBack={handleBack} onTabChange={onTabChange} />;
    case 'M3S07':
      return <M3S07_AllocationDashboard onNavigate={handleNavigate} onBack={handleBack} onTabChange={onTabChange} />;
    case 'M3S08':
      return <M3S08_StorageLocationStock onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M3S09':
      return <M3S09_LowStock onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M3S10':
      return <M3S10_StockVerification onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M3S11':
      return <M3S11_PhysicalCount onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M3S12':
      return <M3S12_VarianceReview onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M3S13':
      return <M3S13_StockAdjustmentRequest onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M3S14':
      return <M3S14_AdjustmentHistory onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M3S15':
      return <M3S15_StockMovementDetail onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M3S16':
      return <M3S16_InventoryFilters onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M3S17':
      return <M3S17_AdjustmentDetail onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M3S18':
      return <M3S18_StockMovementOptions onNavigate={handleNavigate} onBack={handleBack} />;
    default:
      return <M3S01_InventoryDashboard onNavigate={handleNavigate} onBack={handleBack} onTabChange={onTabChange} />;
  }
}

// ─── Orders Module Navigation Component ──────────────────────────────────────
function OrdersModule({ onBack, onTabChange }: { onBack: () => void; onTabChange?: (tab: SubWHTab) => void }) {
  const [currentScreen, setCurrentScreen] = useState<string>('M5S01');
  const [screenParams, setScreenParams] = useState<any>(null);
  const [navigationStack, setNavigationStack] = useState<string[]>(['M5S01']);

  const handleNavigate = (screen: string, params?: any) => {
    setNavigationStack(prev => [...prev, screen]);
    setCurrentScreen(screen);
    setScreenParams(params || null);
  };

  const handleBack = () => {
    if (navigationStack.length > 1) {
      const newStack = [...navigationStack];
      newStack.pop(); // Remove current screen
      const previousScreen = newStack[newStack.length - 1];
      setNavigationStack(newStack);
      if (previousScreen) {
        setCurrentScreen(previousScreen);
      }
      setScreenParams(null);
    } else {
      // At root (M5S01), exit to main dashboard
      onBack();
    }
  };

  // Render the appropriate screen based on currentScreen state
  switch (currentScreen) {
    case 'M5S01':
    case 'M5S01_OrdersDashboard':
      return (
        <M5S01_OrdersDashboard
          onNavigate={handleNavigate}
          onBack={handleBack}
          onTabChange={(tab) => {
            if (tab === 'Home') {
              onBack();
            } else if (onTabChange) {
              onBack();
              onTabChange(tab as SubWHTab);
            }
          }}
        />
      );
    case 'M5S02':
    case 'M5S02_OrdersList':
      return <M5S02_OrdersList onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S03':
    case 'M5S03_SearchFilters':
      return <M5S03_SearchFilters onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S04':
    case 'M5S04_OrderDetail':
      return <M5S04_OrderDetail orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S05':
    case 'M5S05_StockCheck':
      return <M5S05_StockCheck orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S06':
    case 'M5S06_StockShortage':
      return <M5S06_StockShortage orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S07':
    case 'M5S07_Packing':
      return <M5S07_Packing orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S08':
    case 'M5S08_ConfirmPacking':
      return <M5S08_ConfirmPacking orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S08B':
    case 'M5S08_OrderPacked':
      return <M5S08B_OrderPacked orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S09':
    case 'M5S09_ReadyForPickup':
      return <M5S09_ReadyForPickup onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S10':
    case 'M5S10_PickupVerification':
      return <M5S10_PickupVerification orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S11':
    case 'M5S11_PickupOTP':
      return <M5S11_PickupOTP orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S12':
    case 'M5S12_ConfirmHandover':
      return <M5S12_ConfirmHandover orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S12B':
    case 'M5S12_PickupCompleted':
      return <M5S12B_PickupCompleted orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S13':
    case 'M5S13_DeliveryPreparation':
      return <M5S13_DeliveryPreparation orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S14':
    case 'M5S14_Dispatch':
      return <M5S14_Dispatch orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S14B':
    case 'M5S14B_ConfirmDispatch':
      return <M5S14B_ConfirmDispatch orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S14C':
    case 'M5S14C_OrderDispatched':
      return <M5S14C_OrderDispatched orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S15':
    case 'M5S15_OrderStatusHistory':
      return <M5S15_OrderStatusHistory orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S15B':
    case 'M5S15B_EventDetail':
      return (
        <M5S15B_EventDetail
          orderId={screenParams?.orderId}
          eventName={screenParams?.eventName}
          eventTime={screenParams?.eventTime}
          eventDate={screenParams?.eventDate}
          performedBy={screenParams?.performedBy}
          onNavigate={handleNavigate}
          onBack={handleBack}
        />
      );
    case 'M5S16':
    case 'M5S16_OrderIssue':
      return <M5S16_OrderIssue orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S16B':
    case 'M5S16B_IssueSubmitted':
      return <M5S16B_IssueSubmitted orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S17':
    case 'M5S17_CancelOrder':
      return <M5S17_CancelOrder orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S17B':
    case 'M5S17B_ConfirmCancellation':
      return <M5S17B_ConfirmCancellation orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S17C':
    case 'M5S17C_OrderCancelled':
      return <M5S17C_OrderCancelled orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    case 'M5S18':
    case 'M5S18_OrderInvoice':
      return <M5S18_OrderInvoice orderId={screenParams?.orderId} onNavigate={handleNavigate} onBack={handleBack} />;
    default:
      return <M5S01_OrdersDashboard onNavigate={handleNavigate} onBack={handleBack} />;
  }
}

export function SubWarehouseAdminDashboardScreen({
  onSignOut,
  onNavigate,
  onBack,
}: SubWarehouseAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<SubWHTab>('Home');
  const [receivingSubView, setReceivingSubView] = useState<'overview' | 'incoming_shipments' | 'search_filters' | 'shipment_detail'>('overview');
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTodayOverview, setShowTodayOverview] = useState(false);
  const [showSalesScreen, setShowSalesScreen] = useState(false);
  const [showWarehouseOverview, setShowWarehouseOverview] = useState(false);
  const [showRecentActivity, setShowRecentActivity] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWarehouseOperations, setShowWarehouseOperations] = useState(false);
  const [showWarehouseActivity, setShowWarehouseActivity] = useState(false);
  const [selectedStorageLocationId, setSelectedStorageLocationId] = useState<string | null>(null);
  const [showMaterialHandling, setShowMaterialHandling] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [showWarehouseCapacity, setShowWarehouseCapacity] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [showReviewReceiving, setShowReviewReceiving] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showCustomerOrders, setShowCustomerOrders] = useState(false);
  const [showCustomerWallet, setShowCustomerWallet] = useState(false);
  const [showCashTopUp, setShowCashTopUp] = useState(false);
  const [showCustomerIssues, setShowCustomerIssues] = useState(false);
  const [showSupportHistory, setShowSupportHistory] = useState(false);
  const [showBillingHub, setShowBillingHub] = useState(false);
  const [showInvoiceList, setShowInvoiceList] = useState(false);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [showGenerateInvoice, setShowGenerateInvoice] = useState(false);
  const [showGSTInvoice, setShowGSTInvoice] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showExpenseRecord, setShowExpenseRecord] = useState(false);
  const [showGoodsReceiptDetail, setShowGoodsReceiptDetail] = useState(false);
  const [showSystemMessages, setShowSystemMessages] = useState(false);
  const [showMessageHistory, setShowMessageHistory] = useState(false);
  const [showPurchaseFilters, setShowPurchaseFilters] = useState(false);
  const [showOrderFilters, setShowOrderFilters] = useState(false);
  const [showInvoiceFilters, setShowInvoiceFilters] = useState(false);
  const [showInvoiceHistoryFilters, setShowInvoiceHistoryFilters] = useState(false);

  const [purchaseFilters, setPurchaseFilters] = useState<PurchaseFilterState | undefined>(undefined);
  const [orderFilters, setOrderFilters] = useState<OrderFilterState | undefined>(undefined);
  const [invoiceFilters, setInvoiceFilters] = useState<InvoiceFilterState | undefined>(undefined);
  const [invoiceHistoryFilters, setInvoiceHistoryFilters] = useState<InvoiceHistoryFilterState | undefined>(undefined);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('INV-2026-001245');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showWalletOperations, setShowWalletOperations] = useState(false);
  const [showReturnsIssues, setShowReturnsIssues] = useState(false);
  const [selectedRma, setSelectedRma] = useState<RmaRecord | null>(null);
  const [inspectingRma, setInspectingRma] = useState<RmaRecord | null>(null);
  const [reviewingRma, setReviewingRma] = useState<{
    rma: RmaRecord;
    inspectedQty: string;
    notes: string;
  } | null>(null);
  const [resolutionSuccess, setResolutionSuccess] = useState<{
    rma: RmaRecord;
    status: 'Approved' | 'Rejected';
    approvedQty: string;
    refundAmount: string;
  } | null>(null);
  const [showRefundStatusRma, setShowRefundStatusRma] = useState<RmaRecord | null>(null);
  const [showRefundFailedRma, setShowRefundFailedRma] = useState<RmaRecord | null>(null);
  const [refundCompletedRma, setRefundCompletedRma] = useState<{ rma: RmaRecord; refundAmount: string } | null>(null);
  const [rejectingRma, setRejectingRma] = useState<RmaRecord | null>(null);
  const [rejectedRma, setRejectedRma] = useState<{ rma: RmaRecord; reason: string } | null>(null);
  const [approvingRma, setApprovingRma] = useState<RmaRecord | null>(null);
  const [returnApprovedRma, setReturnApprovedRma] = useState<RmaRecord | null>(null);
  const [showReturnHistory, setShowReturnHistory] = useState(false);
  const [selectedReturnHistoryRecord, setSelectedReturnHistoryRecord] = useState<ReturnHistoryRecord | null>(null);
  const [showStaffScreen, setShowStaffScreen] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState<StaffMember | null>(null);
  const [showAttendanceScreen, setShowAttendanceScreen] = useState(false);
  const [showStaffAndAttendance, setShowStaffAndAttendance] = useState(false);
  const [selectedAttendanceStaffId, setSelectedAttendanceStaffId] = useState<string | null>(null);
  const [showTodayAttendanceScreen, setShowTodayAttendanceScreen] = useState(false);
  const [showAttendanceHistoryScreen, setShowAttendanceHistoryScreen] = useState(false);
  const [showOperationalIssues, setShowOperationalIssues] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showIssueSubmitted, setShowIssueSubmitted] = useState(false);
  const [showIssueDetail, setShowIssueDetail] = useState(false);
  const [showReportsScreen, setShowReportsScreen] = useState(false);
  const [showFinanceScreen, setShowFinanceScreen] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [user, setUser] = useState<UserMe | null>(null);
  const [notifications, setNotifications] = useState<WarehouseNotification[]>(INITIAL_NOTIFICATIONS);

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

  const handleIncomingNotification = () => {
    const samples: Omit<WarehouseNotification, 'id' | 'timestamp' | 'isRead'>[] = [
      {
        type: 'shipment',
        title: 'Incoming Truck at Gate 1',
        message: 'GR-1029: Potato · Grade 1 (200 KG) has entered the warehouse dock.',
        tag: 'Gate Arrival',
      },
      {
        type: 'quality',
        title: 'QC Inspection Urgent',
        message: 'GR-1026 batch sample is ready for moisture & pest checks.',
        tag: 'Urgent QC',
      },
      {
        type: 'mismatch',
        title: 'Discrepancy Reported',
        message: 'Shortage of 15 KG flagged on intake weighing scale for GR-1028.',
        tag: 'Weight Shortage',
      },
      {
        type: 'success',
        title: 'Goods Receipt Completed',
        message: 'GR-1023: 140 KG successfully stored in Section B cold storage.',
        tag: 'Received',
      },
    ];

    const randomSample = samples[Math.floor(Math.random() * samples.length)]!;
    const newNotif: WarehouseNotification = {
      id: 'n_' + Date.now(),
      ...randomSample,
      timestamp: 'Just now',
      isRead: false,
    };

    setNotifications(prev => [newNotif, ...prev]);
  };

  interface NavHistoryItem {
    tab: SubWHTab;
    receivingSubView: 'overview' | 'incoming_shipments' | 'search_filters' | 'shipment_detail';
    selectedShipment?: ShipmentItem;
  }

  const [history, setHistory] = useState<NavHistoryItem[]>([
    { tab: 'Home', receivingSubView: 'overview' },
  ]);

  const navigateTo = (
    tab: SubWHTab,
    subView: 'overview' | 'incoming_shipments' | 'search_filters' | 'shipment_detail' = 'overview',
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

  const [showOrdersModule, setShowOrdersModule] = useState(false);

  useEffect(() => {
    const onHardwareBack = () => {
      if (showNotifications) {
        setShowNotifications(false);
        return true;
      }
      if (showOrdersModule) {
        setShowOrdersModule(false);
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

  if (showMessageHistory) {
    return (
      <SubWarehouseMessageHistoryScreen
        onBack={() => setShowMessageHistory(false)}
      />
    );
  }

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
      <SubWarehouseOrderDetailScreen
        onBack={() => setShowOrderDetail(false)}
        onViewStatus={() =>
          Alert.alert('Pickup Status', 'Ready for customer pickup at Bay 2.')
        }
      />
    );
  }

  if (showExpenseRecord) {
    return (
      <SubWarehouseExpenseRecordScreen
        onBack={() => setShowExpenseRecord(false)}
        onApprove={() => {
          Alert.alert('Approved', 'Expense EXP-001245 approved successfully.');
          setShowExpenseRecord(false);
        }}
      />
    );
  }

  if (showGoodsReceiptDetail) {
    return (
      <SubWarehouseGoodsReceiptDetailScreen
        onBack={() => setShowGoodsReceiptDetail(false)}
        onTakeAction={() => {
          Alert.alert('Action Taken', 'Variance reconciliation initiated.');
          setShowGoodsReceiptDetail(false);
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

  if (showAlerts) {
    return (
      <SubWarehouseApprovalAlertsScreen
        onBack={() => setShowAlerts(false)}
        onNavigateToExpenseRecord={() => setShowExpenseRecord(true)}
        onNavigateToGoodsReceiptDetail={() => setShowGoodsReceiptDetail(true)}
        onOpenRecord={(alertId) => {
          if (alertId === 'GR-00245') {
            setShowGoodsReceiptDetail(true);
          } else {
            setShowExpenseRecord(true);
          }
        }}
      />
    );
  }

  if (showSystemMessages) {
    return (
      <SubWarehouseSystemMessagesScreen
        onBack={() => setShowSystemMessages(false)}
        onTabChange={(tab) => {
          setShowSystemMessages(false);
          setActiveTab(tab);
        }}
        onNavigateToHistory={() => {
          if (onNavigate) onNavigate('SubWarehouseMessageHistory');
          else setShowMessageHistory(true);
        }}
      />
    );
  }

  if (receivingWizardStep !== null) {
    return (
      <GoodsReceivingWizard
        initialStep={receivingWizardStep}
        shipment={selectedShipment as any}
        onClose={() => setReceivingWizardStep(null)}
        onFinish={() => {
          setReceivingWizardStep(null);
          navigateTo('Receiving', 'overview');
        }}
        onBackToShipments={() => {
          setReceivingWizardStep(null);
          navigateTo('Receiving', 'incoming_shipments');
        }}
      />
    );
  }

  if (showNotifications) {
    return (
      <SubWarehouseNotificationsScreen
        onBack={() => setShowNotifications(false)}
        onTabChange={(tab) => {
          setShowNotifications(false);
          setActiveTab(tab);
        }}
        onNavigateToTasks={() => {
          if (onNavigate) onNavigate('SubWarehouseTaskActionCenter');
          else setShowTasks(true);
        }}
        onNavigateToAlerts={() => {
          if (onNavigate) onNavigate('SubWarehouseApprovalAlerts');
          else setShowAlerts(true);
        }}
        onNavigateToSystemMessages={() => {
          if (onNavigate) onNavigate('SubWarehouseSystemMessages');
          else setShowSystemMessages(true);
        }}
        onNavigateToAction={(actionLabel) => {
          setShowNotifications(false);
          if (actionLabel.includes('Review')) {
            if (onNavigate) onNavigate('SubWarehouseReviewReceiving');
            else setShowReviewReceiving(true);
          } else if (actionLabel.includes('Stock')) {
            setActiveTab('Inventory');
          } else if (actionLabel.includes('Order')) {
            setActiveTab('Home');
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
          setActiveTab(tab);
        }}
        onNavigateToSection={(section) => {
          setShowTodayOverview(false);
          if (section === 'Receiving') setActiveTab('Receiving');
          else if (section === 'Inventory') setActiveTab('Inventory');
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
          setActiveTab('Inventory');
        }}
        onNavigateToReceiving={() => {
          setShowWarehouseOverview(false);
          setActiveTab('Receiving');
        }}
        onNavigateToOrders={() => {
          setShowWarehouseOverview(false);
          setShowOrdersModule(true);
        }}
        onNavigateToOperations={() => {
          setShowWarehouseOverview(false);
          setActiveTab('More');
        }}
      />
    );
  }

  if (showWarehouseActivity) {
    return (
      <SubWarehouseWarehouseActivityScreen
        onBack={() => {
          // Back from Activity → return to the Storage Location Detail
          setShowWarehouseActivity(false);
          // selectedStorageLocationId still has the id, so detail screen renders
        }}
        onTabChange={(tab) => {
          setShowWarehouseActivity(false);
          setSelectedStorageLocationId(null);
          setShowStorageInfo(false);
          setShowWarehouseOperations(false);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (selectedStorageLocationId) {
    return (
      <SubWarehouseStorageLocationDetailScreen
        locationId={selectedStorageLocationId}
        onBack={() => {
          // Back from detail → go back to Storage Info list
          setSelectedStorageLocationId(null);
          setShowStorageInfo(true);
        }}
        onViewActivity={() => setShowWarehouseActivity(true)}
      />
    );
  }

  if (showStorageInfo) {
    return (
      <SubWarehouseStorageInfoScreen
        onBack={() => {
          // Back from Storage List → go back to Warehouse Operations
          setShowStorageInfo(false);
          setShowWarehouseOperations(true);
        }}
        onTabChange={(tab) => {
          setShowStorageInfo(false);
          setActiveTab(tab);
        }}
        onSelectLocation={(id) => {
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
          if (onNavigate) onNavigate('SubWarehouseStorageInfo');
          else setShowStorageInfo(true);
        }}
        onNavigateToCapacity={() => {
          setShowWarehouseOperations(false);
          setShowWarehouseCapacity(true);
        }}
        onNavigateToMaterialHandling={() => {
          setShowWarehouseOperations(false);
          setShowMaterialHandling(true);
        }}
        onNavigateToOperationalIssues={() => {
          setShowWarehouseOperations(false);
          setShowOperationalIssues(true);
        }}
        onTabChange={(tab) => {
          setShowWarehouseOperations(false);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (selectedMaterialId) {
    return (
      <SubWarehouseMaterialDetailScreen
        materialId={selectedMaterialId}
        onBack={() => setSelectedMaterialId(null)}
      />
    );
  }

  if (showMaterialHandling) {
    return (
      <SubWarehouseMaterialHandlingScreen
        onBack={() => setShowMaterialHandling(false)}
        onSelectMaterial={(id) => setSelectedMaterialId(id)}
      />
    );
  }

  if (showWarehouseCapacity) {
    return (
      <SubWarehouseCapacityScreen
        onBack={() => setShowWarehouseCapacity(false)}
        onTabChange={(tab) => {
          setShowWarehouseCapacity(false);
          setActiveTab(tab as SubWHTab);
        }}
      />
    );
  }

  if (showReportIssue) {
    return (
      <SubWarehouseReportIssueScreen
        onBack={() => setShowReportIssue(false)}
        onSubmit={() => {
          setShowReportIssue(false);
          setShowIssueSubmitted(true);
        }}
      />
    );
  }

  if (showIssueSubmitted) {
    return (
      <SubWarehouseIssueSubmittedScreen
        onViewIssue={() => {
          setShowIssueSubmitted(false);
          setShowIssueDetail(true);
        }}
      />
    );
  }

  if (showIssueDetail) {
    return (
      <SubWarehouseOperationalIssueDetailScreen
        onBack={() => setShowIssueDetail(false)}
      />
    );
  }

  if (showOperationalIssues) {
    return (
      <SubWarehouseOperationalIssuesScreen
        onBack={() => setShowOperationalIssues(false)}
        onNavigateToReport={() => {
          setShowOperationalIssues(false);
          setShowReportIssue(true);
        }}
        onViewIssueDetail={() => {
          setShowOperationalIssues(false);
          setShowIssueDetail(true);
        }}
      />
    );
  }

  if (showRecentActivity) {
    return (
      <SubWarehouseRecentActivityScreen
        onBack={() => setShowRecentActivity(false)}
        onTabChange={(tab) => {
          setShowRecentActivity(false);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (showReviewReceiving) {
    return (
      <SubWarehouseReviewReceivingScreen
        onBack={() => setShowReviewReceiving(false)}
        onSuccess={() => {
          setShowReviewReceiving(false);
          setActiveTab('Receiving');
        }}
        shipmentData={{
          reference: 'GR-1024',
          source: 'Main Warehouse (Ooty Hub)',
          product: 'Tomato (Grade 1)',
          expectedQuantity: '150 KG',
        }}
      />
    );
  }

  if (showProfile) {
    return (
      <SubWarehouseProfileScreen
        onBack={() => setShowProfile(false)}
        onTabChange={(tab) => {
          setShowProfile(false);
          setActiveTab(tab);
        }}
        onNavigateToInventory={() => {
          setShowProfile(false);
          setActiveTab('Inventory');
        }}
        onNavigateToStorageInfo={() => {
          setShowProfile(false);
          if (onNavigate) onNavigate('SubWarehouseStorageInfo');
        }}
        onNavigateToOperatingInfo={() => {
          setShowProfile(false);
          if (onNavigate) onNavigate('SubWarehouseOperatingInfo');
        }}
        onNavigateToContact={() => {
          setShowProfile(false);
          if (onNavigate) onNavigate('SubWarehouseContact');
        }}
        onNavigateToDocuments={() => {
          setShowProfile(false);
          if (onNavigate) onNavigate('SubWarehouseDocuments');
        }}
      />
    );
  }

  if (showReportsScreen) {
    return (
      <SubWarehouseReportsScreen
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
      <SubWarehouseSalesScreen
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
      />
    );
  }

  if (showPurchaseFilters) {
    return (
      <SubWarehousePurchaseFiltersScreen
        initialFilters={purchaseFilters}
        onBack={() => setShowPurchaseFilters(false)}
        onApplyFilters={(f) => {
          setPurchaseFilters(f);
          setShowPurchaseFilters(false);
        }}
      />
    );
  }

  if (showPurchaseHistory) {
    return (
      <SubWarehousePurchaseHistoryScreen
        customerName={selectedCustomer?.name || 'Rajesh Kumar'}
        onBack={() => setShowPurchaseHistory(false)}
        onTabChange={(tab) => {
          setShowPurchaseHistory(false);
          setShowCustomerDetails(false);
          setShowCustomers(false);
          setActiveTab(tab);
        }}
        onOpenFilters={() => {
          if (onNavigate) onNavigate('SubWarehousePurchaseFilters');
          else setShowPurchaseFilters(true);
        }}
        appliedFilters={purchaseFilters}
        onClearFilters={() => setPurchaseFilters(undefined)}
      />
    );
  }

  if (showOrderFilters) {
    return (
      <SubWarehouseOrderFiltersScreen
        initialFilters={orderFilters}
        customerName={selectedCustomer?.name || 'Rajesh Kumar'}
        onBack={() => setShowOrderFilters(false)}
        onApplyFilters={(f) => {
          setOrderFilters(f);
          setShowOrderFilters(false);
        }}
      />
    );
  }

  if (showCustomerOrders) {
    return (
      <SubWarehouseCustomerOrdersScreen
        customerName={selectedCustomer?.name || 'Rajesh Kumar'}
        onBack={() => setShowCustomerOrders(false)}
        onOpenFilters={() => {
          if (onNavigate) onNavigate('SubWarehouseOrderFilters');
          else setShowOrderFilters(true);
        }}
        appliedFilters={orderFilters}
        onClearFilters={() => setOrderFilters(undefined)}
      />
    );
  }

  if (showCashTopUp) {
    return (
      <SubWarehouseCashTopUpScreen
        customerName={selectedCustomer?.name || 'Rajesh Kumar'}
        customerCode={selectedCustomer?.code || 'CUS-00291'}
        currentBalance="₹1,250"
        onBack={() => setShowCashTopUp(false)}
        onSuccess={() => setShowCashTopUp(false)}
      />
    );
  }

  if (showCustomerWallet) {
    return (
      <SubWarehouseCustomerWalletScreen
        customerName={selectedCustomer?.name || 'Rajesh Kumar'}
        onBack={() => setShowCustomerWallet(false)}
        onCashTopUp={() => setShowCashTopUp(true)}
      />
    );
  }

  if (showCustomerIssues) {
    return (
      <SubWarehouseCustomerIssuesScreen
        customerName={selectedCustomer?.name || 'Rajesh Kumar'}
        onBack={() => setShowCustomerIssues(false)}
      />
    );
  }

  if (showSupportHistory) {
    return (
      <SubWarehouseSupportHistoryScreen
        customerName={selectedCustomer?.name || 'Rajesh Kumar'}
        onBack={() => setShowSupportHistory(false)}
      />
    );
  }

  if (showCustomerDetails) {
    return (
      <SubWarehouseCustomerDetailsScreen
        customer={selectedCustomer}
        onBack={() => setShowCustomerDetails(false)}
        onTabChange={(tab) => {
          setShowCustomerDetails(false);
          setShowCustomers(false);
          setActiveTab(tab);
        }}
        onNavigateToOrders={() => setShowCustomerOrders(true)}
        onNavigateToPurchases={() => setShowPurchaseHistory(true)}
        onNavigateToWallet={() => setShowCustomerWallet(true)}
        onNavigateToIssues={() => setShowCustomerIssues(true)}
        onNavigateToSupport={() => setShowSupportHistory(true)}
      />
    );
  }

  if (showCustomerSearch) {
    return (
      <SubWarehouseCustomerSearchScreen
        onBack={() => setShowCustomerSearch(false)}
        onSelectCustomer={(name, id) => {
          setSelectedCustomer({ name, id: id || 'CUS-00291' });
          setShowCustomerSearch(false);
          setShowCustomerDetails(true);
        }}
      />
    );
  }

  if (showCustomers) {
    return (
      <SubWarehouseCustomersScreen
        onBack={() => {
          setShowCustomers(false);
          setActiveTab('More');
        }}
        onTabChange={(tab) => {
          setShowCustomers(false);
          setActiveTab(tab);
        }}
        onNavigateToSearch={() => setShowCustomerSearch(true)}
        onSelectCustomer={(customer) => {
          setSelectedCustomer(customer);
          setShowCustomerDetails(true);
        }}
        onNavigateToNotifications={() => {
          if (onNavigate) onNavigate('SubWarehouseNotifications');
          else setShowNotifications(true);
        }}
      />
    );
  }

  if (showInvoicePreview) {
    return (
      <SubWarehouseInvoicePreviewScreen
        invoiceId={selectedInvoiceId}
        onBack={() => setShowInvoicePreview(false)}
      />
    );
  }

  if (showGSTInvoice) {
    return (
      <SubWarehouseGSTInvoiceScreen
        onBack={() => setShowGSTInvoice(false)}
        onViewExisting={() => {
          setShowGSTInvoice(false);
          setShowInvoiceDetail(true);
        }}
        onPreviewAuthorized={() => {
          setShowGSTInvoice(false);
          setShowInvoicePreview(true);
        }}
      />
    );
  }

  if (showGenerateInvoice) {
    return (
      <SubWarehouseGenerateInvoiceScreen
        onBack={() => setShowGenerateInvoice(false)}
        onSelectTransaction={(tx) => {
          setSelectedInvoiceId('INV-2026-001245');
          setShowGenerateInvoice(false);
          setShowInvoicePreview(true);
        }}
        onNavigateToGSTInvoice={() => {
          setShowGenerateInvoice(false);
          setShowGSTInvoice(true);
        }}
      />
    );
  }

  if (showInvoiceHistoryFilters) {
    return (
      <SubWarehouseInvoiceHistoryFiltersScreen
        initialFilters={invoiceHistoryFilters}
        onBack={() => setShowInvoiceHistoryFilters(false)}
        onApplyFilters={(f) => {
          setInvoiceHistoryFilters(f);
          setShowInvoiceHistoryFilters(false);
        }}
      />
    );
  }

  if (showInvoiceHistory) {
    return (
      <SubWarehouseInvoiceHistoryScreen
        onBack={() => setShowInvoiceHistory(false)}
        onNavigateToInvoiceDetail={(id) => {
          setSelectedInvoiceId(id);
          setShowInvoiceHistory(false);
          setShowInvoiceDetail(true);
        }}
        onOpenFilters={() => {
          if (onNavigate) onNavigate('SubWarehouseInvoiceHistoryFilters');
          else setShowInvoiceHistoryFilters(true);
        }}
        appliedFilters={invoiceHistoryFilters}
        onClearFilters={() => setInvoiceHistoryFilters(undefined)}
      />
    );
  }

  if (showInvoiceDetail) {
    return (
      <SubWarehouseInvoiceDetailScreen
        invoiceId={selectedInvoiceId}
        onBack={() => setShowInvoiceDetail(false)}
      />
    );
  }

  if (showInvoiceFilters) {
    return (
      <SubWarehouseInvoiceFiltersScreen
        initialFilters={invoiceFilters}
        onBack={() => setShowInvoiceFilters(false)}
        onApplyFilters={(f) => {
          setInvoiceFilters(f);
          setShowInvoiceFilters(false);
        }}
      />
    );
  }

  if (showInvoiceList) {
    return (
      <SubWarehouseInvoiceListScreen
        onBack={() => setShowInvoiceList(false)}
        onNavigateToInvoiceDetail={(id) => {
          setSelectedInvoiceId(id);
          setShowInvoiceDetail(true);
        }}
        onOpenFilters={() => {
          if (onNavigate) onNavigate('SubWarehouseInvoiceFilters');
          else setShowInvoiceFilters(true);
        }}
        appliedFilters={invoiceFilters}
        onClearFilters={() => setInvoiceFilters(undefined)}
      />
    );
  }

  if (showBillingHub) {
    return (
      <SubWarehouseBillingHubScreen
        onBack={() => {
          setShowBillingHub(false);
          setActiveTab('More');
        }}
        onTabChange={(tab) => {
          setShowBillingHub(false);
          setActiveTab(tab);
        }}
        onNavigateToInvoiceList={() => {
          if (onNavigate) onNavigate('SubWarehouseInvoiceList');
          else setShowInvoiceList(true);
        }}
        onNavigateToInvoiceDetail={(id) => {
          setSelectedInvoiceId(id || 'INV-2026-001245');
          if (onNavigate) onNavigate('SubWarehouseInvoiceDetail');
          else setShowInvoiceDetail(true);
        }}
        onGenerateInvoice={() => {
          if (onNavigate) onNavigate('SubWarehouseGenerateInvoice');
          else setShowGenerateInvoice(true);
        }}
        onNavigateToInvoiceHistory={() => {
          if (onNavigate) onNavigate('SubWarehouseInvoiceHistory');
          else setShowInvoiceHistory(true);
        }}
        onNavigateToNotifications={() => {
          if (onNavigate) onNavigate('SubWarehouseNotifications');
          else setShowNotifications(true);
        }}
      />
    );
  }

  if (showWalletOperations) {
    return (
      <SubWarehouseWalletOperationsScreen
        warehouseName="Coonoor Warehouse"
        onBack={() => {
          setShowWalletOperations(false);
          setActiveTab('More');
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

  if (showAttendanceScreen) {
    return (
      <SubWarehouseAttendanceScreen
        warehouseName="Coonoor Warehouse"
        onBack={() => setShowAttendanceScreen(false)}
        onTabChange={(tab) => {
          setShowAttendanceScreen(false);
          setShowStaffScreen(false);
          setSelectedStaffMember(null);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (selectedStaffMember) {
    return (
      <SubWarehouseStaffDetailScreen
        staff={selectedStaffMember}
        onBack={() => setSelectedStaffMember(null)}
        onViewAttendance={() => {
          setShowAttendanceScreen(true);
        }}
      />
    );
  }

  if (showStaffScreen) {
    return (
      <SubWarehouseStaffScreen
        warehouseName="Coonoor Warehouse"
        onBack={() => setShowStaffScreen(false)}
        onSelectStaff={(staff) => setSelectedStaffMember(staff)}
        onTabChange={(tab) => {
          setShowStaffScreen(false);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (selectedReturnHistoryRecord) {
    return (
      <SubWarehouseReturnHistoryDetailScreen
        record={selectedReturnHistoryRecord}
        onBack={() => setSelectedReturnHistoryRecord(null)}
      />
    );
  }

  if (showReturnHistory) {
    return (
      <SubWarehouseReturnHistoryScreen
        onBack={() => setShowReturnHistory(false)}
        onSelectRecord={(rec) => setSelectedReturnHistoryRecord(rec)}
        onTabChange={(tab) => {
          setShowReturnHistory(false);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (refundCompletedRma) {
    return (
      <SubWarehouseRefundCompletedScreen
        rma={refundCompletedRma.rma}
        refundAmount={refundCompletedRma.refundAmount}
        transactionId="REF-2026-001245"
        onBack={() => {
          setRefundCompletedRma(null);
          setShowRefundStatusRma(null);
          setReturnApprovedRma(null);
          setApprovingRma(null);
          setReviewingRma(null);
          setInspectingRma(null);
          setSelectedRma(null);
          setShowReturnsIssues(true);
        }}
      />
    );
  }

  if (resolutionSuccess) {
    return (
      <SubWarehouseRmaResolutionSuccessScreen
        rma={resolutionSuccess.rma}
        status={resolutionSuccess.status}
        approvedQty={resolutionSuccess.approvedQty}
        refundAmount={resolutionSuccess.refundAmount}
        onViewReturnsList={() => {
          setResolutionSuccess(null);
          setReviewingRma(null);
          setInspectingRma(null);
          setSelectedRma(null);
          setShowReturnsIssues(true);
        }}
        onBackToMore={() => {
          setResolutionSuccess(null);
          setReviewingRma(null);
          setInspectingRma(null);
          setSelectedRma(null);
          setShowReturnsIssues(false);
          setActiveTab('More');
        }}
      />
    );
  }

  if (rejectedRma) {
    return (
      <SubWarehouseRequestRejectedScreen
        rma={rejectedRma.rma}
        onDone={() => {
          setRejectedRma(null);
          setRejectingRma(null);
          setReviewingRma(null);
          setInspectingRma(null);
          setSelectedRma(null);
          setShowReturnsIssues(true);
        }}
      />
    );
  }

  if (rejectingRma) {
    return (
      <SubWarehouseRejectReturnRequestScreen
        rma={rejectingRma}
        onBack={() => setRejectingRma(null)}
        onRejectSuccess={(data) => {
          setRejectedRma(data);
          setRejectingRma(null);
        }}
      />
    );
  }

  if (returnApprovedRma) {
    return (
      <SubWarehouseReturnApprovedScreen
        rma={returnApprovedRma}
        onBack={() => setReturnApprovedRma(null)}
        onGoToRefundStatus={(rma) => {
          setReturnApprovedRma(null);
          setShowRefundStatusRma(rma);
        }}
      />
    );
  }

  if (showRefundFailedRma) {
    return (
      <SubWarehouseRefundFailedScreen
        rma={showRefundFailedRma}
        onBack={() => setShowRefundFailedRma(null)}
      />
    );
  }

  if (showRefundStatusRma) {
    return (
      <SubWarehouseRefundStatusScreen
        rma={showRefundStatusRma}
        refundAmount="₹200.00"
        onBack={() => setShowRefundStatusRma(null)}
        onConfirmSuccess={(data) => {
          setShowRefundStatusRma(null);
          setRefundCompletedRma(data);
        }}
        onSimulateFailure={(rma) => {
          setShowRefundFailedRma(rma);
        }}
      />
    );
  }

  if (approvingRma) {
    return (
      <SubWarehouseApproveReturnScreen
        rma={approvingRma}
        onBack={() => setApprovingRma(null)}
        onConfirmApprove={(rma) => {
          setApprovingRma(null);
          setReturnApprovedRma(rma);
        }}
      />
    );
  }

  if (reviewingRma) {
    return (
      <SubWarehouseReviewReturnRequestScreen
        rma={reviewingRma.rma}
        inspectedQty={reviewingRma.inspectedQty}
        inspectionNotes={reviewingRma.notes}
        onBack={() => setReviewingRma(null)}
        onApprove={(rma) => {
          setApprovingRma(rma);
        }}
        onReject={(rma) => {
          setRejectingRma(rma);
        }}
        onDecision={(decision) => {
          if (decision.status === 'Approved') {
            setApprovingRma(reviewingRma.rma);
          } else {
            setRejectingRma(reviewingRma.rma);
          }
        }}
      />
    );
  }

  if (inspectingRma) {
    return (
      <SubWarehouseInspectProductScreen
        rma={inspectingRma}
        onBack={() => setInspectingRma(null)}
        onContinueToReview={(inspectionData) => {
          setReviewingRma({
            rma: inspectionData.rma,
            inspectedQty: inspectionData.receivedQty,
            notes: inspectionData.notes,
          });
        }}
      />
    );
  }

  if (selectedRma) {
    return (
      <SubWarehouseRmaDetailScreen
        rma={selectedRma}
        onBack={() => setSelectedRma(null)}
        onInspectProduct={(rma) => setInspectingRma(rma)}
      />
    );
  }

  if (showReturnsIssues) {
    return (
      <SubWarehouseReturnsIssuesScreen
        warehouseName="Coonoor Warehouse"
        onBack={() => setShowReturnsIssues(false)}
        onSelectRma={(rma) => setSelectedRma(rma)}
        onNavigateToHistory={() => setShowReturnHistory(true)}
        onTabChange={(tab) => {
          setShowReturnsIssues(false);
          setActiveTab(tab);
        }}
        onNavigateToNotifications={() => {
          setShowReturnsIssues(false);
          if (onNavigate) {
            onNavigate('SubWarehouseNotifications');
          } else {
            setShowNotifications(true);
          }
        }}
      />
    );
  }

  if (showAttendanceHistoryScreen) {
    return (
      <SubWarehouseAttendanceHistoryScreen
        onBack={() => setShowAttendanceHistoryScreen(false)}
        onNavigateToToday={() => {
          setShowAttendanceHistoryScreen(false);
          setShowTodayAttendanceScreen(true);
        }}
        onTabChange={(tab) => {
          setShowAttendanceHistoryScreen(false);
          setShowTodayAttendanceScreen(false);
          setShowStaffScreen(false);
          setSelectedStaffMember(null);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (showTodayAttendanceScreen) {
    return (
      <SubWarehouseTodayAttendanceScreen
        onBack={() => setShowTodayAttendanceScreen(false)}
        onNavigateToHistory={() => setShowAttendanceHistoryScreen(true)}
        onTabChange={(tab) => {
          setShowTodayAttendanceScreen(false);
          setShowStaffScreen(false);
          setSelectedStaffMember(null);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (showAttendanceScreen) {
    return (
      <SubWarehouseAttendanceScreen
        onBack={() => setShowAttendanceScreen(false)}
        onTabChange={(tab) => {
          setShowAttendanceScreen(false);
          setShowStaffScreen(false);
          setSelectedStaffMember(null);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (selectedStaffMember) {
    return (
      <SubWarehouseStaffDetailScreen
        staff={selectedStaffMember}
        onBack={() => setSelectedStaffMember(null)}
        onViewAttendance={() => setShowAttendanceScreen(true)}
      />
    );
  }

  if (showStaffScreen) {
    return (
      <SubWarehouseStaffScreen
        onBack={() => setShowStaffScreen(false)}
        onSelectStaff={(staff) => setSelectedStaffMember(staff)}
        onNavigateToAttendance={() => setShowAttendanceScreen(true)}
        onNavigateToTodayAttendance={() => setShowTodayAttendanceScreen(true)}
        onTabChange={(tab) => {
          setShowStaffScreen(false);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (showStaffAndAttendance) {
    return (
      <SubWarehouseStaffAndAttendanceScreen
        onBack={() => setShowStaffAndAttendance(false)}
        onNavigateToDetail={(id) => {
          setShowStaffAndAttendance(false);
          setSelectedAttendanceStaffId(id);
        }}
        onTabChange={(tab) => {
          setShowStaffAndAttendance(false);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (selectedAttendanceStaffId) {
    return (
      <SubWarehouseAttendanceDetailScreen
        staffId={selectedAttendanceStaffId}
        onBack={() => setSelectedAttendanceStaffId(null)}
      />
    );
  }

  if (showFinanceScreen) {
    return (
      <SubWarehouseFinanceScreen
        onBack={() => {
          setShowFinanceScreen(false);
          setActiveTab('More');
        }}
        onTabChange={(tab) => {
          setShowFinanceScreen(false);
          setActiveTab(tab);
        }}
      />
    );
  }

  if (showSettingsScreen) {
    return (
      <SubWarehouseSettingsScreen
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
                {onBack && (
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={onBack}
                    activeOpacity={0.8}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <ArrowBackIcon size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
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
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => setShowOrdersModule(true)}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <ClipboardClockIcon />
                  </View>
                  <Text style={styles.overviewNumber}>12</Text>
                  <Text style={styles.overviewTitle}>Pending Orders</Text>
                  <Text style={styles.overviewSub}>8 need action</Text>
                </TouchableOpacity>

                {/* 2. Ready for Pickup */}
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => setShowOrdersModule(true)}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <PersonCheckIcon />
                  </View>
                  <Text style={styles.overviewNumber}>08</Text>
                  <Text style={styles.overviewTitle}>Ready for Pickup</Text>
                  <Text style={styles.overviewSub}>3 customers expected</Text>
                </TouchableOpacity>

                {/* 3. Today's Receiving */}
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => navigateTo('Receiving', 'overview')}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <DeliveryTruckIcon />
                  </View>
                  <Text style={styles.overviewNumber}>03</Text>
                  <Text style={styles.overviewTitle}>Today's Receiving</Text>
                  <Text style={styles.overviewSub}>1 awaiting QC</Text>
                </TouchableOpacity>

                {/* 4. Low Stock Items */}
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => setActiveTab('Inventory')}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <BoxIcon color={PALETTE.primary} />
                  </View>
                  <Text style={[styles.overviewNumber, { color: '#E11D48' }]}>05</Text>
                  <Text style={styles.overviewTitle}>Low Stock Items</Text>
                  <Text style={[styles.overviewSub, { color: '#E11D48' }]}>Needs attention</Text>
                </TouchableOpacity>

                {/* 5. Today's Sales */}
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseSales');
                    } else {
                      setShowSalesScreen(true);
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <BanknotesIcon />
                  </View>
                  <Text style={styles.overviewNumber}>₹24,850</Text>
                  <Text style={styles.overviewTitle}>Today's Sales</Text>
                  <Text style={styles.overviewSub}>42 transactions</Text>
                </TouchableOpacity>

                {/* 6. Cash Top-Ups */}
                <TouchableOpacity
                  style={styles.overviewCard}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseWalletOperations');
                    } else {
                      setActiveTab('More');
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.overviewIconWrap}>
                    <WalletIcon />
                  </View>
                  <Text style={styles.overviewNumber}>₹18,500</Text>
                  <Text style={styles.overviewTitle}>Cash Top-Ups</Text>
                  <Text style={styles.overviewSub}>12 transactions</Text>
                </TouchableOpacity>
              </View>

              {/* 3. Quick Actions */}
              <Text style={styles.sectionHeading}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setReceivingWizardStep('start_receiving')}
                  activeOpacity={0.75}
                >
                  <ReceiveGoodsActionIcon />
                  <Text style={styles.quickActionLabel}>Receive Goods</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseSales');
                    } else {
                      setShowSalesScreen(true);
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <CashRegisterActionIcon />
                  <Text style={styles.quickActionLabel}>New Sale</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setShowOrdersModule(true)}
                  activeOpacity={0.75}
                >
                  <ViewOrdersActionIcon />
                  <Text style={styles.quickActionLabel}>View Orders</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseWalletOperations');
                    } else {
                      setActiveTab('More');
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <CashTopUpActionIcon />
                  <Text style={styles.quickActionLabel}>Cash Top-Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setActiveTab('Inventory')}
                  activeOpacity={0.75}
                >
                  <StockVerifyActionIcon />
                  <Text style={[styles.quickActionLabel, { color: PALETTE.textInk }]}>Stock Verify</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => {
                    if (onNavigate) {
                      onNavigate('SubWarehouseRecentActivity');
                    } else {
                      setShowRecentActivity(true);
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <ActivityHistoryActionIcon />
                  <Text style={styles.quickActionLabel}>Activity</Text>
                </TouchableOpacity>
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
                  onPress={() => Alert.alert('All Orders', 'Displaying 12 customer and B2B orders.')}
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
                  onPress={() => Alert.alert('Stock Allocation Detail', 'Online: 420 KG\nLive Market: 120 KG\nReserve: 80 KG\nBuffer: 60 KG')}
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
                  onPress={() => Alert.alert('Cash History', '12 Cash Top-up transactions logged today.')}
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
                      setShowRecentActivity(true);
                    }
                  }}
                  activeOpacity={0.75}
                  style={{ paddingVertical: 4 }}
                >
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.activityCardContainer}
                onPress={() => {
                  if (onNavigate) {
                    onNavigate('SubWarehouseRecentActivity');
                  } else {
                    setShowRecentActivity(true);
                  }
                }}
                activeOpacity={0.85}
              >
                {/* Activity 1 */}
                <View style={styles.activityItemRow}>
                  <View style={styles.activityIconBox}>
                    <ReceiveGoodsActionIcon />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.activityItemTitle}>Goods Received</Text>
                    <Text style={styles.activityItemSub}>GR-00124 · 150 KG Tomato</Text>
                    <Text style={styles.activityTimeText}>10:42 AM</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Activity 2 */}
                <View style={styles.activityItemRow}>
                  <View style={styles.activityIconBox}>
                    <PackageBagIcon />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.activityItemTitle}>Order Packed</Text>
                    <Text style={styles.activityItemSub}>ORD-10242</Text>
                    <Text style={styles.activityTimeText}>10:20 AM</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Activity 3 */}
                <View style={styles.activityItemRow}>
                  <View style={styles.activityIconBox}>
                    <CashTopUpActionIcon />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.activityItemTitle}>Cash Top-Up</Text>
                    <Text style={styles.activityItemSub}>₹2,000 · Customer CUS-1042</Text>
                    <Text style={styles.activityTimeText}>09:55 AM</Text>
                  </View>
                </View>
              </TouchableOpacity>

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

                      <Text style={styles.produceTitle}>{item.produce} · {item.grade}</Text>

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

            {/* 4. VIEW: Overview (Today's Receiving Overview) */}
            {receivingSubView === 'overview' && (
              <>
                <View style={styles.receivingHeaderBanner}>
                  <View style={styles.receivingHeaderTopRow}>
                    <View style={styles.receivingHeaderTitleRow}>
                      {history.length > 1 && history[history.length - 2]?.tab === 'Home' ? (
                        <TouchableOpacity
                          style={[styles.shipmentsBackBtn, { marginRight: 6 }]}
                          onPress={goBack}
                          activeOpacity={0.7}
                        >
                          <BackArrowWhiteIcon />
                        </TouchableOpacity>
                      ) : (
                        <DeliveryTruckWhiteIcon />
                      )}
                      <Text style={styles.receivingHeaderTitle}>Goods Receiving</Text>
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.receivingSectionTitle, { marginBottom: 0 }]}>Today's Receiving Overview</Text>
                    <TouchableOpacity onPress={() => navigateTo('Receiving', 'incoming_shipments')}>
                      <Text style={{ color: '#E07A2A', fontWeight: 'bold' }}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.receivingGrid}>
                    {/* Expected Today */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'expected' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
                        setShipmentsFilterTab('Receiving');
                        setFilterStatus('Expected');
                        navigateTo('Receiving', 'incoming_shipments');
                      }}
                      activeOpacity={0.8}
                    >
                      <CalendarOutlineIcon />
                      <Text style={styles.receivingOverviewNum}>03</Text>
                      <Text style={styles.receivingOverviewLabel}>Expected Today</Text>
                    </TouchableOpacity>

                    {/* Awaiting Receiving */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'awaiting' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
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

                    {/* Awaiting QC */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'qc' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
                        setSelectedShipment(INITIAL_SHIPMENTS[0]!); // The shipment that is Awaiting QC
                        setReceivingWizardStep('receiving_in_progress');
                      }}
                      activeOpacity={0.8}
                    >
                      <FlaskOutlineIcon />
                      <Text style={[styles.receivingOverviewNum, { color: '#E11D48' }]}>01</Text>
                      <Text style={styles.receivingOverviewLabel}>Awaiting QC</Text>
                    </TouchableOpacity>

                    {/* Partially Accepted */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'partially' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
                        setShipmentsFilterTab('Receiving');
                        setFilterStatus('Partially Accepted');
                        navigateTo('Receiving', 'incoming_shipments');
                      }}
                      activeOpacity={0.8}
                    >
                      <PartiallyAcceptedIcon />
                      <Text style={styles.receivingOverviewNum}>01</Text>
                      <Text style={styles.receivingOverviewLabel}>Partially Accepted</Text>
                    </TouchableOpacity>

                    {/* Completed Today */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'completed' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
                        setShipmentsFilterTab('Completed');
                        setFilterStatus('Completed');
                        navigateTo('Receiving', 'incoming_shipments');
                      }}
                      activeOpacity={0.8}
                    >
                      <CheckmarkInCircleIcon />
                      <Text style={styles.receivingOverviewNum}>05</Text>
                      <Text style={styles.receivingOverviewLabel}>Completed Today</Text>
                    </TouchableOpacity>

                    {/* Issues */}
                    <TouchableOpacity
                      style={[
                        styles.receivingOverviewCard,
                        selectedReceivingCard === 'issues' && styles.receivingOverviewCardActive,
                      ]}
                      onPress={() => {
                        setShipmentsFilterTab('Rejected');
                        setFilterStatus('Rejected');
                        navigateTo('Receiving', 'incoming_shipments');
                      }}
                      activeOpacity={0.8}
                    >
                      <AlertCircleIcon color="#1E1612" />
                      <Text style={[styles.receivingOverviewNum, { color: '#E11D48' }]}>02</Text>
                      <Text style={styles.receivingOverviewLabel}>Issues</Text>
                    </TouchableOpacity>
                  </View>


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
                        setReceivingWizardStep('receiving_in_progress');
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.attentionIconBox, { backgroundColor: '#FEF3C7' }]}>
                        <FlaskOutlineIcon color="#B45309" />
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
                        setSelectedShipment(INITIAL_SHIPMENTS[1]!);
                        setReceivingWizardStep('quantity_verification');
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.attentionIconBox, { backgroundColor: '#FEE2E2' }]}>
                        <AlertCircleIcon color="#DC2626" />
                      </View>
                      <View style={styles.attentionTextBox}>
                        <Text style={styles.attentionCardTitle}>Quantity Mismatch</Text>
                        <Text style={styles.attentionCardSub}>Carrot — GR-1021</Text>
                      </View>
                      <ChevronRightGrayIcon />
                    </TouchableOpacity>

                    {/* Item 3: Damage Report */}
                    <TouchableOpacity
                      style={styles.attentionCard}
                      onPress={() => {
                        setSelectedShipment(INITIAL_SHIPMENTS[4]!);
                        setReceivingWizardStep('rejected_goods');
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.attentionIconBox, { backgroundColor: '#FFE4E6' }]}>
                        <DamageBrokenImageIcon />
                      </View>
                      <View style={styles.attentionTextBox}>
                        <Text style={styles.attentionCardTitle}>Damage Report</Text>
                        <Text style={styles.attentionCardSub}>Spinach — GR-1018</Text>
                      </View>
                      <ChevronRightGrayIcon />
                    </TouchableOpacity>
                  </View>

                  {/* 4. Recent Receiving Section */}
                  <View style={styles.recentReceivingHeaderRow}>
                    <Text style={styles.recentReceivingTitle}>Recent Receiving</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShipmentsFilterTab('All');
                        navigateTo('Receiving', 'incoming_shipments');
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
                        navigateTo('Receiving', 'shipment_detail', INITIAL_SHIPMENTS[0]!);
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
                        navigateTo('Receiving', 'shipment_detail', INITIAL_SHIPMENTS[3]!);
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
            onBack={() => setActiveTab('Home')}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        )}

        {/* ─── Orders Module ─── */}
        {showOrdersModule && (
          <OrdersModule
            onBack={() => setShowOrdersModule(false)}
            onTabChange={(tab) => {
              setShowOrdersModule(false);
              setActiveTab(tab);
            }}
          />
        )}

        {/* ─── More Modules Directory Tab (Modules 5 to 16) ─── */}
        {activeTab === 'More' && !showOrdersModule && (
          <SubWarehouseMoreScreen
            onBack={() => setActiveTab('Home')}
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
              if (onNavigate) onNavigate('SubWarehouseWalletOperations');
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
              else setShowReturnsIssues(true);
            }}
            onNavigateToReturnHistory={() => {
              if (onNavigate) onNavigate('SubWarehouseReturnHistory');
              else setShowReturnHistory(true);
            }}
            onNavigateToCustomers={() => {
              if (onNavigate) onNavigate('SubWarehouseCustomerList');
              else setShowCustomers(true);
            }}
            onNavigateToBilling={() => {
              if (onNavigate) onNavigate('SubWarehouseBillingHub');
              else setShowBillingHub(true);
            }}
            onNavigateToStaff={() => {
              if (onNavigate) onNavigate('SubWarehouseStaff');
              else setShowStaffAndAttendance(true);
            }}
            onNavigateToAttendance={() => {
              if (onNavigate) onNavigate('SubWarehouseTodayAttendance');
              else setShowTodayAttendanceScreen(true);
            }}
            onNavigateToFinance={() => {
              if (onNavigate) onNavigate('SubWarehouseFinance');
              else setShowFinanceScreen(true);
            }}
            onNavigateToWarehouseOperations={() => {
              if (onNavigate) onNavigate('SubWarehouseWarehouseOperations');
              else setShowWarehouseOperations(true);
            }}
            onNavigateToSettings={() => {
              if (onNavigate) onNavigate('SubWarehouseSettings');
              else setShowSettingsScreen(true);
            }}
            onLogout={onSignOut}
          />
        )}
      </View>

      {/* ─── Bottom Navigation Bar (Rendered for Home, Receiving) ─── */}
      {activeTab !== 'More' && activeTab !== 'Inventory' && !showOrdersModule && !(activeTab === 'Receiving' && (receivingSubView === 'search_filters' || receivingSubView === 'shipment_detail')) && (
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
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    marginTop: 3,
  },

  // ─── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
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
    fontSize: 21,
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
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statusCardLeft: {
    flex: 1,
  },
  statusWarehouseTitle: {
    fontSize: 15,
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
    fontSize: 11,
    color: PALETTE.textSecondary,
  },
  receivingValue: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 1,
  },
  syncText: {
    fontSize: 10,
    color: PALETTE.textMuted,
    marginTop: 2,
  },

  // ─── Section Headings ──────────────────────────────────────────────────────
  sectionHeading: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
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
    shadowOpacity: 0.02,
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
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.4,
  },
  overviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 3,
  },
  overviewSub: {
    fontSize: 10.5,
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
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    gap: 6,
  },
  quickActionBtnHighlight: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primarySoft,
  },
  quickActionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
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
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  alertCardSub: {
    fontSize: 11,
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
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  needsAttentionStack: {
    gap: 10,
    marginBottom: 20,
  },
  attentionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  attentionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  attentionTextBox: {
    flex: 1,
  },
  attentionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  attentionCardSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
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
