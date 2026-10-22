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
  | 'Profile'
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

  // Workforce & Staff State (Screenshots M14-S01, M14-S02, M14-S04, M14-S02b)
  const [workforceSubScreen, setWorkforceSubScreen] = useState<
    'dashboard' | 'management' | 'create' | 'attendance' | 'details'
  >('dashboard');
  const [workforceSearch, setWorkforceSearch] = useState('');
  const [selectedStaffDetails, setSelectedStaffDetails] = useState<WorkforceStaffItem | null>(null);
  const [workforceStaffList, setWorkforceStaffList] = useState<WorkforceStaffItem[]>([
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
      id: 'STF-0004',
      employeeId: 'STF-0004',
      name: 'Mahesh T',
      avatarInitials: 'MT',
      type: 'Staff',
      role: 'Loading & sorting',
      assignedRole: 'Warehouse staff',
      warehouse: 'Main Warehouse, Ooty',
      mobile: '+91 98451 00231',
      maskedMobile: 'Mobile ****** ·0231',
      email: 'mahesh.t@tohfa.com',
      joiningDate: '1 Mar 2026',
      workSection: 'Loading & sorting',
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
      emergencyContactName: 'Geetha (spouse)',
      emergencyContactPhone: '••••• •4431',
      documents: [
        { name: 'Aadhaar Card', filename: 'aadhaar_doc.pdf · Uploaded 1 Mar 2026', status: 'Verified' },
      ],
      auditHistory: [
        { date: '1 Mar 2026, 09:00', actor: 'Demo Sub Warehouse Admin', action: 'Staff record created' },
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
      maskedMobile: 'Mobile ****** ·0149',
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
      workSection: 'Loadman',
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
      designation: 'Loadman',
      reportingManager: 'Demo Sub Warehouse Admin',
      applicationRole: 'Warehouse Staff (no login)',
      accountStatusText: 'No application access',
      permissionsSummary: 'From RBAC: none (no login)',
      lastLogin: 'Not applicable',
      warehouseCode: 'Main Warehouse, Ooty (WH-MAIN)',
      warehouseLocation: 'Ooty',
      emergencyContactName: 'Mani S (brother)',
      emergencyContactPhone: '••••• •5512',
      documents: [
        { name: 'Aadhaar Card', filename: 'aadhaar_karthi.pdf · Uploaded 28 Mar 2026', status: 'Verified' },
      ],
      auditHistory: [
        { date: '28 Mar 2026, 09:00', actor: 'System', action: 'Staff record created' },
        { date: '14 Oct 2026, 10:15', actor: 'Demo TOHFA Admin', action: 'Attendance corrected to Absent' },
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
  const [createStaffRole, setCreateStaffRole] = useState('Warehouse Staff');
  const [createStaffEmploymentType, setCreateStaffEmploymentType] = useState('Select...');
  const [createStaffDepartment, setCreateStaffDepartment] = useState('Select...');
  const [createStaffDesignation, setCreateStaffDesignation] = useState('Select...');
  const [createStaffEmploymentStatus, setCreateStaffEmploymentStatus] = useState('Select...');
  const [createStaffSalaryDetails, setCreateStaffSalaryDetails] = useState('');
  const [createStaffWorkLocation, setCreateStaffWorkLocation] = useState('Select...');
  const [createStaffWarehouse, setCreateStaffWarehouse] = useState('Main Warehouse, Ooty (WH-MAIN)');
  const [createStaffWorkSection, setCreateStaffWorkSection] = useState('Loading & Sorting');
  const [createStaffManager, setCreateStaffManager] = useState('Demo Sub Warehouse Admin');
  const [createStaffJoiningDate, setCreateStaffJoiningDate] = useState('Today');

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
        setWorkforceSubScreen('dashboard');
        setActiveTab('Workforce');
      },
    },
  ];

  const displayedActions = showAllActions ? allQuickActions : allQuickActions.slice(0, 6);

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
    const filteredStaff = workforceStaffList.filter((s) =>
      s.name.toLowerCase().includes(workforceSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(workforceSearch.toLowerCase()) ||
      s.role.toLowerCase().includes(workforceSearch.toLowerCase())
    );

    return (
      <View style={styles.container}>
        {/* Header matching Screenshot 1 */}
        <View style={styles.workforceHeaderBanner}>
          <View style={styles.workforceHeaderTitleRow}>
            <WorkforceBadgeIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.workforceHeaderTitle}>Workforce & Staff</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 6 KPI Metric Cards Grid */}
          <View style={styles.workforceKpiGrid}>
            <View style={styles.workforceKpiCard}>
              <Text style={styles.workforceKpiLabel}>ADMIN STAFF</Text>
              <Text style={styles.workforceKpiValue}>11</Text>
            </View>
            <View style={styles.workforceKpiCard}>
              <Text style={styles.workforceKpiLabel}>WAREHOUSE STAFF</Text>
              <Text style={styles.workforceKpiValue}>14 <Text style={styles.workforceKpiValueSub}>(13 active)</Text></Text>
            </View>
            <View style={styles.workforceKpiCard}>
              <Text style={styles.workforceKpiLabel}>ACTIVE DRIVERS</Text>
              <Text style={styles.workforceKpiValue}>6 of 7</Text>
            </View>
            <View style={styles.workforceKpiCard}>
              <Text style={styles.workforceKpiLabel}>TODAY'S ATTENDANCE</Text>
              <Text style={styles.workforceKpiValue}>22 of 27</Text>
            </View>
            <View style={styles.workforceKpiCard}>
              <Text style={styles.workforceKpiLabel}>PENDING CORRECTIONS</Text>
              <Text style={styles.workforceKpiValueSmall}>Not configured</Text>
            </View>
            <View style={styles.workforceKpiCard}>
              <Text style={styles.workforceKpiLabel}>NEEDS ATTENTION</Text>
              <Text style={styles.workforceKpiValue}>2 pending{'\n'}activation</Text>
            </View>
          </View>

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
            <View style={styles.workforceBarRow}>
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
            <View style={styles.workforceBarRow}>
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
              <TouchableOpacity activeOpacity={0.7}>
                <FilterSlidersIcon size={18} color={adminColors.brand} />
              </TouchableOpacity>
            </View>
            <Text style={styles.workforceSubCountText}>11 admin · 14 warehouse staff · 7 drivers</Text>
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

          {/* Quick Actions Section (Screenshot 2) */}
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

          {/* Footer Code */}
          <Text style={styles.screenFooterCode}>M14-S01 · Dashboard & Directory</Text>
        </ScrollView>
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
              onPress={() => setWorkforceSubScreen('management')}
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
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Gender',
                    options: ['Select', 'Male', 'Female', 'Other'],
                    selected: createStaffGender,
                    onSelect: (val) => setCreateStaffGender(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffGender !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffGender}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            {/* Marital Status */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Marital Status</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Marital Status',
                    options: ['Select', 'Single', 'Married', 'Divorced', 'Widowed', 'Not provided'],
                    selected: createStaffMarital,
                    onSelect: (val) => setCreateStaffMarital(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffMarital !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffMarital}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
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
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Preferred Language',
                    options: ['Select', 'English', 'Tamil', 'Hindi', 'Malayalam', 'Kannada'],
                    selected: createStaffLanguage,
                    onSelect: (val) => setCreateStaffLanguage(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffLanguage !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffLanguage}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            {/* Blood Group */}
            <View style={styles.workforceFormField}>
              <Text style={styles.workforceFormLabel}>Blood Group</Text>
              <TouchableOpacity
                style={styles.workforceFormSelect}
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Blood Group',
                    options: ['Select', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
                    selected: createStaffBloodGroup,
                    onSelect: (val) => setCreateStaffBloodGroup(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffBloodGroup !== 'Select' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffBloodGroup}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
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
                  <RadioUnselectedIcon size={22} color="#9CA3AF" />
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
                  <RadioUnselectedIcon size={22} color="#9CA3AF" />
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
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Application Role',
                    options: [
                      'Select...',
                      'Warehouse Staff',
                      'Sub Warehouse Admin',
                      'Logistics Coordinator',
                      'Inventory Manager',
                      'TOHFA Admin',
                    ],
                    selected: createStaffApplicationRole,
                    onSelect: (val) => setCreateStaffApplicationRole(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffApplicationRole !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffApplicationRole}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
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
              <Text style={[styles.workforceFormHelperText, { color: '#1F69B8' }]}>Choose a role to see what it can do.</Text>
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
              CARD 8: 8  Emergency Contact (Screenshot 3)
             ══════════════════════════════════════════════════════════════════════ */}
          <View style={styles.workforceCreateCard}>
            <View style={styles.workforceCardHeader}>
              <View style={styles.workforceCardHeaderLeft}>
                <View style={styles.workforceStepBadge}>
                  <Text style={styles.workforceStepBadgeText}>8</Text>
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
                onPress={() =>
                  setActiveFormPicker({
                    title: 'Select Relationship',
                    options: ['Select...', 'Spouse', 'Parent', 'Sibling', 'Child', 'Relative', 'Friend', 'Other'],
                    selected: createStaffEmergencyRel,
                    onSelect: (val) => setCreateStaffEmergencyRel(val),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={createStaffEmergencyRel !== 'Select...' ? styles.workforceFormSelectText : styles.workforceFormSelectPlaceholder}>
                  {createStaffEmergencyRel}
                </Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
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
              CARD 9: 9  Document Uploads (Screenshots 3, 4 & 5)
             ══════════════════════════════════════════════════════════════════════ */}
          <View style={styles.workforceCreateCard}>
            <View style={styles.workforceCardHeader}>
              <View style={styles.workforceCardHeaderLeft}>
                <View style={styles.workforceStepBadge}>
                  <Text style={styles.workforceStepBadgeText}>9</Text>
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
              <PolicySliderIcon size={20} color="#1C4E75" />
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
              onPress={() => setWorkforceSubScreen('management')}
              activeOpacity={0.85}
            >
              <Text style={styles.workforceCreateCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.workforceFooterCaption}>M14-S02a· Create staff account</Text>
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

          {/* Footer Code */}
          <Text style={styles.screenFooterCode}>M14-S04 · Attendance & History</Text>
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
              <Text style={[styles.workforceDetailValue, { color: '#2E7D32' }]}>{staff.verificationStatus || 'Verified'}</Text>
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
            <LockOutlineIcon size={24} color="#6D5D52" />
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
              <Text style={[styles.workforceDetailValue, { color: '#2E7D32' }]}>{staff.status}</Text>
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

          {/* Footer Code */}
          <Text style={styles.screenFooterCode}>M14-S02b · View Staff Details</Text>
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

              <Text style={styles.workforceModalFooterCaption}>M14-S02b · Staff profile Active popup</Text>
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
                      setWorkforceSubScreen('dashboard');
                      setActiveTab('Workforce');
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
      {!dashboardSubScreen && (activeTab !== 'Workforce' || workforceSubScreen === 'dashboard') && (
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
                  activeTab === 'Profile' ||
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
                  activeTab === 'Profile' ||
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
    color: '#7A7570',
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
    fontSize: 14,
    fontWeight: '800',
    color: '#4A3B32',
    marginBottom: 12,
  },
  workforceBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    backgroundColor: '#E8E2D9',
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
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },
  workforceBarFillRed: {
    height: 8,
    backgroundColor: '#D32F2F',
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
    marginTop: 16,
  },
  workforceSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0DCD6',
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
    color: '#5C4E43',
    marginTop: 8,
  },
  workforceCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E4DD',
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
    borderTopColor: '#F0ECE6',
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
    color: '#D32F2F',
  },
  workforceActionActivate: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brand,
  },
  workforceActiveBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  workforceActiveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },
  workforcePendingBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  workforcePendingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E65100',
  },
  workforcePresentBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  workforcePresentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },
  workforceAbsentBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  workforceAbsentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D32F2F',
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
    borderColor: '#E8E4DD',
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
    borderColor: '#E57373',
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
    borderColor: '#ECE7E1',
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
    backgroundColor: '#FDF1E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  workforceStepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B35312',
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
    backgroundColor: '#F0ECE6',
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
    backgroundColor: '#FDEEE2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F6D8C0',
  },
  workforcePhotoPlaceholderQuestion: {
    fontSize: 22,
    fontWeight: '800',
    color: '#9A5B2D',
  },
  workforceUploadPhotoBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
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
    borderColor: '#D8D3CC',
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
    borderColor: '#D8D3CC',
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
    borderColor: '#D8D3CC',
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
    color: '#A0988E',
  },
  workforceFormHelperText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
  },
  workforceCheckboxBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#FAFAFA',
  },
  workforceCheckboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  workforceCheckboxSquareChecked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#1F2937',
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
    backgroundColor: '#EAF2F8',
    borderWidth: 1,
    borderColor: '#D4E6F1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  workforceIdCalloutText: {
    flex: 1,
    fontSize: 12,
    color: '#1C4E75',
    lineHeight: 17,
    fontWeight: '500',
  },
  workforceUploadDropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
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
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE7E1',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceCreateCancelBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  workforceFooterCaption: {
    ...adminType.caption,
    fontSize: 11,
    color: '#6B7280',
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
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  workforceRadioCardSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F09A55',
    backgroundColor: '#FDF5EF',
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
    backgroundColor: '#F4F2EE',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFD9CE',
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  workforceStaticInputText: {
    ...adminType.body,
    fontSize: 14,
    color: '#8A847C',
  },
  workforceAccountStatusBox: {
    backgroundColor: '#FAF5ED',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0DEBA',
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
    color: '#B45309',
  },
  workforceAccountStatusSub: {
    ...adminType.caption,
    fontSize: 12,
    color: '#6B7280',
  },
  workforceDocItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE6',
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
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  workforceDocPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  workforceDocFileText: {
    ...adminType.caption,
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  workforceDocVerificationLabel: {
    ...adminType.caption,
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 3,
  },
  workforceDocVerificationPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  workforceDocVerificationPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  workforceDocActionBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
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
    borderColor: '#A0988E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
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
    borderTopColor: '#ECE7E1',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0C8BE',
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  workforceModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F0ECE6',
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
    backgroundColor: '#F7EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceModalAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8C5320',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceModalInfoCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE7E1',
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
    borderBottomColor: '#F0ECE6',
  },
  workforceModalRowLabel: {
    ...adminType.body,
    fontSize: 12,
    color: '#78716C',
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
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3E5D8',
    padding: 14,
    marginBottom: 12,
  },
  workforceModalSectionTitle: {
    ...adminType.sectionHead,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 4,
  },
  workforceModalSectionSub: {
    ...adminType.caption,
    fontSize: 11,
    color: '#8C7E72',
    marginBottom: 10,
  },
  workforceModalSelect: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workforceModalHistoryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#4B5563',
  },
  workforceModalHistoryDate: {
    ...adminType.caption,
    fontSize: 11,
    color: '#9CA3AF',
  },
  workforceModalHistoryText: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceModalCancelBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  workforceModalFooterCaption: {
    ...adminType.caption,
    fontSize: 11,
    color: '#9CA3AF',
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
    borderColor: '#E8E4DD',
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
    backgroundColor: '#F3E8DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workforceAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7D4F27',
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
    borderTopColor: '#F0EBE4',
  },
  workforceProfileGridCol: {
    width: '48%',
  },
  workforceGridLabel: {
    ...adminType.caption,
    fontSize: 11,
    color: '#7A7570',
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
    fontSize: 14,
    fontWeight: '800',
    color: '#4A3B32',
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  workforceDetailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E4DD',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginHorizontal: 16,
    ...adminShadow.sm,
  },
  workforceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E6E0D8',
  },
  workforceDetailLabel: {
    ...adminType.body,
    fontSize: 12,
    color: '#7A7570',
  },
  workforceDetailValue: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.ink,
    maxWidth: '62%',
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
    borderColor: '#D4C5B3',
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceDocBtnOutlineText: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '800',
    color: '#5C3A1E',
  },
  workforceDocBtnDisabled: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0DDD8',
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workforceDocBtnDisabledText: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '700',
    color: '#A0988E',
  },
  workforceRestrictedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D4C5B3',
    borderRadius: 14,
    backgroundColor: '#FAF7F2',
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E0D6',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    ...adminShadow.sm,
  },
  workforceDocCardRejected: {
    borderColor: '#EB5757',
    borderWidth: 1.5,
  },
  workforceDocCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workforceDocCardTitle: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceDocCardSub: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
  },
  workforceDocBadgeVerified: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  workforceDocBadgeTextVerified: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
  workforceDocBadgeRejected: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  workforceDocBadgeTextRejected: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D32F2F',
  },
  workforceDocBadgeNotUploaded: {
    backgroundColor: '#F0ECE6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  workforceDocBadgeTextNotUploaded: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7A7570',
  },
  workforceTimelineCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E4DD',
    padding: 14,
    marginHorizontal: 16,
    ...adminShadow.sm,
  },
  workforceTimelineItem: {
    paddingVertical: 6,
  },
  workforceTimelineMeta: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 2,
  },
  workforceTimelineAction: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.ink,
  },
  workforceTimelineDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E6E0D8',
    marginVertical: 4,
  },
  workforceDisclaimerText: {
    ...adminType.caption,
    fontSize: 11,
    color: '#8A8077',
    lineHeight: 16,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
});
