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
import { StorageFlow } from '../storage-ops';
import { CustomersFlow } from '../customers';
import { StaffFlow } from '../staff-attendance';
import { MainWarehouseAdminScreen } from '../../dashboard/MainWarehouseAdminScreen';
import { WarehouseAdminFlow } from '../warehouse-admin';
import { WarehouseSelector } from '../inventory';
import type { WarehouseScreenBaseProps, WarehouseTab } from '../finance-expenses';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { MoreOptionItem, OptionGroup } from './types';
import {
  AdminAllFarmersScreen,
  AdminFarmerDetailScreen,
  AdminFarmMapScreen,
  AdminRatingScorecardScreen,
  type FarmerListItem,
} from '../../farmers';

// Menu items whose visibility depends on a docs/rbac.json permission. Items not
// listed here are shown to every warehouse admin. The server re-checks each of
// these when the destination screen loads its data.
const ITEM_PERMISSION: Readonly<Record<string, string>> = {
  finance: 'finance.dashboard.view',
  reports: 'report.export.file',
  warehouse_management: 'warehouse.all.view',
};

export const MORE_ITEMS: MoreOptionItem[] = [
  {
    id: 'farm_management',
    title: 'Farmers Management',
    subtitle: 'View and manage registered farmers and farm details',
    iconType: 'farm_management',
  },
  {
    id: 'warehouse_operations',
    title: 'Operations',
    subtitle: 'Manage storage, crates, zones and operations',
    iconType: 'warehouse_operations',
  },
  {
    id: 'orders',
    title: 'Orders',
    subtitle: 'Manage customer orders and fulfillment',
    iconType: 'orders',
  },
  {
    id: 'sales',
    title: 'Purchase & Sales Management',
    subtitle: 'Manage direct and market sales',
    iconType: 'sales',
  },
  {
    id: 'customers',
    title: 'Customers',
    subtitle: 'View customers and purchase activity',
    iconType: 'customers',
  },
  {
    id: 'wallet',
    title: 'Wallet & Cash Top-Up',
    subtitle: 'Manage customer wallet cash top-ups',
    iconType: 'wallet',
  },
  {
    id: 'returns',
    title: 'Returns',
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
    id: 'staff',
    title: 'Warehouse Staff',
    subtitle: 'View warehouse staff and attendance',
    iconType: 'staff',
  },
  {
    id: 'warehouse_management',
    title: 'Warehouse Management',
    subtitle: 'Manage warehouses and administrators',
    iconType: 'warehouse_management',
  },
  {
    id: 'warehouse_profile',
    title: 'Warehouses profile',
    subtitle: 'View warehouse details, storage capacity and operating info',
    iconType: 'profile',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'View alerts, notifications and assigned tasks',
    iconType: 'notifications',
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Manage account, warehouse profile and settings',
    iconType: 'settings',
  },
  {
    id: 'logout',
    title: 'Logout',
    subtitle: 'Sign out of this account',
    iconType: 'logout',
  },
];

export const OPTION_GROUPS: OptionGroup[] = [
  {
    id: 'all_options',
    title: 'MENU',
    items: MORE_ITEMS,
  },
];

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

