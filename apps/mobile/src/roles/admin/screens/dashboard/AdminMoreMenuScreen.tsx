import React from 'react';
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface AdminMoreMenuScreenProps {
  onBack: () => void;
  onSelectOption?: ((optionId: string) => void) | undefined;
  role?: ('SUPER_ADMIN' | 'TOHFA_ADMIN' | 'FARMER_ADMIN') | undefined;
  onNavigatePurchases?: (() => void) | undefined;
  onNavigateInputsPest?: (() => void) | undefined;
  onNavigateMarketPricing?: (() => void) | undefined;
  onNavigateProduceListings?: (() => void) | undefined;
  onNavigateFarmerRatings?: (() => void) | undefined;
  onNavigateDisputes?: (() => void) | undefined;
  onNavigateProfile?: (() => void) | undefined;
  onNavigateSettingsAndProfile?: (() => void) | undefined;
  onNavigateNotifications?: (() => void) | undefined;
  onNavigateReports?: (() => void) | undefined;
  onSwitchRole?: (() => void) | undefined;
  onItemSelect?: ((itemTitle: string) => void) | undefined;
  onLogout?: (() => void) | undefined;
}

// ─── Menu Icons Matching Exact Design Mockup in Brand Orange ───────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Super Admin Specific Icons Matching Mockup ─────────────────────────────

function ProduceCropsIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4c2-2 4-2 6-1-1 3-2 5-6 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8c-3.5 0-6.5 2.5-6.5 6.5C5.5 19 8.5 21 12 21s6.5-2 6.5-6.5c0-4-3-6.5-6.5-6.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AuditChecklistIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M9 11l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BugIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8" y="7" width="8" height="12" rx="4" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7V4M9 3l6 0M4 11h4M16 11h4M5 16l3-1M19 16l-3-1M5 7l3 2M19 7l-3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function StoreMarketIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l2-5h14l2 5v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-4 0V9z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 13v7h14v-7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShoppingCartIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="20" r="1.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="20" r="1.5" stroke={color} strokeWidth="1.8" />
      <Path d="M3 4h2l2.6 11.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PieChartIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 3v9h9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CashRegisterIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="14" width="16" height="7" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M7 14l2-8h6l2 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="10" y1="9" x2="14" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CustomersGroupIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BanknoteIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="1.8" />
      <Line x1="6" y1="12" x2="6.01" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="18" y1="12" x2="18.01" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function IdBadgeIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="6" width="16" height="15" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M9 6V3h6v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.8" />
      <Path d="M8 18c0-2 1.8-3 4-3s4 1 4 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CommunityPeopleIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M7 21v-2a4 4 0 0 1 3-3.87" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="7" r="3.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="5" cy="10" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="19" cy="10" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function BellIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GearIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserPortraitIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="9" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M6.5 18.5a6 6 0 0 1 11 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Existing Icons for Farmer/Tohfa Admin ──────────────────────────────────

function FarmersManagementIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.9" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceControlIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="16" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="17" r="2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M6 13V9a1 1 0 0 1 1-1h4v4.5M11 11h6v3h2v3h-3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 8V5h2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 8v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AuditManagementIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8" />
      <Rect x="7" y="12" width="2" height="2" rx="0.5" fill={color} />
      <Rect x="11" y="12" width="2" height="2" rx="0.5" fill={color} />
      <Rect x="15" y="12" width="2" height="2" rx="0.5" fill={color} />
      <Rect x="7" y="15.5" width="2" height="2" rx="0.5" fill={color} />
      <Rect x="11" y="15.5" width="2" height="2" rx="0.5" fill={color} />
      <Rect x="15" y="15.5" width="2" height="2" rx="0.5" fill={color} />
    </Svg>
  );
}

function InputsPestIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 18c0-5 3.5-12 13-12 0 9.5-7 13-12 13-0.5 0-1-0.2-1-1z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 17l7-7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function MarketPricingIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l1-5h16l1 5v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 14v7h16v-7" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CustomersIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WorkforceStaffIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="12" x2="12" y2="12.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function ReportsMenuIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
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

function NotificationsReportsIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CommunityIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.9" />
      <Circle cx="17" cy="11" r="3" stroke={color} strokeWidth="1.9" />
      <Path d="M21 21v-1.5a3 3 0 0 0-2.5-2.95" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function SettingsProfileIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.9" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LogoutIcon({ size = 20, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SwitchArrowsIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M16 3l4 4-4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 17H4M8 13l-4 4 4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PurchaseSalesIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2h9l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M8 12h8M8 16h6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function GavelIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 13l5 5M6 6l4-4 5 5-4 4-5-5zM2 22l6-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Menu Items Configuration ────────────────────────────────────────────────

interface MenuItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPressAction?: (() => void) | undefined;
}

interface MenuSectionConfig {
  title: string;
  items: MenuItemConfig[];
}

export function AdminMoreMenuScreen(props: AdminMoreMenuScreenProps) {
  const {
    onBack,
    onSelectOption,
    role = 'TOHFA_ADMIN',
    onNavigatePurchases,
    onNavigateInputsPest,
    onNavigateMarketPricing,
    onNavigateProduceListings,
    onNavigateFarmerRatings,
    onNavigateDisputes,
    onNavigateProfile,
    onNavigateSettingsAndProfile,
    onNavigateNotifications,
    onNavigateReports,
    onSwitchRole,
    onItemSelect,
    onLogout,
  } = props;

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isFarmerAdmin = role === 'FARMER_ADMIN';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            if (onLogout) onLogout();
            else onItemSelect?.('Logout');
          },
        },
      ]
    );
  };

  const handleItemPress = (item: MenuItemConfig) => {
    if (onSelectOption) {
      onSelectOption(item.id);
    }
    if (item.onPressAction) {
      item.onPressAction();
    }
  };

  // ─── Super Admin Sections Matching Exact Mockup ───────────────────────────
  const superAdminSections: MenuSectionConfig[] = [
    {
      title: 'FARM & PRODUCE',
      items: [
        {
          id: 'produce_crops',
          label: 'Produce & Crops',
          icon: <ProduceCropsIcon />,
         
        },
        {
          id: 'audit',
          label: 'Audit',
          icon: <AuditChecklistIcon />,
        },
        {
          id: 'inputs_pest',
          label: 'Inputs & Pest',
          icon: <BugIcon />,
          
        },
        {
          id: 'market_pricing',
          label: 'Market & Pricing',
          icon: <StoreMarketIcon />,
          
        },
        {
          id: 'purchases',
          label: 'Purchases',
          icon: <ShoppingCartIcon />,
          
        },
      ],
    },
    {
      title: 'SALES & MONEY',
      items: [
        {
          id: 'allocation',
          label: 'Allocation',
          icon: <PieChartIcon />,
        },
        {
          id: 'sales_orders',
          label: 'Sales & Orders',
          icon: <CashRegisterIcon />,
        },
        {
          id: 'customers',
          label: 'Customers',
          icon: <CustomersGroupIcon />,
        },
        {
          id: 'finance',
          label: 'Finance',
          icon: <BanknoteIcon />,
        },
      ],
    },
    {
      title: 'PEOPLE',
      items: [
        {
          id: 'staff_admin',
          label: 'Staff & Admin Accounts',
          icon: <IdBadgeIcon />,
        },
        {
          id: 'community',
          label: 'Community, Learning & Support',
          icon: <CommunityPeopleIcon />,
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'notifications_reports',
          label: 'Notifications & Reports',
          icon: <BellIcon />,
          
        },
        {
          id: 'system_settings',
          label: 'System Settings & Audit Log',
          icon: <GearIcon />,
          
        },
        {
          id: 'my_account',
          label: 'My Account',
          icon: <UserPortraitIcon />,
          
        },
      ],
    },
  ];

  // ─── Standard Menu Items for Farmer & Tohfa Admin ─────────────────────────
  const standardMenuItems: MenuItemConfig[] = isFarmerAdmin
    ? [
      {
        id: 'pricing',
        label: 'Market & Pricing',
        icon: <MarketPricingIcon />,
        onPressAction: () => {
          if (onNavigateMarketPricing) onNavigateMarketPricing();
          else onItemSelect?.('Market & Pricing');
        },
      },
      {
        id: 'disputes',
        label: 'Disputes',
        icon: <GavelIcon size={20} color={adminColors.brand} />,
        onPressAction: () => {
          if (onNavigateDisputes) onNavigateDisputes();
          else onItemSelect?.('Disputes');
        },
      },
      {
        id: 'switch_role',
        label: 'Switch Role',
        icon: <SwitchArrowsIcon />,
        onPressAction: () => {
          if (onSwitchRole) onSwitchRole();
          else onItemSelect?.('Switch Role');
        },
      },
      {
        id: 'notifications',
        label: 'Notification & Task',
        icon: <NotificationsReportsIcon />,
        onPressAction: () => {
          if (onNavigateNotifications) onNavigateNotifications();
          else onItemSelect?.('Notification & Task');
        },
      },
      {
        id: 'settings',
        label: 'Settings & Profile',
        icon: <SettingsProfileIcon />,
        onPressAction: () => {
          if (onNavigateProfile) onNavigateProfile();
          else if (onNavigateSettingsAndProfile) onNavigateSettingsAndProfile();
          else onItemSelect?.('Settings & Profile');
        },
      },
      {
        id: 'logout',
        label: 'Logout',
        icon: <LogoutIcon />,
        onPressAction: handleLogout,
      },
    ]
    : [
      { id: 'farmers', label: 'Farmers Management', icon: <FarmersManagementIcon /> },
      { id: 'produce', label: 'Produce Calendar', icon: <ProduceControlIcon /> },
      {
        id: 'purchase_sales',
        label: 'Purchase & Sales Orders',
        icon: <PurchaseSalesIcon />,
        onPressAction: () => {
          if (onNavigatePurchases) onNavigatePurchases();
          else onItemSelect?.('Purchase & Sales Orders');
        },
      },
      { id: 'audit', label: 'Audit Management', icon: <AuditManagementIcon /> },
      { id: 'inputs', label: 'Inputs & Pest Management', icon: <InputsPestIcon /> },
      { id: 'pricing', label: 'Market & Pricing', icon: <MarketPricingIcon /> },
      { id: 'customers', label: 'Customers', icon: <CustomersIcon /> },
      {
        id: 'reports',
        label: 'Reports',
        icon: <ReportsMenuIcon />,
        onPressAction: () => {
          if (onNavigateReports) onNavigateReports();
          else if (onSelectOption) onSelectOption('reports');
          else onItemSelect?.('Reports');
        },
      },
      { id: 'workforce', label: 'Workforce & Staff', icon: <WorkforceStaffIcon /> },
      { id: 'community', label: 'Community & Knowledge Management', icon: <CommunityIcon /> },
      { id: 'notifications', label: 'Notification & Task', icon: <NotificationsReportsIcon /> },
      { id: 'settings', label: 'Settings & Profile', icon: <SettingsProfileIcon /> },
      {
        id: 'logout',
        label: 'Logout',
        icon: <LogoutIcon />,
        onPressAction: handleLogout,
      },
    ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner in Brand Orange */}
      <View style={styles.headerBanner}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
          <BackArrowWhiteIcon />
          <Text style={styles.headerTitle}>More</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSuperAdmin ? (
          <View style={styles.sectionsContainer}>
            {superAdminSections.map((sec) => (
              <View key={sec.title} style={styles.sectionWrap}>
                <Text style={styles.sectionHeaderTitle}>{sec.title}</Text>
                <View style={styles.menuContainer}>
                  {sec.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.menuItemCard}
                      onPress={() => handleItemPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={styles.menuIconBox}>{item.icon}</View>
                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                      </View>
                      <ChevronRightIcon />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.menuContainer}>
            {standardMenuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItemCard}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconBox}>{item.icon}</View>
                  <Text
                    style={[
                      styles.menuItemLabel,
                      item.id === 'logout' && { color: adminColors.danger.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                <ChevronRightIcon />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: adminSpacing.xxxl + 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: adminSpacing.sm,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionsContainer: {
    gap: adminSpacing.xs,
  },
  sectionWrap: {
    marginBottom: adminSpacing.sm,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: adminColors.rustDeep,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.sm,
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
    justifyContent: 'center',
  },
  menuItemLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
});
