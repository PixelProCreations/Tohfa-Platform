/**
 * MoreScreen: ONE shared "More" menu for Main Warehouse admins (scope = all
 * warehouses, `scope.warehouseId === undefined`) and Sub Warehouse admins.
 *
 * The role difference is data, not a second file: the profile card and header
 * are derived from `scope`, and the menu is built from `can()` against
 * docs/rbac.json codes. `can` only decides what is worth rendering; the server
 * re-checks every permission (CLAUDE.md 2.1).
 */

import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { ReportsScreen } from '../reports';
import { FinanceFlow } from '../finance-expenses/FinanceFlow';
import { ProfileFlow } from '../profile-settings';
import { SubWarehouseWarehouseOperationsScreen } from '../../../../subwarehouse/screens/SubWarehouseWarehouseOperationsScreen';
import { CustomersFlow } from '../customers';
import type { WarehouseScreenBaseProps, WarehouseTab } from '../finance-expenses';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { MoreOptionItem, OptionGroup } from './types';

// Menu items whose visibility depends on a docs/rbac.json permission. Items not
// listed here are shown to every warehouse admin. The server re-checks each of
// these when the destination screen loads its data.
// `staff` opens the driver / warehouse-staff roster, not the admin-account list,
// so it is gated by warehouse.staff.list_view (Main and Sub both hold it, owner
// decision 2026-10-09) rather than admin.staff.list_view.
const ITEM_PERMISSION: Readonly<Record<string, string>> = {
  staff: 'warehouse.staff.list_view',
  finance: 'finance.dashboard.view',
  reports: 'report.export.file',
};

const OPTION_GROUPS: OptionGroup[] = [
  {
    id: 'operations',
    title: 'OPERATIONS',
    items: [
      {
        id: 'orders',
        title: 'Customer Orders',
        subtitle: 'Manage customer orders and fulfillment',
        iconType: 'orders',
      },
      {
        id: 'sales',
        title: 'Direct / Market Sales',
        subtitle: 'Manage direct and market sales',
        iconType: 'sales',
      },
      {
        id: 'customers',
        title: 'Customers',
        subtitle: 'View customers and purchase activity',
        iconType: 'customers',
      },
    ],
  },
  {
    id: 'finance_transactions',
    title: 'FINANCE & TRANSACTIONS',
    items: [
      {
        id: 'wallet',
        title: 'Wallet & Cash Top-Up',
        subtitle: 'Manage customer wallet cash top-ups',
        iconType: 'wallet',
      },
      {
        id: 'billing',
        title: 'Billing & Invoices',
        subtitle: 'View and manage invoices',
        iconType: 'billing',
      },
      {
        id: 'returns',
        title: 'Returns & Issues',
        subtitle: 'Manage returns and warehouse issues',
        iconType: 'returns',
      },
      {
        id: 'finance',
        title: 'Warehouse Finance',
        subtitle: 'View warehouse financial activity',
        iconType: 'finance',
      },
      {
        id: 'reports',
        title: 'Reports',
        subtitle: 'View warehouse reports and analytics',
        iconType: 'reports',
      },
      {
        id: 'notifications',
        title: 'Notifications & Tasks',
        subtitle: 'View alerts, notifications and assigned tasks',
        iconType: 'notifications',
      },
      {
        id: 'staff',
        title: 'Warehouse Staff',
        subtitle: 'View warehouse staff and attendance',
        iconType: 'staff',
      },
      {
        id: 'warehouse_operations',
        title: 'Warehouse Operations',
        subtitle: 'Manage storage, crates, zones and operations',
        iconType: 'warehouse_operations',
      },
      {
        id: 'profile',
        title: 'Warehouse Profile',
        subtitle: 'View assigned warehouse information',
        iconType: 'profile',
      },
    ],
  },
  {
    id: 'account_settings',
    title: 'ACCOUNT & SETTINGS',
    items: [
      {
        id: 'settings',
        title: 'Settings',
        subtitle: 'Manage account and application settings',
        iconType: 'settings',
      },
      {
        id: 'orders',
        title: 'Customer Orders',
        subtitle: 'Fulfillment queue, packing slips & dispatch statuses',
        iconType: 'orders',
      },
      {
        id: 'sales',
        title: 'Direct / Market Sales',
        subtitle: 'Point-of-sale registers, stall batches & daily totals',
        iconType: 'sales',
      },
    ],
  },
];