function FarmManagementIcon({ color = adminColors.muted, size = 20 }: { color?: string; size?: number }) {
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
  onNavigateToWarehouseProfile?: (() => void) | undefined;
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
  onNavigateToWarehouseManagement?: (() => void) | undefined;
  onNavigateToSettings?: (() => void) | undefined;
  onNavigateToHelpSupport?: (() => void) | undefined;
  onNavigateToWarehouseOperations?: (() => void) | undefined;
  onNavigateToStorageLocations?: (() => void) | undefined;
  // Materials, capacity, operational issues and warehouse activity open inside
  // the shared storage-ops hub (StorageFlow), so they need no host callbacks.
  onNavigateToReceiveGoods?: (() => void) | undefined;
  onNavigateToStockVerification?: (() => void) | undefined;
  onNavigateToFarmManagement?: (() => void) | undefined;
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
  onNavigateToWarehouseProfile,
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
  onNavigateToWarehouseManagement,
  onNavigateToSettings,
  onNavigateToHelpSupport,
  onNavigateToWarehouseOperations,
  onNavigateToStorageLocations,
  onNavigateToReceiveGoods,
  onNavigateToStockVerification,
  onNavigateToFarmManagement,
  onLogout,
}: MoreScreenProps) {
  const isMain = scope.warehouseId === undefined;
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  // Derived from scope, never hard-coded: Main spans every warehouse.
  const warehouseLabel = isMain ? 'All Warehouses' : scope.warehouseName ?? '';
  const roleTitle = isMain ? 'Main Warehouse Admin' : 'Sub Warehouse Admin';

  // Filter visible items by RBAC and warehouse role.
  // Warehouse Management is only for main warehouse (warehouse.all.view).
  const visibleItems = MORE_ITEMS.filter((item) => {
    if (item.id === 'warehouse_management' && !isMain) {
      return false;
    }
    if (item.id === 'warehouse_profile' && isMain) {
      return false;
    }
    const code = ITEM_PERMISSION[item.id];
    return code === undefined || can(code);
  });

  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [showWarehouseProfileScreen, setShowWarehouseProfileScreen] = useState(false);
  const [showHelpSupportScreen, setShowHelpSupportScreen] = useState(false);
  const [showWarehouseOperationsScreen, setShowWarehouseOperationsScreen] = useState(false);
  const [showReportsScreen, setShowReportsScreen] = useState(false);
  const [showFinanceScreen, setShowFinanceScreen] = useState(false);
  const [showVouchersScreen, setShowVouchersScreen] = useState(false);
  const [showCustomersScreen, setShowCustomersScreen] = useState(false);
  const [showStaffScreen, setShowStaffScreen] = useState(false);
  const [showWarehouseManagementScreen, setShowWarehouseManagementScreen] = useState(false);
  const [showFarmManagementScreen, setShowFarmManagementScreen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerListItem | null>(null);
  const [farmerSubScreen, setFarmerSubScreen] = useState<'map' | 'scorecard' | null>(null);
  const [farmersMainTab, setFarmersMainTab] = useState<'farmers' | 'applications'>('farmers');

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
      case 'farm_management':
        if (onNavigateToFarmManagement) {
          onNavigateToFarmManagement();
        } else {
          setSelectedFarmer(null);
          setFarmerSubScreen(null);
          setFarmersMainTab('farmers');
          setShowFarmManagementScreen(true);
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
        else setShowStaffScreen(true);
        break;
      case 'warehouse_management':
        if (!isMain) break;
        if (onNavigateToWarehouseManagement) onNavigateToWarehouseManagement();
        else setShowWarehouseManagementScreen(true);
        break;
      case 'attendance':
      case 'today_attendance':
        if (onNavigateToAttendance) onNavigateToAttendance();
        else Alert.alert(item.title, "Opening Today's Attendance...");
        break;
      case 'profile':
      case 'warehouse_profile':
        if (onNavigateToWarehouseProfile) onNavigateToWarehouseProfile();
        else if (onNavigateToProfile) onNavigateToProfile();
        else setShowWarehouseProfileScreen(true);
        break;
      case 'settings':
        if (onNavigateToSettings) {
          onNavigateToSettings();
        } else {
          setShowSettingsScreen(true);
        }
        break;
      case 'logout':
        handleLogoutPress();
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
        return <CustomerOrdersIcon color={adminColors.brand} size={20} />;
      case 'sales':
        return <MarketSalesIcon color={adminColors.brand} size={20} />;
      case 'customers':
        return <CustomersIcon color={adminColors.brand} size={20} />;
      case 'farm_management':
        return <FarmManagementIcon color={adminColors.brand} size={20} />;
      case 'wallet':
        return <WalletIcon color={adminColors.brand} size={20} />;
      case 'billing':
        return <InvoicesIcon color={adminColors.brand} size={20} />;
      case 'returns':
        return <ReturnsIcon color={adminColors.brand} size={20} />;
      case 'finance':
        return <FinanceIcon color={adminColors.brand} size={20} />;
      case 'reports':
        return <ReportsIcon color={adminColors.brand} size={20} />;
      case 'notifications':
        return <NotificationsIcon color={adminColors.brand} size={20} />;
      case 'staff':
        return <StaffIcon color={adminColors.brand} size={20} />;
      case 'attendance':
        return <AttendanceIcon color={adminColors.brand} />;
      case 'profile':
        return <WarehouseProfileIcon color={adminColors.brand} size={20} />;
      case 'settings':
        return <SettingsIcon color={adminColors.brand} size={20} />;
      case 'help':
        return <HelpSupportIcon color={adminColors.brand} size={20} />;
      case 'warehouse_operations':
        return <WarehouseOperationsIcon color={adminColors.brand} />;
      case 'warehouse_management':
        return <WarehouseOutlineIcon color={adminColors.brand} size={20} />;
      case 'logout':
        return <LogoutIcon color={adminColors.danger.text} size={20} />;
      default:
        return <WarehouseOutlineIcon color={adminColors.brand} size={20} />;
    }
  };

  if (showWarehouseProfileScreen) {
    return (
      <ProfileFlow
        scope={scope}
        can={can}
        adminRole={isMain ? 'MAIN_WH_ADMIN' : 'SUB_WH_ADMIN'}
        initialScreen="WarehouseProfile"
        onBack={() => setShowWarehouseProfileScreen(false)}
        onLogout={onLogout}
        onTabChange={onTabChange}
      />
    );
  }

  if (showSettingsScreen) {
    return (
      <ProfileFlow
        scope={scope}
        can={can}
        adminRole={isMain ? 'MAIN_WH_ADMIN' : 'SUB_WH_ADMIN'}
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
    // Shared storage-ops hub (W4 storage-ops part B): materials, capacity,
    // operational issues and warehouse activity open inside StorageFlow; the
    // rest leave through this screen's host callbacks.
    const close = () => setShowWarehouseOperationsScreen(false);
    return (
      <StorageFlow
        scope={scope}
        can={can}
        initialScreen="Operations"
        onBack={close}
        onTabChange={onTabChange}
        onOpenModule={(module) => {
          close();
          if (module === 'receiving') {
            if (onNavigateToReceiveGoods) onNavigateToReceiveGoods();
            else onTabChange?.('Receiving');
          } else if (module === 'verification') {
            if (onNavigateToStockVerification) onNavigateToStockVerification();
            else onTabChange?.('Inventory');
          } else if (module === 'staff') onNavigateToAttendance?.();
          else if (module === 'storage') onNavigateToStorageLocations?.();
        }}
        onViewStock={() => {
          close();
          onTabChange?.('Inventory');
        }}
        onViewProductDetail={() => {
          close();
          onTabChange?.('Inventory');
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

  if (showStaffScreen) {
    return (
      <StaffFlow
        scope={scope}
        can={can}
        initialScreen="Staff"
        onBack={() => setShowStaffScreen(false)}
        onTabChange={handleTabPress}
      />
    );
  }

  if (showFarmManagementScreen) {
    if (farmerSubScreen === 'map' && selectedFarmer) {
      return (
        <AdminFarmMapScreen
          farmer={selectedFarmer}
          onBack={() => setFarmerSubScreen(null)}
        />
      );
    }
    if (farmerSubScreen === 'scorecard' && selectedFarmer) {
      return (
        <AdminRatingScorecardScreen
          farmer={selectedFarmer}
          onBack={() => setFarmerSubScreen(null)}
          onOpenComplianceTiers={() => {}}
        />
      );
    }
    if (selectedFarmer) {
      return (
        <AdminFarmerDetailScreen
          farmer={selectedFarmer}
          onBack={() => setSelectedFarmer(null)}
          onOpenFarmMap={() => setFarmerSubScreen('map')}
          onOpenRatingScorecard={() => setFarmerSubScreen('scorecard')}
        />
      );
    }
    return (
      <AdminAllFarmersScreen
        showBottomNav={false}
        initialTab={farmersMainTab}
        onBack={() => setShowFarmManagementScreen(false)}
        onSelectFarmer={(farmer) => setSelectedFarmer(farmer)}
      />
    );
  }

  if (showWarehouseManagementScreen && isMain) {
    return (
      <MainWarehouseAdminScreen
        onBack={() => setShowWarehouseManagementScreen(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={handleBackToDashboard}
          activeOpacity={0.8}
        >
          <ArrowBackIcon size={20} color={adminColors.onBrand} />
          <Text style={styles.headerTitle}>More</Text>
        </TouchableOpacity>
        {isMain && (
          <View style={{ marginTop: 10 }}>
            <WarehouseSelector
              scope={scope}
              selectedId={selectedWarehouseId}
              onSelect={(id) => setSelectedWarehouseId(id)}
            />
          </View>
        )}
      </View>

      {/* Main Content Scroll */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          {visibleItems.map((item) => {
            const isLogout = item.id === 'logout';
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItemCard}
                onPress={() => handleOptionPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconBox}>
                    {renderOptionIcon(item.iconType)}
                  </View>
                  <Text
                    style={[
                      styles.menuItemLabel,
                      isLogout && { color: adminColors.danger.text },
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>

                <ChevronRightIcon size={16} color={adminColors.muted} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
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
    paddingBottom: 14,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  menuContainer: {
    gap: adminSpacing.sm,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  menuIconBox: {
    width: 28,
    alignItems: 'center',
  },
  menuItemLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
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
  profileSubRoleText: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
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
  singleCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    overflow: 'hidden',
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
