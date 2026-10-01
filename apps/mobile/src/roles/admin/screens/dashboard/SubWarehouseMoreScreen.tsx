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

import { SubWarehouseSettingsScreen } from './SubWarehouseSettingsScreen';
import { SubWarehouseReportsScreen } from './SubWarehouseReportsScreen';
import { SubWarehouseFinanceScreen } from './SubWarehouseFinanceScreen';
import { SubWarehouseVouchersScreen } from './SubWarehouseVouchersScreen';
import { SubWarehouseHelpSupportScreen } from './SubWarehouseHelpSupportScreen';
import { SubWarehouseWarehouseOperationsScreen } from './SubWarehouseWarehouseOperationsScreen';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF0EB',
  peachBg: '#FDF0EB',
  iconColor: '#8B5E3C',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textDark: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9CA3AF',
  border: '#EBE5DC',
  divider: '#F4EFE9',

  activeGreen: '#059669',
  logoutBg: '#FEE2E2',
  logoutText: '#DC2626',
  tabInactive: '#786F66',
  tabBorder: '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface MoreOptionItem {
  id: string;
  title: string;
  subtitle: string;
  iconType:
  | 'orders'
  | 'sales'
  | 'customers'
  | 'wallet'
  | 'billing'
  | 'returns'
  | 'finance'
  | 'reports'
  | 'notifications'
  | 'staff'
  | 'attendance'
  | 'profile'
  | 'settings'
  | 'warehouse_operations'
  | 'help';
  iconBg?: string;
  iconColor?: string;
  badge?: string;
  badgeType?: 'alert' | 'success' | 'neutral' | string;
}