// â”€â”€â”€ SVG Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function ChevronRightIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarehouseOutlineIcon({ color = adminColors.muted, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 17h4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CustomerOrdersIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="9" y="3" width="6" height="4" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M9 12h6M9 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MarketSalesIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h16M7 4h10v4H7zM3 12h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8" cy="16" r="1" fill={color} />
      <Circle cx="12" cy="16" r="1" fill={color} />
      <Circle cx="16" cy="16" r="1" fill={color} />
    </Svg>
  );
}

function CustomersIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8" cy="16" r="1" fill={color} />
      <Circle cx="12" cy="16" r="1" fill={color} />
      <Circle cx="16" cy="16" r="1" fill={color} />
    </Svg>
  );
}

function WalletIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InvoicesIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReturnsIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Path
        d="M14 12H9m0 0l2.5-2.5M9 12l2.5 2.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FinanceIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 3L2 10h20L12 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReportsIcon({ color = adminColors.brand, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path
        d="M8 17v-4M12 17V8M16 17v-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NotificationsIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
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

function StaffIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="15" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="11" r="2.5" stroke={color} strokeWidth="2" />
      <Path d="M8 17a4 4 0 0 1 8 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 2h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AttendanceIcon({ color = adminColors.success.text }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 16l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseProfileIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
  return <WarehouseOutlineIcon color={color} size={size} />;
}

function SettingsIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HelpSupportIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="17" r="0.75" fill={color} />
    </Svg>
  );
}

