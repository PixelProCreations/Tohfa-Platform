import React, { useMemo, useState } from 'react';
import {
  Modal,
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

import { t } from '../../i18n';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function BellOutlineIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.placeholder }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="6" r="2.2" fill={adminColors.card} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="12" r="2.2" fill={adminColors.card} stroke={color} strokeWidth="2" />
      <Circle cx="10" cy="18" r="2.2" fill={adminColors.card} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function RefreshArrowsIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 4v5h-5M4 20v-5h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.4 15a8 8 0 01-14.8-1.5M4.6 9a8 8 0 0114.8 1.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentPencilIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function DocumentFileIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function HeadsetSupportIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 13v-3a9 9 0 0118 0v3M21 16a3 3 0 01-3 3h-1M3 16a3 3 0 003 3h1"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="2" y="12" width="4" height="6" rx="2" stroke={color} strokeWidth="1.8" />
      <Rect x="18" y="12" width="4" height="6" rx="2" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function AuditClipboardIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M9 2.5h6a1 1 0 011 1V5H8V3.5a1 1 0 011-1z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 13l2.5 2.5 5-5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WrenchIcon({ size = 20, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: [{ scaleX: -1 }] }}
    >
      <Path
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.9 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function OrangeCheckSquareIcon({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="2" width="20" height="20" rx="5" fill={adminColors.brand} />
        <Path
          d="M7 12l3.5 3.5 6.5-6.5"
          stroke={adminColors.onBrand}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="2" width="20" height="20" rx="5" stroke={adminColors.border} strokeWidth="2" fill={adminColors.card} />
    </Svg>
  );
}

