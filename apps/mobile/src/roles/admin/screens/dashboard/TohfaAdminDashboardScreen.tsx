import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
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
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop } from 'react-native-svg';
import { fetchMe, logout, type UserMe } from '../../../farmer/api/auth';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components';
import {
  AdminAllFarmersScreen,
  AdminFarmerDetailScreen,
  AdminFarmMapScreen,
  AdminRatingScorecardScreen,
  type FarmerListItem,
} from '../farmers';
import {
  SalesChannelOverviewScreen,
  SalesOnlineOrdersScreen,
  SalesMarketDayScreen,
  SalesHorecaOrdersScreen,
  SalesB2BOrdersScreen,
  SalesFulfillmentAssignmentScreen,
  SalesInvoiceScreen,
  SalesReturnsRefundsScreen,
  type OnlineOrderItem,
  type B2BAccount,
} from '../sales';
import { AdminProfileScreen } from './AdminProfileScreen';
import { ListingApprovalQueueScreen } from './ListingApprovalQueueScreen';
import { AdminSupportScreen } from './AdminSupportScreen';
import { AdminPendingApplicationsScreen, AdminApplicationDetailScreen } from '../registration';
import {
  AdminReportsMainScreen,
  AnalyticsDashboardScreen,
  FarmerPerformanceReportScreen,
  WarehouseOpsReportScreen,
  ReportBuilderScreen,
  SystemAlertsScreen,
  AnnouncementsScreen,
  AllRecentReportsScreen,
} from '../reports';
import { FinancialDashboardScreen, PLStatementScreen } from '../finance';
import { AdminOperationsOverviewScreen } from './AdminOperationsOverviewScreen';
import { AdminMoreMenuScreen } from './AdminMoreMenuScreen';
import { InputsPestHomeScreen } from './InputsPestHomeScreen';
import { ApprovedInputsScreen, AddNewInputScreen, type CatalogInputItem } from './ApprovedInputsScreen';
import { InputDetailScreen } from './InputDetailScreen';
import { PestLibraryScreen, AddNewPestScreen } from './PestLibraryScreen';
import { FarmerPestIncidentsScreen, type IncidentItem } from './FarmerPestIncidentsScreen';
import { PestIncidentDetailScreen } from './PestIncidentDetailScreen';

export type TohfaAdminTab =
  | 'Home'
  | 'WorkQueue'
  | 'Operations'
  | 'Finance'
  | 'More'
  | 'Dashboard'
  | 'Farmers'
  | 'Sales'
  | 'Reports'
  | 'Profile';

export interface TohfaAdminDashboardScreenProps {
  onSignOut?: () => void;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onSwitchRole?: (role: string) => void;
  /** Tab to open on mount (e.g. 'Profile' from settings) */
  initialTab?: TohfaAdminTab | undefined;
}

// ─── SVG Icons Matching Exact Design Mockup ──────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeHeaderIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellHeaderIcon({ size = 19, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function ProfileHeaderIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="10" r="3.2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M6.8 18.2a7 7 0 0 1 10.4 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function RefreshIcon({ size = 15, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.99 6.57 2.57L21 8"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 3v5h-5"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 15, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="14" r="1.1" fill={color} />
      <Circle cx="12" cy="14" r="1.1" fill={color} />
      <Circle cx="16" cy="14" r="1.1" fill={color} />
      <Circle cx="8" cy="18" r="1.1" fill={color} />
      <Circle cx="12" cy="18" r="1.1" fill={color} />
    </Svg>
  );
}

function ChevronDownIcon({ size = 14, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockHistoryIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Quick Action Vector Icons ────────────────────────────────────────────────

function QuickUserSearchIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="11" r="3" stroke={color} strokeWidth="2" />
      <Path d="M20.5 13.5L22 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickTagIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="7" r="1.5" fill={color} />
    </Svg>
  );
}

function QuickReceiptIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="16" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickBagIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" />
      <Path d="M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickDocIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickWalletIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuickLeafIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 4 13a7 7 0 0 1 7-7 7 7 0 0 1 7 7v7h-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M11 13l4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickSupportIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18v-6a9 9 0 0 1 18 0v6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QuickWarehouseIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuickBadgeStaffIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="11" r="2.5" stroke={color} strokeWidth="2" />
      <Path d="M5.5 17c0-1.5 1.5-2.5 3.5-2.5s3.5 1 3.5 2.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14" y1="10" x2="18" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14" y1="14" x2="17" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Navigation Bar Icons ──────────────────────────────────────────────

function TabHomeIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabWorkQueueIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 6h13M8 12h13M8 18h13M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabOperationsIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 20V10M12 20V4M6 20v-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabFinanceIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="2" />
      <Line x1="6" y1="12" x2="6.01" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="12" x2="18.01" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TabMoreIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCE CONTROL MODULE (Exact Match to Reference Mockups 1, 2, 3, 4, 5)
// ══════════════════════════════════════════════════════════════════════════════

// ─── Produce Control SVG Icons ────────────────────────────────────────────────

function ProduceCalendarHeaderIcon({ size = 24, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2.2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="3" y1="9.5" x2="21" y2="9.5" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="13.5" r="1.2" fill={color} />
      <Circle cx="12" cy="13.5" r="1.2" fill={color} />
      <Circle cx="16" cy="13.5" r="1.2" fill={color} />
      <Circle cx="8" cy="17.5" r="1.2" fill={color} />
      <Circle cx="12" cy="17.5" r="1.2" fill={color} />
      <Circle cx="16" cy="17.5" r="1.2" fill={color} />
    </Svg>
  );
}

function ProduceBackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceNavChevronLeft({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceNavChevronRight({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceSearchIcon({ size = 18, color = '#8C7E74' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProduceFilterSlidersIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6.5" x2="20" y2="6.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="17.5" x2="20" y2="17.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="6.5" r="2.5" fill={adminColors.card} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="17.5" r="2.5" fill={adminColors.card} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ProduceLeafIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="16" y1="8" x2="2" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProduceTrendChartIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 17l6-6 4 4 8-8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="3" cy="17" r="2" fill={color} />
      <Circle cx="9" cy="11" r="2" fill={color} />
      <Circle cx="13" cy="15" r="2" fill={color} />
      <Circle cx="21" cy="7" r="2" fill={color} />
    </Svg>
  );
}

function ProduceHistoryIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProduceGrid4Icon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ProduceChevronDown({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceCheckCircleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#2E7D32" strokeWidth="2" fill="#E8F5E9" />
      <Path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#2E7D32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceCurrentStageIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#E67E22" strokeWidth="2" fill="#FFF3E0" />
      <Circle cx="12" cy="12" r="4" fill="#E67E22" />
    </Svg>
  );
}

function ProduceDownloadIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v10M8 10l4 4 4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceMoneyNotAvailableIcon({ size = 32, color = '#5A6065' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M6 6v12M18 6v12" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
    </Svg>
  );
}

function ProduceCompareIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="7" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="14" y="4" width="7" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M10 8h4M10 12h4M10 16h4" stroke={color} strokeWidth="1.5" strokeDasharray="1 1" />
    </Svg>
  );
}

// ─── Screen 1 & 2: Produce Control (Calendar) ──────────────────────────────────

interface ProduceControlCalendarScreenProps {
  onBack?: () => void;
  onOpenFilters: () => void;
  onNavigateToZoneBreakdown: () => void;
  onNavigateToHarvestForecast: () => void;
  onNavigateToCropHistory: () => void;
}

function ProduceControlCalendarScreen({
  onBack,
  onOpenFilters,
  onNavigateToZoneBreakdown,
  onNavigateToHarvestForecast,
  onNavigateToCropHistory,
}: ProduceControlCalendarScreenProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [searchTxt, setSearchTxt] = useState('');

  // Month cells definition for October 2026 matching Image 5:
  // Week 1: [null, 1, 2, 3, 4, 5, 6]
  // Week 2: [7, 8, 9, 10, 11, 12, 13]
  // Week 3: [14, 15, 16, 17, 18, 19, 20]
  // Week 4: [21, 22, 23, 24, 25, 26, 27]
  // Week 5: [28, 29, 30, 31, null, null, null]
  const calendarCells = [
    { day: null },
    { day: 1, border: 'orange', dots: ['#1E56A0', '#E07A28'] },
    { day: 2 },
    { day: 3, dots: ['#E07A28'] },
    { day: 4 },
    { day: 5 },
    { day: 6, dots: ['#1E56A0', '#E07A28'] },
    { day: 7, dots: ['#E07A28'] },
    { day: 8 },
    { day: 9, dots: ['#E07A28'] },
    { day: 10 },
    { day: 11 },
    { day: 12 },
    { day: 13 },
    { day: 14, border: 'brown', dots: ['#E07A28'] },
    { day: 15 },
    { day: 16 },
    { day: 17 },
    { day: 18 },
    { day: 19 },
    { day: 20, ring: true },
    { day: 21, ring: true },
    { day: 22 },
    { day: 23 },
    { day: 24 },
    { day: 25 },
    { day: 26 },
    { day: 27 },
    { day: 28 },
    { day: 29 },
    { day: 30 },
    { day: 31, ring: true },
    { day: null },
    { day: null },
    { day: null },
  ];

  return (
    <View style={produceStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Orange Terracotta Header Banner ─── */}
      <View style={produceStyles.headerBanner}>
        <View style={produceStyles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={produceStyles.backBtnTouch}>
              <ProduceBackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
          )}
          <ProduceCalendarHeaderIcon size={26} color={adminColors.onBrand} />
          {/* Note: "Produce Control" as explicitly requested by user */}
          <Text style={produceStyles.headerTitle}>Produce Control</Text>
        </View>
        <Text style={produceStyles.headerSubtitle}>October 2026 · 43 crop records</Text>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={produceStyles.scrollContainer}
        contentContainerStyle={produceStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Overview Card ─── */}
        <View style={produceStyles.overviewCard}>
          <Text style={produceStyles.overviewTitle}>Overview</Text>

          <View style={produceStyles.overviewRow}>
            <Text style={produceStyles.overviewLabel}>Crop records in view</Text>
            <Text style={produceStyles.overviewValue}>43</Text>
          </View>
          <View style={produceStyles.dottedDivider} />

          <View style={produceStyles.overviewRow}>
            <Text style={produceStyles.overviewLabel}>Expected harvests this month (forecast)</Text>
            <Text style={produceStyles.overviewValue}>3</Text>
          </View>
          <View style={produceStyles.dottedDivider} />

          <View style={produceStyles.overviewRow}>
            <Text style={produceStyles.overviewLabel}>Records missing a planting date</Text>
            <Text style={produceStyles.overviewValue}>3</Text>
          </View>
          <View style={produceStyles.dottedDivider} />

          <View style={produceStyles.overviewRow}>
            <Text style={produceStyles.overviewLabel}>Records needing an update</Text>
            <Text style={produceStyles.overviewValue}>Rule not defined</Text>
          </View>
        </View>

        {/* ─── Month Navigation ─── */}
        <View style={produceStyles.monthNavRow}>
          <TouchableOpacity style={produceStyles.monthNavBtn} activeOpacity={0.7}>
            <ProduceNavChevronLeft size={18} color={adminColors.brandDeep} />
          </TouchableOpacity>
          <Text style={produceStyles.monthNavTitle}>October 2026</Text>
          <TouchableOpacity style={produceStyles.monthNavBtn} activeOpacity={0.7}>
            <ProduceNavChevronRight size={18} color={adminColors.brandDeep} />
          </TouchableOpacity>
        </View>

        {/* ─── Calendar Grid ─── */}
        <View style={produceStyles.calendarContainer}>
          {/* Weekday Labels */}
          <View style={produceStyles.weekdaysRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLetter, index) => (
              <View key={`wd-${index}`} style={produceStyles.weekdayCell}>
                <Text style={produceStyles.weekdayText}>{dayLetter}</Text>
              </View>
            ))}
          </View>

          {/* Day Cells Grid */}
          <View style={produceStyles.daysGrid}>
            {calendarCells.map((cell, idx) => {
              if (cell.day === null) {
                return <View key={`blank-${idx}`} style={produceStyles.dayCellEmpty} />;
              }

              const isSelected = selectedDay === cell.day;
              const hasOrangeBorder = cell.border === 'orange';
              const hasBrownBorder = cell.border === 'brown';

              return (
                <TouchableOpacity
                  key={`day-${cell.day}`}
                  style={[
                    produceStyles.dayCell,
                    hasOrangeBorder && produceStyles.dayCellOrangeBorder,
                    hasBrownBorder && produceStyles.dayCellBrownBorder,
                    isSelected && !hasOrangeBorder && !hasBrownBorder && produceStyles.dayCellSelected,
                  ]}
                  onPress={() => setSelectedDay(cell.day!)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      produceStyles.dayNumText,
                      (hasOrangeBorder || hasBrownBorder || isSelected) && produceStyles.dayNumTextBold,
                    ]}
                  >
                    {cell.day}
                  </Text>
                  {/* Indicators below date */}
                  <View style={produceStyles.dayDotsRow}>
                    {cell.dots &&
                      cell.dots.map((dColor, dIdx) => (
                        <View key={`dot-${dIdx}`} style={[produceStyles.calendarDot, { backgroundColor: dColor }]} />
                      ))}
                    {cell.ring && <View style={produceStyles.calendarRing} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Legend ─── */}
        <View style={produceStyles.legendRow}>
          <View style={produceStyles.legendItem}>
            <View style={[produceStyles.legendDot, { backgroundColor: '#1E56A0' }]} />
            <Text style={produceStyles.legendText}>Planting</Text>
          </View>
          <View style={produceStyles.legendItem}>
            <View style={[produceStyles.legendDot, { backgroundColor: '#E07A28' }]} />
            <Text style={produceStyles.legendText}>Growth stage</Text>
          </View>
          <View style={produceStyles.legendItem}>
            <View style={produceStyles.legendRing} />
            <Text style={produceStyles.legendText}>Expected harvest</Text>
          </View>
          <View style={produceStyles.legendItem}>
            <View style={[produceStyles.legendDot, { backgroundColor: '#1B5E20' }]} />
            <Text style={produceStyles.legendText}>Past harvest</Text>
          </View>
        </View>

        {/* ─── Search Bar with Filter Icon (Tap opens Screen 3) ─── */}
        <View style={produceStyles.searchBarContainer}>
          <ProduceSearchIcon size={18} color="#8C7E74" />
          <TextInput
            style={produceStyles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor="#8C7E74"
            value={searchTxt}
            onChangeText={setSearchTxt}
          />
          <TouchableOpacity
            style={produceStyles.filterTouchBtn}
            onPress={onOpenFilters}
            activeOpacity={0.7}
            accessibilityLabel="Filters"
          >
            <ProduceFilterSlidersIcon size={20} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ─── Date Section: 1 Oct 2026 (or selected date) ─── */}
        <Text style={produceStyles.dateSectionHeader}>{selectedDay} Oct 2026</Text>

        {/* Card 1: Crop development */}
        <View style={produceStyles.activityCard}>
          <View style={produceStyles.activityTopRow}>
            <View style={produceStyles.activityTitleWrap}>
              <View style={[produceStyles.activityDot, { backgroundColor: '#E07A28' }]} />
              <Text style={produceStyles.activityTitle}>Crop development</Text>
            </View>
            <View style={produceStyles.recordedBadge}>
              <Text style={produceStyles.recordedBadgeText}>Recorded</Text>
            </View>
          </View>
          <Text style={produceStyles.activityMeta}>Potato · Selvi · Coonoor · PLT-00131-1</Text>
          <Text style={produceStyles.activityDate}>{selectedDay} Oct 2026</Text>
        </View>

        {/* Card 2: Planting */}
        <View style={produceStyles.activityCard}>
          <View style={produceStyles.activityTopRow}>
            <View style={produceStyles.activityTitleWrap}>
              <View style={[produceStyles.activityDot, { backgroundColor: '#1E56A0' }]} />
              <Text style={produceStyles.activityTitle}>Planting</Text>
            </View>
            <View style={produceStyles.recordedBadge}>
              <Text style={produceStyles.recordedBadgeText}>Recorded</Text>
            </View>
          </View>
          <Text style={produceStyles.activityMeta}>Cabbage · Arun · Ooty · PLT-00215-2</Text>
          <Text style={produceStyles.activityDate}>{selectedDay} Oct 2026</Text>
        </View>

        {/* Explanatory Footnote */}
        <Text style={produceStyles.explanatoryFootnote}>
          Planting and growth-stage dates are recorded. Expected harvest dates are forecasts and are never shown as a
          harvest. A forecast does not mean produce has been purchased or received.
        </Text>

        {/* ─── Quick Actions Section ─── */}
        <Text style={produceStyles.quickActionsSectionHeader}>Quick actions</Text>

        <View style={produceStyles.quickActionsRow}>
          {/* Card 1: Zone & Crop Breakdown (Navigates to Screen 4) */}
          <TouchableOpacity
            style={produceStyles.quickActionCard}
            onPress={onNavigateToZoneBreakdown}
            activeOpacity={0.8}
          >
            <ProduceLeafIcon size={24} color={adminColors.brand} />
            <Text style={produceStyles.quickActionLabel}>Zone & Crop{'\n'}Breakdown</Text>
          </TouchableOpacity>

          {/* Card 2: Harvest Forecast & Crop Insights */}
          <TouchableOpacity
            style={produceStyles.quickActionCard}
            onPress={onNavigateToHarvestForecast}
            activeOpacity={0.8}
          >
            <ProduceTrendChartIcon size={24} color={adminColors.brand} />
            <Text style={produceStyles.quickActionLabel}>Harvest Forecast &{'\n'}Crop Insights</Text>
          </TouchableOpacity>

          {/* Card 3: Crop History & Records */}
          <TouchableOpacity
            style={produceStyles.quickActionCard}
            onPress={onNavigateToCropHistory}
            activeOpacity={0.8}
          >
            <ProduceHistoryIcon size={24} color={adminColors.brand} />
            <Text style={produceStyles.quickActionLabel}>Crop History &{'\n'}Records</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

// ─── Screen 3: Produce Control Filters Modal ────────────────────────────────────

interface ProduceControlFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFarmer: string;
  onChangeFarmer: (v: string) => void;
  selectedZone: string;
  onChangeZone: (v: string) => void;
  selectedCrop: string;
  onChangeCrop: (v: string) => void;
  selectedSeason: string;
  onChangeSeason: (v: string) => void;
  selectedGrowthStage: string;
  onChangeGrowthStage: (v: string) => void;
}

function ProduceControlFiltersModal({
  visible,
  onClose,
  selectedFarmer,
  onChangeFarmer,
  selectedZone,
  onChangeZone,
  selectedCrop,
  onChangeCrop,
  selectedSeason,
  onChangeSeason,
  selectedGrowthStage,
  onChangeGrowthStage,
}: ProduceControlFiltersModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={produceStyles.modalBackdrop}>
        <Pressable style={produceStyles.modalDismissArea} onPress={onClose} />
        <View style={produceStyles.bottomSheet}>
          <Text style={produceStyles.filtersModalTitle}>Filters</Text>

          {/* 1. Farmer / farm */}
          <Text style={produceStyles.filterFieldLabel}>Farmer / farm</Text>
          <TouchableOpacity
            style={produceStyles.filterDropdown}
            onPress={() => onChangeFarmer(selectedFarmer === 'All' ? 'Ramesh Kumar' : 'All')}
            activeOpacity={0.7}
          >
            <Text style={produceStyles.filterDropdownValue}>{selectedFarmer}</Text>
            <ProduceChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* 2. Zone */}
          <Text style={produceStyles.filterFieldLabel}>Zone</Text>
          <TouchableOpacity
            style={produceStyles.filterDropdown}
            onPress={() => onChangeZone(selectedZone === 'All' ? 'Coonoor' : 'All')}
            activeOpacity={0.7}
          >
            <Text style={produceStyles.filterDropdownValue}>{selectedZone}</Text>
            <ProduceChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* 3. Crop */}
          <Text style={produceStyles.filterFieldLabel}>Crop</Text>
          <TouchableOpacity
            style={produceStyles.filterDropdown}
            onPress={() => onChangeCrop(selectedCrop === 'All' ? 'Tomato' : 'All')}
            activeOpacity={0.7}
          >
            <Text style={produceStyles.filterDropdownValue}>{selectedCrop}</Text>
            <ProduceChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* 4. Season */}
          <Text style={produceStyles.filterFieldLabel}>Season</Text>
          <TouchableOpacity
            style={produceStyles.filterDropdown}
            onPress={() => onChangeSeason(selectedSeason === 'All' ? 'Kharif' : 'All')}
            activeOpacity={0.7}
          >
            <Text style={produceStyles.filterDropdownValue}>{selectedSeason}</Text>
            <ProduceChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* 5. Growth stage */}
          <Text style={produceStyles.filterFieldLabel}>Growth stage</Text>
          <TouchableOpacity
            style={produceStyles.filterDropdown}
            onPress={() => onChangeGrowthStage(selectedGrowthStage === 'All' ? 'Flowering' : 'All')}
            activeOpacity={0.7}
          >
            <Text style={produceStyles.filterDropdownValue}>{selectedGrowthStage}</Text>
            <ProduceChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* Bottom Buttons Row: [Apply]  [Reset] */}
          <View style={produceStyles.filterButtonsRow}>
            <TouchableOpacity style={produceStyles.filterApplyBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={produceStyles.filterBtnText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={produceStyles.filterResetBtn}
              onPress={() => {
                onChangeFarmer('All');
                onChangeZone('All');
                onChangeCrop('All');
                onChangeSeason('All');
                onChangeGrowthStage('All');
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={produceStyles.filterBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen 4: Zone & Crop Breakdown ───────────────────────────────────────────

interface ZoneCropBreakdownScreenProps {
  onBack: () => void;
  onOpenFilters: () => void;
  onSelectCropRecord: (recordId: string) => void;
}

function ZoneCropBreakdownScreen({
  onBack,
  onOpenFilters,
  onSelectCropRecord,
}: ZoneCropBreakdownScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState('Horticultural');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Vegetables');

  return (
    <View style={produceStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={produceStyles.headerBanner}>
        <View style={produceStyles.headerTopRowBetween}>
          <View style={produceStyles.headerTitleWrap}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={produceStyles.backBtnTouch}>
              <ProduceBackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <ProduceGrid4Icon size={20} color={adminColors.onBrand} />
            <Text style={produceStyles.headerTitle}>Zone & Crop Breakdown</Text>
          </View>

          <TouchableOpacity style={produceStyles.headerRightIconTouch} onPress={onOpenFilters} activeOpacity={0.8}>
            <ProduceFilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={produceStyles.scrollContainer}
        contentContainerStyle={produceStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2x2 Metric Cards Grid */}
        <View style={produceStyles.breakdownMetricGrid}>
          {/* Tile 1: Farms with crop records */}
          <View style={produceStyles.breakdownMetricCard}>
            <Text style={produceStyles.breakdownMetricValue}>18</Text>
            <Text style={produceStyles.breakdownMetricLabel}>Farms with crop records</Text>
          </View>

          {/* Tile 2: Zones with active plans */}
          <View style={produceStyles.breakdownMetricCard}>
            <Text style={produceStyles.breakdownMetricValue}>4</Text>
            <Text style={produceStyles.breakdownMetricLabel}>Zones with active plans</Text>
          </View>

          {/* Tile 3: Crops in growth stages */}
          <View style={produceStyles.breakdownMetricCard}>
            <Text style={produceStyles.breakdownMetricValue}>27</Text>
            <Text style={produceStyles.breakdownMetricLabel}>Crops in growth stages</Text>
          </View>

          {/* Tile 4: Expected harvests in 30 days */}
          <View style={produceStyles.breakdownMetricCard}>
            <Text style={produceStyles.breakdownMetricValue}>
              6 <Text style={produceStyles.breakdownMetricValueSub}>(2 excluded)</Text>
            </Text>
            <Text style={produceStyles.breakdownMetricLabel}>Expected harvests in 30 days</Text>
          </View>
        </View>

        {/* Footnote */}
        <Text style={produceStyles.breakdownFootnote}>
          2 open records excluded from the 30-day count: missing planting date or no duration rule for the crop.
        </Text>

        {/* ─── Crops category Section ─── */}
        <Text style={produceStyles.breakdownSectionHeader}>Crops category</Text>

        {/* Category Row 1 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={produceStyles.chipScrollRow}>
          {['Horticultural', 'Cash and Commercial', 'Oilseed', 'Pulses'].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[produceStyles.categoryChip, isSelected && produceStyles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[produceStyles.categoryChipText, isSelected && produceStyles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category Row 2 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={produceStyles.chipScrollRow}>
          {['Vegetables', 'Fruits', 'Spices & Condiments'].map((sub) => {
            const isSelected = selectedSubCategory === sub;
            return (
              <TouchableOpacity
                key={sub}
                style={[produceStyles.categoryChip, isSelected && produceStyles.categoryChipActive]}
                onPress={() => setSelectedSubCategory(sub)}
                activeOpacity={0.8}
              >
                <Text style={[produceStyles.categoryChipText, isSelected && produceStyles.categoryChipTextActive]}>
                  {sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Coonoor — zone panel Section ─── */}
        <Text style={produceStyles.breakdownSectionHeader}>Coonoor — zone panel</Text>

        <View style={produceStyles.zonePanelCard}>
          <View style={produceStyles.zonePanelRow}>
            <Text style={produceStyles.zonePanelFarm}>Ramesh Kumar Farm</Text>
            <Text style={produceStyles.zonePanelDetail}>Red loam · Full sun · Drip</Text>
          </View>
          <View style={produceStyles.zonePanelDivider} />
          <View style={produceStyles.zonePanelRow}>
            <Text style={produceStyles.zonePanelFarm}>Selvi Farm</Text>
            <Text style={produceStyles.zonePanelDetail}>Not recorded</Text>
          </View>
        </View>

        {/* ─── Crop records Section ─── */}
        <Text style={produceStyles.breakdownSectionHeader}>Crop records</Text>

        {/* Card 1: Tomato · Ramesh Kumar Farm (Tapping redirects to Screen 5) */}
        <TouchableOpacity
          style={produceStyles.cropRecordCard}
          onPress={() => onSelectCropRecord('CR-2026-0017')}
          activeOpacity={0.8}
        >
          <View style={produceStyles.cropRecordTopRow}>
            <Text style={produceStyles.cropRecordName}>Tomato · Ramesh Kumar Farm</Text>
            <View style={produceStyles.growingBadge}>
              <Text style={produceStyles.growingBadgeText}>Growing</Text>
            </View>
          </View>
          <Text style={produceStyles.cropRecordSub}>
            Coonoor, plot 1 · Planted 15 Jul 2026 · Stage 5 of 7 (Flowering)
          </Text>

          {/* 7-Segment Progress Bar: 4 completed green, 1 active orange, 2 upcoming gray */}
          <View style={produceStyles.progressBarRow}>
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentOrange]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGray]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGray]} />
          </View>

          <Text style={produceStyles.cropRecordHarvest}>Expected harvest: 13 Oct 2026 (calculated)</Text>
        </TouchableOpacity>

        {/* Card 2: Carrot · Selvi */}
        <TouchableOpacity
          style={produceStyles.cropRecordCard}
          onPress={() => onSelectCropRecord('CR-2026-0018')}
          activeOpacity={0.8}
        >
          <View style={produceStyles.cropRecordTopRow}>
            <Text style={produceStyles.cropRecordName}>Carrot · Selvi</Text>
            <View style={produceStyles.growingBadge}>
              <Text style={produceStyles.growingBadgeText}>Growing</Text>
            </View>
          </View>
          <Text style={produceStyles.cropRecordSub}>
            Coonoor, plot 2 · Planted 02 Jul 2026 · Stage 5 of 7 (Flowering)
          </Text>

          {/* 7-Segment Progress Bar */}
          <View style={produceStyles.progressBarRow}>
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentOrange]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGray]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGray]} />
          </View>

          <Text style={produceStyles.cropRecordHarvest}>Expected harvest: 10 Oct 2026 (calculated)</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Screen 5: Crop Record Detail (Tomato · CR-2026-0017) ─────────────────────

