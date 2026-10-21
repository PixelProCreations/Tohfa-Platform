import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
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
import { fetchMe, type UserMe } from '../../../farmer/api/auth';
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
  type ApplicationListItem,
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
import {
  AdminPendingApplicationsScreen,
  AdminApplicationDetailScreen,
} from '../registration';
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
import { PLStatementScreen } from '../finance';
import { AdminOperationsOverviewScreen } from './AdminOperationsOverviewScreen';
import { AdminMoreMenuScreen } from './AdminMoreMenuScreen';
import {
  AuditManagementScreen,
  AuditScheduleAssignmentScreen,
  AuditDetailsFarmerRecordsScreen,
  ScheduleAuditFormScreen,
  AuditHistoryComplianceScreen,
  GenerateAuditReportScreen,
  AuditReportsTierConfigScreen,
  AuditReportHistoryScreen,
  AuditReportDetailsScreen,
} from '../audits';
import {
  MarketPricingHomeScreen,
  MarketPricingOverviewScreen,
  EditRetailPriceScreen,
  MarkupPricingBreakdownScreen,
  FairPriceCeilingScreen,
  CategoriesGradesScreen,
  RetailPricingScreen,
  PriceHistoryScreen,
  INITIAL_PRICING_RECORDS,
  type PricingRecordItem,
} from '../pricing';

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

// ─── Main Screen Component ────────────────────────────────────────────────────

