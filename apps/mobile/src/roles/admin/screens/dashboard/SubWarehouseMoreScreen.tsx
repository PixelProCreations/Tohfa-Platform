import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { SubWarehouseSettingsScreen } from './SubWarehouseSettingsScreen';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  amberText:     '#B45309',
  redText:       '#DC2626',
  greenText:     '#15803D',
  blueText:      '#1D4ED8',
  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface MoreOptionItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeType?: 'default' | 'alert' | 'success' | 'info' | 'purple' | 'teal';
  iconType:
    | 'customers'
    | 'wallet'
    | 'billing'
    | 'returns'
    | 'finance'
    | 'reports'
    | 'notifications'
    | 'staff'
    | 'profile'
    | 'settings'
    | 'orders'
    | 'sales';
  iconBg: string;
  iconColor: string;
}

export interface OptionGroup {
  id: string;
  title: string;
  items: MoreOptionItem[];
}

const OPTION_GROUPS: OptionGroup[] = [
  {
    id: 'customer_ops',
    title: 'Customer & Counter Operations',
    items: [
      {
        id: 'customers',
        title: 'Customers',
        subtitle: 'Farmers, walk-in buyers, HORECA & B2B accounts',
        badge: '48 Active',
        badgeType: 'info',
        iconType: 'customers',
        iconBg: '#EEF2FF',
        iconColor: '#4F46E5',
      },
      {
        id: 'wallet',
        title: 'Wallet & Cash Top-Up',
        subtitle: 'Farmer cash deposits, balance lookups & QR top-ups',
        badge: '₹18,500 Today',
        badgeType: 'success',
        iconType: 'wallet',
        iconBg: '#ECFDF5',
        iconColor: '#059669',
      },
      {
        id: 'billing',
        title: 'Billing & Invoices',
        subtitle: 'Tax invoices, sales receipts & credit notes',
        badge: '12 Issued',
        badgeType: 'default',
        iconType: 'billing',
        iconBg: '#EFF6FF',
        iconColor: '#2563EB',
      },
      {
        id: 'returns',
        title: 'Returns & Issues',
        subtitle: 'Quality rejections, damage logs & refunds',
        badge: '2 Pending',
        badgeType: 'alert',
        iconType: 'returns',
        iconBg: '#FFF1F2',
        iconColor: '#E11D48',
      },
    ],
  },
  {
    id: 'finance_intel',
    title: 'Finance & Analytics',
    items: [
      {
        id: 'finance',
        title: 'Warehouse Finance',
        subtitle: 'Daily register closure, collections & petty cash',
        badge: 'Verified',
        badgeType: 'success',
        iconType: 'finance',
        iconBg: '#FFF0EB',
        iconColor: '#F0562A',
      },
      {
        id: 'reports',
        title: 'Reports',
        subtitle: 'Daily throughput summaries, stock audits & sales analysis',
        badge: 'Daily & MTD',
        badgeType: 'purple',
        iconType: 'reports',
        iconBg: '#FAF5FF',
        iconColor: '#9333EA',
      },
    ],
  },
  {
    id: 'team_ops',
    title: 'Operations & Team',
    items: [
      {
        id: 'notifications',
        title: 'Notifications & Tasks',
        subtitle: 'Warehouse alerts, dispatch reminders & team checklists',
        badge: '3 Unread',
        badgeType: 'alert',
        iconType: 'notifications',
        iconBg: '#FFF7ED',
        iconColor: '#EA580C',
      },
      {
        id: 'staff',
        title: 'Warehouse Staff',
        subtitle: 'Shift schedules, staff attendance & operator roles',
        badge: '6 on Duty',
        badgeType: 'teal',
        iconType: 'staff',
        iconBg: '#F0FDFA',
        iconColor: '#0D9488',
      },
    ],
  },
  {
    id: 'system_prefs',
    title: 'Facility & Account',
    items: [
      {
        id: 'profile',
        title: 'Warehouse Profile',
        subtitle: 'Coonoor facility details, operating hours & docs',
        badge: 'SW-04 Active',
        badgeType: 'success',
        iconType: 'profile',
        iconBg: '#F1F5F9',
        iconColor: '#475569',
      },
      {
        id: 'settings',
        title: 'Settings',
        subtitle: 'Account profile, security, notifications & preferences',
        badge: 'Config',
        badgeType: 'default',
        iconType: 'settings',
        iconBg: '#F4F4F5',
        iconColor: '#52525B',
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

function GridMenuHeaderIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="2.2" />
      <Rect x="3" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="2.2" />
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

function BellHeaderIcon() {
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

function SearchIcon({ size = 16, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#C2BBB2' }: { size?: number; color?: string }) {
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

function CustomersIcon({ color = '#4F46E5' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WalletIcon({ color = '#059669' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 3H4a2 2 0 0 0-2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="16" cy="14" r="1.5" fill={color} />
    </Svg>
  );
}

function BillingInvoiceIcon({ color = '#2563EB' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReturnsIssuesIcon({ color = '#E11D48' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 3v5h-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 16H3v5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FinanceIcon({ color = '#F0562A' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReportsIcon({ color = '#9333EA' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 20V10M12 20V4M6 20v-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 20h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NotificationsTasksIcon({ color = '#EA580C' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M9 11l3 3L22 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StaffIcon({ color = '#0D9488' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M22 11l-3 3-2-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseProfileIcon({ color = '#475569' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SettingsModuleIcon({ color = '#52525B' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

function OrdersIcon({ color = '#F0562A' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6M9 12h6M9 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SalesIcon({ color = '#15803D' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M7 3h10v4H7zM3 11h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9zM7 15h2M11 15h2M15 15h2M7 18h10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  onNavigateToFinance?: (() => void) | undefined;
  onNavigateToReports?: (() => void) | undefined;
  onNavigateToStaff?: (() => void) | undefined;
  onNavigateToSettings?: (() => void) | undefined;
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
  onNavigateToFinance,
  onNavigateToReports,
  onNavigateToStaff,
  onNavigateToSettings,
  onLogout,
}: SubWarehouseMoreScreenProps) {
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      case 'customers':
        if (onNavigateToCustomers) onNavigateToCustomers();
        else Alert.alert(item.title, 'Opening Customer List...');
        break;
      case 'wallet':
        if (onNavigateToWallet) onNavigateToWallet();
        else Alert.alert(item.title, 'Opening Wallet & Cash Top-Up Operations...');
        break;
      case 'billing':
        if (onNavigateToBilling) onNavigateToBilling();
        else Alert.alert(item.title, 'Opening Invoices & Billing Dashboard...');
        break;
      case 'returns':
        if (onNavigateToReturns) onNavigateToReturns();
        else Alert.alert(item.title, 'Opening Returns & Issues Management...');
        break;
      case 'finance':
        if (onNavigateToFinance) onNavigateToFinance();
        else Alert.alert(item.title, 'Opening Warehouse Finance...');
        break;
      case 'reports':
        if (onNavigateToReports) onNavigateToReports();
        else Alert.alert(item.title, 'Opening Warehouse Reports & Audits...');
        break;
      case 'notifications':
        if (onNavigateToNotifications) onNavigateToNotifications();
        else Alert.alert(item.title, 'Opening Notifications & Tasks...');
        break;
      case 'staff':
        if (onNavigateToStaff) onNavigateToStaff();
        else Alert.alert(item.title, 'Opening Warehouse Staff Directory...');
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
      case 'orders':
        if (onNavigateToOrders) onNavigateToOrders();
        else Alert.alert(item.title, 'Opening Customer Orders...');
        break;
      case 'sales':
        if (onNavigateToSales) onNavigateToSales();
        else Alert.alert(item.title, 'Opening Sales Dashboard...');
        break;
      default:
        Alert.alert(item.title, `Opening ${item.title}...`);
    }
  };

  const renderOptionIcon = (type: MoreOptionItem['iconType'], color: string) => {
    switch (type) {
      case 'customers':
        return <CustomersIcon color={color} />;
      case 'wallet':
        return <WalletIcon color={color} />;
      case 'billing':
        return <BillingInvoiceIcon color={color} />;
      case 'returns':
        return <ReturnsIssuesIcon color={color} />;
      case 'finance':
        return <FinanceIcon color={color} />;
      case 'reports':
        return <ReportsIcon color={color} />;
      case 'notifications':
        return <NotificationsTasksIcon color={color} />;
      case 'staff':
        return <StaffIcon color={color} />;
      case 'profile':
        return <WarehouseProfileIcon color={color} />;
      case 'settings':
        return <SettingsModuleIcon color={color} />;
      case 'orders':
        return <OrdersIcon color={color} />;
      case 'sales':
        return <SalesIcon color={color} />;
      default:
        return <GridMenuHeaderIcon size={20} color={color} />;
    }
  };

  const renderBadge = (badgeText?: string, type?: MoreOptionItem['badgeType']) => {
    if (!badgeText) return null;

    let bg = '#F3F4F6';
    let textCol = '#4B5563';

    if (type === 'alert') {
      bg = '#FEE2E2';
      textCol = '#DC2626';
    } else if (type === 'success') {
      bg = '#DCFCE7';
      textCol = '#15803D';
    } else if (type === 'info') {
      bg = '#EEF2FF';
      textCol = '#4338CA';
    } else if (type === 'purple') {
      bg = '#F3E8FF';
      textCol = '#7E22CE';
    } else if (type === 'teal') {
      bg = '#CCFBF1';
      textCol = '#0F766E';
    }

    return (
      <View style={[styles.badgePill, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: textCol }]}>{badgeText}</Text>
      </View>
    );
  };

  if (showSettingsScreen) {
    return (
      <SubWarehouseSettingsScreen
        onBack={() => setShowSettingsScreen(false)}
        onLogout={onLogout}
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftGroup}>
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.75}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View style={styles.headerTitleRow}>
              <GridMenuHeaderIcon size={22} color="#FFFFFF" />
              <Text style={styles.headerTitleText}>More Options</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerBellBtn}
            onPress={() => {
              if (onNavigateToNotifications) {
                onNavigateToNotifications();
              } else {
                Alert.alert('Notifications', 'You have 3 unread warehouse notifications.');
              }
            }}
            activeOpacity={0.8}
          >
            <BellHeaderIcon />
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>
        </View>

        {/* Warehouse Subtitle Pill */}
        <View style={styles.warehouseBadgeRow}>
          <View style={styles.warehouseBadge}>
            <LockBadgeIcon />
            <Text style={styles.warehouseBadgeText}>Coonoor Warehouse</Text>
          </View>
        </View>
      </View>

      {/* ─── Main Content Scroll ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Summary Chips */}
        <View style={styles.quickMetricsRow}>
          <TouchableOpacity
            style={styles.metricChip}
            onPress={() => onNavigateToCustomers ? onNavigateToCustomers() : Alert.alert('Customers', '48 Active Registered Customers')}
            activeOpacity={0.75}
          >
            <Text style={styles.metricVal}>48</Text>
            <Text style={styles.metricLabel}>Customers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricChip}
            onPress={() => onNavigateToWallet ? onNavigateToWallet() : Alert.alert('Cash Top-Up', '₹18,500 Cash collected today')}
            activeOpacity={0.75}
          >
            <Text style={[styles.metricVal, { color: '#059669' }]}>₹18.5k</Text>
            <Text style={styles.metricLabel}>Top-Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricChip}
            onPress={() => onNavigateToStaff ? onNavigateToStaff() : Alert.alert('Staff', '6 Warehouse Operators on duty')}
            activeOpacity={0.75}
          >
            <Text style={[styles.metricVal, { color: '#0D9488' }]}>06</Text>
            <Text style={styles.metricLabel}>On Duty</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricChip}
            onPress={() => onNavigateToReturns ? onNavigateToReturns() : Alert.alert('Issues', '2 Pending Returns or QC Rejections')}
            activeOpacity={0.75}
          >
            <Text style={[styles.metricVal, { color: '#DC2626' }]}>02</Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </TouchableOpacity>
        </View>

        {/* Search / Filter Bar */}
        <View style={styles.searchBarWrap}>
          <SearchIcon size={17} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search operations, staff, reports..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Grouped Option Cards */}
        {OPTION_GROUPS.map((group) => {
          const filteredItems = group.items.filter(
            (item) =>
              !query ||
              item.title.toLowerCase().includes(query) ||
              item.subtitle.toLowerCase().includes(query) ||
              (item.badge && item.badge.toLowerCase().includes(query))
          );

          if (filteredItems.length === 0) return null;

          return (
            <View key={group.id} style={styles.groupContainer}>
              <Text style={styles.groupTitle}>{group.title}</Text>

              <View style={styles.groupCard}>
                {filteredItems.map((item, index) => {
                  const isLast = index === filteredItems.length - 1;
                  return (
                    <React.Fragment key={item.id}>
                      <TouchableOpacity
                        style={styles.itemRow}
                        onPress={() => handleOptionPress(item)}
                        activeOpacity={0.7}
                      >
                        {/* Domain-Colored Icon */}
                        <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                          {renderOptionIcon(item.iconType, item.iconColor)}
                        </View>

                        {/* Title & Subtitle */}
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemSubtitle} numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        </View>

                        {/* Status Badge & Chevron */}
                        <View style={styles.itemRightWrap}>
                          {renderBadge(item.badge, item.badgeType)}
                          <ChevronRightIcon size={18} color="#C2BBB2" />
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

        <View style={{ height: 28 }} />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  warehouseBadgeRow: {
    marginTop: 2,
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehouseBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  metricChip: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.primary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: PALETTE.textInk,
    padding: 0,
    margin: 0,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '400',
    lineHeight: 16,
  },
  itemRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginLeft: 69,
  },
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
