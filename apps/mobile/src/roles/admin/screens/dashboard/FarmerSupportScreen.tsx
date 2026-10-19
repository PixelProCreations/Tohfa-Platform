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

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import {
  FarmerSupportFilterScreen,
  type SupportFilterValues,
} from './FarmerSupportFilterScreen';

// ─── SVG Icons Matching Exact Design Mockup ───────────────────────────────────

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

function ChevronDownIcon({ size = 14, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockActivityIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SlashCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function UploadFileIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 18v-6M9 15l3-3 3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ResizeCornerIcon({ size = 10, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <Line x1="8" y1="2" x2="2" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="5" x2="5" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function PersonAvatarIcon({ size = 32, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4.2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M4.5 20.5c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LeftTriangleIcon({ size = 10, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <Path d="M8 2L3 5l5 3V2z" fill={color} />
    </Svg>
  );
}

function RightTriangleIcon({ size = 10, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <Path d="M2 2l5 3-5 3V2z" fill={color} />
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

export interface SupportCommunicationNote {
  id: string;
  type: 'Internal Note' | 'Farmer Response' | 'Referral Note';
  author: string;
  date: string;
  message: string;
  attachment?: string | undefined;
}

export interface SupportHistoryItem {
  id: string;
  farmer: string;
  issue: string;
  timeAgo: string;
  status: 'Resolved' | 'Closed';
}

export interface FarmerSupportItem {
  id: string;
  subject: string;
  farmerName: string;
  farmerId: string;
  farmerPhone: string;
  zone: string;
  accountStatus: string;
  category: string;
  submittedDate: string;
  lastActivityDate: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  assignedTo: string;
  relatedRecord: string;
  relatedRecordType: string;
  relatedRecordStatus: string;
  relatedCrop: string;
  description: string;
  recentActivityUser: string;
  recentActivityTime: string;
  relevantFarmingType: string;
  registeredCrops: string;
  relatedProduceListing: string;
  relatedPurchaseOrder: string;
  relatedAudit: string;
  communicationNotes: SupportCommunicationNote[];
}

const SUPPORT_REQUESTS_DATA: readonly FarmerSupportItem[] = [
  {
    id: 'FS-00129',
    subject: 'Is neem oil approved for beans?',
    farmerName: 'Ramesh Kumar',
    farmerId: 'FR-00241',
    farmerPhone: '+91 98XXX XX241',
    zone: 'Coonoor',
    accountStatus: 'Active',
    category: 'Approved Inputs',
    submittedDate: '10 Oct 2026',
    lastActivityDate: '10 Oct 2026',
    status: 'Open',
    assignedTo: 'Not assigned',
    relatedRecord: 'INP-00042',
    relatedRecordType: 'Organic Input Formulation',
    relatedRecordStatus: 'Approved List',
    relatedCrop: 'Beans',
    description: 'Farmer is inquiring whether cold-pressed neem oil 1500ppm can be sprayed on bush beans during flowering stage.',
    recentActivityUser: 'Ramesh Kumar',
    recentActivityTime: '10 Oct 2026, 09:15',
    relevantFarmingType: 'Organic',
    registeredCrops: 'Tomato, Carrot, Beans',
    relatedProduceListing: 'PL-001245',
    relatedPurchaseOrder: 'PO-2026-00124',
    relatedAudit: 'AUD-2026-0031',
    communicationNotes: [],
  },
  {
    id: 'FS-00131',
    subject: 'I was not paid for my accepted produce',
    farmerName: 'Meena',
    farmerId: 'FR-00243',
    farmerPhone: '+91 98XXX XX243',
    zone: 'Coonoor',
    accountStatus: 'Active',
    category: 'Payment Information',
    submittedDate: '10 Oct 2026',
    lastActivityDate: '10 Oct 2026',
    status: 'Open',
    assignedTo: 'Not assigned',
    relatedRecord: 'PAY-2026-00084',
    relatedRecordType: 'Payment Voucher',
    relatedRecordStatus: 'Pending Verification',
    relatedCrop: 'Tomato',
    description: 'Produce accepted at Coonoor Collection Centre on 8 Oct 2026, payout not reflected in farmer bank account.',
    recentActivityUser: 'Meena',
    recentActivityTime: '10 Oct 2026, 08:45',
    relevantFarmingType: 'Organic Transition',
    registeredCrops: 'Tomato, Potato',
    relatedProduceListing: 'PL-001243',
    relatedPurchaseOrder: 'PO-2026-00119',
    relatedAudit: 'AUD-2026-0028',
    communicationNotes: [],
  },
  {
    id: 'FS-00130',
    subject: 'I do not understand my payment record',
    farmerName: 'Selvi',
    farmerId: 'FR-00242',
    farmerPhone: '+91 98XXX XX242',
    zone: 'Coonoor',
    accountStatus: 'Active',
    category: 'Payment Information',
    submittedDate: '9 Oct 2026',
    lastActivityDate: '9 Oct 2026',
    status: 'In Progress',
    assignedTo: 'Suresh Kumar',
    relatedRecord: 'PAY-2026-00081',
    relatedRecordType: 'Payment Slip',
    relatedRecordStatus: 'Processing',
    relatedCrop: 'Carrot',
    description: 'Farmer is requesting an itemized breakdown of deductions for grading moisture discrepancy on Carrot lot.',
    recentActivityUser: 'Selvi',
    recentActivityTime: '9 Oct 2026, 14:20',
    relevantFarmingType: 'Organic Certified',
    registeredCrops: 'Carrot, Cabbage, Beans',
    relatedProduceListing: 'PL-001238',
    relatedPurchaseOrder: 'PO-2026-00115',
    relatedAudit: 'AUD-2026-0025',
    communicationNotes: [],
  },
  {
    id: 'FS-00124',
    subject: 'Cannot see my listing approval status',
    farmerName: 'Ramesh Kumar',
    farmerId: 'FR-00241',
    farmerPhone: '+91 98XXX XX241',
    zone: 'Coonoor',
    accountStatus: 'Active',
    category: 'Produce Listing Assistance',
    submittedDate: '9 Oct 2026',
    lastActivityDate: '9 Oct 2026',
    status: 'Open',
    assignedTo: 'Not assigned',
    relatedRecord: 'PL-001245',
    relatedRecordType: 'Produce Listing',
    relatedRecordStatus: 'Pending Review',
    relatedCrop: 'Tomato',
    description: 'My produce listing has been submitted, but I cannot see the current approval status.',
    recentActivityUser: 'Ramesh Kumar',
    recentActivityTime: '9 Oct 2026, 09:10',
    relevantFarmingType: 'Organic',
    registeredCrops: 'Tomato, Carrot, Beans',
    relatedProduceListing: 'PL-001245',
    relatedPurchaseOrder: 'PO-2026-00124',
    relatedAudit: 'AUD-2026-0031',
    communicationNotes: [],
  },
  {
    id: 'FS-00125',
    subject: 'Question about the purchase quantity',
    farmerName: 'Selvi',
    farmerId: 'FR-00242',
    farmerPhone: '+91 98XXX XX242',
    zone: 'Coonoor',
    accountStatus: 'Active',
    category: 'Purchase Information',
    submittedDate: '8 Oct 2026',
    lastActivityDate: '9 Oct 2026',
    status: 'In Progress',
    assignedTo: 'Suresh Kumar',
    relatedRecord: 'PO-2026-00124',
    relatedRecordType: 'Purchase Order',
    relatedRecordStatus: 'Confirmed',
    relatedCrop: 'Carrot',
    description: 'Farmer confirmed 200 KG but purchase order shows 180 KG. Wants to reconcile the tare weight deduction.',
    recentActivityUser: 'Suresh Kumar',
    recentActivityTime: '9 Oct 2026, 11:30',
    relevantFarmingType: 'Organic Certified',
    registeredCrops: 'Carrot, Cabbage, Beans',
    relatedProduceListing: 'PL-001238',
    relatedPurchaseOrder: 'PO-2026-00115',
    relatedAudit: 'AUD-2026-0025',
    communicationNotes: [],
  },
  {
    id: 'FS-00126',
    subject: 'Organic certification renewal guidance',
    farmerName: 'Lakshmi',
    farmerId: 'FR-00244',
    farmerPhone: '+91 98XXX XX244',
    zone: 'Coonoor',
    accountStatus: 'Active',
    category: 'Certification Assistance',
    submittedDate: '7 Oct 2026',
    lastActivityDate: '8 Oct 2026',
    status: 'Open',
    assignedTo: 'Not assigned',
    relatedRecord: 'CERT-2026-0012',
    relatedRecordType: 'NPOP Certification',
    relatedRecordStatus: 'Renewal Required',
    relatedCrop: 'Tea',
    description: 'Farmer needs checklist for annual NPOP audit inspection scheduled for end of the month.',
    recentActivityUser: 'Lakshmi',
    recentActivityTime: '8 Oct 2026, 16:00',
    relevantFarmingType: 'Organic Certified',
    registeredCrops: 'Tea, Coffee, Pepper',
    relatedProduceListing: 'PL-001220',
    relatedPurchaseOrder: 'PO-2026-00098',
    relatedAudit: 'AUD-2026-0019',
    communicationNotes: [],
  },
  {
    id: 'FS-00127',
    subject: 'Collection center operating hours query',
    farmerName: 'Anand',
    farmerId: 'FR-00245',
    farmerPhone: '+91 98XXX XX245',
    zone: 'Kotagiri',
    accountStatus: 'Active',
    category: 'Logistics',
    submittedDate: '6 Oct 2026',
    lastActivityDate: '7 Oct 2026',
    status: 'Resolved',
    assignedTo: 'Suresh Kumar',
    relatedRecord: 'WH-2026-0003',
    relatedRecordType: 'Collection Hub',
    relatedRecordStatus: 'Operational',
    relatedCrop: 'Beetroot',
    description: 'Inquiring about weekend early intake window at Kotagiri collection center.',
    recentActivityUser: 'Suresh Kumar',
    recentActivityTime: '7 Oct 2026, 10:15',
    relevantFarmingType: 'Natural Farming',
    registeredCrops: 'Beetroot, Radish',
    relatedProduceListing: 'PL-001211',
    relatedPurchaseOrder: 'PO-2026-00089',
    relatedAudit: 'AUD-2026-0014',
    communicationNotes: [],
  },
  {
    id: 'FS-00128',
    subject: 'Pest identification sample upload confirmation',
    farmerName: 'Ramesh Kumar',
    farmerId: 'FR-00241',
    farmerPhone: '+91 98XXX XX241',
    zone: 'Coonoor',
    accountStatus: 'Active',
    category: 'Inputs & Pest',
    submittedDate: '5 Oct 2026',
    lastActivityDate: '6 Oct 2026',
    status: 'Resolved',
    assignedTo: 'Suresh Kumar',
    relatedRecord: 'INC-2026-0009',
    relatedRecordType: 'Pest Incident',
    relatedRecordStatus: 'Verified',
    relatedCrop: 'Tomato',
    description: 'Confirmed leaf curl virus diagnosis and recommended approved neem oil foliar spray treatment.',
    recentActivityUser: 'Ramesh Kumar',
    recentActivityTime: '6 Oct 2026, 17:40',
    relevantFarmingType: 'Organic',
    registeredCrops: 'Tomato, Carrot, Beans',
    relatedProduceListing: 'PL-001245',
    relatedPurchaseOrder: 'PO-2026-00124',
    relatedAudit: 'AUD-2026-0031',
    communicationNotes: [],
  },
];

const HISTORICAL_SUPPORT_TICKETS: readonly SupportHistoryItem[] = [
  {
    id: 'SUP-00905',
    farmer: 'Selvi',
    issue: 'Listing not approved',
    timeAgo: '5 days ago',
    status: 'Resolved',
  },
  {
    id: 'SUP-00884',
    farmer: 'Kumar',
    issue: 'Audit schedule query',
    timeAgo: '12 days ago',
    status: 'Resolved',
  },
  {
    id: 'SUP-00862',
    farmer: 'Meena',
    issue: 'Soil test report delay',
    timeAgo: '18 days ago',
    status: 'Resolved',
  },
  {
    id: 'SUP-00839',
    farmer: 'Ramesh Kumar',
    issue: 'Organic fertiliser usage',
    timeAgo: '25 days ago',
    status: 'Resolved',
  },
  {
    id: 'SUP-00812',
    farmer: 'Selvi',
    issue: 'Handover tare deduction reconciliation',
    timeAgo: '32 days ago',
    status: 'Resolved',
  },
];

export interface FarmerSupportScreenProps {
  onBack: () => void;
  onNavigateFarmerProfile?: (farmerId: string) => void;
  onNavigateProduceListing?: (listingId: string) => void;
  onTabChange?: (tab: 'Home' | 'Farmers' | 'Produce' | 'Audits' | 'More') => void;
}

export type FarmerSupportScreenMode =
  | 'list'
  | 'filters'
  | 'detail'
  | 'farmer_info'
  | 'farmer_profile'
  | 'communication'
  | 'resolution'
  | 'referral'
  | 'history';

export const DEFAULT_SUPPORT_FILTERS: SupportFilterValues = {
  searchQuery: '',
  status: 'Any',
  category: 'Any',
  submitted: 'Any',
  farmer: '',
  assignedTeam: 'Any',
};

export function FarmerSupportScreen({
  onBack,
  onNavigateFarmerProfile,
  onNavigateProduceListing,
  onTabChange,
}: FarmerSupportScreenProps) {
  // Screen modes:
  // 'list'           -> M12-S02 · Support Requests
  // 'filters'        -> Full Screen Search & Filters (Tohfa Theme)
  // 'detail'         -> M12-S04 · Request Detail
  // 'farmer_info'    -> M12-S05 · Farmer Information
  // 'farmer_profile' -> M2-S03 · Farmer Profile
  // 'communication'  -> Communication & Notes
  // 'resolution'     -> M12-S07 · Request Resolution
  // 'referral'       -> Referral (FS-00124 · Open)
  // 'history'        -> Support History (Search & Resolved items)
  const [screenMode, setScreenMode] = useState<FarmerSupportScreenMode>('list');
  const [requests, setRequests] = useState<readonly FarmerSupportItem[]>(SUPPORT_REQUESTS_DATA);
  const [selectedRequest, setSelectedRequest] = useState<FarmerSupportItem>(SUPPORT_REQUESTS_DATA[0]!);

  // Farmer Profile state (M2-S03)
  const [profileTab, setProfileTab] = useState<'Overview' | 'Farm' | 'Documents' | 'Audits' | 'Produce'>('Overview');

  // Search & Filter (List view)
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<SupportFilterValues>(DEFAULT_SUPPORT_FILTERS);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'In Progress' | 'Resolved'>('All');
  const [showFilterPills, setShowFilterPills] = useState(false);
  const [sortOrder, setSortOrder] = useState<'Newest first' | 'Oldest first'>('Newest first');
  const [showSortModal, setShowSortModal] = useState(false);

  // Pagination (List view)
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState<number>(5);
  const [showRecordsPerPageModal, setShowRecordsPerPageModal] = useState(false);

  // Communication & Notes form state
  const [commType, setCommType] = useState<'Internal Note' | 'Farmer Response' | 'Referral Note'>('Internal Note');
  const [showCommTypeModal, setShowCommTypeModal] = useState(false);
  const [commMessage, setCommMessage] = useState('');
  const [commAttachment, setCommAttachment] = useState<string | null>(null);

  // Resolution form state (M12-S07)
  const [resType, setResType] = useState('Select a type');
  const [showResTypeModal, setShowResTypeModal] = useState(false);
  const [resNotes, setResNotes] = useState('');
  const [resFarmerComm, setResFarmerComm] = useState('');
  const [resFollowUp, setResFollowUp] = useState('Select');
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  // Referral form state
  const [referralReason, setReferralReason] = useState('Select a reason');
  const [showReferralReasonModal, setShowReferralReasonModal] = useState(false);
  const [referralAssignTo, setReferralAssignTo] = useState('Select a team');
  const [showAssignToModal, setShowAssignToModal] = useState(false);
  const [referralNotes, setReferralNotes] = useState('');

  // Support History search query
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered & Sorted requests
  const filteredRequests = useMemo(() => {
    const q = (appliedFilters.searchQuery || searchQuery).trim().toLowerCase();
    const farmerQ = (appliedFilters.farmer || '').trim().toLowerCase();

    const list = requests.filter((item) => {
      // 1. Search Query
      if (q) {
        const matchesSearch =
          item.id.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          item.farmerName.toLowerCase().includes(q) ||
          item.farmerId.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Status
      if (appliedFilters.status !== 'Any') {
        if (item.status !== appliedFilters.status) return false;
      } else if (statusFilter !== 'All') {
        if (item.status !== statusFilter) return false;
      }

      // 3. Category
      if (appliedFilters.category !== 'Any') {
        if (item.category.toLowerCase() !== appliedFilters.category.toLowerCase()) return false;
      }

      // 4. Farmer
      if (farmerQ && farmerQ !== 'any farmer') {
        const matchesFarmer =
          item.farmerName.toLowerCase().includes(farmerQ) ||
          item.farmerId.toLowerCase().includes(farmerQ);
        if (!matchesFarmer) return false;
      }

      // 5. Assigned Team
      if (appliedFilters.assignedTeam !== 'Any') {
        if (appliedFilters.assignedTeam === 'Unassigned') {
          if (item.assignedTo !== 'Not assigned') return false;
        } else {
          const matchesTeam =
            item.assignedTo.toLowerCase().includes(appliedFilters.assignedTeam.toLowerCase()) ||
            (appliedFilters.assignedTeam === 'Farmer Support' && item.assignedTo.includes('Suresh'));
          if (!matchesTeam) return false;
        }
      }

      return true;
    });

    if (sortOrder === 'Oldest first') {
      return [...list].reverse();
    }
    return list;
  }, [requests, searchQuery, statusFilter, appliedFilters, sortOrder]);

  const hasActiveFilters =
    appliedFilters.status !== 'Any' ||
    appliedFilters.category !== 'Any' ||
    appliedFilters.submitted !== 'Any' ||
    (appliedFilters.farmer.trim().length > 0 && appliedFilters.farmer.toLowerCase() !== 'any farmer') ||
    appliedFilters.assignedTeam !== 'Any' ||
    appliedFilters.searchQuery.trim().length > 0;

  const totalPages = Math.ceil(filteredRequests.length / recordsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return filteredRequests.slice(start, start + recordsPerPage);
  }, [filteredRequests, currentPage, recordsPerPage]);

  // Filtered Support History tickets
  const filteredHistoryTickets = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    if (!q) return HISTORICAL_SUPPORT_TICKETS;
    return HISTORICAL_SUPPORT_TICKETS.filter(
      (item) =>
        item.id.toLowerCase().includes(q) ||
        item.farmer.toLowerCase().includes(q) ||
        item.issue.toLowerCase().includes(q),
    );
  }, [historySearchQuery]);

  const handleSaveNote = () => {
    if (!commMessage.trim()) {
      showToast('Please enter a note message');
      return;
    }
    const newNote: SupportCommunicationNote = {
      id: `NOTE-${Date.now()}`,
      type: commType,
      author: 'Suresh Kumar',
      date: 'Today, 14:30',
      message: commMessage.trim(),
      ...(commAttachment ? { attachment: commAttachment } : {}),
    };
    const updated = {
      ...selectedRequest,
      communicationNotes: [newNote, ...selectedRequest.communicationNotes],
    };
    setSelectedRequest(updated);
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setCommMessage('');
    setCommAttachment(null);
    showToast('Note saved successfully');
    setScreenMode('detail');
  };

  const handleReviewResolution = () => {
    if (resType === 'Select a type') {
      showToast('Please select a resolution type');
      return;
    }
    if (!resNotes.trim()) {
      showToast('Please describe the resolution action taken');
      return;
    }
    const updated: FarmerSupportItem = {
      ...selectedRequest,
      status: 'Resolved',
      lastActivityDate: '16 Oct 2026',
    };
    setSelectedRequest(updated);
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast(`Request ${selectedRequest.id} submitted for TOHFA approval`);
    setScreenMode('detail');
  };

  const handleReviewReferral = () => {
    if (referralReason === 'Select a reason') {
      showToast('Please select a referral reason');
      return;
    }
    if (referralAssignTo === 'Select a team') {
      showToast('Please select an assignment team');
      return;
    }
    const updated: FarmerSupportItem = {
      ...selectedRequest,
      assignedTo: referralAssignTo,
      lastActivityDate: '16 Oct 2026',
    };
    setSelectedRequest(updated);
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast(`Referral submitted to ${referralAssignTo}`);
    setScreenMode('detail');
  };

  // Bottom Navigation Bar
  const renderBottomTabBar = () => (
    <View style={styles.bottomBar}>
      <TouchableOpacity
        style={styles.bottomBarItem}
        onPress={() => onTabChange?.('Home')}
        activeOpacity={0.7}
      >
        <TabHomeIcon active={false} />
        <Text style={styles.bottomBarLabel}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomBarItem}
        onPress={() => onTabChange?.('Farmers')}
        activeOpacity={0.7}
      >
        <TabFarmersIcon active={false} />
        <Text style={styles.bottomBarLabel}>Farmers</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomBarItem}
        onPress={() => onTabChange?.('Produce')}
        activeOpacity={0.7}
      >
        <TabProduceIcon active={false} />
        <Text style={styles.bottomBarLabel}>Produce</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomBarItem}
        onPress={() => onTabChange?.('Audits')}
        activeOpacity={0.7}
      >
        <TabAuditsIcon active={false} />
        <Text style={styles.bottomBarLabel}>Audits</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomBarItem}
        onPress={() => onTabChange?.('More')}
        activeOpacity={0.7}
      >
        <TabMoreIcon active={true} />
        <Text style={[styles.bottomBarLabel, styles.bottomBarLabelActive]}>More</Text>
      </TouchableOpacity>
    </View>
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN: Full Screen Search & Filters (Tohfa Theme)
  // ───────────────────────────────────────────────────────────────────────────
  if (screenMode === 'filters') {
    return (
      <FarmerSupportFilterScreen
        initialFilters={{
          ...appliedFilters,
          searchQuery: searchQuery || appliedFilters.searchQuery,
        }}
        requestsData={requests}
        onBack={() => setScreenMode('list')}
        onCancel={() => setScreenMode('list')}
        onApply={(newFilters) => {
          setAppliedFilters(newFilters);
          setSearchQuery(newFilters.searchQuery);
          setCurrentPage(1);
          setScreenMode('list');
        }}
        onReset={() => {
          setAppliedFilters(DEFAULT_SUPPORT_FILTERS);
          setSearchQuery('');
          setCurrentPage(1);
        }}
      />
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 1: Support Requests List (Images 2 & 3: M12-S02)
  // ───────────────────────────────────────────────────────────────────────────
  if (screenMode === 'list') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header: ← Farmer Support */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityLabel="Back to More"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Farmer Support</Text>
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

          {/* Search Bar Input */}
          <View style={styles.searchBox}>
            <SearchIcon size={18} color={adminColors.placeholder} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by request ID, farmer, or subject"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setAppliedFilters((prev) => ({ ...prev, searchQuery: text }));
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setAppliedFilters((prev) => ({ ...prev, searchQuery: '' }));
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Row: Filters & Sort Dropdown */}
          <View style={styles.filterSortRow}>
            <TouchableOpacity
              style={[styles.outlineActionBtn, hasActiveFilters && styles.outlineActionBtnActive]}
              onPress={() => setScreenMode('filters')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Open Filters"
            >
              <FilterSlidersIcon size={16} color={hasActiveFilters ? adminColors.brandDeep : adminColors.ink} />
              <Text style={[styles.outlineActionBtnText, hasActiveFilters && styles.outlineActionBtnTextActive]}>
                Filters{hasActiveFilters ? ' •' : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => setShowSortModal(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.outlineActionBtnText}>{sortOrder}</Text>
              <ChevronDownIcon size={14} color={adminColors.ink} />
            </TouchableOpacity>
          </View>

          {/* Active Filter Chips / Clear button (when filters active) */}
          {hasActiveFilters && (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {appliedFilters.status !== 'Any' && (
                <View style={styles.filterPillActive}>
                  <Text style={styles.filterPillTextActive}>Status: {appliedFilters.status}</Text>
                </View>
              )}
              {appliedFilters.category !== 'Any' && (
                <View style={styles.filterPillActive}>
                  <Text style={styles.filterPillTextActive}>{appliedFilters.category}</Text>
                </View>
              )}
              {appliedFilters.farmer.trim().length > 0 && appliedFilters.farmer.toLowerCase() !== 'any farmer' && (
                <View style={styles.filterPillActive}>
                  <Text style={styles.filterPillTextActive}>Farmer: {appliedFilters.farmer}</Text>
                </View>
              )}
              {appliedFilters.assignedTeam !== 'Any' && (
                <View style={styles.filterPillActive}>
                  <Text style={styles.filterPillTextActive}>{appliedFilters.assignedTeam}</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  setAppliedFilters(DEFAULT_SUPPORT_FILTERS);
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                style={[styles.filterPill, { backgroundColor: adminColors.card }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, { color: adminColors.danger.text, fontWeight: '700' }]}>✕ Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Matching Requests Text */}
          <Text style={styles.matchingRequestsText}>
            {filteredRequests.length} matching requests
          </Text>

          {/* Request Cards */}
          <View style={styles.cardsList}>
            {paginatedRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No matching requests</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your filter or search query</Text>
              </View>
            ) : (
              paginatedRequests.map((item) => {
                const isOpen = item.status === 'Open';
                const isInProg = item.status === 'In Progress';
                return (
                  <View key={item.id} style={styles.requestCard}>
                    <Text style={styles.cardId}>{item.id}</Text>
                    <Text style={styles.cardSubject}>{item.subject}</Text>

                    <Text style={styles.cardFarmerRow}>
                      Farmer: {item.farmerName} · {item.farmerId}
                    </Text>
                    <Text style={styles.cardCategoryText}>{item.category}</Text>
                    <Text style={styles.cardDatesText}>
                      Submitted {item.submittedDate} · Last activity {item.lastActivityDate}
                    </Text>

                    <View style={styles.cardStatusRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          isOpen
                            ? styles.statusBadgeOpen
                            : isInProg
                            ? styles.statusBadgeInProg
                            : styles.statusBadgeResolved,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isOpen
                              ? styles.statusBadgeTextOpen
                              : isInProg
                              ? styles.statusBadgeTextInProg
                              : styles.statusBadgeTextResolved,
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    {/* View Details Button */}
                    <TouchableOpacity
                      style={styles.viewDetailsBtn}
                      onPress={() => {
                        setSelectedRequest(item);
                        setScreenMode('detail');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewDetailsBtnText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* Pagination Row */}
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
              Page {currentPage} of {totalPages} · {filteredRequests.length} total
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

          {/* Records per page selector */}
          <View style={styles.recordsPerPageRow}>
            <Text style={styles.recordsPerPageLabel}>Records per page</Text>
            <TouchableOpacity
              style={styles.recordsPerPageDropdown}
              onPress={() => setShowRecordsPerPageModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.recordsPerPageValue}>{recordsPerPage}</Text>
              <ChevronDownIcon size={14} color={adminColors.ink} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Sort Modal */}
        <Modal
          visible={showSortModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSortModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
            <View style={styles.pickerModalCard}>
              <Text style={styles.pickerModalTitle}>Sort Requests</Text>
              {(['Newest first', 'Oldest first'] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pickerModalOption, sortOrder === opt && styles.pickerModalOptionActive]}
                  onPress={() => {
                    setSortOrder(opt);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[styles.pickerModalOptionText, sortOrder === opt && styles.pickerModalOptionTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Records Per Page Modal */}
        <Modal
          visible={showRecordsPerPageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRecordsPerPageModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowRecordsPerPageModal(false)}>
            <View style={styles.pickerModalCard}>
              <Text style={styles.pickerModalTitle}>Records per page</Text>
              {[5, 10, 20].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.pickerModalOption, recordsPerPage === num && styles.pickerModalOptionActive]}
                  onPress={() => {
                    setRecordsPerPage(num);
                    setCurrentPage(1);
                    setShowRecordsPerPageModal(false);
                  }}
                >
                  <Text style={[styles.pickerModalOptionText, recordsPerPage === num && styles.pickerModalOptionTextActive]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Modal removed / No bottom bar on inner screens */}
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 2: Request Detail (Images 4 & 5: M12-S04)
  // ───────────────────────────────────────────────────────────────────────────
  if (screenMode === 'detail') {
    const isOpen = selectedRequest.status === 'Open';

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header: ← Request */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setScreenMode('list')}
              activeOpacity={0.7}
              accessibilityLabel="Back to Requests"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <View style={styles.detailHeaderTitleCol}>
              <Text style={styles.headerTitle}>Request</Text>
              <Text style={styles.detailHeaderSub}>
                {selectedRequest.id} · {selectedRequest.status}
              </Text>
            </View>

            <View style={{ width: 36 }} />
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

          {/* Section: Farmer */}
          <Text style={styles.sectionHeaderTitle}>Farmer</Text>
          <View style={styles.detailCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Name</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.farmerName}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Farmer ID</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.farmerId}</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Phone</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.farmerPhone}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Zone</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.zone}</Text>
              </View>
            </View>
          </View>

          {/* Request Information Card */}
          <View style={[styles.detailCard, { marginTop: adminSpacing.md }]}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Request ID</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.id}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Status</Text>
                <Text
                  style={[
                    styles.detailFieldValue,
                    isOpen ? { color: adminColors.warning.text } : { color: adminColors.info.text },
                  ]}
                >
                  {selectedRequest.status}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: adminSpacing.md }}>
              <Text style={styles.detailFieldLabel}>Subject</Text>
              <Text style={styles.detailSubjectValue}>{selectedRequest.subject}</Text>
            </View>

            <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Submitted</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.submittedDate}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Last updated</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.lastActivityDate}</Text>
              </View>
            </View>
          </View>

          {/* Section: Request overview */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Request overview</Text>
          <View style={styles.detailCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Category</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.category}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Assigned to</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.assignedTo}</Text>
              </View>
            </View>
          </View>

          {/* View Farmer Information (Image 4 -> opens M12-S05) */}
          <TouchableOpacity
            style={styles.detailOutlineBtn}
            onPress={() => setScreenMode('farmer_info')}
            activeOpacity={0.8}
          >
            <Text style={styles.detailOutlineBtnText}>View Farmer Information</Text>
          </TouchableOpacity>

          {/* Section: Related TOHFA record */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Related TOHFA record</Text>
          <View style={styles.detailCard}>
            <Text style={styles.relatedSub}>{selectedRequest.relatedRecordType} {selectedRequest.relatedRecord}</Text>
            <Text style={styles.relatedStatusBold}>Current status: {selectedRequest.relatedRecordStatus}</Text>

            <Text style={[styles.detailFieldLabel, { marginTop: adminSpacing.md }]}>Crop</Text>
            <Text style={styles.detailFieldValue}>{selectedRequest.relatedCrop}</Text>
          </View>

          <TouchableOpacity
            style={styles.detailOutlineBtn}
            onPress={() => {
              if (onNavigateProduceListing) {
                onNavigateProduceListing(selectedRequest.relatedRecord);
              } else {
                showToast(`Viewing read-only record ${selectedRequest.relatedRecord}`);
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.detailOutlineBtnText}>View Related Record</Text>
          </TouchableOpacity>
          <Text style={styles.readOnlyNote}>Opens the read-only record; nothing can be edited from here.</Text>

          {/* Section: Request description */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Request description</Text>
          <View style={styles.detailCard}>
            <Text style={styles.descriptionBodyText}>{selectedRequest.description}</Text>
          </View>

          {/* Section: Recent activity */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Recent activity</Text>
          <View style={styles.detailCard}>
            <View style={styles.activityRow}>
              <ClockActivityIcon size={18} color={adminColors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitleText}>Request submitted</Text>
                <Text style={styles.activityMetaText}>
                  {selectedRequest.recentActivityUser} · {selectedRequest.recentActivityTime}
                </Text>
              </View>
            </View>
          </View>

          {/* View Full History (Opens Support History screen) */}
          <TouchableOpacity
            style={styles.detailOutlineBtn}
            onPress={() => setScreenMode('history')}
            activeOpacity={0.8}
          >
            <Text style={styles.detailOutlineBtnText}>View Full History</Text>
          </TouchableOpacity>

          {/* Section: Actions */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Actions</Text>
          <TouchableOpacity
            style={styles.actionOutlineBtn}
            onPress={() => {
              setCommType('Internal Note');
              setScreenMode('communication');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionOutlineBtnText}>Add Note</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionOutlineBtn}
            onPress={() => {
              setCommType('Farmer Response');
              setScreenMode('communication');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionOutlineBtnText}>Record Response</Text>
          </TouchableOpacity>

          {/* Refer to TOHFA Team (Opens Referral screen) */}
          <TouchableOpacity
            style={styles.actionOutlineBtn}
            onPress={() => setScreenMode('referral')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionOutlineBtnText}>Refer to TOHFA Team</Text>
          </TouchableOpacity>

          {/* Primary Resolve Request Button (Opens M12-S07 Request Resolution) */}
          <TouchableOpacity
            style={[styles.primaryResolveBtn, selectedRequest.status === 'Resolved' && styles.primaryResolveBtnDone]}
            onPress={() => setScreenMode('resolution')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryResolveBtnText}>
              {selectedRequest.status === 'Resolved' ? 'Request Resolved' : 'Resolve Request'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 3: M12-S05 · Farmer Information (Images 1 & 2)
  // ───────────────────────────────────────────────────────────────────────────
  if (screenMode === 'farmer_info') {
    const farmerInitial = selectedRequest.farmerName.charAt(0).toUpperCase() || 'F';
    const relatedFarmerRequests = requests.filter(
      (r) => r.farmerId === selectedRequest.farmerId,
    );

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header: ← Farmer Information */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setScreenMode('detail')}
                activeOpacity={0.7}
                accessibilityLabel="Back to Request Detail"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Farmer Information</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Farmer Identity */}
          <View style={styles.farmerIdentityCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{farmerInitial}</Text>
              </View>
              <View style={{ marginLeft: adminSpacing.md, flex: 1 }}>
                <Text style={styles.farmerNameTitle}>{selectedRequest.farmerName}</Text>
                <Text style={styles.farmerIdSub}>{selectedRequest.farmerId}</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: adminSpacing.lg }]}>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Zone</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.zone}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Account status</Text>
                <Text style={[styles.detailFieldValue, { color: adminColors.success.text }]}>
                  {selectedRequest.accountStatus}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: adminSpacing.md }}>
              <Text style={styles.detailFieldLabel}>Registered contact</Text>
              <Text style={styles.detailFieldValue}>{selectedRequest.farmerPhone}</Text>
            </View>
          </View>

          <Text style={styles.readOnlyNote}>
            Contact details are masked and shown only where you are authorized.
          </Text>

          {/* Section: Relevant farming information */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>
            Relevant farming information
          </Text>
          <View style={styles.detailCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Farming type</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.relevantFarmingType}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Registered crops</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.registeredCrops}</Text>
              </View>
            </View>
          </View>

          {/* Section: Related records */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>
            Related records
          </Text>
          <View style={styles.detailCard}>
            {/* Produce listings */}
            <View style={styles.recordLinkRow}>
              <Text style={styles.recordLinkLabel}>Produce listings</Text>
              <TouchableOpacity
                onPress={() => {
                  if (onNavigateProduceListing) {
                    onNavigateProduceListing(selectedRequest.relatedProduceListing);
                  } else {
                    showToast(`Opening ${selectedRequest.relatedProduceListing}`);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.recordLinkValue}>{selectedRequest.relatedProduceListing}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dashedDivider} />

            {/* Purchase records */}
            <View style={styles.recordLinkRow}>
              <Text style={styles.recordLinkLabel}>Purchase records</Text>
              <TouchableOpacity
                onPress={() => showToast(`Opening ${selectedRequest.relatedPurchaseOrder}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.recordLinkValue}>{selectedRequest.relatedPurchaseOrder}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dashedDivider} />

            {/* Audit records */}
            <View style={styles.recordLinkRow}>
              <Text style={styles.recordLinkLabel}>Audit records</Text>
              <TouchableOpacity
                onPress={() => showToast(`Opening ${selectedRequest.relatedAudit}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.recordLinkValue}>{selectedRequest.relatedAudit}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.readOnlyNote}>
            Read-only. Only records connected to this farmer are shown.
          </Text>

          {/* Section: Related support requests */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>
            Related support requests
          </Text>
          <View style={styles.cardsList}>
            {relatedFarmerRequests.map((req) => (
              <View key={req.id} style={styles.relatedRequestCard}>
                <Text style={styles.relatedRequestTitle}>
                  {req.id} · {req.subject}
                </Text>
                <Text style={styles.cardCategoryText}>{req.category}</Text>
                <Text style={styles.cardDatesText}>
                  Submitted {req.submittedDate} · Last updated {req.lastActivityDate}
                </Text>

                <View style={styles.relatedRequestStatusRow}>
                  <View style={styles.statusBadgeOpen}>
                    <Text style={styles.statusBadgeTextOpen}>{req.status}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={{ marginTop: adminSpacing.sm }}
                  onPress={() => {
                    setSelectedRequest(req);
                    setScreenMode('detail');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewRequestLinkText}>View Request</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Open full Farmer Profile Button (Image 1 / M2-S03) */}
          <TouchableOpacity
            style={[styles.actionOutlineBtn, { marginTop: adminSpacing.xl }]}
            onPress={() => {
              setScreenMode('farmer_profile');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionOutlineBtnText}>Open full Farmer Profile</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 3.5: M2-S03 · Farmer Profile (Image 1)
  // ───────────────────────────────────────────────────────────────────────────
  if (screenMode === 'farmer_profile') {
    const subtitle = `${selectedRequest.farmerId} · ${selectedRequest.relevantFarmingType} Farmer · ${selectedRequest.zone}`;

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header: ← Farmer Profile */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setScreenMode('farmer_info')}
                activeOpacity={0.7}
                accessibilityLabel="Back to Farmer Information"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Farmer Profile</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Hero Card */}
          <View style={styles.profileHeroCard}>
            <View style={styles.profileAvatarCircle}>
              <PersonAvatarIcon size={34} color={adminColors.brandDeep} />
            </View>
            <Text style={styles.profileHeroName}>{selectedRequest.farmerName}</Text>
            <Text style={styles.profileHeroSubtitle}>{subtitle}</Text>
            <View style={styles.profileActiveBadge}>
              <Text style={styles.profileActiveBadgeText}>{selectedRequest.accountStatus}</Text>
            </View>
          </View>

          {/* Horizontal Tabs: Overview, Farm, Documents, Audits, Produce */}
          <View style={styles.profileTabsWrapper}>
            <View style={styles.profileTabsRow}>
              {(['Overview', 'Farm', 'Documents', 'Audits', 'Produce'] as const).map((tab) => {
                const isActive = profileTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.profileTabBtn, isActive && styles.profileTabBtnActive]}
                    onPress={() => setProfileTab(tab)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.profileTabBtnText,
                        isActive && styles.profileTabBtnTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Slider track indicator */}
            <View style={styles.profileSliderBar}>
              <TouchableOpacity
                style={styles.profileSliderArrow}
                onPress={() => setProfileTab('Overview')}
                activeOpacity={0.7}
              >
                <LeftTriangleIcon size={10} color={adminColors.muted} />
              </TouchableOpacity>

              <View style={styles.profileSliderTrack}>
                <View
                  style={[
                    styles.profileSliderThumb,
                    profileTab === 'Overview' && { alignSelf: 'flex-start' },
                    profileTab === 'Farm' && { alignSelf: 'center', marginLeft: -40 },
                    profileTab === 'Documents' && { alignSelf: 'center' },
                    profileTab === 'Audits' && { alignSelf: 'center', marginRight: -40 },
                    profileTab === 'Produce' && { alignSelf: 'flex-end' },
                  ]}
                />
              </View>

              <TouchableOpacity
                style={styles.profileSliderArrow}
                onPress={() => setProfileTab('Produce')}
                activeOpacity={0.7}
              >
                <RightTriangleIcon size={10} color={adminColors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Details Card (Tab Content) */}
          {profileTab === 'Overview' && (
            <View style={styles.profileDetailsCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Farmer Name</Text>
                  <Text style={styles.profileDetailValue}>{selectedRequest.farmerName}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Farmer ID</Text>
                  <Text style={styles.profileDetailValue}>{selectedRequest.farmerId}</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Zone</Text>
                  <Text style={styles.profileDetailValue}>{selectedRequest.zone}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Farming Method</Text>
                  <Text style={styles.profileDetailValue}>{selectedRequest.relevantFarmingType}</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Account Status</Text>
                  <Text style={styles.profileDetailValue}>{selectedRequest.accountStatus}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Certification</Text>
                  <Text style={styles.profileDetailValue}>Certified</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Farm Count</Text>
                  <Text style={styles.profileDetailValue}>1</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Listing Count</Text>
                  <Text style={styles.profileDetailValue}>18</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Rating</Text>
                  <Text style={styles.profileDetailValue}>4.6 ★</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Audit Status</Text>
                  <Text style={styles.profileDetailValue}>Upcoming</Text>
                </View>
              </View>
            </View>
          )}

          {profileTab === 'Farm' && (
            <View style={styles.profileDetailsCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Farm ID</Text>
                  <Text style={styles.profileDetailValue}>FARM-0088</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Location</Text>
                  <Text style={styles.profileDetailValue}>{selectedRequest.zone}</Text>
                </View>
              </View>
              <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Farm Area</Text>
                  <Text style={styles.profileDetailValue}>4.2 acres</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Registered Crops</Text>
                  <Text style={styles.profileDetailValue}>{selectedRequest.registeredCrops}</Text>
                </View>
              </View>
            </View>
          )}

          {profileTab === 'Documents' && (
            <View style={styles.profileDetailsCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Organic Certification</Text>
                  <Text style={styles.profileDetailValue}>NPOP-2026-8812</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Status</Text>
                  <Text style={[styles.profileDetailValue, { color: adminColors.success.text }]}>Verified</Text>
                </View>
              </View>
              <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Soil Health Card</Text>
                  <Text style={styles.profileDetailValue}>SHC-CN-2026</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Status</Text>
                  <Text style={[styles.profileDetailValue, { color: adminColors.success.text }]}>On File</Text>
                </View>
              </View>
            </View>
          )}

          {profileTab === 'Audits' && (
            <View style={styles.profileDetailsCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Last Audit</Text>
                  <Text style={styles.profileDetailValue}>Completed</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Next Audit</Text>
                  <Text style={styles.profileDetailValue}>24 Oct 2026</Text>
                </View>
              </View>
              <View style={{ marginTop: adminSpacing.md }}>
                <Text style={styles.profileDetailLabel}>Audit Record</Text>
                <Text style={styles.profileDetailValue}>{selectedRequest.relatedAudit}</Text>
              </View>
            </View>
          )}

          {profileTab === 'Produce' && (
            <View style={styles.profileDetailsCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Total Listings</Text>
                  <Text style={styles.profileDetailValue}>18 Listed</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.profileDetailLabel}>Active Listing</Text>
                  <Text style={styles.profileDetailValue}>{selectedRequest.relatedProduceListing}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 4: Communication & Notes (Image 3)
  // ───────────────────────────────────────────────────────────────────────────
  if (screenMode === 'communication') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header: ← Communication & Notes */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setScreenMode('detail')}
                activeOpacity={0.7}
                accessibilityLabel="Back to Request Detail"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Communication & Notes</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Communication history */}
          <Text style={styles.sectionHeaderTitle}>Communication history</Text>
          <View style={styles.detailCard}>
            {selectedRequest.communicationNotes.length === 0 ? (
              <Text style={styles.emptyCommHistoryText}>No notes or responses recorded yet.</Text>
            ) : (
              selectedRequest.communicationNotes.map((note) => (
                <View key={note.id} style={styles.commNoteItem}>
                  <View style={styles.commNoteHeader}>
                    <Text style={styles.commNoteAuthor}>{note.author}</Text>
                    <Text style={styles.commNoteDate}>{note.date}</Text>
                  </View>
                  <View style={styles.commNoteTypeBadge}>
                    <Text style={styles.commNoteTypeBadgeText}>{note.type}</Text>
                  </View>
                  <Text style={styles.commNoteMessage}>{note.message}</Text>
                  {note.attachment && (
                    <Text style={styles.commNoteAttachmentText}>📎 {note.attachment}</Text>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Section: Add communication */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>
            Add communication
          </Text>
          <View style={styles.detailCard}>
            {/* Communication type selector */}
            <Text style={styles.formInputLabel}>Communication type *</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setShowCommTypeModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectorValue}>{commType}</Text>
              <ChevronDownIcon size={14} color={adminColors.ink} />
            </TouchableOpacity>

            {/* Contextual Info Pill */}
            <View style={styles.infoPillBanner}>
              <Text style={styles.infoPillBannerText}>
                {commType === 'Internal Note'
                  ? 'Internal note: only admins can see it. It is never sent to the farmer.'
                  : commType === 'Farmer Response'
                  ? 'Farmer response: this message will be recorded and sent to the farmer.'
                  : 'Referral note: shared with the specialized TOHFA team handling this inquiry.'}
              </Text>
            </View>

            {/* Message field */}
            <Text style={[styles.formInputLabel, { marginTop: adminSpacing.md }]}>Message *</Text>
            <View style={styles.textareaWrapper}>
              <TextInput
                style={styles.textareaInput}
                placeholder="Enter your message or support notes..."
                placeholderTextColor={adminColors.placeholder}
                value={commMessage}
                onChangeText={setCommMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.textareaResizeHandle}>
                <ResizeCornerIcon size={10} color={adminColors.muted} />
              </View>
            </View>

            {/* Attachment */}
            <Text style={[styles.formInputLabel, { marginTop: adminSpacing.md }]}>
              Attachment (optional)
            </Text>
            <TouchableOpacity
              style={styles.uploadDottedBox}
              onPress={() => {
                if (commAttachment) {
                  setCommAttachment(null);
                  showToast('Attachment removed');
                } else {
                  setCommAttachment('support_doc_scan.pdf');
                  showToast('Attached: support_doc_scan.pdf');
                }
              }}
              activeOpacity={0.75}
            >
              <UploadFileIcon size={20} color={adminColors.ink} />
              <Text style={styles.uploadDottedText}>
                {commAttachment ? `Attached: ${commAttachment} (Tap to remove)` : 'Upload file'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Buttons: Save Note & Cancel */}
          <View style={{ marginTop: adminSpacing.xl, gap: adminSpacing.md }}>
            <TouchableOpacity
              style={styles.primaryResolveBtn}
              onPress={handleSaveNote}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryResolveBtnText}>Save Note</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => setScreenMode('detail')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionOutlineBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Communication Type Modal */}
        <Modal
          visible={showCommTypeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCommTypeModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowCommTypeModal(false)}>
            <View style={styles.pickerModalCard}>
              <Text style={styles.pickerModalTitle}>Communication Type</Text>
              {(['Internal Note', 'Farmer Response', 'Referral Note'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pickerModalOption, commType === type && styles.pickerModalOptionActive]}
                  onPress={() => {
                    setCommType(type);
                    setShowCommTypeModal(false);
                  }}
                >
                  <Text style={[styles.pickerModalOptionText, commType === type && styles.pickerModalOptionTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 5: Referral Screen (New Screenshot Left)
  // ───────────────────────────────────────────────────────────────────────────
  if (screenMode === 'referral') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header: ← Referral */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setScreenMode('detail')}
              activeOpacity={0.7}
              accessibilityLabel="Back to Request Detail"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <View style={styles.detailHeaderTitleCol}>
              <Text style={styles.headerTitle}>Referral</Text>
              <Text style={styles.detailHeaderSub}>
                {selectedRequest.id} · {selectedRequest.status}
              </Text>
            </View>

            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Referral information */}
          <Text style={styles.sectionHeaderTitle}>Referral information</Text>
          <View style={styles.detailCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Request</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.id}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Status</Text>
                <Text
                  style={[
                    styles.detailFieldValue,
                    selectedRequest.status === 'Open'
                      ? { color: adminColors.warning.text }
                      : { color: adminColors.info.text },
                  ]}
                >
                  {selectedRequest.status}
                </Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Farmer</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.farmerName}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.detailFieldLabel}>Category</Text>
                <Text style={styles.detailFieldValue}>{selectedRequest.category}</Text>
              </View>
            </View>

            <View style={{ marginTop: adminSpacing.md }}>
              <Text style={styles.detailFieldLabel}>Referral reason</Text>
              <Text style={styles.detailSubjectValue}>
                {referralReason === 'Select a reason' ? 'Not selected yet' : referralReason}
              </Text>
            </View>
          </View>

          {/* Section: Referral */}
          <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Referral</Text>
          <View style={styles.detailCard}>
            {/* Referral Reason Dropdown */}
            <Text style={styles.formInputLabel}>Referral Reason *</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setShowReferralReasonModal(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dropdownSelectorValue,
                  referralReason === 'Select a reason' && { color: adminColors.placeholder },
                ]}
              >
                {referralReason}
              </Text>
              <ChevronDownIcon size={14} color={adminColors.ink} />
            </TouchableOpacity>

            <Text style={styles.proposedApprovalNote}>
              Reasons are a proposed list, pending TOHFA confirmation.
            </Text>

            {/* Assign To Dropdown */}
            <Text style={[styles.formInputLabel, { marginTop: adminSpacing.md }]}>Assign To *</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setShowAssignToModal(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dropdownSelectorValue,
                  referralAssignTo === 'Select a team' && { color: adminColors.placeholder },
                ]}
              >
                {referralAssignTo}
              </Text>
              <ChevronDownIcon size={14} color={adminColors.ink} />
            </TouchableOpacity>

            {/* Referral Notes */}
            <Text style={[styles.formInputLabel, { marginTop: adminSpacing.md }]}>
              Referral Notes *
            </Text>
            <View style={styles.textareaWrapper}>
              <TextInput
                style={styles.textareaInput}
                placeholder="Explain why this request requires further review."
                placeholderTextColor={adminColors.placeholder}
                value={referralNotes}
                onChangeText={setReferralNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.textareaResizeHandle}>
                <ResizeCornerIcon size={10} color={adminColors.muted} />
              </View>
            </View>
          </View>

          {/* Action Buttons: Review Referral & Cancel */}
          <View style={{ marginTop: adminSpacing.xl, gap: adminSpacing.md }}>
            <TouchableOpacity
              style={styles.primaryResolveBtn}
              onPress={handleReviewReferral}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryResolveBtnText}>Review Referral</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => setScreenMode('detail')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionOutlineBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Referral Reason Modal */}
        <Modal
          visible={showReferralReasonModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowReferralReasonModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowReferralReasonModal(false)}>
            <View style={styles.pickerModalCard}>
              <Text style={styles.pickerModalTitle}>Referral Reason</Text>
              {[
                'Technical Issue / Bug',
                'Payment Discrepancy',
                'Policy / Governance Clarification',
                'Complex Dispute Escalation',
                'Warehouse Operations Review',
              ].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[styles.pickerModalOption, referralReason === reason && styles.pickerModalOptionActive]}
                  onPress={() => {
                    setReferralReason(reason);
                    setShowReferralReasonModal(false);
                  }}
                >
                  <Text style={[styles.pickerModalOptionText, referralReason === reason && styles.pickerModalOptionTextActive]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Assign To Modal */}
        <Modal
          visible={showAssignToModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAssignToModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowAssignToModal(false)}>
            <View style={styles.pickerModalCard}>
              <Text style={styles.pickerModalTitle}>Assign To</Text>
              {[
                'TOHFA Central Operations',
                'Finance & Settlements Team',
                'Quality & Certification Team',
                'Warehouse Management Team',
                'Platform Tech Support',
              ].map((team) => (
                <TouchableOpacity
                  key={team}
                  style={[styles.pickerModalOption, referralAssignTo === team && styles.pickerModalOptionActive]}
                  onPress={() => {
                    setReferralAssignTo(team);
                    setShowAssignToModal(false);
                  }}
                >
                  <Text style={[styles.pickerModalOptionText, referralAssignTo === team && styles.pickerModalOptionTextActive]}>
                    {team}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 6: Support History Screen (New Screenshot Right)
  // ───────────────────────────────────────────────────────────────────────────
  if (screenMode === 'history') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header: ← Support History */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setScreenMode('detail')}
                activeOpacity={0.7}
                accessibilityLabel="Back to Request Detail"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Support History</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search box: Request ID, farmer */}
          <View style={styles.searchBox}>
            <SearchIcon size={18} color={adminColors.placeholder} />
            <TextInput
              style={styles.searchInput}
              placeholder="Request ID, farmer"
              placeholderTextColor={adminColors.placeholder}
              value={historySearchQuery}
              onChangeText={setHistorySearchQuery}
            />
            {historySearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setHistorySearchQuery('')} activeOpacity={0.7}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Historical Support Tickets List */}
          <View style={[styles.cardsList, { marginTop: adminSpacing.md }]}>
            {filteredHistoryTickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No support history found</Text>
                <Text style={styles.emptySubtitle}>Try searching by a different ID or farmer name</Text>
              </View>
            ) : (
              filteredHistoryTickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.historyTicketCard}
                  onPress={() => showToast(`Viewing archived ticket ${ticket.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.historyTicketTopRow}>
                    <Text style={styles.historyTicketId}>{ticket.id}</Text>
                    <View style={styles.statusBadgeResolved}>
                      <Text style={styles.statusBadgeTextResolved}>{ticket.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.historyTicketSubtitle}>
                    {ticket.farmer} · {ticket.issue} · {ticket.timeAgo}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 7: M12-S07 · Request Resolution (Images 4 & 5)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header: ← Request Resolution */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setScreenMode('detail')}
              activeOpacity={0.7}
              accessibilityLabel="Back to Request Detail"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Request Resolution</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Request summary */}
        <Text style={styles.sectionHeaderTitle}>Request summary</Text>
        <View style={styles.detailCard}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.detailFieldLabel}>Request</Text>
              <Text style={styles.detailFieldValue}>{selectedRequest.id}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.detailFieldLabel}>Status</Text>
              <Text style={[styles.detailFieldValue, { color: adminColors.warning.text }]}>
                {selectedRequest.status}
              </Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.col}>
              <Text style={styles.detailFieldLabel}>Farmer</Text>
              <Text style={styles.detailFieldValue}>{selectedRequest.farmerName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.detailFieldLabel}>Category</Text>
              <Text style={styles.detailFieldValue}>{selectedRequest.category}</Text>
            </View>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.detailFieldLabel}>Original issue</Text>
            <Text style={styles.detailSubjectValue}>{selectedRequest.description}</Text>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.detailFieldLabel}>Related TOHFA record</Text>
            <Text style={styles.detailSubjectValue}>
              {selectedRequest.relatedRecordType} {selectedRequest.relatedRecord} · {selectedRequest.relatedRecordStatus}
            </Text>
          </View>
        </View>

        {/* Section: Resolution */}
        <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>
          Resolution
        </Text>
        <View style={styles.detailCard}>
          {/* Resolution Type */}
          <Text style={styles.formInputLabel}>Resolution Type *</Text>
          <TouchableOpacity
            style={styles.dropdownSelector}
            onPress={() => setShowResTypeModal(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.dropdownSelectorValue,
                resType === 'Select a type' && { color: adminColors.placeholder },
              ]}
            >
              {resType}
            </Text>
            <ChevronDownIcon size={14} color={adminColors.ink} />
          </TouchableOpacity>

          <Text style={styles.proposedApprovalNote}>Proposed — Requires TOHFA Approval</Text>

          {/* Resolution Notes */}
          <Text style={[styles.formInputLabel, { marginTop: adminSpacing.md }]}>
            Resolution Notes *
          </Text>
          <View style={styles.textareaWrapper}>
            <TextInput
              style={styles.textareaInput}
              placeholder="Describe the action taken and how the farmer's issue was addressed."
              placeholderTextColor={adminColors.placeholder}
              value={resNotes}
              onChangeText={setResNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.textareaResizeHandle}>
              <ResizeCornerIcon size={10} color={adminColors.muted} />
            </View>
          </View>

          {/* Farmer communication */}
          <Text style={[styles.formInputLabel, { marginTop: adminSpacing.md }]}>
            Farmer communication (optional)
          </Text>
          <View style={styles.textareaWrapper}>
            <TextInput
              style={styles.textareaInput}
              placeholder="Enter note or response to be visible to the farmer..."
              placeholderTextColor={adminColors.placeholder}
              value={resFarmerComm}
              onChangeText={setResFarmerComm}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.textareaResizeHandle}>
              <ResizeCornerIcon size={10} color={adminColors.muted} />
            </View>
          </View>
          <Text style={styles.readOnlyNote}>Recorded as a response the farmer can see.</Text>

          {/* Follow-up Required */}
          <Text style={[styles.formInputLabel, { marginTop: adminSpacing.md }]}>
            Follow-up Required
          </Text>
          <TouchableOpacity
            style={styles.dropdownSelector}
            onPress={() => setShowFollowUpModal(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.dropdownSelectorValue,
                resFollowUp === 'Select' && { color: adminColors.placeholder },
              ]}
            >
              {resFollowUp}
            </Text>
            <ChevronDownIcon size={14} color={adminColors.ink} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons: Review Resolution & Cancel */}
        <View style={{ marginTop: adminSpacing.xl, gap: adminSpacing.md }}>
          <TouchableOpacity
            style={styles.primaryResolveBtn}
            onPress={handleReviewResolution}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryResolveBtnText}>Review Resolution</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionOutlineBtn}
            onPress={() => setScreenMode('detail')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionOutlineBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Resolution Type Modal */}
      <Modal
        visible={showResTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResTypeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowResTypeModal(false)}>
          <View style={styles.pickerModalCard}>
            <Text style={styles.pickerModalTitle}>Resolution Type</Text>
            {[
              'Listing Guidance Provided',
              'Direct Clarification',
              'Quality Standard Guidance',
              'Payment Verification Assistance',
              'Technical Resolution',
            ].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerModalOption, resType === type && styles.pickerModalOptionActive]}
                onPress={() => {
                  setResType(type);
                  setShowResTypeModal(false);
                }}
              >
                <Text style={[styles.pickerModalOptionText, resType === type && styles.pickerModalOptionTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Follow-up Required Modal */}
      <Modal
        visible={showFollowUpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFollowUpModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFollowUpModal(false)}>
          <View style={styles.pickerModalCard}>
            <Text style={styles.pickerModalTitle}>Follow-up Required</Text>
            {['None', 'Phone Call Required', 'Field Verification', 'Audit Follow-up'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.pickerModalOption, resFollowUp === opt && styles.pickerModalOptionActive]}
                onPress={() => {
                  setResFollowUp(opt);
                  setShowFollowUpModal(false);
                }}
              >
                <Text style={[styles.pickerModalOptionText, resFollowUp === opt && styles.pickerModalOptionTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
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
    justifyContent: 'flex-start',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  detailHeaderTitleCol: {
    flex: 1,
    marginLeft: adminSpacing.xs,
  },
  detailHeaderSub: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginTop: 2,
    fontWeight: '700',
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },

  // ─── Search Box ───
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  clearSearchText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
    paddingHorizontal: adminSpacing.xs,
  },

  // ─── Filter & Sort Action Row ───
  filterSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.md,
    gap: adminSpacing.md,
  },
  outlineActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    height: 40,
    gap: adminSpacing.xs,
  },
  outlineActionBtnActive: {
    borderColor: adminColors.brandDeep,
    backgroundColor: adminColors.brandTint,
  },
  outlineActionBtnText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  outlineActionBtnTextActive: {
    color: adminColors.brandDeep,
  },

  // ─── Filter Pills ───
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.sm,
  },
  filterPill: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 6,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterPillActive: {
    backgroundColor: adminColors.brandDeep,
    borderColor: adminColors.brandDeep,
  },
  filterPillText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: adminColors.onBrand,
  },

  // ─── Matching Requests Text ───
  matchingRequestsText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },

  // ─── Request Cards ───
  cardsList: {
    gap: adminSpacing.md,
    marginTop: adminSpacing.xs,
  },
  requestCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardId: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  cardSubject: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 2,
  },
  cardFarmerRow: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  cardCategoryText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  cardDatesText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },

  // ─── Status Badges ───
  cardStatusRow: {
    marginTop: adminSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
  },
  statusBadgeOpen: {
    backgroundColor: adminColors.warning.bg,
  },
  statusBadgeInProg: {
    backgroundColor: adminColors.info.bg,
  },
  statusBadgeResolved: {
    backgroundColor: adminColors.success.bg,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  statusBadgeTextOpen: {
    color: adminColors.warning.text,
  },
  statusBadgeTextInProg: {
    color: adminColors.info.text,
  },
  statusBadgeTextResolved: {
    color: adminColors.success.text,
  },

  // ─── View Details Button ───
  viewDetailsBtn: {
    marginTop: adminSpacing.md,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  viewDetailsBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // ─── Pagination ───
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.xl,
    gap: adminSpacing.sm,
  },
  pageBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 8,
    backgroundColor: adminColors.card,
  },
  pageBtnNext: {
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 8,
    backgroundColor: adminColors.card,
  },
  pageBtnDisabled: {
    borderColor: adminColors.border,
    opacity: 0.5,
  },
  pageBtnText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.muted,
  },
  pageBtnNextText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  pageBtnTextDisabled: {
    color: adminColors.muted,
  },
  paginationCenterText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },

  // ─── Records Per Page ───
  recordsPerPageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.lg,
  },
  recordsPerPageLabel: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  recordsPerPageDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
    gap: 4,
  },
  recordsPerPageValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // ─── Detail Screen Styles ───
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xs,
  },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: adminSpacing.md,
  },
  col: {
    flex: 1,
  },
  detailFieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 2,
  },
  detailFieldValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  detailSubjectValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  detailOutlineBtn: {
    marginTop: adminSpacing.md,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  detailOutlineBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  relatedSub: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  relatedStatusBold: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 2,
  },
  readOnlyNote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
  },
  descriptionBodyText: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 19,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  activityTitleText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  activityMetaText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  actionOutlineBtn: {
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginBottom: adminSpacing.sm,
  },
  actionOutlineBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  primaryResolveBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.md,
    ...adminShadow.sm,
  },
  primaryResolveBtnDone: {
    backgroundColor: adminColors.success.text,
  },
  primaryResolveBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },

  // ─── Farmer Information Screen Styles (M12-S05) ───
  farmerIdentityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    ...adminType.title,
    color: adminColors.ink,
    fontWeight: '800',
  },
  farmerNameTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  farmerIdSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  recordLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  recordLinkLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  recordLinkValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
    textDecorationLine: 'underline',
  },
  dashedDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  relatedRequestCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  relatedRequestTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  relatedRequestStatusRow: {
    marginTop: adminSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewRequestLinkText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // ─── Communication & Notes Screen Styles ───
  emptyCommHistoryText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  commNoteItem: {
    paddingVertical: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  commNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commNoteAuthor: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  commNoteDate: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  commNoteTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.xs,
    paddingVertical: 2,
    marginVertical: 4,
  },
  commNoteTypeBadgeText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  commNoteMessage: {
    ...adminType.body,
    color: adminColors.ink,
    marginTop: 2,
  },
  commNoteAttachmentText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
  },
  formInputLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
  },
  dropdownSelectorValue: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  infoPillBanner: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  infoPillBannerText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '500',
    lineHeight: 16,
  },
  textareaWrapper: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.sm,
    minHeight: 90,
  },
  textareaInput: {
    ...adminType.body,
    color: adminColors.ink,
    minHeight: 70,
  },
  textareaResizeHandle: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  uploadDottedBox: {
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
  },
  uploadDottedText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // ─── Request Resolution Screen Styles (M12-S07) ───
  proposedApprovalNote: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginTop: 4,
  },
  restrictionWarningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  restrictionWarningText: {
    ...adminType.caption,
    color: adminColors.ink,
    lineHeight: 16,
    flex: 1,
  },

  // ─── Support History Styles (New Screenshot Right) ───
  historyTicketCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  historyTicketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTicketId: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  historyTicketSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },

  // ─── Modals & Feedback ───
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  pickerModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  pickerModalOption: {
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  pickerModalOptionActive: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.xs,
  },
  pickerModalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  pickerModalOptionTextActive: {
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  toastBanner: {
    backgroundColor: adminColors.toast.bg,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    alignItems: 'center',
  },
  toastBannerText: {
    ...adminType.caption,
    color: adminColors.toast.text,
    fontWeight: '700',
  },

  // ─── Empty State ───
  emptyState: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  emptyTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  emptySubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 4,
  },

  // ─── Bottom Navigation Bar ───
  bottomBar: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 2,
  },
  bottomBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  bottomBarLabel: {
    ...adminType.caption,
    marginTop: 2,
    color: adminColors.muted,
  },
  bottomBarLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 36,
  },

  // ─── Profile Screen (M2-S03) ───
  profileHeroCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.xl,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  profileAvatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  profileHeroName: {
    ...adminType.title,
    color: adminColors.ink,
    textAlign: 'center',
  },
  profileHeroSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.xs,
  },
  profileActiveBadge: {
    marginTop: adminSpacing.md,
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
  },
  profileActiveBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  profileTabsWrapper: {
    marginBottom: adminSpacing.lg,
  },
  profileTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  profileTabBtn: {
    paddingVertical: 7,
    paddingHorizontal: adminSpacing.sm,
    borderRadius: adminRadius.sm,
  },
  profileTabBtnActive: {
    backgroundColor: adminColors.brand,
  },
  profileTabBtnText: {
    ...adminType.sectionHead,
    color: adminColors.muted,
  },
  profileTabBtnTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  profileSliderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: adminSpacing.xs,
    paddingHorizontal: 2,
    gap: 6,
  },
  profileSliderArrow: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: adminColors.border,
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  profileSliderThumb: {
    width: 90,
    height: 6,
    borderRadius: 3,
    backgroundColor: adminColors.muted,
  },
  profileDetailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  profileDetailLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  profileDetailValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  profileViewOnlyBox: {
    marginTop: adminSpacing.lg,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  profileViewOnlyText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  profileFooterCaption: {
    marginTop: adminSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileFooterCaptionText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
});