export interface OptionGroup {
  id: string;
  title: string;
  items: MoreOptionItem[];
}

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
        iconBg: '#FFF0EB',
        iconColor: '#F0562A',
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
        badge: '8 Pending',
        badgeType: 'alert',
        iconType: 'orders',
        iconBg: '#FFF0EB',
        iconColor: '#F0562A',
      },
      {
        id: 'sales',
        title: 'Direct / Market Sales',
        subtitle: 'Point-of-sale registers, stall batches & daily totals',
        badge: '₹24,850 Today',
        badgeType: 'success',
        iconType: 'sales',
        iconBg: '#DCFCE7',
        iconColor: '#15803D',
      },
    ],
  },
];

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function CloseIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = '#8B5E3C' }: { size?: number; color?: string }) {
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

function WarehouseOutlineIcon({ color = '#8B5E3C', size = 22 }: { color?: string; size?: number }) {
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

function CustomerOrdersIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
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

function MarketSalesIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
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

function CustomersIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
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

function WalletIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
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

function InvoicesIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
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

function ReturnsIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
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

function FinanceIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
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

function ReportsIcon({ color = '#F0562A', size = 20 }: { color?: string; size?: number }) {
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

function NotificationsIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
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

function StaffIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="15" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="11" r="2.5" stroke={color} strokeWidth="2" />
      <Path d="M8 17a4 4 0 0 1 8 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 2h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AttendanceIcon({ color = '#10B981' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 16l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseProfileIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
  return <WarehouseOutlineIcon color={color} size={size} />;
}

function SettingsIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
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

function HelpSupportIcon({ color = '#8B5E3C', size = 20 }: { color?: string; size?: number }) {
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

function OrdersIcon({ color = '#F0562A', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 17l5-5-5-5M21 12H9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LogoutIcon({ color = '#DC2626', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseOperationsIcon({ color = '#4F46E5' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
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
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
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
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

export interface SubWarehouseMoreScreenProps {
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  onNavigateToProfile?: (() => void) | undefined;
  onSelectModule?: ((moduleId: string) => void) | undefined;

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
  onLogout?: (() => void) | undefined;
}

export function SubWarehouseMoreScreen({
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToProfile,
  onSelectModule,
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
  onLogout,
}: SubWarehouseMoreScreenProps) {
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [showHelpSupportScreen, setShowHelpSupportScreen] = useState(false);
  const [showWarehouseOperationsScreen, setShowWarehouseOperationsScreen] = useState(false);
  const [showReportsScreen, setShowReportsScreen] = useState(false);
  const [showFinanceScreen, setShowFinanceScreen] = useState(false);
  const [showVouchersScreen, setShowVouchersScreen] = useState(false);

  const handleTabPress = (tab: SubWHTab) => {
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
        if (onNavigateToCustomers) onNavigateToCustomers();
        else Alert.alert(item.title, 'Opening Customers Directory...');
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
        return <CustomerOrdersIcon color={PALETTE.iconColor} size={20} />;
      case 'sales':
        return <MarketSalesIcon color={PALETTE.iconColor} size={20} />;
      case 'customers':
        return <CustomersIcon color={PALETTE.iconColor} size={20} />;
      case 'wallet':
        return <WalletIcon color={PALETTE.iconColor} size={20} />;
      case 'billing':
        return <InvoicesIcon color={PALETTE.iconColor} size={20} />;
      case 'returns':
        return <ReturnsIcon color={PALETTE.iconColor} size={20} />;
      case 'finance':
        return <FinanceIcon color={PALETTE.iconColor} size={20} />;
      case 'reports':
        return <ReportsIcon color={PALETTE.iconColor} size={20} />;
      case 'notifications':
        return <NotificationsIcon color={PALETTE.iconColor} size={20} />;
      case 'staff':
        return <StaffIcon color={PALETTE.iconColor} size={20} />;
      case 'attendance':
        return <AttendanceIcon color={PALETTE.iconColor} />;
      case 'profile':
        return <WarehouseProfileIcon color={PALETTE.iconColor} size={20} />;
      case 'settings':
        return <SettingsIcon color={PALETTE.iconColor} size={20} />;
      case 'help':
        return <HelpSupportIcon color={PALETTE.iconColor} size={20} />;
      case 'warehouse_operations':
        return <WarehouseOperationsIcon color={PALETTE.iconColor} />;
      default:
        return <WarehouseOutlineIcon color={PALETTE.iconColor} size={20} />;
    }
  };

  if (showSettingsScreen) {
    return (
      <SubWarehouseSettingsScreen
        onBack={() => setShowSettingsScreen(false)}
        onLogout={onLogout}
      />
    );
  }

  if (showReportsScreen) {
    return (
      <SubWarehouseReportsScreen
        onBack={() => setShowReportsScreen(false)}
        onTabChange={onTabChange}
        onNavigateToNotifications={onNavigateToNotifications}
      />
    );
  }

  if (showVouchersScreen) {
    return (
      <SubWarehouseVouchersScreen
        warehouseName="Coonoor Warehouse"
        onBack={() => setShowVouchersScreen(false)}
        onTabChange={onTabChange}
      />
    );
  }

  if (showFinanceScreen) {
    return (
      <SubWarehouseFinanceScreen
        onBack={() => setShowFinanceScreen(false)}
        onTabChange={onTabChange}
        onNavigateToNotifications={onNavigateToNotifications}
      />
    );
  }

  if (showHelpSupportScreen) {
    return (
      <SubWarehouseHelpSupportScreen
        warehouseName="Coonoor Warehouse"
        onBack={() => setShowHelpSupportScreen(false)}
        onTabChange={onTabChange}
      />
    );
  }

  if (showWarehouseOperationsScreen) {
    return (
      <SubWarehouseWarehouseOperationsScreen
        onBack={() => setShowWarehouseOperationsScreen(false)}
        onTabChange={onTabChange}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>More</Text>
            <Text style={styles.headerSubtitle}>Coonoor Warehouse</Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              if (onBack) onBack();
            }}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <CloseIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Main Content Scroll ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Profile / Sub Warehouse Admin Card ─── */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.profileIconWrap}>
              <WarehouseOutlineIcon color={PALETTE.iconColor} size={22} />
            </View>
            <View style={styles.profileInfoCol}>
              <Text style={styles.profileRoleTitle}>Sub Warehouse Admin</Text>
              <Text style={styles.profileLocationText}>Coonoor Warehouse</Text>
            </View>
          </View>

          <View style={styles.profileDivider} />

          <View style={styles.profileBottomRow}>
            <Text style={styles.warehouseCodeText}>WH-CNR</Text>
            <View style={styles.activeStatusRow}>
              <View style={styles.activeDot} />
              <Text style={styles.activeStatusText}>Active</Text>
            </View>
          </View>
        </View>

        {/* ─── Grouped Section Cards ─── */}
        {OPTION_GROUPS.map((group) => {
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
                          <ChevronRightIcon size={16} color={PALETTE.iconColor} />
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

        {/* ─── Logout Standalone Card ─── */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={handleLogoutPress}
          activeOpacity={0.75}
        >
          <View style={styles.logoutIconWrap}>
            <LogoutIcon color={PALETTE.logoutText} size={20} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.logoutTitle}>Logout</Text>
            <Text style={styles.itemSubtitle}>Sign out of this account</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
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
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // ─── Profile Card ───
  profileCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: PALETTE.peachBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileInfoCol: {
    flex: 1,
  },
  profileRoleTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  profileLocationText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  profileDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },
  profileBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warehouseCodeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#5C544E',
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
    backgroundColor: PALETTE.activeGreen,
  },
  activeStatusText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.activeGreen,
  },

  // ─── Group Container ───
  groupContainer: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5C544E',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 2,
  },
  groupCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    borderRadius: 12,
    backgroundColor: PALETTE.peachBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textDark,
  },
  itemSubtitle: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    fontWeight: '400',
    marginTop: 2,
  },
  chevronWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginHorizontal: 14,
  },

  // ─── Logout Card ───
  logoutCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: PALETTE.logoutBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  logoutTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.logoutText,
  },

  // ─── Bottom Navigation ───
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
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
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