interface CropRecordDetailScreenProps {
  onBack: () => void;
  onOpenFarmerProfile?: () => void;
}

function CropRecordDetailScreen({ onBack, onOpenFarmerProfile }: CropRecordDetailScreenProps) {
  const [activePillTab, setActivePillTab] = useState('Overview');

  return (
    <View style={produceStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={produceStyles.headerBanner}>
        <View style={produceStyles.headerTopRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={produceStyles.backBtnTouch}>
            <ProduceBackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={produceStyles.headerTitle}>Tomato · CR-2026-0017</Text>
        </View>
        <Text style={[produceStyles.headerSubtitle, { paddingLeft: 30 }]}>
          Ramesh Kumar Farm · Coonoor, plot 1
        </Text>
      </View>

      <ScrollView
        style={produceStyles.scrollContainer}
        contentContainerStyle={produceStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Key-Value Details */}
        <View style={produceStyles.detailCard}>
          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Crop record</Text>
            <Text style={produceStyles.detailRowValue}>CR-2025-0001</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Farmer / farm</Text>
            <Text style={produceStyles.detailRowValue}>FMR-00124 · Ramesh Kumar</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Crops Category</Text>
            <Text style={produceStyles.detailRowValue}>Horticultural - Vegetables</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Zone / plot</Text>
            <Text style={produceStyles.detailRowValue}>Coonoor · PLT-00124-1</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Planting date</Text>
            <Text style={produceStyles.detailRowValue}>5 Mar 2025</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Expected harvest</Text>
            <Text style={produceStyles.detailRowValue}>3 Jun 2025</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Current stage</Text>
            <Text style={produceStyles.detailRowValue}>Harvest (7 of 7)</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Last updated</Text>
            <Text style={produceStyles.detailRowValue}>3 Jun 2025, 08:00 · Farmer entry</Text>
          </View>

          <Text style={produceStyles.detailFootnote}>
            Calculated: planting date plus 90 days (crop duration, rule to confirm)
          </Text>

          <TouchableOpacity style={produceStyles.openFarmerProfileTouch} onPress={onOpenFarmerProfile} activeOpacity={0.7}>
            <Text style={produceStyles.openFarmerProfileText}>Open farmer profile</Text>
          </TouchableOpacity>
        </View>

        {/* Footnote */}
        <Text style={produceStyles.breakdownFootnote}>
          Stage names are proposed (the official seven are to be confirmed). A stage is shown as completed only when it was recorded.
        </Text>

        {/* ─── Growth stages Section ─── */}
        <Text style={produceStyles.breakdownSectionHeader}>Growth stages</Text>

        <View style={produceStyles.growthStagesCard}>
          {/* Stage 1 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>1 · Land preparation</Text>
            </View>
            <Text style={produceStyles.stageDateText}>26 Feb 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 2 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>2 · Planting</Text>
            </View>
            <Text style={produceStyles.stageDateText}>5 Mar 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 3 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>3 · Germination</Text>
            </View>
            <Text style={produceStyles.stageDateText}>23 Mar 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 4 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>4 · Vegetative growth</Text>
            </View>
            <Text style={produceStyles.stageDateText}>10 Apr 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 5 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>5 · Flowering</Text>
            </View>
            <Text style={produceStyles.stageDateText}>28 Apr 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 6 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>6 · Crop development</Text>
            </View>
            <Text style={produceStyles.stageDateText}>16 May 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 7: Harvest (current) */}
          <View style={[produceStyles.growthStageRow, produceStyles.stageRowCurrent]}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCurrentStageIcon size={18} />
              <Text style={[produceStyles.stageNameText, produceStyles.stageNameTextCurrent]}>
                7 · Harvest (current)
              </Text>
            </View>
            <Text style={[produceStyles.stageDateText, produceStyles.stageDateTextCurrent]}>3 Jun 2025</Text>
          </View>
        </View>

        {/* ─── Pill Tabs Row ─── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={produceStyles.chipScrollRow}>
          {['Overview', 'Schedule', 'Growth history', 'Nutrients', 'Harvest', 'Crop history', 'Related'].map((tab) => {
            const isSelected = activePillTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[produceStyles.categoryChip, isSelected && produceStyles.categoryChipActive]}
                onPress={() => setActivePillTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[produceStyles.categoryChipText, isSelected && produceStyles.categoryChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activePillTab === 'Overview' && (
          <View style={produceStyles.breakdownCard}>
            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Crop</Text>
              <Text style={produceStyles.cropDetailValue}>Tomato · Local</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Farmer</Text>
              <Text style={produceStyles.cropDetailValue}>Ramesh Kumar</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Farm / zone</Text>
              <Text style={produceStyles.cropDetailValue}>Coonoor · PLT-00124-1</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Season</Text>
              <Text style={produceStyles.cropDetailValue}>Winter 2025</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Plan status (proposed)</Text>
              <Text style={produceStyles.cropDetailValue}>Harvested</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Area</Text>
              <Text style={produceStyles.cropDetailValue}>1 acre</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Current stage</Text>
              <Text style={produceStyles.cropDetailValue}>Harvest (7 of 7)</Text>
            </View>
          </View>
        )}

        {/* ─── TAB 2: SCHEDULE ─── */}
        {activePillTab === 'Schedule' && (
          <View>
            <View style={produceStyles.breakdownCard}>
              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Planting date (recorded)</Text>
                <Text style={produceStyles.cropDetailValue}>5 Mar 2025</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Expected harvest (forecast)</Text>
                <Text style={produceStyles.cropDetailValue}>3 Jun 2025</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={[produceStyles.trendTableRow, { alignItems: 'flex-start' }]}>
                <Text style={produceStyles.cropDetailLabel}>Basis</Text>
                <Text style={[produceStyles.cropDetailValue, { flex: 1, textAlign: 'right' }]}>
                  Calculated: planting date plus 90 days (crop duration, rule to confirm)
                </Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Planting date used</Text>
                <Text style={produceStyles.cropDetailValue}>5 Mar 2025</Text>
              </View>
            </View>

            <Text style={[produceStyles.breakdownSectionHeader, { marginTop: 6 }]}>Recorded milestones</Text>

            <View style={produceStyles.breakdownCard}>
              {[
                { label: 'Land preparation', val: '26 Feb 2025' },
                { label: 'Planting', val: '5 Mar 2025' },
                { label: 'Germination', val: '23 Mar 2025' },
                { label: 'Vegetative growth', val: '10 Apr 2025' },
                { label: 'Flowering', val: '28 Apr 2025' },
                { label: 'Crop development', val: '16 May 2025' },
                { label: 'Harvest', val: '3 Jun 2025' },
                { label: 'Harvest (recorded)', val: '30 May 2025' },
              ].map((item, idx) => (
                <View key={idx}>
                  {idx > 0 && <View style={produceStyles.dottedDivider} />}
                  <View style={produceStyles.trendTableRow}>
                    <Text style={produceStyles.cropDetailLabel}>{item.label}</Text>
                    <Text style={produceStyles.cropDetailValue}>{item.val}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── TAB 3: GROWTH HISTORY ─── */}
        {activePillTab === 'Growth history' && (
          <View>
            {[
              { date: '3 Jun 2025 · Ramesh Kumar (Farmer)', stage: 'Harvest (previous: Crop development)', rec: 'Recorded 3 Jun 2025, 08:00' },
              { date: '16 May 2025 · Ramesh Kumar (Farmer)', stage: 'Crop development (previous: Flowering)', rec: 'Recorded 16 May 2025, 08:00' },
              { date: '28 Apr 2025 · Ramesh Kumar (Farmer)', stage: 'Flowering (previous: Vegetative growth)', rec: 'Recorded 28 Apr 2025, 08:00' },
              { date: '10 Apr 2025 · Ramesh Kumar (Farmer)', stage: 'Vegetative growth (previous: Germination)', rec: 'Recorded 10 Apr 2025, 08:00' },
              { date: '23 Mar 2025 · Ramesh Kumar (Farmer)', stage: 'Germination (previous: Planting)', rec: 'Recorded 23 Mar 2025, 08:00' },
              { date: '5 Mar 2025 · Ramesh Kumar (Farmer)', stage: 'Planting (previous: Land preparation)', rec: 'Recorded 5 Mar 2025, 08:00' },
              { date: '26 Feb 2025 · Ramesh Kumar (Farmer)', stage: 'Land preparation', rec: 'Recorded 26 Feb 2025, 08:00' },
            ].map((item, idx) => (
              <View key={idx} style={produceStyles.historyEventCard}>
                <Text style={produceStyles.historyEventSub}>{item.date}</Text>
                <Text style={produceStyles.historyEventTitle}>{item.stage}</Text>
                <Text style={produceStyles.historyEventRec}>{item.rec}</Text>
              </View>
            ))}

            <View style={produceStyles.historyLockedCard}>
              <Text style={produceStyles.historyLockedText}>🔒  The history is append-only.</Text>
            </View>
          </View>
        )}

        {/* ─── TAB 4: NUTRIENTS ─── */}
        {activePillTab === 'Nutrients' && (
          <View style={produceStyles.breakdownCard}>
            {[
              { label: 'Nitrogen (N)', val: '22' },
              { label: 'Phosphorus (P₂O₅)', val: '12' },
              { label: 'Potassium (K₂O)', val: '18' },
              { label: 'Magnesium (MgO)', val: '3' },
              { label: 'Sulphur (SO₄)', val: '4' },
            ].map((item, idx) => (
              <View key={idx}>
                {idx > 0 && <View style={produceStyles.dottedDivider} />}
                <View style={produceStyles.trendTableRow}>
                  <Text style={produceStyles.cropDetailLabel}>{item.label}</Text>
                  <Text style={produceStyles.cropDetailValue}>{item.val}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── TAB 5: HARVEST ─── */}
        {activePillTab === 'Harvest' && (
          <View>
            <View style={produceStyles.breakdownCard}>
              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Actual harvest date</Text>
                <Text style={produceStyles.cropDetailValue}>30 May 2025</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Recorded quantity</Text>
                <Text style={produceStyles.cropDetailValue}>4,420 KG</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Recorded by</Text>
                <Text style={produceStyles.cropDetailValue}>Ramesh Kumar</Text>
              </View>
            </View>

            <Text style={[produceStyles.breakdownFootnote, { marginHorizontal: 16 }]}>
              No expected quantity was entered. None is calculated.{'\n'}
              A recorded harvest is not a purchase or a receipt; those belong to Purchase and inventory.
            </Text>
          </View>
        )}

        {/* ─── TAB 6: CROP HISTORY ─── */}
        {activePillTab === 'Crop history' && (
          <View>
            <View style={produceStyles.historyEventCard}>
              <Text style={produceStyles.historyEventTitle}>Tomato · Winter 2026</Text>
              <Text style={produceStyles.historyEventRec}>CR-2026-0017 · Planted 6 Oct 2026</Text>
            </View>

            <View style={produceStyles.historyEventCard}>
              <Text style={produceStyles.historyEventTitle}>Tomato · Summer 2025</Text>
              <Text style={produceStyles.historyEventRec}>CR-2025-0013 · Planted 13 Sep 2025 · Harvested 15 Dec 2025</Text>
            </View>
          </View>
        )}

        {/* ─── TAB 7: RELATED ─── */}
        {activePillTab === 'Related' && (
          <View>
            <View style={produceStyles.breakdownCard}>
              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Farm diary</Text>
                <Text style={produceStyles.cropDetailValue}>Farm diary entry linked</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Input log</Text>
                <Text style={produceStyles.cropDetailValue}>Input log entry linked</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Audit</Text>
                <Text style={produceStyles.cropDetailValue}>None linked</Text>
              </View>
            </View>

            <Text style={[produceStyles.breakdownFootnote, { marginHorizontal: 16 }]}>
              These records belong to other modules (Farm diary, Inputs & Pest Management, Audit Management). They are linked here, not duplicated.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Harvest Forecast & Insights Screen (Images 1, 2, 3, 4) ────────────────────

interface HarvestForecastInsightsScreenProps {
  onBack: () => void;
  onOpenExportModal: () => void;
  onOpenFilters?: () => void;
}

function HarvestForecastInsightsScreen({
  onBack,
  onOpenExportModal,
  onOpenFilters,
}: HarvestForecastInsightsScreenProps) {
  const [activeTab, setActiveTab] = useState<'forecast' | 'insights'>('forecast');
  const [timeFilter, setTimeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={produceStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={produceStyles.headerBanner}>
        <View style={produceStyles.headerTopRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={produceStyles.backBtnTouch}>
            <ProduceBackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={produceStyles.headerTitle}>Harvest Forecast & Insights</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Top Pill Tabs: [ Forecast ]  [ Insights ] */}
        <View style={produceStyles.forecastTabsContainer}>
          <TouchableOpacity
            style={[
              produceStyles.forecastTabButton,
              activeTab === 'forecast' && produceStyles.forecastTabButtonActive,
            ]}
            onPress={() => setActiveTab('forecast')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                produceStyles.forecastTabText,
                activeTab === 'forecast' && produceStyles.forecastTabTextActive,
              ]}
            >
              Forecast
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              produceStyles.forecastTabButton,
              activeTab === 'insights' && produceStyles.forecastTabButtonActive,
            ]}
            onPress={() => setActiveTab('insights')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                produceStyles.forecastTabText,
                activeTab === 'insights' && produceStyles.forecastTabTextActive,
              ]}
            >
              Insights
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── TAB 1: FORECAST (5th Image) ─── */}
        {activeTab === 'forecast' ? (
          <View>
            {/* Time Filter Pills: [ Next 30 days ] [ Next 60 days ] [ Next 90 days ] [ All ] */}
            <View style={produceStyles.timeFilterRow}>
              {['Next 30 days', 'Next 60 days', 'Next 90 days', 'All'].map((item) => {
                const isSelected = timeFilter === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[produceStyles.timeFilterBtn, isSelected && produceStyles.timeFilterBtnActive]}
                    onPress={() => setTimeFilter(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={[produceStyles.timeFilterText, isSelected && produceStyles.timeFilterTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Search Bar with Filter Sliders Icon */}
            <View style={[produceStyles.searchBarContainer, { marginHorizontal: adminSpacing.md, marginTop: 4, marginBottom: 12 }]}>
              <ProduceSearchIcon size={18} color="#8C7E74" />
              <TextInput
                style={produceStyles.searchInput}
                placeholder="Search common or scientific name"
                placeholderTextColor="#8C7E74"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                style={produceStyles.filterTouchBtn}
                onPress={onOpenFilters}
                activeOpacity={0.8}
              >
                <ProduceFilterSlidersIcon size={20} color={adminColors.brand} />
              </TouchableOpacity>
            </View>

            {/* 43 crop records count */}
            <Text style={produceStyles.forecastRecordCountText}>43 crop records</Text>

            {/* Card 1: Tomato · Ramesh Kumar (Exact 5th Image Match) */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Tomato · Ramesh Kumar</Text>
              <Text style={produceStyles.forecastCardSub}>Coonoor · PLT-00124-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 5 Mar 2025 · Harvest (7 of 7)</Text>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Expected harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>3 Jun 2025 (calculated)</Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>30 May 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity not entered · Updated 3 Jun 2025, 08:00
              </Text>
            </View>

            {/* Card 2: Carrot · Selvi */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Carrot · Selvi</Text>
              <Text style={produceStyles.forecastCardSub}>Coonoor · PLT-00131-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 21 Mar 2025 · Harvest (7 of 7)</Text>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Expected harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>29 Jun 2025 (calculated)</Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>2 Jul 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity 6,483 KG (farmer-entered) · Updated 29 Jun 2025, 08:00
              </Text>
            </View>

            {/* Card 3: Cabbage · Meena */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Cabbage · Meena</Text>
              <Text style={produceStyles.forecastCardSub}>Coonoor · PLT-00177-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 6 Apr 2025 · Harvest (7 of 7)</Text>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Expected harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>30 Jun 2025 (calculated)</Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>29 Jun 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity not entered · Updated 30 Jun 2025, 08:00
              </Text>
            </View>

            {/* Card 4: Beans · Lakshmi */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Beans · Lakshmi</Text>
              <Text style={produceStyles.forecastCardSub}>Coonoor · PLT-00203-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 22 Apr 2025 · Harvest (7 of 7)</Text>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Expected harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>26 Jun 2025 (calculated)</Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>2 Jul 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity 5,371 KG (farmer-entered) · Updated 26 Jun 2025, 08:00
              </Text>
            </View>

            {/* Card 5: Garlic · Senthil */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Garlic · Senthil</Text>
              <Text style={produceStyles.forecastCardSub}>Gudalur · PLT-00127-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 12 Aug 2025 · Harvest (7 of 7)</Text>
              <View style={{ marginVertical: 3 }}>
                <Text style={produceStyles.forecastBoldLabel}>
                  Expected harvest:{' '}
                  <Text style={produceStyles.forecastUnavailableText}>
                    Unavailable. No crop duration rule is configured for Garlic, so the forecast is unavailable.
                  </Text>
                </Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>10 Dec 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity not entered · Updated 10 Nov 2025, 08:00
              </Text>
            </View>

            {/* Card 6: Potato · Sundar */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Potato · Sundar</Text>
              <Text style={produceStyles.forecastCardSub}>Gudalur · PLT-00146-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 28 Aug 2025 · Harvest (7 of 7)</Text>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Expected harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>6 Dec 2025 (calculated)</Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>2 Dec 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity 15,015 KG (farmer-entered) · Updated 6 Dec 2025, 08:00
              </Text>
            </View>
          </View>
        ) : (
          /* ─── TAB 2: INSIGHTS (Images 2, 3, 4) ─── */
          <View>
            {/* Card 1: Recorded yield trend */}
            <View style={produceStyles.breakdownCard}>
              <Text style={produceStyles.sectionTitle}>Recorded yield trend</Text>
              <Text style={produceStyles.sectionSubtitle}>
                Date range 30 May 2025 to 28 Sep 2026 · Unit KG per acre, monthly average · 19 records · Source: recorded harvests and farm area
              </Text>
              {[
                { label: '25-05', pct: 60, val: '4,420 (1)' },
                { label: '25-06', pct: 95, val: '6,660 (1)' },
                { label: '25-07', pct: 42, val: '3,081 (2)' },
                { label: '25-09', pct: 50, val: '3,580 (2)' },
                { label: '25-10', pct: 60, val: '4,315 (3)' },
                { label: '25-12', pct: 55, val: '3,943 (3)' },
                { label: '26-01', pct: 60, val: '4,315 (3)' },
                { label: '26-08', pct: 28, val: '2,090 (1)' },
                { label: '26-09', pct: 70, val: '4,972 (3)' },
              ].map((item, idx) => (
                <View key={idx} style={produceStyles.trendBarRow}>
                  <Text style={produceStyles.trendBarLabel}>{item.label}</Text>
                  <View style={produceStyles.trendBarTrack}>
                    <View style={[produceStyles.trendBarFill, { width: `${item.pct}%` }]} />
                  </View>
                  <Text style={produceStyles.trendBarValue}>{item.val}</Text>
                </View>
              ))}
            </View>

            {/* Card 2: Best-performing crops */}
            <View style={produceStyles.breakdownCard}>
              <Text style={produceStyles.sectionTitle}>Best-performing crops</Text>
              <Text style={produceStyles.sectionSubtitle}>
                Date range 30 May 2025 to 28 Sep 2026 · Unit KG per acre, average · 19 records · Source: recorded harvests and farm area
              </Text>
              <Text style={[produceStyles.sectionSubtitle, { marginTop: 4, marginBottom: 12 }]}>
                Average recorded yield, KG per acre (proposed metric, to confirm)
              </Text>
              {[
                { name: 'Cabbage', pct: 92, val: '6,210 (4)' },
                { name: 'Potato', pct: 82, val: '5,473 (2)' },
                { name: 'Tomato', pct: 71, val: '4,715 (3)' },
                { name: 'Carrot', pct: 64, val: '4,263 (4)' },
                { name: 'Beans', pct: 32, val: '2,151 (4)' },
                { name: 'Garlic', pct: 27, val: '1,773 (2)' },
              ].map((item, idx) => (
                <View key={idx} style={produceStyles.cropBarRow}>
                  <Text style={produceStyles.cropBarLabel}>{item.name}</Text>
                  <View style={produceStyles.trendBarTrack}>
                    <View style={[produceStyles.trendBarFill, { width: `${item.pct}%` }]} />
                  </View>
                  <Text style={produceStyles.cropBarValue}>{item.val}</Text>
                </View>
              ))}
            </View>

            {/* Card 3: Seasonal crop patterns */}
            <View style={produceStyles.breakdownCard}>
              <Text style={produceStyles.sectionTitle}>Seasonal crop patterns</Text>
              <Text style={produceStyles.sectionSubtitle}>
                Harvested crops by season · Unit records · 20 records · Source: recorded harvests and farm area
              </Text>
              {[
                { title: 'Summer 2025 · Beans', count: '2' },
                { title: 'Summer 2025 · Cabbage', count: '2' },
                { title: 'Summer 2025 · Carrot', count: '1' },
                { title: 'Summer 2025 · Garlic', count: '1' },
                { title: 'Summer 2025 · Potato', count: '1' },
                { title: 'Summer 2025 · Tomato', count: '1' },
                { title: 'Winter 2025 · Beans', count: '1' },
                { title: 'Winter 2025 · Cabbage', count: '1' },
                { title: 'Winter 2025 · Carrot', count: '2' },
                { title: 'Winter 2025 · Garlic', count: '1' },
                { title: 'Winter 2025 · Potato', count: '1' },
                { title: 'Winter 2025 · Tomato', count: '2' },
                { title: 'Winter 2026 · Beans', count: '1' },
                { title: 'Winter 2026 · Cabbage', count: '1' },
                { title: 'Winter 2026 · Carrot', count: '1' },
                { title: 'Winter 2026 · Potato', count: '1' },
              ].map((row, idx) => (
                <View
                  key={idx}
                  style={[
                    produceStyles.trendTableRow,
                    idx > 0 && produceStyles.dottedDivider,
                  ]}
                >
                  <Text style={produceStyles.seasonalLabel}>{row.title}</Text>
                  <Text style={produceStyles.seasonalValue}>{row.count}</Text>
                </View>
              ))}
            </View>

            {/* Card 4: Planned versus actual harvest */}
            <View style={produceStyles.breakdownCard}>
              <Text style={produceStyles.sectionTitle}>Planned versus actual harvest</Text>
              <Text style={produceStyles.sectionSubtitle}>
                Expected (calculated or farmer-entered) against the recorded harvest · 18 records · 8 also have an expected quantity
              </Text>
              {[
                { crop: 'Tomato · CR-2025-0001', diff: '4 days before' },
                { crop: 'Carrot · CR-2025-0002', diff: '3 days after' },
                { crop: 'Cabbage · CR-2025-0003', diff: '1 days before' },
                { crop: 'Beans · CR-2025-0004', diff: '6 days after' },
                { crop: 'Potato · CR-2025-0006', diff: '2 days after' },
                { crop: 'Tomato · CR-2025-0007', diff: '5 days after' },
                { crop: 'Carrot · CR-2025-0008', diff: '1 days after' },
                { crop: 'Cabbage · CR-2025-0009', diff: '3 days before' },
              ].map((row, idx) => (
                <View
                  key={idx}
                  style={[
                    produceStyles.trendTableRow,
                    idx > 0 && produceStyles.dottedDivider,
                  ]}
                >
                  <Text style={produceStyles.seasonalLabel}>{row.crop}</Text>
                  <Text style={produceStyles.plannedDiffValue}>{row.diff}</Text>
                </View>
              ))}
              <Text style={[produceStyles.footnoteText, { marginTop: 8 }]}>Showing 8 of 18.</Text>
            </View>

            {/* Card 5: Revenue per zone */}
            <View style={produceStyles.breakdownCard}>
              <View style={produceStyles.revenueHeaderRow}>
                <Text style={produceStyles.sectionTitle}>Revenue per zone</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <ProduceFilterSlidersIcon size={20} color={adminColors.brandDeep} />
                </TouchableOpacity>
              </View>
              <Text style={produceStyles.sectionSubtitle}>Needs a defined revenue source</Text>

              <View style={produceStyles.revenueEmptyBox}>
                <ProduceMoneyNotAvailableIcon size={34} color="#606060" />
                <Text style={produceStyles.revenueEmptyTitle}>Not available</Text>
                <Text style={produceStyles.revenueEmptyDesc}>
                  The revenue source is not defined, so revenue per zone is not shown.
                </Text>
              </View>
            </View>

            {/* Export Report Button */}
            <TouchableOpacity
              style={produceStyles.exportReportButton}
              onPress={onOpenExportModal}
              activeOpacity={0.85}
            >
              <ProduceDownloadIcon size={20} color={adminColors.onBrand} />
              <Text style={produceStyles.exportReportButtonText}>Export Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Image 5: Export Crop Records Modal (Bottom Sheet) ──────────────────────────

interface ExportCropRecordsModalProps {
  visible: boolean;
  onClose: () => void;
  onDownloadCSV: () => void;
}

function ExportCropRecordsModal({
  visible,
  onClose,
  onDownloadCSV,
}: ExportCropRecordsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={produceStyles.modalBackdrop}>
        <Pressable style={produceStyles.modalDismissArea} onPress={onClose} />
        <View style={produceStyles.exportModalContent}>
          <Text style={produceStyles.exportModalTitle}>Export crop records</Text>

          <View style={produceStyles.exportInfoBox}>
            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.exportInfoLabel}>Rows</Text>
              <Text style={produceStyles.exportInfoValue}>43 crop records</Text>
            </View>
            <View style={produceStyles.dottedDivider} />
            <View style={[produceStyles.trendTableRow, { alignItems: 'flex-start', paddingTop: 8 }]}>
              <Text style={[produceStyles.exportInfoLabel, { width: 70 }]}>Columns</Text>
              <Text style={[produceStyles.exportInfoValue, { flex: 1, textAlign: 'right', lineHeight: 20 }]}>
                record, farmer ID, zone, plot, crop, variety, season, planting date, stage, expected harvest, status, recorded quantity
              </Text>
            </View>
          </View>

          <Text style={produceStyles.exportFootnote}>
            Expected harvest dates are exported as forecasts. Farmer phone numbers are not included.
          </Text>

          <View style={produceStyles.exportActionsRow}>
            <TouchableOpacity
              style={produceStyles.exportBtnOutline}
              onPress={onDownloadCSV}
              activeOpacity={0.75}
            >
              <Text style={produceStyles.exportBtnOutlineText}>Download CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={produceStyles.exportBtnOutline}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={produceStyles.exportBtnOutlineText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen 6: Crop History & Records Screen (Image 1) ──────────────────────────

interface CropHistoryRecordsScreenProps {
  onBack: () => void;
  onOpenCompareModal: () => void;
  onSelectCropRecord: (recordId: string) => void;
  onOpenFilters?: () => void;
  selectedCompareIds: string[];
  onToggleCompare: (recordId: string) => void;
}

function CropHistoryRecordsScreen({
  onBack,
  onOpenCompareModal,
  onSelectCropRecord,
  onOpenFilters,
  selectedCompareIds,
  onToggleCompare,
}: CropHistoryRecordsScreenProps) {
  const [searchTxt, setSearchTxt] = useState('');

  const historyRecords = [
    {
      id: 'CR-2026-0040',
      title: 'Potato · Winter 2026',
      badge: 'Harvested',
      farmerLine: 'CR-2026-0040 · FMR-00221 · Priya',
      plotLine: 'Kotagiri · PLT-00221-2',
      datesLine: 'Planted 17 Jun 2026 · Harvested 28 Sep 2026',
      quantityLine: 'Quantity 5,225 KG · Source Farmer entry',
    },
    {
      id: 'CR-2026-0031',
      title: 'Cabbage · Winter 2026',
      badge: 'Harvested',
      farmerLine: 'CR-2026-0031 · FMR-00127 · Senthil',
      plotLine: 'Gudalur · PLT-00127-2',
      datesLine: 'Planted 30 Jun 2026 · Harvested 26 Sep 2026',
      quantityLine: 'Quantity 5,700 KG · Source Farmer entry',
    },
    {
      id: 'CR-2026-0024',
      title: 'Carrot · Winter 2026',
      badge: 'Harvested',
      farmerLine: 'CR-2026-0024 · FMR-00146 · Sundar',
      plotLine: 'Gudalur · PLT-00146-1',
      datesLine: 'Planted 9 Jun 2026 · Harvested 20 Sep 2026',
      quantityLine: 'Quantity 9,975 KG · Source Farmer entry',
    },
  ];

  return (
    <View style={produceStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={produceStyles.headerBanner}>
        <View style={produceStyles.headerTopRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={produceStyles.backBtnTouch}>
            <ProduceBackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={produceStyles.headerTitle}>Crop History & Records</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Search Bar */}
        <View style={[produceStyles.searchBarContainer, { marginHorizontal: adminSpacing.md, marginTop: adminSpacing.md, marginBottom: 12 }]}>
          <ProduceSearchIcon size={18} color="#8C7E74" />
          <TextInput
            style={produceStyles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor="#8C7E74"
            value={searchTxt}
            onChangeText={setSearchTxt}
          />
          <TouchableOpacity
            style={produceStyles.filterTouchBtn}
            onPress={onOpenFilters}
            activeOpacity={0.8}
          >
            <ProduceFilterSlidersIcon size={20} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Compare Button */}
        <TouchableOpacity
          style={produceStyles.comparePillButton}
          onPress={onOpenCompareModal}
          activeOpacity={0.8}
        >
          <ProduceCompareIcon size={18} color={adminColors.brandDeep} />
          <Text style={produceStyles.comparePillButtonText}>
            Compare ({selectedCompareIds.length})
          </Text>
        </TouchableOpacity>

        {/* Subtitle count */}
        <Text style={produceStyles.historyCyclesCount}>16 completed 2025 cycles</Text>

        {/* List of cards */}
        {historyRecords.map((item) => {
          const isSelected = selectedCompareIds.includes(item.id);
          return (
            <View key={item.id} style={produceStyles.historyCard}>
              <View style={produceStyles.historyCardTopRow}>
                <Text style={produceStyles.historyCardTitle}>{item.title}</Text>
                <View style={produceStyles.harvestedBadge}>
                  <Text style={produceStyles.harvestedBadgeText}>{item.badge}</Text>
                </View>
              </View>

              <Text style={produceStyles.historyCardMeta}>{item.farmerLine}</Text>
              <Text style={produceStyles.historyCardMeta}>{item.plotLine}</Text>
              <Text style={produceStyles.historyCardMeta}>{item.datesLine}</Text>
              <Text style={produceStyles.historyCardMeta}>{item.quantityLine}</Text>

              <View style={produceStyles.historyCardActionsRow}>
                <TouchableOpacity
                  onPress={() => onSelectCropRecord(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={produceStyles.historyActionLink}>Open full record</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onToggleCompare(item.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      produceStyles.historyActionLink,
                      isSelected && { color: adminColors.brand, fontWeight: '800' },
                    ]}
                  >
                    {isSelected ? 'Selected to compare ✓' : 'Select to compare'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Compare Crop Cycles Modal (Image 1 popup) ──────────────────────────────────

interface CompareCropCyclesModalProps {
  visible: boolean;
  onClose: () => void;
  onExportDetails: () => void;
}

function CompareCropCyclesModal({
  visible,
  onClose,
  onExportDetails,
}: CompareCropCyclesModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={produceStyles.modalBackdrop}>
        <Pressable style={produceStyles.modalDismissArea} onPress={onClose} />
        <View style={produceStyles.exportModalContent}>
          <Text style={produceStyles.exportModalTitle}>Compare crop cycles</Text>

          {/* Comparison Table Box */}
          <View style={produceStyles.compareTableBox}>
            {/* Table Header Row */}
            <View style={produceStyles.compareTableRow}>
              <View style={{ width: 85 }} />
              <Text style={produceStyles.compareColHeader}>CR-2026-0040</Text>
              <Text style={produceStyles.compareColHeader}>CR-2026-0031</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 1: Crop */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Crop</Text>
              <Text style={produceStyles.compareRowValue}>Potato</Text>
              <Text style={produceStyles.compareRowValue}>Cabbage</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 2: Season */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Season</Text>
              <Text style={produceStyles.compareRowValue}>Winter 2026</Text>
              <Text style={produceStyles.compareRowValue}>Winter 2026</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 3: Zone / plot */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Zone / plot</Text>
              <Text style={produceStyles.compareRowValue}>Kotagiri · PLT-00221-2</Text>
              <Text style={produceStyles.compareRowValue}>Gudalur · PLT-00127-2</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 4: Quantity */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Quantity</Text>
              <Text style={produceStyles.compareRowValue}>5,225 KG</Text>
              <Text style={produceStyles.compareRowValue}>5,700 KG</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 5: Yield */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Yield</Text>
              <Text style={produceStyles.compareRowValue}>5,225 KG/acre</Text>
              <Text style={produceStyles.compareRowValue}>5,700 KG/acre</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 6: Planting to harvest */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Planting to harvest</Text>
              <Text style={produceStyles.compareRowValue}>103 days</Text>
              <Text style={produceStyles.compareRowValue}>88 days</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[produceStyles.exportActionsRow, { marginTop: 20 }]}>
            <TouchableOpacity
              style={produceStyles.exportDetailsBtn}
              onPress={onExportDetails}
              activeOpacity={0.75}
            >
              <Text style={produceStyles.exportDetailsBtnText}>Export Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={produceStyles.exportBtnOutline}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={produceStyles.exportBtnOutlineText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Produce Control Stylesheet ────────────────────────────────────────────────

const produceStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header Banner in Terracotta Brand Orange
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTopRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtnTouch: {
    paddingRight: 4,
    paddingVertical: 4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 13,
    marginTop: 4,
    paddingLeft: 34,
  },
  headerRightIconTouch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Overview Card (Screen 1 & 2)
  overviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    ...adminShadow.sm,
    marginBottom: adminSpacing.lg,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  overviewLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.brandDeep,
    flex: 1,
    paddingRight: 8,
  },
  overviewValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  dottedDivider: {
    borderBottomWidth: 1,
    borderColor: '#E8E0D7',
    borderStyle: 'dashed',
    marginVertical: 8,
  },

  // Month Navigation
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.xs,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: '#E2DCD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // Calendar Grid
  calendarContainer: {
    backgroundColor: 'transparent',
    marginTop: adminSpacing.xs,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
    paddingHorizontal: 2,
  },
  weekdayCell: {
    width: '13%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  dayCellEmpty: {
    width: '13%',
    height: 48,
  },
  dayCell: {
    width: '13%',
    height: 48,
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayCellOrangeBorder: {
    borderColor: adminColors.brand,
    borderWidth: 2,
  },
  dayCellBrownBorder: {
    borderColor: adminColors.brandDeep,
    borderWidth: 2,
  },
  dayCellSelected: {
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
  },
  dayNumTextBold: {
    fontWeight: '800',
  },
  dayDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    marginTop: 2,
    minHeight: 8,
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.8,
    borderColor: '#2E7D32',
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: adminSpacing.md,
    paddingHorizontal: 2,
    rowGap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  legendRing: {
    width: 8.5,
    height: 8.5,
    borderRadius: 4.5,
    borderWidth: 1.8,
    borderColor: '#2E7D32',
  },
  legendText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#4B5563',
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: '#E5DFD7',
    paddingHorizontal: adminSpacing.md,
    height: 46,
    marginTop: adminSpacing.lg,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: adminSpacing.sm,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  filterTouchBtn: {
    padding: adminSpacing.xs,
  },

  // Date Section Header
  dateSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },

  // Activity Card
  activityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.sm,
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  recordedBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  recordedBadgeText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
  activityMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Footnote
  explanatoryFootnote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginVertical: adminSpacing.md,
  },

  // Quick Actions Section
  quickActionsSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: adminSpacing.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE7E1',
    minHeight: 115,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: adminSpacing.sm,
    lineHeight: 16,
  },

  // Modal / Bottom Sheet (Screen 3)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xl + 20,
  },
  filtersModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  filterFieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  filterDropdown: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9D2C9',
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    marginTop: 6,
    marginBottom: adminSpacing.md,
  },
  filterDropdownValue: {
    fontSize: 14,
    color: adminColors.ink,
    fontWeight: '500',
  },
  filterButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  filterApplyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8BFB5',
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8BFB5',
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },

  // Zone & Crop Breakdown (Screen 4)
  breakdownMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  breakdownMetricCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
  },
  breakdownMetricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.ink,
  },
  breakdownMetricValueSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  breakdownMetricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  breakdownFootnote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginVertical: adminSpacing.sm,
  },
  breakdownSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  chipScrollRow: {
    flexDirection: 'row',
    marginBottom: adminSpacing.sm,
  },
  categoryChip: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D2C9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  categoryChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  zonePanelCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.sm,
  },
  zonePanelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  zonePanelFarm: {
    fontSize: 13.5,
    color: '#6B7280',
  },
  zonePanelDetail: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  zonePanelDivider: {
    height: 1,
    backgroundColor: '#EDE7E1',
    marginVertical: 8,
  },
  cropRecordCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.md,
  },
  cropRecordTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropRecordName: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  growingBadge: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  growingBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D97706',
  },
  cropRecordSub: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 4,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  segmentGreen: {
    backgroundColor: '#2E7D32',
  },
  segmentOrange: {
    backgroundColor: '#E67E22',
  },
  segmentGray: {
    backgroundColor: '#E5DFD7',
  },
  cropRecordHarvest: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Crop Record Detail (Screen 5)
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailRowLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailRowValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#EDE7E1',
    marginVertical: 6,
  },
  detailFootnote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginTop: 10,
  },
  openFarmerProfileTouch: {
    marginTop: 12,
  },
  openFarmerProfileText: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brand,
  },
  growthStagesCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.md,
  },
  growthStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  stageRowCurrent: {
    backgroundColor: '#FFF4EB',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -4,
  },
  stageNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageNameText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  stageNameTextCurrent: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  stageDateText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  stageDateTextCurrent: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  stageDottedDivider: {
    borderBottomWidth: 1,
    borderColor: '#E8E0D7',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  bottomCropCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.sm,
  },

  // General Card & Section Titles
  breakdownCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    padding: adminSpacing.md,
    marginHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: adminColors.muted,
    lineHeight: 16,
    marginBottom: adminSpacing.sm,
  },
  footnoteText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },

  // Detail table and tabs
  cropDetailLabel: {
    fontSize: 13.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  cropDetailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F1A17',
  },
  historyEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    padding: 14,
    marginHorizontal: adminSpacing.md,
    marginBottom: 10,
  },
  historyEventTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F1A17',
    marginBottom: 2,
  },
  historyEventSub: {
    fontSize: 12.5,
    color: '#6B7280',
    marginBottom: 4,
  },
  historyEventRec: {
    fontSize: 12,
    color: '#8A7E75',
  },
  historyLockedCard: {
    borderWidth: 1,
    borderColor: '#EDE7E1',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: adminSpacing.md,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    marginBottom: 14,
  },
  historyLockedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A4E45',
  },
  timeFilterRow: {
    flexDirection: 'row',
    marginHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    gap: 8,
  },
  timeFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: '#EDE7E1',
  },
  timeFilterBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  timeFilterText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  timeFilterTextActive: {
    color: adminColors.onBrand,
  },
  forecastRecordCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.muted,
    marginHorizontal: adminSpacing.md,
    marginBottom: 10,
  },

  // Harvest Forecast & Insights (Screen 1 & 2 of new prompt)
  forecastTabsContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: adminSpacing.md,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  forecastTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  forecastTabButtonActive: {
    backgroundColor: adminColors.brand,
  },
  forecastTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  forecastTabTextActive: {
    color: adminColors.onBrand,
  },

  forecastCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    padding: adminSpacing.md,
    marginHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  forecastCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1A17',
    marginBottom: 2,
  },
  forecastCardSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7A6E65',
    marginBottom: 6,
  },
  forecastCardLine: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B3E36',
    marginBottom: 6,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  forecastBoldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F1A17',
  },
  forecastBoldVal: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#2A201A',
  },
  forecastUnavailableText: {
    color: '#D9534F',
    fontWeight: '500',
  },
  forecastCardFooter: {
    fontSize: 12,
    color: '#8A7E75',
    marginTop: 6,
    fontWeight: '400',
  },

  // Trend Bars & Insights Metrics
  trendBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  trendBarLabel: {
    width: 46,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6E6259',
  },
  trendBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#EBE5DC',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  trendBarFill: {
    height: '100%',
    backgroundColor: adminColors.brand,
    borderRadius: 5,
  },
  trendBarValue: {
    width: 76,
    textAlign: 'right',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F1A17',
  },

  cropBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  cropBarLabel: {
    width: 65,
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3E36',
  },
  cropBarValue: {
    width: 76,
    textAlign: 'right',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F1A17',
  },

  trendTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  seasonalLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#3A2E26',
    flex: 1,
  },
  seasonalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F1A17',
  },
  plannedDiffValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F1A17',
  },

  revenueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueEmptyBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 14,
    paddingVertical: 26,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#FCFAF7',
  },
  revenueEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1A17',
    marginTop: 10,
  },
  revenueEmptyDesc: {
    fontSize: 13,
    color: '#7A6E65',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  exportReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 50,
    marginHorizontal: adminSpacing.md,
    marginTop: adminSpacing.sm,
    marginBottom: 30,
    gap: 8,
  },
  exportReportButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: adminColors.onBrand,
  },

  // Export Crop Records Modal (Image 5)
  exportModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: adminSpacing.lg,
    paddingBottom: 36,
  },
  exportModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F1A17',
    marginBottom: adminSpacing.md,
  },
  exportInfoBox: {
    borderWidth: 1,
    borderColor: '#EBE4D8',
    borderRadius: 14,
    padding: adminSpacing.md,
    backgroundColor: '#FFFFFF',
  },
  exportInfoLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#7A6E65',
  },
  exportInfoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F1A17',
  },
  exportFootnote: {
    fontSize: 12.5,
    color: '#7A6E65',
    marginTop: 14,
    marginBottom: 20,
    lineHeight: 18,
  },
  exportActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exportBtnOutline: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DED6CB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  exportBtnOutlineText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },

  // Crop History & Records (New Mockup)
  comparePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    height: 46,
    marginHorizontal: adminSpacing.md,
    marginBottom: 12,
    gap: 8,
  },
  comparePillButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  historyCyclesCount: {
    fontSize: 13,
    color: adminColors.muted,
    marginHorizontal: adminSpacing.md,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    padding: adminSpacing.md,
    marginHorizontal: adminSpacing.md,
    marginBottom: 12,
  },
  historyCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1A17',
  },
  harvestedBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  harvestedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  historyCardMeta: {
    fontSize: 12.5,
    color: '#6B7280',
    marginBottom: 3,
    lineHeight: 18,
  },
  historyCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 20,
  },
  historyActionLink: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Compare Modal
  compareTableBox: {
    borderWidth: 1,
    borderColor: '#EBE4D8',
    borderRadius: 14,
    padding: adminSpacing.md,
    backgroundColor: '#FFFFFF',
  },
  compareTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  compareColHeader: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F1A17',
    textAlign: 'center',
  },
  compareRowLabel: {
    width: 85,
    fontSize: 12.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  compareRowValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#1F1A17',
    textAlign: 'center',
  },
  exportDetailsBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  exportDetailsBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brand,
  },
});

