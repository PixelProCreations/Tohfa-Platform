import React, { useEffect, useState } from 'react';
import {
  Alert,
  LogBox,
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

LogBox.ignoreLogs([
  'getSystemConfig: /config/farmer lookup failed',
]);
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
import { makeCan } from '../../permissions/can';
import {
  AdminAllFarmersScreen,
  AdminFarmerDetailScreen,
  AdminFarmMapScreen,
  AdminRatingScorecardScreen,
  DEMO_APPLICATIONS,
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
import { PurchaseSalesOrdersScreen } from '../sales/PurchaseSalesOrdersScreen';
import { AdminProfileScreen } from './AdminProfileScreen';
import { TohfaAdminSettingsScreen } from './TohfaAdminSettingsScreen';
import { TohfaAdminProfileScreen } from './TohfaAdminProfileScreen';
import { FarmerAdminNotificationsScreen } from './FarmerAdminNotificationsScreen';
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
import {
  PLStatementScreen,
} from '../finance';
import { PurchaseDuesPayoutsScreen } from '../finance/PurchaseDuesPayoutsScreen';
import { SalesIncomeRevenueScreen } from '../finance/SalesIncomeRevenueScreen';
import { ExpenseManagementScreen } from '../finance/ExpenseManagementScreen';
import { InvoicesGstBillingScreen } from '../finance/InvoicesGstBillingScreen';
import { ReturnsRmaRefundsScreen } from '../finance/ReturnsRmaRefundsScreen';
import { TransactionHistoryScreen } from '../finance/TransactionHistoryScreen';
import { CustomerWalletOverviewScreen } from '../finance/CustomerWalletOverviewScreen';
import { ReportsExportScreen } from '../finance/ReportsExportScreen';
import { AdminOperationsOverviewScreen } from './AdminOperationsOverviewScreen';
import { StockLedgerBatchesScreen } from './StockLedgerBatchesScreen';
import { StockVerificationScreen } from './StockVerificationScreen';
import { InterWarehouseTransfersScreen } from './InterWarehouseTransfersScreen';
import { AddWarehouseProfileScreen } from './AddWarehouseProfileScreen';
import { AdminMoreMenuScreen } from './AdminMoreMenuScreen';
import { InputsPestHomeScreen } from './InputsPestHomeScreen';
import { ApprovedInputsScreen, AddNewInputScreen, type CatalogInputItem } from './ApprovedInputsScreen';
import { InputDetailScreen } from './InputDetailScreen';
import { PestLibraryScreen, AddNewPestScreen } from './PestLibraryScreen';
import { FarmerPestIncidentsScreen, type IncidentItem } from './FarmerPestIncidentsScreen';
import { PestIncidentDetailScreen } from './PestIncidentDetailScreen';
import { CommunityKnowledgeHomeScreen } from './CommunityKnowledgeHomeScreen';
import { CreateContentScreen, type ContentTypeOption, type CreateContentInitialData } from './CreateContentScreen';
import { CreateGroupScreen } from './CreateGroupScreen';
import { CreateCommunityScreen } from './CreateCommunityScreen';
import { AddVideoScreen } from './AddVideoScreen';
import { CommunityDetailsScreen } from './CommunityDetailsScreen';
import { CommunitiesListScreen } from './CommunitiesListScreen';
import { GroupsListScreen } from './GroupsListScreen';
import { QuestionAnswerChatScreen } from './QuestionAnswerChatScreen';
import { ArticleDetailsScreen } from './ArticleDetailsScreen';
import { ContentItemDetailScreen } from './ContentItemDetailScreen';
import { ContentPendingReviewScreen } from './ContentPendingReviewScreen';
import { KnowledgeLibraryScreen } from './KnowledgeLibraryScreen';
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
  | 'Inventory'
  | 'Finance'
  | 'More'
  | 'Dashboard'
  | 'Farmers'
  | 'Sales'
  | 'Reports'
  | 'Profile'
  | 'Settings'
  | 'Notifications'
  | 'Workforce';

export interface WorkforceStaffItem {
  id: string;
  name: string;
  avatarInitials?: string;
  type: string;
  role: string;
  assignedRole: string;
  warehouse: string;
  mobile: string;
  maskedMobile: string;
  email: string;
  joiningDate: string;
  workSection: string;
  status: 'Active' | 'Pending activation' | 'Inactive';
  todayAttendance: 'Present' | 'Absent';
  attendanceNote?: string;
  createdText: string;
  activationNote?: string;
  historyText?: string;
  hasErrorCorrection?: boolean;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  alternateMobile?: string;
  currentAddress?: string;
  idType?: string;
  idNumber?: string;
  verificationStatus?: 'Verified' | 'Pending' | 'Rejected';
  verifiedByDate?: string;
  employeeId?: string;
  employmentType?: string;
  department?: string;
  designation?: string;
  reportingManager?: string;
  applicationRole?: string;
  accountStatusText?: string;
  permissionsSummary?: string;
  lastLogin?: string;
  warehouseCode?: string;
  warehouseLocation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  documents?: Array<{
    name: string;
    filename: string;
    status: 'Verified' | 'Rejected' | 'Not uploaded';
    statusNote?: string;
  }>;
  auditHistory?: Array<{
    date: string;
    actor: string;
    action: string;
  }>;
}

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

function BankBuildingWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 4l9 5.5v1H3v-1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 10.5v6.5M9 10.5v6.5M15 10.5v6.5M19 10.5v6.5M3 17.5h18M2 20.5h20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadWhiteIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v13M7 11l5 5 5-5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToPurchaseSalesIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2h9l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M8 12h8M8 16h6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function GoToDuesPayoutsIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="1.9" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.9" />
      <Path d="M6 9h.01M18 15h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function GoToSalesIncomeIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 17l6-6 4 4 8-8" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 7h7v7" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToExpensesIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2.5" stroke={color} strokeWidth="1.9" />
      <Circle cx="8" cy="12" r="1.5" fill={color} />
      <Circle cx="16" cy="12" r="1.5" fill={color} />
      <Rect x="10.5" y="9.5" width="3" height="5" rx="0.8" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function GoToCustomerWalletIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="13" rx="2.5" stroke={color} strokeWidth="1.9" />
      <Path d="M2 10h20M17 14h3" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Circle cx="15.5" cy="14" r="1" fill={color} />
    </Svg>
  );
}

function GoToInvoiceIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M8 13h4M8 17h8" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToReviewReturnsIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M15 12h-6m0 0l2.5-2.5M9 12l2.5 2.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToTransactionHistoryIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5M12 7v5l3 3" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToReportExportIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v11M8 10l4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
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

function WorkforceBadgeIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function QuickCreateStaffIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Line x1="20" y1="8" x2="20" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="11" x2="23" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickStaffAttendanceIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M9 14l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuickWarehouseActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8.5 21V13h7v8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="8.5" y1="16" x2="15.5" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function QuickCalendarActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="14" r="1.1" fill={color} />
      <Circle cx="12" cy="14" r="1.1" fill={color} />
      <Circle cx="16" cy="14" r="1.1" fill={color} />
      <Circle cx="8" cy="18" r="1.1" fill={color} />
      <Circle cx="12" cy="18" r="1.1" fill={color} />
      <Circle cx="16" cy="18" r="1.1" fill={color} />
    </Svg>
  );
}

function QuickGroupUsersIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 21v-2a4 4 0 0 1 3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5" cy="10" r="2.2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="19" cy="10" r="2.2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuickReceiveGoodsIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M12 7v8M8.5 11.5L12 15l3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="7" y1="18" x2="17" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickProduceListIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="9" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="4.5" cy="6" r="1.5" fill={color} />
      <Circle cx="4.5" cy="12" r="1.5" fill={color} />
      <Circle cx="4.5" cy="18" r="1.5" fill={color} />
    </Svg>
  );
}

function QuickTransferStockIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h14M15 5l3 3-3 3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 16H6M9 13l-3 3 3 3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuickCashTopUpIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="17" height="12" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="10.5" cy="12" r="2.5" stroke={color} strokeWidth="2" />
      <Path d="M19 10v6a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 6V4a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckmarkSmallIcon({ size = 12, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilWhiteIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockOutlineIcon({ size = 24, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarOutlineIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
      <Circle cx="8" cy="14" r="1" fill={color} />
      <Circle cx="12" cy="14" r="1" fill={color} />
      <Circle cx="16" cy="14" r="1" fill={color} />
      <Circle cx="8" cy="18" r="1" fill={color} />
      <Circle cx="12" cy="18" r="1" fill={color} />
    </Svg>
  );
}

function EyeOutlineIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ShieldOutlineIcon({ size = 18, color = '#1C4E75' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UploadSimpleIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 8l-5-5-5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="3" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentUploadIcon({ size = 26, color = '#7A5229' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="18" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 15l3-3 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RadioSelectedIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" />
      <Circle cx="12" cy="12" r="5" fill={color} />
    </Svg>
  );
}

function RadioUnselectedIcon({ size = 22, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PolicySliderIcon({ size = 20, color = '#1C4E75' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="8" x2="20" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="16" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="8" r="2.5" fill="#EAF2F8" stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="16" r="2.5" fill="#EAF2F8" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ModalCloseIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ClockOutlineIcon({ size = 14, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

function TabInventoryIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m3.3 7 8.7 5 8.7-5M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export interface ProduceControlCalendarScreenProps {
  onBack?: () => void;
  onOpenFilters: () => void;
  onNavigateToZoneBreakdown: () => void;
  onNavigateToHarvestForecast: () => void;
  onNavigateToCropHistory: () => void;
}

export function ProduceControlCalendarScreen({
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
          <Text style={produceStyles.headerTitle}>Produce Calendar</Text>
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

export interface ProduceControlFiltersModalProps {
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

export function ProduceControlFiltersModal({
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

export interface ZoneCropBreakdownScreenProps {
  onBack: () => void;
  onOpenFilters: () => void;
  onSelectCropRecord: (recordId: string) => void;
}

export function ZoneCropBreakdownScreen({
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
        {/* 2x2 Metric Cards Grid (using reusable OverviewDashboardCard) */}
        <OverviewCardsGrid style={{ marginBottom: adminSpacing.sm }}>
          <OverviewDashboardCard
            value="18"
            title="Farms with crop records"
            icon="users"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value="4"
            title="Zones with active plans"
            icon="inventory"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value="27"
            title="Crops in growth stages"
            icon="receiving"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value="6"
            subtitle="(2 excluded)"
            title="Expected harvests in 30 days"
            icon="box"
            titlePosition="bottom"
          />
        </OverviewCardsGrid>

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

export interface CropRecordDetailScreenProps {
  onBack: () => void;
  onOpenFarmerProfile?: () => void;
}

export function CropRecordDetailScreen({ onBack, onOpenFarmerProfile }: CropRecordDetailScreenProps) {
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

export interface HarvestForecastInsightsScreenProps {
  onBack: () => void;
  onOpenExportModal: () => void;
  onOpenFilters?: () => void;
}

export function HarvestForecastInsightsScreen({
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

export interface ExportCropRecordsModalProps {
  visible: boolean;
  onClose: () => void;
  onDownloadCSV: () => void;
}

export function ExportCropRecordsModal({
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

export interface CropHistoryRecordsScreenProps {
  onBack: () => void;
  onOpenCompareModal: () => void;
  onSelectCropRecord: (recordId: string) => void;
  onOpenFilters?: () => void;
  selectedCompareIds: string[];
  onToggleCompare: (recordId: string) => void;
}

export function CropHistoryRecordsScreen({
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

export interface CompareCropCyclesModalProps {
  visible: boolean;
  onClose: () => void;
  onExportDetails: () => void;
}

export function CompareCropCyclesModal({
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

// CUSTOMERS MANAGEMENT MODULE (M1-S07 to M1-S11)
// ══════════════════════════════════════════════════════════════════════════════

// ─── Customer Module Icons ───────────────────────────────────────────────────

function CustomersManagementHeaderIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

function CircularFilterButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={customerStyles.circularHeaderBtn}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Filter customers"
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Line x1="4" y1="6" x2="20" y2="6" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
        <Line x1="4" y1="12" x2="20" y2="12" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
        <Line x1="4" y1="18" x2="20" y2="18" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
        <Circle cx="15" cy="6" r="2.2" fill={adminColors.onBrand} />
        <Circle cx="9" cy="12" r="2.2" fill={adminColors.onBrand} />
        <Circle cx="16" cy="18" r="2.2" fill={adminColors.onBrand} />
      </Svg>
    </TouchableOpacity>
  );
}

function CircularPlusButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={customerStyles.circularHeaderBtn}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Add customer"
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M12 5v14M5 12h14" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" />
      </Svg>
    </TouchableOpacity>
  );
}

function CircularEditButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={customerStyles.circularHeaderBtn}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Edit business details"
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          stroke={adminColors.onBrand}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke={adminColors.onBrand}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </TouchableOpacity>
  );
}

function CustomerDirectoryActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function GstBuildingActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="9" y1="6" x2="9" y2="6.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="15" y1="6" x2="15" y2="6.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="9" y1="10" x2="9" y2="10.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="15" y1="10" x2="15" y2="10.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="9" y1="14" x2="9" y2="14.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="15" y1="14" x2="15" y2="14.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M10 22v-4h4v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon({ size = 14, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="11" width="16" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Types & Fixtures ───────────────────────────────────────────────────

export interface CustomerItem {
  id: string;
  name: string;
  type: 'Individual' | 'B2B';
  displayType?: 'online' | 'B2B';
  status: 'Active' | 'Pending activation' | 'Inactive';
  phone: string;
  email?: string;
  gstStatus?: string;
  preferredWarehouse: string;
  ordersVisible?: number;
  lastPurchase?: string;
  registrationDate?: string;
  pickupStates?: string;
  address?: string;
  isB2B?: boolean;
}

export interface CustomerOrderPreview {
  id: string;
  status: 'Delivered · Paid' | 'Processing · Pending';
  statusTone: 'success' | 'warning';
  line1: string;
  line2: string;
}

export interface GstBusinessItem {
  id: string;
  legalName: string;
  businessType: string;
  contactPerson: string;
  phone: string;
  email?: string;
  status: 'Recorded' | 'Incomplete';
  gstin: string;
  gstAddress: string;
  billingAddressLine1: string;
  billingAddressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  updatedDate: string;
  lastUpdatedFull?: string;
  missingInfo?: string;
  invoicesIssued?: string;
  subtext?: string;
}

const DEFAULT_CUSTOMER: CustomerItem = {
  id: 'CUS-1012',
  name: 'Nilgiri Fresh Traders',
  type: 'B2B',
  displayType: 'B2B',
  status: 'Active',
  phone: '+91 90001 20149',
  email: '',
  gstStatus: 'GST Recorded',
  preferredWarehouse: 'Ooty',
  ordersVisible: 9,
  lastPurchase: '1 Oct 2026',
  registrationDate: '5 Jan 2025 · Added by admin',
  pickupStates: 'Ooty-Warehouse',
  address: '44 Industrial Estate, Ooty, Tamil Nadu 643005',
  isB2B: true,
};

const CUSTOMERS_DATA: CustomerItem[] = [
  DEFAULT_CUSTOMER,
  {
    id: 'CUS-1013',
    name: 'Highland Agro Supplies',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0156',
    email: '',
    gstStatus: 'GST Missing',
    preferredWarehouse: 'Coonoor',
    ordersVisible: 1,
    lastPurchase: '30 Sep 2026',
    registrationDate: '12 Feb 2025 · Added by admin',
    pickupStates: 'Coonoor-Warehouse',
    address: '12 Hill Cart Road, Coonoor, Tamil Nadu 643101',
    isB2B: true,
  },
  {
    id: 'CUS-1001',
    name: 'Anitha Raman',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 90001 20149',
    email: '',
    gstStatus: 'Not applicable',
    preferredWarehouse: 'Ooty',
    ordersVisible: 2,
    lastPurchase: '27 Sep 2026',
    registrationDate: '5 Jan 2025 · Added by admin',
    pickupStates: 'Ooty-Warehouse',
    address: '44 Industrial Estate, Ooty, Tamil Nadu 643005',
    isB2B: false,
  },
  {
    id: 'CUS-1011',
    name: 'Lakshmi Narayan',
    type: 'Individual',
    displayType: 'online',
    status: 'Pending activation',
    phone: '+91 ••••• 0164',
    email: '',
    gstStatus: 'Not applicable',
    preferredWarehouse: 'No preferred warehouse',
    ordersVisible: 0,
    lastPurchase: '',
    registrationDate: 'Reg. 13 Oct 2026',
    pickupStates: 'Ooty-Warehouse',
    address: '15 Fern Hill, Ooty, Tamil Nadu 643004',
    isB2B: false,
  },
  {
    id: 'CUS-1007',
    name: 'Priya Nair',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0157',
    email: '',
    gstStatus: 'Not applicable',
    preferredWarehouse: 'No preferred warehouse',
    ordersVisible: 0,
    lastPurchase: '',
    registrationDate: 'Reg. 12 Oct 2026',
    pickupStates: 'Ooty-Warehouse',
    address: '22 Garden Road, Ooty, Tamil Nadu 643001',
    isB2B: false,
  },
  {
    id: 'CUS-1015',
    name: 'Hotel Blue Hills',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0172',
    email: '',
    gstStatus: 'GST Recorded',
    preferredWarehouse: 'Ooty',
    ordersVisible: 6,
    lastPurchase: '8 Oct 2026',
    registrationDate: '20 Mar 2025 · Added by admin',
    pickupStates: 'Ooty-Warehouse',
    address: '1 Lake Road, Ooty, Tamil Nadu 643001',
    isB2B: true,
  },
  {
    id: 'CUS-1018',
    name: 'Nilgiri Tea & Produce Co',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0188',
    email: '',
    gstStatus: 'GST Recorded',
    preferredWarehouse: 'Ooty',
    ordersVisible: 4,
    lastPurchase: '2 Oct 2026',
    registrationDate: '15 Apr 2025 · Added by admin',
    pickupStates: 'Ooty-Warehouse',
    address: '12 Commercial Rd, Ooty, Tamil Nadu 643001',
    isB2B: true,
  },
  {
    id: 'CUS-1020',
    name: 'Western Ghats Cafe',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0195',
    email: '',
    gstStatus: 'GST Missing',
    preferredWarehouse: 'Ooty',
    ordersVisible: 3,
    lastPurchase: '1 Oct 2026',
    registrationDate: '2 May 2025 · Added by admin',
    pickupStates: 'Ooty-Warehouse',
    address: '5 Charing Cross, Ooty, Tamil Nadu 643001',
    isB2B: true,
  },
  {
    id: 'CUS-1022',
    name: 'Green Valley Resorts',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0204',
    email: '',
    gstStatus: 'GST Recorded',
    preferredWarehouse: 'Ooty',
    ordersVisible: 5,
    lastPurchase: '28 Sep 2026',
    registrationDate: '10 May 2025 · Added by admin',
    pickupStates: 'Ooty-Warehouse',
    address: 'Elk Hill, Ooty, Tamil Nadu 643001',
    isB2B: true,
  },
  {
    id: 'CUS-1025',
    name: 'Hill Top Organics',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0219',
    email: '',
    gstStatus: 'GST Recorded',
    preferredWarehouse: 'Coonoor',
    ordersVisible: 2,
    lastPurchase: '25 Sep 2026',
    registrationDate: '18 May 2025 · Added by admin',
    pickupStates: 'Coonoor-Warehouse',
    address: 'Coonoor Rd, Ooty, Tamil Nadu 643002',
    isB2B: true,
  },
  {
    id: 'CUS-1002',
    name: 'Kavitha Sundaram',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0221',
    preferredWarehouse: 'Ooty',
    ordersVisible: 1,
    lastPurchase: '20 Sep 2026',
    registrationDate: '15 Jan 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1003',
    name: 'Ravi Chandran',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0233',
    preferredWarehouse: 'Ooty',
    ordersVisible: 4,
    lastPurchase: '18 Sep 2026',
    registrationDate: '18 Jan 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1004',
    name: 'Meena Krishnan',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0245',
    preferredWarehouse: 'Coonoor',
    ordersVisible: 1,
    lastPurchase: '15 Sep 2026',
    registrationDate: '22 Jan 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1005',
    name: 'Suresh Kumar',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0258',
    preferredWarehouse: 'Ooty',
    ordersVisible: 3,
    lastPurchase: '12 Sep 2026',
    registrationDate: '1 Feb 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1006',
    name: 'Divya Balaji',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0262',
    preferredWarehouse: 'Ooty',
    ordersVisible: 2,
    lastPurchase: '8 Sep 2026',
    registrationDate: '5 Feb 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1008',
    name: 'Rajesh Varma',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0270',
    preferredWarehouse: 'Kotagiri',
    ordersVisible: 1,
    lastPurchase: '5 Sep 2026',
    registrationDate: '12 Feb 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1009',
    name: 'Deepa Natarajan',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0284',
    preferredWarehouse: 'Ooty',
    ordersVisible: 2,
    lastPurchase: '1 Sep 2026',
    registrationDate: '20 Feb 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1010',
    name: 'Saravanan Muthu',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0299',
    preferredWarehouse: 'Ooty',
    ordersVisible: 1,
    lastPurchase: '28 Aug 2026',
    registrationDate: '1 Mar 2025',
    isB2B: false,
  },
];

const DEFAULT_GST_BUSINESS: GstBusinessItem = {
  id: 'CUS-1012',
  legalName: 'Nilgiri Fresh Traders Pvt Ltd',
  businessType: 'Wholesale trader',
  contactPerson: 'Mr. Sundar',
  phone: '9000012345',
  email: '',
  status: 'Recorded',
  gstin: '33AABCN1234F1Z5',
  gstAddress: '44 Industrial Estate, Ooty',
  billingAddressLine1: '44 Industrial Estate',
  billingAddressLine2: '',
  city: 'Ooty',
  state: 'Tamil Nadu',
  pinCode: '643005',
  country: 'India',
  updatedDate: '5 Oct 2026',
  lastUpdatedFull: '5 Oct 2026, 10:00',
  missingInfo: 'None',
  invoicesIssued: 'None',
  subtext: 'CUS-1012 · B2B · Wholesale trader · Mr. Sundar\nGSTIN 33AABCN1234F1Z5 · 44 Industrial Estate, Ooty, 643005 · Updated 5 Oct 2026',
};

const GST_BUSINESS_DATA: GstBusinessItem[] = [
  DEFAULT_GST_BUSINESS,
  {
    id: 'CUS-1013',
    legalName: 'Highland Agro Supplies',
    businessType: 'Supplier',
    contactPerson: 'Ms. Rani',
    phone: '9842109876',
    email: '',
    status: 'Incomplete',
    gstin: '',
    gstAddress: '',
    billingAddressLine1: '',
    city: 'Coonoor',
    state: 'Tamil Nadu',
    pinCode: '643101',
    country: 'India',
    updatedDate: '24 Sep 2026',
    lastUpdatedFull: '24 Sep 2026, 15:30',
    missingInfo: 'GSTIN, Billing Address',
    invoicesIssued: 'None',
    subtext: 'CUS-1013 · B2B · Supplier · Ms. Rani\nGSTIN Missing · No billing address recorded · Updated 24 Sep 2026',
  },
  {
    id: 'CUS-1015',
    legalName: 'Hotel Blue Hills Pvt Ltd',
    businessType: 'Hotel',
    contactPerson: 'Chef Arjun',
    phone: '9789012345',
    email: '',
    status: 'Recorded',
    gstin: '33AABCH5678K1Z2',
    gstAddress: '1 Lake Road, Ooty',
    billingAddressLine1: '1 Lake Road',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pinCode: '643001',
    country: 'India',
    updatedDate: '8 Oct 2026',
    lastUpdatedFull: '8 Oct 2026, 11:20',
    missingInfo: 'None',
    invoicesIssued: 'None',
    subtext: 'CUS-1015 · HORECA · Hotel · Chef Arjun\nGSTIN 33AABCH5678K1Z2 · 1 Lake Road, Ooty, 643001 · Updated 8 Oct 2026',
  },
  {
    id: 'CUS-1018',
    legalName: 'Nilgiri Tea & Produce Co',
    businessType: 'Distributor',
    contactPerson: 'Mr. Ramesh',
    phone: '9443210987',
    email: '',
    status: 'Recorded',
    gstin: '33AAACN9876D1Z4',
    gstAddress: '12 Commercial Rd, Ooty',
    billingAddressLine1: '12 Commercial Rd',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pinCode: '643001',
    country: 'India',
    updatedDate: '2 Oct 2026',
    subtext: 'CUS-1018 · B2B · Distributor · Mr. Ramesh\nGSTIN 33AAACN9876D1Z4 · 12 Commercial Rd, Ooty, 643001 · Updated 2 Oct 2026',
  },
  {
    id: 'CUS-1020',
    legalName: 'Western Ghats Cafe',
    businessType: 'Cafe',
    contactPerson: 'Ms. Priya',
    phone: '9843211223',
    email: '',
    status: 'Incomplete',
    gstin: '',
    gstAddress: '',
    billingAddressLine1: '',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pinCode: '643001',
    country: 'India',
    updatedDate: '1 Oct 2026',
    subtext: 'CUS-1020 · HORECA · Cafe · Ms. Priya\nGSTIN Missing · Billing address pending · Updated 1 Oct 2026',
  },
  {
    id: 'CUS-1022',
    legalName: 'Green Valley Resorts',
    businessType: 'Resort',
    contactPerson: 'Mr. David',
    phone: '9442119988',
    email: '',
    status: 'Recorded',
    gstin: '33AABCG1122F1Z9',
    gstAddress: 'Elk Hill, Ooty',
    billingAddressLine1: 'Elk Hill',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pinCode: '643001',
    country: 'India',
    updatedDate: '28 Sep 2026',
    subtext: 'CUS-1022 · HORECA · Resort · Mr. David\nGSTIN 33AABCG1122F1Z9 · Elk Hill, Ooty, 643001 · Updated 28 Sep 2026',
  },
  {
    id: 'CUS-1025',
    legalName: 'Hill Top Organics',
    businessType: 'Retailer',
    contactPerson: 'Mr. Karthik',
    phone: '9443218877',
    email: '',
    status: 'Recorded',
    gstin: '33AABCH3344J1Z8',
    gstAddress: 'Coonoor Rd, Ooty',
    billingAddressLine1: 'Coonoor Rd',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pinCode: '643002',
    country: 'India',
    updatedDate: '25 Sep 2026',
    subtext: 'CUS-1025 · B2B · Retailer · Mr. Karthik\nGSTIN 33AABCH3344J1Z8 · Coonoor Rd, Ooty, 643002 · Updated 25 Sep 2026',
  },
];

const CUSTOMER_ORDERS_PREVIEW: CustomerOrderPreview[] = [
  {
    id: 'SO-0013',
    status: 'Delivered · Paid',
    statusTone: 'success',
    line1: '1 Oct 2026 · B2B · Potato 120 kg, Tomato 60 kg · ₹12,560.00',
    line2: 'Main Warehouse, Ooty · Invoice INV-0001',
  },
  {
    id: 'SO-0014',
    status: 'Processing · Pending',
    statusTone: 'warning',
    line1: '13 Oct 2026 · B2B · Beans 80 kg · ₹7,360.00',
    line2: 'Main Warehouse, Ooty · No invoice yet',
  },
];

// ─── Screen 1: Customers Management Screen ───────────────────────────────────

function CustomersManagementScreen({
  onBack,
  onOpenDirectory,
  onOpenGstBusiness,
}: {
  onBack: () => void;
  onOpenDirectory: () => void;
  onOpenGstBusiness: () => void;
}) {
  const [search, setSearch] = useState('');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('This week');

  const metrics: Array<{
    value: string;
    label: string;
    icon: 'users' | 'clipboard' | 'box' | 'orders' | 'alert';
    tone?: 'default' | 'warning' | 'danger';
  }> = [
    { value: '18', label: 'Total Customers', icon: 'users' },
    { value: '2', label: 'New Registrations', icon: 'clipboard' },
    { value: '11', label: 'Individual', icon: 'users' },
    { value: '7', label: 'Business (B2B/HORECA)', icon: 'box' },
    { value: '24', label: 'Recent Orders', icon: 'orders' },
    { value: '2', label: 'Business Details Pending', icon: 'alert', tone: 'warning' },
  ];

  return (
    <View style={customerStyles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={customerStyles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="custMgmtGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#custMgmtGrad)" />
        </Svg>

        <View style={customerStyles.headerTopRow}>
          <View style={customerStyles.headerTitleWithIconRow}>
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={customerStyles.headerBackBtn}
              accessibilityRole="button"
              accessibilityLabel="Back to More menu"
            >
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <CustomersManagementHeaderIcon size={22} color={adminColors.onBrand} />
            <Text style={customerStyles.headerTitle}>Customers Management</Text>
          </View>
          <CircularFilterButton onPress={() => setShowPeriodModal(true)} />
        </View>
      </View>

      <ScrollView
        style={customerStyles.scrollContainer}
        contentContainerStyle={customerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={customerStyles.searchBox}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={customerStyles.searchInput}
            placeholder="Search ID, name, mobile, GSTIN"
            placeholderTextColor={adminColors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* 6 Metric Cards Grid (using reusable OverviewDashboardCard) */}
        <OverviewCardsGrid style={{ marginBottom: adminSpacing.sm }}>
          {metrics.map((m, idx) => (
            <OverviewDashboardCard
              key={idx}
              title={m.label}
              value={m.value}
              icon={m.icon}
              tone={m.tone ?? 'default'}
              titlePosition="bottom"
            />
          ))}
        </OverviewCardsGrid>

        {/* Helper Note */}
        <Text style={customerStyles.helperNote}>
          New registrations, recent orders and the chart follow the period. Total customers and type counts are current totals, not period-based.
        </Text>

        {/* New registrations this period */}
        <Text style={customerStyles.sectionHeading}>New registrations this period</Text>
        <View style={customerStyles.chartCard}>
          <View style={customerStyles.progressRow}>
            <Text style={customerStyles.progressLabel}>Week of 7</Text>
            <View style={customerStyles.progressTrack}>
              <View style={[customerStyles.progressFill, { width: '40%' }]} />
            </View>
            <Text style={customerStyles.progressValue}>1</Text>
          </View>

          <View style={[customerStyles.progressRow, { marginTop: 12 }]}>
            <Text style={customerStyles.progressLabel}>Week of 14</Text>
            <View style={customerStyles.progressTrack}>
              <View style={[customerStyles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={customerStyles.progressValue}>1</Text>
          </View>
        </View>

        {/* Recent customers */}
        <Text style={customerStyles.sectionHeading}>Recent customers</Text>
        <View style={customerStyles.recentCustomerCard}>
          <View style={customerStyles.cardTopRow}>
            <Text style={customerStyles.customerCardTitle}>CUS-1011 · Lakshmi Narayan</Text>
            <View style={customerStyles.badgePending}>
              <Text style={customerStyles.badgePendingText}>Pending activation</Text>
            </View>
          </View>
          <Text style={customerStyles.customerCardSubtext}>
            Individual · +91 ••••• 0164 · Reg. 13 Oct 2026 · No preferred warehouse · No orders yet
          </Text>
        </View>

        <View style={customerStyles.recentCustomerCard}>
          <View style={customerStyles.cardTopRow}>
            <Text style={customerStyles.customerCardTitle}>CUS-1007 · Priya Nair</Text>
            <View style={customerStyles.badgeActive}>
              <Text style={customerStyles.badgeActiveText}>Active</Text>
            </View>
          </View>
          <Text style={customerStyles.customerCardSubtext}>
            Individual · +91 ••••• 0157 · Reg. 12 Oct 2026 · No preferred warehouse · No orders yet
          </Text>
        </View>

        {/* Quick actions */}
        <Text style={customerStyles.sectionHeading}>Quick actions</Text>
        <View style={customerStyles.quickActionsRow}>
          <TouchableOpacity
            style={customerStyles.quickActionCard}
            onPress={onOpenDirectory}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Customer Directory"
          >
            <CustomerDirectoryActionIcon size={26} color={adminColors.brand} />
            <Text style={customerStyles.quickActionText}>Customer Directory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={customerStyles.quickActionCard}
            onPress={onOpenGstBusiness}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="GST & Business"
          >
            <GstBuildingActionIcon size={26} color={adminColors.brand} />
            <Text style={customerStyles.quickActionText}>GST & Business</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Period Filter Modal */}
      <Modal
        visible={showPeriodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <TouchableOpacity
          style={customerStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPeriodModal(false)}
        >
          <TouchableOpacity
            style={customerStyles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={customerStyles.modalTitle}>Filter Customer Period</Text>

            <Text style={customerStyles.filterSectionTitle}>Select Period</Text>
            <View style={customerStyles.filterChipsRow}>
              {['This week', 'Last week', 'This month', 'Last 30 days', 'All time'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[customerStyles.filterChip, selectedPeriod === p && customerStyles.filterChipActive]}
                  onPress={() => setSelectedPeriod(p)}
                >
                  <Text style={[customerStyles.filterChipText, selectedPeriod === p && customerStyles.filterChipTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={customerStyles.modalButtonsRow}>
              <TouchableOpacity
                style={customerStyles.modalResetBtn}
                onPress={() => {
                  setSelectedPeriod('This week');
                  setShowPeriodModal(false);
                }}
              >
                <Text style={customerStyles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customerStyles.modalApplyBtn}
                onPress={() => setShowPeriodModal(false)}
              >
                <Text style={customerStyles.modalApplyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Screen 2: Customer Directory Screen ─────────────────────────────────────

function CustomerDirectoryScreen({
  onBack,
  onSelectCustomer,
  onAddNewCustomer,
}: {
  onBack: () => void;
  onSelectCustomer: (customer: CustomerItem) => void;
  onAddNewCustomer: () => void;
}) {
  const [search, setSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'Individual' | 'B2B'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Pending activation'>('All');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('All');

  const filtered = CUSTOMERS_DATA.filter((c) => {
    if (filterType !== 'All' && c.type !== filterType) return false;
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    if (filterWarehouse !== 'All' && c.preferredWarehouse !== filterWarehouse) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
  });

  const handleResetFilters = () => {
    setFilterType('All');
    setFilterStatus('All');
    setFilterWarehouse('All');
    setShowFilterModal(false);
  };

  return (
    <View style={customerStyles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={customerStyles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="custDirGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#custDirGrad)" />
        </Svg>

        <View style={customerStyles.headerTopRow}>
          <View style={customerStyles.headerTitleWithIconRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={customerStyles.headerTitle}>Customer Directory</Text>
          </View>
          <CircularPlusButton onPress={onAddNewCustomer} />
        </View>
      </View>

      <ScrollView
        style={customerStyles.scrollContainer}
        contentContainerStyle={customerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with filter */}
        <View style={customerStyles.searchBox}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={customerStyles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
            style={(filterType !== 'All' || filterStatus !== 'All' || filterWarehouse !== 'All') ? customerStyles.filterBtnActive : undefined}
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        <Text style={customerStyles.directoryCountText}>{filtered.length} customer</Text>

        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={customerStyles.customerCard}
            onPress={() => onSelectCustomer(item)}
            activeOpacity={0.75}
          >
            <View style={customerStyles.cardTopRow}>
              <Text style={customerStyles.customerCardTitle}>
                {item.id} · {item.name}
              </Text>
              <View style={item.status === 'Active' ? customerStyles.badgeActive : customerStyles.badgePending}>
                <Text style={item.status === 'Active' ? customerStyles.badgeActiveText : customerStyles.badgePendingText}>
                  {item.status}
                </Text>
              </View>
            </View>

            <Text style={customerStyles.customerCardMetaLine1}>
              {item.type} · {item.phone} · {item.gstStatus || 'GST Recorded'} · Preferred: {item.preferredWarehouse}
            </Text>

            <Text style={customerStyles.customerCardMetaLine2}>
              {item.ordersVisible !== undefined ? `${item.ordersVisible} orders visible` : 'No orders'}
              {item.lastPurchase ? ` · Last purchase ${item.lastPurchase}` : ''}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Suitable Filter Popup Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={customerStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <TouchableOpacity
            style={customerStyles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={customerStyles.modalTitle}>Filter Customer Directory</Text>

            {/* Customer Type */}
            <Text style={customerStyles.filterSectionTitle}>Customer Type</Text>
            <View style={customerStyles.filterChipsRow}>
              {(['All', 'Individual', 'B2B'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[customerStyles.filterChip, filterType === t && customerStyles.filterChipActive]}
                  onPress={() => setFilterType(t)}
                >
                  <Text style={[customerStyles.filterChipText, filterType === t && customerStyles.filterChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status */}
            <Text style={customerStyles.filterSectionTitle}>Status</Text>
            <View style={customerStyles.filterChipsRow}>
              {(['All', 'Active', 'Pending activation'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[customerStyles.filterChip, filterStatus === s && customerStyles.filterChipActive]}
                  onPress={() => setFilterStatus(s)}
                >
                  <Text style={[customerStyles.filterChipText, filterStatus === s && customerStyles.filterChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preferred Warehouse */}
            <Text style={customerStyles.filterSectionTitle}>Preferred Warehouse</Text>
            <View style={customerStyles.filterChipsRow}>
              {['All', 'Ooty', 'Coonoor', 'Kotagiri'].map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[customerStyles.filterChip, filterWarehouse === w && customerStyles.filterChipActive]}
                  onPress={() => setFilterWarehouse(w)}
                >
                  <Text style={[customerStyles.filterChipText, filterWarehouse === w && customerStyles.filterChipTextActive]}>
                    {w}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={customerStyles.modalButtonsRow}>
              <TouchableOpacity
                style={customerStyles.modalResetBtn}
                onPress={handleResetFilters}
              >
                <Text style={customerStyles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customerStyles.modalApplyBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={customerStyles.modalApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Screen 2b: Add Customer Screen ──────────────────────────────────────────

function AddCustomerScreen({
  onBack,
  onSaveCustomer,
}: {
  onBack: () => void;
  onSaveCustomer: (customer: CustomerItem) => void;
}) {
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [customerType, setCustomerType] = useState<'Individual' | 'B2B'>('Individual');

  // Address
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Business information
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gstin, setGstin] = useState('');
  const [bizAddressLine1, setBizAddressLine1] = useState('');
  const [bizCity, setBizCity] = useState('');
  const [bizState, setBizState] = useState('');
  const [bizPinCode, setBizPinCode] = useState('');

  // Preferences
  const [warehouse, setWarehouse] = useState('None');

  const handleSave = () => {
    if (!customerName.trim()) {
      Alert.alert('Required Field', 'Please enter customer name.');
      return;
    }
    if (!mobileNumber.trim()) {
      Alert.alert('Required Field', 'Please enter mobile number.');
      return;
    }

    const newId = `CUS-${1026 + Math.floor(Math.random() * 900)}`;
    const newCust: CustomerItem = {
      id: newId,
      name: customerName.trim(),
      type: customerType,
      displayType: customerType === 'B2B' ? 'B2B' : 'online',
      status: 'Active',
      phone: mobileNumber.trim(),
      email: email.trim(),
      gstStatus: customerType === 'B2B' ? (gstin.trim() ? 'GST Recorded' : 'GST Missing') : 'Not applicable',
      preferredWarehouse: warehouse !== 'None' ? warehouse : 'No preferred warehouse',
      ordersVisible: 0,
      registrationDate: 'Reg. today · Added by admin',
      pickupStates: warehouse !== 'None' ? warehouse : 'Ooty-Warehouse',
      address: addressLine1.trim()
        ? `${addressLine1.trim()}, ${city.trim() || 'Ooty'}, ${state.trim() || 'Tamil Nadu'} ${pinCode.trim()}`
        : '44 Industrial Estate, Ooty, Tamil Nadu 643005',
      isB2B: customerType === 'B2B',
    };

    onSaveCustomer(newCust);
  };

  return (
    <View style={customerStyles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={customerStyles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="addCustGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#addCustGrad)" />
        </Svg>

        <View style={customerStyles.headerTopRow}>
          <View style={customerStyles.headerTitleWithIconRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={customerStyles.headerTitle}>Add customer</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={customerStyles.scrollContainer}
        contentContainerStyle={customerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Information */}
        <Text style={customerStyles.formSectionTitle}>Personal Information</Text>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>
            Customer name <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>
            Mobile number <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Email</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Customer type</Text>
          <TouchableOpacity
            style={customerStyles.formDropdownButton}
            onPress={() => setCustomerType((prev) => (prev === 'Individual' ? 'B2B' : 'Individual'))}
            activeOpacity={0.7}
          >
            <Text style={customerStyles.formDropdownText}>{customerType}</Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>
        </View>

        {/* Address */}
        <Text style={customerStyles.formSectionTitle}>Address</Text>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Address line 1</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Address line 2</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>City</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={city}
            onChangeText={setCity}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>State</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={state}
            onChangeText={setState}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Pin code</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={pinCode}
            onChangeText={setPinCode}
            keyboardType="number-pad"
            placeholder=""
          />
        </View>

        {/* Business information */}
        <Text style={customerStyles.formSectionTitle}>Business information</Text>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Business/legal name</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Business type</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={businessType}
            onChangeText={setBusinessType}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>GSTIN (if applicable)</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={gstin}
            onChangeText={setGstin}
            autoCapitalize="characters"
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Business address line 1</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={bizAddressLine1}
            onChangeText={setBizAddressLine1}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>City</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={bizCity}
            onChangeText={setBizCity}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>State</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={bizState}
            onChangeText={setBizState}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Pin code</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={bizPinCode}
            onChangeText={setBizPinCode}
            keyboardType="number-pad"
            placeholder=""
          />
        </View>

        {/* Preferences */}
        <Text style={customerStyles.formSectionTitle}>Preferences</Text>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Preferred warehouse (optional)</Text>
          <TouchableOpacity
            style={customerStyles.formDropdownButton}
            onPress={() => {
              const options = ['None', 'Ooty-Warehouse', 'Coonoor-Warehouse', 'Kotagiri-Warehouse'];
              const curIdx = options.indexOf(warehouse);
              setWarehouse(options[(curIdx + 1) % options.length] || 'None');
            }}
            activeOpacity={0.7}
          >
            <Text style={customerStyles.formDropdownText}>{warehouse}</Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>
          <Text style={customerStyles.formHelperNote}>Communication preferences are not configured, so they are not collected.</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom Action Bar with Save and Cancel */}
      <View style={customerStyles.addCustomerBottomBar}>
        <TouchableOpacity
          style={customerStyles.addCustomerSaveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={customerStyles.addCustomerSaveText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={customerStyles.addCustomerCancelBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={customerStyles.addCustomerCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen 3: Customer Details Screen ───────────────────────────────────────

function CustomerDetailScreen({
  customer,
  onBack,
}: {
  customer: CustomerItem | null;
  onBack: () => void;
}) {
  const item = customer ?? DEFAULT_CUSTOMER;
  const isB2B = item.isB2B || item.type === 'B2B';

  const [activeTab, setActiveTab] = useState<'Personal' | 'Purchase History' | 'Business'>('Personal');
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);

  // Editable fields state
  const [custName, setCustName] = useState(item.name);
  const [custPhone, setCustPhone] = useState(item.phone);
  const [custEmail, setCustEmail] = useState(item.email || '');
  const [custAddress, setCustAddress] = useState(item.address || '44 Industrial Estate, Ooty, Tamil Nadu 643005');
  const [custStatus, setCustStatus] = useState(item.status);
  const [custType, setCustType] = useState(item.displayType || (isB2B ? 'B2B' : 'Individual'));

  // Form edit states
  const [editName, setEditName] = useState(custName);
  const [editPhone, setEditPhone] = useState(custPhone);
  const [editEmail, setEditEmail] = useState(custEmail);
  const [editAddress, setEditAddress] = useState(custAddress);
  const [editStatus, setEditStatus] = useState(custStatus);
  const [editType, setEditType] = useState(custType);

  const handleOpenEdit = () => {
    setEditName(custName);
    setEditPhone(custPhone);
    setEditEmail(custEmail);
    setEditAddress(custAddress);
    setEditStatus(custStatus);
    setEditType(custType);
    setShowEditCustomerModal(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Customer name is required.');
      return;
    }
    setCustName(editName.trim());
    setCustPhone(editPhone.trim());
    setCustEmail(editEmail.trim());
    setCustAddress(editAddress.trim());
    setCustStatus(editStatus);
    setCustType(editType);
    setShowEditCustomerModal(false);
    Alert.alert('Updated', 'Customer details updated successfully.');
  };

  return (
    <View style={customerStyles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={customerStyles.headerBannerDetails}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="custDetailGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#custDetailGrad)" />
        </Svg>

        <View style={customerStyles.headerTopRow}>
          <View style={customerStyles.headerTitleCol}>
            <View style={customerStyles.headerTitleWithIconRow}>
              <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={customerStyles.headerTitle}>Customer details</Text>
            </View>
            <Text style={customerStyles.headerSubtitle}>
              {item.id} · {custType} · {custStatus}
            </Text>
          </View>
          <CircularEditButton onPress={handleOpenEdit} />
        </View>
      </View>

      <ScrollView
        style={customerStyles.scrollContainer}
        contentContainerStyle={customerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Segmented Tabs */}
        <View style={customerStyles.segmentedTabsRow}>
          <TouchableOpacity
            style={[customerStyles.tabPill, activeTab === 'Personal' && customerStyles.tabPillActive]}
            onPress={() => setActiveTab('Personal')}
            activeOpacity={0.8}
          >
            <Text style={[customerStyles.tabPillText, activeTab === 'Personal' && customerStyles.tabPillTextActive]}>
              Personal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[customerStyles.tabPill, activeTab === 'Purchase History' && customerStyles.tabPillActive]}
            onPress={() => setActiveTab('Purchase History')}
            activeOpacity={0.8}
          >
            <Text style={[customerStyles.tabPillText, activeTab === 'Purchase History' && customerStyles.tabPillTextActive]}>
              Purchase History
            </Text>
          </TouchableOpacity>

          {isB2B && (
            <TouchableOpacity
              style={[customerStyles.tabPill, activeTab === 'Business' && customerStyles.tabPillActive]}
              onPress={() => setActiveTab('Business')}
              activeOpacity={0.8}
            >
              <Text style={[customerStyles.tabPillText, activeTab === 'Business' && customerStyles.tabPillTextActive]}>
                Business
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section Heading */}
        <Text style={customerStyles.sectionHeading}>Personal details</Text>

        {/* Personal Details Card */}
        <View style={customerStyles.detailsCard}>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Customer name</Text>
            <Text style={customerStyles.detailValue}>{custName}</Text>
          </View>

          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Customer ID</Text>
            <Text style={customerStyles.detailValue}>{item.id}</Text>
          </View>

          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Customer type</Text>
            <Text style={customerStyles.detailValue}>{custType}</Text>
          </View>

          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Mobile</Text>
            <Text style={customerStyles.detailValue}>{custPhone}</Text>
          </View>

          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Email</Text>
            <Text style={customerStyles.detailValue}>{custEmail || '—'}</Text>
          </View>

          <View style={[customerStyles.detailRow, { alignItems: 'flex-start' }]}>
            <Text style={[customerStyles.detailLabel, { marginTop: 2 }]}>Address</Text>
            <Text style={[customerStyles.detailValue, { flex: 1, textAlign: 'right', marginLeft: 16 }]}>
              {custAddress}
            </Text>
          </View>

          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Registered</Text>
            <Text style={customerStyles.detailValue}>{item.registrationDate || '5 Jan 2025 · Added by admin'}</Text>
          </View>

          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Pickup states</Text>
            <Text style={customerStyles.detailValue}>{item.pickupStates || 'Ooty-Warehouse'}</Text>
          </View>

          <View style={[customerStyles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={customerStyles.detailLabel}>Status</Text>
            <Text style={[customerStyles.detailValue, { color: adminColors.success.text }]}>{custStatus}</Text>
          </View>
        </View>

        {/* Masked note */}
        <Text style={customerStyles.maskedWarehouseNote}>
          A warehouse role would see this masked — first name and an initial, no email, and only the city/state/pin.
        </Text>

        {/* Purchase history preview */}
        <Text style={customerStyles.sectionHeading}>Purchase history (preview)</Text>

        {CUSTOMER_ORDERS_PREVIEW.map((order) => (
          <View key={order.id} style={customerStyles.orderPreviewCard}>
            <View style={customerStyles.cardTopRow}>
              <Text style={customerStyles.orderCardId}>{order.id}</Text>
              <View
                style={
                  order.statusTone === 'success' ? customerStyles.badgeActive : customerStyles.badgeWarningSoft
                }
              >
                <Text
                  style={
                    order.statusTone === 'success'
                      ? customerStyles.badgeActiveText
                      : customerStyles.badgeWarningSoftText
                  }
                >
                  {order.status}
                </Text>
              </View>
            </View>
            <Text style={customerStyles.orderCardLine1}>{order.line1}</Text>
            <Text style={customerStyles.orderCardLine2}>{order.line2}</Text>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Customer Popup Modal */}
      <Modal
        visible={showEditCustomerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditCustomerModal(false)}
      >
        <TouchableOpacity
          style={customerStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditCustomerModal(false)}
        >
          <TouchableOpacity
            style={customerStyles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={customerStyles.modalTitle}>Edit Customer Details</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={customerStyles.modalLabel}>Customer Name *</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full Name"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={customerStyles.modalLabel}>Mobile Number</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Mobile"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={customerStyles.modalLabel}>Email Address</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Email"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={customerStyles.modalLabel}>Address</Text>
              <TextInput
                style={[customerStyles.modalInput, { height: 56, textAlignVertical: 'top' }]}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Address"
                placeholderTextColor={adminColors.placeholder}
                multiline
              />

              <Text style={customerStyles.modalLabel}>Customer Type</Text>
              <View style={customerStyles.filterChipsRow}>
                {['Individual', 'B2B'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[customerStyles.filterChip, editType === t && customerStyles.filterChipActive]}
                    onPress={() => setEditType(t)}
                  >
                    <Text style={[customerStyles.filterChipText, editType === t && customerStyles.filterChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={customerStyles.modalLabel}>Status</Text>
              <View style={customerStyles.filterChipsRow}>
                {(['Active', 'Pending activation'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[customerStyles.filterChip, editStatus === s && customerStyles.filterChipActive]}
                    onPress={() => setEditStatus(s)}
                  >
                    <Text style={[customerStyles.filterChipText, editStatus === s && customerStyles.filterChipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={customerStyles.modalButtonsRow}>
              <TouchableOpacity
                style={customerStyles.modalResetBtn}
                onPress={() => setShowEditCustomerModal(false)}
              >
                <Text style={customerStyles.modalResetBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customerStyles.modalApplyBtn}
                onPress={handleSaveEdit}
              >
                <Text style={customerStyles.modalApplyBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Screen 4: GST & Business Screen ─────────────────────────────────────────

function GstBusinessScreen({
  onBack,
  onSelectBusiness,
}: {
  onBack: () => void;
  onSelectBusiness: (biz: GstBusinessItem) => void;
}) {
  const [search, setSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Recorded' | 'Incomplete'>('All');
  const [filterBusinessType, setFilterBusinessType] = useState<string>('All');
  const [filterGstinStatus, setFilterGstinStatus] = useState<'All' | 'Has GSTIN' | 'Missing GSTIN'>('All');

  const filtered = GST_BUSINESS_DATA.filter((b) => {
    if (filterStatus !== 'All' && b.status !== filterStatus) return false;
    if (filterBusinessType !== 'All' && b.businessType !== filterBusinessType) return false;
    if (filterGstinStatus === 'Has GSTIN' && !b.gstin) return false;
    if (filterGstinStatus === 'Missing GSTIN' && b.gstin) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.legalName.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.gstin.toLowerCase().includes(q);
  });

  const handleResetFilters = () => {
    setFilterStatus('All');
    setFilterBusinessType('All');
    setFilterGstinStatus('All');
    setShowFilterModal(false);
  };

  return (
    <View style={customerStyles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={customerStyles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="gstBizGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#gstBizGrad)" />
        </Svg>

        <View style={customerStyles.headerTopRow}>
          <View style={customerStyles.headerTitleWithIconRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={customerStyles.headerTitle}>GST & Business</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={customerStyles.scrollContainer}
        contentContainerStyle={customerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with filter */}
        <View style={customerStyles.searchBox}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={customerStyles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
            style={(filterStatus !== 'All' || filterBusinessType !== 'All' || filterGstinStatus !== 'All') ? customerStyles.filterBtnActive : undefined}
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        <Text style={customerStyles.directoryCountText}>7 business customers · 2 incomplete</Text>

        {filtered.map((item) => {
          const isIncomplete = item.status === 'Incomplete';
          return (
            <TouchableOpacity
              key={item.id}
              style={[customerStyles.customerCard, isIncomplete && customerStyles.customerCardIncomplete]}
              onPress={() => onSelectBusiness(item)}
              activeOpacity={0.75}
            >
              <View style={customerStyles.cardTopRow}>
                <Text style={customerStyles.customerCardTitle}>{item.legalName}</Text>
                <View style={isIncomplete ? customerStyles.badgeIncomplete : customerStyles.badgeRecorded}>
                  <Text style={isIncomplete ? customerStyles.badgeIncompleteText : customerStyles.badgeRecordedText}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={customerStyles.customerCardMetaLine1}>
                {item.id} · B2B · {item.businessType} · {item.contactPerson}
              </Text>

              <Text style={customerStyles.customerCardMetaLine2}>
                {item.gstin ? `GSTIN ${item.gstin} · ` : 'GSTIN Missing · '}
                {item.gstAddress ? `${item.gstAddress} · ` : 'No billing address recorded · '}
                Updated {item.updatedDate}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Suitable Filter Popup Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={customerStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <TouchableOpacity
            style={customerStyles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={customerStyles.modalTitle}>Filter GST & Business</Text>

            {/* Status Filter */}
            <Text style={customerStyles.filterSectionTitle}>Status</Text>
            <View style={customerStyles.filterChipsRow}>
              {(['All', 'Recorded', 'Incomplete'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[customerStyles.filterChip, filterStatus === s && customerStyles.filterChipActive]}
                  onPress={() => setFilterStatus(s)}
                >
                  <Text style={[customerStyles.filterChipText, filterStatus === s && customerStyles.filterChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Business Type */}
            <Text style={customerStyles.filterSectionTitle}>Business Type</Text>
            <View style={customerStyles.filterChipsRow}>
              {['All', 'Wholesale trader', 'Supplier', 'Hotel', 'Distributor'].map((bt) => (
                <TouchableOpacity
                  key={bt}
                  style={[customerStyles.filterChip, filterBusinessType === bt && customerStyles.filterChipActive]}
                  onPress={() => setFilterBusinessType(bt)}
                >
                  <Text style={[customerStyles.filterChipText, filterBusinessType === bt && customerStyles.filterChipTextActive]}>
                    {bt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* GSTIN Status */}
            <Text style={customerStyles.filterSectionTitle}>GSTIN Status</Text>
            <View style={customerStyles.filterChipsRow}>
              {(['All', 'Has GSTIN', 'Missing GSTIN'] as const).map((gs) => (
                <TouchableOpacity
                  key={gs}
                  style={[customerStyles.filterChip, filterGstinStatus === gs && customerStyles.filterChipActive]}
                  onPress={() => setFilterGstinStatus(gs)}
                >
                  <Text style={[customerStyles.filterChipText, filterGstinStatus === gs && customerStyles.filterChipTextActive]}>
                    {gs}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Modal Buttons */}
            <View style={customerStyles.modalButtonsRow}>
              <TouchableOpacity
                style={customerStyles.modalResetBtn}
                onPress={handleResetFilters}
              >
                <Text style={customerStyles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customerStyles.modalApplyBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={customerStyles.modalApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Screen 5: GST & Business Details Screen ─────────────────────────────────

function GstBusinessDetailScreen({
  business,
  onBack,
}: {
  business: GstBusinessItem | null;
  onBack: () => void;
}) {
  const item = business ?? DEFAULT_GST_BUSINESS;

  // Local state for business details
  const [legalName, setLegalName] = useState(item.legalName);
  const [businessType, setBusinessType] = useState(item.businessType);
  const [contactPerson, setContactPerson] = useState(item.contactPerson);
  const [phone, setPhone] = useState(item.phone);
  const [email, setEmail] = useState(item.email || '');
  const [gstin, setGstin] = useState(item.gstin || '');
  const [gstAddress, setGstAddress] = useState(item.gstAddress || '44 Industrial Estate, Ooty');
  const [billingAddressLine1, setBillingAddressLine1] = useState(item.billingAddressLine1 || '44 Industrial Estate');
  const [billingAddressLine2] = useState(item.billingAddressLine2 || '');
  const [city, setCity] = useState(item.city || 'Ooty');
  const [state, setState] = useState(item.state || 'Tamil Nadu');
  const [pinCode, setPinCode] = useState(item.pinCode || '643005');
  const [country] = useState(item.country || 'India');
  const [status, setStatus] = useState(item.status);
  const [missingInfo, setMissingInfo] = useState(item.missingInfo || (item.status === 'Incomplete' ? 'GSTIN, Billing Address' : 'None'));
  const [lastUpdatedFull, setLastUpdatedFull] = useState(item.lastUpdatedFull || '5 Oct 2026, 10:00');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLegalName, setEditLegalName] = useState(legalName);
  const [editBusinessType, setEditBusinessType] = useState(businessType);
  const [editContactPerson, setEditContactPerson] = useState(contactPerson);
  const [editPhone, setEditPhone] = useState(phone);
  const [editEmail, setEditEmail] = useState(email);
  const [editGstin, setEditGstin] = useState(gstin);
  const [editGstAddress, setEditGstAddress] = useState(gstAddress);
  const [editBillingAddress, setEditBillingAddress] = useState(billingAddressLine1);
  const [editCity, setEditCity] = useState(city);
  const [editState, setEditState] = useState(state);
  const [editPinCode, setEditPinCode] = useState(pinCode);
  const [editStatus, setEditStatus] = useState(status);

  const handleOpenEdit = () => {
    setEditLegalName(legalName);
    setEditBusinessType(businessType);
    setEditContactPerson(contactPerson);
    setEditPhone(phone);
    setEditEmail(email);
    setEditGstin(gstin);
    setEditGstAddress(gstAddress);
    setEditBillingAddress(billingAddressLine1);
    setEditCity(city);
    setEditState(state);
    setEditPinCode(pinCode);
    setEditStatus(status);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editLegalName.trim()) {
      Alert.alert('Required', 'Legal/business name is required.');
      return;
    }
    setLegalName(editLegalName.trim());
    setBusinessType(editBusinessType);
    setContactPerson(editContactPerson.trim());
    setPhone(editPhone.trim());
    setEmail(editEmail.trim());
    setGstin(editGstin.trim());
    setGstAddress(editGstAddress.trim());
    setBillingAddressLine1(editBillingAddress.trim());
    setCity(editCity.trim());
    setState(editState.trim());
    setPinCode(editPinCode.trim());
    setStatus(editStatus);

    if (editStatus === 'Incomplete' || !editGstin.trim() || !editBillingAddress.trim()) {
      setMissingInfo(editGstin.trim() ? 'Billing Address' : 'GSTIN, Billing Address');
    } else {
      setMissingInfo('None');
    }
    setLastUpdatedFull('Just now');
    setShowEditModal(false);
    Alert.alert('Updated', 'GST & Business details updated successfully.');
  };

  return (
    <View style={customerStyles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={customerStyles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="gstBizDetailGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#gstBizDetailGrad)" />
        </Svg>

        <View style={customerStyles.headerTopRow}>
          <View style={customerStyles.headerTitleWithIconRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={customerStyles.headerTitle}>GST & Business Details</Text>
          </View>
          <CircularEditButton onPress={handleOpenEdit} />
        </View>
      </View>

      <ScrollView
        style={customerStyles.scrollContainer}
        contentContainerStyle={customerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Summary Box */}
        <View style={customerStyles.summaryBox}>
          <View style={customerStyles.summaryBoxRow}>
            <Text style={customerStyles.summaryBoxLabel}>Missing required information</Text>
            <Text style={customerStyles.summaryBoxValue}>{missingInfo}</Text>
          </View>
          <View style={customerStyles.summaryBoxRow}>
            <Text style={customerStyles.summaryBoxLabel}>Invoices issued</Text>
            <Text style={customerStyles.summaryBoxValue}>{item.invoicesIssued || 'None'}</Text>
          </View>
          <View style={[customerStyles.summaryBoxRow, { borderBottomWidth: 0 }]}>
            <Text style={customerStyles.summaryBoxLabel}>Last updated</Text>
            <Text style={customerStyles.summaryBoxValue}>{lastUpdatedFull}</Text>
          </View>
        </View>

        {/* Section 1: Business Identity */}
        <Text style={customerStyles.formSectionTitle}>Business Identity</Text>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>
            Legal/business name <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{legalName}</Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>
            Business type <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{businessType}</Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Contact person</Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{contactPerson}</Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Business phone</Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{phone}</Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Business email</Text>
          <View style={customerStyles.formInputBox}>
            <Text style={[customerStyles.formInputText, { color: adminColors.muted }]}>{email || ' '}</Text>
          </View>
        </View>

        {/* Section 2: GST details */}
        <Text style={customerStyles.formSectionTitle}>GST details</Text>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>GSTIN</Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{gstin || ' '}</Text>
          </View>
          <Text style={customerStyles.formHelperNote}>Format is checked. It is recorded, not verified with GST.</Text>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Registered business name</Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{legalName}</Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>GST registered address</Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{gstAddress}</Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <View style={customerStyles.formLabelRow}>
            <Text style={customerStyles.formLabel}>GST registration status</Text>
            <View style={{ marginLeft: 6 }}>
              <LockIcon size={13} color={adminColors.muted} />
            </View>
          </View>
          <View style={[customerStyles.formInputBox, customerStyles.formInputBoxLocked]}>
            <Text style={[customerStyles.formInputText, customerStyles.formInputTextLocked]}>
              Not verified (no verification service is integrated)
            </Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <View style={customerStyles.formLabelRow}>
            <Text style={customerStyles.formLabel}>Verification reference or date</Text>
            <View style={{ marginLeft: 6 }}>
              <LockIcon size={13} color={adminColors.muted} />
            </View>
          </View>
          <View style={[customerStyles.formInputBox, customerStyles.formInputBoxLocked]}>
            <Text style={[customerStyles.formInputText, customerStyles.formInputTextLocked]}>
              Not supported
            </Text>
          </View>
        </View>

        {/* Section 3: Billing address */}
        <Text style={customerStyles.formSectionTitle}>Billing address</Text>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>
            Address line 1 <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{billingAddressLine1}</Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Address line 2</Text>
          <View style={customerStyles.formInputBox}>
            <Text style={[customerStyles.formInputText, { color: adminColors.muted }]}>{billingAddressLine2 || ' '}</Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>
            City <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{city}</Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>
            State <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{state}</Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>
            PIN code <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{pinCode}</Text>
          </View>
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Country</Text>
          <View style={customerStyles.formInputBox}>
            <Text style={customerStyles.formInputText}>{country}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit GST & Business Details Popup Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity
          style={customerStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <TouchableOpacity
            style={customerStyles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={customerStyles.modalTitle}>Edit GST & Business Details</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <Text style={customerStyles.modalLabel}>Legal / Business Name *</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editLegalName}
                onChangeText={setEditLegalName}
                placeholder="Business Name"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={customerStyles.modalLabel}>Business Type</Text>
              <View style={customerStyles.filterChipsRow}>
                {['Wholesale trader', 'Supplier', 'Hotel', 'Distributor', 'Retailer'].map((bt) => (
                  <TouchableOpacity
                    key={bt}
                    style={[customerStyles.filterChip, editBusinessType === bt && customerStyles.filterChipActive]}
                    onPress={() => setEditBusinessType(bt)}
                  >
                    <Text style={[customerStyles.filterChipText, editBusinessType === bt && customerStyles.filterChipTextActive]}>
                      {bt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={customerStyles.modalLabel}>Contact Person</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editContactPerson}
                onChangeText={setEditContactPerson}
                placeholder="Contact Person"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={customerStyles.modalLabel}>Business Phone</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={customerStyles.modalLabel}>Business Email</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Email"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={customerStyles.modalLabel}>GSTIN</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editGstin}
                onChangeText={setEditGstin}
                placeholder="GSTIN (e.g. 33AABCN1234F1Z5)"
                placeholderTextColor={adminColors.placeholder}
                autoCapitalize="characters"
              />

              <Text style={customerStyles.modalLabel}>GST Registered Address</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editGstAddress}
                onChangeText={setEditGstAddress}
                placeholder="Registered Address"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={customerStyles.modalLabel}>Billing Address</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editBillingAddress}
                onChangeText={setEditBillingAddress}
                placeholder="Billing Address Line 1"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={customerStyles.modalLabel}>City</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editCity}
                onChangeText={setEditCity}
                placeholder="City"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={customerStyles.modalLabel}>State</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editState}
                onChangeText={setEditState}
                placeholder="State"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={customerStyles.modalLabel}>PIN Code</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editPinCode}
                onChangeText={setEditPinCode}
                placeholder="PIN code"
                placeholderTextColor={adminColors.placeholder}
                keyboardType="number-pad"
              />

              <Text style={customerStyles.modalLabel}>Status</Text>
              <View style={customerStyles.filterChipsRow}>
                {(['Recorded', 'Incomplete'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[customerStyles.filterChip, editStatus === st && customerStyles.filterChipActive]}
                    onPress={() => setEditStatus(st)}
                  >
                    <Text style={[customerStyles.filterChipText, editStatus === st && customerStyles.filterChipTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={customerStyles.modalButtonsRow}>
              <TouchableOpacity
                style={customerStyles.modalResetBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={customerStyles.modalResetBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customerStyles.modalApplyBtn}
                onPress={handleSaveEdit}
              >
                <Text style={customerStyles.modalApplyBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Customer Module Stylesheet ───────────────────────────────────────────────

const customerStyles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: 16,
    backgroundColor: adminColors.brand,
  },
  headerBannerDetails: {
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: 16,
    backgroundColor: adminColors.brand,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitleWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBackBtn: {
    paddingRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.onBrand,
    opacity: 0.88,
    marginTop: 4,
    marginLeft: 34,
  },
  circularHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtnActive: {
    backgroundColor: adminColors.brandTint,
    borderRadius: 8,
    padding: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: adminColors.ink,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 4,
  },
  helperNote: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 14,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 20,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressLabel: {
    width: 75,
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: adminColors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: adminColors.brand,
    borderRadius: 5,
  },
  progressValue: {
    width: 20,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  recentCustomerCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  customerCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  badgeRecorded: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeRecordedText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  badgeIncomplete: {
    backgroundColor: adminColors.danger.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeIncompleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  customerCardSubtext: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 6,
    lineHeight: 17,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 8,
    textAlign: 'center',
  },
  directoryCountText: {
    fontSize: 12.5,
    color: adminColors.muted,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 2,
  },
  customerCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
  },
  customerCardIncomplete: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  customerCardMetaLine1: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 6,
  },
  customerCardMetaLine2: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 3,
  },
  segmentedTabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  tabPill: {
    backgroundColor: adminColors.card,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tabPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  tabPillTextActive: {
    color: adminColors.onBrand,
  },
  detailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  detailLabel: {
    fontSize: 13,
    color: adminColors.muted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: adminColors.ink,
    fontWeight: '700',
  },
  maskedWarehouseNote: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 10,
    lineHeight: 16,
  },
  orderPreviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
  },
  orderCardId: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  badgeWarningSoft: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeWarningSoftText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  orderCardLine1: {
    fontSize: 11.5,
    color: adminColors.ink,
    marginTop: 6,
  },
  orderCardLine2: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 3,
  },
  summaryBox: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 12,
  },
  summaryBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  summaryBoxLabel: {
    fontSize: 13,
    color: adminColors.ink,
    fontWeight: '500',
  },
  summaryBoxValue: {
    fontSize: 13,
    color: adminColors.ink,
    fontWeight: '800',
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 16,
    marginBottom: 8,
  },
  formFieldGroup: {
    marginBottom: 10,
  },
  formLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  formLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  formInputBox: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 11,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  formInputBoxLocked: {
    backgroundColor: adminColors.canvas,
    borderColor: adminColors.border,
  },
  formInputText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  formInputTextLocked: {
    color: adminColors.muted,
    fontWeight: '500',
  },
  formHelperNote: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
  },
  formInputBoxEditable: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  formDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    paddingHorizontal: 14,
  },
  formDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  addCustomerBottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  addCustomerSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomerSaveText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  addCustomerCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomerCancelText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },

  // Modal styles (theme tokens, zero raw rgba/hex)
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    width: '92%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  modalTitle: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 10,
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13.5,
    color: adminColors.ink,
    marginBottom: 6,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalResetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalResetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  modalApplyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
  },
  modalApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});

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

  // Inputs & Pest Management Module State (Image 1/2: home, Image 3: catalog, Images 1-3: add_input, Image 5: input_detail, Image 1: pest_library, Images 2-5: add_pest, Image 1: pest_incidents, Image 2-4: incident_detail)
  const [inputsPestScreen, setInputsPestScreen] = useState<
    'home' | 'catalog' | 'add_input' | 'input_detail' | 'pest_library' | 'add_pest' | 'pest_incidents' | 'incident_detail' | null
  >(null);
  const [selectedCatalogInput, setSelectedCatalogInput] = useState<CatalogInputItem | undefined>(undefined);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | undefined>(undefined);

  // Customers Management Module State (M1-S07 to M1-S11)
  const [customerScreen, setCustomerScreen] = useState<
    'management' | 'directory' | 'customer_detail' | 'add_customer' | 'gst_business' | 'gst_business_detail' | null
  >(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [selectedGstBusiness, setSelectedGstBusiness] = useState<GstBusinessItem | null>(null);

  // Community & Knowledge Management Module State
  const [communitySubScreen, setCommunitySubScreen] = useState<
    'home' | 'create_content' | 'create_group' | 'create_community' | 'add_video' | 'community_details' | 'all_communities' | 'all_groups' | 'article_details' | 'content_item_detail' | 'content_pending_review' | 'qa_chat' | 'knowledge_library' | null
  >(null);
  const [createContentInitialType, setCreateContentInitialType] = useState<ContentTypeOption>('Article');
  const [createContentInitialData, setCreateContentInitialData] = useState<CreateContentInitialData | undefined>(undefined);
  const [groupNavOrigin, setGroupNavOrigin] = useState<'home' | 'all_groups'>('home');
  const [communityNavOrigin, setCommunityNavOrigin] = useState<'home' | 'all_communities'>('home');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('comm-1');
  const [articleNavOrigin, setArticleNavOrigin] = useState<'home' | 'content_item_detail' | 'content_pending_review'>('content_item_detail');

  const resumedMulchingData: CreateContentInitialData = {
    contentType: 'Article',
    title: 'Mulching for water retention',
    shortDescription: 'A demonstration of organic practices.',
    farmingCategory: 'Crop Management',
    selectedCrops: ['Tomato', 'Cabbage'],
    selectedFarmingType: 'Organic',
    suitableConditions: 'Sub-tropical and temperate highland zones',
    instructions: 'Apply 2-3 inch mulch layer around the root zone, keeping 2 inches away from the plant stem.',
    precautions: 'Do not enter an unverified dose, water or nutrient amount.',
    referenceSources: 'https://video.example.org/organic',
    visibility: 'Everyone',
    announcementTitle: 'Mulching for water retention',
    shortSummary: 'A demonstration of organic practices.',
    fullDescription: 'Comprehensive guidance on mulch application across highland soils.',
    announcementCategory: 'General Announcement',
    audience: 'All',
  };

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
  const [showAllActions, setShowAllActions] = useState(true);

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
  const [auditReturnTab, setAuditReturnTab] = useState<'Home' | 'More' | 'WorkQueue'>('Home');
  const [profileReturnTab, setProfileReturnTab] = useState<'Home' | 'More' | 'Settings'>('Home');
  const [notificationsReturnTab, setNotificationsReturnTab] = useState<'Home' | 'More'>('Home');
  const [selectedAdminFarmer, setSelectedAdminFarmer] = useState<FarmerListItem | null>(null);
  const [selectedAdminApplication, setSelectedAdminApplication] = useState<ApplicationListItem | null>(null);
  const [farmersMainTab, setFarmersMainTab] = useState<'farmers' | 'applications'>('farmers');
  const [farmerSubScreen, setFarmerSubScreen] = useState<'detail' | 'map' | 'scorecard' | null>(null);
  const [salesSubScreen, setSalesSubScreen] = useState<
    'overview' | 'online' | 'market' | 'horeca' | 'b2b' | 'fulfillment' | 'invoice' | 'returns'
  >('overview');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<OnlineOrderItem | null>(null);
  const [selectedSalesB2B, setSelectedSalesB2B] = useState<B2BAccount | null>(null);
  const [financeSubScreen, setFinanceSubScreen] = useState<
    | 'accountsFinance'
    | 'purchaseSales'
    | 'duesPayouts'
    | 'salesIncome'
    | 'expenses'
    | 'invoicesGst'
    | 'reviewReturns'
    | 'transactionHistory'
    | 'customerWallet'
    | 'reportExport'
    | null
  >(null);
  const [farmersReturnTab, setFarmersReturnTab] = useState<'Home' | 'More' | 'WorkQueue' | 'Operations' | 'Inventory'>('Home');
  const [reportsSubScreen, setReportsSubScreen] = useState<
    'analytics' | 'pl' | 'farmerPerformance' | 'warehouseOps' | 'builder' | 'alerts' | 'announcements' | 'allRecent' | null
  >(null);
  const [operationsSubScreen, setOperationsSubScreen] = useState<'stockLedger' | 'stockVerification' | 'transfers' | 'addWarehouse' | null>(null);
  const [operationsReturnTab, setOperationsReturnTab] = useState<'Home' | 'Inventory' | 'Operations' | null>(null);
  const [workforceReturnTab, setWorkforceReturnTab] = useState<'Home' | 'Workforce' | 'More' | null>(null);
  const [financeReturnTab, setFinanceReturnTab] = useState<'Home' | 'Finance' | null>(null);
  const [inputsPestReturnTab, setInputsPestReturnTab] = useState<'Home' | 'More' | null>(null);

  const handleOperationsBack = () => {
    setOperationsSubScreen(null);
    if (operationsReturnTab) {
      setActiveTab(operationsReturnTab);
      setOperationsReturnTab(null);
    }
  };

  const handleFinanceBack = () => {
    setFinanceSubScreen(null);
    if (financeReturnTab) {
      setActiveTab(financeReturnTab);
      setFinanceReturnTab(null);
    }
  };

  // Workforce & Staff State (Screenshots M14-S01, M14-S02, M14-S04, M14-S02b)
  const [workforceActive, setWorkforceActive] = useState(false);
  const [workforceSubScreen, setWorkforceSubScreen] = useState<
    'dashboard' | 'management' | 'create' | 'attendance' | 'details'
  >('dashboard');
  const [workforceSearch, setWorkforceSearch] = useState('');
  const [showWorkforceFilterModal, setShowWorkforceFilterModal] = useState(false);
  const [workforceFilterRole, setWorkforceFilterRole] = useState<'All' | 'Warehouse staff' | 'Drivers' | 'Admin'>('All');
  const [workforceFilterStatus, setWorkforceFilterStatus] = useState<'All' | 'Active' | 'Pending activation'>('All');
  const [workforceFilterAttendance, setWorkforceFilterAttendance] = useState<'All' | 'Present' | 'Absent'>('All');
  const [openDropdownField, setOpenDropdownField] = useState<string | null>(null);

  const [selectedStaffDetails, setSelectedStaffDetails] = useState<WorkforceStaffItem | null>(null);
  const [workforceStaffList, setWorkforceStaffList] = useState<WorkforceStaffItem[]>([
    {
      id: 'STF-0004',
      employeeId: 'STF-0004',
      name: 'Mahesh T',
      avatarInitials: 'MT',
      type: 'Staff',
      role: 'Loading & sorting',
      assignedRole: 'Warehouse staff',
      warehouse: 'Main Warehouse, Ooty',
      mobile: '+91 98451 00231',
      maskedMobile: 'Mobile ••••• •0231',
      email: 'mahesh.t@tohfa.com',
      joiningDate: '1 Mar 2026',
      workSection: 'Loading & Sorting',
      status: 'Active',
      todayAttendance: 'Present',
      attendanceNote: 'Check-in / check-out: not tracked',
      createdText: '1 Mar 2026 by System',
      dateOfBirth: '15 Jun 1990',
      gender: 'Male',
      maritalStatus: 'Not provided',
      alternateMobile: 'Not provided',
      currentAddress: 'Kotagiri Road, Ooty, Tamil Nadu',
      idType: 'Aadhaar',
      idNumber: 'XXXX XXXX 4190',
      verificationStatus: 'Verified',
      verifiedByDate: 'Demo TOHFA Admin · 5 Mar 2026',
      employmentType: 'Full-time',
      department: 'Warehouse Operations',
      designation: 'Loading Staff',
      reportingManager: 'Demo Sub Warehouse Admin',
      applicationRole: 'Warehouse Staff (no login)',
      accountStatusText: 'No application access',
      permissionsSummary: 'From RBAC: none (no login)',
      lastLogin: 'Not applicable',
      warehouseCode: 'Main Warehouse, Ooty (WH-MAIN)',
      warehouseLocation: 'Ooty',
      emergencyContactName: 'Lakshmi (spouse)',
      emergencyContactPhone: '••••• •1190',
      documents: [
        { name: 'Aadhaar Card', filename: 'aadhaar_scan.pdf · Uploaded 1 Mar 2026', status: 'Verified' },
        { name: 'Address Proof', filename: 'Illegible scan (demo reason) · Re-upload required', status: 'Rejected' },
        { name: 'Employment Agreement', filename: '', status: 'Not uploaded' },
      ],
      auditHistory: [
        { date: '1 Mar 2026, 09:00', actor: 'Demo Sub Warehouse Admin', action: 'Staff record created' },
        { date: '2 Mar 2026, 10:30', actor: 'Demo TOHFA Admin', action: 'ID proof verified' },
        { date: '10 Oct 2026, 11:00', actor: 'Demo Sub Warehouse Admin', action: 'Address proof rejected: illegible scan (demo)' },
      ],
    },
    {
      id: 'EMP-0007',
      employeeId: 'EMP-0007',
      name: 'Ravi Kumar',
      avatarInitials: 'RK',
      type: 'Staff',
      role: 'Warehouse Staff',
      assignedRole: 'Warehouse Staff',
      warehouse: 'Main Warehouse, Ooty',
      mobile: '+91 98451 00231',
      maskedMobile: '••••• •0231',
      email: 'r.kumar••@example.com',
      joiningDate: '1 Mar 2026',
      workSection: 'Loading & Sorting',
      status: 'Active',
      todayAttendance: 'Present',
      attendanceNote: 'Check-in / check-out: not tracked',
      createdText: '1 Mar 2026 by Demo Sub Warehouse Admin',
      dateOfBirth: '12 Apr 1992',
      gender: 'Male',
      maritalStatus: 'Not provided',
      alternateMobile: 'Not provided',
      currentAddress: 'Coonoor Road, Ooty, Tamil Nadu',
      idType: 'Aadhaar',
      idNumber: 'XXXX XXXX 8842',
      verificationStatus: 'Verified',
      verifiedByDate: 'Demo TOHFA Admin · 2 Mar 2026',
      employmentType: 'Full-time',
      department: 'Warehouse Operations',
      designation: 'Loading & Sorting Staff',
      reportingManager: 'Demo Sub Warehouse Admin',
      applicationRole: 'Warehouse Staff (no login)',
      accountStatusText: 'No application access',
      permissionsSummary: 'From RBAC: none (no login)',
      lastLogin: 'Not applicable',
      warehouseCode: 'Main Warehouse, Ooty (WH-MAIN)',
      warehouseLocation: 'Ooty',
      emergencyContactName: 'Lakshmi (spouse)',
      emergencyContactPhone: '••••• •1190',
      documents: [
        {
          name: 'Aadhaar Card',
          filename: 'aadhaar_scan.pdf · Uploaded 1 Mar 2026',
          status: 'Verified',
        },
        {
          name: 'Address Proof',
          filename: 'Illegible scan (demo reason) · Re-upload required',
          status: 'Rejected',
          statusNote: 'Illegible scan (demo reason) · Re-upload required',
        },
        {
          name: 'Employment Agreement',
          filename: '',
          status: 'Not uploaded',
        },
      ],
      auditHistory: [
        {
          date: '1 Mar 2026, 09:00',
          actor: 'Demo Sub Warehouse Admin',
          action: 'Staff record created',
        },
        {
          date: '2 Mar 2026, 10:30',
          actor: 'Demo TOHFA Admin',
          action: 'ID proof verified',
        },
        {
          date: '10 Oct 2026, 11:00',
          actor: 'Demo Sub Warehouse Admin',
          action: 'Address proof rejected: illegible scan (demo)',
        },
      ],
    },
    {
      id: 'ADM-0009',
      employeeId: 'ADM-0009',
      name: 'Priya Nair',
      avatarInitials: 'PN',
      type: 'Admin',
      role: 'Sub Warehouse Admin',
      assignedRole: 'Sub Warehouse Admin',
      warehouse: 'Coonoor',
      mobile: '+91 97890 00149',
      maskedMobile: 'Mobile ••••• •0149',
      email: 'priya.nair@tohfa.com',
      joiningDate: '12 Oct 2026',
      workSection: 'Sub Warehouse Admin',
      status: 'Pending activation',
      todayAttendance: 'Present',
      attendanceNote: 'Activation flow proposed, not yet confirmed',
      createdText: 'Created 12 Oct 2026 by TOHFA Admin',
      activationNote: 'Activation flow proposed, not yet confirmed',
      dateOfBirth: '20 Aug 1995',
      gender: 'Female',
      maritalStatus: 'Not provided',
      alternateMobile: 'Not provided',
      currentAddress: 'Upper Coonoor, Tamil Nadu',
      idType: 'PAN',
      idNumber: 'XXXXX 9012 B',
      verificationStatus: 'Pending',
      verifiedByDate: 'Pending verification',
      employmentType: 'Full-time',
      department: 'Warehouse Administration',
      designation: 'Sub Warehouse Admin',
      reportingManager: 'TOHFA Central Admin',
      applicationRole: 'Sub Warehouse Admin',
      accountStatusText: 'Pending Activation',
      permissionsSummary: 'From RBAC: sub_warehouse_manage',
      lastLogin: 'Never',
      warehouseCode: 'Coonoor Warehouse (WH-CNR)',
      warehouseLocation: 'Coonoor',
      emergencyContactName: 'Ramesh Nair (father)',
      emergencyContactPhone: '••••• •7890',
      documents: [
        { name: 'PAN Card', filename: 'pan_card.pdf · Uploaded 12 Oct 2026', status: 'Verified' },
      ],
      auditHistory: [
        { date: '12 Oct 2026, 11:30', actor: 'TOHFA Admin', action: 'Staff record created' },
      ],
    },
    {
      id: 'STF-0005',
      employeeId: 'STF-0005',
      name: 'Karthi S',
      avatarInitials: 'KS',
      type: 'Staff',
      role: 'Loadman',
      assignedRole: 'TOHFA Admin',
      warehouse: 'Ooty',
      mobile: '+91 91000 00001',
      maskedMobile: 'Mobile ****** ·0001',
      email: 'demo.super.admin@example.com',
      joiningDate: 'Not tracked',
      workSection: 'Loading & Sorting',
      status: 'Active',
      todayAttendance: 'Absent',
      attendanceNote: 'Corrected from Present by Demo TOHFA Admin - Reason: Marked in error',
      createdText: '28 Mar 2026 by System',
      historyText: '28 Mar 2026, 09:00 · System\nAccount created: Super Admin',
      hasErrorCorrection: true,
      dateOfBirth: '05 Jan 1988',
      gender: 'Male',
      maritalStatus: 'Not provided',
      alternateMobile: 'Not provided',
      currentAddress: 'Ooty Bazaar, Tamil Nadu',
      idType: 'Aadhaar',
      idNumber: 'XXXX XXXX 1102',
      verificationStatus: 'Verified',
      verifiedByDate: 'Demo TOHFA Admin · 29 Mar 2026',
      employmentType: 'Contract',
      department: 'Warehouse Operations',
      designation: 'Loading & Sorting',
      reportingManager: 'Demo Sub Warehouse Admin',
      applicationRole: 'Warehouse Staff (no login)',
      accountStatusText: 'No application access',
      permissionsSummary: 'From RBAC: none (no login)',
      lastLogin: 'Not applicable',
      warehouseCode: 'Main Warehouse, Ooty (WH-MAIN)',
      warehouseLocation: 'Ooty',
      emergencyContactName: 'Lakshmi (spouse)',
      emergencyContactPhone: '••••• •1190',
      documents: [
        { name: 'Aadhaar Card', filename: 'aadhaar_scan.pdf · Uploaded 1 Mar 2026', status: 'Verified' },
        { name: 'Address Proof', filename: 'Illegible scan (demo reason) · Re-upload required', status: 'Rejected' },
        { name: 'Employment Agreement', filename: '', status: 'Not uploaded' },
      ],
      auditHistory: [
        { date: '1 Mar 2026, 09:00', actor: 'Demo Sub Warehouse Admin', action: 'Staff record created' },
        { date: '2 Mar 2026, 10:30', actor: 'Demo TOHFA Admin', action: 'ID proof verified' },
        { date: '10 Oct 2026, 11:00', actor: 'Demo Sub Warehouse Admin', action: 'Address proof rejected: illegible scan (demo)' },
      ],
    },
  ]);
  const [selectedStaffProfileModal, setSelectedStaffProfileModal] = useState<WorkforceStaffItem | null>(null);
  const [profileNewStatus, setProfileNewStatus] = useState<string>('');
  const [showStatusPicker, setShowStatusPicker] = useState<boolean>(false);

  // Create Staff Form State (M14-S02a · Create staff account)
  // Section 1: Personal Details
  const [createStaffPhoto, setCreateStaffPhoto] = useState<string | null>(null);
  const [createStaffFirstName, setCreateStaffFirstName] = useState('');
  const [createStaffMiddleName, setCreateStaffMiddleName] = useState('');
  const [createStaffLastName, setCreateStaffLastName] = useState('');
  const [createStaffDob, setCreateStaffDob] = useState('');
  const [createStaffGender, setCreateStaffGender] = useState('Select');
  const [createStaffMarital, setCreateStaffMarital] = useState('Select');
  const [createStaffGuardian, setCreateStaffGuardian] = useState('');
  const [createStaffNationality, setCreateStaffNationality] = useState('Indian');
  const [createStaffLanguage, setCreateStaffLanguage] = useState('Select');
  const [createStaffBloodGroup, setCreateStaffBloodGroup] = useState('Select');

  // Section 2: Contact Details
  const [createStaffMobile, setCreateStaffMobile] = useState('');
  const [createStaffAltMobile, setCreateStaffAltMobile] = useState('');
  const [createStaffEmail, setCreateStaffEmail] = useState('');
  const [createStaffAddress, setCreateStaffAddress] = useState('');
  const [createStaffState, setCreateStaffState] = useState('');
  const [createStaffDistrict, setCreateStaffDistrict] = useState('');
  const [createStaffCity, setCreateStaffCity] = useState('');
  const [createStaffPin, setCreateStaffPin] = useState('');
  const [isSamePermanentAddress, setIsSamePermanentAddress] = useState(true);

  // Section 3: ID Proof & Verification
  const [createStaffIdType, setCreateStaffIdType] = useState('Select...');
  const [createStaffIdNumber, setCreateStaffIdNumber] = useState('');
  const [createStaffIdName, setCreateStaffIdName] = useState('');

  // Section 4: Bank Account Details
  const [createStaffAccountHolder, setCreateStaffAccountHolder] = useState('');
  const [createStaffBankName, setCreateStaffBankName] = useState('');
  const [createStaffAccountNumber, setCreateStaffAccountNumber] = useState('');
  const [createStaffConfirmAccount, setCreateStaffConfirmAccount] = useState('');
  const [createStaffIfsc, setCreateStaffIfsc] = useState('');
  const [createStaffBranch, setCreateStaffBranch] = useState('');
  const [createStaffAccountType, setCreateStaffAccountType] = useState('Select...');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [createStaffBankProof, setCreateStaffBankProof] = useState<string | null>(null);

  // Section 5: Employment Details (Screenshots 5 & M14-S02a continuation)
  const [createStaffId, setCreateStaffId] = useState('');
  const [createStaffRole, _setCreateStaffRole] = useState('Warehouse Staff');
  const [createStaffEmploymentType, setCreateStaffEmploymentType] = useState('Select...');
  const [createStaffDepartment, setCreateStaffDepartment] = useState('Select...');
  const [createStaffDesignation, setCreateStaffDesignation] = useState('Select...');
  const [createStaffEmploymentStatus, setCreateStaffEmploymentStatus] = useState('Select...');
  const [createStaffSalaryDetails, setCreateStaffSalaryDetails] = useState('');
  const [createStaffWorkLocation, setCreateStaffWorkLocation] = useState('Select...');
  const [createStaffWarehouse, _setCreateStaffWarehouse] = useState('Main Warehouse, Ooty (WH-MAIN)');
  const [createStaffWorkSection, _setCreateStaffWorkSection] = useState('Loading & Sorting');
  const [createStaffManager, _setCreateStaffManager] = useState('Demo Sub Warehouse Admin');
  const [createStaffJoiningDate, _setCreateStaffJoiningDate] = useState('Today');

  // Section 6: Role & Access Management (Screenshots M14-S02a)
  const [createStaffAccountAccess, setCreateStaffAccountAccess] = useState<'login' | 'no_login'>('login');
  const [createStaffApplicationRole, setCreateStaffApplicationRole] = useState('Select...');

  // Section 8: Emergency Contact (Screenshots M14-S02a)
  const [createStaffEmergencyName, setCreateStaffEmergencyName] = useState('');
  const [createStaffEmergencyRel, setCreateStaffEmergencyRel] = useState('Select...');
  const [createStaffEmergencyPhone, setCreateStaffEmergencyPhone] = useState('');
  const [createStaffEmergencyAltPhone, setCreateStaffEmergencyAltPhone] = useState('');
  const [createStaffEmergencyAddress, setCreateStaffEmergencyAddress] = useState('');

  // Section 9: Document Uploads (Screenshots M14-S02a)
  const [createStaffDocAddressProof, setCreateStaffDocAddressProof] = useState<string | null>(null);
  const [createStaffDocAppointmentLetter, setCreateStaffDocAppointmentLetter] = useState<string | null>(null);
  const [createStaffDocAgreement, setCreateStaffDocAgreement] = useState<string | null>(null);
  const [createStaffDocEducation, setCreateStaffDocEducation] = useState<string | null>(null);
  const [createStaffDocExperience, setCreateStaffDocExperience] = useState<string | null>(null);
  const [createStaffDocOther, setCreateStaffDocOther] = useState<string | null>(null);

  // Form Picker Modal State
  const [activeFormPicker, setActiveFormPicker] = useState<{
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
  } | null>(null);

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

  const can = React.useMemo(() => makeCan(user?.permissions), [user?.permissions]);

  const handleExportFinanceReport = () => {
    if (can('report.export.file') || can('finance.pnl.view') || !user) {
      Alert.alert(
        'Export Report',
        'Accounts & Finance summary report exported successfully in PDF and Excel formats.'
      );
    } else {
      Alert.alert(
        'Access Restricted',
        'Your role lacks permission to export finance reports (report.export.file).'
      );
    }
  };

  const handleGoToItem = (itemKey: string) => {
    switch (itemKey) {
      case 'purchase_sales':
        if (can('sales.channel.manage') || can('order.list.view') || can('sales.order.create') || !user) {
          setFinanceSubScreen('purchaseSales');
        } else {
          Alert.alert(
            'Access Restricted',
            'Your role lacks permission to access Purchase & Sales (sales.channel.manage).'
          );
        }
        break;
      case 'dues_payouts':
        if (can('payout.dues.view') || can('payout.farmer.initiate') || can('payout.farmer.approve') || !user) {
          setFinanceSubScreen('duesPayouts');
        } else {
          Alert.alert(
            'Access Restricted',
            'Your role lacks permission for Dues & Payouts (payout.dues.view).'
          );
        }
        break;
      case 'sales_income':
        if (can('finance.sales_income.view') || !user) {
          setFinanceSubScreen('salesIncome');
        } else {
          Alert.alert(
            'Access Restricted',
            'Your role lacks permission for Sales Income (finance.sales_income.view).'
          );
        }
        break;
      case 'expenses':
        if (can('finance.expense.log') || !user) {
          setFinanceSubScreen('expenses');
        } else {
          Alert.alert(
            'Access Restricted',
            'Your role lacks permission to log or view expenses (finance.expense.log).'
          );
        }
        break;
      case 'customer_wallet':
        if (can('customer.wallet.view') || can('wallet.cash_topup.process') || can('wallet.manual_credit_debit') || !user) {
          setFinanceSubScreen('customerWallet');
        } else {
          Alert.alert(
            'Access Restricted',
            'Your role lacks permission for Customer Wallet operations (customer.wallet.view).'
          );
        }
        break;
      case 'create_view_invoice':
        if (
          can('invoice.generate') ||
          can('invoice.gst.generate') ||
          can('invoice.view_own') ||
          can('sales.sale.create') ||
          can('sales.channel.manage') ||
          can('finance.dashboard.view') ||
          !user
        ) {
          setFinanceSubScreen('invoicesGst');
        } else {
          Alert.alert(
            'Access Restricted',
            'Your role lacks permission for Invoicing (invoice.generate).'
          );
        }
        break;
      case 'review_returns':
        if (
          can('rma.request.process') ||
          can('rma.refund.approve') ||
          can('rma.refund.wallet_process') ||
          can('sales.sale.cancel') ||
          can('sales.channel.manage') ||
          can('finance.dashboard.view') ||
          !user
        ) {
          setFinanceSubScreen('reviewReturns');
        } else {
          Alert.alert(
            'Access Restricted',
            'Your role lacks permission for Returns & RMA (rma.request.process).'
          );
        }
        break;
      case 'transaction_history':
        if (can('finance.cash_close.manage') || can('auditlog.view') || !user) {
          setFinanceSubScreen('transactionHistory');
        } else {
          Alert.alert(
            'Access Restricted',
            'Your role lacks permission for Transaction History (finance.cash_close.manage).'
          );
        }
        break;
      case 'report_export':
        if (can('report.export.file') || can('finance.pnl.view') || !user) {
          setFinanceSubScreen('reportExport');
        } else {
          Alert.alert(
            'Access Restricted',
            'Your role lacks permission to export finance reports (report.export.file).'
          );
        }
        break;
      default:
        break;
    }
  };

  const handleRefresh = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setLastUpdated(`${hours}:${mins} - All Warehouses`);
  };

  const handleOpenPendingApplications = () => {
    setFarmersReturnTab(
      activeTab === 'More'
        ? 'More'
        : activeTab === 'WorkQueue'
        ? 'WorkQueue'
        : activeTab === 'Inventory'
        ? 'Inventory'
        : activeTab === 'Operations'
        ? 'Operations'
        : 'Home'
    );
    setFarmersMainTab('applications');
    setActiveTab('Farmers');
    setSelectedAdminFarmer(null);
    setSelectedAdminApplication(null);
  };

  const _handleOpenListingApproval = () => {
    setDashboardSubScreen('listingApproval');
  };

  const handleOpenScheduleAudit = (fromTab?: unknown) => {
    const validReturnTab: 'Home' | 'More' | 'WorkQueue' =
      fromTab === 'More' || fromTab === 'WorkQueue' || fromTab === 'Home'
        ? fromTab
        : activeTab === 'More'
        ? 'More'
        : activeTab === 'WorkQueue'
        ? 'WorkQueue'
        : 'Home';
    setAuditReturnTab(validReturnTab);
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
        setFinanceSubScreen('purchaseSales');
        setActiveTab('Finance');
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
        const app = DEMO_APPLICATIONS.find(a => a.id === 'app-2026-0101') || DEMO_APPLICATIONS[0];
        setFarmersReturnTab('WorkQueue');
        setSelectedAdminApplication(app ?? null);
        setFarmersMainTab('applications');
        setActiveTab('Farmers');
      },
    },
    {
      id: 'tsk_3',
      title: 'Audit follow-up',
      badge: 'Overdue',
      badgeTone: 'danger' as const,
      name: 'Vijay',
      code: 'TSK-AUD-2026-0052 · AUD-2026-0052',
      detail: '',
      created: 'Created 08 Oct 2026 · Due 08 Oct 2026',
      actionLabel: 'View Audit',
      onAction: () => {
        handleOpenScheduleAudit('WorkQueue');
      },
    },
  ];

  interface MetricCardData {
    id: string;
    title: string;
    value: string;
    subtitle: string;
    icon?: 'orders' | 'pickup' | 'receiving' | 'inventory' | 'sales' | 'cash' | 'wallet' | 'truck' | 'box' | 'alert' | 'users' | 'clipboard';
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
      icon: 'orders',
      onPress: handleOpenPendingApplications,
    },
    {
      id: 'active_farmers',
      title: 'Active farmers',
      value: '20',
      subtitle: 'of 24 registered',
      icon: 'pickup',
      onPress: () => {
        setFarmersReturnTab('Home');
        setFarmersMainTab('farmers');
        setSelectedAdminFarmer(null);
        setSelectedAdminApplication(null);
        if (onNavigate) onNavigate('AdminAllFarmers');
        else setActiveTab('Farmers');
      },
    },
    {
      id: 'audits',
      title: 'Upcoming / overdue audits',
      value: '2/1',
      subtitle: 'upcoming · overdue',
      icon: 'clipboard',
      onPress: handleOpenScheduleAudit,
    },
    {
      id: 'open_exceptions',
      title: 'Open exceptions',
      value: '3',
      subtitle: 'queue items blocked',
      icon: 'box',
      tone: 'danger',
      onPress: () => setActiveTab('WorkQueue'),
    },
    {
      id: 'produce_activity',
      title: 'Produce activity',
      value: '4',
      subtitle: '5 pending review',
      icon: 'truck',
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
      icon: 'box',
      onPress: () => {
        if (onNavigate) onNavigate('PurchaseOrders');
      },
    },
    {
      id: 'sales_and_orders',
      title: 'Sales and orders',
      value: '₹3,33,660',
      subtitle: '▼ 27% vs previous 30 days',
      icon: 'sales',
      onPress: () => setActiveTab('Finance'),
    },
    {
      id: 'warehouse_exceptions',
      title: 'Warehouse exceptions',
      value: '3',
      subtitle: '1 low stock · 2 discrepancies',
      icon: 'alert',
      tone: 'danger',
      onPress: () => {
        setOperationsSubScreen(null);
        setActiveTab('Inventory');
      },
    },
    {
      id: 'finance_attention',
      title: 'Finance attention',
      value: '3',
      subtitle: '1 awaiting approval · 2 on hold',
      icon: 'cash',
      tone: 'danger',
      onPress: () => setActiveTab('Finance'),
    },
    {
      id: 'customer_support',
      title: 'Customer support',
      value: '3',
      subtitle: '3 open tickets',
      icon: 'pickup',
      onPress: handleOpenSupport,
    },
    {
      id: 'staff_operations',
      title: 'Staff operations',
      value: '2',
      subtitle: '3 salary payments pending',
      icon: 'users',
      onPress: () => {
        if (onNavigate) onNavigate('Staff');
      },
    },
  ];

  // If collapsed, hide extra cards and show only the first 6 cards matching mockup; if expanded show all 11
  const displayedMetrics = showAllMetrics ? allMetricCards : allMetricCards.slice(0, 6);

  // Quick action items matching user mockup (16 actions, 3 columns)
  const allQuickActions = [
    {
      id: 'qa_farmers',
      label: 'Review farmer applications',
      icon: <QuickUserSearchIcon size={26} />,
      action: () => {
        setFarmersReturnTab('Home');
        handleOpenPendingApplications();
      },
    },
    {
      id: 'qa_add_warehouse',
      label: 'Add Warehouse',
      icon: <QuickWarehouseActionIcon size={26} />,
      action: () => {
        setOperationsReturnTab('Home');
        setOperationsSubScreen('addWarehouse');
        setActiveTab('Inventory');
      },
    },
    {
      id: 'qa_audit',
      label: 'Open audit calendar',
      icon: <QuickCalendarActionIcon size={26} />,
      action: () => handleOpenScheduleAudit('Home'),
    },
    {
      id: 'qa_create_staff',
      label: 'Create Staff',
      icon: <QuickGroupUsersIcon size={26} />,
      action: () => {
        setWorkforceReturnTab('Home');
        setWorkforceSubScreen('create');
        setActiveTab('Workforce');
      },
    },
    {
      id: 'qa_receive_goods',
      label: 'Receive Goods',
      icon: <QuickReceiveGoodsIcon size={26} />,
      action: () => {
        setOperationsReturnTab('Home');
        setOperationsSubScreen('stockVerification');
        setActiveTab('Inventory');
      },
    },
    {
      id: 'qa_produce_list',
      label: 'Produce list',
      icon: <QuickProduceListIcon size={26} />,
      action: () => {
        setActiveTab('Home');
        setDashboardSubScreen('listingApproval');
      },
    },
    {
      id: 'qa_transfer_stock',
      label: 'Transfer Stock',
      icon: <QuickTransferStockIcon size={26} />,
      action: () => {
        setOperationsReturnTab('Home');
        setOperationsSubScreen('transfers');
        setActiveTab('Inventory');
      },
    },
    {
      id: 'qa_prices',
      label: 'Manage retail prices',
      icon: <QuickTagIcon size={26} />,
      action: () => {
        setPricingReturnTab('Home');
        setDashboardSubScreen('marketPricingHome');
      },
    },
    {
      id: 'qa_cash_topup',
      label: 'Cash Top-Up',
      icon: <QuickCashTopUpIcon size={26} />,
      action: () => {
        setFinanceReturnTab('Home');
        setFinanceSubScreen('customerWallet');
        setActiveTab('Finance');
      },
    },
    {
      id: 'qa_purchases',
      label: 'Purchases and payouts',
      icon: <QuickReceiptIcon size={26} />,
      action: () => {
        setFinanceReturnTab('Home');
        setFinanceSubScreen('duesPayouts');
        setActiveTab('Finance');
      },
    },
    {
      id: 'qa_sales',
      label: 'Sales and invoices',
      icon: <QuickBagIcon size={26} />,
      action: () => {
        setFinanceReturnTab('Home');
        setFinanceSubScreen('invoicesGst');
        setActiveTab('Finance');
      },
    },
    {
      id: 'qa_support',
      label: 'Customer support and refunds',
      icon: <QuickSupportIcon size={26} />,
      action: () => {
        setActiveTab('Home');
        setDashboardSubScreen('support');
      },
    },
    {
      id: 'qa_finance',
      label: 'Review finance and payouts',
      icon: <QuickWalletIcon size={26} />,
      action: () => {
        setFinanceReturnTab('Home');
        setFinanceSubScreen(null);
        setActiveTab('Finance');
      },
    },
    {
      id: 'qa_inputs',
      label: 'Manage inputs and pest',
      icon: <QuickLeafIcon size={26} />,
      action: () => {
        setInputsPestReturnTab('Home');
        setInputsPestScreen('home');
        setActiveTab('More');
      },
    },
    {
      id: 'qa_reports',
      label: 'Open operational reports',
      icon: <QuickDocIcon size={26} />,
      action: () => {
        setReportsSubScreen(null);
        setActiveTab('Reports');
      },
    },
    {
      id: 'qa_staff',
      label: 'Manage staff and salary',
      icon: <QuickBadgeStaffIcon size={26} />,
      action: () => {
        setWorkforceReturnTab('Home');
        setWorkforceSubScreen('dashboard');
        setActiveTab('Workforce');
      },
    },
  ];

  const displayedActions = showAllActions ? allQuickActions : allQuickActions.slice(0, 6);
  const isInputsScreen = activeTab === 'More' && inputsPestScreen !== null;
  const isProduceScreen = activeTab === 'More' && produceControlScreen !== null;
  const isCustomerScreenActive = activeTab === 'More' && customerScreen !== null;
  const isBrandHeaderActive = isProduceScreen || isInputsScreen || isCustomerScreenActive;

  // ─── Workforce & Staff Handlers & Renderers ─────────────────────────────────

  const handleCreateStaffAccount = () => {
    if (!createStaffFirstName.trim()) {
      Alert.alert('Required Field', 'Please enter the first name.');
      return;
    }
    if (!createStaffLastName.trim()) {
      Alert.alert('Required Field', 'Please enter the last name.');
      return;
    }
    if (!createStaffMobile.trim()) {
      Alert.alert('Required Field', 'Please enter a valid primary mobile number.');
      return;
    }
    if (!createStaffEmail.trim()) {
      Alert.alert('Required Field', 'Please enter an email address.');
      return;
    }

    const fullName = [createStaffFirstName.trim(), createStaffMiddleName.trim(), createStaffLastName.trim()]
      .filter(Boolean)
      .join(' ');
    const initials = `${createStaffFirstName.trim()[0] || ''}${createStaffLastName.trim()[0] || ''}`.toUpperCase();
    const newId = createStaffId.trim() || `EMP-000${workforceStaffList.length + 5}`;
    const finalDepartment = createStaffDepartment !== 'Select...' ? createStaffDepartment : 'Warehouse Operations';
    const finalDesignation = createStaffDesignation !== 'Select...' ? createStaffDesignation : 'Loading & Sorting Staff';
    const finalEmploymentType = createStaffEmploymentType !== 'Select...' ? createStaffEmploymentType : 'Full-time';
    const finalWarehouse = createStaffWorkLocation !== 'Select...' ? createStaffWorkLocation : createStaffWarehouse;
    const finalEmergencyName = createStaffEmergencyName.trim() || createStaffGuardian.trim() || 'Not provided';
    const finalEmergencyPhone = createStaffEmergencyPhone.trim() || createStaffAltMobile.trim() || 'Not provided';
    const finalApplicationRole =
      createStaffAccountAccess === 'login'
        ? createStaffApplicationRole !== 'Select...'
          ? createStaffApplicationRole
          : 'Warehouse Staff (Pending activation)'
        : 'Warehouse Staff (no login)';
    const finalAccountStatus = createStaffAccountAccess === 'login' ? 'Pending activation' : 'No application access';

    const docsList: Array<{
      name: string;
      filename: string;
      status: 'Verified' | 'Rejected' | 'Not uploaded';
      statusNote?: string;
    }> = [];
    if (createStaffBankProof) {
      docsList.push({ name: 'Bank Proof / Cheque', filename: createStaffBankProof, status: 'Verified' });
    }
    if (createStaffDocAddressProof) {
      docsList.push({ name: 'Address Proof', filename: createStaffDocAddressProof, status: 'Verified' });
    }
    if (createStaffDocAppointmentLetter) {
      docsList.push({ name: 'Appointment Letter', filename: createStaffDocAppointmentLetter, status: 'Verified' });
    }
    if (createStaffDocAgreement) {
      docsList.push({ name: 'Employment Agreement', filename: createStaffDocAgreement, status: 'Verified' });
    }
    if (createStaffDocEducation) {
      docsList.push({ name: 'Educational Certificates', filename: createStaffDocEducation, status: 'Verified' });
    }
    if (createStaffDocExperience) {
      docsList.push({ name: 'Experience Certificate', filename: createStaffDocExperience, status: 'Verified' });
    }
    if (createStaffDocOther) {
      docsList.push({ name: 'Other Supporting Documents', filename: createStaffDocOther, status: 'Verified' });
    }
    if (createStaffIdNumber) {
      docsList.push({
        name: `${createStaffIdType !== 'Select...' ? createStaffIdType : 'ID'} Proof`,
        filename: 'id_document_scan.pdf',
        status: 'Verified',
      });
    }

    const newStaffItem: WorkforceStaffItem = {
      id: newId,
      employeeId: newId,
      name: fullName,
      avatarInitials: initials || 'ST',
      type: createStaffRole.includes('Admin') || createStaffAccountAccess === 'login' ? 'Admin' : 'Staff',
      role: createStaffRole,
      assignedRole: createStaffRole,
      warehouse: finalWarehouse,
      mobile: createStaffMobile.trim().startsWith('+91') ? createStaffMobile.trim() : `+91 ${createStaffMobile.trim()}`,
      maskedMobile: `••••• •${createStaffMobile.trim().slice(-4) || '0000'}`,
      email: createStaffEmail.trim(),
      joiningDate: createStaffJoiningDate || 'Today',
      workSection: createStaffWorkSection,
      status: 'Active',
      todayAttendance: 'Present',
      attendanceNote: 'Check-in / check-out: not tracked',
      createdText: `Today by ${adminDisplayName}`,
      dateOfBirth: createStaffDob || 'Not provided',
      gender: createStaffGender !== 'Select' ? createStaffGender : 'Not provided',
      maritalStatus: createStaffMarital !== 'Select' ? createStaffMarital : 'Not provided',
      alternateMobile: createStaffAltMobile.trim() || 'Not provided',
      currentAddress:
        [createStaffAddress.trim(), createStaffCity.trim(), createStaffDistrict.trim(), createStaffState, createStaffPin.trim()]
          .filter(Boolean)
          .join(', ') || 'Not provided',
      idType: createStaffIdType !== 'Select...' ? createStaffIdType : 'Not provided',
      idNumber: createStaffIdNumber ? `XXXX XXXX ${createStaffIdNumber.slice(-4)}` : 'Not provided',
      verificationStatus: 'Pending',
      verifiedByDate: 'Pending verification',
      employmentType: finalEmploymentType,
      department: finalDepartment,
      designation: finalDesignation,
      reportingManager: createStaffManager,
      applicationRole: finalApplicationRole,
      accountStatusText: finalAccountStatus,
      permissionsSummary: createStaffAccountAccess === 'login' ? 'Standard RBAC login role' : 'None (no login)',
      lastLogin: 'Never',
      warehouseCode: finalWarehouse,
      warehouseLocation: createStaffCity || 'Ooty',
      emergencyContactName: finalEmergencyName,
      emergencyContactPhone: finalEmergencyPhone,
      documents: docsList,
      auditHistory: [{ date: 'Today, Just now', actor: adminDisplayName, action: 'Staff account created' }],
    };

    setWorkforceStaffList((prev) => [newStaffItem, ...prev]);
    Alert.alert('Account Created', `Staff account for ${fullName} (${newId}) has been created successfully.`);

    // Reset fields
    setCreateStaffPhoto(null);
    setCreateStaffFirstName('');
    setCreateStaffMiddleName('');
    setCreateStaffLastName('');
    setCreateStaffDob('');
    setCreateStaffGender('Select');
    setCreateStaffMarital('Select');
    setCreateStaffGuardian('');
    setCreateStaffNationality('Indian');
    setCreateStaffLanguage('Select');
    setCreateStaffBloodGroup('Select');
    setCreateStaffMobile('');
    setCreateStaffAltMobile('');
    setCreateStaffEmail('');
    setCreateStaffAddress('');
    setCreateStaffState('');
    setCreateStaffDistrict('');
    setCreateStaffCity('');
    setCreateStaffPin('');
    setIsSamePermanentAddress(true);
    setCreateStaffIdType('Select...');
    setCreateStaffIdNumber('');
    setCreateStaffIdName('');
    setCreateStaffAccountHolder('');
    setCreateStaffBankName('');
    setCreateStaffAccountNumber('');
    setCreateStaffConfirmAccount('');
    setCreateStaffIfsc('');
    setCreateStaffBranch('');
    setCreateStaffAccountType('Select...');
    setShowAccountNumber(false);
    setCreateStaffBankProof(null);
    setCreateStaffId('');
    setCreateStaffEmploymentType('Select...');
    setCreateStaffDepartment('Select...');
    setCreateStaffDesignation('Select...');
    setCreateStaffEmploymentStatus('Select...');
    setCreateStaffSalaryDetails('');
    setCreateStaffWorkLocation('Select...');
    setCreateStaffAccountAccess('login');
    setCreateStaffApplicationRole('Select...');
    setCreateStaffEmergencyName('');
    setCreateStaffEmergencyRel('Select...');
    setCreateStaffEmergencyPhone('');
    setCreateStaffEmergencyAltPhone('');
    setCreateStaffEmergencyAddress('');
    setCreateStaffDocAddressProof(null);
    setCreateStaffDocAppointmentLetter(null);
    setCreateStaffDocAgreement(null);
    setCreateStaffDocEducation(null);
    setCreateStaffDocExperience(null);
    setCreateStaffDocOther(null);
    setWorkforceSubScreen('management');
  };

  const handleSaveProfileCorrection = () => {
    if (!selectedStaffProfileModal) return;
    if (profileNewStatus) {
      setWorkforceStaffList((prev) =>
        prev.map((item) =>
          item.id === selectedStaffProfileModal.id
            ? {
              ...item,
              todayAttendance: profileNewStatus as 'Present' | 'Absent',
              attendanceNote: `Corrected to ${profileNewStatus} by Demo TOHFA Admin - Reason: Manual update`,
              hasErrorCorrection: profileNewStatus === 'Absent',
            }
            : item
        )
      );
      Alert.alert('Record Updated', `Attendance status updated to ${profileNewStatus}.`);
    }
    setSelectedStaffProfileModal(null);
    setProfileNewStatus('');
    setShowStatusPicker(false);
  };

  const renderWorkforceDashboardScreen = () => {
    const filteredStaff = workforceStaffList.filter((s) => {
      if (workforceFilterRole !== 'All') {
        if (workforceFilterRole === 'Admin' && s.type !== 'Admin' && !s.role.includes('Admin')) return false;
        if (workforceFilterRole === 'Drivers' && !s.role.toLowerCase().includes('driver')) return false;
        if (workforceFilterRole === 'Warehouse staff' && !s.role.toLowerCase().includes('warehouse') && !s.role.toLowerCase().includes('loading')) return false;
      }
      if (workforceFilterStatus !== 'All' && s.status !== workforceFilterStatus) return false;
      if (workforceFilterAttendance !== 'All' && s.todayAttendance !== workforceFilterAttendance) return false;
      if (!workforceSearch.trim()) return true;
      const q = workforceSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    });

    const adminCount = workforceStaffList.filter(s => s.type === 'Admin' || s.role.includes('Admin')).length;
    const whCount = workforceStaffList.filter(s => s.role.toLowerCase().includes('warehouse') || s.role.toLowerCase().includes('loading') || s.role.toLowerCase().includes('staff')).length;
    const driverCount = workforceStaffList.filter(s => s.role.toLowerCase().includes('driver')).length;

    return (
      <View style={styles.container}>
        {/* Header matching Screenshot 1 */}
        <View style={styles.workforceHeaderBanner}>
          <View style={styles.workforceHeaderTitleRow}>
            <TouchableOpacity
              style={styles.workforceBackBtn}
              onPress={() => {
                if (workforceReturnTab) {
                  setActiveTab(workforceReturnTab);
                  setWorkforceReturnTab(null);
                  setWorkforceSubScreen('dashboard');
                  setWorkforceActive(false);
                } else {
                  setWorkforceActive(false);
                  setActiveTab('Home');
                }
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
            </TouchableOpacity>
            <WorkforceBadgeIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.workforceHeaderTitle}>Workforce & Staff</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 6 KPI Metric Cards Grid (using reusable OverviewDashboardCard) */}
          <OverviewCardsGrid style={styles.workforceOverviewGrid}>
            <OverviewDashboardCard
              value="11"
              title="Admin Staff"
              icon="users"
              titlePosition="bottom"
            />
            <OverviewDashboardCard
              value="14"
              subtitle="(13 active)"
              title="Warehouse Staff"
              icon="box"
              titlePosition="bottom"
            />
            <OverviewDashboardCard
              value="6 of 7"
              title="Active Drivers"
              icon="truck"
              titlePosition="bottom"
            />
            <OverviewDashboardCard
              value="22 of 27"
              title="Today's Attendance"
              icon="clipboard"
              tone="success"
              titlePosition="bottom"
            />
            <OverviewDashboardCard
              value="Not configured"
              title="Pending Corrections"
              icon="orders"
              titlePosition="bottom"
            />
            <OverviewDashboardCard
              value="2"
              subtitle="Pending activation"
              title="Needs Attention"
              icon="alert"
              tone="danger"
              titlePosition="bottom"
            />
          </OverviewCardsGrid>

          {/* Role Distribution Section */}
          <View style={styles.workforceSection}>
            <Text style={styles.workforceSectionTitle}>Role distribution</Text>
            <View style={styles.workforceBarRow}>
              <Text style={styles.workforceBarLabel}>Warehouse staff</Text>
              <View style={styles.workforceBarTrack}>
                <View style={[styles.workforceBarFillOrange, { width: '100%' }]} />
              </View>
              <Text style={styles.workforceBarCount}>14</Text>
            </View>
            <View style={styles.workforceBarRow}>
              <Text style={styles.workforceBarLabel}>Drivers</Text>
              <View style={styles.workforceBarTrack}>
                <View style={[styles.workforceBarFillOrange, { width: '50%' }]} />
              </View>
              <Text style={styles.workforceBarCount}>7</Text>
            </View>
            <View style={styles.workforceBarRowLast}>
              <Text style={styles.workforceBarLabel}>Admin accounts</Text>
              <View style={styles.workforceBarTrack}>
                <View style={[styles.workforceBarFillOrange, { width: '78%' }]} />
              </View>
              <Text style={styles.workforceBarCount}>11</Text>
            </View>
          </View>

          {/* Today's Attendance Section */}
          <View style={styles.workforceSection}>
            <Text style={styles.workforceSectionTitle}>Today's attendance (leave not tracked)</Text>
            <View style={styles.workforceBarRow}>
              <Text style={styles.workforceBarLabel}>Present</Text>
              <View style={styles.workforceBarTrack}>
                <View style={[styles.workforceBarFillGreen, { width: '81%' }]} />
              </View>
              <Text style={styles.workforceBarCount}>22</Text>
            </View>
            <View style={styles.workforceBarRowLast}>
              <Text style={styles.workforceBarLabel}>Absent</Text>
              <View style={styles.workforceBarTrack}>
                <View style={[styles.workforceBarFillRed, { width: '19%' }]} />
              </View>
              <Text style={styles.workforceBarCount}>5</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.workforceSearchWrapper}>
            <View style={styles.workforceSearchBox}>
              <SearchIcon size={18} color={adminColors.muted} />
              <TextInput
                style={styles.workforceSearchInput}
                placeholder="Search..."
                placeholderTextColor={adminColors.placeholder}
                value={workforceSearch}
                onChangeText={setWorkforceSearch}
              />
              <TouchableOpacity
                onPress={() => setShowWorkforceFilterModal(true)}
                activeOpacity={0.7}
                style={(workforceFilterRole !== 'All' || workforceFilterStatus !== 'All' || workforceFilterAttendance !== 'All') ? { backgroundColor: adminColors.brandTint, borderRadius: 6, padding: 4 } : undefined}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <FilterSlidersIcon size={18} color={adminColors.brand} />
              </TouchableOpacity>
            </View>
            <Text style={styles.workforceSubCountText}>
              {`${adminCount} admin · ${whCount} warehouse staff · ${driverCount} drivers`}
            </Text>
          </View>

          {/* Directory Section */}
          <View style={styles.workforceSection}>
            <View style={styles.workforceCardRowBetween}>
              <Text style={styles.workforceSectionTitle}>Directory</Text>
              <TouchableOpacity onPress={() => setWorkforceSubScreen('management')} activeOpacity={0.7}>
                <Text style={styles.workforceViewAllLink}>View all roles →</Text>
              </TouchableOpacity>
            </View>

            {filteredStaff.map((staff) => (
              <TouchableOpacity
                key={staff.id}
                style={styles.workforceCard}
                onPress={() => {
                  setSelectedStaffDetails(staff);
                  setWorkforceSubScreen('details');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.workforceCardRowBetween}>
                  <Text style={styles.workforceCardTitle}>{`${staff.id} · ${staff.name}`}</Text>
                  <View
                    style={
                      staff.status === 'Active'
                        ? styles.workforceActiveBadge
                        : styles.workforcePendingBadge
                    }
                  >
                    <Text
                      style={
                        staff.status === 'Active'
                          ? styles.workforceActiveBadgeText
                          : styles.workforcePendingBadgeText
                      }
                    >
                      {staff.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.workforceCardSubtitle}>
                  {`${staff.role} · ${staff.warehouse} · ${staff.maskedMobile}`}
                </Text>
                {staff.todayAttendance && (
                  <Text style={styles.workforceCardSubtitleBold}>
                    {`Today: ${staff.todayAttendance}`}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions Section */}
          <View style={styles.workforceSection}>
            <Text style={styles.workforceSectionTitle}>Quick actions</Text>
            <View style={styles.workforceQuickActionsRow}>
              <TouchableOpacity
                style={styles.workforceQuickActionCard}
                onPress={() => setWorkforceSubScreen('create')}
                activeOpacity={0.8}
              >
                <QuickCreateStaffIcon size={24} color={adminColors.brand} />
                <Text style={styles.workforceQuickActionLabel}>Create Staff Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.workforceQuickActionCard}
                onPress={() => setWorkforceSubScreen('attendance')}
                activeOpacity={0.8}
              >
                <QuickStaffAttendanceIcon size={24} color={adminColors.brand} />
                <Text style={styles.workforceQuickActionLabel}>Staff Attendance</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Filter Modal */}
        <Modal
          visible={showWorkforceFilterModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWorkforceFilterModal(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowWorkforceFilterModal(false)}
          >
            <TouchableOpacity
              style={customerStyles.modalCard}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={customerStyles.modalTitle}>Filter Workforce & Staff</Text>

              {/* Role */}
              <Text style={customerStyles.filterSectionTitle}>Role</Text>
              <View style={customerStyles.filterChipsRow}>
                {(['All', 'Warehouse staff', 'Drivers', 'Admin'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[customerStyles.filterChip, workforceFilterRole === r && customerStyles.filterChipActive]}
                    onPress={() => setWorkforceFilterRole(r)}
                  >
                    <Text style={[customerStyles.filterChipText, workforceFilterRole === r && customerStyles.filterChipTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Status */}
              <Text style={customerStyles.filterSectionTitle}>Status</Text>
              <View style={customerStyles.filterChipsRow}>
                {(['All', 'Active', 'Pending activation'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[customerStyles.filterChip, workforceFilterStatus === s && customerStyles.filterChipActive]}
                    onPress={() => setWorkforceFilterStatus(s)}
                  >
                    <Text style={[customerStyles.filterChipText, workforceFilterStatus === s && customerStyles.filterChipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Today's Attendance */}
              <Text style={customerStyles.filterSectionTitle}>Today's Attendance</Text>
              <View style={customerStyles.filterChipsRow}>
                {(['All', 'Present', 'Absent'] as const).map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[customerStyles.filterChip, workforceFilterAttendance === a && customerStyles.filterChipActive]}
                    onPress={() => setWorkforceFilterAttendance(a)}
                  >
                    <Text style={[customerStyles.filterChipText, workforceFilterAttendance === a && customerStyles.filterChipTextActive]}>
                      {a}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Modal Buttons */}
              <View style={customerStyles.modalButtonsRow}>
                <TouchableOpacity
                  style={customerStyles.modalResetBtn}
                  onPress={() => {
                    setWorkforceFilterRole('All');
                    setWorkforceFilterStatus('All');
                    setWorkforceFilterAttendance('All');
                    setShowWorkforceFilterModal(false);
                  }}
                >
                  <Text style={customerStyles.modalResetBtnText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={customerStyles.modalApplyBtn}
                  onPress={() => setShowWorkforceFilterModal(false)}
                >
                  <Text style={customerStyles.modalApplyBtnText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  const renderWorkforceManagementScreen = () => {
    const filteredStaff = workforceStaffList.filter((s) =>
      s.name.toLowerCase().includes(workforceSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(workforceSearch.toLowerCase()) ||
      s.role.toLowerCase().includes(workforceSearch.toLowerCase())
    );

    return (
      <View style={styles.container}>
        {/* Header matching Screenshot 3 Left */}
        <View style={styles.workforceHeaderBanner}>
          <View style={styles.workforceHeaderTitleRow}>
            <TouchableOpacity
              style={styles.workforceBackBtn}
              onPress={() => setWorkforceSubScreen('dashboard')}
              activeOpacity={0.7}
            >
              <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.workforceHeaderTitle}>Staff Profile & Role Management</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={styles.workforceSearchWrapper}>
            <View style={styles.workforceSearchBox}>
              <SearchIcon size={18} color={adminColors.muted} />
              <TextInput
                style={styles.workforceSearchInput}
                placeholder="Search..."
                placeholderTextColor={adminColors.placeholder}
                value={workforceSearch}
                onChangeText={setWorkforceSearch}
              />
              <TouchableOpacity activeOpacity={0.7}>
                <FilterSlidersIcon size={18} color={adminColors.brand} />
              </TouchableOpacity>
            </View>
            <Text style={styles.workforceSubCountText}>11 admin · 14 warehouse staff · 7 drivers</Text>
          </View>

          {/* Staff Cards List */}
          <View style={styles.workforceSection}>
            {filteredStaff.map((staff) => (
              <TouchableOpacity
                key={staff.id}
                style={styles.workforceCard}
                onPress={() => {
                  setSelectedStaffDetails(staff);
                  setWorkforceSubScreen('details');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.workforceCardRowBetween}>
                  <Text style={styles.workforceCardTitle}>{`${staff.id} · ${staff.name}`}</Text>
                  <View
                    style={
                      staff.status === 'Active'
                        ? styles.workforceActiveBadge
                        : styles.workforcePendingBadge
                    }
                  >
                    <Text
                      style={
                        staff.status === 'Active'
                          ? styles.workforceActiveBadgeText
                          : styles.workforcePendingBadgeText
                      }
                    >
                      {staff.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.workforceCardSubtitle}>
                  {staff.status === 'Pending activation'
                    ? `${staff.role} · ${staff.warehouse} · ${staff.createdText}`
                    : `${staff.role} · ${staff.workSection} · ${staff.warehouse} · Joined ${staff.joiningDate}`}
                </Text>
                {staff.activationNote && (
                  <Text style={styles.workforceCardSubtitleMuted}>
                    {staff.activationNote}
                  </Text>
                )}

                {/* Actions row: Edit | Deactivate */}
                <View style={styles.workforceCardActionsRow}>
                  <TouchableOpacity
                    onPress={() => setSelectedStaffProfileModal(staff)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.workforceActionEdit}>Edit</Text>
                  </TouchableOpacity>
                  {staff.status === 'Active' ? (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Deactivate Staff', `Are you sure you want to deactivate ${staff.name}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Deactivate',
                            style: 'destructive',
                            onPress: () => {
                              setWorkforceStaffList((prev) =>
                                prev.map((item) =>
                                  item.id === staff.id ? { ...item, status: 'Inactive' } : item
                                )
                              );
                            },
                          },
                        ]);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.workforceActionDeactivate}>Deactivate</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setWorkforceStaffList((prev) =>
                          prev.map((item) =>
                            item.id === staff.id ? { ...item, status: 'Active' } : item
                          )
                        );
                        Alert.alert('Activated', `${staff.name} is now active.`);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.workforceActionActivate}>Activate</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Docked Create Account Button */}
        <TouchableOpacity
          style={styles.workforceDockedPrimaryBtn}
          onPress={() => setWorkforceSubScreen('create')}
          activeOpacity={0.8}
        >
          <Text style={styles.workforceDockedPrimaryBtnText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWorkforceCreateScreen = () => {
    return (
      <View style={styles.container}>
        {/* Header matching Screenshot 1-5 */}
        <View style={styles.workforceHeaderBanner}>
          <View style={styles.workforceHeaderTitleRow}>
            <TouchableOpacity
              style={styles.workforceBackBtn}
              onPress={() => {
                if (workforceReturnTab) {
                  setActiveTab(workforceReturnTab);
                  setWorkforceReturnTab(null);
                  setWorkforceSubScreen('dashboard');
                } else {
                  setWorkforceSubScreen('management');
                }
              }}
              activeOpacity={0.7}
            >
              <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.workforceHeaderTitle}>Create account</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.workforceCreateScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ══════════════════════════════════════════════════════════════════════
              CARD 1: 1  Personal Details (Screenshots 1 & 2)
             ══════════════════════════════════════════════════════════════════════ */}
          <View style={styles.workforceCreateCard}>
            <View style={styles.workforceCardHeader}>
              <View style={styles.workforceCardHeaderLeft}>
                <View style={styles.workforceStepBadge}>
                  <Text style={styles.workforceStepBadgeText}>1</Text>
                </View>
                <View style={styles.workforceCardHeaderTextCol}>
                  <Text style={styles.workforceCreateCardTitle}>Personal Details</Text>
                  <Text style={styles.workforceCreateCardSubtitle}>Basic details of the staff member.</Text>
                </View>
              </View>
            </View>
            <View style={styles.workforceCardDivider} />

            {/* Profile Photo optional */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Profile Photo</Text>
                <Text style={styles.workforceOptionalText}>optional</Text>
              </View>
              <View style={styles.workforcePhotoRow}>
                <View style={styles.workforcePhotoPlaceholder}>
                  <Text style={styles.workforcePhotoPlaceholderQuestion}>
                    {createStaffPhoto ? '✓' : '?'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.workforceUploadPhotoBtn}
                  onPress={() => {
                    setCreateStaffPhoto('profile_photo.jpg');
                    Alert.alert('Photo Selected', 'Sample photo selected: profile_photo.jpg');
                  }}
                  activeOpacity={0.75}
                >
                  <UploadSimpleIcon size={16} color={adminColors.ink} />
                  <Text style={styles.workforceUploadPhotoBtnText}>
                    {createStaffPhoto ? 'Change photo' : 'Upload photo'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.workforceFormHelperText}>JPG or PNG, within the 5 MB limit.</Text>
            </View>

            {/* First Name * */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>First Name</Text>
                <Text style={styles.requiredStar}> *</Text>
              </View>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffFirstName}
                onChangeText={setCreateStaffFirstName}
              />
            </View>

            {/* Middle Name optional */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Middle Name</Text>
                <Text style={styles.workforceOptionalText}>optional</Text>
              </View>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffMiddleName}
                onChangeText={setCreateStaffMiddleName}
              />
            </View>

            {/* Last Name * */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Last Name</Text>
                <Text style={styles.requiredStar}> *</Text>
              </View>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffLastName}
                onChangeText={setCreateStaffLastName}
              />
            </View>

            {/* Date of Birth optional */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Date of Birth</Text>
                <Text style={styles.workforceOptionalText}>optional</Text>
              </View>
              <View style={styles.workforceInputWithIconRow}>
                <TextInput
                  style={styles.workforceInputEmbedded}
                  placeholder="dd-mm-yyyy"
                  placeholderTextColor={adminColors.placeholder}
                  value={createStaffDob}
                  onChangeText={setCreateStaffDob}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (!createStaffDob) {
                      setCreateStaffDob('12-04-1992');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <CalendarOutlineIcon size={20} color={adminColors.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Gender */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Gender</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() => setOpenDropdownField((prev) => (prev === 'gender' ? null : 'gender'))}
                activeOpacity={0.75}
              >
                <Text style={createStaffGender !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffGender}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              {openDropdownField === 'gender' && (
                <View style={styles.workforceInlineDropdownMenu}>
                  {(['Select', 'Male', 'Female', 'Other'] as const).map((opt, idx, arr) => {
                    const isSelect = opt === 'Select';
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.workforceInlineDropdownItem,
                          isSelect && styles.workforceInlineDropdownItemGrey,
                          idx === arr.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => {
                          setCreateStaffGender(opt);
                          setOpenDropdownField(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.workforceInlineDropdownItemText,
                            isSelect && styles.workforceInlineDropdownItemTextWhite,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Marital Status (Screenshots 3 UI matching exact grey select) */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Marital Status</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() => setOpenDropdownField((prev) => (prev === 'marital' ? null : 'marital'))}
                activeOpacity={0.75}
              >
                <Text style={createStaffMarital !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffMarital}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              {openDropdownField === 'marital' && (
                <View style={styles.workforceInlineDropdownMenu}>
                  {(['Select', 'Married', 'Unmarried'] as const).map((opt, idx, arr) => {
                    const isSelect = opt === 'Select';
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.workforceInlineDropdownItem,
                          isSelect && styles.workforceInlineDropdownItemGrey,
                          idx === arr.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => {
                          setCreateStaffMarital(opt);
                          setOpenDropdownField(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.workforceInlineDropdownItemText,
                            isSelect && styles.workforceInlineDropdownItemTextWhite,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Father's / Guardian's Name optional */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Father's / Guardian's Name</Text>
                <Text style={styles.workforceOptionalText}>optional</Text>
              </View>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffGuardian}
                onChangeText={setCreateStaffGuardian}
              />
            </View>

            {/* Nationality optional */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Nationality</Text>
                <Text style={styles.workforceOptionalText}>optional</Text>
              </View>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffNationality}
                onChangeText={setCreateStaffNationality}
              />
            </View>

            {/* Preferred Language optional */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Preferred Language</Text>
                <Text style={styles.workforceOptionalText}>optional</Text>
              </View>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() => setOpenDropdownField((prev) => (prev === 'language' ? null : 'language'))}
                activeOpacity={0.75}
              >
                <Text style={createStaffLanguage !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffLanguage}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              {openDropdownField === 'language' && (
                <View style={styles.workforceInlineDropdownMenu}>
                  {(['Select', 'Tamil', 'English', 'Hindi', 'Malayalam', 'Kannada', 'Telugu'] as const).map((opt, idx, arr) => {
                    const isSelect = opt === 'Select';
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.workforceInlineDropdownItem,
                          isSelect && styles.workforceInlineDropdownItemGrey,
                          idx === arr.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => {
                          setCreateStaffLanguage(opt);
                          setOpenDropdownField(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.workforceInlineDropdownItemText,
                            isSelect && styles.workforceInlineDropdownItemTextWhite,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Blood Group */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Blood Group</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() => setOpenDropdownField((prev) => (prev === 'bloodGroup' ? null : 'bloodGroup'))}
                activeOpacity={0.75}
              >
                <Text style={createStaffBloodGroup !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffBloodGroup}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              {openDropdownField === 'bloodGroup' && (
                <View style={styles.workforceInlineDropdownMenu}>
                  {(['Select', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const).map((opt, idx, arr) => {
                    const isSelect = opt === 'Select';
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.workforceInlineDropdownItem,
                          isSelect && styles.workforceInlineDropdownItemGrey,
                          idx === arr.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => {
                          setCreateStaffBloodGroup(opt);
                          setOpenDropdownField(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.workforceInlineDropdownItemText,
                            isSelect && styles.workforceInlineDropdownItemTextWhite,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════════
              CARD 2: 2  Contact Details (Screenshots 2 & 3)
             ══════════════════════════════════════════════════════════════════════ */}
          <View style={styles.workforceCreateCard}>
            <View style={styles.workforceCardHeader}>
              <View style={styles.workforceCardHeaderLeft}>
                <View style={styles.workforceStepBadge}>
                  <Text style={styles.workforceStepBadgeText}>2</Text>
                </View>
                <View style={styles.workforceCardHeaderTextCol}>
                  <Text style={styles.workforceCreateCardTitle}>Contact Details</Text>
                  <Text style={styles.workforceCreateCardSubtitle}>How to reach the staff member.</Text>
                </View>
              </View>
            </View>
            <View style={styles.workforceCardDivider} />

            {/* Primary Mobile Number * */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Primary Mobile Number</Text>
                <Text style={styles.requiredStar}> *</Text>
              </View>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                keyboardType="phone-pad"
                maxLength={10}
                value={createStaffMobile}
                onChangeText={setCreateStaffMobile}
              />
              <Text style={styles.workforceFormHelperText}>10-digit Indian mobile number.</Text>
            </View>

            {/* Alternate Mobile Number */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Alternate Mobile Number</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                keyboardType="phone-pad"
                maxLength={10}
                value={createStaffAltMobile}
                onChangeText={setCreateStaffAltMobile}
              />
            </View>

            {/* Email Address * */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Email Address</Text>
                <Text style={styles.requiredStar}> *</Text>
              </View>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={createStaffEmail}
                onChangeText={setCreateStaffEmail}
              />
              <Text style={styles.workforceFormHelperText}>Also used as the login username.</Text>
            </View>

            {/* Current Address */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Current Address</Text>
              <TextInput
                style={[styles.workforceFormInput, styles.workforceFormMultiline]}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                multiline
                numberOfLines={3}
                value={createStaffAddress}
                onChangeText={setCreateStaffAddress}
              />
            </View>

            {/* State */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>State</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select State',
                    options: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Maharashtra'],
                    selected: createStaffState,
                    onSelect: (val) => setCreateStaffState(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffState ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffState || 'Select'}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            {/* District */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>District</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffDistrict}
                onChangeText={setCreateStaffDistrict}
              />
            </View>

            {/* City / Town */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>City / Town</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffCity}
                onChangeText={setCreateStaffCity}
              />
            </View>

            {/* PIN Code */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>PIN Code</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                keyboardType="number-pad"
                maxLength={6}
                value={createStaffPin}
                onChangeText={setCreateStaffPin}
              />
            </View>

            {/* Permanent address checkbox */}
            <TouchableOpacity
              style={styles.workforceCheckboxBox}
              onPress={() => setIsSamePermanentAddress(!isSamePermanentAddress)}
              activeOpacity={0.8}
            >
              <View style={[styles.workforceCheckboxSquare, isSamePermanentAddress && styles.workforceCheckboxSquareChecked]}>
                {isSamePermanentAddress && <CheckmarkSmallIcon size={12} color={adminColors.ink} />}
              </View>
              <Text style={styles.workforceCheckboxBoxText}>Permanent address is the same as the current address</Text>
            </TouchableOpacity>
          </View>

          {/* ══════════════════════════════════════════════════════════════════════
              CARD 3: 3  ID Proof & Verification (Screenshots 3 & 4)
             ══════════════════════════════════════════════════════════════════════ */}
          <View style={styles.workforceCreateCard}>
            <View style={styles.workforceCardHeader}>
              <View style={styles.workforceCardHeaderLeft}>
                <View style={styles.workforceStepBadge}>
                  <Text style={styles.workforceStepBadgeText}>3</Text>
                </View>
                <View style={styles.workforceCardHeaderTextCol}>
                  <Text style={styles.workforceCreateCardTitle}>ID Proof & Verification</Text>
                  <Text style={styles.workforceCreateCardSubtitle}>Optional unless an ID type is chosen. Numbers are masked everywhere.</Text>
                </View>
              </View>
            </View>
            <View style={styles.workforceCardDivider} />

            {/* Info callout */}
            <View style={styles.workforceIdCallout}>
              <ShieldOutlineIcon size={18} color="#1C4E75" />
              <Text style={styles.workforceIdCalloutText}>
                The full ID number is never stored or shown. After saving, only the last four digits appear. Collecting an Aadhaar number needs a compliance check with TOHFA.
              </Text>
            </View>

            {/* ID Proof Type */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>ID Proof Type</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select ID Proof Type',
                    options: ['Select...', 'Aadhaar', 'PAN Card', 'Voter ID', 'Driving License'],
                    selected: createStaffIdType,
                    onSelect: (val) => setCreateStaffIdType(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffIdType !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffIdType}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              <Text style={styles.workforceFormHelperText}>The accepted types are subject to TOHFA policy.</Text>
            </View>

            {/* ID Proof Number */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>ID Proof Number</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffIdNumber}
                onChangeText={setCreateStaffIdNumber}
              />
              <Text style={styles.workforceFormHelperText}>Choose the ID type first.</Text>
            </View>

            {/* ID Proof Name */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>ID Proof Name</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffIdName}
                onChangeText={setCreateStaffIdName}
              />
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════════
              CARD 4: 4  Bank Account Details (Screenshots 4 & 5)
             ══════════════════════════════════════════════════════════════════════ */}
          <View style={styles.workforceCreateCard}>
            <View style={styles.workforceCardHeader}>
              <View style={styles.workforceCardHeaderLeft}>
                <View style={styles.workforceStepBadge}>
                  <Text style={styles.workforceStepBadgeText}>4</Text>
                </View>
                <View style={styles.workforceCardHeaderTextCol}>
                  <Text style={styles.workforceCreateCardTitle}>Bank Account Details</Text>
                  <Text style={styles.workforceCreateCardSubtitle}>Optional. If you start, the required bank fields must be completed.</Text>
                </View>
              </View>
            </View>
            <View style={styles.workforceCardDivider} />

            {/* Account Holder Name */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Account Holder Name</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffAccountHolder}
                onChangeText={setCreateStaffAccountHolder}
              />
            </View>

            {/* Bank Name */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Bank Name</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffBankName}
                onChangeText={setCreateStaffBankName}
              />
            </View>

            {/* Account Number */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Account Number</Text>
              <View style={styles.workforceInputWithIconRow}>
                <TextInput
                  style={styles.workforceInputEmbedded}
                  placeholder=""
                  placeholderTextColor={adminColors.placeholder}
                  secureTextEntry={!showAccountNumber}
                  keyboardType="number-pad"
                  value={createStaffAccountNumber}
                  onChangeText={setCreateStaffAccountNumber}
                />
                <TouchableOpacity onPress={() => setShowAccountNumber(!showAccountNumber)} activeOpacity={0.7}>
                  <EyeOutlineIcon size={20} color={adminColors.muted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.workforceFormHelperText}>9 to 18 digits. Shown masked after saving, and never stored in full.</Text>
            </View>

            {/* Confirm Account Number */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Confirm Account Number</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                keyboardType="number-pad"
                value={createStaffConfirmAccount}
                onChangeText={setCreateStaffConfirmAccount}
              />
            </View>

            {/* IFSC Code */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>IFSC Code</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                autoCapitalize="characters"
                value={createStaffIfsc}
                onChangeText={setCreateStaffIfsc}
              />
              <Text style={styles.workforceFormHelperText}>Like SBIN0001234.</Text>
            </View>

            {/* Branch Name */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Branch Name</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffBranch}
                onChangeText={setCreateStaffBranch}
              />
            </View>

            {/* Account Type */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Account Type</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Account Type',
                    options: ['Select...', 'Savings', 'Current', 'Salary'],
                    selected: createStaffAccountType,
                    onSelect: (val) => setCreateStaffAccountType(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffAccountType !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffAccountType}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            {/* Cancelled Cheque / Bank Proof optional */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Cancelled Cheque / Bank Proof</Text>
                <Text style={styles.workforceOptionalText}>optional</Text>
              </View>
              <View style={styles.workforceUploadDropZone}>
                <DocumentUploadIcon size={26} color="#B35312" />
                <Text style={styles.workforceUploadDropZoneTitle}>
                  {createStaffBankProof || 'Drag and drop a file here'}
                </Text>
                <Text style={styles.workforceUploadDropZoneSubtitle}>PDF, JPG or PNG · up to 5 MB</Text>
                <TouchableOpacity
                  style={styles.workforceBrowseFilesBtn}
                  onPress={() => {
                    setCreateStaffBankProof('cancelled_cheque.pdf');
                    Alert.alert('File Attached', 'Attached sample file: cancelled_cheque.pdf');
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.workforceBrowseFilesBtnText}>
                    {createStaffBankProof ? 'Replace File' : 'Browse Files'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════════
              CARD 5: 5  Employment Details (Screenshot 1 & 2)
             ══════════════════════════════════════════════════════════════════════ */}
          <View style={styles.workforceCreateCard}>
            <View style={styles.workforceCardHeader}>
              <View style={styles.workforceCardHeaderLeft}>
                <View style={styles.workforceStepBadge}>
                  <Text style={styles.workforceStepBadgeText}>5</Text>
                </View>
                <View style={styles.workforceCardHeaderTextCol}>
                  <Text style={styles.workforceCreateCardTitle}>Employment Details</Text>
                  <Text style={styles.workforceCreateCardSubtitle}>Choices come from configured TOHFA records. No salary or payroll is set here.</Text>
                </View>
              </View>
            </View>
            <View style={styles.workforceCardDivider} />

            {/* Employment Type */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Employment Type</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Employment Type',
                    options: ['Select...', 'Full-time', 'Contract', 'Part-time', 'Probation', 'Temporary'],
                    selected: createStaffEmploymentType,
                    onSelect: (val) => setCreateStaffEmploymentType(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffEmploymentType !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffEmploymentType}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              <Text style={styles.workforceFormHelperText}>Example list: configurable.</Text>
            </View>

            {/* Department */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Department</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Department',
                    options: ['Select...', 'Warehouse Operations', 'Warehouse Administration', 'Logistics & Transport', 'Quality & Sorting', 'Security & Facilities'],
                    selected: createStaffDepartment,
                    onSelect: (val) => setCreateStaffDepartment(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffDepartment !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffDepartment}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              <Text style={styles.workforceFormHelperText}>Example list: configurable, not official.</Text>
            </View>

            {/* Designation */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Designation</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Designation',
                    options: ['Select...', 'Warehouse Staff', 'Loadman', 'Driver', 'Sorter & Grader', 'Sub Warehouse Admin', 'Inventory Supervisor'],
                    selected: createStaffDesignation,
                    onSelect: (val) => setCreateStaffDesignation(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffDesignation !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffDesignation}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              <Text style={styles.workforceFormHelperText}>Example list: configurable.</Text>
            </View>

            {/* Employment Status optional */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Employment Status</Text>
                <Text style={styles.workforceOptionalText}>optional</Text>
              </View>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Employment Status',
                    options: ['Select...', 'Active', 'On Probation', 'Notice Period', 'Inactive'],
                    selected: createStaffEmploymentStatus,
                    onSelect: (val) => setCreateStaffEmploymentStatus(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffEmploymentStatus !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffEmploymentStatus}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            {/* Salary details */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Salary details</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffSalaryDetails}
                onChangeText={setCreateStaffSalaryDetails}
              />
              <Text style={styles.workforceFormHelperText}>A new staff member starts as Active.</Text>
            </View>

            {/* Work Location */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Work Location</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Work Location',
                    options: [
                      'Select...',
                      'Main Warehouse, Ooty (WH-MAIN)',
                      'Coonoor Warehouse (WH-CNR)',
                      'Kotagiri Warehouse (WH-KTG)',
                      'Gudalur Warehouse (WH-GDL)',
                    ],
                    selected: createStaffWorkLocation,
                    onSelect: (val) => setCreateStaffWorkLocation(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffWorkLocation !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffWorkLocation}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════════
              CARD 6: 6  Role & Access Management (Screenshots 1 & 2)
             ══════════════════════════════════════════════════════════════════════ */}
          <View style={styles.workforceCreateCard}>
            <View style={styles.workforceCardHeader}>
              <View style={styles.workforceCardHeaderLeft}>
                <View style={styles.workforceStepBadge}>
                  <Text style={styles.workforceStepBadgeText}>6</Text>
                </View>
                <View style={styles.workforceCardHeaderTextCol}>
                  <Text style={styles.workforceCreateCardTitle}>Role & Access Management</Text>
                  <Text style={styles.workforceCreateCardSubtitle}>What this person can do in TOHFA Admin. Limited to roles you may create.</Text>
                </View>
              </View>
            </View>
            <View style={styles.workforceCardDivider} />

            {/* Account Access * */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Account Access</Text>
                <Text style={styles.requiredStar}> *</Text>
              </View>

              {/* Radio Option 1: Application login */}
              <TouchableOpacity
                style={createStaffAccountAccess === 'login' ? styles.workforceRadioCardSelected : styles.workforceRadioCard}
                onPress={() => setCreateStaffAccountAccess('login')}
                activeOpacity={0.8}
              >
                {createStaffAccountAccess === 'login' ? (
                  <RadioSelectedIcon size={22} color={adminColors.brand} />
                ) : (
                  <RadioUnselectedIcon size={22} color={adminColors.muted} />
                )}
                <View style={styles.workforceRadioTextCol}>
                  <Text style={styles.workforceRadioTitle}>Application login</Text>
                  <Text style={styles.workforceRadioSubtitle}>An admin account with a role. Starts as Pending activation.</Text>
                </View>
              </TouchableOpacity>

              {/* Radio Option 2: No application access */}
              <TouchableOpacity
                style={createStaffAccountAccess === 'no_login' ? styles.workforceRadioCardSelected : styles.workforceRadioCard}
                onPress={() => setCreateStaffAccountAccess('no_login')}
                activeOpacity={0.8}
              >
                {createStaffAccountAccess === 'no_login' ? (
                  <RadioSelectedIcon size={22} color={adminColors.brand} />
                ) : (
                  <RadioUnselectedIcon size={22} color={adminColors.muted} />
                )}
                <View style={styles.workforceRadioTextCol}>
                  <Text style={styles.workforceRadioTitle}>No application access</Text>
                  <Text style={styles.workforceRadioSubtitle}>A warehouse staff record without a login. Needs a warehouse.</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Application Role * */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Application Role</Text>
                <Text style={styles.requiredStar}> *</Text>
              </View>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() => setOpenDropdownField((prev) => (prev === 'applicationRole' ? null : 'applicationRole'))}
                activeOpacity={0.75}
              >
                <Text style={createStaffApplicationRole !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffApplicationRole}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              {openDropdownField === 'applicationRole' && (
                <View style={styles.workforceInlineDropdownMenu}>
                  {(['Select...', 'Warehouse Staff', 'Sub Warehouse Admin', 'Logistics Coordinator', 'Inventory Manager', 'TOHFA Admin'] as const).map((opt, idx, arr) => {
                    const isSelect = opt === 'Select...';
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.workforceInlineDropdownItem,
                          isSelect && styles.workforceInlineDropdownItemGrey,
                          idx === arr.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => {
                          setCreateStaffApplicationRole(opt);
                          setOpenDropdownField(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.workforceInlineDropdownItemText,
                            isSelect && styles.workforceInlineDropdownItemTextWhite,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <Text style={styles.workforceFormHelperText}>Only roles you may create are listed. The server checks this again.</Text>
            </View>

            {/* Login Email / Username */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Login Email / Username</Text>
              <View style={styles.workforceStaticInputBox}>
                <Text style={styles.workforceStaticInputText}>
                  {createStaffEmail.trim() || 'Taken from the email address.'}
                </Text>
              </View>
              <Text style={[styles.workforceFormHelperText, { color: adminColors.brand }]}>Choose a role to see what it can do.</Text>
            </View>

            {/* Account Status */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Account Status</Text>
              <View style={styles.workforceAccountStatusBox}>
                <Text style={styles.workforceAccountStatusTitle}>Pending activation </Text>
                <Text style={styles.workforceAccountStatusSub}>Never Active at creation.</Text>
              </View>
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════════
              CARD 7: 7  Emergency Contact (Screenshots 3 & User prompt: role 6 then 7 emergency)
             ══════════════════════════════════════════════════════════════════════ */}
          <View style={styles.workforceCreateCard}>
            <View style={styles.workforceCardHeader}>
              <View style={styles.workforceCardHeaderLeft}>
                <View style={styles.workforceStepBadge}>
                  <Text style={styles.workforceStepBadgeText}>7</Text>
                </View>
                <View style={styles.workforceCardHeaderTextCol}>
                  <Text style={styles.workforceCreateCardTitle}>Emergency Contact</Text>
                  <Text style={styles.workforceCreateCardSubtitle}>Optional. If you start, the name, relationship and number are required.</Text>
                </View>
              </View>
            </View>
            <View style={styles.workforceCardDivider} />

            {/* Contact Person Name */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Contact Person Name</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                value={createStaffEmergencyName}
                onChangeText={setCreateStaffEmergencyName}
              />
            </View>

            {/* Relationship */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Relationship</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() => setOpenDropdownField((prev) => (prev === 'relationship' ? null : 'relationship'))}
                activeOpacity={0.75}
              >
                <Text style={createStaffEmergencyRel !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffEmergencyRel}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              {openDropdownField === 'relationship' && (
                <View style={styles.workforceInlineDropdownMenu}>
                  {(['Select...', 'Spouse', 'Parent', 'Sibling', 'Child', 'Relative', 'Friend', 'Other'] as const).map((opt, idx, arr) => {
                    const isSelect = opt === 'Select...';
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.workforceInlineDropdownItem,
                          isSelect && styles.workforceInlineDropdownItemGrey,
                          idx === arr.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => {
                          setCreateStaffEmergencyRel(opt);
                          setOpenDropdownField(null);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.workforceInlineDropdownItemText,
                            isSelect && styles.workforceInlineDropdownItemTextWhite,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Primary Contact Number */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Primary Contact Number</Text>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                keyboardType="phone-pad"
                value={createStaffEmergencyPhone}
                onChangeText={setCreateStaffEmergencyPhone}
              />
            </View>

            {/* Alternate Contact Number optional */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Alternate Contact Number</Text>
                <Text style={styles.workforceOptionalText}>optional</Text>
              </View>
              <TextInput
                style={styles.workforceFormInput}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                keyboardType="phone-pad"
                value={createStaffEmergencyAltPhone}
                onChangeText={setCreateStaffEmergencyAltPhone}
              />
            </View>

            {/* Contact Address optional */}
            <View style={styles.workforceFormField}>
              <View style={styles.workforceFormLabelRow}>
                <Text style={styles.workforceFormLabel}>Contact Address</Text>
                <Text style={styles.workforceOptionalText}>optional</Text>
              </View>
              <TextInput
                style={[styles.workforceFormInput, { minHeight: 64, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder=""
                placeholderTextColor={adminColors.placeholder}
                multiline
                value={createStaffEmergencyAddress}
                onChangeText={setCreateStaffEmergencyAddress}
              />
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════════
              CARD 8: 8  Document Uploads (Screenshots 3, 4 & 5)
             ══════════════════════════════════════════════════════════════════════ */}
          <View style={styles.workforceCreateCard}>
            <View style={styles.workforceCardHeader}>
              <View style={styles.workforceCardHeaderLeft}>
                <View style={styles.workforceStepBadge}>
                  <Text style={styles.workforceStepBadgeText}>8</Text>
                </View>
                <View style={styles.workforceCardHeaderTextCol}>
                  <Text style={styles.workforceCreateCardTitle}>Document Uploads</Text>
                  <Text style={styles.workforceCreateCardSubtitle}>Required only where policy says so. PDF, JPG or PNG within the configured size limit.</Text>
                </View>
              </View>
            </View>
            <View style={styles.workforceCardDivider} />

            {/* Callout box */}
            <View style={styles.workforceIdCallout}>
              <PolicySliderIcon size={20} color={adminColors.info.text} />
              <Text style={styles.workforceIdCalloutText}>
                Requirements follow policy, not a blanket rule: only the documents marked Required block creation. Files are checked for type and size here and again on the server. Uploads are simulated in this prototype.
              </Text>
            </View>

            {/* Document 1: ID Proof */}
            <View style={styles.workforceDocItem}>
              <Text style={styles.workforceDocItemTitle}>ID Proof</Text>
              <Text style={styles.workforceDocItemSub}>Managed in ID Proof & Verification</Text>
              <View style={styles.workforceDocPill}>
                <Text style={styles.workforceDocPillText}>Optional</Text>
              </View>
              <Text style={styles.workforceDocFileText}>
                {createStaffIdNumber ? 'id_document_scan.pdf' : 'No file'}
              </Text>
              <Text style={styles.workforceDocVerificationLabel}>Verification</Text>
              <View style={styles.workforceDocVerificationPill}>
                <Text style={styles.workforceDocVerificationPillText}>
                  {createStaffIdNumber ? 'Pending verification' : 'Not submitted'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.workforceDocActionBtn}
                onPress={() => Alert.alert('ID Proof', 'Managed in Section 3: ID Proof & Verification')}
                activeOpacity={0.75}
              >
                <Text style={styles.workforceDocActionBtnText}>Open section</Text>
              </TouchableOpacity>
            </View>

            {/* Document 2: Address Proof */}
            <View style={styles.workforceDocItem}>
              <Text style={styles.workforceDocItemTitle}>Address Proof</Text>
              <Text style={styles.workforceDocItemSub}>Policy: optional</Text>
              <View style={styles.workforceDocPill}>
                <Text style={styles.workforceDocPillText}>Optional</Text>
              </View>
              <Text style={styles.workforceDocFileText}>
                {createStaffDocAddressProof || 'No file'}
              </Text>
              <Text style={styles.workforceDocVerificationLabel}>Verification</Text>
              <View style={styles.workforceDocVerificationPill}>
                <Text style={styles.workforceDocVerificationPillText}>
                  {createStaffDocAddressProof ? 'Pending verification' : 'Not submitted'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.workforceDocActionBtn}
                onPress={() => {
                  setCreateStaffDocAddressProof('address_proof.pdf');
                  Alert.alert('File Attached', 'Attached sample file: address_proof.pdf');
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.workforceDocActionBtnText}>
                  {createStaffDocAddressProof ? 'Replace File' : 'Browse Files'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Document 3: Bank Proof */}
            <View style={styles.workforceDocItem}>
              <Text style={styles.workforceDocItemTitle}>Bank Proof</Text>
              <Text style={styles.workforceDocItemSub}>Policy: optional</Text>
              <View style={styles.workforceDocPill}>
                <Text style={styles.workforceDocPillText}>Optional</Text>
              </View>
              <Text style={styles.workforceDocFileText}>
                {createStaffBankProof || 'No file'}
              </Text>
              <Text style={styles.workforceDocVerificationLabel}>Verification</Text>
              <View style={styles.workforceDocVerificationPill}>
                <Text style={styles.workforceDocVerificationPillText}>
                  {createStaffBankProof ? 'Pending verification' : 'Not submitted'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.workforceDocActionBtn}
                onPress={() => {
                  setCreateStaffBankProof('cancelled_cheque.pdf');
                  Alert.alert('File Attached', 'Attached sample file: cancelled_cheque.pdf');
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.workforceDocActionBtnText}>
                  {createStaffBankProof ? 'Replace File' : 'Browse Files'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Document 4: Appointment Letter */}
            <View style={styles.workforceDocItem}>
              <Text style={styles.workforceDocItemTitle}>Appointment Letter</Text>
              <Text style={styles.workforceDocItemSub}>Policy: optional</Text>
              <View style={styles.workforceDocPill}>
                <Text style={styles.workforceDocPillText}>Optional</Text>
              </View>
              <Text style={styles.workforceDocFileText}>
                {createStaffDocAppointmentLetter || 'No file'}
              </Text>
              <Text style={styles.workforceDocVerificationLabel}>Verification</Text>
              <View style={styles.workforceDocVerificationPill}>
                <Text style={styles.workforceDocVerificationPillText}>
                  {createStaffDocAppointmentLetter ? 'Pending verification' : 'Not submitted'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.workforceDocActionBtn}
                onPress={() => {
                  setCreateStaffDocAppointmentLetter('appointment_letter.pdf');
                  Alert.alert('File Attached', 'Attached sample file: appointment_letter.pdf');
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.workforceDocActionBtnText}>
                  {createStaffDocAppointmentLetter ? 'Replace File' : 'Browse Files'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Document 5: Employment Agreement */}
            <View style={styles.workforceDocItem}>
              <Text style={styles.workforceDocItemTitle}>Employment Agreement</Text>
              <Text style={styles.workforceDocItemSub}>Policy: required for a contract (proposed)</Text>
              <View style={styles.workforceDocPill}>
                <Text style={styles.workforceDocPillText}>Optional</Text>
              </View>
              <Text style={styles.workforceDocFileText}>
                {createStaffDocAgreement || 'No file'}
              </Text>
              <Text style={styles.workforceDocVerificationLabel}>Verification</Text>
              <View style={styles.workforceDocVerificationPill}>
                <Text style={styles.workforceDocVerificationPillText}>
                  {createStaffDocAgreement ? 'Pending verification' : 'Not submitted'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.workforceDocActionBtn}
                onPress={() => {
                  setCreateStaffDocAgreement('employment_agreement.pdf');
                  Alert.alert('File Attached', 'Attached sample file: employment_agreement.pdf');
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.workforceDocActionBtnText}>
                  {createStaffDocAgreement ? 'Replace File' : 'Browse Files'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Document 6: Educational Certificates */}
            <View style={styles.workforceDocItem}>
              <Text style={styles.workforceDocItemTitle}>Educational Certificates</Text>
              <Text style={styles.workforceDocItemSub}>Policy: optional</Text>
              <View style={styles.workforceDocPill}>
                <Text style={styles.workforceDocPillText}>Optional</Text>
              </View>
              <Text style={styles.workforceDocFileText}>
                {createStaffDocEducation || 'No file'}
              </Text>
              <Text style={styles.workforceDocVerificationLabel}>Verification</Text>
              <View style={styles.workforceDocVerificationPill}>
                <Text style={styles.workforceDocVerificationPillText}>
                  {createStaffDocEducation ? 'Pending verification' : 'Not submitted'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.workforceDocActionBtn}
                onPress={() => {
                  setCreateStaffDocEducation('degree_certificate.pdf');
                  Alert.alert('File Attached', 'Attached sample file: degree_certificate.pdf');
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.workforceDocActionBtnText}>
                  {createStaffDocEducation ? 'Replace File' : 'Browse Files'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Document 7: Experience Certificate */}
            <View style={styles.workforceDocItem}>
              <Text style={styles.workforceDocItemTitle}>Experience Certificate</Text>
              <Text style={styles.workforceDocItemSub}>Policy: optional</Text>
              <View style={styles.workforceDocPill}>
                <Text style={styles.workforceDocPillText}>Optional</Text>
              </View>
              <Text style={styles.workforceDocFileText}>
                {createStaffDocExperience || 'No file'}
              </Text>
              <Text style={styles.workforceDocVerificationLabel}>Verification</Text>
              <View style={styles.workforceDocVerificationPill}>
                <Text style={styles.workforceDocVerificationPillText}>
                  {createStaffDocExperience ? 'Pending verification' : 'Not submitted'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.workforceDocActionBtn}
                onPress={() => {
                  setCreateStaffDocExperience('experience_letter.pdf');
                  Alert.alert('File Attached', 'Attached sample file: experience_letter.pdf');
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.workforceDocActionBtnText}>
                  {createStaffDocExperience ? 'Replace File' : 'Browse Files'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Document 8: Other Supporting Documents (Screenshot 1) */}
            <View style={[styles.workforceDocItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.workforceDocItemTitle}>Other Supporting Documents</Text>
              <Text style={styles.workforceDocItemSub}>Policy: optional</Text>
              <View style={styles.workforceDocPill}>
                <Text style={styles.workforceDocPillText}>Optional</Text>
              </View>
              <Text style={styles.workforceDocFileText}>
                {createStaffDocOther || 'No file'}
              </Text>
              <Text style={styles.workforceDocVerificationLabel}>Verification</Text>
              <View style={styles.workforceDocVerificationPill}>
                <Text style={styles.workforceDocVerificationPillText}>
                  {createStaffDocOther ? 'Pending verification' : 'Not submitted'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.workforceDocActionBtn}
                onPress={() => {
                  setCreateStaffDocOther('supporting_document.pdf');
                  Alert.alert('File Attached', 'Attached sample file: supporting_document.pdf');
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.workforceDocActionBtnText}>
                  {createStaffDocOther ? 'Replace File' : 'Browse Files'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Spacer before docked footer to allow full scroll view */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Docked Action Bar & Footer caption (Screenshots 1-5) */}
        <View style={styles.workforceDockedActionsContainer}>
          <View style={styles.workforceDockedActionsRow}>
            <TouchableOpacity
              style={styles.workforceCreatePrimaryBtn}
              onPress={handleCreateStaffAccount}
              activeOpacity={0.85}
            >
              <Text style={styles.workforceCreatePrimaryBtnText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.workforceCreateCancelBtn}
              onPress={() => {
                if (workforceReturnTab) {
                  setActiveTab(workforceReturnTab);
                  setWorkforceReturnTab(null);
                  setWorkforceSubScreen('dashboard');
                } else {
                  setWorkforceSubScreen('management');
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.workforceCreateCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderWorkforceAttendanceScreen = () => {
    const filteredStaff = workforceStaffList.filter((s) =>
      s.name.toLowerCase().includes(workforceSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(workforceSearch.toLowerCase())
    );

    return (
      <View style={styles.container}>
        {/* Header matching Screenshot 4 Left */}
        <View style={styles.workforceHeaderBanner}>
          <View style={styles.workforceHeaderTitleRow}>
            <TouchableOpacity
              style={styles.workforceBackBtn}
              onPress={() => setWorkforceSubScreen('dashboard')}
              activeOpacity={0.7}
            >
              <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.workforceHeaderTitle}>Staff Attendance</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 5 KPI Metric Cards */}
          <View style={styles.workforceKpiGrid}>
            <View style={styles.workforceKpiCard}>
              <Text style={styles.workforceKpiLabel}>TOTAL STAFF</Text>
              <Text style={styles.workforceKpiValue}>8</Text>
            </View>
            <View style={styles.workforceKpiCard}>
              <Text style={styles.workforceKpiLabel}>PRESENT</Text>
              <Text style={styles.workforceKpiValue}>7</Text>
            </View>
            <View style={styles.workforceKpiCard}>
              <Text style={styles.workforceKpiLabel}>ABSENT</Text>
              <Text style={styles.workforceKpiValue}>1</Text>
            </View>
            <View style={styles.workforceKpiCard}>
              <Text style={styles.workforceKpiLabel}>LEAVE</Text>
              <Text style={styles.workforceKpiValueSmall}>Not tracked</Text>
            </View>
            <View style={styles.workforceKpiCardFull}>
              <Text style={styles.workforceKpiLabel}>CORRECTIONS (14 Oct)</Text>
              <Text style={styles.workforceKpiValue}>1</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.workforceSearchWrapper}>
            <View style={styles.workforceSearchBox}>
              <SearchIcon size={18} color={adminColors.muted} />
              <TextInput
                style={styles.workforceSearchInput}
                placeholder="Search..."
                placeholderTextColor={adminColors.placeholder}
                value={workforceSearch}
                onChangeText={setWorkforceSearch}
              />
              <TouchableOpacity activeOpacity={0.7}>
                <FilterSlidersIcon size={18} color={adminColors.brand} />
              </TouchableOpacity>
            </View>
            <Text style={styles.workforceSubCountText}>11 admin · 14 warehouse staff · 7 drivers</Text>
          </View>

          {/* Attendance Cards List */}
          <View style={styles.workforceSection}>
            {filteredStaff.map((staff) => (
              <TouchableOpacity
                key={staff.id}
                style={[
                  styles.workforceCard,
                  staff.todayAttendance === 'Absent' && styles.workforceAttendanceCardError,
                ]}
                onPress={() => {
                  setSelectedStaffDetails(staff);
                  setWorkforceSubScreen('details');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.workforceCardRowBetween}>
                  <Text style={styles.workforceCardTitle}>{`${staff.name} · ${staff.id}`}</Text>
                  <View
                    style={
                      staff.todayAttendance === 'Present'
                        ? styles.workforcePresentBadge
                        : styles.workforceAbsentBadge
                    }
                  >
                    <Text
                      style={
                        staff.todayAttendance === 'Present'
                          ? styles.workforcePresentBadgeText
                          : styles.workforceAbsentBadgeText
                      }
                    >
                      {staff.todayAttendance}
                    </Text>
                  </View>
                </View>
                <Text style={styles.workforceCardSubtitle}>
                  {staff.attendanceNote || 'Check-in / check-out: not tracked'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  };

  const renderWorkforceDetailsScreen = () => {
    const staff = selectedStaffDetails || workforceStaffList[0];
    if (!staff) return null;

    return (
      <View style={styles.container}>
        {/* Header matching M14-S02b View Staff Details */}
        <View style={styles.workforceHeaderBanner}>
          <View style={styles.workforceDetailsHeaderRow}>
            <View style={styles.workforceDetailsHeaderLeft}>
              <TouchableOpacity
                style={styles.workforceBackBtn}
                onPress={() => setWorkforceSubScreen('dashboard')}
                activeOpacity={0.7}
              >
                <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.workforceHeaderTitle}>View Staff Details</Text>
            </View>
            <TouchableOpacity
              style={styles.workforceEditCircleBtn}
              onPress={() => setSelectedStaffProfileModal(staff)}
              activeOpacity={0.8}
            >
              <PencilWhiteIcon size={16} color={adminColors.onBrand} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={styles.workforceProfileCard}>
            <View style={styles.workforceProfileTopRow}>
              <View style={styles.workforceAvatarCircle}>
                <Text style={styles.workforceAvatarText}>
                  {staff.avatarInitials || staff.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.workforceProfileMeta}>
                <View style={styles.workforceProfileNameRow}>
                  <Text style={styles.workforceProfileName}>{staff.name}</Text>
                  <View style={staff.status === 'Active' ? styles.workforceActiveBadge : styles.workforcePendingBadge}>
                    <Text style={staff.status === 'Active' ? styles.workforceActiveBadgeText : styles.workforcePendingBadgeText}>
                      {staff.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.workforceProfileSub}>
                  {`${staff.employeeId || staff.id} · ${staff.role} · ${staff.workSection}`}
                </Text>
              </View>
            </View>

            <View style={styles.workforceProfileGrid}>
              <View style={styles.workforceProfileGridCol}>
                <Text style={styles.workforceGridLabel}>Role</Text>
                <Text style={styles.workforceGridValue}>{staff.role}</Text>

                <View style={{ height: 10 }} />

                <Text style={styles.workforceGridLabel}>Mobile</Text>
                <Text style={styles.workforceGridValue}>{staff.maskedMobile}</Text>
              </View>

              <View style={styles.workforceProfileGridCol}>
                <Text style={styles.workforceGridLabel}>Warehouse</Text>
                <Text style={styles.workforceGridValue}>{staff.warehouse}</Text>

                <View style={{ height: 10 }} />

                <Text style={styles.workforceGridLabel}>Email</Text>
                <Text style={styles.workforceGridValue}>{staff.email}</Text>
              </View>
            </View>
          </View>

          {/* 1. Personal & Contact Details */}
          <Text style={styles.workforceDetailsSectionHead}>Personal & Contact Details</Text>
          <View style={styles.workforceDetailsCard}>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Date of birth</Text>
              <Text style={styles.workforceDetailValue}>{staff.dateOfBirth || '12 Apr 1992'}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Gender</Text>
              <Text style={styles.workforceDetailValue}>{staff.gender || 'Male'}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Marital status</Text>
              <Text style={styles.workforceDetailValue}>{staff.maritalStatus || 'Not provided'}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Alternate mobile</Text>
              <Text style={styles.workforceDetailValue}>{staff.alternateMobile || 'Not provided'}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Current address</Text>
              <Text style={styles.workforceDetailValue}>{staff.currentAddress || 'Coonoor Road, Ooty, Tamil Nadu'}</Text>
            </View>
            <View style={[styles.workforceDetailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.workforceDetailLabel}>Mobile / email verified</Text>
              <Text style={styles.workforceDetailValue}>Not supported in this prototype</Text>
            </View>
          </View>

          {/* 2. ID Proof & Verification */}
          <Text style={styles.workforceDetailsSectionHead}>ID Proof & Verification</Text>
          <View style={styles.workforceDetailsCard}>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>ID type</Text>
              <Text style={styles.workforceDetailValue}>{staff.idType || 'Aadhaar'}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>ID number</Text>
              <Text style={styles.workforceDetailValue}>{staff.idNumber || 'XXXX XXXX 8842'}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Verification status</Text>
              <Text style={[styles.workforceDetailValue, { color: adminColors.success.text }]}>{staff.verificationStatus || 'Verified'}</Text>
            </View>
            <View style={[styles.workforceDetailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.workforceDetailLabel}>Verified by / date</Text>
              <Text style={styles.workforceDetailValue}>{staff.verifiedByDate || 'Demo TOHFA Admin · 2 Mar 2026'}</Text>
            </View>
          </View>
          <View style={styles.workforceDocActionsRow}>
            <TouchableOpacity
              style={styles.workforceDocBtnOutline}
              onPress={() => Alert.alert('Preview Document', `Displaying preview for ${staff.idType || 'Aadhaar'} verification document.`)}
              activeOpacity={0.7}
            >
              <Text style={styles.workforceDocBtnOutlineText}>Preview Document</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.workforceDocBtnDisabled}
              onPress={() => Alert.alert('Unauthorized', 'Your role does not have authorization to download documents.')}
              activeOpacity={0.7}
            >
              <Text style={styles.workforceDocBtnDisabledText}>Download (not authorized)</Text>
            </TouchableOpacity>
          </View>

          {/* 3. Bank Account Details */}
          <Text style={styles.workforceDetailsSectionHead}>Bank Account Details</Text>
          <View style={styles.workforceRestrictedBox}>
            <LockOutlineIcon size={24} color={adminColors.muted} />
            <Text style={styles.workforceRestrictedTitle}>Restricted</Text>
            <Text style={styles.workforceRestrictedDesc}>
              Your role does not have permission to view bank details.
            </Text>
          </View>

          {/* 4. Employment Details */}
          <Text style={styles.workforceDetailsSectionHead}>Employment Details</Text>
          <View style={styles.workforceDetailsCard}>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Employee ID</Text>
              <Text style={styles.workforceDetailValue}>{staff.employeeId || staff.id}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Date of joining</Text>
              <Text style={styles.workforceDetailValue}>{staff.joiningDate}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Employment type</Text>
              <Text style={styles.workforceDetailValue}>{staff.employmentType || 'Full-time'}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Department</Text>
              <Text style={styles.workforceDetailValue}>{staff.department || 'Warehouse Operations'}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Designation</Text>
              <Text style={styles.workforceDetailValue}>{staff.designation || 'Loading & Sorting Staff'}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Reporting manager</Text>
              <Text style={styles.workforceDetailValue}>{staff.reportingManager || 'Demo Sub Warehouse Admin'}</Text>
            </View>
            <View style={[styles.workforceDetailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.workforceDetailLabel}>Employment status</Text>
              <Text style={[styles.workforceDetailValue, { color: adminColors.success.text }]}>{staff.status}</Text>
            </View>
          </View>

          {/* 5. Role & Access */}
          <Text style={styles.workforceDetailsSectionHead}>Role & Access</Text>
          <View style={styles.workforceDetailsCard}>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Application role</Text>
              <Text style={styles.workforceDetailValue}>{staff.applicationRole || 'Warehouse Staff (no login)'}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Account status</Text>
              <Text style={styles.workforceDetailValue}>{staff.accountStatusText || 'No application access'}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Permissions summary</Text>
              <Text style={styles.workforceDetailValue}>{staff.permissionsSummary || 'From RBAC: none (no login)'}</Text>
            </View>
            <View style={[styles.workforceDetailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.workforceDetailLabel}>Last login</Text>
              <Text style={styles.workforceDetailValue}>{staff.lastLogin || 'Not applicable'}</Text>
            </View>
          </View>

          {/* 6. Warehouse Assignment */}
          <Text style={styles.workforceDetailsSectionHead}>Warehouse Assignment</Text>
          <View style={styles.workforceDetailsCard}>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Warehouse</Text>
              <Text style={styles.workforceDetailValue}>{staff.warehouseCode || `${staff.warehouse} (WH-MAIN)`}</Text>
            </View>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Location</Text>
              <Text style={styles.workforceDetailValue}>{staff.warehouseLocation || 'Ooty'}</Text>
            </View>
            <View style={[styles.workforceDetailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.workforceDetailLabel}>Work section</Text>
              <Text style={styles.workforceDetailValue}>{staff.workSection || 'Loading & Sorting'}</Text>
            </View>
          </View>

          {/* 7. Emergency Contact */}
          <Text style={styles.workforceDetailsSectionHead}>Emergency Contact</Text>
          <View style={styles.workforceDetailsCard}>
            <View style={styles.workforceDetailRow}>
              <Text style={styles.workforceDetailLabel}>Contact person</Text>
              <Text style={styles.workforceDetailValue}>{staff.emergencyContactName || 'Lakshmi (spouse)'}</Text>
            </View>
            <View style={[styles.workforceDetailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.workforceDetailLabel}>Primary number</Text>
              <Text style={styles.workforceDetailValue}>{staff.emergencyContactPhone || '••••• •1190'}</Text>
            </View>
          </View>

          {/* 8. Uploaded Documents */}
          <Text style={styles.workforceDetailsSectionHead}>Uploaded Documents</Text>
          {(staff.documents || [
            { name: 'Aadhaar Card', filename: 'aadhaar_scan.pdf · Uploaded 1 Mar 2026', status: 'Verified' as const },
            { name: 'Address Proof', filename: 'Illegible scan (demo reason) · Re-upload required', status: 'Rejected' as const },
            { name: 'Employment Agreement', filename: '', status: 'Not uploaded' as const },
          ]).map((doc, idx) => (
            <View
              key={idx}
              style={[
                styles.workforceDocCard,
                doc.status === 'Rejected' && styles.workforceDocCardRejected,
              ]}
            >
              <View style={styles.workforceDocCardHeader}>
                <Text style={styles.workforceDocCardTitle}>{doc.name}</Text>
                <View
                  style={
                    doc.status === 'Verified'
                      ? styles.workforceDocBadgeVerified
                      : doc.status === 'Rejected'
                        ? styles.workforceDocBadgeRejected
                        : styles.workforceDocBadgeNotUploaded
                  }
                >
                  <Text
                    style={
                      doc.status === 'Verified'
                        ? styles.workforceDocBadgeTextVerified
                        : doc.status === 'Rejected'
                          ? styles.workforceDocBadgeTextRejected
                          : styles.workforceDocBadgeTextNotUploaded
                    }
                  >
                    {doc.status}
                  </Text>
                </View>
              </View>
              {doc.filename ? (
                <Text style={styles.workforceDocCardSub}>{doc.filename}</Text>
              ) : null}
            </View>
          ))}

          {/* 9. Staff Activity & Audit History */}
          <Text style={styles.workforceDetailsSectionHead}>Staff Activity & Audit History</Text>
          <View style={styles.workforceTimelineCard}>
            {(staff.auditHistory || [
              { date: '1 Mar 2026, 09:00', actor: 'Demo Sub Warehouse Admin', action: 'Staff record created' },
              { date: '2 Mar 2026, 10:30', actor: 'Demo TOHFA Admin', action: 'ID proof verified' },
              { date: '10 Oct 2026, 11:00', actor: 'Demo Sub Warehouse Admin', action: 'Address proof rejected: illegible scan (demo)' },
            ]).map((item, idx, arr) => (
              <View key={idx}>
                <View style={styles.workforceTimelineItem}>
                  <Text style={styles.workforceTimelineMeta}>{`${item.date} · ${item.actor}`}</Text>
                  <Text style={styles.workforceTimelineAction}>{item.action}</Text>
                </View>
                {idx < arr.length - 1 && <View style={styles.workforceTimelineDivider} />}
              </View>
            ))}
          </View>

          {/* RBAC disclaimer */}
          <Text style={styles.workforceDisclaimerText}>
            All records shown are sample data for demonstration only. Sensitive fields stay masked and visibility follows the existing RBAC configuration.
          </Text>
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  };

  const renderStaffProfileModal = () => {
    if (!selectedStaffProfileModal) return null;
    const staff = selectedStaffProfileModal;

    return (
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSelectedStaffProfileModal(null);
          setShowStatusPicker(false);
        }}
      >
        <TouchableOpacity
          style={styles.workforceModalBackdrop}
          activeOpacity={1}
          onPress={() => {
            setSelectedStaffProfileModal(null);
            setShowStatusPicker(false);
          }}
        >
          <TouchableOpacity activeOpacity={1} style={styles.workforceModalCard}>
            {/* Header with Title, Status & Close Button */}
            <View style={styles.workforceModalHeaderRow}>
              <View style={styles.workforceModalHeaderLeft}>
                <View style={styles.workforceModalAvatarCircle}>
                  <Text style={styles.workforceModalAvatarText}>
                    {staff.avatarInitials || staff.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.workforceModalTitle}>{`Profile ${staff.employeeId || staff.id}`}</Text>
                    <View style={staff.status === 'Active' ? styles.workforceActiveBadge : styles.workforcePendingBadge}>
                      <Text style={staff.status === 'Active' ? styles.workforceActiveBadgeText : styles.workforcePendingBadgeText}>
                        {staff.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.workforceModalSubtitle} numberOfLines={1}>
                    {staff.name} · {staff.assignedRole || staff.role}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.workforceModalCloseBtn}
                onPress={() => {
                  setSelectedStaffProfileModal(null);
                  setShowStatusPicker(false);
                }}
                activeOpacity={0.7}
              >
                <ModalCloseIcon size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Structured Key-Value Details Card */}
              <View style={styles.workforceModalInfoCard}>
                <View style={styles.workforceModalRow}>
                  <Text style={styles.workforceModalRowLabel}>Staff ID</Text>
                  <Text style={styles.workforceModalRowValue}>{staff.id}</Text>
                </View>
                <View style={styles.workforceModalRow}>
                  <Text style={styles.workforceModalRowLabel}>Name</Text>
                  <Text style={styles.workforceModalRowValue}>{staff.name}</Text>
                </View>
                <View style={styles.workforceModalRow}>
                  <Text style={styles.workforceModalRowLabel}>Staff type</Text>
                  <Text style={styles.workforceModalRowValue}>{staff.type}</Text>
                </View>
                <View style={styles.workforceModalRow}>
                  <Text style={styles.workforceModalRowLabel}>Assigned role</Text>
                  <Text style={styles.workforceModalRowValue}>{staff.assignedRole || staff.role}</Text>
                </View>
                <View style={styles.workforceModalRow}>
                  <Text style={styles.workforceModalRowLabel}>Warehouse</Text>
                  <Text style={styles.workforceModalRowValue}>{staff.warehouse}</Text>
                </View>
                <View style={styles.workforceModalRow}>
                  <Text style={styles.workforceModalRowLabel}>Mobile</Text>
                  <Text style={styles.workforceModalRowValue}>{staff.mobile}</Text>
                </View>
                <View style={styles.workforceModalRow}>
                  <Text style={styles.workforceModalRowLabel}>Email</Text>
                  <Text style={styles.workforceModalRowValue}>{staff.email}</Text>
                </View>
                <View style={styles.workforceModalRow}>
                  <Text style={styles.workforceModalRowLabel}>Joining date</Text>
                  <Text style={styles.workforceModalRowValue}>{staff.joiningDate || 'Not tracked'}</Text>
                </View>
                <View style={styles.workforceModalRow}>
                  <Text style={styles.workforceModalRowLabel}>Work section</Text>
                  <Text style={styles.workforceModalRowValue}>{staff.workSection || 'Not assigned'}</Text>
                </View>
                <View style={styles.workforceModalRow}>
                  <Text style={styles.workforceModalRowLabel}>Account status</Text>
                  <View style={staff.status === 'Active' ? styles.workforceActiveBadge : styles.workforcePendingBadge}>
                    <Text style={staff.status === 'Active' ? styles.workforceActiveBadgeText : styles.workforcePendingBadgeText}>
                      {staff.status}
                    </Text>
                  </View>
                </View>
                <View style={[styles.workforceModalRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.workforceModalRowLabel}>Created</Text>
                  <Text style={styles.workforceModalRowValue}>{staff.createdText || 'By System'}</Text>
                </View>
              </View>

              {/* Correct this record Card */}
              <View style={styles.workforceModalCorrectionCard}>
                <Text style={styles.workforceModalSectionTitle}>Correct this record</Text>
                <Text style={styles.workforceModalSectionSub}>Select an updated status to correct this staff record.</Text>

                <View style={{ marginBottom: 4 }}>
                  <Text style={styles.workforceFormLabel}>New status <Text style={styles.requiredStar}>*</Text></Text>
                  <TouchableOpacity
                    style={styles.workforceModalSelect}
                    onPress={() => setShowStatusPicker(!showStatusPicker)}
                    activeOpacity={0.75}
                  >
                    <Text style={profileNewStatus ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                      {profileNewStatus || 'Select...'}
                    </Text>
                    <ChevronDownIcon size={16} color={adminColors.muted} />
                  </TouchableOpacity>
                </View>

                {showStatusPicker && (
                  <View style={[styles.filterDropdownList, { marginTop: 6, borderWidth: 1, borderColor: '#E5E7EB' }]}>
                    {['Present', 'Absent', 'Leave', 'Active', 'Inactive'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.filterDropdownItem,
                          profileNewStatus === st && styles.filterDropdownItemSelected,
                        ]}
                        onPress={() => {
                          setProfileNewStatus(st);
                          setShowStatusPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            profileNewStatus === st && styles.filterDropdownItemTextSelected,
                          ]}
                        >
                          {st}
                        </Text>
                        {profileNewStatus === st && <CheckmarkSmallIcon size={12} color={adminColors.brand} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Record history Card */}
              <View style={styles.workforceModalHistoryCard}>
                <View style={styles.workforceModalHistoryHeader}>
                  <ClockOutlineIcon size={14} color="#6B7280" />
                  <Text style={styles.workforceModalHistoryTitle}>Record history</Text>
                </View>
                <Text style={styles.workforceModalHistoryDate}>28 Mar 2026, 09:00 · System</Text>
                <Text style={styles.workforceModalHistoryText}>Account created: Super Admin</Text>
              </View>

              {/* Action Buttons: Save (Primary) & Close (Secondary) */}
              <View style={styles.workforceModalActionsRow}>
                <TouchableOpacity
                  style={styles.workforceModalSaveBtn}
                  onPress={handleSaveProfileCorrection}
                  activeOpacity={0.85}
                >
                  <Text style={styles.workforceModalSaveBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.workforceModalCancelBtn}
                  onPress={() => {
                    setSelectedStaffProfileModal(null);
                    setShowStatusPicker(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.workforceModalCancelBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };


  const renderGenericFormPickerModal = () => {
    if (!activeFormPicker) return null;
    return (
      <Modal
        visible={!!activeFormPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveFormPicker(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActiveFormPicker(null)}
        >
          <View style={[styles.datePickerModalContent, { maxHeight: 420 }]}>
            <Text style={styles.modalSheetTitle}>{activeFormPicker.title}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {activeFormPicker.options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.datePickerOption,
                    activeFormPicker.selected === opt && styles.datePickerOptionSelected,
                  ]}
                  onPress={() => {
                    activeFormPicker.onSelect(opt);
                    setActiveFormPicker(null);
                  }}
                >
                  <Text
                    style={[
                      styles.datePickerOptionText,
                      activeFormPicker.selected === opt && styles.datePickerOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.root, isBrandHeaderActive && { backgroundColor: adminColors.brand }]}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={[styles.container, isBrandHeaderActive && { backgroundColor: adminColors.canvas }]}>
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
        ) : dashboardSubScreen === 'scheduleAudit' ? (
          <AuditManagementScreen
            onBack={() => {
              setDashboardSubScreen(null);
              setActiveTab(auditReturnTab);
            }}
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
              setFarmersReturnTab('Home');
              setFarmersMainTab('farmers');
              setSelectedAdminFarmer(null);
              setSelectedAdminApplication(null);
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
              ) : dashboardSubScreen === 'support' ? (
                <AdminSupportScreen onBack={() => setDashboardSubScreen(null)} />
              ) : dashboardSubScreen === 'reportBuilder' ? (
                <ReportBuilderScreen onBack={() => setDashboardSubScreen(null)} />
              ) : dashboardSubScreen === 'pendingApplications' ? (
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
                ) : (
                  <AdminPendingApplicationsScreen
                    onBack={() => setDashboardSubScreen(null)}
                    onSelectApplication={() => {
                      const app = DEMO_APPLICATIONS.find(a => a.id === 'app-2026-0101') || DEMO_APPLICATIONS[0];
                      setSelectedAdminApplication(app ?? null);
                    }}
                  />
                )
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
                            setNotificationsReturnTab('Home');
                            setActiveTab('Notifications');
                          }}
                          activeOpacity={0.8}
                          accessibilityLabel="Notifications"
                        >
                          <BellHeaderIcon size={20} />
                          <View style={styles.notificationDot} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.headerIconButton}
                          onPress={() => {
                            setProfileReturnTab('Home');
                            setActiveTab('Profile');
                          }}
                          activeOpacity={0.8}
                          accessibilityLabel="Admin Profile"
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
                          icon={item.icon}
                          tone={item.tone ?? 'default'}
                          titlePosition="bottom"
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
                      style={styles.toggleActionsButton}
                      onPress={() => setShowAllActions((prev) => !prev)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.toggleActionsText}>
                        {showAllActions ? 'Show few actions' : 'Show more actions'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 7. Operations Summary Section */}
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionHeading}>Operations summary</Text>
                      <TouchableOpacity
                        onPress={() => setActiveTab('Inventory')}
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
                        {task.detail ? <Text style={styles.workQueueTaskDetail}>{task.detail}</Text> : null}
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

                <View style={{ height: adminSpacing.xxl }} />
              </ScrollView>
            )}

            {/* ══════════════════════════════════════════════════════════════════════
            INVENTORY / OPERATIONS TAB
           ══════════════════════════════════════════════════════════════════════ */}
            {(activeTab === 'Inventory' || activeTab === 'Operations') && (
              operationsSubScreen === 'stockLedger' ? (
                <StockLedgerBatchesScreen
                  onBack={handleOperationsBack}
                />
              ) : operationsSubScreen === 'stockVerification' ? (
                <StockVerificationScreen
                  onBack={handleOperationsBack}
                />
              ) : operationsSubScreen === 'transfers' ? (
                <InterWarehouseTransfersScreen
                  onBack={handleOperationsBack}
                />
              ) : operationsSubScreen === 'addWarehouse' ? (
                <AddWarehouseProfileScreen
                  onBack={handleOperationsBack}
                  onSuccess={handleOperationsBack}
                />
              ) : (
                <AdminOperationsOverviewScreen
                  initialViewMode="warehouses"
                  onBack={() => setActiveTab('Home')}
                  onExportReports={() => {
                    Alert.alert('Export Reports', 'Reports exported successfully in PDF and Excel formats.');
                  }}
                  onNavigateToStockLedger={() => setOperationsSubScreen('stockLedger')}
                  onNavigateToStockVerification={() => setOperationsSubScreen('stockVerification')}
                  onNavigateToTransfers={() => setOperationsSubScreen('transfers')}
                  onPlusAction={() => setOperationsSubScreen('addWarehouse')}
                  onSelectWarehouse={() => setOperationsSubScreen('addWarehouse')}
                  onNavigateToFarmers={() => {
                    setFarmersReturnTab(activeTab === 'Inventory' ? 'Inventory' : 'Operations');
                    setFarmersMainTab('farmers');
                    setSelectedAdminFarmer(null);
                    setSelectedAdminApplication(null);
                    setActiveTab('Farmers');
                  }}
                  onNavigateToApplications={() => {
                    setFarmersReturnTab(activeTab === 'Inventory' ? 'Inventory' : 'Operations');
                    setFarmersMainTab('applications');
                    setSelectedAdminFarmer(null);
                    setSelectedAdminApplication(null);
                    setActiveTab('Farmers');
                  }}
                  onNavigateToProduce={() => setProduceControlScreen('calendar')}
                />
              )
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
                  initialTab={farmersMainTab}
                  onBack={() => setActiveTab(farmersReturnTab)}
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
            FINANCE TAB (Accounts & Finance Dashboard)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Finance' && (
          financeSubScreen === 'purchaseSales' ? (
            <PurchaseSalesOrdersScreen
              onBack={handleFinanceBack}
            />
          ) : financeSubScreen === 'duesPayouts' ? (
            <PurchaseDuesPayoutsScreen
              onBack={handleFinanceBack}
            />
          ) : financeSubScreen === 'salesIncome' ? (
            <SalesIncomeRevenueScreen
              onBack={handleFinanceBack}
            />
          ) : financeSubScreen === 'expenses' ? (
            <ExpenseManagementScreen
              onBack={handleFinanceBack}
            />
          ) : financeSubScreen === 'invoicesGst' ? (
            <InvoicesGstBillingScreen
              onBack={handleFinanceBack}
            />
          ) : financeSubScreen === 'reviewReturns' ? (
            <ReturnsRmaRefundsScreen
              onBack={handleFinanceBack}
            />
          ) : financeSubScreen === 'transactionHistory' ? (
            <TransactionHistoryScreen
              onBack={handleFinanceBack}
            />
          ) : financeSubScreen === 'customerWallet' ? (
            <CustomerWalletOverviewScreen
              onBack={handleFinanceBack}
            />
          ) : financeSubScreen === 'reportExport' ? (
            <ReportsExportScreen
              onBack={handleFinanceBack}
            />
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.accountsFinanceScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Header Banner */}
              <View style={styles.accountsFinanceHeaderBanner}>
                <View style={styles.accountsFinanceHeaderTopRow}>
                  <View style={styles.accountsFinanceHeaderTitleGroup}>
                    <TouchableOpacity
                      style={styles.accountsFinanceBackBtn}
                      onPress={() => {
                        setActiveTab(financeReturnTab || 'Home');
                        setFinanceReturnTab(null);
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Go back to Home"
                    >
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M19 12H5M12 19l-7-7 7-7"
                          stroke={adminColors.onBrand}
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </TouchableOpacity>
                    <BankBuildingWhiteIcon size={24} color={adminColors.onBrand} />
                    <Text style={styles.accountsFinanceHeaderTitle}>Accounts & Finance</Text>
                  </View>
                  <View style={styles.accountsFinanceHeaderActionsRow}>
                    <TouchableOpacity
                      style={styles.accountsFinanceHeaderPillBtn}
                      onPress={() => setShowFinanceFilterModal(true)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Filter accounts and finance"
                    >
                      <FilterSlidersIcon size={18} color={adminColors.onBrand} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.accountsFinanceHeaderPillBtn}
                      onPress={handleExportFinanceReport}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Download finance report"
                    >
                      <DownloadWhiteIcon size={18} color={adminColors.onBrand} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.accountsFinanceHeaderSubtitle}>Last 30 Days</Text>
              </View>

              {/* 2. Subheader */}
              <View style={styles.accountsFinanceSubheaderRow}>
                <Text style={styles.accountsFinanceLastUpdated}>Last updated 14 Oct 2026, 06:00</Text>
              </View>

              {/* 3. 8 KPI Cards (Reusing OverviewDashboardCard component strictly as requested) */}
              <OverviewCardsGrid style={{ paddingHorizontal: adminSpacing.md, rowGap: 10 }}>
                <OverviewDashboardCard
                  title="Sales"
                  value="₹2,14,600.00"
                  icon="sales"
                />
                <OverviewDashboardCard
                  title="Farmer Purchase Value"
                  value="₹1,38,900.00"
                  icon="truck"
                />
                <OverviewDashboardCard
                  title="Outstanding Dues"
                  value="₹32,450.00"
                  icon="orders"
                />
                <OverviewDashboardCard
                  title="Expenses"
                  value="₹18,200.00"
                  icon="cash"
                />
                <OverviewDashboardCard
                  title="Wallet Liability"
                  value="₹9,340.00"
                  icon="wallet"
                />
                <OverviewDashboardCard
                  title="Pending Payouts"
                  value="6"
                  icon="pickup"
                />
                <OverviewDashboardCard
                  title="Refunds"
                  value="₹1,840.00"
                  icon="alert"
                />
                <OverviewDashboardCard
                  title="Net Financial Summary"
                  value="Not defined"
                  icon="clipboard"
                />
              </OverviewCardsGrid>

              {/* 5. Revenue, expense & purchase (daily) */}
              <View style={styles.financeSectionBlock}>
                <Text style={styles.financeSectionHeading}>Revenue, expense & purchase (daily)</Text>

                <View style={styles.financeProgressRow}>
                  <Text style={styles.financeProgressLabel}>Revenue</Text>
                  <View style={styles.financeProgressBarTrack}>
                    <View style={[styles.financeProgressBarFill, { width: '85%', backgroundColor: '#2E8B57' }]} />
                  </View>
                  <Text style={styles.financeProgressValue}>₹2,14,600</Text>
                </View>

                <View style={styles.financeProgressRow}>
                  <Text style={styles.financeProgressLabel}>Purchase</Text>
                  <View style={styles.financeProgressBarTrack}>
                    <View style={[styles.financeProgressBarFill, { width: '55%', backgroundColor: adminColors.brand }]} />
                  </View>
                  <Text style={styles.financeProgressValue}>₹1,38,900</Text>
                </View>

                <View style={styles.financeProgressRow}>
                  <Text style={styles.financeProgressLabel}>Expense</Text>
                  <View style={styles.financeProgressBarTrack}>
                    <View style={[styles.financeProgressBarFill, { width: '15%', backgroundColor: '#D97706' }]} />
                  </View>
                  <Text style={styles.financeProgressValue}>₹18,200</Text>
                </View>
              </View>

              {/* 6. Payment status (statuses the records carry) */}
              <View style={styles.financeSectionBlock}>
                <Text style={styles.financeSectionHeading}>Payment status (statuses the records carry)</Text>

                <View style={styles.financeProgressRow}>
                  <Text style={styles.financeProgressLabel}>Collected</Text>
                  <View style={styles.financeProgressBarTrack}>
                    <View style={[styles.financeProgressBarFill, { width: '82%', backgroundColor: '#2E8B57' }]} />
                  </View>
                  <Text style={styles.financeProgressValue}>18</Text>
                </View>

                <View style={styles.financeProgressRow}>
                  <Text style={styles.financeProgressLabel}>Pending</Text>
                  <View style={styles.financeProgressBarTrack}>
                    <View style={[styles.financeProgressBarFill, { width: '23%', backgroundColor: '#D97706' }]} />
                  </View>
                  <Text style={styles.financeProgressValue}>5</Text>
                </View>

                <View style={styles.financeProgressRow}>
                  <Text style={styles.financeProgressLabel}>Failed</Text>
                  <View style={styles.financeProgressBarTrack}>
                    <View style={[styles.financeProgressBarFill, { width: '6%', backgroundColor: '#DC2626' }]} />
                  </View>
                  <Text style={styles.financeProgressValue}>1</Text>
                </View>
              </View>

              {/* 7. By warehouse */}
              <View style={styles.financeSectionBlock}>
                <Text style={styles.financeSectionHeading}>By warehouse</Text>
                <View style={styles.financeWarehouseCard}>
                  <View style={styles.financeWarehouseRow}>
                    <Text style={styles.financeWarehouseName}>Main Warehouse, Ooty</Text>
                    <Text style={styles.financeWarehouseValue}>₹1,20,400.00</Text>
                  </View>
                  <View style={styles.financeCardDivider} />
                  <View style={styles.financeWarehouseRow}>
                    <Text style={styles.financeWarehouseName}>Coonoor</Text>
                    <Text style={styles.financeWarehouseValue}>₹58,200.00</Text>
                  </View>
                  <View style={styles.financeCardDivider} />
                  <View style={styles.financeWarehouseRow}>
                    <Text style={styles.financeWarehouseName}>Kotagiri / Gudalur</Text>
                    <Text style={styles.financeWarehouseValue}>₹36,000.00</Text>
                  </View>
                </View>
              </View>

              {/* 8. Recent transactions */}
              <View style={styles.financeSectionBlock}>
                <Text style={styles.financeSectionHeading}>Recent transactions</Text>

                <View style={styles.financeTxnCard}>
                  <View style={styles.financeTxnHeaderRow}>
                    <Text style={styles.financeTxnTitle}>SO-0013 · Sale</Text>
                    <View style={[styles.financeStatusBadge, { backgroundColor: '#D1F2DE' }]}>
                      <Text style={[styles.financeStatusBadgeText, { color: '#15803D' }]}>Collected</Text>
                    </View>
                  </View>
                  <Text style={styles.financeTxnSubtext}>₹12,560.00 · Nilgiri Fresh Traders · 1 Oct 2026</Text>
                </View>

                <View style={styles.financeTxnCard}>
                  <View style={styles.financeTxnHeaderRow}>
                    <Text style={styles.financeTxnTitle}>PY-0005 · Payout</Text>
                    <View style={[styles.financeStatusBadge, { backgroundColor: '#FDE8E8' }]}>
                      <Text style={[styles.financeStatusBadgeText, { color: '#DC2626' }]}>Failed</Text>
                    </View>
                  </View>
                  <Text style={styles.financeTxnSubtext}>₹3,300.00 · Kumar · 6 Oct 2026</Text>
                </View>
              </View>

              {/* 9. Go to Section (RBAC Action Cards Grid) */}
              <View style={styles.financeSectionBlock}>
                <Text style={styles.financeSectionHeading}>Go to</Text>
                <View style={styles.financeGoToGrid}>
                  <TouchableOpacity
                    style={styles.financeGoToCard}
                    onPress={() => handleGoToItem('purchase_sales')}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Purchase & Sales"
                  >
                    <GoToPurchaseSalesIcon size={24} color={adminColors.brand} />
                    <Text style={styles.financeGoToCardTitle}>Purchase & Sales</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.financeGoToCard}
                    onPress={() => handleGoToItem('dues_payouts')}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Dues & Payouts"
                  >
                    <GoToDuesPayoutsIcon size={24} color={adminColors.brand} />
                    <Text style={styles.financeGoToCardTitle}>Dues & Payouts</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.financeGoToCard}
                    onPress={() => handleGoToItem('sales_income')}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Sales Income & Revenue"
                  >
                    <GoToSalesIncomeIcon size={24} color={adminColors.brand} />
                    <Text style={styles.financeGoToCardTitle}>Sales Income & Revenue</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.financeGoToCard}
                    onPress={() => handleGoToItem('expenses')}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Expenses"
                  >
                    <GoToExpensesIcon size={24} color={adminColors.brand} />
                    <Text style={styles.financeGoToCardTitle}>Expenses</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.financeGoToCard}
                    onPress={() => handleGoToItem('customer_wallet')}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Customer Wallet"
                  >
                    <GoToCustomerWalletIcon size={24} color={adminColors.brand} />
                    <Text style={styles.financeGoToCardTitle}>Customer Wallet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.financeGoToCard}
                    onPress={() => handleGoToItem('create_view_invoice')}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Create or View Invoice"
                  >
                    <GoToInvoiceIcon size={24} color={adminColors.brand} />
                    <Text style={styles.financeGoToCardTitle}>Create or View Invoice</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.financeGoToCard}
                    onPress={() => handleGoToItem('review_returns')}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Review Returns"
                  >
                    <GoToReviewReturnsIcon size={24} color={adminColors.brand} />
                    <Text style={styles.financeGoToCardTitle}>Review Returns</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.financeGoToCard}
                    onPress={() => handleGoToItem('transaction_history')}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="History"
                  >
                    <GoToTransactionHistoryIcon size={24} color={adminColors.brand} />
                    <Text style={styles.financeGoToCardTitle}>History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.financeGoToCard}
                    onPress={() => handleGoToItem('report_export')}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Report & Export"
                  >
                    <GoToReportExportIcon size={24} color={adminColors.brand} />
                    <Text style={styles.financeGoToCardTitle}>Report & Export</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ height: adminSpacing.xxl }} />
            </ScrollView>
          )
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
          customerScreen === 'management' ? (
            <CustomersManagementScreen
              onBack={() => setCustomerScreen(null)}
              onOpenDirectory={() => setCustomerScreen('directory')}
              onOpenGstBusiness={() => setCustomerScreen('gst_business')}
            />
          ) : customerScreen === 'directory' ? (
            <CustomerDirectoryScreen
              onBack={() => setCustomerScreen('management')}
              onSelectCustomer={(cust) => {
                setSelectedCustomer(cust);
                setCustomerScreen('customer_detail');
              }}
              onAddNewCustomer={() => setCustomerScreen('add_customer')}
            />
          ) : customerScreen === 'add_customer' ? (
            <AddCustomerScreen
              onBack={() => setCustomerScreen('directory')}
              onSaveCustomer={(newCust) => {
                CUSTOMERS_DATA.unshift(newCust);
                setCustomerScreen('directory');
              }}
            />
          ) : customerScreen === 'customer_detail' ? (
            <CustomerDetailScreen
              customer={selectedCustomer}
              onBack={() => setCustomerScreen('directory')}
            />
          ) : customerScreen === 'gst_business' ? (
            <GstBusinessScreen
              onBack={() => setCustomerScreen('management')}
              onSelectBusiness={(biz) => {
                setSelectedGstBusiness(biz);
                setCustomerScreen('gst_business_detail');
              }}
            />
          ) : customerScreen === 'gst_business_detail' ? (
            <GstBusinessDetailScreen
              business={selectedGstBusiness}
              onBack={() => setCustomerScreen('gst_business')}
            />
          ) : produceControlScreen === 'calendar' ? (
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
              onBack={() => {
                setInputsPestScreen(null);
                if (inputsPestReturnTab) {
                  setActiveTab(inputsPestReturnTab);
                  setInputsPestReturnTab(null);
                }
              }}
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
          ) : communitySubScreen === 'create_content' ? (
            <CreateContentScreen
              initialType={createContentInitialType}
              initialData={createContentInitialData}
              onBack={() => setCommunitySubScreen('home')}
              onSubmitSuccess={() => {
                setArticleNavOrigin('content_pending_review');
                setCommunitySubScreen('content_pending_review');
              }}
              onNavigateAddVideo={() => setCommunitySubScreen('add_video')}
            />
          ) : communitySubScreen === 'create_group' ? (
            <CreateGroupScreen
              onBack={() => setCommunitySubScreen(groupNavOrigin === 'all_groups' ? 'all_groups' : 'home')}
              onSubmitSuccess={() => setCommunitySubScreen(groupNavOrigin === 'all_groups' ? 'all_groups' : 'home')}
            />
          ) : communitySubScreen === 'create_community' ? (
            <CreateCommunityScreen
              onBack={() => setCommunitySubScreen(communityNavOrigin === 'all_communities' ? 'all_communities' : 'home')}
              onSubmitSuccess={() => setCommunitySubScreen(communityNavOrigin === 'all_communities' ? 'all_communities' : 'home')}
            />
          ) : communitySubScreen === 'add_video' ? (
            <AddVideoScreen
              onBack={() => setCommunitySubScreen('home')}
              onSubmitSuccess={() => {
                setArticleNavOrigin('content_pending_review');
                setCommunitySubScreen('content_pending_review');
              }}
            />
          ) : communitySubScreen === 'community_details' ? (
            <CommunityDetailsScreen
              communityId={selectedCommunityId}
              onBack={() => setCommunitySubScreen(communityNavOrigin === 'all_communities' ? 'all_communities' : 'home')}
              onNavigateKnowledgeDetail={() => setCommunitySubScreen('article_details')}
            />
          ) : communitySubScreen === 'all_communities' ? (
            <CommunitiesListScreen
              onBack={() => setCommunitySubScreen('home')}
              onSelectCommunity={(commId) => {
                setCommunityNavOrigin('all_communities');
                if (commId) setSelectedCommunityId(commId);
                setCommunitySubScreen('community_details');
              }}
              onNavigateCreateCommunity={() => {
                setCommunityNavOrigin('all_communities');
                setCommunitySubScreen('create_community');
              }}
            />
          ) : communitySubScreen === 'all_groups' ? (
            <GroupsListScreen
              onBack={() => setCommunitySubScreen('home')}
              onSelectGroup={() => {
                setGroupNavOrigin('all_groups');
                setCommunitySubScreen('create_group');
              }}
              onNavigateCreateGroup={() => {
                setGroupNavOrigin('all_groups');
                setCommunitySubScreen('create_group');
              }}
            />
          ) : communitySubScreen === 'article_details' ? (
            <ArticleDetailsScreen
              onBack={() => setCommunitySubScreen(articleNavOrigin === 'home' ? 'home' : articleNavOrigin === 'content_pending_review' ? 'content_pending_review' : 'content_item_detail')}
              onOpenChatThread={() => setCommunitySubScreen('qa_chat')}
              onOpenContentDetails={() => setCommunitySubScreen('content_item_detail')}
            />
          ) : communitySubScreen === 'content_pending_review' ? (
            <ContentPendingReviewScreen
              onBack={() => setCommunitySubScreen('create_content')}
              onNavigateEditContent={() => {
                setCreateContentInitialData(resumedMulchingData);
                setCommunitySubScreen('create_content');
              }}
              onPublishSuccess={() => {
                setCommunitySubScreen('knowledge_library');
              }}
            />
          ) : communitySubScreen === 'content_item_detail' ? (
            <ContentItemDetailScreen
              onBack={() => setCommunitySubScreen('knowledge_library')}
              onNavigateChat={() => {
                setArticleNavOrigin('content_item_detail');
                setCommunitySubScreen('article_details');
              }}
              onNavigateMessages={() => {
                setArticleNavOrigin('content_item_detail');
                setCommunitySubScreen('article_details');
              }}
              onNavigateEditContent={() => {
                setCreateContentInitialData(resumedMulchingData);
                setCommunitySubScreen('create_content');
              }}
            />
          ) : communitySubScreen === 'qa_chat' ? (
            <QuestionAnswerChatScreen
              onBack={() => setCommunitySubScreen('article_details')}
            />
          ) : communitySubScreen === 'knowledge_library' ? (
            <KnowledgeLibraryScreen
              onBack={() => setCommunitySubScreen('home')}
              onSelectItem={(_item) => {
                setArticleNavOrigin('content_item_detail');
                setCommunitySubScreen('content_item_detail');
              }}
              onNavigateAddVideo={() => setCommunitySubScreen('add_video')}
              onNavigateCreateContent={() => {
                setCreateContentInitialData(undefined);
                setCommunitySubScreen('create_content');
              }}
            />
          ) : communitySubScreen === 'home' ? (
            <CommunityKnowledgeHomeScreen
              onBack={() => setCommunitySubScreen(null)}
              onNavigateCreateContent={(type) => {
                setCreateContentInitialData(undefined);
                setCreateContentInitialType(type || 'Article');
                setCommunitySubScreen('create_content');
              }}
              onNavigateAddVideo={() => setCommunitySubScreen('add_video')}
              onNavigateKnowledgeLibrary={() => setCommunitySubScreen('knowledge_library')}
              onNavigateCommunityDetails={(commId) => {
                setCommunityNavOrigin('home');
                if (commId) setSelectedCommunityId(commId);
                setCommunitySubScreen('community_details');
              }}
              onNavigateAllCommunities={() => setCommunitySubScreen('all_communities')}
              onNavigateCreateGroup={() => {
                setGroupNavOrigin('home');
                setCommunitySubScreen('create_group');
              }}
              onNavigateAllGroups={() => setCommunitySubScreen('all_groups')}
              onNavigateCreateCommunity={() => {
                setCommunityNavOrigin('home');
                setCommunitySubScreen('create_community');
              }}
              onViewActivityDetails={() => {
                setArticleNavOrigin('home');
                setCommunitySubScreen('article_details');
              }}
            />
          ) : workforceActive ? (
            workforceSubScreen === 'management' ? (
              renderWorkforceManagementScreen()
            ) : workforceSubScreen === 'create' ? (
              renderWorkforceCreateScreen()
            ) : workforceSubScreen === 'attendance' ? (
              renderWorkforceAttendanceScreen()
            ) : workforceSubScreen === 'details' ? (
              renderWorkforceDetailsScreen()
            ) : (
              renderWorkforceDashboardScreen()
            )
          ) : (
            <AdminMoreMenuScreen
              onBack={() => setActiveTab('Home')}
              onSelectOption={(optionId) => {
                if (optionId === 'farmers') {
                  setFarmersReturnTab('More');
                  setFarmersMainTab('farmers');
                  setSelectedAdminFarmer(null);
                  setSelectedAdminApplication(null);
                  if (onNavigate) onNavigate('AdminAllFarmers');
                  else setActiveTab('Farmers');
                } else if (optionId === 'produce') {
                  setProduceControlScreen('calendar');
                } else if (optionId === 'audit') {
                  handleOpenScheduleAudit('More');
                } else if (optionId === 'inputs') {
                  setInputsPestScreen('home');
                } else if (optionId === 'pricing') {
                  setPricingReturnTab('More');
                  setDashboardSubScreen('marketPricingHome');
                } else if (optionId === 'purchase_sales') {
                  setActiveTab('Finance');
                } else if (optionId === 'customers') {
                  setCustomerScreen('management');
                } else if (optionId === 'finance') {
                  setActiveTab('Finance');
                } else if (optionId === 'workforce') {
                  setWorkforceActive(true);
                  setWorkforceSubScreen('dashboard');
                } else if (optionId === 'notifications') {
                  setNotificationsReturnTab('More');
                  setActiveTab('Notifications');
                } else if (optionId === 'community') {
                  setCommunitySubScreen('home');
                } else if (optionId === 'settings') {
                  setActiveTab('Settings');
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
            SETTINGS TAB (Exact layout matching Farmer Admin Settings & Profile)
           ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'Settings' && (
              <TohfaAdminSettingsScreen
                onBack={() => setActiveTab('More')}
                onNavigateProfile={() => {
                  setProfileReturnTab('Settings');
                  setActiveTab('Profile');
                }}
                onNavigateHome={() => setActiveTab('Home')}
                onNavigateWorkQueue={() => setActiveTab('WorkQueue')}
                onNavigateInventory={() => setActiveTab('Inventory')}
                onNavigateFinance={() => setActiveTab('Finance')}
                onNavigateMore={() => setActiveTab('More')}
                onLogout={onSignOut ?? (() => onNavigate?.('Welcome'))}
              />
            )}

            {/* ══════════════════════════════════════════════════════════════════════
            PROFILE TAB (Exact layout matching Farmer Admin Profile, with TOHFA Admin data)
           ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'Profile' && (
              <TohfaAdminProfileScreen
                onSignOut={onSignOut ?? (() => onNavigate?.('Welcome'))}
                onBack={() => setActiveTab(profileReturnTab)}
              />
            )}

            {/* ══════════════════════════════════════════════════════════════════════
            NOTIFICATIONS TAB (Redirected to Farmer Admin Notifications Screen)
           ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'Notifications' && (
              <FarmerAdminNotificationsScreen
                onBack={() => setActiveTab(notificationsReturnTab)}
                onViewListing={() => {
                  setProduceControlScreen('calendar');
                  setActiveTab('More');
                }}
                onViewAudit={() => {
                  handleOpenScheduleAudit('More');
                }}
                onViewDispute={() => {
                  setActiveTab('More');
                }}
                onTabChange={(tab) => {
                  if (tab === 'Farmers') {
                    setActiveTab('Farmers');
                  } else if (tab === 'Produce') {
                    setProduceControlScreen('calendar');
                    setActiveTab('More');
                  } else if (tab === 'Audits') {
                    handleOpenScheduleAudit('More');
                  } else if (tab === 'More') {
                    setActiveTab('More');
                  } else {
                    setActiveTab('Home');
                  }
                }}
              />
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            WORKFORCE & STAFF TAB (Screenshots M14-S01, M14-S02, M14-S04)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Workforce' && (
          workforceSubScreen === 'management' ? (
            renderWorkforceManagementScreen()
          ) : workforceSubScreen === 'create' ? (
            renderWorkforceCreateScreen()
          ) : workforceSubScreen === 'attendance' ? (
            renderWorkforceAttendanceScreen()
          ) : workforceSubScreen === 'details' ? (
            renderWorkforceDetailsScreen()
          ) : (
            renderWorkforceDashboardScreen()
          )
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
        inputsPestScreen !== 'incident_detail' &&
        customerScreen !== 'directory' &&
        customerScreen !== 'customer_detail' &&
        customerScreen !== 'add_customer' &&
        customerScreen !== 'gst_business' &&
        customerScreen !== 'gst_business_detail' &&
        communitySubScreen !== 'create_content' &&
        communitySubScreen !== 'create_group' &&
        communitySubScreen !== 'create_community' &&
        communitySubScreen !== 'add_video' &&
        communitySubScreen !== 'community_details' &&
        communitySubScreen !== 'all_communities' &&
        communitySubScreen !== 'all_groups' &&
        communitySubScreen !== 'article_details' &&
        communitySubScreen !== 'content_item_detail' &&
        communitySubScreen !== 'qa_chat' &&
        communitySubScreen !== 'knowledge_library' &&
        activeTab !== 'Settings' &&
        activeTab !== 'Profile' &&
        activeTab !== 'Notifications' &&
        (!workforceActive || workforceSubScreen === 'dashboard') &&
        (activeTab !== 'Workforce' || workforceSubScreen === 'dashboard') && (
          <View style={styles.bottomNav}>
            {/* Tab 1: Home */}
            <TouchableOpacity
              style={styles.navTabItem}
              onPress={() => {
                setOperationsReturnTab(null);
                setWorkforceReturnTab(null);
                setFinanceReturnTab(null);
                setInputsPestReturnTab(null);
                setDashboardSubScreen(null);
                setProduceControlScreen(null);
                setInputsPestScreen(null);
                setCustomerScreen(null);
                setCommunitySubScreen(null);
                setOperationsSubScreen(null);
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
                setOperationsReturnTab(null);
                setWorkforceReturnTab(null);
                setFinanceReturnTab(null);
                setInputsPestReturnTab(null);
                setDashboardSubScreen(null);
                setProduceControlScreen(null);
                setInputsPestScreen(null);
                setCustomerScreen(null);
                setCommunitySubScreen(null);
                setOperationsSubScreen(null);
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

            {/* Tab 3: Inventory (formerly Operations) */}
            <TouchableOpacity
              style={styles.navTabItem}
              onPress={() => {
                setOperationsReturnTab(null);
                setWorkforceReturnTab(null);
                setFinanceReturnTab(null);
                setInputsPestReturnTab(null);
                setDashboardSubScreen(null);
                setProduceControlScreen(null);
                setInputsPestScreen(null);
                setCustomerScreen(null);
                setCommunitySubScreen(null);
                setOperationsSubScreen(null);
                setActiveTab('Inventory');
              }}
              activeOpacity={0.7}
            >
              <TabInventoryIcon
                color={
                  activeTab === 'Inventory' || activeTab === 'Operations'
                    ? adminColors.brand
                    : adminColors.muted
                }
              />
              <Text
                style={[
                  styles.navTabLabel,
                  (activeTab === 'Inventory' || activeTab === 'Operations') && styles.navTabLabelActive,
                ]}
              >
                Inventory
              </Text>
            </TouchableOpacity>

            {/* Tab 4: Finance */}
            <TouchableOpacity
              style={styles.navTabItem}
              onPress={() => {
                setOperationsReturnTab(null);
                setWorkforceReturnTab(null);
                setFinanceReturnTab(null);
                setInputsPestReturnTab(null);
                setDashboardSubScreen(null);
                setProduceControlScreen(null);
                setInputsPestScreen(null);
                setCustomerScreen(null);
                setCommunitySubScreen(null);
                setOperationsSubScreen(null);
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
                setOperationsReturnTab(null);
                setWorkforceReturnTab(null);
                setFinanceReturnTab(null);
                setInputsPestReturnTab(null);
                setDashboardSubScreen(null);
                setProduceControlScreen(null);
                setInputsPestScreen(null);
                setCustomerScreen(null);
                setCommunitySubScreen(null);
                setActiveTab('More');
              }}
              activeOpacity={0.7}
            >
              <TabMoreIcon
                color={
                  activeTab === 'More' ||
                    activeTab === 'Farmers' ||
                    activeTab === 'Reports' ||
                    (activeTab as string) === 'Profile' ||
                    activeTab === 'Workforce'
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
                    (activeTab as string) === 'Profile' ||
                    activeTab === 'Workforce') &&
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

      {renderStaffProfileModal()}
      {renderGenericFormPickerModal()}
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
    columnGap: 10,
    rowGap: 10,
    justifyContent: 'flex-start',
  },
  quickActionTile: {
    width: '31%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 104,
    ...adminShadow.sm,
  },
  quickActionIconBox: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTileLabel: {
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
    lineHeight: 15,
    fontWeight: '700',
  },
  toggleActionsButton: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  toggleActionsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
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
    marginTop: adminSpacing.md,
  },
  workQueueSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
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
    borderRadius: adminRadius.sm,
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
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  workQueueActionText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brand,
    fontSize: 13.5,
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

  screenFooterCode: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.xs,
  },

  // ─── Workforce & Staff Styles (Screenshots M14-S01, S02, S04, S02b) ─────────
  workforceHeaderBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 16,
  },
  workforceHeaderStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workforceHeaderStatusText: {
    color: adminColors.onBrand,
    fontSize: 13,
    fontWeight: '700',
  },
  workforceHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workforceHeaderTitle: {
    ...adminType.title,
    fontSize: 19,
    fontWeight: '800',
    color: adminColors.onBrand,
    marginLeft: 8,
  },
  workforceBackBtn: {
    padding: 4,
    marginRight: 6,
  },
  workforceOverviewGrid: {
    paddingHorizontal: 16,
    paddingTop: 16,
    rowGap: 12,
    columnGap: 10,
    marginBottom: 0,
  },
  workforceKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  workforceKpiCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  workforceKpiCardFull: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  workforceKpiLabel: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.muted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  workforceKpiValue: {
    ...adminType.kpiValue,
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceKpiValueSub: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.muted,
  },
  workforceKpiValueSmall: {
    ...adminType.kpiValue,
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
  },
  workforceSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  workforceSectionTitle: {
    ...adminType.sectionHead,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 12,
  },
  workforceBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  workforceBarRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  workforceBarLabel: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
    width: 110,
  },
  workforceBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: adminColors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  workforceBarFillOrange: {
    height: 8,
    backgroundColor: adminColors.brand,
    borderRadius: 4,
  },
  workforceBarFillGreen: {
    height: 8,
    backgroundColor: adminColors.success.text,
    borderRadius: 4,
  },
  workforceBarFillRed: {
    height: 8,
    backgroundColor: adminColors.danger.text,
    borderRadius: 4,
  },
  workforceBarCount: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.ink,
    width: 24,
    textAlign: 'right',
  },
  workforceSearchWrapper: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  workforceSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 44,
    paddingHorizontal: 12,
  },
  workforceSearchInput: {
    flex: 1,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
    marginLeft: 8,
    paddingVertical: 0,
  },
  workforceSubCountText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.brandDeep,
    marginTop: 10,
  },
  workforceCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginTop: 10,
    ...adminShadow.sm,
  },
  workforceCardRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workforceCardTitle: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceCardSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 4,
    lineHeight: 16,
  },
  workforceCardSubtitleBold: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.muted,
    marginTop: 2,
  },
  workforceCardSubtitleMuted: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  workforceViewAllLink: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.brand,
  },
  workforceCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  workforceActionEdit: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brand,
    marginRight: 20,
  },
  workforceActionDeactivate: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  workforceActionActivate: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brand,
  },
  workforceActiveBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  workforceActiveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.success.text,
  },
  workforcePendingBadge: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  workforcePendingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.warning.text,
  },
  workforcePresentBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  workforcePresentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.success.text,
  },
  workforceAbsentBadge: {
    backgroundColor: adminColors.danger.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  workforceAbsentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  workforceQuickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  workforceQuickActionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  workforceQuickActionLabel: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 8,
  },
  workforceAttendanceCardError: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  workforceFormContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  workforceCreateScrollContent: {
    paddingTop: 14,
    paddingBottom: 110,
    paddingHorizontal: 14,
    backgroundColor: adminColors.canvas,
  },
  workforceCreateCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  workforceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workforceCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  workforceStepBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  workforceStepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brand,
  },
  workforceCardHeaderTextCol: {
    flex: 1,
  },
  workforceCreateCardTitle: {
    ...adminType.body,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceCreateCardSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
  workforceCardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginTop: 12,
    marginBottom: 16,
  },
  workforceFormField: {
    marginBottom: 14,
  },
  workforceFormLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  workforceFormLabel: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  workforceOptionalText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginLeft: 6,
    marginBottom: 6,
  },
  requiredStar: {
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  workforcePhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 6,
  },
  workforcePhotoPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  workforcePhotoPlaceholderQuestion: {
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  workforceUploadPhotoBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  workforceUploadPhotoBtnText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  workforceFormInput: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
  },
  workforceFormMultiline: {
    height: 74,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  workforceInputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  workforceInputEmbedded: {
    flex: 1,
    height: 44,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
    padding: 0,
  },
  workforceFormSelect: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workforceFormSelectText: {
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
  },
  workforceFormSelectPlaceholder: {
    ...adminType.body,
    fontSize: 14,
    color: adminColors.muted,
  },
  workforceFormHelperText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
  },
  workforceInlineDropdownMenu: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 8,
    ...adminShadow.sm,
  },
  workforceInlineDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  workforceInlineDropdownItemGrey: {
    backgroundColor: adminColors.muted,
  },
  workforceInlineDropdownItemText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  workforceInlineDropdownItemTextWhite: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  workforceCheckboxBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: adminColors.canvas,
  },
  workforceCheckboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: adminColors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: adminColors.card,
  },
  workforceCheckboxSquareChecked: {
    backgroundColor: adminColors.canvas,
    borderColor: adminColors.ink,
  },
  workforceCheckboxBoxText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    flex: 1,
    fontWeight: '500',
  },
  workforceIdCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  workforceIdCalloutText: {
    flex: 1,
    fontSize: 12,
    color: adminColors.info.text,
    lineHeight: 17,
    fontWeight: '500',
  },
  workforceUploadDropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    borderRadius: 12,
    backgroundColor: adminColors.canvas,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  workforceUploadDropZoneTitle: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 10,
  },
  workforceUploadDropZoneSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 4,
    marginBottom: 12,
  },
  workforceBrowseFilesBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 8,
    backgroundColor: adminColors.card,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  workforceBrowseFilesBtnText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  workforceDockedActionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    ...adminShadow.md,
  },
  workforceDockedActionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  workforceCreatePrimaryBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceCreatePrimaryBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  workforceCreateCancelBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceCreateCancelBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  workforceFooterCaption: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  workforceRadioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    marginBottom: 10,
  },
  workforceRadioCardSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
    marginBottom: 10,
  },
  workforceRadioTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  workforceRadioTitle: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceRadioSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  workforceStaticInputBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  workforceStaticInputText: {
    ...adminType.body,
    fontSize: 14,
    color: adminColors.muted,
  },
  workforceAccountStatusBox: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  workforceAccountStatusTitle: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.warning.text,
  },
  workforceAccountStatusSub: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  workforceDocItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  workforceDocItemTitle: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceDocItemSub: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
    marginBottom: 6,
  },
  workforceDocPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: adminColors.canvas,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  workforceDocPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.muted,
  },
  workforceDocFileText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 6,
  },
  workforceDocVerificationLabel: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 3,
  },
  workforceDocVerificationPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: adminColors.canvas,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  workforceDocVerificationPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.muted,
  },
  workforceDocActionBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 8,
    backgroundColor: adminColors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  workforceDocActionBtnText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  workforceCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  workforceCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: adminColors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: adminColors.card,
  },
  workforceCheckboxChecked: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  workforceCheckboxLabel: {
    ...adminType.body,
    fontSize: 12,
    color: adminColors.ink,
    flex: 1,
  },
  workforceFormActionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  workforceBtnPrimary: {
    flex: 1,
    backgroundColor: adminColors.brand,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceBtnPrimaryText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  workforceBtnSecondary: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceBtnSecondaryText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceDockedPrimaryBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  workforceDockedPrimaryBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  workforceModalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  workforceModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: adminColors.card,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    maxHeight: '90%',
    ...adminShadow.lg,
  },
  workforceModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    marginBottom: 14,
  },
  workforceModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  workforceModalAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceModalAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brand,
  },
  workforceModalTitle: {
    ...adminType.title,
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceModalSubtitle: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 2,
  },
  workforceModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceModalInfoCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  workforceModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7.5,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  workforceModalRowLabel: {
    ...adminType.body,
    fontSize: 12,
    color: adminColors.muted,
    fontWeight: '500',
  },
  workforceModalRowValue: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    maxWidth: '65%',
    textAlign: 'right',
  },
  workforceModalCorrectionCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 12,
  },
  workforceModalSectionTitle: {
    ...adminType.sectionHead,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.brand,
    marginBottom: 4,
  },
  workforceModalSectionSub: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 10,
  },
  workforceModalSelect: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workforceModalHistoryCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    marginBottom: 16,
  },
  workforceModalHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  workforceModalHistoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  workforceModalHistoryDate: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
  },
  workforceModalHistoryText: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 2,
  },
  workforceModalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  workforceModalSaveBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  workforceModalSaveBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  workforceModalCancelBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceModalCancelBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  workforceModalFooterCaption: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },

  // ─── Workforce Details Screen Styles (M14-S02b) ───────────────────────────
  workforceDetailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workforceDetailsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workforceEditCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceProfileCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    ...adminShadow.sm,
  },
  workforceProfileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workforceAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workforceAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.brand,
  },
  workforceProfileMeta: {
    flex: 1,
  },
  workforceProfileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workforceProfileName: {
    ...adminType.body,
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceProfileSub: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 3,
  },
  workforceProfileGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  workforceProfileGridCol: {
    width: '48%',
  },
  workforceGridLabel: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 2,
  },
  workforceGridValue: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceDetailsSectionHead: {
    ...adminType.sectionHead,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 22,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  workforceDetailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginHorizontal: 16,
    ...adminShadow.sm,
  },
  workforceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
  },
  workforceDetailLabel: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.muted,
  },
  workforceDetailValue: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
    maxWidth: '65%',
    textAlign: 'right',
  },
  workforceDocActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  workforceDocBtnOutline: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceDocBtnOutlineText: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.brand,
  },
  workforceDocBtnDisabled: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceDocBtnDisabledText: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.muted,
  },
  workforceRestrictedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    borderRadius: 14,
    backgroundColor: adminColors.canvas,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 4,
  },
  workforceRestrictedTitle: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 8,
  },
  workforceRestrictedDesc: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  workforceDocCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  workforceDocCardRejected: {
    borderColor: adminColors.danger.text,
    borderWidth: 1.5,
  },
  workforceDocCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workforceDocCardTitle: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceDocCardSub: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 6,
  },
  workforceDocBadgeVerified: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  workforceDocBadgeTextVerified: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.success.text,
  },
  workforceDocBadgeRejected: {
    backgroundColor: adminColors.danger.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  workforceDocBadgeTextRejected: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  workforceDocBadgeNotUploaded: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  workforceDocBadgeTextNotUploaded: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.muted,
  },
  workforceTimelineCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginHorizontal: 16,
    ...adminShadow.sm,
  },
  workforceTimelineItem: {
    paddingVertical: 4,
  },
  workforceTimelineMeta: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 4,
  },
  workforceTimelineAction: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceTimelineDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    marginVertical: 10,
  },
  workforceDisclaimerText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    lineHeight: 16,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },

  // ── Accounts & Finance Screen Styles ──
  accountsFinanceScrollContent: {
    paddingBottom: adminSpacing.xxxl,
    backgroundColor: adminColors.canvas,
  },
  accountsFinanceHeaderBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: 8,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  accountsFinanceHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountsFinanceHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  accountsFinanceBackBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  accountsFinanceHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  accountsFinanceHeaderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountsFinanceHeaderPillBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountsFinanceHeaderSubtitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 10,
  },
  accountsFinanceSubheaderRow: {
    paddingHorizontal: adminSpacing.md,
    marginTop: 14,
    marginBottom: 10,
  },
  accountsFinanceLastUpdated: {
    fontSize: 12,
    color: adminColors.muted,
    fontWeight: '500',
  },
  financeKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    rowGap: 10,
  },
  financeKpiCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    minHeight: 88,
    ...adminShadow.sm,
  },
  financeKpiCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  financeKpiCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.3,
  },
  financeKpiCardValueMuted: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.muted,
  },
  financeDisclaimerText: {
    paddingHorizontal: adminSpacing.md,
    fontSize: 11,
    lineHeight: 15,
    color: adminColors.muted,
    marginTop: 12,
    marginBottom: 8,
  },
  financeSectionBlock: {
    paddingHorizontal: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  financeSectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  financeProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  financeProgressLabel: {
    width: 72,
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.muted,
  },
  financeProgressBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#EBE7DF',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  financeProgressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  financeProgressValue: {
    width: 84,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  financeWarehouseCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...adminShadow.sm,
  },
  financeWarehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  financeWarehouseName: {
    fontSize: 13,
    color: adminColors.muted,
    fontWeight: '600',
  },
  financeWarehouseValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  financeCardDivider: {
    height: 1,
    backgroundColor: '#F0ECE4',
  },
  financeTxnCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  financeTxnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  financeTxnTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  financeStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  financeStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  financeTxnSubtext: {
    fontSize: 12,
    color: adminColors.muted,
  },
  financeGoToGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  financeGoToCard: {
    width: '48.5%',
    minHeight: 96,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 14,
    ...adminShadow.sm,
  },
  financeGoToCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 15,
  },

  financeScrollContent: {
    paddingBottom: adminSpacing.xxxl,
    backgroundColor: adminColors.canvas,
  },
  financeSection: {
    marginTop: adminSpacing.lg,
    paddingHorizontal: adminSpacing.md,
  },
  financeSubHeading: {
    ...adminType.sectionHead,
    fontSize: 16,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  financeCaptionNote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  financeSummaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  kpiTileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    justifyContent: 'space-between',
  },
  kpiTileItem: {
    width: '48%',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.sm,
    padding: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  kpiTileLabel: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 4,
  },
  kpiTileValue: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  financeMetricRow: {
    paddingVertical: adminSpacing.xs,
  },
  financeMetricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  financeMetricTitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  financeMetricValue: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  financeMetricSubtext: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },
  financeOutlineButton: {
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.sm,
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
});