function ScrollArrowLeftIcon({ color = adminColors.muted }: { color?: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ScrollArrowRightIcon({ color = adminColors.muted }: { color?: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Bottom Tab Icons ────────────────────────────────────────────────────────

function TabHomeIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabFarmersIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="2.2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M8.5 17.5c0-2.2 1.55-3.8 3.5-3.8s3.5 1.6 3.5 3.8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Circle cx="6" cy="9" r="1.8" stroke={color} strokeWidth="1.8" />
      <Path d="M3 17.5c0-1.8 1.4-3.2 3.2-3.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="18" cy="9" r="1.8" stroke={color} strokeWidth="1.8" />
      <Path d="M21 17.5c0-1.8-1.4-3.2-3.2-3.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function TabProduceIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14" r="6.8" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7.2C12 5.5 13 4 14.5 4M12 7.2C12 5.5 11 4 9.5 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function TabAuditsIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="4.5" width="17" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M16 2.5v4M8 2.5v4M3.5 10h17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TabMoreIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="10.2" y="4" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="16.4" y="4" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="4" y="10.2" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="10.2" y="10.2" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="16.4" y="10.2" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="4" y="16.4" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="10.2" y="16.4" width="3.6" height="3.6" rx="1" fill={color} />
      <Rect x="16.4" y="16.4" width="3.6" height="3.6" rx="1" fill={color} />
    </Svg>
  );
}

// ─── Data Types & Fixtures ───────────────────────────────────────────────────

export type NotificationViewMode =
  | 'center'
  | 'reports'
  | 'report_config'
  | 'report_preview';

export interface CenterNotificationItem {
  id: string;
  type: 'produce' | 'support' | 'audit' | 'report';
  title: string;
  body: string;
  reference: string;
  categoryTime: string;
  unread: boolean;
  actionRequired?: boolean;
}


export interface ReportCatalogueItem {
  id: string;
  title: string;
  description: string;
}

export interface ReportTableRow {
  id: string;
  farmerId: string;
  farmerName: string;
  zone: string;
  activityType: string;
  activityDate: string;
  activityStatus: string;
  relatedRecord: string;
}

const INITIAL_CENTER_NOTIFICATIONS: readonly CenterNotificationItem[] = [
  {
    id: 'n1',
    type: 'produce',
    title: 'New produce listing submitted',
    body: 'Ramesh Kumar submitted a new Tomato listing awaiting review.',
    reference: 'PL-001245 · Ramesh Kumar',
    categoryTime: 'Produce Listings · 10 Oct 2026, 09:10',
    unread: true,
  },
  {
    id: 'n2',
    type: 'report',
    title: 'Report generation delayed',
    body: 'RPT-2026-0012 took longer than expected to generate.',
    reference: '',
    categoryTime: 'System/Technical Alerts · 9 Oct 2026, 22:10',
    unread: true,
  },
  {
    id: 'n3',
    type: 'audit',
    title: 'Audit scheduled',
    body: 'An internal audit was scheduled at Ramesh Organic Farm.',
    reference: 'AUD-2026-0043 · Ramesh Kumar',
    categoryTime: 'Audit Activity · 9 Oct 2026, 16:20',
    unread: false,
  },
];


const REPORT_CATALOGUE_ITEMS: readonly ReportCatalogueItem[] = [
  {
    id: 'farmer_activity',
    title: 'Farmer Activity',
    description: 'Review farmer-related operational activity.',
  },
  {
    id: 'produce_listings',
    title: 'Produce Listings',
    description: 'Review produce listings and their operational status.',
  },
  {
    id: 'farmer_ratings',
    title: 'Farmer Ratings',
    description: 'Review ratings within your zone.',
  },
];

const DATE_RANGE_OPTIONS = [
  'Today',
  'Last 7 Days',
  'Last 30 Days',
  'Custom',
] as const;

const FARMER_FILTER_OPTIONS = [
  'Any farmer',
  'Ramesh Kumar',
  'Selvi',
  'Meena',
  'Lakshmi',
  'Anand',
] as const;

const ACTIVITY_TYPE_OPTIONS = [
  'Any',
  'Produce Listing',
  'Payment Issue',
  'Audit Visit',
  'Dispute Resolution',
] as const;

const STATUS_FILTER_OPTIONS = [
  'Any',
  'Completed',
  'Pending',
  'In Progress',
  'Escalated',
] as const;

const GROUP_BY_OPTIONS = [
  'None',
  'Date',
  'Farmer',
  'Status',
] as const;

const SAMPLE_PREVIEW_RECORDS: readonly ReportTableRow[] = [
  { id: '1', farmerId: 'FR-00241', farmerName: 'Ramesh Kumar', zone: 'Coonoor', activityType: 'Produce listing', activityDate: '10 Oct 2026', activityStatus: 'Approved', relatedRecord: 'PL-001245' },
  { id: '2', farmerId: 'FR-00242', farmerName: 'Selvi', zone: 'Coonoor', activityType: 'Produce listing', activityDate: '10 Oct 2026', activityStatus: 'Pending', relatedRecord: 'PL-001246' },
  { id: '3', farmerId: 'FR-00243', farmerName: 'Meena', zone: 'Coonoor', activityType: 'Support ticket', activityDate: '10 Oct 2026', activityStatus: 'Action required', relatedRecord: 'FS-00131' },
  { id: '4', farmerId: 'FR-00244', farmerName: 'Lakshmi', zone: 'Coonoor', activityType: 'Farm audit', activityDate: '09 Oct 2026', activityStatus: 'Scheduled', relatedRecord: 'AUD-2026-0043' },
  { id: '5', farmerId: 'FR-00245', farmerName: 'Anand', zone: 'Coonoor', activityType: 'Produce listing', activityDate: '09 Oct 2026', activityStatus: 'Under review', relatedRecord: 'PL-001247' },
  { id: '6', farmerId: 'FR-00246', farmerName: 'Murugan', zone: 'Kotagiri', activityType: 'Dispute filed', activityDate: '09 Oct 2026', activityStatus: 'In review', relatedRecord: 'DSP-00084' },
  { id: '7', farmerId: 'FR-00247', farmerName: 'Priya', zone: 'Ooty', activityType: 'Handover complete', activityDate: '08 Oct 2026', activityStatus: 'Completed', relatedRecord: 'HO-2026-0012' },
  { id: '8', farmerId: 'FR-00248', farmerName: 'Karthik', zone: 'Kotagiri', activityType: 'Produce listing', activityDate: '08 Oct 2026', activityStatus: 'Approved', relatedRecord: 'PL-001248' },
  { id: '9', farmerId: 'FR-00249', farmerName: 'Senthil', zone: 'Ooty', activityType: 'Farm audit', activityDate: '07 Oct 2026', activityStatus: 'Passed', relatedRecord: 'AUD-2026-0042' },
  { id: '10', farmerId: 'FR-00250', farmerName: 'Vasanthi', zone: 'Coonoor', activityType: 'Produce listing', activityDate: '07 Oct 2026', activityStatus: 'Approved', relatedRecord: 'PL-001249' },
  { id: '11', farmerId: 'FR-00251', farmerName: 'Ganesan', zone: 'Kotagiri', activityType: 'Support ticket', activityDate: '06 Oct 2026', activityStatus: 'Resolved', relatedRecord: 'FS-00130' },
  { id: '12', farmerId: 'FR-00252', farmerName: 'Divya', zone: 'Ooty', activityType: 'Produce listing', activityDate: '06 Oct 2026', activityStatus: 'Approved', relatedRecord: 'PL-001250' },
  { id: '13', farmerId: 'FR-00253', farmerName: 'Ramesh Kumar', zone: 'Coonoor', activityType: 'Handover complete', activityDate: '06 Oct 2026', activityStatus: 'Completed', relatedRecord: 'HO-2026-0011' },
  { id: '14', farmerId: 'FR-00254', farmerName: 'Selvi', zone: 'Coonoor', activityType: 'Rating update', activityDate: '05 Oct 2026', activityStatus: 'Completed', relatedRecord: 'RAT-2026-0022' },
  { id: '15', farmerId: 'FR-00255', farmerName: 'Meena', zone: 'Coonoor', activityType: 'Produce listing', activityDate: '05 Oct 2026', activityStatus: 'Approved', relatedRecord: 'PL-001251' },
  { id: '16', farmerId: 'FR-00256', farmerName: 'Lakshmi', zone: 'Coonoor', activityType: 'Produce listing', activityDate: '04 Oct 2026', activityStatus: 'Approved', relatedRecord: 'PL-001252' },
  { id: '17', farmerId: 'FR-00257', farmerName: 'Anand', zone: 'Coonoor', activityType: 'Audit support', activityDate: '04 Oct 2026', activityStatus: 'Completed', relatedRecord: 'AUD-2026-0041' },
  { id: '18', farmerId: 'FR-00258', farmerName: 'Murugan', zone: 'Kotagiri', activityType: 'Produce listing', activityDate: '03 Oct 2026', activityStatus: 'Approved', relatedRecord: 'PL-001253' },
  { id: '19', farmerId: 'FR-00259', farmerName: 'Priya', zone: 'Ooty', activityType: 'Support ticket', activityDate: '03 Oct 2026', activityStatus: 'Resolved', relatedRecord: 'FS-00129' },
  { id: '20', farmerId: 'FR-00260', farmerName: 'Karthik', zone: 'Kotagiri', activityType: 'Handover complete', activityDate: '02 Oct 2026', activityStatus: 'Completed', relatedRecord: 'HO-2026-0010' },
  { id: '21', farmerId: 'FR-00261', farmerName: 'Senthil', zone: 'Ooty', activityType: 'Produce listing', activityDate: '02 Oct 2026', activityStatus: 'Approved', relatedRecord: 'PL-001254' },
  { id: '22', farmerId: 'FR-00262', farmerName: 'Vasanthi', zone: 'Coonoor', activityType: 'Produce listing', activityDate: '01 Oct 2026', activityStatus: 'Approved', relatedRecord: 'PL-001255' },
  { id: '23', farmerId: 'FR-00263', farmerName: 'Ganesan', zone: 'Kotagiri', activityType: 'Farm audit', activityDate: '01 Oct 2026', activityStatus: 'Passed', relatedRecord: 'AUD-2026-0040' },
  { id: '24', farmerId: 'FR-00264', farmerName: 'Divya', zone: 'Ooty', activityType: 'Produce listing', activityDate: '30 Sep 2026', activityStatus: 'Approved', relatedRecord: 'PL-001256' },
  { id: '25', farmerId: 'FR-00265', farmerName: 'Ramesh Kumar', zone: 'Coonoor', activityType: 'Produce listing', activityDate: '30 Sep 2026', activityStatus: 'Approved', relatedRecord: 'PL-001257' },
  { id: '26', farmerId: 'FR-00266', farmerName: 'Selvi', zone: 'Coonoor', activityType: 'Support ticket', activityDate: '29 Sep 2026', activityStatus: 'Resolved', relatedRecord: 'FS-00128' },
  { id: '27', farmerId: 'FR-00267', farmerName: 'Meena', zone: 'Coonoor', activityType: 'Handover complete', activityDate: '28 Sep 2026', activityStatus: 'Completed', relatedRecord: 'HO-2026-0009' },
  { id: '28', farmerId: 'FR-00268', farmerName: 'Lakshmi', zone: 'Coonoor', activityType: 'Produce listing', activityDate: '28 Sep 2026', activityStatus: 'Approved', relatedRecord: 'PL-001258' },
];

// ─── Component Props ─────────────────────────────────────────────────────────

export interface FarmerAdminNotificationsScreenProps {
  onBack: () => void;
  onViewListing?: () => void;
  onViewAudit?: () => void;
  onViewDispute?: () => void;
  onTabChange?: (tab: 'Home' | 'Farmers' | 'Produce' | 'Audits' | 'More') => void;
}

export function FarmerAdminNotificationsScreen({
  onBack,
  onViewListing,
  onViewAudit,
  onViewDispute,
  onTabChange,
}: FarmerAdminNotificationsScreenProps) {
  // Screen mode: 'center' (M13-S01) | 'alerts' | 'reports' (M13-S02) | 'report_config' (M13-S03B) | 'report_preview' (M13-S04)
  const [viewMode, setViewMode] = useState<NotificationViewMode>('center');

  // Search queries
  const [searchQuery, setSearchQuery] = useState('');
  const [resultsSearchQuery, setResultsSearchQuery] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState<readonly CenterNotificationItem[]>(
    INITIAL_CENTER_NOTIFICATIONS,
  );
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Produce' | 'Reports' | 'Audits'>('All');
  const [showFilterPills, setShowFilterPills] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  // Reports state (M13-S02 & M13-S03B)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('Today');
  const [selectedFarmer, setSelectedFarmer] = useState<string>('Any farmer');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('Any');
  const [selectedStatus, setSelectedStatus] = useState<string>('Any');
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>('None');
  const [openDropdown, setOpenDropdown] = useState<'date_range' | 'group_by' | null>(null);

  // Modal pickers
  const [pickerModalType, setPickerModalType] = useState<
    'date_range' | 'farmer' | 'activity' | 'status' | 'group_by' | 'report_type' | 'rows_per_page' | null
  >(null);

  // Column checkboxes (M13-S03B)
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
    farmerId: true,
    farmerName: true,
    zone: true,
    activityType: true,
    activityDate: true,
    activityStatus: true,
    relatedRecord: true,
  });

  // Recent reports list (M13-S03B)
  const [recentReports, setRecentReports] = useState<string[]>([]);

  // Export format selection (M13-S03B)
  const [selectedExportFormat, setSelectedExportFormat] = useState<'CSV' | 'PDF'>('CSV');

  // Preview & Pagination (M13-S04)
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [exportHistory, setExportHistory] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedReportItem: ReportCatalogueItem | null = useMemo(() => {
    if (!selectedReportId) return null;
    return REPORT_CATALOGUE_ITEMS.find((item) => item.id === selectedReportId) ?? null;
  }, [selectedReportId]);

  // Derived unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.unread).length;
  }, [notifications]);

  // Filtered Notifications Center list
  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesSearch =
        q === '' ||
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        item.categoryTime.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'Unread') return item.unread;
      if (activeFilter === 'Produce') return item.type === 'produce';
      if (activeFilter === 'Reports') return item.type === 'report';
      if (activeFilter === 'Audits') return item.type === 'audit';
      return true;
    });
  }, [notifications, searchQuery, activeFilter]);


  // Filtered Table Rows for Report Preview (M13-S04)
  const filteredPreviewRows = useMemo(() => {
    const q = resultsSearchQuery.trim().toLowerCase();
    if (!q) return SAMPLE_PREVIEW_RECORDS;
    return SAMPLE_PREVIEW_RECORDS.filter((r) => {
      return (
        r.farmerId.toLowerCase().includes(q) ||
        r.farmerName.toLowerCase().includes(q) ||
        r.zone.toLowerCase().includes(q) ||
        r.activityType.toLowerCase().includes(q) ||
        r.activityDate.toLowerCase().includes(q) ||
        r.activityStatus.toLowerCase().includes(q) ||
        r.relatedRecord.toLowerCase().includes(q)
      );
    });
  }, [resultsSearchQuery]);

  const totalPages = Math.ceil(filteredPreviewRows.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredPreviewRows.slice(start, start + rowsPerPage);
  }, [filteredPreviewRows, currentPage, rowsPerPage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRefresh = () => {
    setNotifications(INITIAL_CENTER_NOTIFICATIONS);
    setSearchQuery('');
    setActiveFilter('All');
    showToast('Notifications list refreshed');
  };

  const handleCardPress = (item: CenterNotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
    );

    if (item.type === 'produce') {
      onViewListing?.();
    } else if (item.type === 'audit') {
      onViewAudit?.();
    } else if (item.type === 'report') {
      setViewMode('reports');
    }
  };

  const handleToggleColumn = (key: string) => {
    setSelectedColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleResetFilters = () => {
    setSelectedDateRange('Today');
    setSelectedFarmer('Any farmer');
    setSelectedActivityType('Any');
    setSelectedStatus('Any');
    setSelectedGroupBy('None');
    setOpenDropdown(null);
    setSelectedColumns({
      farmerId: true,
      farmerName: true,
      zone: true,
      activityType: true,
      activityDate: true,
      activityStatus: true,
      relatedRecord: true,
    });
    showToast('Filters reset to default');
  };

  const handleGenerateReport = () => {
    const reportTitle = selectedReportItem?.title ?? 'Farmer Activity';
    const ref = `RPT-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(4, '0')}`;
    setRecentReports((prev) => [
      `${reportTitle} (${ref}) · ${new Date().toLocaleDateString('en-GB')}`,
      ...prev,
    ]);
    setViewMode('report_config');
  };

  const handleExport = (type: 'CSV' | 'PDF' | 'Report') => {
    const reportTitle = selectedReportItem?.title ?? 'Farmer Activity';
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setExportHistory((prev) => [
      `${reportTitle} — ${type} exported at ${timeStr}`,
      ...prev,
    ]);
    showToast(`${type} generated successfully`);
  };

  const handleExportAndPreview = (type: 'CSV' | 'PDF') => {
    handleExport(type);
    if (type === 'CSV') {
      setCurrentPage(1);
      setResultsSearchQuery('');
      setViewMode('report_preview');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Sub-Render: Quick View Switcher Segmented Bar
  // ───────────────────────────────────────────────────────────────────────────
  const renderQuickModeSwitcher = () => null;

  // ───────────────────────────────────────────────────────────────────────────
  // Sub-Render: Generic Picker Modal
  // ───────────────────────────────────────────────────────────────────────────
  const renderPickerModal = () => {
    if (!pickerModalType) return null;

    let title = '';
    let options: readonly string[] = [];
    let selected = '';
    let onSelect: (val: string) => void = () => {};

    if (pickerModalType === 'report_type') {
      title = 'Select Report Type';
      options = REPORT_CATALOGUE_ITEMS.map((i) => i.title);
      selected = selectedReportItem?.title ?? REPORT_CATALOGUE_ITEMS[0]?.title ?? '';
      onSelect = (val) => {
        const found = REPORT_CATALOGUE_ITEMS.find((i) => i.title === val);
        if (found) setSelectedReportId(found.id);
      };
    } else if (pickerModalType === 'date_range') {
      title = 'Select Date Range';
      options = DATE_RANGE_OPTIONS;
      selected = selectedDateRange;
      onSelect = setSelectedDateRange;
    } else if (pickerModalType === 'farmer') {
      title = 'Select Farmer';
      options = FARMER_FILTER_OPTIONS;
      selected = selectedFarmer;
      onSelect = setSelectedFarmer;
    } else if (pickerModalType === 'activity') {
      title = 'Select Activity Type';
      options = ACTIVITY_TYPE_OPTIONS;
      selected = selectedActivityType;
      onSelect = setSelectedActivityType;
    } else if (pickerModalType === 'status') {
      title = 'Select Status';
      options = STATUS_FILTER_OPTIONS;
      selected = selectedStatus;
      onSelect = setSelectedStatus;
    } else if (pickerModalType === 'group_by') {
      title = 'Select Group By';
      options = GROUP_BY_OPTIONS;
      selected = selectedGroupBy;
      onSelect = setSelectedGroupBy;
    } else if (pickerModalType === 'rows_per_page') {
      title = 'Rows per page';
      options = ['5', '10', '25'];
      selected = String(rowsPerPage);
      onSelect = (val) => {
        setRowsPerPage(Number(val));
        setCurrentPage(1);
      };
    }

    return (
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalType(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerModalType(null)}>
          <View style={styles.pickerModalCard}>
            <Text style={styles.pickerModalTitle}>{title}</Text>
            {options.map((opt) => {
              const isActive = selected === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pickerModalOption, isActive && styles.pickerModalOptionActive]}
                  onPress={() => {
                    onSelect(opt);
                    setPickerModalType(null);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerModalOptionText,
                      isActive && styles.pickerModalOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Screen 1: Notifications Center (Image 1: M13-S01)
  // ───────────────────────────────────────────────────────────────────────────
  if (viewMode === 'center') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back to More"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <View style={styles.headerTitleGroup}>
              <BellOutlineIcon size={22} color={adminColors.onBrand} />
              <Text style={styles.headerTitle}>Notifications Center</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {toastMessage !== null && (
            <View style={styles.toastBanner}>
              <Text style={styles.toastBannerText}>{toastMessage}</Text>
            </View>
          )}

          <View style={styles.searchBox}>
            <SearchIcon size={18} color={adminColors.placeholder} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notifications..."
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.countRow}>
            <Text style={styles.countText}>
              <Text style={styles.countBold}>{unreadCount} unread</Text> notifications
            </Text>
          </View>

          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, showFilterPills && styles.actionBtnActive]}
              onPress={() => setShowFilterPills(!showFilterPills)}
              activeOpacity={0.75}
            >
              <FilterSlidersIcon size={16} color={showFilterPills ? adminColors.brandDeep : adminColors.ink} />
              <Text style={[styles.actionBtnText, showFilterPills && styles.actionBtnTextActive]}>
                Filter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleRefresh} activeOpacity={0.75}>
              <RefreshArrowsIcon size={16} color={adminColors.ink} />
              <Text style={styles.actionBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {showFilterPills && (
            <View style={styles.filterPillsContainer}>
              {(['All', 'Unread', 'Produce', 'Reports', 'Audits'] as const).map((chip) => {
                const isActive = activeFilter === chip;
                return (
                  <TouchableOpacity
                    key={chip}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setActiveFilter(chip)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {chip}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.cardsContainer}>
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No notifications found</Text>
                <Text style={styles.emptySub}>Try clearing your search or filter</Text>
              </View>
            ) : (
              filteredNotifications.map((item) => {
                const isOrangeBorder = item.unread;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notificationCard,
                      isOrangeBorder ? styles.notificationCardUnread : styles.notificationCardRead,
                    ]}
                    onPress={() => handleCardPress(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardIconBox}>
                        {item.type === 'produce' && <DocumentPencilIcon size={20} />}
                        {item.type === 'support' && <HeadsetSupportIcon size={20} />}
                        {item.type === 'audit' && <AuditClipboardIcon size={20} />}
                        {item.type === 'report' && <WrenchIcon size={20} color={adminColors.warning.text} />}
                      </View>

                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>

                      <View style={styles.badgesRow}>
                        {item.unread && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>Unread</Text>
                          </View>
                        )}
                        {item.actionRequired && (
                          <View style={styles.actionRequiredBadge}>
                            <Text style={styles.actionRequiredBadgeText}>Action required</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Text style={styles.cardBodyText}>{item.body}</Text>
                    {Boolean(item.reference) && (
                      <Text style={styles.cardRefText}>{item.reference}</Text>
                    )}
                    <Text style={styles.cardMetaText}>{item.categoryTime}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Bottom Tab Bar (Image 1) */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => onTabChange?.('Home')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityLabel="Home"
          >
            <TabHomeIcon active={false} />
            <Text style={styles.tabLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => onTabChange?.('Farmers')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityLabel="Farmers"
          >
            <TabFarmersIcon active={false} />
            <Text style={styles.tabLabel}>Farmers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => onTabChange?.('Produce')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityLabel="Produce"
          >
            <TabProduceIcon active={false} />
            <Text style={styles.tabLabel}>Produce</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => onTabChange?.('Audits')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityLabel="Audits"
          >
            <TabAuditsIcon active={false} />
            <Text style={styles.tabLabel}>Audits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => onTabChange?.('More')}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityLabel="More"
          >
            <TabMoreIcon active={true} />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  // ───────────────────────────────────────────────────────────────────────────
  // Screen 3: Reports Dashboard & Catalogue (M13-S02)
  // ───────────────────────────────────────────────────────────────────────────
  if (viewMode === 'reports') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  if (selectedReportId) {
                    setSelectedReportId(null);
                    setOpenDropdown(null);
                  } else {
                    setViewMode('center');
                  }
                }}
                activeOpacity={0.7}
                accessibilityLabel="Back to Notifications Center"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Reports</Text>
            </View>
          </View>
        </View>

        {renderQuickModeSwitcher()}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionHeaderTitle}>Report catalogue</Text>

          <View style={styles.catalogueList}>
            {REPORT_CATALOGUE_ITEMS.map((item) => {
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.catalogueCard}
                  onPress={() => {
                    setSelectedReportId(item.id);
                    setOpenDropdown(null);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.catalogueTextCol}>
                    <Text style={styles.catalogueTitle}>{item.title}</Text>
                    <Text style={styles.catalogueDesc}>{item.description}</Text>
                  </View>
                  <ChevronRightIcon
                    size={18}
                    color={adminColors.muted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedReportItem && (
            <>
              <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>
                Configure: {selectedReportItem.title}
              </Text>

              <View
                style={[
                  styles.configCard,
                  {
                    zIndex: openDropdown ? 50 : 1,
                    paddingBottom:
                      openDropdown === 'group_by'
                        ? 185
                        : openDropdown === 'date_range'
                        ? 185
                        : adminSpacing.lg,
                  },
                ]}
              >
                {/* Field: Date Range * */}
                <View
                  style={[
                    styles.dropdownFieldWrapper,
                    { zIndex: openDropdown === 'date_range' ? 30 : 1 },
                  ]}
                >
                  <Text style={styles.configLabel}>
                    Date Range <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() =>
                      setOpenDropdown((prev) => (prev === 'date_range' ? null : 'date_range'))
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownValueText}>{selectedDateRange}</Text>
                    <ChevronDownIcon size={16} color={adminColors.ink} />
                  </TouchableOpacity>

                  {openDropdown === 'date_range' && (
                    <View style={styles.dropdownOverlayMenu}>
                      {DATE_RANGE_OPTIONS.map((opt) => {
                        const isSelected = selectedDateRange === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.dropdownOptionRow,
                              isSelected && styles.dropdownOptionRowActive,
                            ]}
                            onPress={() => {
                              setSelectedDateRange(opt);
                              setOpenDropdown(null);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.dropdownOptionLabel,
                                isSelected && styles.dropdownOptionLabelActive,
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

                {/* Field: Group By */}
                <View
                  style={[
                    styles.dropdownFieldWrapper,
                    { marginTop: adminSpacing.md, zIndex: openDropdown === 'group_by' ? 20 : 1 },
                  ]}
                >
                  <Text style={styles.configLabel}>Group By</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() =>
                      setOpenDropdown((prev) => (prev === 'group_by' ? null : 'group_by'))
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownValueText}>{selectedGroupBy}</Text>
                    <ChevronDownIcon size={16} color={adminColors.ink} />
                  </TouchableOpacity>

                  {openDropdown === 'group_by' && (
                    <View style={styles.dropdownOverlayMenu}>
                      {GROUP_BY_OPTIONS.map((opt) => {
                        const isSelected = selectedGroupBy === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.dropdownOptionRow,
                              isSelected && styles.dropdownOptionRowActive,
                            ]}
                            onPress={() => {
                              setSelectedGroupBy(opt);
                              setOpenDropdown(null);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.dropdownOptionLabel,
                                isSelected && styles.dropdownOptionLabelActive,
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
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {selectedReportItem && (
          <View style={styles.generateReportFooter}>
            <TouchableOpacity
              style={styles.generateReportBtn}
              onPress={handleGenerateReport}
              activeOpacity={0.8}
            >
              <Text style={styles.generateReportBtnText}>Generate Report</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderPickerModal()}
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Screen 4: Report Configuration (Image 1 & 2: M13-S03B)
  // ───────────────────────────────────────────────────────────────────────────
  if (viewMode === 'report_config') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header: ← Report Configuration (Image 1) */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setViewMode('reports')}
                activeOpacity={0.7}
                accessibilityLabel="Back to Reports Catalogue"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Report Configuration</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {toastMessage !== null && (
            <View style={styles.toastBanner}>
              <Text style={styles.toastBannerText}>{toastMessage}</Text>
            </View>
          )}

          {/* Field: Report Type * */}
          <Text style={styles.configLabel}>
            Report Type <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.configDropdownInput}
            onPress={() => setPickerModalType('report_type')}
            activeOpacity={0.8}
          >
            <Text style={styles.configDropdownValue}>
              {selectedReportItem?.title ?? REPORT_CATALOGUE_ITEMS[0]?.title ?? ''}
            </Text>
            <ChevronDownIcon size={16} color={adminColors.ink} />
          </TouchableOpacity>

          {/* Field: Date Range * */}
          <Text style={[styles.configLabel, { marginTop: adminSpacing.md }]}>
            Date Range <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.configDropdownInput}
            onPress={() => setPickerModalType('date_range')}
            activeOpacity={0.8}
          >
            <Text style={styles.configDropdownValue}>{selectedDateRange}</Text>
            <ChevronDownIcon size={16} color={adminColors.ink} />
          </TouchableOpacity>

          {/* Field: Farmer */}
          <Text style={[styles.configLabel, { marginTop: adminSpacing.md }]}>Farmer</Text>
          <TouchableOpacity
            style={styles.configDropdownInput}
            onPress={() => setPickerModalType('farmer')}
            activeOpacity={0.8}
          >
            <Text style={styles.configDropdownValue}>{selectedFarmer}</Text>
            <ChevronDownIcon size={16} color={adminColors.ink} />
          </TouchableOpacity>

          {/* Field: Activity type */}
          <Text style={[styles.configLabel, { marginTop: adminSpacing.md }]}>Activity type</Text>
          <TouchableOpacity
            style={styles.configDropdownInput}
            onPress={() => setPickerModalType('activity')}
            activeOpacity={0.8}
          >
            <Text style={styles.configDropdownValue}>{selectedActivityType}</Text>
            <ChevronDownIcon size={16} color={adminColors.ink} />
          </TouchableOpacity>

          {/* Field: Status */}
          <Text style={[styles.configLabel, { marginTop: adminSpacing.md }]}>Status</Text>
          <TouchableOpacity
            style={styles.configDropdownInput}
            onPress={() => setPickerModalType('status')}
            activeOpacity={0.8}
          >
            <Text style={styles.configDropdownValue}>{selectedStatus}</Text>
            <ChevronDownIcon size={16} color={adminColors.ink} />
          </TouchableOpacity>

          {/* Field: Group By (optional) */}
          <Text style={[styles.configLabel, { marginTop: adminSpacing.md }]}>Group By (optional)</Text>
          <TouchableOpacity
            style={styles.configDropdownInput}
            onPress={() => setPickerModalType('group_by')}
            activeOpacity={0.8}
          >
            <Text style={styles.configDropdownValue}>{selectedGroupBy}</Text>
            <ChevronDownIcon size={16} color={adminColors.ink} />
          </TouchableOpacity>

          {/* Section: Columns (Image 1 & 2) */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Columns</Text>

          <View style={styles.columnsList}>
            {[
              { key: 'farmerId', label: 'Farmer ID' },
              { key: 'farmerName', label: 'Farmer name' },
              { key: 'zone', label: 'Zone' },
              { key: 'activityType', label: 'Activity type' },
              { key: 'activityDate', label: 'Activity date' },
              { key: 'activityStatus', label: 'Activity status' },
              { key: 'relatedRecord', label: 'Related record' },
            ].map((col) => {
              const isChecked = selectedColumns[col.key] ?? false;
              return (
                <TouchableOpacity
                  key={col.key}
                  style={styles.columnCheckRow}
                  onPress={() => handleToggleColumn(col.key)}
                  activeOpacity={0.7}
                >
                  <OrangeCheckSquareIcon checked={isChecked} />
                  <Text style={styles.columnCheckLabel}>{col.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Restrict note (Image 2) */}
          <Text style={styles.restrictNoteText}>
            Only approved fields are listed. Restricted data (contact details, prices, payments, internal notes) can never be added.
          </Text>

          {/* Section: Choose Export */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>
            Choose Export
          </Text>

          <View style={styles.exportFormatRow}>
            <TouchableOpacity
              style={[
                styles.exportFormatCard,
                selectedExportFormat === 'CSV' && styles.exportFormatCardActive,
              ]}
              onPress={() => setSelectedExportFormat('CSV')}
              activeOpacity={0.75}
            >
              <DocumentFileIcon
                size={22}
                color={
                  selectedExportFormat === 'CSV'
                    ? adminColors.brandDeep
                    : adminColors.ink
                }
              />
              <Text
                style={[
                  styles.exportFormatCardText,
                  selectedExportFormat === 'CSV' && styles.exportFormatCardTextActive,
                ]}
              >
                CSV
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.exportFormatCard,
                selectedExportFormat === 'PDF' && styles.exportFormatCardActive,
              ]}
              onPress={() => setSelectedExportFormat('PDF')}
              activeOpacity={0.75}
            >
              <DocumentFileIcon
                size={22}
                color={
                  selectedExportFormat === 'PDF'
                    ? adminColors.brandDeep
                    : adminColors.ink
                }
              />
              <Text
                style={[
                  styles.exportFormatCardText,
                  selectedExportFormat === 'PDF' && styles.exportFormatCardTextActive,
                ]}
              >
                PDF
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.exportPermissionNote}>
            Export permission (who may export, and to which formats) is not yet confirmed. Showing both options here is a placeholder until that's finalized.
          </Text>

          {/* Action Button: Export CSV / Export PDF */}
          <TouchableOpacity
            style={styles.generateReportBtn}
            onPress={() => handleExportAndPreview(selectedExportFormat)}
            activeOpacity={0.85}
          >
            <Text style={styles.generateReportBtnText}>Export {selectedExportFormat}</Text>
          </TouchableOpacity>

          <View style={styles.configBtnRow}>
            <TouchableOpacity
              style={styles.configOutlineBtn}
              onPress={handleResetFilters}
              activeOpacity={0.75}
            >
              <Text style={styles.configOutlineBtnText}>Reset Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.configOutlineBtn}
              onPress={() => setViewMode('reports')}
              activeOpacity={0.75}
            >
              <Text style={styles.configOutlineBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {renderPickerModal()}
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Screen 5: Report Preview & Export (Image 3 & 4: M13-S04)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header: ← Report Preview & Export (Image 3 & 4) */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setViewMode('report_config')}
            activeOpacity={0.7}
            accessibilityLabel="Back to Report Configuration"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <View style={styles.previewHeaderTitleWrap}>
            <Text style={styles.headerTitle}>Report Preview & Export</Text>
            <Text style={styles.previewHeaderSub}>
              {selectedReportItem?.title ?? 'Farmer Activity'} · RPT-2026-0001
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {toastMessage !== null && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastBannerText}>{toastMessage}</Text>
          </View>
        )}

        {/* Top Report Metadata Card (Image 3) */}
        <View style={styles.previewMetaCard}>
          <Text style={styles.metaFieldLabel}>Report name</Text>
          <Text style={styles.metaMainTitle}>{selectedReportItem?.title ?? 'Farmer Activity'}</Text>

          <View style={styles.metaTwoColRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaFieldLabel}>Report reference</Text>
              <Text style={styles.metaFieldValue}>RPT-2026-0001</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaFieldLabel}>Report status</Text>
              <Text style={styles.metaFieldValue}>Ready</Text>
            </View>
          </View>

          <View style={styles.metaTwoColRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaFieldLabel}>Generated at</Text>
              <Text style={styles.metaFieldValue}>10 Oct 2026, 10:00</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaFieldLabel}>Generated by</Text>
              <Text style={styles.metaFieldValue}>Suresh Kumar</Text>
            </View>
          </View>

          <View style={styles.metaSingleBlock}>
            <Text style={styles.metaFieldLabel}>Date range</Text>
            <Text style={styles.metaFieldValue}>10 Sep 2026 to 10 Oct 2026 (Last 30 Days)</Text>
          </View>

          <View style={styles.metaSingleBlock}>
            <Text style={styles.metaFieldLabel}>Applied filters</Text>
            <Text style={styles.metaFieldValue}>None</Text>
          </View>

          <View style={styles.metaSingleBlock}>
            <Text style={styles.metaFieldLabel}>Total records</Text>
            <Text style={styles.metaFieldValue}>28</Text>
          </View>
        </View>

        {/* Section: Summary (Image 3) */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total records</Text>
            <Text style={styles.summaryValue}>28</Text>
          </View>
          <View style={styles.summaryDashedLine} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Farmers</Text>
            <Text style={styles.summaryValue}>11</Text>
          </View>
        </View>

        {/* Section: Results (Image 3 & 4) */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Results</Text>

        <View style={styles.searchBox}>
          <SearchIcon size={18} color={adminColors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search within results"
            placeholderTextColor={adminColors.placeholder}
            value={resultsSearchQuery}
            onChangeText={setResultsSearchQuery}
          />
          {resultsSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setResultsSearchQuery('')} activeOpacity={0.7}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.resultsCountSubtitle}>
          {filteredPreviewRows.length} of 28 records
        </Text>

        {/* Table Container with Horizontal Scroll */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Table Header Row */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { width: 90 }]}>Farmer ID</Text>
                <Text style={[styles.tableHeaderCell, { width: 120 }]}>Farmer name</Text>
                <Text style={[styles.tableHeaderCell, { width: 90 }]}>Zone</Text>
                <Text style={[styles.tableHeaderCell, { width: 120 }]}>Activity type</Text>
                <Text style={[styles.tableHeaderCell, { width: 100 }]}>Activity date</Text>
                <Text style={[styles.tableHeaderCell, { width: 110 }]}>Activity status</Text>
              </View>

              {/* Table Data Rows */}
              {paginatedRows.map((row, idx) => (
                <View
                  key={row.id}
                  style={[styles.tableDataRow, idx % 2 === 1 && styles.tableDataRowAlt]}
                >
                  <Text style={[styles.tableDataCell, { width: 90 }]}>{row.farmerId}</Text>
                  <Text style={[styles.tableDataCell, { width: 120, fontWeight: '700' }]}>
                    {row.farmerName}
                  </Text>
                  <Text style={[styles.tableDataCell, { width: 90 }]}>{row.zone}</Text>
                  <Text style={[styles.tableDataCell, { width: 120 }]}>{row.activityType}</Text>
                  <Text style={[styles.tableDataCell, { width: 100 }]}>{row.activityDate}</Text>
                  <Text style={[styles.tableDataCell, { width: 110 }]}>{row.activityStatus}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Horizontal Scroll Track Indicator (Image 4) */}
          <View style={styles.scrollTrackRow}>
            <ScrollArrowLeftIcon />
            <View style={styles.scrollTrackBar}>
              <View style={styles.scrollTrackThumb} />
            </View>
            <ScrollArrowRightIcon />
          </View>
        </View>

        {/* Pagination Row (Image 4) */}
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
            disabled={currentPage === 1}
            onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          <Text style={styles.paginationCenterText}>
            Page {currentPage} of {totalPages} · {filteredPreviewRows.length} records
          </Text>

          <TouchableOpacity
            style={[styles.pageBtnNext, currentPage >= totalPages && styles.pageBtnDisabled]}
            disabled={currentPage >= totalPages}
            onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageBtnNextText, currentPage >= totalPages && styles.pageBtnTextDisabled]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rows per page selector (Image 4) */}
        <View style={styles.rowsPerPageRow}>
          <Text style={styles.rowsPerPageLabel}>Rows per page</Text>
          <TouchableOpacity
            style={styles.rowsPerPageDropdown}
            onPress={() => setPickerModalType('rows_per_page')}
            activeOpacity={0.8}
          >
            <Text style={styles.rowsPerPageValue}>{rowsPerPage}</Text>
            <ChevronDownIcon size={14} color={adminColors.ink} />
          </TouchableOpacity>
        </View>

        {/* Section: Exports (Image 4) */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Exports</Text>
        <View style={styles.recentReportsBox}>
          {exportHistory.length === 0 ? (
            <Text style={styles.recentReportsEmpty}>No exports yet.</Text>
          ) : (
            exportHistory.map((item, idx) => (
              <Text key={idx} style={styles.recentReportItemText}>
                • {item}
              </Text>
            ))
          )}
        </View>

        {/* Section: Export Action Buttons (Image 4) */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Export</Text>

        <View style={styles.exportActionBtnRow}>
          <TouchableOpacity
            style={styles.exportOutlineBtn}
            onPress={() => handleExport('CSV')}
            activeOpacity={0.8}
          >
            <Text style={styles.exportOutlineBtnText}>Export CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportOutlineBtn}
            onPress={() => handleExport('PDF')}
            activeOpacity={0.8}
          >
            <Text style={styles.exportOutlineBtnText}>Export PDF</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.generateReportBtn}
          onPress={() => handleExport('Report')}
          activeOpacity={0.85}
        >
          <Text style={styles.generateReportBtnText}>Export Report</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderPickerModal()}
    </SafeAreaView>
  );
}

// ─── Stylesheet (Strictly Using Admin Theme Tokens) ──────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flex: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flex: 1,
    marginLeft: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  previewHeaderTitleWrap: {
    flex: 1,
    marginLeft: adminSpacing.xs,
  },
  previewHeaderSub: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginTop: 2,
    fontWeight: '600',
  },
  headerShortcutBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: adminColors.headerIcon.bg,
    borderRadius: adminRadius.full,
  },
  headerShortcutText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    fontWeight: '700',
  },

  // ─── Quick View Mode Switcher ───
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    gap: adminSpacing.xs,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.canvas,
  },
  segmentBtnActive: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
  },
  segmentBtnText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // ─── Search Bar ───
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 9,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },
  clearSearchText: {
    ...adminType.caption,
    color: adminColors.muted,
    paddingHorizontal: 4,
    fontSize: 14,
  },

  // ─── Summary Count Row ───
  countRow: {
    marginBottom: adminSpacing.sm,
  },
  countText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  countBold: {
    fontWeight: '800',
    color: adminColors.ink,
  },

  // ─── Action Buttons: Filter & Refresh ───
  actionBtnRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  actionBtnActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  actionBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  actionBtnTextActive: {
    color: adminColors.brandDeep,
  },

  // ─── Filter Pills ───
  filterPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.md,
    backgroundColor: adminColors.card,
    padding: adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },

  // ─── Toast Notice ───
  toastBanner: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: adminRadius.md,
    marginBottom: adminSpacing.sm,
  },
  toastBannerText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
    textAlign: 'center',
  },

  // ─── Cards Container ───
  cardsContainer: {
    gap: adminSpacing.md,
  },

  // ─── Notification Card (Image 1) ───
  notificationCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  notificationCardUnread: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  notificationCardRead: {
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: 6,
  },
  cardIconBox: {
    width: 24,
    alignItems: 'center',
  },
  cardTitle: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unreadBadge: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    ...adminType.caption,
    fontSize: 10,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  actionRequiredBadge: {
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: adminRadius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  actionRequiredBadgeText: {
    ...adminType.caption,
    fontSize: 10,
    fontWeight: '800',
    color: adminColors.warning.text,
  },
  cardBodyText: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 18,
    marginTop: 2,
  },
  cardRefText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
    marginTop: 8,
  },
  cardMetaText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },

  // ─── System Alert Cards (Image 2) ───
  alertCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    position: 'relative',
    ...adminShadow.sm,
  },
  alertLeftStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
  },
  alertStripeCritical: {
    backgroundColor: adminColors.danger.text,
  },
  alertStripeWarning: {
    backgroundColor: adminColors.warning.text,
  },
  alertContentPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    paddingLeft: adminSpacing.lg + 2,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: 4,
  },
  alertIconBox: {
    width: 20,
    alignItems: 'center',
  },
  alertTitle: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
  },
  alertDetailText: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 18,
    marginTop: 2,
  },
  alertFooterText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 6,
  },

  // ─── Reports Catalogue (M13-S02) ───
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  catalogueList: {
    gap: adminSpacing.sm,
  },
  catalogueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
    ...adminShadow.sm,
  },
  catalogueCardSelected: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  catalogueTextCol: {
    flex: 1,
    paddingRight: adminSpacing.sm,
  },
  catalogueTitle: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
  },
  catalogueDesc: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
  },

  // ─── Configuration Card (M13-S02) ───
  configCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  configLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: adminColors.danger.text,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    backgroundColor: adminColors.card,
  },
  dropdownValueText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  dropdownFieldWrapper: {
    position: 'relative',
  },
  dropdownOverlayMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    overflow: 'hidden',
    zIndex: 100,
    ...adminShadow.md,
  },
  dropdownOptionRow: {
    paddingVertical: 12,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  dropdownOptionRowActive: {
    backgroundColor: adminColors.brand,
  },
  dropdownOptionLabel: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  dropdownOptionLabelActive: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  generateReportFooter: {
    paddingHorizontal: adminSpacing.lg,
    paddingBottom: adminSpacing.md,
    paddingTop: adminSpacing.xs,
    backgroundColor: adminColors.canvas,
  },

  // ─── Report Configuration Form (M13-S03B) ───
  configDropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    ...adminShadow.sm,
  },
  configDropdownValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  fieldNoteText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 5,
    lineHeight: 15,
  },
  columnsList: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  columnCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    gap: adminSpacing.sm,
  },
  columnCheckLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  restrictNoteText: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
    marginBottom: adminSpacing.lg,
  },
  exportFormatRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.xs,
  },
  exportFormatCard: {
    flex: 1,
    height: 76,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...adminShadow.sm,
  },
  exportFormatCardActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  exportFormatCardText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  exportFormatCardTextActive: {
    color: adminColors.brandDeep,
  },
  exportPermissionNote: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.lg,
  },
  configBtnRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  configOutlineBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configOutlineBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  recentReportsBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  recentReportsEmpty: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
  },
  recentReportItemText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
    paddingVertical: 4,
  },

  // ─── Report Preview & Export (M13-S04) ───
  previewMetaCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  metaFieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  metaMainTitle: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 2,
    marginBottom: adminSpacing.md,
  },
  metaTwoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  metaCol: {
    flex: 1,
  },
  metaFieldValue: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 2,
  },
  metaSingleBlock: {
    marginBottom: adminSpacing.md,
  },
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  summaryValue: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  summaryDashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    marginVertical: adminSpacing.sm,
  },
  resultsCountSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: adminColors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    paddingVertical: 10,
    paddingHorizontal: adminSpacing.md,
  },
  tableHeaderCell: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.ink,
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  tableDataRowAlt: {
    backgroundColor: adminColors.canvas,
  },
  tableDataCell: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  scrollTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  scrollTrackBar: {
    width: 140,
    height: 4,
    borderRadius: 2,
    backgroundColor: adminColors.border,
    overflow: 'hidden',
  },
  scrollTrackThumb: {
    width: 60,
    height: '100%',
    backgroundColor: adminColors.muted,
    borderRadius: 2,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  pageBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: adminColors.card,
  },
  pageBtnNext: {
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: adminColors.card,
  },
  pageBtnDisabled: {
    opacity: 0.4,
    borderColor: adminColors.border,
  },
  pageBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },
  pageBtnNextText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  pageBtnTextDisabled: {
    color: adminColors.muted,
  },
  paginationCenterText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  rowsPerPageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 12,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  rowsPerPageLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  rowsPerPageDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  rowsPerPageValue: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  exportActionBtnRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  exportOutlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    ...adminShadow.sm,
  },
  exportOutlineBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // ─── Generate Report Button ───
  generateReportBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.md,
  },
  generateReportBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },

  // ─── Modals ───
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.xl,
  },
  pickerModalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  pickerModalTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  pickerModalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  pickerModalOptionActive: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
  },
  pickerModalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  pickerModalOptionTextActive: {
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // ─── Empty State ───
  emptyState: {
    alignItems: 'center',
    paddingVertical: adminSpacing.xxl,
  },
  emptyTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  emptySub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
  },

  // ─── Bottom Tab Bar ───
  tabBar: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2.5,
  },
  tabLabelActive: {
    color: adminColors.brand,
    fontWeight: '800',
  },

  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