// ─── Main Screen Component ────────────────────────────────────────────────────

export function TohfaAdminDashboardScreen({
  onSignOut,
  onNavigate,
  onSwitchRole,
  initialTab,
}: TohfaAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<TohfaAdminTab>(
    initialTab === 'Profile' ? 'Profile' : 'Home'
  );
  const [user, setUser] = useState<UserMe | null>(null);

  // Inputs & Pest Management Module State (Image 1/2: home, Image 3: catalog, Images 1-3: add_input, Image 5: input_detail, Image 1: pest_library, Images 2-5: add_pest, Image 1: pest_incidents, Image 2-4: incident_detail)
  const [inputsPestScreen, setInputsPestScreen] = useState<
    'home' | 'catalog' | 'add_input' | 'input_detail' | 'pest_library' | 'add_pest' | 'pest_incidents' | 'incident_detail' | null
  >(null);
  const [selectedCatalogInput, setSelectedCatalogInput] = useState<CatalogInputItem | undefined>(undefined);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | undefined>(undefined);

  // Produce Control Module State (Screen 1/2: calendar, Screen 4: zoneBreakdown, Screen 5: cropDetail, Screen 6: harvestForecast, Screen 7: cropHistory)
  const [produceControlScreen, setProduceControlScreen] = useState<
    'calendar' | 'zoneBreakdown' | 'cropDetail' | 'harvestForecast' | 'cropHistory' | null
  >(null);
  const [showProduceFiltersModal, setShowProduceFiltersModal] = useState(false);
  const [showExportCropModal, setShowExportCropModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>(['CR-2026-0040', 'CR-2026-0031']);
  const [produceFilterFarmer, setProduceFilterFarmer] = useState('All');
  const [produceFilterZone, setProduceFilterZone] = useState('All');
  const [produceFilterCrop, setProduceFilterCrop] = useState('All');
  const [produceFilterSeason, setProduceFilterSeason] = useState('All');
  const [produceFilterGrowthStage, setProduceFilterGrowthStage] = useState('All');

  // Toggle state to hide / show cards as requested by user
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);

  // Search query & Date filter
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('30 days');
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('09:30 - All Warehouses');

  // Work Queue State (M1-S03 & M1-S03a)
  const [workQueueSearch, setWorkQueueSearch] = useState('');
  const [showWorkQueueFilterModal, setShowWorkQueueFilterModal] = useState(false);
  const [taskTypeFilter, setTaskTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dueDateFilter, setDueDateFilter] = useState('Any');
  const [warehouseFilter, setWarehouseFilter] = useState('Any');
  const [assignedToFilter, setAssignedToFilter] = useState('Anyone');
  const [sortByFilter, setSortByFilter] = useState('Due date, then newest');
  const [activePickerField, setActivePickerField] = useState<'type' | 'status' | 'due' | 'wh' | 'assign' | 'sort' | null>(null);

  // Sales & Finance Overview State (M1-S04)
  const [showFinanceFilterModal, setShowFinanceFilterModal] = useState(false);

  // Subscreen navigation
  const [dashboardSubScreen, setDashboardSubScreen] = useState<
    'listingApproval' | 'scheduleAudit' | 'support' | 'reportBuilder' | 'pendingApplications' | null
  >(null);
  const [selectedAdminFarmer, setSelectedAdminFarmer] = useState<FarmerListItem | null>(null);
  const [selectedAdminApplication, setSelectedAdminApplication] = useState<any>(null);
  const [farmerSubScreen, setFarmerSubScreen] = useState<'detail' | 'map' | 'scorecard' | null>(null);
  const [salesSubScreen, setSalesSubScreen] = useState<
    'overview' | 'online' | 'market' | 'horeca' | 'b2b' | 'fulfillment' | 'invoice' | 'returns'
  >('overview');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<OnlineOrderItem | null>(null);
  const [selectedSalesB2B, setSelectedSalesB2B] = useState<B2BAccount | null>(null);
  const [reportsSubScreen, setReportsSubScreen] = useState<
    'analytics' | 'pl' | 'farmerPerformance' | 'warehouseOps' | 'builder' | 'alerts' | 'announcements' | 'allRecent' | null
  >(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => { });
  }, []);

  const adminName = user?.fullName ?? 'Admin';
  const adminDisplayName =
    adminName.toLowerCase().includes('admin') || adminName.toLowerCase().includes('platform')
      ? 'Admin'
      : adminName.split(' ')[0] || 'Admin';

  const handleRefresh = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setLastUpdated(`${hours}:${mins} - All Warehouses`);
  };

  const handleOpenPendingApplications = () => {
    if (onNavigate) {
      onNavigate('AdminPendingApplications');
    } else {
      setDashboardSubScreen('pendingApplications');
    }
  };

  const handleOpenListingApproval = () => {
    setDashboardSubScreen('listingApproval');
  };

  const handleOpenScheduleAudit = () => {
    if (onNavigate) {
      onNavigate('AuditCalendar');
    } else {
      setDashboardSubScreen('scheduleAudit');
    }
  };

  const handleOpenSupport = () => {
    if (onNavigate) {
      onNavigate('AdminSupport');
    } else {
      setDashboardSubScreen('support');
    }
  };

  const workQueueTasks = [
    {
      id: 'tsk_1',
      title: 'Purchase exception',
      badge: 'Exception',
      badgeTone: 'danger' as const,
      name: 'Arun',
      code: 'TSK-PO-2026-00307 · PO-2026-00307',
      detail: 'Quality discrepancy recorded',
      created: 'Created 09 Oct 2026',
      actionLabel: 'Review Exception',
      onAction: () => {
        if (onNavigate) onNavigate('PurchaseOrders');
        else Alert.alert('Review Exception', 'Opening purchase exception PO-2026-00307.');
      },
    },
    {
      id: 'tsk_2',
      title: 'Farmer application',
      badge: 'Pending',
      badgeTone: 'warning' as const,
      name: 'Sathish Kumar',
      code: 'TSK-APP-2026-0101 · APP-2026-0101',
      detail: 'Awaiting review',
      created: 'Created 05 Oct 2026',
      actionLabel: 'Review Application',
      onAction: () => {
        handleOpenPendingApplications();
      },
    },
    {
      id: 'tsk_3',
      title: 'Audit follow-up',
      badge: 'Overdue',
      badgeTone: 'danger' as const,
      name: 'Vijay',
      code: 'TSK-AUD-2026-0052 · AUD-2026-0052',
      detail: 'Audit date passed without completion',
      created: 'Created 08 Oct 2026 · Due 08 Oct 2026',
      actionLabel: 'View Audit',
      onAction: () => {
        handleOpenScheduleAudit();
      },
    },
  ];

  interface MetricCardData {
    id: string;
    title: string;
    value: string;
    subtitle: string;
    tone?: 'default' | 'danger' | 'warning' | 'success';
    onPress: () => void;
  }

  // 11 Metric Cards matching user mockup
  const allMetricCards: MetricCardData[] = [
    {
      id: 'farmer_applications',
      title: 'Farmer applications',
      value: '4',
      subtitle: '1 documents requested',
      onPress: handleOpenPendingApplications,
    },
    {
      id: 'active_farmers',
      title: 'Active farmers',
      value: '20',
      subtitle: 'of 24 registered',
      onPress: () => {
        if (onNavigate) onNavigate('AdminAllFarmers');
        else setActiveTab('Farmers');
      },
    },
    {
      id: 'audits',
      title: 'Upcoming / overdue audits',
      value: '2/1',
      subtitle: 'upcoming · overdue',
      onPress: handleOpenScheduleAudit,
    },
    {
      id: 'open_exceptions',
      title: 'Open exceptions',
      value: '3',
      subtitle: 'queue items blocked',
      onPress: () => setActiveTab('WorkQueue'),
    },
    {
      id: 'produce_activity',
      title: 'Produce activity',
      value: '4',
      subtitle: '5 pending review',
      onPress: () => {
        setProduceControlScreen('calendar');
        setActiveTab('More');
      },
    },
    {
      id: 'purchase_activity',
      title: 'Purchase activity',
      value: '3',
      subtitle: '3 awaiting receipt',
      onPress: () => {
        if (onNavigate) onNavigate('PurchaseOrders');
      },
    },
    {
      id: 'sales_and_orders',
      title: 'Sales and orders',
      value: '₹3,33,660',
      subtitle: '▼ 27% vs previous 30 days',
      onPress: () => setActiveTab('Finance'),
    },
    {
      id: 'warehouse_exceptions',
      title: 'Warehouse exceptions',
      value: '3',
      subtitle: '1 low stock · 2 discrepancies',
      onPress: () => {
        if (onNavigate) onNavigate('MainWarehouseAdmin');
      },
    },
    {
      id: 'finance_attention',
      title: 'Finance attention',
      value: '3',
      subtitle: '1 awaiting approval · 2 on hold',
      onPress: () => setActiveTab('Finance'),
    },
    {
      id: 'customer_support',
      title: 'Customer support',
      value: '3',
      subtitle: '3 open tickets',
      onPress: handleOpenSupport,
    },
    {
      id: 'staff_operations',
      title: 'Staff operations',
      value: '2',
      subtitle: '3 salary payments pending',
      onPress: () => {
        if (onNavigate) onNavigate('Staff');
      },
    },
  ];

  // If collapsed, hide extra cards and show only the first 6 cards matching mockup; if expanded show all 11
  const displayedMetrics = showAllMetrics ? allMetricCards : allMetricCards.slice(0, 6);

  // Quick action items matching user mockup
  const allQuickActions = [
    {
      id: 'qa_farmers',
      label: 'Review farmer\napplications',
      icon: <QuickUserSearchIcon />,
      action: handleOpenPendingApplications,
    },
    {
      id: 'qa_audit',
      label: 'Open audit\ncalendar',
      icon: <CalendarIcon size={24} />,
      action: handleOpenScheduleAudit,
    },
    {
      id: 'qa_prices',
      label: 'Manage retail\nprices',
      icon: <QuickTagIcon />,
      action: () => {
        if (onNavigate) onNavigate('RetailPricing');
      },
    },
    {
      id: 'qa_purchases',
      label: 'Review purchases\nand payouts',
      icon: <QuickReceiptIcon />,
      action: () => {
        if (onNavigate) onNavigate('PurchaseOrders');
      },
    },
    {
      id: 'qa_sales',
      label: 'Review sales and\ninvoices',
      icon: <QuickBagIcon />,
      action: () => setActiveTab('Finance'),
    },
    {
      id: 'qa_reports',
      label: 'Open operational\nreports',
      icon: <QuickDocIcon />,
      action: () => setActiveTab('Reports'),
    },
    {
      id: 'qa_finance',
      label: 'Review finance\nand payouts',
      icon: <QuickWalletIcon />,
      action: () => setActiveTab('Finance'),
    },
    {
      id: 'qa_inputs',
      label: 'Manage inputs\nand pest',
      icon: <QuickLeafIcon />,
      action: () => {
        setActiveTab('More');
        setInputsPestScreen('home');
      },
    },
    {
      id: 'qa_support',
      label: 'Customer support\nand refunds',
      icon: <QuickSupportIcon />,
      action: handleOpenSupport,
    },
    {
      id: 'qa_warehouse',
      label: 'Inventory and\nwarehouse',
      icon: <QuickWarehouseIcon />,
      action: () => {
        if (onNavigate) onNavigate('MainWarehouseAdmin');
      },
    },
    {
      id: 'qa_staff',
      label: 'Manage staff\nand salary',
      icon: <QuickBadgeStaffIcon />,
      action: () => {
        if (onNavigate) onNavigate('Staff');
      },
    },
  ];

  const displayedActions = showAllActions ? allQuickActions : allQuickActions.slice(0, 6);
  const isInputsScreen = activeTab === 'More' && inputsPestScreen !== null;
  const isProduceScreen = activeTab === 'More' && produceControlScreen !== null;
  const isBrandHeaderActive = isProduceScreen || isInputsScreen;

  return (
    <SafeAreaView style={[styles.root, isBrandHeaderActive && { backgroundColor: adminColors.brand }]}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={[styles.container, isBrandHeaderActive && { backgroundColor: adminColors.canvas }]}>
        {/* ══════════════════════════════════════════════════════════════════════
            HOME DASHBOARD (M1-S01)
           ══════════════════════════════════════════════════════════════════════ */}
        {(activeTab === 'Home' || activeTab === 'Dashboard') && (
          dashboardSubScreen === 'listingApproval' ? (
            <ListingApprovalQueueScreen
              onBack={() => setDashboardSubScreen(null)}
              onApprove={(id) => {
                Alert.alert('Listing Approved', `Listing #${id} has been approved.`);
              }}
              onCounter={(id) => {
                Alert.alert('Counter Offer', `Counter offer sent for listing #${id}.`);
              }}
              onReject={(id) => {
                Alert.alert('Listing Rejected', `Listing #${id} has been rejected.`);
              }}
            />
          ) : dashboardSubScreen === 'scheduleAudit' ? (
            <FinancialDashboardScreen
              title="Schedule Audit"
              subtitle="Platform-wide audit schedule & compliance overview · September 2026"
              onBack={() => setDashboardSubScreen(null)}
              onNavigate={(s) => {
                if (onNavigate) onNavigate(s);
              }}
            />
          ) : dashboardSubScreen === 'support' ? (
            <AdminSupportScreen onBack={() => setDashboardSubScreen(null)} />
          ) : dashboardSubScreen === 'reportBuilder' ? (
            <ReportBuilderScreen onBack={() => setDashboardSubScreen(null)} />
          ) : dashboardSubScreen === 'pendingApplications' ? (
            <AdminPendingApplicationsScreen
              onBack={() => setDashboardSubScreen(null)}
              onSelectApplication={() => {
                if (onNavigate) onNavigate('AdminPendingApplications');
              }}
            />
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Header Banner with Vector Gradient */}
              <View style={styles.headerBanner}>
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
                  <Defs>
                    <LinearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={adminColors.brand} />
                      <Stop offset="1" stopColor={adminColors.brand} stopOpacity={0.92} />
                    </LinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#adminGrad)" />
                </Svg>

                <View style={styles.headerTopRow}>
                  <View style={styles.headerLeftCol}>
                    <View style={styles.headerBrandTitleRow}>
                      <HomeHeaderIcon size={20} />
                      <Text style={styles.headerBrandText}>TOHFA Admin</Text>
                    </View>
                    <Text style={styles.headerDateText}>Thursday, 24 September 2026</Text>
                  </View>

                  <View style={styles.headerIconsRow}>
                    <TouchableOpacity
                      style={styles.headerIconButton}
                      onPress={() => {
                        if (onNavigate) onNavigate('SystemAlerts');
                        else setActiveTab('Reports');
                      }}
                      activeOpacity={0.8}
                    >
                      <BellHeaderIcon size={20} />
                      <View style={styles.notificationDot} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.headerIconButton}
                      onPress={() => setActiveTab('Profile')}
                      activeOpacity={0.8}
                    >
                      <ProfileHeaderIcon size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 2. Floating "Good morning, Admin" Summary Card */}
              <View style={styles.greetingCard}>
                <View style={styles.greetingTopRow}>
                  <Text style={styles.greetingTitle} numberOfLines={1}>
                    Good morning, {adminDisplayName}
                  </Text>
                  <View style={styles.roleBadgePill}>
                    <Text style={styles.roleBadgeText}>TOHFA Admin</Text>
                  </View>
                </View>

                <Text style={styles.greetingSubTitle}>Today’s operational summary</Text>
                <Text style={styles.greetingDateStamp}>Mon, 13 Oct 2026 · IST</Text>

                <View style={styles.greetingBottomRow}>
                  <Text style={styles.lastUpdatedText}>Last updated {lastUpdated}</Text>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefresh}
                    activeOpacity={0.7}
                  >
                    <RefreshIcon />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3. Search and Date Range Filter Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <SearchIcon />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search farmers, crops, orders, customers, staff"
                    placeholderTextColor={adminColors.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <TouchableOpacity activeOpacity={0.7}>
                    <FilterSlidersIcon />
                  </TouchableOpacity>
                </View>

                <View style={styles.dateFilterContainer}>
                  <TouchableOpacity
                    style={styles.dateFilterButton}
                    onPress={() => setShowDateRangeModal(true)}
                    activeOpacity={0.8}
                  >
                    <CalendarIcon />
                    <Text style={styles.dateFilterText}>{dateRange}</Text>
                    <ChevronDownIcon />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4. Metric Cards (using reusable OverviewDashboardCard) */}
              <View style={styles.sectionContainer}>
                <OverviewCardsGrid>
                  {displayedMetrics.map((item) => (
                    <OverviewDashboardCard
                      key={item.id}
                      title={item.title}
                      value={item.value}
                      subtitle={item.subtitle}
                      tone={item.tone ?? 'default'}
                      titlePosition="top"
                      onPress={item.onPress}
                    />
                  ))}
                </OverviewCardsGrid>

                {/* Show more metrics / Show fewer metrics Toggle Button */}
                <TouchableOpacity
                  style={styles.toggleMetricsButton}
                  onPress={() => setShowAllMetrics((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.toggleMetricsText}>
                    {showAllMetrics ? 'Show fewer metrics' : 'Show more metrics'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 5. "Needs your attention" Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>Needs your attention</Text>

                {/* Card 1: Overdue Audit */}
                <View style={styles.attentionCard}>
                  <View style={styles.attentionTopRow}>
                    <Text style={styles.attentionCodeTitle}>Audit · AUD-2026-0051</Text>
                    <View style={styles.badgeOverdue}>
                      <Text style={styles.badgeOverdueText}>Overdue</Text>
                    </View>
                  </View>
                  <Text style={styles.attentionName}>Ramesh Kumar</Text>
                  <Text style={styles.attentionDescription}>
                    The scheduled date has passed and the audit is not completed.
                  </Text>
                  <Text style={styles.attentionMeta}>Created 2 Oct 2026 · Due 2 Oct 2026</Text>
                  <TouchableOpacity
                    style={styles.attentionActionBtn}
                    onPress={handleOpenScheduleAudit}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.attentionActionBtnText}>View Audit</Text>
                  </TouchableOpacity>
                </View>

                {/* Card 2: Upcoming Audit */}
                <View style={styles.attentionCard}>
                  <View style={styles.attentionTopRow}>
                    <Text style={styles.attentionCodeTitle}>Upcoming audit · AUD-2026-0053</Text>
                    <View style={styles.badgeUpcoming}>
                      <Text style={styles.badgeUpcomingText}>Upcoming</Text>
                    </View>
                  </View>
                  <Text style={styles.attentionName}>Selvi</Text>
                  <Text style={styles.attentionDescription}>
                    The audit is scheduled for 2026-10-15.
                  </Text>
                  <Text style={styles.attentionMeta}>Created 12 Oct 2026 · Due 15 Oct 2026</Text>
                  <TouchableOpacity
                    style={styles.attentionActionBtn}
                    onPress={handleOpenScheduleAudit}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.attentionActionBtnText}>View Audit</Text>
                  </TouchableOpacity>
                </View>

                {/* Card 3: Inventory Exception */}
                <View style={styles.attentionCard}>
                  <View style={styles.attentionTopRow}>
                    <Text style={styles.attentionCodeTitle}>Inventory exception · Kotagiri · Beans</Text>
                    <View style={styles.badgeException}>
                      <Text style={styles.badgeExceptionText}>Exception</Text>
                    </View>
                  </View>
                  <Text style={styles.attentionName}>Beans · Kotagiri</Text>
                  <Text style={styles.attentionDescription}>
                    Stock is at or below the reorder level.
                  </Text>
                  <Text style={styles.attentionMeta}>Created 12 Oct 2026</Text>
                  <TouchableOpacity
                    style={styles.attentionActionBtn}
                    onPress={() => {
                      if (onNavigate) onNavigate('MainWarehouseAdmin');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.attentionActionBtnText}>Review Exception</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 6. Quick Actions Section (3 Columns Grid) */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>Quick actions</Text>
                <View style={styles.quickActionsGrid}>
                  {displayedActions.map((qa) => (
                    <TouchableOpacity
                      key={qa.id}
                      style={styles.quickActionTile}
                      onPress={qa.action}
                      activeOpacity={0.75}
                    >
                      <View style={styles.quickActionIconBox}>{qa.icon}</View>
                      <Text style={styles.quickActionTileLabel}>{qa.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Show few actions / Show more actions toggle button */}
                <TouchableOpacity
                  style={styles.toggleMetricsButton}
                  onPress={() => setShowAllActions((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.toggleMetricsText}>
                    {showAllActions ? 'Show few actions' : 'Show more actions'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 7. Operations Summary Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>Operations summary</Text>
                  <TouchableOpacity
                    onPress={() => setActiveTab('Operations')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sectionOpenLink}>Open →</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryListCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Farmers · active / registered</Text>
                    <Text style={styles.summaryRowValue}>20 / 24</Text>
                  </View>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Produce · pending review</Text>
                    <Text style={styles.summaryRowValue}>5</Text>
                  </View>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Audits · upcoming / overdue</Text>
                    <Text style={styles.summaryRowValue}>2 / 2</Text>
                  </View>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Purchases · awaiting receipt</Text>
                    <Text style={styles.summaryRowValue}>3</Text>
                  </View>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Warehouse · discrepancies</Text>
                    <Text style={styles.summaryRowValue}>2</Text>
                  </View>
                </View>
              </View>

              {/* 8. Sales & Finance Summary Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>Sales & Finance summary</Text>
                  <TouchableOpacity
                    onPress={() => setActiveTab('Finance')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sectionOpenLink}>Open →</Text>
                  </TouchableOpacity>
                </View>

                {/* Sales Breakdown Card */}
                <TouchableOpacity
                  style={styles.summaryListCard}
                  onPress={() => setActiveTab('Finance')}
                  activeOpacity={0.8}
                >
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Order value (30 days)</Text>
                    <Text style={styles.summaryOrderValueBig}>₹3,33,660</Text>
                  </View>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Online</Text>
                    <Text style={styles.summaryRowValue}>₹10,870</Text>
                  </View>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Live Market</Text>
                    <Text style={styles.summaryRowValue}>₹19,710</Text>
                  </View>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Horeca</Text>
                    <Text style={styles.summaryRowValue}>₹1,51,740</Text>
                  </View>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>B2B</Text>
                    <Text style={styles.summaryRowValue}>₹1,51,340</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.salesSubNote}>
                  Orders: Placed 3 · Packed 0 · Ready for Pickup 1 · Delivered 48
                </Text>

                {/* Finance Action Card */}
                <TouchableOpacity
                  style={[styles.summaryListCard, { marginTop: adminSpacing.md }]}
                  onPress={() => setActiveTab('Finance')}
                  activeOpacity={0.8}
                >
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Payouts awaiting processing</Text>
                    <Text style={styles.summaryRowValue}>3</Text>
                  </View>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Payouts awaiting Super Admin approval</Text>
                    <Text style={styles.summaryRowValue}>1</Text>
                  </View>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Failed or on hold</Text>
                    <Text style={styles.summaryRowValue}>2</Text>
                  </View>
                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryRowLabel}>Refunds awaiting review or payment</Text>
                    <Text style={styles.summaryRowValue}>2</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 9. Warehouse Summary Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>Warehouse summary</Text>

                <View style={styles.warehouseCard}>
                  <View style={styles.warehouseTopRow}>
                    <Text style={styles.warehouseName}>Ooty</Text>
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeActiveText}>Active</Text>
                    </View>
                  </View>
                  <Text style={styles.warehouseDetail}>1290 KG in stock · 0 low-stock lines</Text>
                  <Text style={styles.warehouseMeta}>Updated 12 Oct 2026, 08:40</Text>
                </View>

                <View style={styles.warehouseCard}>
                  <View style={styles.warehouseTopRow}>
                    <Text style={styles.warehouseName}>Coonoor</Text>
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeActiveText}>Active</Text>
                    </View>
                  </View>
                  <Text style={styles.warehouseDetail}>1465 KG in stock · 0 low-stock lines</Text>
                  <Text style={styles.warehouseMeta}>Updated 12 Oct 2026, 08:15</Text>
                </View>

                <View style={styles.warehouseCard}>
                  <View style={styles.warehouseTopRow}>
                    <Text style={styles.warehouseName}>Kotagiri</Text>
                    <View style={styles.badgeActive}>
                      <Text style={styles.badgeActiveText}>Active</Text>
                    </View>
                  </View>
                  <Text style={styles.warehouseDetail}>1518 KG in stock · 1 low-stock lines</Text>
                  <Text style={styles.warehouseMeta}>Updated 11 Oct 2026, 17:55</Text>
                </View>

                <View style={styles.warehouseCard}>
                  <View style={styles.warehouseTopRow}>
                    <Text style={styles.warehouseName}>Gudalur Market</Text>
                    <View style={styles.badgePending}>
                      <Text style={styles.badgePendingText}>Pending Activation</Text>
                    </View>
                  </View>
                  <Text style={styles.warehouseDetail}>Not active yet, so there is no stock data</Text>
                </View>
              </View>

              {/* 10. Recent Activity Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>Recent activity</Text>

                <View style={styles.activityItemRow}>
                  <ClockHistoryIcon />
                  <View style={styles.activityContentCol}>
                    <Text style={styles.activityTitle}>Farmer application approved</Text>
                    <Text style={styles.activityMeta}>APP-2026-0108 · 11 Oct 2026, 16:40</Text>
                    <Text style={styles.activityActor}>Priya Nair · Approved</Text>
                  </View>
                </View>

                <View style={styles.activityItemRow}>
                  <ClockHistoryIcon />
                  <View style={styles.activityContentCol}>
                    <Text style={styles.activityTitle}>KYC verification updated</Text>
                    <Text style={styles.activityMeta}>FMR-00177 · 11 Oct 2026, 15:05</Text>
                    <Text style={styles.activityActor}>Priya Nair · Verified</Text>
                  </View>
                </View>

                <View style={styles.activityItemRow}>
                  <ClockHistoryIcon />
                  <View style={styles.activityContentCol}>
                    <Text style={styles.activityTitle}>Retail price change submitted for review</Text>
                    <Text style={styles.activityMeta}>PRC-003 · 11 Oct 2026, 12:30</Text>
                    <Text style={styles.activityActor}>Priya Nair · Pending review</Text>
                  </View>
                </View>

                <View style={styles.activityItemRow}>
                  <ClockHistoryIcon />
                  <View style={styles.activityContentCol}>
                    <Text style={styles.activityTitle}>Quality discrepancy recorded</Text>
                    <Text style={styles.activityMeta}>PO-2026-00311 · 10 Oct 2026, 18:22</Text>
                    <Text style={styles.activityActor}>Warehouse staff · Rejected</Text>
                  </View>
                </View>
              </View>

              <View style={{ height: adminSpacing.xxxl }} />
            </ScrollView>
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            WORK QUEUE TAB
           ══════════════════════════════════════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════════════════════
            WORK QUEUE TAB (M1-S03 · Work Queue)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'WorkQueue' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.workQueueScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Banner */}
            <View style={styles.subScreenHeaderBanner}>
              <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
                <Defs>
                  <LinearGradient id="workQueueGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={adminColors.brand} />
                    <Stop offset="1" stopColor={adminColors.brand} stopOpacity={0.94} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#workQueueGrad)" />
              </Svg>

              <View style={styles.subScreenHeaderTopRow}>
                <TouchableOpacity
                  style={styles.backIconButton}
                  onPress={() => setActiveTab('Home')}
                  activeOpacity={0.8}
                >
                  <BackArrowWhiteIcon size={22} />
                </TouchableOpacity>
                <Text style={styles.subScreenHeaderTitle}>Work Queue</Text>
                <View style={{ width: 36 }} />
              </View>
            </View>

            {/* Search and Filter Box */}
            <View style={styles.workQueueSearchContainer}>
              <View style={styles.workQueueSearchBar}>
                <SearchIcon size={18} color={adminColors.muted} />
                <TextInput
                  style={styles.workQueueSearchInput}
                  placeholder="Search common or scientific name"
                  placeholderTextColor={adminColors.placeholder}
                  value={workQueueSearch}
                  onChangeText={setWorkQueueSearch}
                />
                <TouchableOpacity
                  onPress={() => setShowWorkQueueFilterModal(true)}
                  activeOpacity={0.7}
                  style={styles.workQueueFilterTrigger}
                >
                  <FilterSlidersIcon size={18} color={adminColors.brand} />
                </TouchableOpacity>
              </View>

              {/* Status & pending count row */}
              <Text style={styles.workQueueCountText}>
                6 pending · 3 blocked / exception
              </Text>
            </View>

            {/* Task Cards List */}
            <View style={styles.workQueueTaskList}>
              {workQueueTasks
                .filter((t) => {
                  if (!workQueueSearch.trim()) return true;
                  const q = workQueueSearch.toLowerCase();
                  return (
                    t.title.toLowerCase().includes(q) ||
                    t.name.toLowerCase().includes(q) ||
                    t.code.toLowerCase().includes(q) ||
                    t.detail.toLowerCase().includes(q)
                  );
                })
                .map((task) => (
                  <View key={task.id} style={styles.workQueueCard}>
                    <View style={styles.workQueueCardTopRow}>
                      <Text style={styles.workQueueCardTitle}>{task.title}</Text>
                      <View
                        style={[
                          styles.workQueueBadge,
                          task.badgeTone === 'danger'
                            ? styles.workQueueBadgeDanger
                            : styles.workQueueBadgeWarning,
                        ]}
                      >
                        <Text
                          style={[
                            styles.workQueueBadgeText,
                            task.badgeTone === 'danger'
                              ? styles.workQueueBadgeTextDanger
                              : styles.workQueueBadgeTextWarning,
                          ]}
                        >
                          {task.badge}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.workQueuePersonName}>{task.name}</Text>
                    <Text style={styles.workQueueTaskCode}>{task.code}</Text>
                    <Text style={styles.workQueueTaskDetail}>{task.detail}</Text>
                    <Text style={styles.workQueueTaskCreated}>{task.created}</Text>

                    <TouchableOpacity
                      style={styles.workQueueActionButton}
                      onPress={task.onAction}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.workQueueActionText}>{task.actionLabel}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>

            {/* Screen footer code */}
            <Text style={styles.screenFooterCode}>M1-S03 · Work Queue</Text>
            <View style={{ height: adminSpacing.xxl }} />
          </ScrollView>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            OPERATIONS TAB (M1-S04 · Operations Overview)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Operations' && (
          <AdminOperationsOverviewScreen
            onBack={() => setActiveTab('Home')}
            onExportReports={() => {
              Alert.alert('Export Reports', 'Reports exported successfully in PDF and Excel formats.');
            }}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            FARMERS TAB
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Farmers' && (
          selectedAdminApplication ? (
            <AdminApplicationDetailScreen
              application={selectedAdminApplication}
              onBack={() => setSelectedAdminApplication(null)}
              onApprove={() => {
                setSelectedAdminApplication(null);
                Alert.alert('Approved', 'Application has been approved successfully.');
              }}
              onReject={() => {
                setSelectedAdminApplication(null);
                Alert.alert('Rejected', 'Application has been rejected.');
              }}
            />
          ) : farmerSubScreen === 'map' && selectedAdminFarmer ? (
            <AdminFarmMapScreen
              farmer={selectedAdminFarmer}
              onBack={() => setFarmerSubScreen(null)}
            />
          ) : farmerSubScreen === 'scorecard' && selectedAdminFarmer ? (
            <AdminRatingScorecardScreen
              farmer={selectedAdminFarmer}
              onBack={() => setFarmerSubScreen(null)}
              onOpenComplianceTiers={() => { }}
            />
          ) : selectedAdminFarmer ? (
            <AdminFarmerDetailScreen
              farmer={selectedAdminFarmer}
              onBack={() => setSelectedAdminFarmer(null)}
              onOpenFarmMap={() => setFarmerSubScreen('map')}
              onOpenRatingScorecard={() => setFarmerSubScreen('scorecard')}
            />
          ) : (
            <AdminAllFarmersScreen
              showBottomNav={false}
              onBack={() => setActiveTab('More')}
              onSelectFarmer={(f) => {
                setSelectedAdminFarmer(f);
              }}
              onReviewApplication={(app) => {
                setSelectedAdminApplication(app);
              }}
            />
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            FINANCE TAB (M1-S04 · Sales & Finance Overview)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Finance' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.financeScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Banner */}
            <View style={styles.subScreenHeaderBanner}>
              <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
                <Defs>
                  <LinearGradient id="financeGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={adminColors.brand} />
                    <Stop offset="1" stopColor={adminColors.brand} stopOpacity={0.94} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#financeGrad)" />
              </Svg>

              <View style={styles.subScreenHeaderTopRow}>
                <TouchableOpacity
                  style={styles.backIconButton}
                  onPress={() => setActiveTab('Home')}
                  activeOpacity={0.8}
                >
                  <BackArrowWhiteIcon size={22} />
                </TouchableOpacity>
                <Text style={styles.subScreenHeaderTitle}>Sales & Finance Overview</Text>
                <TouchableOpacity
                  style={styles.headerPillIconButton}
                  onPress={() => setShowFinanceFilterModal(true)}
                  activeOpacity={0.8}
                >
                  <FilterSlidersIcon size={18} color={adminColors.onBrand} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Section A: Sales overview ── */}
            <View style={styles.financeSection}>
              <Text style={styles.financeSectionHeading}>A · Sales overview</Text>

              {/* Order value metrics card */}
              <View style={styles.financeSummaryCard}>
                <View style={styles.financeMetricRow}>
                  <View style={styles.financeMetricHeaderRow}>
                    <Text style={styles.financeMetricTitle}>Order value</Text>
                    <Text style={styles.financeMetricValue}>₹71,190</Text>
                  </View>
                  <Text style={styles.financeMetricSubtext}>
                    Gross value of orders placed in the period, excluding cancelled and returned.
                  </Text>
                </View>
                <View style={styles.summaryDivider} />

                <View style={styles.financeMetricRow}>
                  <View style={styles.financeMetricHeaderRow}>
                    <Text style={styles.financeMetricTitle}>Invoiced amount</Text>
                    <Text style={styles.financeMetricValue}>₹69,570</Text>
                  </View>
                  <Text style={styles.financeMetricSubtext}>
                    Value of B2B and Horeca orders with a generated invoice.
                  </Text>
                </View>
                <View style={styles.summaryDivider} />

                <View style={styles.financeMetricRow}>
                  <View style={styles.financeMetricHeaderRow}>
                    <Text style={styles.financeMetricTitle}>Collected amount</Text>
                    <Text style={styles.financeMetricValue}>₹69,570</Text>
                  </View>
                  <Text style={styles.financeMetricSubtext}>
                    Value of orders whose payment is Paid.
                  </Text>
                </View>
                <View style={styles.summaryDivider} />

                <View style={styles.financeMetricRow}>
                  <View style={styles.financeMetricHeaderRow}>
                    <Text style={styles.financeMetricTitle}>Refunded amount</Text>
                    <Text style={styles.financeMetricValue}>₹0</Text>
                  </View>
                  <Text style={styles.financeMetricSubtext}>
                    Refund cases completed in the period.
                  </Text>
                </View>
              </View>

              {/* Orders by status (7) */}
              <Text style={styles.financeSubHeading}>Orders by status (7)</Text>
              <View style={styles.kpiTileGrid}>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>2</Text>
                  <Text style={styles.kpiTileLabel}>Placed</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>0</Text>
                  <Text style={styles.kpiTileLabel}>Packed</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>0</Text>
                  <Text style={styles.kpiTileLabel}>Ready for Pickup</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>5</Text>
                  <Text style={styles.kpiTileLabel}>Delivered</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>0</Text>
                  <Text style={styles.kpiTileLabel}>Returned</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>0</Text>
                  <Text style={styles.kpiTileLabel}>Cancelled</Text>
                </View>
              </View>

              {/* Sales by channel */}
              <Text style={styles.financeSubHeading}>Sales by channel</Text>
              <View style={styles.financeSummaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Online</Text>
                  <Text style={styles.summaryRowValue}>₹0</Text>
                </View>
                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Live Market</Text>
                  <Text style={styles.summaryRowValue}>₹1,620</Text>
                </View>
                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Horeca</Text>
                  <Text style={styles.summaryRowValue}>₹20,130</Text>
                </View>
                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>B2B</Text>
                  <Text style={styles.summaryRowValue}>₹49,440</Text>
                </View>
              </View>

              {/* B2B and Horeca */}
              <Text style={styles.financeSubHeading}>B2B and Horeca</Text>
              <View style={styles.financeSummaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Orders</Text>
                  <Text style={styles.summaryRowValue}>5</Text>
                </View>
                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Invoices generated / pending</Text>
                  <Text style={styles.summaryRowValue}>5 / 0</Text>
                </View>
              </View>

              <View style={[styles.financeSummaryCard, { marginTop: adminSpacing.sm }]}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Cancelled orders</Text>
                  <Text style={styles.summaryRowValue}>0</Text>
                </View>
                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Returned orders</Text>
                  <Text style={styles.summaryRowValue}>0</Text>
                </View>
              </View>

              <Text style={styles.financeCaptionNote}>
                Filters applied here: Date range, Sales channel, Warehouse, Customer type, Payment status.
              </Text>
            </View>

            {/* ── Section B: Farmer payouts ── */}
            <View style={styles.financeSection}>
              <Text style={styles.financeSectionHeading}>B · Farmer payouts</Text>

              <View style={styles.kpiTileGrid}>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>3</Text>
                  <Text style={styles.kpiTileLabel}>Awaiting processing</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>1</Text>
                  <Text style={styles.kpiTileLabel}>Pending approval</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>1</Text>
                  <Text style={styles.kpiTileLabel}>Successful</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>2</Text>
                  <Text style={styles.kpiTileLabel}>Failed or on hold</Text>
                </View>
              </View>

              <View style={styles.financeSummaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Payout value requested in the period</Text>
                  <Text style={styles.summaryRowValue}>₹60,070</Text>
                </View>
                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Payouts in the period</Text>
                  <Text style={styles.summaryRowValue}>5</Text>
                </View>
              </View>
            </View>

            {/* ── Section C: Customer refunds ── */}
            <View style={styles.financeSection}>
              <Text style={styles.financeSectionHeading}>C · Customer refunds</Text>

              <View style={styles.kpiTileGrid}>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>1</Text>
                  <Text style={styles.kpiTileLabel}>Awaiting review</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>1</Text>
                  <Text style={styles.kpiTileLabel}>Awaiting processing</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>1</Text>
                  <Text style={styles.kpiTileLabel}>Completed</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>1</Text>
                  <Text style={styles.kpiTileLabel}>Failed</Text>
                </View>
              </View>

              <View style={styles.financeSummaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Unresolved complaints</Text>
                  <Text style={styles.summaryRowValue}>2</Text>
                </View>
              </View>

              <Text style={styles.financeCaptionNote}>
                Refund statuses are current; the date range applies only to the refunded amount above.
              </Text>

              <TouchableOpacity
                style={styles.financeOutlineButton}
                onPress={() => {
                  if (onNavigate) onNavigate('Customers');
                  else Alert.alert('Customers', 'Opening customers overview.');
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.financeOutlineButtonText}>Customers</Text>
              </TouchableOpacity>
            </View>

            {/* ── Section D: Finance and reconciliation ── */}
            <View style={styles.financeSection}>
              <Text style={styles.financeSectionHeading}>D · Finance and reconciliation</Text>

              <View style={styles.kpiTileGrid}>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>2</Text>
                  <Text style={styles.kpiTileLabel}>Vouchers awaiting approval</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>1</Text>
                  <Text style={styles.kpiTileLabel}>Reconciliation mismatches</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>3</Text>
                  <Text style={styles.kpiTileLabel}>Salary payouts to process</Text>
                </View>
                <View style={styles.kpiTileItem}>
                  <Text style={styles.kpiTileValue}>3</Text>
                  <Text style={styles.kpiTileLabel}>Records awaiting approval</Text>
                </View>
              </View>

              <View style={styles.financeSummaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>
                    Reconciliation: matched / pending review / mismatch
                  </Text>
                  <Text style={styles.summaryRowValue}>1 / 1 / 1</Text>
                </View>
                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Voucher value awaiting approval</Text>
                  <Text style={styles.summaryRowValue}>₹11,000</Text>
                </View>
              </View>

              <Text style={styles.financeCaptionNote}>
                Wallet and ledger figures come from the Accounts & Finance records. Filters other than the vouchers listed do not apply.
              </Text>
            </View>

            {/* ── Section E: Price compliance ── */}
            <View style={styles.financeSection}>
              <Text style={styles.financeSectionHeading}>E · Price compliance</Text>

              <View style={styles.financeSummaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Retail prices needing action</Text>
                  <Text style={styles.summaryRowValue}>1</Text>
                </View>
                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryRowLabel}>Retail prices above the ceiling</Text>
                  <Text style={styles.summaryRowValue}>1</Text>
                </View>
              </View>

              <Text style={styles.financeSubHeading}>Fair-price ceiling (reference only)</Text>

              {/* Price compliance table */}
              <View style={styles.complianceListCard}>
                {[
                  {
                    name: 'Tomato · Grade A',
                    ceiling: 'Ceiling Rs. 60 · Retail Rs. 55',
                    status: 'Within ceiling',
                    tone: 'success' as const,
                  },
                  {
                    name: 'Carrot · Grade A',
                    ceiling: 'Ceiling Rs. 70 · Retail Rs. 74',
                    status: 'Above ceiling',
                    tone: 'danger' as const,
                  },
                  {
                    name: 'Cabbage · Grade B',
                    ceiling: 'Ceiling Rs. 35 · Retail Rs. 32',
                    status: 'Needs action',
                    tone: 'warning' as const,
                  },
                  {
                    name: 'Beans · Grade A',
                    ceiling: 'Ceiling Rs. 90 · Retail Rs. 84',
                    status: 'Within ceiling',
                    tone: 'success' as const,
                  },
                  {
                    name: 'Potato · Grade B',
                    ceiling: 'Ceiling Rs. 40 · Retail Rs. 38',
                    status: 'Within ceiling',
                    tone: 'success' as const,
                  },
                  {
                    name: 'Garlic · Grade A',
                    ceiling: 'Ceiling Rs. 210 · Retail Rs. 198',
                    status: 'Within ceiling',
                    tone: 'success' as const,
                  },
                ].map((item, index, arr) => (
                  <View key={item.name}>
                    <View style={styles.complianceRow}>
                      <Text style={styles.complianceItemName}>{item.name}</Text>
                      <View style={styles.complianceRightCol}>
                        <Text style={styles.complianceCeilingText}>{item.ceiling}</Text>
                        <View
                          style={[
                            styles.compliancePill,
                            item.tone === 'success' && styles.compliancePillSuccess,
                            item.tone === 'danger' && styles.compliancePillDanger,
                            item.tone === 'warning' && styles.compliancePillWarning,
                          ]}
                        >
                          <Text
                            style={[
                              styles.compliancePillText,
                              item.tone === 'success' && styles.compliancePillTextSuccess,
                              item.tone === 'danger' && styles.compliancePillTextDanger,
                              item.tone === 'warning' && styles.compliancePillTextWarning,
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {index < arr.length - 1 && <View style={styles.summaryDivider} />}
                  </View>
                ))}
              </View>
            </View>

            {/* Export reports full-width button */}
            <TouchableOpacity
              style={styles.exportReportsButton}
              onPress={() => {
                Alert.alert(
                  'Export Reports',
                  'Sales and finance report exported successfully in PDF and Excel formats.'
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.exportReportsButtonText}>Export reports</Text>
            </TouchableOpacity>

            {/* Screen footer code */}
            <Text style={styles.screenFooterCode}>M1-S04 · Sales & Finance Overview</Text>
            <View style={{ height: adminSpacing.xxl }} />
          </ScrollView>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SALES TAB (Subscreens & Channels)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Sales' && (
          salesSubScreen === 'online' ? (
            <SalesOnlineOrdersScreen
              onBack={() => setSalesSubScreen('overview')}
              onSelectOrder={(ord) => {
                setSelectedSalesOrder(ord);
                setSalesSubScreen('fulfillment');
              }}
              onOpenInvoice={(ord) => {
                setSelectedSalesOrder(ord);
                setSalesSubScreen('invoice');
              }}
            />
          ) : salesSubScreen === 'market' ? (
            <SalesMarketDayScreen onBack={() => setSalesSubScreen('overview')} />
          ) : salesSubScreen === 'horeca' ? (
            <SalesHorecaOrdersScreen onBack={() => setSalesSubScreen('overview')} />
          ) : salesSubScreen === 'b2b' ? (
            <SalesB2BOrdersScreen
              onBack={() => setSalesSubScreen('overview')}
              onOpenInvoice={(acc) => {
                setSelectedSalesB2B(acc);
                setSalesSubScreen('invoice');
              }}
            />
          ) : salesSubScreen === 'fulfillment' ? (
            <SalesFulfillmentAssignmentScreen
              orderNumber={selectedSalesOrder?.orderNumber ?? 'ORD-20260910-0091'}
              customerName={selectedSalesOrder?.customerName ?? 'Divya Ramesh'}
              onBack={() => setSalesSubScreen('overview')}
              onNavigateToInvoice={() => setSalesSubScreen('invoice')}
            />
          ) : salesSubScreen === 'invoice' ? (
            <SalesInvoiceScreen
              orderNumber={
                selectedSalesOrder?.orderNumber ??
                (selectedSalesB2B ? 'B2B-20260909-001' : 'ORD-20260909-0084')
              }
              customerName={
                selectedSalesOrder?.customerName ??
                (selectedSalesB2B ? selectedSalesB2B.name : 'Ramesh P.')
              }
              onBack={() => setSalesSubScreen('overview')}
            />
          ) : salesSubScreen === 'returns' ? (
            <SalesReturnsRefundsScreen onBack={() => setSalesSubScreen('overview')} />
          ) : (
            <SalesChannelOverviewScreen
              onBack={() => setActiveTab('Home')}
              onSelectChannel={(ch) => setSalesSubScreen(ch)}
              onOpenFulfillment={() => setSalesSubScreen('fulfillment')}
              onOpenReturns={() => setSalesSubScreen('returns')}
            />
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MORE TAB (Image 1 Menu Screen)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'More' && (
          produceControlScreen === 'calendar' ? (
            <ProduceControlCalendarScreen
              onBack={() => setProduceControlScreen(null)}
              onOpenFilters={() => setShowProduceFiltersModal(true)}
              onNavigateToZoneBreakdown={() => setProduceControlScreen('zoneBreakdown')}
              onNavigateToHarvestForecast={() => setProduceControlScreen('harvestForecast')}
              onNavigateToCropHistory={() => setProduceControlScreen('cropHistory')}
            />
          ) : produceControlScreen === 'zoneBreakdown' ? (
            <ZoneCropBreakdownScreen
              onBack={() => setProduceControlScreen('calendar')}
              onOpenFilters={() => setShowProduceFiltersModal(true)}
              onSelectCropRecord={(_recordId) => setProduceControlScreen('cropDetail')}
            />
          ) : produceControlScreen === 'cropDetail' ? (
            <CropRecordDetailScreen
              onBack={() => setProduceControlScreen('zoneBreakdown')}
              onOpenFarmerProfile={() => {
                setProduceControlScreen(null);
                if (onNavigate) onNavigate('AdminAllFarmers');
                else setActiveTab('Farmers');
              }}
            />
          ) : produceControlScreen === 'harvestForecast' ? (
            <HarvestForecastInsightsScreen
              onBack={() => setProduceControlScreen('calendar')}
              onOpenExportModal={() => setShowExportCropModal(true)}
              onOpenFilters={() => setShowProduceFiltersModal(true)}
            />
          ) : produceControlScreen === 'cropHistory' ? (
            <CropHistoryRecordsScreen
              onBack={() => setProduceControlScreen('calendar')}
              onOpenCompareModal={() => setShowCompareModal(true)}
              onSelectCropRecord={(_recordId) => setProduceControlScreen('cropDetail')}
              onOpenFilters={() => setShowProduceFiltersModal(true)}
              selectedCompareIds={selectedCompareIds}
              onToggleCompare={(recordId) => {
                setSelectedCompareIds((prev) =>
                  prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
                );
              }}
            />
          ) : inputsPestScreen === 'home' ? (
            <InputsPestHomeScreen
              onBack={() => setInputsPestScreen(null)}
              onNavigateApprovedInputs={() => setInputsPestScreen('catalog')}
              onNavigatePestLibrary={() => setInputsPestScreen('pest_library')}
              onNavigateApplicationGuides={() => Alert.alert('Application Guides', 'Create Application Guide module.')}
              onNavigatePestIncidents={() => setInputsPestScreen('pest_incidents')}
              onAddInput={() => setInputsPestScreen('add_input')}
            />
          ) : inputsPestScreen === 'catalog' ? (
            <ApprovedInputsScreen
              onBack={() => setInputsPestScreen('home')}
              onAddNewInput={() => setInputsPestScreen('add_input')}
              onSelectInput={(item) => {
                setSelectedCatalogInput(item);
                setInputsPestScreen('input_detail');
              }}
            />
          ) : inputsPestScreen === 'add_input' ? (
            <AddNewInputScreen
              onBack={() => setInputsPestScreen('catalog')}
              onSave={() => setInputsPestScreen('catalog')}
            />
          ) : inputsPestScreen === 'input_detail' ? (
            <InputDetailScreen
              inputItem={selectedCatalogInput}
              onBack={() => setInputsPestScreen('catalog')}
              onEdit={() => setInputsPestScreen('add_input')}
            />
          ) : inputsPestScreen === 'pest_library' ? (
            <PestLibraryScreen
              onBack={() => setInputsPestScreen('home')}
              onAddNewPest={() => setInputsPestScreen('add_pest')}
              onSelectPest={(pest) => {
                Alert.alert(pest.name, `${pest.scientificName || ''}\n${pest.metaLine || ''}`);
              }}
            />
          ) : inputsPestScreen === 'add_pest' ? (
            <AddNewPestScreen
              onBack={() => setInputsPestScreen('pest_library')}
              onSave={() => setInputsPestScreen('pest_library')}
            />
          ) : inputsPestScreen === 'pest_incidents' ? (
            <FarmerPestIncidentsScreen
              onBack={() => setInputsPestScreen('home')}
              onSelectIncident={(incident) => {
                setSelectedIncident(incident);
                setInputsPestScreen('incident_detail');
              }}
            />
          ) : inputsPestScreen === 'incident_detail' ? (
            <PestIncidentDetailScreen
              incident={selectedIncident}
              onBack={() => setInputsPestScreen('pest_incidents')}
            />
          ) : (
            <AdminMoreMenuScreen
              onBack={() => setActiveTab('Home')}
              onSelectOption={(optionId) => {
                if (optionId === 'farmers') {
                  if (onNavigate) onNavigate('AdminAllFarmers');
                  else setActiveTab('Farmers');
                } else if (optionId === 'produce') {
                  setProduceControlScreen('calendar');
                } else if (optionId === 'audit') {
                  handleOpenScheduleAudit();
                } else if (optionId === 'inputs') {
                  setInputsPestScreen('home');
                } else if (optionId === 'pricing') {
                  if (onNavigate) onNavigate('RetailPricing');
                } else if (optionId === 'purchase_sales') {
                  setActiveTab('Finance');
                } else if (optionId === 'customers') {
                  if (onNavigate) onNavigate('Customers');
                } else if (optionId === 'finance') {
                  setActiveTab('Finance');
                } else if (optionId === 'workforce') {
                  if (onNavigate) onNavigate('Staff');
                } else if (optionId === 'notifications') {
                  setActiveTab('Reports');
                } else if (optionId === 'community') {
                  if (onNavigate) onNavigate('Community');
                } else if (optionId === 'settings') {
                  setActiveTab('Profile');
                }
              }}
            />
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            REPORTS TAB
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Reports' && (
          reportsSubScreen === 'analytics' ? (
            <AnalyticsDashboardScreen onBack={() => setReportsSubScreen(null)} />
          ) : reportsSubScreen === 'pl' ? (
            <PLStatementScreen onBack={() => setReportsSubScreen(null)} />
          ) : reportsSubScreen === 'farmerPerformance' ? (
            <FarmerPerformanceReportScreen onBack={() => setReportsSubScreen(null)} />
          ) : reportsSubScreen === 'warehouseOps' ? (
            <WarehouseOpsReportScreen onBack={() => setReportsSubScreen(null)} />
          ) : reportsSubScreen === 'allRecent' ? (
            <AllRecentReportsScreen
              onBack={() => setReportsSubScreen(null)}
              onOpenPLReport={() => setReportsSubScreen('pl')}
              onOpenFarmerPerformanceReport={() => setReportsSubScreen('farmerPerformance')}
              onOpenWarehouseOpsReport={() => setReportsSubScreen('warehouseOps')}
            />
          ) : reportsSubScreen === 'builder' ? (
            <ReportBuilderScreen
              onBack={() => setReportsSubScreen(null)}
              onGenerate={(type) => {
                if (type === 'pl') setReportsSubScreen('pl');
                else if (type === 'farmer') setReportsSubScreen('farmerPerformance');
                else if (type === 'warehouse') setReportsSubScreen('warehouseOps');
              }}
            />
          ) : reportsSubScreen === 'alerts' ? (
            <SystemAlertsScreen onBack={() => setReportsSubScreen(null)} />
          ) : reportsSubScreen === 'announcements' ? (
            <AnnouncementsScreen onBack={() => setReportsSubScreen(null)} />
          ) : (
            <AdminReportsMainScreen
              onBack={() => setActiveTab('Home')}
              onOpenPLReport={() => setReportsSubScreen('pl')}
              onOpenFarmerPerformanceReport={() => setReportsSubScreen('farmerPerformance')}
              onOpenWarehouseOpsReport={() => setReportsSubScreen('warehouseOps')}
              onOpenAnalyticsDashboard={() => setReportsSubScreen('analytics')}
              onOpenReportBuilder={() => setReportsSubScreen('builder')}
              onOpenAllRecentReports={() => setReportsSubScreen('allRecent')}
              onOpenSystemAlerts={() => setReportsSubScreen('alerts')}
              onOpenAnnouncements={() => setReportsSubScreen('announcements')}
            />
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PROFILE TAB
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Profile' && (
          <AdminProfileScreen
            role="TOHFA_ADMIN"
            onSignOut={onSignOut ?? (() => onNavigate?.('Welcome'))}
            onBack={() => setActiveTab('Home')}
          />
        )}
      </View>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM NAVIGATION BAR (5 Tabs matching Screenshot 1-5 exactly)
         ══════════════════════════════════════════════════════════════════════ */}
      {!dashboardSubScreen &&
        produceControlScreen !== 'zoneBreakdown' &&
        produceControlScreen !== 'cropDetail' &&
        produceControlScreen !== 'harvestForecast' &&
        produceControlScreen !== 'cropHistory' &&
        inputsPestScreen !== 'catalog' &&
        inputsPestScreen !== 'add_input' &&
        inputsPestScreen !== 'input_detail' &&
        inputsPestScreen !== 'pest_library' &&
        inputsPestScreen !== 'add_pest' &&
        inputsPestScreen !== 'pest_incidents' &&
        inputsPestScreen !== 'incident_detail' && (
          <View style={styles.bottomNav}>
            {/* Tab 1: Home */}
            <TouchableOpacity
              style={styles.navTabItem}
              onPress={() => {
                setDashboardSubScreen(null);
                setProduceControlScreen(null);
                setInputsPestScreen(null);
                setActiveTab('Home');
              }}
              activeOpacity={0.7}
            >
              <TabHomeIcon
                color={
                  activeTab === 'Home' || activeTab === 'Dashboard'
                    ? adminColors.brand
                    : adminColors.muted
                }
              />
              <Text
                style={[
                  styles.navTabLabel,
                  (activeTab === 'Home' || activeTab === 'Dashboard') && styles.navTabLabelActive,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>

            {/* Tab 2: Work Queue */}
            <TouchableOpacity
              style={styles.navTabItem}
              onPress={() => {
                setDashboardSubScreen(null);
                setProduceControlScreen(null);
                setInputsPestScreen(null);
                setActiveTab('WorkQueue');
              }}
              activeOpacity={0.7}
            >
              <TabWorkQueueIcon
                color={activeTab === 'WorkQueue' ? adminColors.brand : adminColors.muted}
              />
              <Text
                style={[
                  styles.navTabLabel,
                  activeTab === 'WorkQueue' && styles.navTabLabelActive,
                ]}
              >
                Work Queue
              </Text>
            </TouchableOpacity>

            {/* Tab 3: Operations */}
            <TouchableOpacity
              style={styles.navTabItem}
              onPress={() => {
                setDashboardSubScreen(null);
                setProduceControlScreen(null);
                setInputsPestScreen(null);
                setActiveTab('Operations');
              }}
              activeOpacity={0.7}
            >
              <TabOperationsIcon
                color={
                  activeTab === 'Operations'
                    ? adminColors.brand
                    : adminColors.muted
                }
              />
              <Text
                style={[
                  styles.navTabLabel,
                  activeTab === 'Operations' && styles.navTabLabelActive,
                ]}
              >
                Operations
              </Text>
            </TouchableOpacity>

            {/* Tab 4: Finance */}
            <TouchableOpacity
              style={styles.navTabItem}
              onPress={() => {
                setDashboardSubScreen(null);
                setProduceControlScreen(null);
                setInputsPestScreen(null);
                setActiveTab('Finance');
              }}
              activeOpacity={0.7}
            >
              <TabFinanceIcon
                color={
                  activeTab === 'Finance' || activeTab === 'Sales'
                    ? adminColors.brand
                    : adminColors.muted
                }
              />
              <Text
                style={[
                  styles.navTabLabel,
                  (activeTab === 'Finance' || activeTab === 'Sales') && styles.navTabLabelActive,
                ]}
              >
                Finance
              </Text>
            </TouchableOpacity>

            {/* Tab 5: More */}
            <TouchableOpacity
              style={styles.navTabItem}
              onPress={() => {
                setDashboardSubScreen(null);
                setProduceControlScreen(null);
                setInputsPestScreen(null);
                setActiveTab('More');
              }}
              activeOpacity={0.7}
            >
              <TabMoreIcon
                color={
                  activeTab === 'More' ||
                    activeTab === 'Farmers' ||
                    activeTab === 'Reports' ||
                    activeTab === 'Profile'
                    ? adminColors.brand
                    : adminColors.muted
                }
              />
              <Text
                style={[
                  styles.navTabLabel,
                  (activeTab === 'More' ||
                    activeTab === 'Farmers' ||
                    activeTab === 'Reports' ||
                    activeTab === 'Profile') &&
                  styles.navTabLabelActive,
                ]}
              >
                More
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Date Range Modal */}
      <Modal
        visible={showDateRangeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateRangeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowDateRangeModal(false)}
        >
          <View style={styles.datePickerModalContent}>
            <Text style={styles.modalSheetTitle}>Select Time Period</Text>
            {['7 days', '30 days', '90 days', 'This Month', 'This Quarter'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.datePickerOption,
                  dateRange === item && styles.datePickerOptionSelected,
                ]}
                onPress={() => {
                  setDateRange(item);
                  setShowDateRangeModal(false);
                }}
              >
                <Text
                  style={[
                    styles.datePickerOptionText,
                    dateRange === item && styles.datePickerOptionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          WORK QUEUE FILTER & SORT MODAL (M1-S03a)
         ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showWorkQueueFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWorkQueueFilterModal(false)}
      >
        <View style={styles.bottomSheetBackdrop}>
          <TouchableOpacity
            style={styles.bottomSheetDismissArea}
            activeOpacity={1}
            onPress={() => setShowWorkQueueFilterModal(false)}
          />
          <View style={styles.bottomSheetContainer}>
            <Text style={styles.bottomSheetTitle}>Filter and sort tasks</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* 1. Task type */}
              <View style={styles.filterFieldGroup}>
                <Text style={styles.filterFieldLabel}>Task type</Text>
                <TouchableOpacity
                  style={styles.filterSelectBox}
                  onPress={() => setActivePickerField(activePickerField === 'type' ? null : 'type')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.filterSelectValue}>{taskTypeFilter}</Text>
                  <ChevronDownIcon size={16} color={adminColors.muted} />
                </TouchableOpacity>
                {activePickerField === 'type' && (
                  <View style={styles.filterDropdownList}>
                    {['All', 'Purchase exception', 'Farmer application', 'Audit follow-up', 'Quality discrepancy'].map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.filterDropdownItem,
                          taskTypeFilter === opt && styles.filterDropdownItemSelected,
                        ]}
                        onPress={() => {
                          setTaskTypeFilter(opt);
                          setActivePickerField(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            taskTypeFilter === opt && styles.filterDropdownItemTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 2. Status */}
              <View style={styles.filterFieldGroup}>
                <Text style={styles.filterFieldLabel}>Status</Text>
                <TouchableOpacity
                  style={styles.filterSelectBox}
                  onPress={() => setActivePickerField(activePickerField === 'status' ? null : 'status')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.filterSelectValue}>{statusFilter}</Text>
                  <ChevronDownIcon size={16} color={adminColors.muted} />
                </TouchableOpacity>
                {activePickerField === 'status' && (
                  <View style={styles.filterDropdownList}>
                    {['All', 'Pending', 'Exception', 'Overdue', 'Blocked', 'In review'].map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.filterDropdownItem,
                          statusFilter === opt && styles.filterDropdownItemSelected,
                        ]}
                        onPress={() => {
                          setStatusFilter(opt);
                          setActivePickerField(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            statusFilter === opt && styles.filterDropdownItemTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 3. Due date */}
              <View style={styles.filterFieldGroup}>
                <Text style={styles.filterFieldLabel}>Due date</Text>
                <TouchableOpacity
                  style={styles.filterSelectBox}
                  onPress={() => setActivePickerField(activePickerField === 'due' ? null : 'due')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.filterSelectValue}>{dueDateFilter}</Text>
                  <ChevronDownIcon size={16} color={adminColors.muted} />
                </TouchableOpacity>
                {activePickerField === 'due' && (
                  <View style={styles.filterDropdownList}>
                    {['Any', 'Today', 'This week', 'Overdue', 'Next 7 days'].map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.filterDropdownItem,
                          dueDateFilter === opt && styles.filterDropdownItemSelected,
                        ]}
                        onPress={() => {
                          setDueDateFilter(opt);
                          setActivePickerField(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            dueDateFilter === opt && styles.filterDropdownItemTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 4. Warehouse */}
              <View style={styles.filterFieldGroup}>
                <Text style={styles.filterFieldLabel}>Warehouse</Text>
                <TouchableOpacity
                  style={styles.filterSelectBox}
                  onPress={() => setActivePickerField(activePickerField === 'wh' ? null : 'wh')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.filterSelectValue}>{warehouseFilter}</Text>
                  <ChevronDownIcon size={16} color={adminColors.muted} />
                </TouchableOpacity>
                <Text style={styles.filterHelperText}>Only warehouse-specific tasks have a warehouse.</Text>
                {activePickerField === 'wh' && (
                  <View style={styles.filterDropdownList}>
                    {['Any', 'Ooty Warehouse', 'Coonoor Warehouse', 'Kotagiri Warehouse'].map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.filterDropdownItem,
                          warehouseFilter === opt && styles.filterDropdownItemSelected,
                        ]}
                        onPress={() => {
                          setWarehouseFilter(opt);
                          setActivePickerField(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            warehouseFilter === opt && styles.filterDropdownItemTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 5. Assigned to */}
              <View style={styles.filterFieldGroup}>
                <Text style={styles.filterFieldLabel}>Assigned to</Text>
                <TouchableOpacity
                  style={styles.filterSelectBox}
                  onPress={() => setActivePickerField(activePickerField === 'assign' ? null : 'assign')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.filterSelectValue}>{assignedToFilter}</Text>
                  <ChevronDownIcon size={16} color={adminColors.muted} />
                </TouchableOpacity>
                {activePickerField === 'assign' && (
                  <View style={styles.filterDropdownList}>
                    {['Anyone', 'Unassigned', 'Me', 'Arun', 'Vijay', 'Sathish Kumar'].map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.filterDropdownItem,
                          assignedToFilter === opt && styles.filterDropdownItemSelected,
                        ]}
                        onPress={() => {
                          setAssignedToFilter(opt);
                          setActivePickerField(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            assignedToFilter === opt && styles.filterDropdownItemTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 6. Sort by */}
              <View style={styles.filterFieldGroup}>
                <Text style={styles.filterFieldLabel}>Sort by</Text>
                <TouchableOpacity
                  style={styles.filterSelectBox}
                  onPress={() => setActivePickerField(activePickerField === 'sort' ? null : 'sort')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.filterSelectValue}>{sortByFilter}</Text>
                  <ChevronDownIcon size={16} color={adminColors.muted} />
                </TouchableOpacity>
                <Text style={styles.filterHelperText}>
                  Priority is not offered because no priority levels are configured. Bulk updates are not offered because no task supports them safely.
                </Text>
                {activePickerField === 'sort' && (
                  <View style={styles.filterDropdownList}>
                    {['Due date, then newest', 'Due date, then oldest', 'Newest first', 'Oldest first'].map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.filterDropdownItem,
                          sortByFilter === opt && styles.filterDropdownItemSelected,
                        ]}
                        onPress={() => {
                          setSortByFilter(opt);
                          setActivePickerField(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            sortByFilter === opt && styles.filterDropdownItemTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Modal Bottom Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={() => {
                  setShowWorkQueueFilterModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyButtonText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalResetButton}
                onPress={() => {
                  setTaskTypeFilter('All');
                  setStatusFilter('All');
                  setDueDateFilter('Any');
                  setWarehouseFilter('Any');
                  setAssignedToFilter('Anyone');
                  setSortByFilter('Due date, then newest');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalResetButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowWorkQueueFilterModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          FINANCE FILTER MODAL (M1-S04)
         ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFinanceFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinanceFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFinanceFilterModal(false)}
        >
          <View style={styles.datePickerModalContent}>
            <Text style={styles.modalSheetTitle}>Sales & Finance Filter</Text>
            {['All Channels', 'Online Orders Only', 'Live Market Only', 'Horeca Only', 'B2B Only', 'Past 7 Days', 'Past 30 Days', 'Past 90 Days'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.datePickerOption,
                  dateRange === item && styles.datePickerOptionSelected,
                ]}
                onPress={() => {
                  setDateRange(item);
                  setShowFinanceFilterModal(false);
                }}
              >
                <Text
                  style={[
                    styles.datePickerOptionText,
                    dateRange === item && styles.datePickerOptionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Produce Control Filters Modal (Screen 3) */}
      <ProduceControlFiltersModal
        visible={showProduceFiltersModal}
        onClose={() => setShowProduceFiltersModal(false)}
        selectedFarmer={produceFilterFarmer}
        onChangeFarmer={setProduceFilterFarmer}
        selectedZone={produceFilterZone}
        onChangeZone={setProduceFilterZone}
        selectedCrop={produceFilterCrop}
        onChangeCrop={setProduceFilterCrop}
        selectedSeason={produceFilterSeason}
        onChangeSeason={setProduceFilterSeason}
        selectedGrowthStage={produceFilterGrowthStage}
        onChangeGrowthStage={setProduceFilterGrowthStage}
      />

      {/* Export Crop Records Modal (Image 5) */}
      <ExportCropRecordsModal
        visible={showExportCropModal}
        onClose={() => setShowExportCropModal(false)}
        onDownloadCSV={() => {
          setShowExportCropModal(false);
          Alert.alert('Download CSV', '43 crop records exported successfully as CSV.');
        }}
      />

      {/* Compare Crop Cycles Modal (Image 1 popup) */}
      <CompareCropCyclesModal
        visible={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        onExportDetails={() => {
          setShowCompareModal(false);
          Alert.alert('Export Details', 'Crop cycle comparison exported successfully.');
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles Strictly Derived from Admin Theme & Design Tokens ─────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingBottom: adminSpacing.xxl,
  },

  // 1. Header Banner
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: 56,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  headerLeftCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerBrandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerBrandText: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '800',
    fontSize: 19,
    letterSpacing: 0.2,
    marginLeft: adminSpacing.sm,
  },
  headerDateText: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.9,
    fontSize: 12,
    fontWeight: '500',
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: adminSpacing.sm,
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.danger.text,
  },

  // 2. Greeting Card
  greetingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    marginHorizontal: adminSpacing.lg,
    marginTop: -48,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  greetingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  greetingTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  roleBadgePill: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 5,
    flexShrink: 0,
    alignSelf: 'center',
  },
  roleBadgeText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  greetingSubTitle: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13,
    marginBottom: 2,
  },
  greetingDateStamp: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 12,
    marginBottom: adminSpacing.md,
  },
  greetingBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  lastUpdatedText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 12,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 3. Search and Date Range
  searchContainer: {
    marginTop: adminSpacing.lg,
    marginHorizontal: adminSpacing.lg,
    gap: adminSpacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 46,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
    fontSize: 13,
  },
  dateFilterContainer: {
    alignItems: 'flex-end',
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: 6,
  },
  dateFilterText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '700',
    fontSize: 13,
  },

  // 4. Section Containers & Headings
  sectionContainer: {
    marginTop: adminSpacing.lg,
    marginHorizontal: adminSpacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  sectionOpenLink: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },

  // Toggle Metrics & Actions Button
  toggleMetricsButton: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brand,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.md,
  },
  toggleMetricsText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },

  // 5. Needs Your Attention Cards
  attentionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.md,
  },
  attentionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  attentionCodeTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  badgeOverdue: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  badgeOverdueText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  badgeUpcoming: {
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  badgeUpcomingText: {
    ...adminType.caption,
    color: adminColors.info.text,
    fontWeight: '700',
  },
  badgeException: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  badgeExceptionText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  attentionName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    marginBottom: 4,
  },
  attentionDescription: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12.5,
    marginBottom: adminSpacing.sm,
  },
  attentionMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  attentionActionBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brand,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },

  // 6. Quick Actions Grid (3 columns)
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
  },
  quickActionTile: {
    width: '31%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    ...adminShadow.sm,
  },
  quickActionIconBox: {
    marginBottom: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTileLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '600',
  },

  // 7 & 8. Summary Cards (Operations & Sales/Finance)
  summaryListCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.md,
  },
  summaryRowLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  summaryRowValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  summaryOrderValueBig: {
    ...adminType.title,
    color: adminColors.ink,
    letterSpacing: -0.5,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  salesSubNote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
    paddingHorizontal: 2,
  },

  // 9. Warehouse Cards
  warehouseCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  warehouseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  warehouseName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  badgeActiveText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '700',
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  badgePendingText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontWeight: '700',
  },
  warehouseDetail: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  warehouseMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },

  // 10. Activity Items
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  activityContentCol: {
    flex: 1,
  },
  activityTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 2,
  },
  activityMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  activityActor: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },

  // Bottom Navigation Bar (5 Tabs)
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.xs,
    ...adminShadow.sm,
  },
  navTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navTabLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 3,
    fontSize: 10,
  },
  navTabLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },

  // Date Range Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  datePickerModalContent: {
    width: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalSheetTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
    textAlign: 'center',
  },
  datePickerOption: {
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
    marginBottom: adminSpacing.xs,
  },
  datePickerOptionSelected: {
    backgroundColor: adminColors.brandTint,
  },
  datePickerOptionText: {
    ...adminType.body,
    color: adminColors.ink,
    textAlign: 'center',
  },
  datePickerOptionTextSelected: {
    color: adminColors.brand,
    fontWeight: '700',
  },

  // ── Subscreen Header Common ──
  subScreenHeaderBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: adminSpacing.sm,
  },
  subScreenHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.xs,
  },
  subScreenHeaderTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '800',
    fontSize: 18,
    flex: 1,
    marginLeft: adminSpacing.sm,
  },
  backIconButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPillIconButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Work Queue (M1-S03) ──
  workQueueScrollContent: {
    paddingBottom: adminSpacing.xxxl,
  },
  workQueueSearchContainer: {
    paddingHorizontal: adminSpacing.md,
    marginTop: -adminSpacing.md,
  },
  workQueueSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  workQueueSearchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    marginLeft: adminSpacing.sm,
    paddingVertical: 2,
  },
  workQueueFilterTrigger: {
    padding: adminSpacing.xs,
  },
  workQueueCountText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
    paddingHorizontal: adminSpacing.xs,
  },
  workQueueTaskList: {
    paddingHorizontal: adminSpacing.md,
    marginTop: adminSpacing.xs,
  },
  workQueueCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  workQueueCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  workQueueCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  workQueueBadge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  workQueueBadgeDanger: {
    backgroundColor: adminColors.danger.bg,
  },
  workQueueBadgeWarning: {
    backgroundColor: adminColors.warning.bg,
  },
  workQueueBadgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  workQueueBadgeTextDanger: {
    color: adminColors.danger.text,
  },
  workQueueBadgeTextWarning: {
    color: adminColors.warning.text,
  },
  workQueuePersonName: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  workQueueTaskCode: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 4,
  },
  workQueueTaskDetail: {
    ...adminType.body,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 2,
  },
  workQueueTaskCreated: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  workQueueActionButton: {
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.full,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  workQueueActionText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brand,
    fontSize: 13,
  },

  // ── Filter & Sort Bottom Sheet Modal (M1-S03a) ──
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  bottomSheetDismissArea: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    ...adminShadow.lg,
  },
  bottomSheetTitle: {
    ...adminType.sectionHead,
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  filterFieldGroup: {
    marginBottom: adminSpacing.sm,
  },
  filterFieldLabel: {
    ...adminType.rowTitle,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
    marginBottom: 4,
  },
  filterSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
  },
  filterSelectValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  filterHelperText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
  filterDropdownList: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: 4,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  filterDropdownItem: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  filterDropdownItemSelected: {
    backgroundColor: adminColors.brandTint,
  },
  filterDropdownItemText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  filterDropdownItemTextSelected: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.lg,
  },
  modalApplyButton: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: adminSpacing.xs,
  },
  modalApplyButtonText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '700',
    fontSize: 14,
  },
  modalResetButton: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.brand,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: adminSpacing.xs,
  },
  modalResetButtonText: {
    ...adminType.body,
    color: adminColors.brand,
    fontWeight: '700',
    fontSize: 14,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: adminSpacing.xs,
  },
  modalCancelButtonText: {
    ...adminType.body,
    color: adminColors.muted,
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Sales & Finance Overview (M1-S04) ──
  financeScrollContent: {
    paddingBottom: adminSpacing.xxxl,
  },
  financeSection: {
    paddingHorizontal: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  financeSectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xs,
  },
  financeSubHeading: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  financeSummaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    ...adminShadow.sm,
  },
  financeMetricRow: {
    paddingVertical: adminSpacing.sm,
  },
  financeMetricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  financeMetricTitle: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
    fontSize: 13,
  },
  financeMetricValue: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    fontSize: 14,
  },
  financeMetricSubtext: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  kpiTileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: adminSpacing.xs,
  },
  kpiTileItem: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  kpiTileValue: {
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 4,
  },
  kpiTileLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  financeCaptionNote: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  financeOutlineButton: {
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginTop: adminSpacing.xs,
  },
  financeOutlineButtonText: {
    ...adminType.body,
    color: adminColors.brand,
    fontWeight: '700',
    fontSize: 14,
  },
  complianceListCard: {
    marginTop: adminSpacing.xs,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
  },
  complianceItemName: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.ink,
    flex: 1,
    marginRight: adminSpacing.xs,
  },
  complianceRightCol: {
    alignItems: 'flex-end',
  },
  complianceCeilingText: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 4,
  },
  compliancePill: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  compliancePillSuccess: {
    backgroundColor: adminColors.success.bg,
  },
  compliancePillDanger: {
    backgroundColor: adminColors.danger.bg,
  },
  compliancePillWarning: {
    backgroundColor: adminColors.warning.bg,
  },
  compliancePillText: {
    ...adminType.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  compliancePillTextSuccess: {
    color: adminColors.success.text,
  },
  compliancePillTextDanger: {
    color: adminColors.danger.text,
  },
  compliancePillTextWarning: {
    color: adminColors.warning.text,
  },
  exportReportsButton: {
    marginHorizontal: adminSpacing.md,
    marginTop: adminSpacing.lg,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  exportReportsButtonText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '700',
    fontSize: 15,
  },
  screenFooterCode: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.xs,
  },
});