function LogoutIcon({ color = adminColors.danger.text, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseOperationsIcon({ color = adminColors.muted }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path
        d="M12 8v8M8 12l4 4 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
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

export interface MoreScreenProps extends WarehouseScreenBaseProps {
  /** Overrides the default `onBack` fallback chain for the header arrow. */
  onNavigateToDashboard?: (() => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  onNavigateToProfile?: (() => void) | undefined;
  onSelectModule?: ((moduleId: string) => void) | undefined;
  /** When set, the profile card is tappable (Main Warehouse opens its admin hub from here). */
  onProfileCardPress?: (() => void) | undefined;

  // Specific module handlers
  onNavigateToOrders?: (() => void) | undefined;
  onNavigateToSales?: (() => void) | undefined;
  onNavigateToCustomers?: (() => void) | undefined;
  onNavigateToWallet?: (() => void) | undefined;
  onNavigateToBilling?: (() => void) | undefined;
  onNavigateToReturns?: (() => void) | undefined;
  onNavigateToReturnHistory?: (() => void) | undefined;
  onNavigateToFinance?: (() => void) | undefined;
  onNavigateToReports?: (() => void) | undefined;
  onNavigateToStaff?: (() => void) | undefined;
  onNavigateToAttendance?: (() => void) | undefined;
  onNavigateToSettings?: (() => void) | undefined;
  onNavigateToHelpSupport?: (() => void) | undefined;
  onNavigateToWarehouseOperations?: (() => void) | undefined;
  onNavigateToStorageLocations?: (() => void) | undefined;
  onNavigateToCapacity?: (() => void) | undefined;
  onNavigateToMaterialHandling?: (() => void) | undefined;
  onNavigateToOperationalIssues?: (() => void) | undefined;
  onNavigateToWarehouseActivity?: (() => void) | undefined;
  onNavigateToTodayOperations?: (() => void) | undefined;
  onNavigateToReceiveGoods?: (() => void) | undefined;
  onNavigateToStockVerification?: (() => void) | undefined;
  onLogout?: (() => void) | undefined;
}

export function MoreScreen({
  scope,
  can,
  onBack,
  onNavigateToDashboard,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToProfile,
  onSelectModule,
  onProfileCardPress,
  onNavigateToOrders,
  onNavigateToSales,
  onNavigateToCustomers,
  onNavigateToWallet,
  onNavigateToBilling,
  onNavigateToReturns,
  onNavigateToReturnHistory,
  onNavigateToFinance,
  onNavigateToReports,
  onNavigateToStaff,
  onNavigateToAttendance,
  onNavigateToSettings,
  onNavigateToHelpSupport,
  onNavigateToWarehouseOperations,
  onNavigateToStorageLocations,
  onNavigateToCapacity,
  onNavigateToMaterialHandling,
  onNavigateToOperationalIssues,
  onNavigateToWarehouseActivity,
  onNavigateToTodayOperations,
  onNavigateToReceiveGoods,
  onNavigateToStockVerification,
  onLogout,
}: MoreScreenProps) {
  const isMain = scope.warehouseId === undefined;
  // Derived from scope, never hard-coded: Main spans every warehouse.
  const warehouseLabel = isMain ? 'All Warehouses' : scope.warehouseName ?? '';
  const roleTitle = isMain ? 'Main Warehouse Admin' : 'Sub Warehouse Admin';

  // Hide gated rows and any group left empty. Display only: the server enforces.
  const visibleGroups: OptionGroup[] = OPTION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const code = ITEM_PERMISSION[item.id];
      return code === undefined || can(code);
    }),
  })).filter((group) => group.items.length > 0);

  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [showHelpSupportScreen, setShowHelpSupportScreen] = useState(false);
  const [showWarehouseOperationsScreen, setShowWarehouseOperationsScreen] = useState(false);
  const [showReportsScreen, setShowReportsScreen] = useState(false);
  const [showFinanceScreen, setShowFinanceScreen] = useState(false);
  const [showVouchersScreen, setShowVouchersScreen] = useState(false);
  const [showCustomersScreen, setShowCustomersScreen] = useState(false);

  const handleBackToDashboard = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    } else if (onTabChange) {
      onTabChange('Home');
    } else if (onBack) {
      onBack();
    }
  };

  const handleTabPress = (tab: WarehouseTab) => {
    if (tab === 'More') return;
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  const handleOptionPress = (item: MoreOptionItem) => {
    if (onSelectModule) {
      onSelectModule(item.id);
    }

    switch (item.id) {
      case 'orders':
        if (onNavigateToOrders) onNavigateToOrders();
        else Alert.alert(item.title, 'Opening Customer Orders & Fulfillment...');
        break;
      case 'sales':
        if (onNavigateToSales) onNavigateToSales();
        else Alert.alert(item.title, 'Opening Direct / Market Sales...');
        break;
      case 'customers':
        if (onNavigateToCustomers) {
          onNavigateToCustomers();
        } else {
          setShowCustomersScreen(true);
        }
        break;
      case 'wallet':
        if (onNavigateToWallet) onNavigateToWallet();
        else Alert.alert(item.title, 'Opening Wallet & Cash Top-Up...');
        break;
      case 'billing':
        if (onNavigateToBilling) {
          onNavigateToBilling();
        } else {
          setShowVouchersScreen(true);
        }
        break;
      case 'returns':
        if (onNavigateToReturns) onNavigateToReturns();
        else Alert.alert(item.title, 'Opening Returns & Issues...');
        break;
      case 'return_history':
        if (onNavigateToReturnHistory) onNavigateToReturnHistory();
        else Alert.alert(item.title, 'Opening Return History...');
        break;
      case 'finance':
        if (onNavigateToFinance) {
          onNavigateToFinance();
        } else {
          setShowFinanceScreen(true);
        }
        break;
      case 'reports':
        if (onNavigateToReports) {
          onNavigateToReports();
        } else {
          setShowReportsScreen(true);
        }
        break;
      case 'notifications':
        if (onNavigateToNotifications) onNavigateToNotifications();
        else Alert.alert(item.title, 'Opening Notifications & Tasks...');
        break;
      case 'staff':
        if (onNavigateToStaff) onNavigateToStaff();
        else Alert.alert(item.title, 'Opening Warehouse Staff...');
        break;
      case 'attendance':
      case 'today_attendance':
        if (onNavigateToAttendance) onNavigateToAttendance();
        else Alert.alert(item.title, "Opening Today's Attendance...");
        break;
      case 'profile':
        if (onNavigateToProfile) onNavigateToProfile();
        else Alert.alert(item.title, 'Opening Warehouse Profile...');
        break;
      case 'settings':
        if (onNavigateToSettings) {
          onNavigateToSettings();
        } else {
          setShowSettingsScreen(true);
        }
        break;
      case 'help':
        if (onNavigateToHelpSupport) {
          onNavigateToHelpSupport();
        } else {
          setShowHelpSupportScreen(true);
        }
        break;
      case 'warehouse_operations':
        if (onNavigateToWarehouseOperations) {
          onNavigateToWarehouseOperations();
        } else {
          setShowWarehouseOperationsScreen(true);
        }
        break;
      default:
        Alert.alert(item.title, `Opening ${item.title}...`);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out of this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            if (onLogout) onLogout();
            else if (onBack) onBack();
          },
        },
      ]
    );
  };

  const renderOptionIcon = (type: MoreOptionItem['iconType']) => {
    switch (type) {
      case 'orders':
        return <CustomerOrdersIcon color={adminColors.muted} size={20} />;
      case 'sales':
        return <MarketSalesIcon color={adminColors.muted} size={20} />;
      case 'customers':
        return <CustomersIcon color={adminColors.muted} size={20} />;
      case 'wallet':
        return <WalletIcon color={adminColors.muted} size={20} />;
      case 'billing':
        return <InvoicesIcon color={adminColors.muted} size={20} />;
      case 'returns':
        return <ReturnsIcon color={adminColors.muted} size={20} />;
      case 'finance':
        return <FinanceIcon color={adminColors.muted} size={20} />;
      case 'reports':
        return <ReportsIcon color={adminColors.muted} size={20} />;
      case 'notifications':
        return <NotificationsIcon color={adminColors.muted} size={20} />;
      case 'staff':
        return <StaffIcon color={adminColors.muted} size={20} />;
      case 'attendance':
        return <AttendanceIcon color={adminColors.muted} />;
      case 'profile':
        return <WarehouseProfileIcon color={adminColors.muted} size={20} />;
      case 'settings':
        return <SettingsIcon color={adminColors.muted} size={20} />;
      case 'help':
        return <HelpSupportIcon color={adminColors.muted} size={20} />;
      case 'warehouse_operations':
        return <WarehouseOperationsIcon color={adminColors.muted} />;
      default:
        return <WarehouseOutlineIcon color={adminColors.muted} size={20} />;
    }
  };

  if (showSettingsScreen) {
    return (
      <ProfileFlow
        scope={scope}
        can={can}
        initialScreen="Settings"
        onBack={() => setShowSettingsScreen(false)}
        onLogout={onLogout}
        onTabChange={onTabChange}
      />
    );
  }

  if (showReportsScreen) {
    return (
      <ReportsScreen
        scope={scope}
        can={can}
        // MAIN holds report.export.file as `view` only (SPEC_GAPS.md #11, W2a-1).
        canExport={isMain ? false : can('report.export.file')}
        onBack={() => setShowReportsScreen(false)}
        onTabChange={onTabChange}
        onNavigateToNotifications={onNavigateToNotifications}
      />
    );
  }

  if (showVouchersScreen || showFinanceScreen) {
    // Shared finance flow (W4): the Warehouse Finance row opens the hub, the
    // billing row's fallback opens the voucher list.
    return (
      <FinanceFlow
        scope={scope}
        can={can}
        initialScreen={showVouchersScreen ? 'Vouchers' : 'FinanceHub'}
        onBack={() => {
          setShowVouchersScreen(false);
          setShowFinanceScreen(false);
        }}
        onTabChange={onTabChange}
        onNavigateToNotifications={onNavigateToNotifications}
        onOpenWallet={onNavigateToWallet}
      />
    );
  }

  if (showHelpSupportScreen) {
    return (
      <ProfileFlow
        scope={scope}
        can={can}
        initialScreen="HelpSupport"
        onBack={() => setShowHelpSupportScreen(false)}
        onLogout={onLogout}
        onTabChange={onTabChange}
      />
    );
  }

  if (showWarehouseOperationsScreen) {
    return (
      <SubWarehouseWarehouseOperationsScreen
        onBack={() => setShowWarehouseOperationsScreen(false)}
        onTabChange={onTabChange}
        onNavigateToReceiveGoods={() => {
          setShowWarehouseOperationsScreen(false);
          if (onNavigateToReceiveGoods) onNavigateToReceiveGoods();
          else onTabChange?.('Receiving');
        }}
        onNavigateToStockVerification={() => {
          setShowWarehouseOperationsScreen(false);
          if (onNavigateToStockVerification) onNavigateToStockVerification();
          else onTabChange?.('Inventory');
        }}
        onNavigateToStaffAttendance={() => {
          setShowWarehouseOperationsScreen(false);
          if (onNavigateToAttendance) onNavigateToAttendance();
        }}
        onNavigateToStorageLocations={() => {
          setShowWarehouseOperationsScreen(false);
          onNavigateToStorageLocations?.();
        }}
        onNavigateToCapacity={() => {
          setShowWarehouseOperationsScreen(false);
          onNavigateToCapacity?.();
        }}
        onNavigateToMaterialHandling={() => {
          setShowWarehouseOperationsScreen(false);
          onNavigateToMaterialHandling?.();
        }}
        onNavigateToOperationalIssues={() => {
          setShowWarehouseOperationsScreen(false);
          onNavigateToOperationalIssues?.();
        }}
        onNavigateToWarehouseActivity={() => {
          setShowWarehouseOperationsScreen(false);
          onNavigateToWarehouseActivity?.();
        }}
        onNavigateToTodayOperations={() => {
          setShowWarehouseOperationsScreen(false);
          onNavigateToTodayOperations?.();
        }}
      />
    );
  }

  if (showCustomersScreen) {
    return (
      <CustomersFlow
        scope={scope}
        can={can}
        onBack={() => setShowCustomersScreen(false)}
        onTabChange={handleTabPress}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* â”€â”€â”€ Top Brand Header Banner â”€â”€â”€ */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToDashboard}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>More</Text>
            <Text style={styles.headerSubtitle}>{warehouseLabel}</Text>
          </View>
        </View>
      </View>

      {/* â”€â”€â”€ Main Content Scroll â”€â”€â”€ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* â”€â”€â”€ Profile Card â”€â”€â”€ */}
        {(() => {
          const profileContent = (
            <>
              <View style={styles.profileTopRow}>
                <View style={styles.profileIconWrap}>
                  <WarehouseOutlineIcon color={adminColors.muted} size={22} />
                </View>
                <View style={styles.profileInfoCol}>
                  <Text style={styles.profileRoleTitle}>{roleTitle}</Text>
                  <Text style={styles.profileLocationText}>{warehouseLabel}</Text>
                </View>
              </View>

              <View style={styles.profileDivider} />

              <View style={styles.profileBottomRow}>
                {!isMain && <Text style={styles.warehouseCodeText}>{scope.warehouseId}</Text>}
                <View style={styles.activeStatusRow}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeStatusText}>Active</Text>
                </View>
              </View>
            </>
          );
          return onProfileCardPress ? (
            <TouchableOpacity style={styles.profileCard} onPress={onProfileCardPress} activeOpacity={0.75}>
              {profileContent}
            </TouchableOpacity>
          ) : (
            <View style={styles.profileCard}>{profileContent}</View>
          );
        })()}

        {/* â”€â”€â”€ Grouped Section Cards â”€â”€â”€ */}
        {visibleGroups.map((group) => {
          return (
            <View key={group.id} style={styles.groupContainer}>
              <Text style={styles.groupTitle}>{group.title}</Text>

              <View style={styles.groupCard}>
                {group.items.map((item, index) => {
                  const isLast = index === group.items.length - 1;
                  return (
                    <React.Fragment key={item.id}>
                      <TouchableOpacity
                        style={styles.itemRow}
                        onPress={() => handleOptionPress(item)}
                        activeOpacity={0.7}
                      >
                        {/* Soft Peach Icon Box */}
                        <View style={styles.iconWrap}>
                          {renderOptionIcon(item.iconType)}
                        </View>

                        {/* Title & Subtitle */}
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemSubtitle} numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        </View>

                        {/* Right Chevron */}
                        <View style={styles.chevronWrap}>
                          <ChevronRightIcon size={16} color={adminColors.muted} />
                        </View>
                      </TouchableOpacity>

                      {!isLast && <View style={styles.rowDivider} />}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* â”€â”€â”€ Logout Standalone Card â”€â”€â”€ */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={handleLogoutPress}
          activeOpacity={0.75}
        >
          <View style={styles.logoutIconWrap}>
            <LogoutIcon color={adminColors.danger.text} size={20} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.logoutTitle}>Logout</Text>
            <Text style={styles.itemSubtitle}>Sign out of this account</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>

      {/* â”€â”€â”€ Bottom Navigation Bar â”€â”€â”€ */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Home')}
          activeOpacity={0.75}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Receiving')}
          activeOpacity={0.75}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.navLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Inventory')}
          activeOpacity={0.75}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.navLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={1}
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    // Replaces white at 22% on the orange header: no overlay token exists, so a darker solid disc.
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.body,
    color: adminColors.onBrand,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: 20,
  },

  // â”€â”€â”€ Profile Card â”€â”€â”€
  profileCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileInfoCol: {
    flex: 1,
  },
  profileRoleTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  profileLocationText: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
  },
  profileDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  profileBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warehouseCodeText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  activeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: adminColors.success.text,
  },
  activeStatusText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },

  // â”€â”€â”€ Group Container â”€â”€â”€
  groupContainer: {
    marginBottom: adminSpacing.lg,
  },
  groupTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    textTransform: 'uppercase',
    marginBottom: adminSpacing.sm,
    marginLeft: 2,
  },
  groupCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  itemInfo: {
    flex: 1,
    paddingRight: adminSpacing.sm,
  },
  itemTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  itemSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  chevronWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginHorizontal: 14,
  },

  // â”€â”€â”€ Logout Card â”€â”€â”€
  logoutCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    ...adminShadow.sm,
  },
  logoutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  logoutTitle: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },

  // â”€â”€â”€ Bottom Navigation â”€â”€â”€
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    paddingBottom: 14,
    paddingHorizontal: adminSpacing.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 60,
  },
  navLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 3,
  },
  navLabelActive: {
    color: adminColors.brand,
  },
});