export function TohfaAdminDashboardScreen({
  onSignOut,
  onNavigate,
  onSwitchRole: _onSwitchRole,
  initialTab,
}: TohfaAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<TohfaAdminTab>(
    initialTab === 'Profile' ? 'Profile' : 'Home'
  );
  const [user, setUser] = useState<UserMe | null>(null);

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
    | 'listingApproval'
    | 'scheduleAudit'
    | 'auditScheduleAssignment'
    | 'auditDetailsRecord'
    | 'scheduleAuditForm'
    | 'auditHistoryCompliance'
    | 'generateAuditReport'
    | 'auditReportsTierConfig'
    | 'auditReportHistory'
    | 'auditReportDetails'
    | 'support'
    | 'reportBuilder'
    | 'pendingApplications'
    | 'marketPricingHome'
    | 'marketPricingOverview'
    | 'editRetailPrice'
    | 'markupBreakdown'
    | 'fairPriceCeiling'
    | 'categoriesGrades'
    | 'retailPricing'
    | 'priceHistory'
    | null
  >(null);
  const [pricingRecords, setPricingRecords] = useState<PricingRecordItem[]>(INITIAL_PRICING_RECORDS);
  const [selectedPricingRecord, setSelectedPricingRecord] = useState<PricingRecordItem | null>(null);
  const [editRetailReturnScreen, setEditRetailReturnScreen] = useState<'marketPricingOverview' | 'retailPricing'>('marketPricingOverview');
  const [markupBreakdownReturnScreen, setMarkupBreakdownReturnScreen] = useState<'marketPricingOverview' | 'fairPriceCeiling' | 'retailPricing'>('marketPricingOverview');
  const [pricingReturnTab, setPricingReturnTab] = useState<'Home' | 'More'>('More');
  const [selectedAuditId, setSelectedAuditId] = useState<string>('AUD-2026-0034');
  const [auditDetailsReturnScreen, setAuditDetailsReturnScreen] = useState<
    'scheduleAudit' | 'auditScheduleAssignment' | 'auditHistoryCompliance'
  >('auditScheduleAssignment');
  const [scheduleAuditFormReturnScreen, setScheduleAuditFormReturnScreen] = useState<
    'auditScheduleAssignment' | 'auditDetailsRecord'
  >('auditDetailsRecord');
  const [reportHistoryReturnScreen, setReportHistoryReturnScreen] = useState<
    'scheduleAudit' | 'auditReportsTierConfig'
  >('scheduleAudit');
  const [selectedAdminFarmer, setSelectedAdminFarmer] = useState<FarmerListItem | null>(null);
  const [selectedAdminApplication, setSelectedAdminApplication] = useState<ApplicationListItem | null>(null);
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
    setDashboardSubScreen('scheduleAudit');
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
      onPress: handleOpenListingApproval,
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
        setPricingReturnTab('Home');
        setDashboardSubScreen('marketPricingHome');
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
        if (onNavigate) onNavigate('InputsPestHome');
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

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.container}>
        {/* ══════════════════════════════════════════════════════════════════════
            MARKET & PRICING SUB-SCREENS (Module 7)
           ══════════════════════════════════════════════════════════════════════ */}
        {dashboardSubScreen === 'marketPricingHome' ? (
          <MarketPricingHomeScreen
            onBack={() => {
              setDashboardSubScreen(null);
              setActiveTab(pricingReturnTab);
            }}
            onNavigateOverview={() => setDashboardSubScreen('marketPricingOverview')}
            onNavigateToFairPrice={() => setDashboardSubScreen('fairPriceCeiling')}
            onNavigateToCategories={() => setDashboardSubScreen('categoriesGrades')}
            onNavigateToPriceHistory={() => setDashboardSubScreen('priceHistory')}
            onNavigateToRetailPricing={() => setDashboardSubScreen('retailPricing')}
          />
        ) : dashboardSubScreen === 'marketPricingOverview' ? (
          <MarketPricingOverviewScreen
            onBack={() => setDashboardSubScreen('marketPricingHome')}
            records={pricingRecords}
            onEditRetailPrice={(record) => {
              setSelectedPricingRecord(record);
              setEditRetailReturnScreen('marketPricingOverview');
              setDashboardSubScreen('editRetailPrice');
            }}
            onViewBreakdown={(record) => {
              setSelectedPricingRecord(record);
              setMarkupBreakdownReturnScreen('marketPricingOverview');
              setDashboardSubScreen('markupBreakdown');
            }}
          />
        ) : dashboardSubScreen === 'editRetailPrice' ? (
          <EditRetailPriceScreen
            onBack={() => setDashboardSubScreen(editRetailReturnScreen)}
            record={selectedPricingRecord}
            onSaveSuccess={(updated) => {
              setPricingRecords((prev) =>
                prev.map((r) => (r.id === updated.id ? updated : r))
              );
              setSelectedPricingRecord(updated);
              setDashboardSubScreen(editRetailReturnScreen);
            }}
          />
        ) : dashboardSubScreen === 'fairPriceCeiling' ? (
          <FairPriceCeilingScreen
            onBack={() => setDashboardSubScreen('marketPricingHome')}
            onNavigateToRetailPricing={() => setDashboardSubScreen('retailPricing')}
            onNavigateToHistory={() => setDashboardSubScreen('priceHistory')}
            onNavigateToBreakdown={(item) => {
              const matching = pricingRecords.find((r) => r.product === item?.product && r.grade === item?.grade);
              setSelectedPricingRecord(matching || null);
              setMarkupBreakdownReturnScreen('fairPriceCeiling');
              setDashboardSubScreen('markupBreakdown');
            }}
          />
        ) : dashboardSubScreen === 'categoriesGrades' ? (
          <CategoriesGradesScreen
            onBack={() => setDashboardSubScreen('marketPricingHome')}
          />
        ) : dashboardSubScreen === 'retailPricing' ? (
          <RetailPricingScreen
            onBack={() => setDashboardSubScreen('marketPricingHome')}
            onEditRetailPrice={(record) => {
              setSelectedPricingRecord(record);
              setEditRetailReturnScreen('retailPricing');
              setDashboardSubScreen('editRetailPrice');
            }}
          />
        ) : dashboardSubScreen === 'priceHistory' ? (
          <PriceHistoryScreen
            onBack={() => setDashboardSubScreen('marketPricingHome')}
          />
        ) : dashboardSubScreen === 'markupBreakdown' ? (
          <MarkupPricingBreakdownScreen
            onBack={() => setDashboardSubScreen(markupBreakdownReturnScreen)}
            record={selectedPricingRecord}
            cropGradeTitle={
              selectedPricingRecord
                ? `${selectedPricingRecord.product} · ${selectedPricingRecord.grade}`
                : undefined
            }
            retailPrice={selectedPricingRecord?.retailPrice}
            ceilingPrice={selectedPricingRecord?.ceiling}
            purchasePrice={selectedPricingRecord?.farmerPurchasePrice}
          />
        ) : (
          <>
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
                <AuditManagementScreen
                  onBack={() => setDashboardSubScreen(null)}
                  onOpenSchedule={() => setDashboardSubScreen('auditScheduleAssignment')}
                  onOpenHistory={() => setDashboardSubScreen('auditHistoryCompliance')}
                  onOpenGenerateReport={() => setDashboardSubScreen('generateAuditReport')}
                  onOpenReportHistory={() => {
                    setReportHistoryReturnScreen('scheduleAudit');
                    setDashboardSubScreen('auditReportHistory');
                  }}
                  onSelectAuditItem={(audit) => {
                    setSelectedAuditId(audit.code);
                    setAuditDetailsReturnScreen('scheduleAudit');
                    setDashboardSubScreen('auditDetailsRecord');
                  }}
                />
              ) : dashboardSubScreen === 'auditScheduleAssignment' ? (
                <AuditScheduleAssignmentScreen
                  onBack={() => setDashboardSubScreen('scheduleAudit')}
                  onViewSchedule={(schedule) => {
                    setSelectedAuditId(schedule.code);
                    setAuditDetailsReturnScreen('auditScheduleAssignment');
                    setDashboardSubScreen('auditDetailsRecord');
                  }}
                  onEditSchedule={(schedule) => {
                    setSelectedAuditId(schedule.code);
                    setScheduleAuditFormReturnScreen('auditScheduleAssignment');
                    setDashboardSubScreen('scheduleAuditForm');
                  }}
                  onReschedule={(schedule) => {
                    setSelectedAuditId(schedule.code);
                    setScheduleAuditFormReturnScreen('auditScheduleAssignment');
                    setDashboardSubScreen('scheduleAuditForm');
                  }}
                />
              ) : dashboardSubScreen === 'auditDetailsRecord' ? (
                <AuditDetailsFarmerRecordsScreen
                  auditId={selectedAuditId}
                  onBack={() => setDashboardSubScreen(auditDetailsReturnScreen)}
                  onEditSchedule={() => {
                    setScheduleAuditFormReturnScreen('auditDetailsRecord');
                    setDashboardSubScreen('scheduleAuditForm');
                  }}
                  onReschedule={() => {
                    setScheduleAuditFormReturnScreen('auditDetailsRecord');
                    setDashboardSubScreen('scheduleAuditForm');
                  }}
                  onCancelSchedule={() => setDashboardSubScreen(auditDetailsReturnScreen)}
                  onOpenFarmerProfile={() => {
                    if (onNavigate) onNavigate('AdminAllFarmers');
                    else setActiveTab('Farmers');
                  }}
                />
              ) : dashboardSubScreen === 'scheduleAuditForm' ? (
                <ScheduleAuditFormScreen
                  initialAuditId={selectedAuditId}
                  onBack={() => setDashboardSubScreen(scheduleAuditFormReturnScreen)}
                  onScheduleSuccess={() => setDashboardSubScreen(scheduleAuditFormReturnScreen)}
                  onSaveDraft={() => setDashboardSubScreen(scheduleAuditFormReturnScreen)}
                />
              ) : dashboardSubScreen === 'auditHistoryCompliance' ? (
                <AuditHistoryComplianceScreen
                  onBack={() => setDashboardSubScreen('scheduleAudit')}
                  onSelectAudit={(audit) => {
                    setSelectedAuditId(audit.code);
                    setAuditDetailsReturnScreen('auditHistoryCompliance');
                    setDashboardSubScreen('auditDetailsRecord');
                  }}
                />
              ) : dashboardSubScreen === 'generateAuditReport' ? (
                <GenerateAuditReportScreen
                  onBack={() => setDashboardSubScreen('scheduleAudit')}
                  onConfigureReport={() => {
                    setDashboardSubScreen('auditReportsTierConfig');
                  }}
                  onGenerateReport={() => {
                    setDashboardSubScreen('auditReportsTierConfig');
                  }}
                />
              ) : dashboardSubScreen === 'auditReportsTierConfig' ? (
                <AuditReportsTierConfigScreen
                  onBack={() => setDashboardSubScreen('generateAuditReport')}
                  onGenerateReportSuccess={() => {
                    setReportHistoryReturnScreen('auditReportsTierConfig');
                    setDashboardSubScreen('auditReportHistory');
                  }}
                />
              ) : dashboardSubScreen === 'auditReportHistory' ? (
                <AuditReportHistoryScreen
                  onBack={() => setDashboardSubScreen(reportHistoryReturnScreen)}
                  onOpenReportDetails={(_reportId) => {
                    setDashboardSubScreen('auditReportDetails');
                  }}
                />
              ) : dashboardSubScreen === 'auditReportDetails' ? (
                <AuditReportDetailsScreen
                  onBack={() => setDashboardSubScreen('auditReportHistory')}
                  onDownload={() => {
                    Alert.alert('Download Complete', 'Audit Summary Report has been downloaded.');
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
              dashboardSubScreen === 'scheduleAudit' ? (
                <AuditManagementScreen
                  onBack={() => setDashboardSubScreen(null)}
                  onOpenSchedule={() => setDashboardSubScreen('auditScheduleAssignment')}
                  onOpenHistory={() => setDashboardSubScreen('auditHistoryCompliance')}
                  onOpenGenerateReport={() => setDashboardSubScreen('generateAuditReport')}
                  onOpenReportHistory={() => {
                    setReportHistoryReturnScreen('scheduleAudit');
                    setDashboardSubScreen('auditReportHistory');
                  }}
                  onSelectAuditItem={(audit) => {
                    setSelectedAuditId(audit.code);
                    setAuditDetailsReturnScreen('scheduleAudit');
                    setDashboardSubScreen('auditDetailsRecord');
                  }}
                />
              ) : dashboardSubScreen === 'auditScheduleAssignment' ? (
                <AuditScheduleAssignmentScreen
                  onBack={() => setDashboardSubScreen('scheduleAudit')}
                  onViewSchedule={(schedule) => {
                    setSelectedAuditId(schedule.code);
                    setAuditDetailsReturnScreen('auditScheduleAssignment');
                    setDashboardSubScreen('auditDetailsRecord');
                  }}
                  onEditSchedule={(schedule) => {
                    setSelectedAuditId(schedule.code);
                    setScheduleAuditFormReturnScreen('auditScheduleAssignment');
                    setDashboardSubScreen('scheduleAuditForm');
                  }}
                  onReschedule={(schedule) => {
                    setSelectedAuditId(schedule.code);
                    setScheduleAuditFormReturnScreen('auditScheduleAssignment');
                    setDashboardSubScreen('scheduleAuditForm');
                  }}
                />
              ) : dashboardSubScreen === 'auditDetailsRecord' ? (
                <AuditDetailsFarmerRecordsScreen
                  auditId={selectedAuditId}
                  onBack={() => setDashboardSubScreen(auditDetailsReturnScreen)}
                  onEditSchedule={() => {
                    setScheduleAuditFormReturnScreen('auditDetailsRecord');
                    setDashboardSubScreen('scheduleAuditForm');
                  }}
                  onReschedule={() => {
                    setScheduleAuditFormReturnScreen('auditDetailsRecord');
                    setDashboardSubScreen('scheduleAuditForm');
                  }}
                  onCancelSchedule={() => setDashboardSubScreen(auditDetailsReturnScreen)}
                  onOpenFarmerProfile={() => {
                    if (onNavigate) onNavigate('AdminAllFarmers');
                    else setActiveTab('Farmers');
                  }}
                />
              ) : dashboardSubScreen === 'scheduleAuditForm' ? (
                <ScheduleAuditFormScreen
                  initialAuditId={selectedAuditId}
                  onBack={() => setDashboardSubScreen(scheduleAuditFormReturnScreen)}
                  onScheduleSuccess={() => setDashboardSubScreen(scheduleAuditFormReturnScreen)}
                  onSaveDraft={() => setDashboardSubScreen(scheduleAuditFormReturnScreen)}
                />
              ) : dashboardSubScreen === 'auditHistoryCompliance' ? (
                <AuditHistoryComplianceScreen
                  onBack={() => setDashboardSubScreen('scheduleAudit')}
                  onSelectAudit={(audit) => {
                    setSelectedAuditId(audit.code);
                    setAuditDetailsReturnScreen('auditHistoryCompliance');
                    setDashboardSubScreen('auditDetailsRecord');
                  }}
                />
              ) : dashboardSubScreen === 'generateAuditReport' ? (
                <GenerateAuditReportScreen
                  onBack={() => setDashboardSubScreen('scheduleAudit')}
                  onConfigureReport={() => {
                    setDashboardSubScreen('auditReportsTierConfig');
                  }}
                  onGenerateReport={() => {
                    setDashboardSubScreen('auditReportsTierConfig');
                  }}
                />
              ) : dashboardSubScreen === 'auditReportsTierConfig' ? (
                <AuditReportsTierConfigScreen
                  onBack={() => setDashboardSubScreen('generateAuditReport')}
                  onGenerateReportSuccess={() => {
                    setReportHistoryReturnScreen('auditReportsTierConfig');
                    setDashboardSubScreen('auditReportHistory');
                  }}
                />
              ) : dashboardSubScreen === 'auditReportHistory' ? (
                <AuditReportHistoryScreen
                  onBack={() => setDashboardSubScreen(reportHistoryReturnScreen)}
                  onOpenReportDetails={(_reportId) => {
                    setDashboardSubScreen('auditReportDetails');
                  }}
                />
              ) : dashboardSubScreen === 'auditReportDetails' ? (
                <AuditReportDetailsScreen
                  onBack={() => setDashboardSubScreen('auditReportHistory')}
                  onDownload={() => {
                    Alert.alert('Download Complete', 'Audit Summary Report has been downloaded.');
                  }}
                />
              ) : (
                <AdminMoreMenuScreen
                  onBack={() => setActiveTab('Home')}
                  onSelectOption={(optionId) => {
                    if (optionId === 'farmers') {
                      if (onNavigate) onNavigate('AdminAllFarmers');
                      else setActiveTab('Farmers');
                    } else if (optionId === 'produce') {
                      setDashboardSubScreen('listingApproval');
                      setActiveTab('Home');
                    } else if (optionId === 'audit') {
                      handleOpenScheduleAudit();
                    } else if (optionId === 'inputs') {
                      if (onNavigate) onNavigate('InputsPestHome');
                    } else if (optionId === 'pricing') {
                      setPricingReturnTab('More');
                      setDashboardSubScreen('marketPricingHome');
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
          </>
        )}
      </View>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM NAVIGATION BAR (5 Tabs matching Screenshot 1-5 exactly)
         ══════════════════════════════════════════════════════════════════════ */}
      {(!dashboardSubScreen || dashboardSubScreen === 'marketPricingHome') && (
        <View style={styles.bottomNav}>
          {/* Tab 1: Home */}
          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => {
              setDashboardSubScreen(null);
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
