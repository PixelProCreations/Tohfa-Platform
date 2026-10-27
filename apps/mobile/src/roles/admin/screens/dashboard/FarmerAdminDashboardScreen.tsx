import React, { useEffect, useMemo, useState } from 'react';
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
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import { fetchMe, type UserMe } from '../../../farmer/api/auth';
import { adminColors, adminRadius, adminSpacing, adminType, adminShadow, adminOverlay } from '../../theme';
import { t } from '../../i18n';
import { FarmerAdminProfileScreen } from './FarmerAdminProfileScreen';
import { FarmerProductListingsScreen } from './FarmerProductListingsScreen';
import { FarmerProduceDetailScreen } from './FarmerProduceDetailScreen';
import { FarmerCounterOfferScreen } from './FarmerCounterOfferScreen';
import { ProduceListingsScreen } from './ProduceListingsScreen';
import { ProduceListingDetailsScreen } from './ProduceListingDetailsScreen';
import { ListingHistoryScreen } from './ListingHistoryScreen';
import { FarmerProfileDetailScreen } from './FarmerProfileDetailScreen';
import { HandoverHistoryScreen } from './HandoverHistoryScreen';
import { HandoverConfirmationScreen } from './HandoverConfirmationScreen';
import { HandoverDetailsScreen } from './HandoverDetailsScreen';
import { FarmerAdminActivityScreen } from './FarmerAdminActivityScreen';
import { FarmerAdminNotificationsScreen } from './FarmerAdminNotificationsScreen';
import { FarmerAdminMoreScreen } from './FarmerAdminMoreScreen';
import { FarmerDisputesMediationScreen } from './FarmerDisputesMediationScreen';
import { FarmerDisputeDetailScreen } from './FarmerDisputeDetailScreen';
import { FarmerDisputeTimelineScreen } from './FarmerDisputeTimelineScreen';
import { FarmerDisputeResolutionScreen } from './FarmerDisputeResolutionScreen';
import { type DisputeItem, INITIAL_DISPUTES } from './fixtures';
import { FarmersDirectoryScreen } from './FarmersDirectoryScreen';
import { PurchaseOrdersScreen } from './PurchaseOrdersScreen';
import { PurchaseOrderDetailScreen } from './PurchaseOrderDetailScreen';
import { PurchaseHistoryScreen } from './PurchaseHistoryScreen';
import { ConfirmPurchaseTermsScreen } from './ConfirmPurchaseTermsScreen';
import { FarmerHandoverScreen } from './FarmerHandoverScreen';
import { CollectionConfirmationScreen } from './CollectionConfirmationScreen';
import { InputsPestHomeScreen } from './InputsPestHomeScreen';
import { ApprovedInputsScreen, type ApprovedInputItem } from './ApprovedInputsScreen';
import { InputDetailScreen } from './InputDetailScreen';
import { PestLibraryScreen, type PestItem } from './PestLibraryScreen';
import { ApplicationGuideScreen } from './ApplicationGuideScreen';
import { FarmerPestIncidentsScreen, type IncidentItem, SAMPLE_INCIDENTS } from './FarmerPestIncidentsScreen';
import { PestIncidentDetailScreen } from './PestIncidentDetailScreen';
import { MarketPricingHomeScreen } from './MarketPricingHomeScreen';
import { FairPriceCeilingScreen } from './FairPriceCeilingScreen';
import { CategoriesGradesScreen } from './CategoriesGradesScreen';
import { PriceHistoryScreen } from './PriceHistoryScreen';
import { RetailPricingScreen, type RetailPriceItem } from './RetailPricingScreen';
import { MarkupPricingBreakdownScreen } from './MarkupPricingBreakdownScreen';
import { FarmerAuditsTabScreen } from './FarmerAuditsTabScreen';
import { AuditScheduleScreen } from './AuditScheduleScreen';
import { FarmerRatingsScreen } from './FarmerRatingsScreen';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components/OverviewDashboardCard';

// ─── Theme Colors (Strictly derived from Admin Theme & Design Tokens) ────────
export type FarmerAdminTab = 'Home' | 'Farmers' | 'Produce' | 'Audits' | 'More';

// ─── SVG Icons Matching Exact Design Mockup ──────────────────────────────────

function ShieldHeaderIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.85"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SwitchArrowsIcon({ size = 14, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top arrow points RIGHT */}
      <Path
        d="M4 7h16M16 3l4 4-4 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom arrow points LEFT */}
      <Path
        d="M20 17H4M8 13l-4 4 4 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TomatoProduceIcon({
  size = 22,
  color = adminColors.brand,
  leafColor,
}: {
  size?: number;
  color?: string;
  leafColor?: string;
}) {
  const isWhite = color?.toLowerCase() === adminColors.onBrand.toLowerCase() || color?.toLowerCase() === 'white';
  const resolvedLeafColor = leafColor ?? (isWhite ? color : adminColors.muted);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Exact Circular Fruit Outline Body */}
      <Circle cx="12" cy="14" r="5.8" stroke={color} strokeWidth="2.2" />
      {/* Small Stem */}
      <Path
        d="M12 8.2c.3-1.8 1.1-3 2.3-3.6"
        stroke={resolvedLeafColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Solid Leaf tilted to top-left matching screenshot */}
      <Path
        d="M11.8 8.2C11.6 5.8 9.6 4.2 7.8 4.8c-.3 2.1 1.5 3.6 4 3.4z"
        fill={resolvedLeafColor}
      />
    </Svg>
  );
}

function OpposingArrowsIcon({ size = 18, color = adminColors.info.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top arrow points RIGHT */}
      <Path
        d="M4 7h16M16 3l4 4-4 4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom arrow points LEFT */}
      <Path
        d="M20 17H4M8 13l-4 4 4 4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Calendar Icon with 2x3 Grid of Date Dots (Image 1 Left Exact)
function CalendarOutlineIcon({ size = 22, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* 2x3 Grid of calendar date dots matching Image 1 Left */}
      <Circle cx="7.5" cy="12.5" r="1.1" fill={color} />
      <Circle cx="12" cy="12.5" r="1.1" fill={color} />
      <Circle cx="16.5" cy="12.5" r="1.1" fill={color} />
      <Circle cx="7.5" cy="16.5" r="1.1" fill={color} />
      <Circle cx="12" cy="16.5" r="1.1" fill={color} />
      <Circle cx="16.5" cy="16.5" r="1.1" fill={color} />
    </Svg>
  );
}

// Legal Balance Scale (Image 1 Left Exact)
function ExactScalesIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Center column & base */}
      <Path d="M12 3v17M8 20h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Top beam */}
      <Path d="M4 7h16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Left pan strings and dish */}
      <Path d="M4 7l-2.5 5.5h5L4 7z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      {/* Right pan strings and dish */}
      <Path d="M20 7l-2.5 5.5h5L20 7z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}


function CheckmarkCircleIcon({ size = 22, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDown({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUp({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Quick Actions SVG Icons (Image 1 Left Exact) ─────────────────────────────

function ClipboardChecklistIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Board with rounded corners */}
      <Rect x="4" y="4" width="16" height="17" rx="2.5" stroke={color} strokeWidth="1.8" />
      {/* Clip top tab */}
      <Path
        d="M9 2.5h6a1 1 0 0 1 1 1V5H8V3.5a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* 3 Checklist Lines (Image 1 Left) */}
      <Line x1="8.5" y1="10" x2="15.5" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8.5" y1="14" x2="15.5" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8.5" y1="18" x2="12.5" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PeopleGroupIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Center Person: Head & Shoulders (Image 1 Left) */}
      <Circle cx="12" cy="7" r="2.2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M8.5 17.5c0-2.2 1.55-3.8 3.5-3.8s3.5 1.6 3.5 3.8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Left Person: Head & Left Shoulder */}
      <Circle cx="6" cy="9" r="1.8" stroke={color} strokeWidth="1.8" />
      <Path
        d="M3 17.5c0-1.8 1.4-3.2 3.2-3.2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Right Person: Head & Right Shoulder */}
      <Circle cx="18" cy="9" r="1.8" stroke={color} strokeWidth="1.8" />
      <Path
        d="M21 17.5c0-1.8-1.4-3.2-3.2-3.2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}


function StarRatingsIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Bottom Tab Icons ────────────────────────────────────────────────────────

function TabHomeIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
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
  return <PeopleGroupIcon size={21} color={color} />;
}

function _TabProduceIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  const leafColor = active ? adminColors.brandDeep : adminColors.muted;
  return <TomatoProduceIcon size={21} color={color} leafColor={leafColor} />;
}

function TabAuditsIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return <CalendarOutlineIcon size={21} color={color} />;
}

function TabMoreIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      {/* Exact 3x3 Grid of 9 Dots (Image 1 Left) */}
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

export type AuditScheduleInitialView =
  | 'history'
  | 'audit_detail'
  | 'audit_report'
  | 'list'
  | 'detail'
  | 'schedule_visit'
  | 'inspection'
  | 'calendar'
  | 'calendar_view'
  | 'audit_details_m5'
  | 'pdf_viewer';

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  initialTab?: FarmerAdminTab;
}

export function FarmerAdminDashboardScreen({
  onSignOut,
  onNavigate: _onNavigate,
  initialTab = 'Home',
}: FarmerAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<FarmerAdminTab>(initialTab);
  const [_user, setUser] = useState<UserMe | null>(null);

  // Accordion state: both collapsed by default as in left design mockup
  const [expandedFarmer, setExpandedFarmer] = useState<string | null>(null);

  // SubView state for full screen flows
  const [subView, setSubView] = useState<
    | 'none'
    | 'product_listings'
    | 'produce_listing_details'
    | 'farmer_produce_detail'
    | 'counter_offer'
    | 'produce_listings'
    | 'produce_history'
    | 'verification_approval'
    | 'farmer_profile'
    | 'handover_history'
    | 'handover_confirmation'
    | 'handover_details'
    | 'admin_activity'
    | 'notifications'
    | 'profile'
    | 'purchases'
    | 'purchase_orders'
    | 'purchase_order_detail'
    | 'purchase_history'
    | 'confirm_purchase_terms'
    | 'farmer_handover'
    | 'collection_confirmation'
    | 'inputs_pest'
    | 'approved_inputs'
    | 'input_detail'
    | 'pest_library'
    | 'application_guide'
    | 'farmer_pest_incidents'
    | 'pest_incident_detail'
    | 'market_pricing'
    | 'fair_price'
    | 'categories_grades'
    | 'price_history'
    | 'retail_pricing'
    | 'markup_breakdown'
    | 'audit_schedule'
    | 'farmer_ratings'
    | 'disputes'
    | 'dispute_detail'
    | 'dispute_timeline'
    | 'dispute_resolution'
  >('none');
  const [moreSubScreen, setMoreSubScreen] = useState<
    | 'menu'
    | 'disputes'
    | 'dispute_detail'
    | 'dispute_timeline'
    | 'dispute_resolution'
  >('menu');
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | undefined>(undefined);
  const [disputeDetailReturnTo, setDisputeDetailReturnTo] = useState<'menu' | 'disputes'>('menu');
  const [timelineReturnTo, setTimelineReturnTo] = useState<'menu' | 'disputes' | 'dispute_detail'>('dispute_detail');
  const [activeHandoverId, setActiveHandoverId] = useState<string>('HO-2026-0002');
  const [activeOrderId, setActiveOrderId] = useState<string>('PO-2026-00124');
  const [activeInputItem, setActiveInputItem] = useState<ApprovedInputItem | undefined>(undefined);
  const [activeIncidentItem, setActiveIncidentItem] = useState<IncidentItem | undefined>(undefined);
  const [selectedPestItem, setSelectedPestItem] = useState<PestItem | undefined>(undefined);
  const [selectedRetailItem, setSelectedRetailItem] = useState<RetailPriceItem | undefined>(undefined);
  const [pestIncidentsInitialFilters, setPestIncidentsInitialFilters] = useState<boolean>(false);
  const [selectedPestForIncident, setSelectedPestForIncident] = useState<string | undefined>(undefined);
  const [listingInitialFilter, setListingInitialFilter] = useState<'all' | 'pending' | 'counter'>('all');
  const [auditInitialFilter, setAuditInitialFilter] = useState<'all' | 'field_visit' | 'history' | 'calendar' | 'report' | 'calendar_view'>('calendar');
  const [auditInitialId, setAuditInitialId] = useState<string | undefined>(undefined);
  const [auditInitialView, setAuditInitialView] = useState<AuditScheduleInitialView | undefined>(undefined);
  const [farmersInternalView, setFarmersInternalView] = useState<'list' | 'search_filter' | 'profile'>('list');

  const [activeProduceFarmerName, setActiveProduceFarmerName] = useState<string>('Ramesh Kumar');
  const [activeProduceFarmerId, setActiveProduceFarmerId] = useState<string>('FR-00241');
  const [activeProduceZone, setActiveProduceZone] = useState<string>('Coonoor');
  const [activeProduceCrop, setActiveProduceCrop] = useState<string>('Tomato');
  const [activeProduceGrade, setActiveProduceGrade] = useState<string>('Grade 1');
  const [activeProduceQuantity, setActiveProduceQuantity] = useState<number>(145);
  const [activeProduceApproved, setActiveProduceApproved] = useState<boolean>(false);

  // Navigation History Stack to ensure all back icons navigate to the exact previous screen
  interface NavState {
    tab: FarmerAdminTab;
    subView:
      | 'none'
      | 'product_listings'
      | 'produce_listing_details'
      | 'farmer_produce_detail'
      | 'counter_offer'
      | 'produce_listings'
      | 'produce_history'
      | 'verification_approval'
      | 'farmer_profile'
      | 'handover_history'
      | 'handover_confirmation'
      | 'handover_details'
      | 'admin_activity'
      | 'notifications'
      | 'profile'
      | 'purchases'
      | 'purchase_orders'
      | 'purchase_order_detail'
      | 'purchase_history'
      | 'confirm_purchase_terms'
      | 'farmer_handover'
      | 'collection_confirmation'
      | 'inputs_pest'
      | 'approved_inputs'
      | 'input_detail'
      | 'pest_library'
      | 'application_guide'
      | 'farmer_pest_incidents'
      | 'pest_incident_detail'
      | 'market_pricing'
      | 'fair_price'
      | 'categories_grades'
      | 'price_history'
      | 'retail_pricing'
      | 'markup_breakdown'
      | 'audit_schedule'
      | 'farmer_ratings'
      | 'disputes'
      | 'dispute_detail'
      | 'dispute_timeline'
      | 'dispute_resolution';
    moreSubScreen?:
      | 'menu'
      | 'disputes'
      | 'dispute_detail'
      | 'dispute_timeline'
      | 'dispute_resolution'
      | undefined;
    selectedDispute?: DisputeItem | undefined;
    activeIncidentItem?: IncidentItem | undefined;
    activeOrderId?: string | undefined;
    activeHandoverId?: string | undefined;
    activeInputItem?: ApprovedInputItem | undefined;
    selectedRetailItem?: RetailPriceItem | undefined;
    farmersInternalView?: ('list' | 'search_filter' | 'profile') | undefined;
    listingInitialFilter?: ('all' | 'pending' | 'counter') | undefined;
    auditInitialFilter?: ('all' | 'field_visit' | 'history' | 'calendar' | 'report' | 'calendar_view') | undefined;
    auditInitialId?: string | undefined;
    auditInitialView?: AuditScheduleInitialView | undefined;
    selectedPestForIncident?: string | undefined;
    activeProduceFarmerName?: string | undefined;
    activeProduceFarmerId?: string | undefined;
    activeProduceZone?: string | undefined;
    activeProduceCrop?: string | undefined;
    activeProduceGrade?: string | undefined;
    activeProduceQuantity?: number | undefined;
    activeProduceApproved?: boolean | undefined;
  }

  const [navStack, setNavStack] = useState<NavState[]>([]);

  const pushNavigation = (next: Partial<NavState>) => {
    const currentSnapshot: NavState = {
      tab: activeTab,
      subView,
      moreSubScreen,
      selectedDispute,
      activeIncidentItem,
      activeOrderId,
      activeHandoverId,
      activeInputItem,
      selectedRetailItem,
      farmersInternalView,
      listingInitialFilter,
      auditInitialFilter,
      auditInitialId,
      auditInitialView,
      selectedPestForIncident,
      activeProduceFarmerName,
      activeProduceFarmerId,
      activeProduceZone,
      activeProduceCrop,
      activeProduceGrade,
      activeProduceQuantity,
      activeProduceApproved,
    };

    setNavStack((prev) => [...prev, currentSnapshot]);

    if (next.tab !== undefined) setActiveTab(next.tab);
    if (next.subView !== undefined) setSubView(next.subView);
    if (next.moreSubScreen !== undefined) setMoreSubScreen(next.moreSubScreen);
    if (next.selectedDispute !== undefined) setSelectedDispute(next.selectedDispute);
    if (next.activeIncidentItem !== undefined) setActiveIncidentItem(next.activeIncidentItem);
    if (next.activeOrderId !== undefined) setActiveOrderId(next.activeOrderId);
    if (next.activeHandoverId !== undefined) setActiveHandoverId(next.activeHandoverId);
    if (next.activeInputItem !== undefined) setActiveInputItem(next.activeInputItem);
    if (next.selectedRetailItem !== undefined) setSelectedRetailItem(next.selectedRetailItem);
    if (next.farmersInternalView !== undefined) setFarmersInternalView(next.farmersInternalView);
    if (next.listingInitialFilter !== undefined) setListingInitialFilter(next.listingInitialFilter);
    if (next.auditInitialFilter !== undefined) setAuditInitialFilter(next.auditInitialFilter);
    if (next.auditInitialId !== undefined) setAuditInitialId(next.auditInitialId);
    if (next.auditInitialView !== undefined) setAuditInitialView(next.auditInitialView);
    if (next.selectedPestForIncident !== undefined) setSelectedPestForIncident(next.selectedPestForIncident);
    if (next.activeProduceFarmerName !== undefined) setActiveProduceFarmerName(next.activeProduceFarmerName);
    if (next.activeProduceFarmerId !== undefined) setActiveProduceFarmerId(next.activeProduceFarmerId);
    if (next.activeProduceZone !== undefined) setActiveProduceZone(next.activeProduceZone);
    if (next.activeProduceCrop !== undefined) setActiveProduceCrop(next.activeProduceCrop);
    if (next.activeProduceGrade !== undefined) setActiveProduceGrade(next.activeProduceGrade);
    if (next.activeProduceQuantity !== undefined) setActiveProduceQuantity(next.activeProduceQuantity);
    if (next.activeProduceApproved !== undefined) setActiveProduceApproved(next.activeProduceApproved);
  };

  const goBack = (fallbackTab: FarmerAdminTab = 'Home') => {
    if (navStack.length > 0) {
      const prev = navStack[navStack.length - 1]!;
      setNavStack((stack) => stack.slice(0, -1));

      setActiveTab(prev.tab);
      setSubView(prev.subView);
      if (prev.moreSubScreen !== undefined) setMoreSubScreen(prev.moreSubScreen);
      if (prev.selectedDispute !== undefined) setSelectedDispute(prev.selectedDispute);
      if (prev.activeIncidentItem !== undefined) setActiveIncidentItem(prev.activeIncidentItem);
      if (prev.activeOrderId !== undefined) setActiveOrderId(prev.activeOrderId);
      if (prev.activeHandoverId !== undefined) setActiveHandoverId(prev.activeHandoverId);
      if (prev.activeInputItem !== undefined) setActiveInputItem(prev.activeInputItem);
      if (prev.selectedRetailItem !== undefined) setSelectedRetailItem(prev.selectedRetailItem);
      if (prev.farmersInternalView !== undefined) setFarmersInternalView(prev.farmersInternalView);
      if (prev.listingInitialFilter !== undefined) setListingInitialFilter(prev.listingInitialFilter);
      if (prev.auditInitialFilter !== undefined) setAuditInitialFilter(prev.auditInitialFilter);
      if (prev.auditInitialId !== undefined) setAuditInitialId(prev.auditInitialId);
      if (prev.auditInitialView !== undefined) setAuditInitialView(prev.auditInitialView);
      if (prev.selectedPestForIncident !== undefined) setSelectedPestForIncident(prev.selectedPestForIncident);
      if (prev.activeProduceFarmerName !== undefined) setActiveProduceFarmerName(prev.activeProduceFarmerName);
      if (prev.activeProduceFarmerId !== undefined) setActiveProduceFarmerId(prev.activeProduceFarmerId);
      if (prev.activeProduceZone !== undefined) setActiveProduceZone(prev.activeProduceZone);
      if (prev.activeProduceCrop !== undefined) setActiveProduceCrop(prev.activeProduceCrop);
      if (prev.activeProduceGrade !== undefined) setActiveProduceGrade(prev.activeProduceGrade);
      if (prev.activeProduceQuantity !== undefined) setActiveProduceQuantity(prev.activeProduceQuantity);
      if (prev.activeProduceApproved !== undefined) setActiveProduceApproved(prev.activeProduceApproved);
    } else {
      if (subView !== 'none') {
        setSubView('none');
      } else if (moreSubScreen !== 'menu') {
        setMoreSubScreen('menu');
      } else {
        setActiveTab(fallbackTab);
      }
    }
  };

  // Modal State for details
  const [modalItem, setModalItem] = useState<{ title: string; content: string } | null>(null);
  const [completedProduceNames, setCompletedProduceNames] = useState<string[]>([]);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => { });
  }, []);

  const displayName = 'Suresh';

  // If currently in S-02 Farmer Product Listings subview, render it with back navigation
  if (subView === 'product_listings') {
    return (
      <FarmerProductListingsScreen
        onBack={() => goBack()}
        completedProduceNames={completedProduceNames}
        onSelectFarmerDetails={(group, item) => {
          const fullName = group.farmerName.includes('Kumar')
            ? group.farmerName
            : `${group.farmerName} Kumar`;
          setActiveProduceFarmerName(fullName);
          setActiveProduceFarmerId(group.farmerId);
          setActiveProduceZone(group.zone);
          setActiveProduceCrop(item.cropName);
          setActiveProduceGrade(item.grade);
          setActiveProduceQuantity(item.quantityKg);
          pushNavigation({
            subView: 'produce_listing_details',
            activeProduceFarmerName: fullName,
            activeProduceFarmerId: group.farmerId,
            activeProduceZone: group.zone,
            activeProduceCrop: item.cropName,
            activeProduceGrade: item.grade,
            activeProduceQuantity: item.quantityKg,
          });
        }}
        onSelectFarmerProduce={(group, item) => {
          const fullName = group.farmerName.includes('Kumar')
            ? group.farmerName
            : `${group.farmerName} Kumar`;
          setActiveProduceFarmerName(fullName);
          setActiveProduceFarmerId(group.farmerId);
          setActiveProduceZone(group.zone);
          setActiveProduceCrop(item.cropName);
          setActiveProduceGrade(item.grade);
          setActiveProduceQuantity(item.quantityKg);
          pushNavigation({
            subView: 'farmer_produce_detail',
            activeProduceFarmerName: fullName,
            activeProduceFarmerId: group.farmerId,
            activeProduceZone: group.zone,
            activeProduceCrop: item.cropName,
            activeProduceGrade: item.grade,
            activeProduceQuantity: item.quantityKg,
          });
        }}
      />
    );
  }

  // If currently in Produce Listing Details subview (Ramesh Kumar - PL-001245)
  if (subView === 'produce_listing_details') {
    return (
      <ProduceListingDetailsScreen
        listingId="PL-001245"
        cropName={activeProduceCrop || 'Tomato'}
        grade={activeProduceGrade || 'Grade 1'}
        farmerName={activeProduceFarmerName || 'Ramesh Kumar'}
        farmerId={activeProduceFarmerId || 'FR-00241'}
        zone={activeProduceZone || 'Coonoor'}
        farmingMethod="Organic"
        quantityKg={activeProduceQuantity || 50}
        harvestDate="28 Sep 2026"
        qualityInfo={`${activeProduceGrade || 'Grade 1'}, no visible defects`}
        pricePerKg={100}
        fairPriceCeiling={105}
        effectiveFrom="1 Sep 2026"
        showChips={false}
        showQuantityRequirement={false}
        onBack={() => goBack()}
        onReviewListing={() => {
          pushNavigation({
            subView: 'farmer_produce_detail',
          });
        }}
        onNavigateToVerification={() => {
          pushNavigation({
            subView: 'farmer_produce_detail',
          });
        }}
      />
    );
  }

  // If currently in Farmer Produce Detail subview (e.g. Ramesh Kumar Farm)
  if (subView === 'farmer_produce_detail') {
    return (
      <FarmerProduceDetailScreen
        farmerName={activeProduceFarmerName}
        farmerId={activeProduceFarmerId}
        zone={activeProduceZone}
        farmingMethod="Organic"
        completedProduceNames={completedProduceNames}
        onBack={() => goBack()}
        onApproveAll={() => {
          setCompletedProduceNames((prev) => {
            const added = ['Tomato', 'Beans'];
            return Array.from(new Set([...prev, ...added]));
          });
        }}
        onNavigateToCounterOffer={(item, isApproved) => {
          setActiveProduceCrop(item.name);
          setActiveProduceGrade(item.grade);
          setActiveProduceQuantity(item.quantityKg);
          setActiveProduceApproved(isApproved);
          pushNavigation({
            subView: 'counter_offer',
            activeProduceCrop: item.name,
            activeProduceGrade: item.grade,
            activeProduceQuantity: item.quantityKg,
            activeProduceApproved: isApproved,
          });
        }}
      />
    );
  }

  // If currently in Farmer Counter Offer subview
  if (subView === 'counter_offer') {
    return (
      <FarmerCounterOfferScreen
        cropName={activeProduceCrop}
        grade={activeProduceGrade}
        receivedKg={activeProduceQuantity}
        isTohfaAdminApproved={activeProduceApproved}
        onBack={() => goBack()}
        onAcceptOffer={() => {
          if (activeProduceCrop) {
            setCompletedProduceNames((prev) =>
              prev.includes(activeProduceCrop) ? prev : [...prev, activeProduceCrop]
            );
          }
        }}
        onSubmitCounter={() => {
          if (activeProduceCrop) {
            setCompletedProduceNames((prev) =>
              prev.includes(activeProduceCrop) ? prev : [...prev, activeProduceCrop]
            );
          }
        }}
        onBackToListing={() => {
          const crop = activeProduceCrop || 'Tomato';
          setCompletedProduceNames((prev) =>
            prev.includes(crop) ? prev : [...prev, crop]
          );
          goBack();
        }}
        onViewListingDetails={() => {
          pushNavigation({
            subView: 'produce_listing_details',
            activeProduceFarmerName,
            activeProduceFarmerId,
            activeProduceZone,
            activeProduceCrop,
            activeProduceGrade,
            activeProduceQuantity,
          });
        }}
      />
    );
  }

  // If currently in Produce Listings subview (Module 3 Produce screen)
  if (subView === 'produce_listings') {
    return (
      <ProduceListingsScreen
        initialFilter={listingInitialFilter}
        onBack={() => goBack()}
      />
    );
  }

  // If currently in Produce Listing History subview (Module 3 Produce screen)
  if (subView === 'produce_history') {
    return (
      <ListingHistoryScreen
        listingId="PL-001245"
        cropName="Tomato"
        grade="Grade 1"
        onBack={() => goBack()}
      />
    );
  }

  // If currently in Produce Verification & Approval subview, render FarmerProduceDetailScreen
  if (subView === 'verification_approval') {
    return (
      <FarmerProduceDetailScreen
        farmerName={activeProduceFarmerName}
        farmerId={activeProduceFarmerId}
        zone={activeProduceZone}
        farmingMethod="Organic"
        onBack={() => goBack()}
        onNavigateToCounterOffer={(item, isApproved) => {
          setActiveProduceCrop(item.name);
          setActiveProduceGrade(item.grade);
          setActiveProduceQuantity(item.quantityKg);
          setActiveProduceApproved(isApproved);
          pushNavigation({
            subView: 'counter_offer',
            activeProduceCrop: item.name,
            activeProduceGrade: item.grade,
            activeProduceQuantity: item.quantityKg,
            activeProduceApproved: isApproved,
          });
        }}
      />
    );
  }

  // If currently in Farmer Profile subview (Module 2)
  if (subView === 'farmer_profile') {
    return (
      <FarmerProfileDetailScreen
        farmer={{
          farmerId: 'FR-00241',
          name: 'Ramesh Kumar',
          zone: 'Coonoor',
          farmingMethod: 'Organic',
          accountStatus: 'Active',
          certification: 'Certified',
          farmCount: 1,
          listingCount: 18,
          rating: '4.6 ★',
          auditStatus: 'Upcoming',
        }}
        onBack={() => goBack()}
        onNavigateAuditHistory={() => {
          pushNavigation({
            subView: 'audit_schedule',
            auditInitialFilter: 'history',
            auditInitialView: 'history',
          });
        }}
      />
    );
  }

  // If currently in Handover History subview, render it with back navigation
  if (subView === 'handover_history') {
    return (
      <HandoverHistoryScreen
        onBack={() => goBack()}
        onNavigateToHandover={(hId) => {
          pushNavigation({
            subView: 'handover_confirmation',
            activeHandoverId: hId,
          });
        }}
      />
    );
  }

  // If currently in Handover Confirmation subview, render it with back navigation
  if (subView === 'handover_confirmation') {
    return (
      <HandoverConfirmationScreen
        handoverId={activeHandoverId}
        status="Completed"
        onBack={() => goBack()}
        onViewHistory={() => pushNavigation({ subView: 'handover_history' })}
        onViewHandoverDetails={() => {
          pushNavigation({ subView: 'handover_details' });
        }}
      />
    );
  }

  // If currently in Handover Details subview, render it with back navigation
  if (subView === 'handover_details') {
    return (
      <HandoverDetailsScreen
        handoverId={activeHandoverId}
        status="Completed"
        onBack={() => goBack()}
        onViewReceivingResult={() => goBack()}
        onViewHistory={() => pushNavigation({ subView: 'handover_history' })}
      />
    );
  }

  // If currently in Farmer Admin Activity subview
  if (subView === 'admin_activity') {
    return (
      <FarmerAdminActivityScreen
        onBack={() => goBack()}
        onNavigateToListings={() => pushNavigation({ subView: 'product_listings' })}
      />
    );
  }

  // If currently in Notifications subview
  if (subView === 'notifications') {
    return (
      <FarmerAdminNotificationsScreen
        onBack={() => goBack()}
        onViewListing={() => pushNavigation({ subView: 'product_listings' })}
        onViewAudit={() => {
          pushNavigation({ tab: 'Audits' });
        }}
        onViewDispute={() => {
          pushNavigation({
            subView: 'dispute_detail',
            selectedDispute: INITIAL_DISPUTES[0],
          });
        }}
        onTabChange={(tab) => {
          setNavStack([]);
          setSubView('none');
          setMoreSubScreen('menu');
          setActiveTab(tab);
        }}
      />
    );
  }



  // Module 1: Admin Profile subview
  if (subView === 'profile') {
    return (
      <FarmerAdminProfileScreen
        onBack={() => goBack()}
        onSignOut={onSignOut}
        onSwitchRole={() =>
          setModalItem({
            title: 'Switch Role',
            content: 'You are currently in Farmer Admin mode. Tap to switch to Smallholder Farmer mode.',
          })
        }
      />
    );
  }


  // Module 4: Screen 2 - Purchase Orders (Image 1 Middle)
  if (subView === 'purchase_orders') {
    return (
      <PurchaseOrdersScreen
        onBack={() => goBack()}
        onViewOrder={(orderId) => {
          pushNavigation({
            subView: 'purchase_order_detail',
            activeOrderId: orderId,
          });
        }}
        onHandover={(orderId) => {
          pushNavigation({
            subView: 'farmer_handover',
            activeOrderId: orderId,
          });
        }}
        onCollect={(orderId) => {
          pushNavigation({
            subView: 'confirm_purchase_terms',
            activeOrderId: orderId,
          });
        }}
        onViewHistory={() => pushNavigation({ subView: 'purchase_history' })}
      />
    );
  }

  // Module 4: Screen 3 - Purchase Order Detail (Image 1 Right & Images 2-3)
  if (subView === 'purchase_order_detail') {
    return (
      <PurchaseOrderDetailScreen
        orderId={activeOrderId}
        onBack={() => goBack()}
        onViewOriginalListing={() => {
          pushNavigation({ subView: 'produce_listings' });
        }}
        onProcessHandover={() => {
          pushNavigation({ subView: 'farmer_handover' });
        }}
      />
    );
  }

  // If currently in Farmer Handover subview (Screenshot 3)
  if (subView === 'farmer_handover') {
    return (
      <FarmerHandoverScreen
        orderId={activeOrderId}
        farmerName="Ramesh Kumar"
        farmerPhone="+91 XXXXX XXXXX"
        expectedQty={30}
        onBack={() => goBack()}
        onConfirmHandover={() => {
          pushNavigation({ subView: 'collection_confirmation' });
        }}
        onReportIssue={() => {
          setModalItem({
            title: 'Report Handover Issue',
            content: 'Handover issue flagged for PO ' + activeOrderId + '. Recorded for review.',
          });
        }}
      />
    );
  }

  // If currently in Collection Confirmation subview (Screenshot 4)
  if (subView === 'collection_confirmation') {
    return (
      <CollectionConfirmationScreen
        orderId={activeOrderId || 'PO-2026-00119'}
        farmerName={activeOrderId === 'PO-2026-00119' ? 'Selvi' : 'Ramesh Kumar'}
        expectedQty="30 kg"
        receivedQty="30 kg"
        totalValue="₹1,350"
        collectionDate="30 Sep 2026"
        collectedBy="Farmer Admin"
        qualityResult="Accepted"
        onBack={() => goBack()}
        onConfirmCollection={() => {
          pushNavigation({ subView: 'purchase_history' });
        }}
      />
    );
  }

  // If currently in Confirm Purchase Terms subview (Image 1)
  if (subView === 'confirm_purchase_terms') {
    return (
      <ConfirmPurchaseTermsScreen
        farmerName="Ramesh Kumar"
        produceName="Organic Carrot — Grade 1"
        requestedQty="50 kg"
        agreedQty="30 kg"
        requestedPrice="₹50/kg"
        agreedPrice="₹45/kg"
        totalAmount="₹1,350"
        onBack={() => goBack()}
        onConfirm={() => {
          pushNavigation({ subView: 'collection_confirmation' });
        }}
      />
    );
  }

  // If currently in Purchase History subview (with Filter popup modal)
  if (subView === 'purchase_history') {
    return (
      <PurchaseHistoryScreen
        onBack={() => goBack()}
        onViewOrder={(orderId) => {
          pushNavigation({
            subView: 'purchase_order_detail',
            activeOrderId: orderId,
          });
        }}
      />
    );
  }

  // Module 6: Inputs & Pest Management Home (Image 1)
  if (subView === 'inputs_pest') {
    return (
      <InputsPestHomeScreen
        onBack={() => goBack()}
        onNavigateApprovedInputs={() => pushNavigation({ subView: 'approved_inputs' })}
        onNavigatePestLibrary={() => pushNavigation({ subView: 'pest_library' })}
        onNavigatePestIncidents={() => {
          pushNavigation({ subView: 'farmer_pest_incidents' });
        }}
        onViewRecentIncident={() => {
          pushNavigation({
            subView: 'pest_incident_detail',
            activeIncidentItem: SAMPLE_INCIDENTS[0],
          });
        }}
        onOpenNotifications={() => pushNavigation({ subView: 'notifications' })}
      />
    );
  }

  // Module 6: Approved Inputs (Image 2 & 3)
  if (subView === 'approved_inputs') {
    return (
      <ApprovedInputsScreen
        onBack={() => goBack()}
        onSelectInput={(item) => {
          pushNavigation({
            subView: 'input_detail',
            activeInputItem: item,
          });
        }}
      />
    );
  }

  // Module 6: Input Detail (Image 4)
  if (subView === 'input_detail') {
    return (
      <InputDetailScreen
        inputItem={activeInputItem}
        onBack={() => goBack()}
      />
    );
  }

  // Module 6: Pest & Pesticide Library (Flow Screen 1)
  if (subView === 'pest_library') {
    return (
      <PestLibraryScreen
        onBack={() => goBack()}
        onSelectPest={(pest) => {
          setSelectedPestItem(pest);
          pushNavigation({ subView: 'application_guide' });
        }}
      />
    );
  }

  // Module 6: Application Guide (Flow Screen 2)
  if (subView === 'application_guide') {
    return (
      <ApplicationGuideScreen
        pestName={selectedPestItem?.name || 'Aphid'}
        scientificName={selectedPestItem?.scientificName || 'Aphidoidea'}
        crop={selectedPestItem?.crop || 'Carrot'}
        severity={selectedPestItem?.severity || 'Medium'}
        symptoms={selectedPestItem?.symptoms}
        treatment={selectedPestItem?.treatment}
        onBack={() => goBack()}
        onViewIncidents={() => {
          pushNavigation({ subView: 'farmer_pest_incidents' });
        }}
        onSelectRelatedInput={() => pushNavigation({ subView: 'approved_inputs' })}
      />
    );
  }

  // Module 6: Farmer Pest Incidents (Flow Screen 3)
  if (subView === 'farmer_pest_incidents') {
    return (
      <FarmerPestIncidentsScreen
        initialShowFilters={pestIncidentsInitialFilters}
        onBack={() => {
          setPestIncidentsInitialFilters(false);
          goBack();
        }}
        onSelectIncident={(incident) => {
          setPestIncidentsInitialFilters(false);
          pushNavigation({
            subView: 'pest_incident_detail',
            activeIncidentItem: incident,
          });
        }}
      />
    );
  }

  // Module 6: Pest Incident Detail (Screenshot 4 & 5)
  if (subView === 'pest_incident_detail') {
    return (
      <PestIncidentDetailScreen
        incident={activeIncidentItem}
        linkedPestName={selectedPestForIncident}
        onBack={() => goBack()}
        onOpenFilters={() => {
          setPestIncidentsInitialFilters(true);
          pushNavigation({ subView: 'farmer_pest_incidents' });
        }}
        onViewFarmer={() => {
          pushNavigation({ subView: 'farmer_profile' });
        }}
        onViewPest={() => {
          pushNavigation({ subView: 'pest_library' });
        }}
        onViewApplicationGuide={() => {
          pushNavigation({ subView: 'application_guide' });
        }}
      />
    );
  }

  // Module 7: Market & Pricing Home (Screenshot 1 & 2)
  if (subView === 'market_pricing') {
    return (
      <MarketPricingHomeScreen
        onBack={() => goBack()}
        onNavigateToFairPrice={() => pushNavigation({ subView: 'fair_price' })}
        onNavigateToCategories={() => pushNavigation({ subView: 'categories_grades' })}
        onNavigateToPriceHistory={() => pushNavigation({ subView: 'price_history' })}
        onNavigateToRetailPricing={() => pushNavigation({ subView: 'retail_pricing' })}
        onOpenNotifications={() => pushNavigation({ subView: 'notifications' })}
      />
    );
  }

  // Module 7: Fair Price Ceilings & Filters (Screenshot 3 & 4)
  if (subView === 'fair_price') {
    return (
      <FairPriceCeilingScreen
        onBack={() => goBack()}
        onNavigateToBreakdown={(item) => {
          pushNavigation({
            subView: 'markup_breakdown',
            selectedRetailItem: {
              id: item.id,
              cropGrade: `${item.crop} · ${item.grade}`,
              product: item.crop,
              grade: item.grade,
              purchasePrice: item.purchasePrice || '₹80.00/kg',
              markup: item.markup || '10%',
              expenses: '₹10.00',
              expensesDetail: item.expensesDetail || 'Freight ₹5.00 · Loading ₹2.00 · Unloading ₹3.00',
              retailPrice: item.retailPrice || '₹98.00/kg',
              customerDiscount: item.customerDiscount || '₹5.00',
              effectiveDate: item.effectiveFrom,
              status: 'Active',
              category: item.category === 'Fruits' ? 'Fruits' : 'Vegetables',
            },
          });
        }}
      />
    );
  }

  // Module 7: Categories & Grades (Mockup 1)
  if (subView === 'categories_grades') {
    return (
      <CategoriesGradesScreen
        onBack={() => goBack()}
      />
    );
  }

  // Module 7: Price History & Filters (Mockup 2 & 3 Left)
  if (subView === 'price_history') {
    return (
      <PriceHistoryScreen
        onBack={() => goBack()}
      />
    );
  }

  // Module 7: Retail Pricing & Filters (Mockup 3 Right & 4)
  if (subView === 'retail_pricing') {
    return (
      <RetailPricingScreen
        onBack={() => goBack()}
        onSelectBreakdown={(item) => {
          pushNavigation({
            subView: 'markup_breakdown',
            selectedRetailItem: item,
          });
        }}
      />
    );
  }

  // Module 7: Markup & Pricing Breakdown (Mockup 5)
  if (subView === 'markup_breakdown') {
    return (
      <MarkupPricingBreakdownScreen
        onBack={() => goBack()}
        cropGradeTitle={
          selectedRetailItem
            ? `${selectedRetailItem.product} · ${selectedRetailItem.grade}`
            : 'Carrot · Grade 1'
        }
        purchasePrice={
          selectedRetailItem
            ? (selectedRetailItem.purchasePrice.includes('/kg') ? selectedRetailItem.purchasePrice : `${selectedRetailItem.purchasePrice}/kg`)
            : '₹80.00/kg'
        }
        markup={selectedRetailItem ? selectedRetailItem.markup : '10%'}
        retailPrice={
          selectedRetailItem
            ? (selectedRetailItem.retailPrice.includes('/kg') ? selectedRetailItem.retailPrice : `${selectedRetailItem.retailPrice}/kg`)
            : '₹98.00/kg'
        }
        customerDiscount={
          selectedRetailItem
            ? (selectedRetailItem.customerDiscount.includes('/kg') ? selectedRetailItem.customerDiscount : `${selectedRetailItem.customerDiscount}/kg`)
            : '₹5.00/kg'
        }
        expensesSummary={
          selectedRetailItem?.expensesDetail || 'Freight ₹5 · Loading ₹2 · Unloading ₹3'
        }
        finalCustomerPrice="₹93.00/kg"
        expenseList={[
          { name: 'Freight', amount: '₹5.00' },
          { name: 'Loading', amount: '₹2.00' },
          { name: 'Unloading', amount: '₹3.00' },
        ]}
      />
    );
  }

  // Module 5: Audit Schedule & Field Visits (Screenshots 3 & 4)
  if (subView === 'audit_schedule') {
    return (
      <AuditScheduleScreen
        initialTypeFilter={auditInitialFilter}
        initialAuditId={auditInitialId}
        initialView={auditInitialView}
        onBack={() => {
          setAuditInitialId(undefined);
          setAuditInitialView(undefined);
          setAuditInitialFilter('calendar');
          goBack();
        }}
        onNavigateFarmerProfile={(_farmerId) => {
          pushNavigation({ subView: 'farmer_profile' });
        }}
        onOpenNotifications={() => pushNavigation({ subView: 'notifications' })}
      />
    );
  }

  // Module 8: Farm Ratings & Adherence (Screenshots 1-5)
  if (subView === 'farmer_ratings') {
    return (
      <FarmerRatingsScreen
        onBack={() => goBack()}
        onOpenNotifications={() => pushNavigation({ subView: 'notifications' })}
      />
    );
  }

  // Module Disputes & Mediation
  if (subView === 'disputes') {
    return (
      <FarmerDisputesMediationScreen
        onBack={() => goBack()}
        onOpenNotifications={() => pushNavigation({ subView: 'notifications' })}
        onViewDetails={(item) => {
          pushNavigation({
            subView: 'dispute_detail',
            selectedDispute: item,
          });
        }}
        onViewTimeline={(item) => {
          pushNavigation({
            subView: 'dispute_timeline',
            selectedDispute: item,
          });
        }}
      />
    );
  }

  if (subView === 'dispute_detail') {
    return (
      <FarmerDisputeDetailScreen
        dispute={selectedDispute}
        onBack={() => goBack()}
        onNavigateOrder={(orderId) => {
          pushNavigation({
            subView: 'purchase_order_detail',
            activeOrderId: orderId,
          });
        }}
        onViewTimeline={(item) => {
          if (item) setSelectedDispute(item);
          pushNavigation({
            subView: 'dispute_timeline',
            selectedDispute: item || selectedDispute,
          });
        }}
        onNavigateResolve={(item) => {
          if (item) setSelectedDispute(item);
          pushNavigation({
            subView: 'dispute_resolution',
            selectedDispute: item || selectedDispute,
          });
        }}
      />
    );
  }

  if (subView === 'dispute_timeline') {
    return (
      <FarmerDisputeTimelineScreen
        dispute={selectedDispute}
        onBack={() => goBack()}
        onViewDisputeDetail={() => goBack()}
      />
    );
  }

  if (subView === 'dispute_resolution') {
    return (
      <FarmerDisputeResolutionScreen
        dispute={selectedDispute}
        onBack={() => goBack()}
        onResolvedSuccess={(updated) => {
          setSelectedDispute(updated);
          goBack();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Terracotta Header (Only on Home — REMOVED on More, Farmers, & Audits pages) ─── */}
      {activeTab !== 'More' && activeTab !== 'Farmers' && activeTab !== 'Audits' && (
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <ShieldHeaderIcon size={22} color={adminColors.onBrand} />
              <Text style={styles.headerTitle}>{t('farmerAdminDashboard.header.title')}</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => pushNavigation({ subView: 'notifications' })}
                activeOpacity={0.8}
                accessibilityLabel="Notifications"
              >
                <BellHeaderIcon size={19} color={adminColors.onBrand} />
                <View style={styles.headerNotificationDot} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => pushNavigation({ subView: 'profile' })}
                activeOpacity={0.8}
                accessibilityLabel="Admin Profile"
              >
                <ProfileHeaderIcon size={20} color={adminColors.onBrand} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.headerSubtitle}>{t('farmerAdminDashboard.header.subtitle')}</Text>
        </View>
      )}

      {/* ─── Main Content Tabs ─── */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Home' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Greeting Section */}
            <View style={styles.greetingSection}>
              <Text style={styles.greetTitle}>Good morning, {displayName}</Text>
              <Text style={styles.greetSub}>Here&apos;s your Farmer Admin activity for today.</Text>
            </View>

            {/* 2. Active Role Card */}
            <View style={styles.roleCard}>
              <View style={styles.roleLeftCol}>
                <View style={styles.roleIconBadge}>
                  <ShieldHeaderIcon size={20} color={adminColors.onBrand} />
                </View>
                <View>
                  <Text style={styles.roleLabel}>{t('farmerAdminDashboard.role.active')}</Text>
                  <Text style={styles.roleName}>{t('farmerAdminDashboard.role.name')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.switchRoleBtn}
                onPress={() =>
                  setModalItem({
                    title: 'Switch Role',
                    content: 'You are currently in Farmer Admin mode. Tap to switch to Smallholder Farmer mode.',
                  })
                }
                activeOpacity={0.8}
              >
                <SwitchArrowsIcon size={14} color={adminColors.brand} />
                <Text style={styles.switchRoleText}>{t('farmerAdminDashboard.role.switch')}</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Overview Cards Grid */}
            <View style={{ marginBottom: 16 }}>
              <OverviewCardsGrid>
                <OverviewDashboardCard
                  value="24"
                  title="Pending listings"
                  subtitle="12 require review"
                  icon="orders"
                  tone="warning"
                  onPress={() => pushNavigation({ subView: 'product_listings' })}
                />
                <OverviewDashboardCard
                  value="18"
                  title="Today's reviews"
                  subtitle="14 approved · 4 pending"
                  icon="box"
                  onPress={() => pushNavigation({ subView: 'product_listings' })}
                />
                <OverviewDashboardCard
                  value="06"
                  title="Pending audit support"
                  subtitle="3 upcoming · 3 pending"
                  icon="pickup"
                  onPress={() =>
                    pushNavigation({
                      subView: 'audit_schedule',
                      auditInitialView: 'calendar',
                    })
                  }
                />
                <OverviewDashboardCard
                  value="04"
                  title="Open disputes"
                  subtitle="2 need attention"
                  icon="alert"
                  tone="danger"
                  onPress={() => {
                    pushNavigation({
                      subView: 'disputes',
                      selectedDispute: INITIAL_DISPUTES[0],
                    });
                  }}
                />
              </OverviewCardsGrid>
            </View>


            {/* 5. Needs Your Attention Section */}
            <Text
              style={[
                styles.sectionTitle,
                { marginTop: adminSpacing.lg, marginBottom: adminSpacing.sm },
              ]}
            >
              Needs Your Attention
            </Text>

            {/* Attention Item 1: Tomato Grade 1 */}
            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() => pushNavigation({ subView: 'product_listings' })}
              activeOpacity={0.8}
            >
              <View style={styles.accentStripe} />
              <View style={styles.attentionHeaderRow}>
                <View style={styles.attentionIconCircle}>
                  <TomatoProduceIcon size={20} color={adminColors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attentionCardTitle}>Tomato — Grade 1</Text>
                  <Text style={styles.attentionCardMeta}>
                    Farmer: Ramesh · Quantity: 50 KG · Listed Price: ₹100/KG
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Attention Item 2: Counter Offer Response */}
            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() =>
                pushNavigation({
                  subView: 'produce_listings',
                  listingInitialFilter: 'counter',
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.accentStripe} />
              <View style={styles.attentionHeaderRow}>
                <View style={styles.attentionIconCircle}>
                  <OpposingArrowsIcon size={18} color={adminColors.info.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attentionCardTitle}>Counter Offer Response</Text>
                  <Text style={styles.attentionCardMeta}>
                    Farmer: Kumar · Crop: Beans · Quantity: 75 KG · Requires response
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Attention Item 3: Upcoming Farm Audit */}
            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() =>
                pushNavigation({
                  subView: 'audit_schedule',
                  auditInitialFilter: 'calendar',
                  auditInitialView: 'calendar',
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.accentStripe} />
              <View style={styles.attentionHeaderRow}>
                <View style={styles.attentionIconCircle}>
                  <CalendarOutlineIcon size={20} color={adminColors.warning.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attentionCardTitle}>Upcoming Farm Audit</Text>
                  <Text style={styles.attentionCardMeta}>
                    Farmer: Selvi · Zone: Coonoor · Date: 04 Oct 2026
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Attention Item 4: Farmer Dispute */}
            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() => {
                pushNavigation({
                  subView: 'dispute_detail',
                  selectedDispute: INITIAL_DISPUTES[0],
                });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.accentStripe} />
              <View style={styles.attentionHeaderRow}>
                <View style={styles.attentionIconCircle}>
                  <ExactScalesIcon size={20} color={adminColors.danger.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attentionCardTitle}>Farmer Dispute — DSP-00128</Text>
                  <Text style={styles.attentionCardMeta}>Farmer vs Farmer · Status: Open</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* 6. Farmer Product Listings Section */}
            <TouchableOpacity
              style={{ marginTop: 18 }}
              onPress={() => pushNavigation({ subView: 'product_listings' })}
              activeOpacity={0.8}
            >
              <Text style={styles.sectionTitle}>Farmer Product Listings</Text>
              <Text style={styles.sectionSubMuted}>24 pending · 8 farmers</Text>
            </TouchableOpacity>

            {/* Accordion 1: Ramesh */}
            <View style={styles.accordionCard}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setExpandedFarmer(expandedFarmer === 'Ramesh' ? null : 'Ramesh')}
                activeOpacity={0.8}
              >
                <View style={styles.initialsCircle}>
                  <Text style={styles.initialsText}>R</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.farmerName}>Ramesh</Text>
                  <Text style={styles.farmerSub}>3 pending listings</Text>
                </View>

                {expandedFarmer === 'Ramesh' ? <ChevronUp /> : <ChevronDown />}
              </TouchableOpacity>

              {expandedFarmer === 'Ramesh' && (
                <View style={styles.accordionContent}>
                  <TouchableOpacity
                    style={styles.accordionItemRow}
                    onPress={() => pushNavigation({ subView: 'product_listings' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionCropName}>• Tomato — Grade 1 (50 KG)</Text>
                    <Text style={styles.accordionCropPrice}>₹100/KG</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.accordionItemRow}
                    onPress={() => pushNavigation({ subView: 'product_listings' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionCropName}>• Potato — Grade 2 (120 KG)</Text>
                    <Text style={styles.accordionCropPrice}>₹28/KG</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.accordionItemRow}
                    onPress={() => pushNavigation({ subView: 'product_listings' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionCropName}>• Cabbage — Grade 1 (40 KG)</Text>
                    <Text style={styles.accordionCropPrice}>₹22/KG</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Accordion 2: Kumar */}
            <View style={styles.accordionCard}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setExpandedFarmer(expandedFarmer === 'Kumar' ? null : 'Kumar')}
                activeOpacity={0.8}
              >
                <View style={styles.initialsCircle}>
                  <Text style={styles.initialsText}>K</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.farmerName}>Kumar</Text>
                  <Text style={styles.farmerSub}>2 pending listings</Text>
                </View>

                {expandedFarmer === 'Kumar' ? <ChevronUp /> : <ChevronDown />}
              </TouchableOpacity>

              {expandedFarmer === 'Kumar' && (
                <View style={styles.accordionContent}>
                  <TouchableOpacity
                    style={styles.accordionItemRow}
                    onPress={() => pushNavigation({ subView: 'product_listings' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionCropName}>• Green Beans — Grade 1 (75 KG)</Text>
                    <Text style={styles.accordionCropPrice}>₹45/KG</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.accordionItemRow}
                    onPress={() => pushNavigation({ subView: 'product_listings' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionCropName}>• Beetroot — Grade 1 (60 KG)</Text>
                    <Text style={styles.accordionCropPrice}>₹36/KG</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Big Action Button: View All Listings */}
            <TouchableOpacity
              style={styles.bigOutlineBtn}
              onPress={() => pushNavigation({ subView: 'product_listings' })}
              activeOpacity={0.8}
            >
              <Text style={styles.bigOutlineBtnText}>View All Listings</Text>
            </TouchableOpacity>

            {/* 7. Recent Farmer Admin Activity */}
            <View style={{ marginTop: 22 }}>
              <Text style={styles.sectionTitle}>Recent Farmer Admin Activity</Text>
            </View>

            <TouchableOpacity
              style={styles.activityCard}
              onPress={() => pushNavigation({ subView: 'product_listings' })}
              activeOpacity={0.8}
            >
              <CheckmarkCircleIcon size={22} color={adminColors.success.text} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>Listing approved</Text>
                <Text style={styles.activityMeta}>Tomato — Grade 1 · 10 min ago</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bigOutlineBtn}
              onPress={() => pushNavigation({ subView: 'admin_activity' })}
              activeOpacity={0.8}
            >
              <Text style={styles.bigOutlineBtnText}>View Activity</Text>
            </TouchableOpacity>

            {/* 8. Quick Actions (Exact 6-Tile Grid from Image 4 Request) */}
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>

            <View style={styles.quickGrid}>
              {/* Row 1, Col 1: Review Listings */}
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => pushNavigation({ subView: 'product_listings' })}
                activeOpacity={0.75}
              >
                <ClipboardChecklistIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Review Listings</Text>
              </TouchableOpacity>

              {/* Row 1, Col 2: View Farmers */}
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => pushNavigation({ tab: 'Farmers' })}
                activeOpacity={0.75}
              >
                <PeopleGroupIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>View Farmers</Text>
              </TouchableOpacity>

              {/* Row 1, Col 3: Audit Calendar */}
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => pushNavigation({ tab: 'Audits' })}
                activeOpacity={0.75}
              >
                <CalendarOutlineIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Audit Calendar</Text>
              </TouchableOpacity>

              {/* Row 2: Review Disputes (Single Full Row Tab) */}
              <TouchableOpacity
                style={styles.quickCardFull}
                onPress={() => {
                  pushNavigation({
                    subView: 'disputes',
                    selectedDispute: INITIAL_DISPUTES[0],
                  });
                }}
                activeOpacity={0.75}
              >
                <ExactScalesIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Review Disputes</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        )}

        {/* ─── Farmers Tab (Matching Screenshot 1) ─── */}
        {activeTab === 'Farmers' && (
          <FarmersDirectoryScreen
            onBack={() => goBack('Home')}
            onViewChange={(view) => setFarmersInternalView(view)}
            onNavigateAuditHistory={() => {
              pushNavigation({
                subView: 'audit_schedule',
                auditInitialFilter: 'history',
                auditInitialView: 'history',
              });
            }}
          />
        )}

        {/* ─── Audits Tab (Screenshots 1 & 2) ─── */}
        {activeTab === 'Audits' && (
          <FarmerAuditsTabScreen
            onBack={() => goBack('Home')}
            onNavigateSchedule={(preFilter, auditId) => {
              pushNavigation({
                subView: 'audit_schedule',
                auditInitialFilter:
                  preFilter === 'calendar'
                    ? 'calendar'
                    : preFilter === 'field_visit'
                      ? 'field_visit'
                      : preFilter === 'history'
                        ? 'history'
                        : preFilter === 'report'
                          ? 'report'
                          : preFilter === 'calendar_view'
                            ? 'calendar_view'
                            : 'calendar',
                auditInitialId: auditId,
                auditInitialView:
                  preFilter === 'report'
                    ? 'audit_report'
                    : preFilter === 'history'
                      ? 'history'
                      : preFilter === 'calendar_view'
                        ? 'calendar_view'
                        : 'calendar',
              });
            }}
            onOpenNotifications={() => pushNavigation({ subView: 'notifications' })}
          />
        )}

        {/* ─── More Tab (Screenshot 5) ─── */}
        {activeTab === 'More' && moreSubScreen === 'menu' && (
          <FarmerAdminMoreScreen
            onBack={() => goBack('Home')}
            onNavigateInputsPest={() => pushNavigation({ subView: 'inputs_pest' })}
            onNavigateMarketPricing={() => pushNavigation({ subView: 'market_pricing' })}
            onNavigateProduceListings={() => pushNavigation({ subView: 'produce_listings' })}
            onNavigateDisputes={() => {
              pushNavigation({ subView: 'disputes' });
            }}
            onNavigateProfile={() => pushNavigation({ subView: 'profile' })}
            onNavigateNotifications={() => pushNavigation({ subView: 'notifications' })}
            onSwitchRole={() =>
              setModalItem({
                title: 'Switch Role',
                content: 'You are currently in Farmer Admin mode. Tap to switch to Smallholder Farmer mode.',
              })
            }
            onItemSelect={(title) => {
              if (title === 'Inputs & Pest Management') {
                pushNavigation({ subView: 'inputs_pest' });
              } else if (title === 'Market & Pricing') {
                pushNavigation({ subView: 'market_pricing' });
              } else if (title === 'Ratings') {
                pushNavigation({ subView: 'farmer_ratings' });
              } else if (title === 'Disputes') {
                pushNavigation({ subView: 'disputes' });
              } else if (title === 'Profile') {
                pushNavigation({ subView: 'profile' });
              } else {
                setModalItem({
                  title,
                  content: `Detailed management and parameters for ${title}.`,
                });
              }
            }}
          />
        )}

        {activeTab === 'More' && moreSubScreen === 'disputes' && (
          <FarmerDisputesMediationScreen
            onBack={() => goBack()}
            onOpenNotifications={() => pushNavigation({ subView: 'notifications' })}
            onViewDetails={(item) => {
              pushNavigation({
                moreSubScreen: 'dispute_detail',
                selectedDispute: item,
              });
            }}
            onViewTimeline={(item) => {
              pushNavigation({
                moreSubScreen: 'dispute_timeline',
                selectedDispute: item,
              });
            }}
          />
        )}

        {activeTab === 'More' && moreSubScreen === 'dispute_detail' && (
          <FarmerDisputeDetailScreen
            dispute={selectedDispute}
            onBack={() => goBack()}
            onNavigateOrder={(orderId) => {
              pushNavigation({
                subView: 'purchase_order_detail',
                activeOrderId: orderId,
              });
            }}
            onViewTimeline={(item) => {
              if (item) setSelectedDispute(item);
              pushNavigation({
                moreSubScreen: 'dispute_timeline',
                selectedDispute: item || selectedDispute,
              });
            }}
            onNavigateResolve={(item) => {
              if (item) setSelectedDispute(item);
              pushNavigation({
                moreSubScreen: 'dispute_resolution',
                selectedDispute: item || selectedDispute,
              });
            }}
          />
        )}

        {activeTab === 'More' && moreSubScreen === 'dispute_timeline' && (
          <FarmerDisputeTimelineScreen
            dispute={selectedDispute}
            onBack={() => goBack()}
            onViewDisputeDetail={() => {
              goBack();
            }}
          />
        )}

        {activeTab === 'More' && moreSubScreen === 'dispute_resolution' && (
          <FarmerDisputeResolutionScreen
            dispute={selectedDispute}
            onBack={() => goBack()}
            onResolvedSuccess={(updated) => {
              setSelectedDispute(updated);
              goBack();
            }}
          />
        )}
      </View>

      {/* ─── Detail Modal ─── */}
      <Modal
        visible={modalItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalItem(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalItem(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{modalItem?.title}</Text>
            <Text style={styles.modalContent}>{modalItem?.content}</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalItem(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Bottom Tab Bar (Only show on the 5 primary dashboard screens) ─── */}
      {subView === 'none' &&
        (activeTab === 'Home' ||
          (activeTab === 'Farmers' && farmersInternalView === 'list') ||
          activeTab === 'Audits' ||
          (activeTab === 'More' && moreSubScreen === 'menu')) && (
          <View style={styles.tabBar}>
            <Pressable
              style={styles.tabItem}
              onPress={() => {
                setNavStack([]);
                setSubView('none');
                setMoreSubScreen('menu');
                setActiveTab('Home');
              }}
              accessibilityRole="tab"
              accessibilityLabel="Home"
            >
              <TabHomeIcon active={activeTab === 'Home'} />
              <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
            </Pressable>

            <Pressable
              style={styles.tabItem}
              onPress={() => {
                setNavStack([]);
                setSubView('none');
                setMoreSubScreen('menu');
                setFarmersInternalView('list');
                setActiveTab('Farmers');
              }}
              accessibilityRole="tab"
              accessibilityLabel="Farmers"
            >
              <TabFarmersIcon active={activeTab === 'Farmers'} />
              <Text style={[styles.tabLabel, activeTab === 'Farmers' && styles.tabLabelActive]}>Farmers</Text>
            </Pressable>


            <Pressable
              style={styles.tabItem}
              onPress={() => {
                setNavStack([]);
                setSubView('none');
                setMoreSubScreen('menu');
                setActiveTab('Audits');
              }}
              accessibilityRole="tab"
              accessibilityLabel="Audits"
            >
              <TabAuditsIcon active={activeTab === 'Audits'} />
              <Text style={[styles.tabLabel, activeTab === 'Audits' && styles.tabLabelActive]}>Audits</Text>
            </Pressable>

            <Pressable
              style={styles.tabItem}
              onPress={() => {
                setNavStack([]);
                setSubView('none');
                setMoreSubScreen('menu');
                setActiveTab('More');
              }}
              accessibilityRole="tab"
              accessibilityLabel="More"
            >
              <TabMoreIcon active={activeTab === 'More'} />
              <Text style={[styles.tabLabel, activeTab === 'More' && styles.tabLabelActive]}>More</Text>
            </Pressable>
          </View>
        )}
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // ─── Header ───
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.onBrand,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerNotificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: adminColors.danger.text,
  },

  // ─── Body Scroll ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // ─── 1. Greeting ───
  greetingSection: {
    marginBottom: 14,
  },
  greetTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
    letterSpacing: -0.3,
  },
  greetSub: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
    fontWeight: '400',
  },

  // ─── 2. Active Role Card ───
  roleCard: {
    backgroundColor: adminColors.brandTint,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    letterSpacing: 0.5,
  },
  roleName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: adminColors.onBrand,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  switchRoleText: {
    ...adminType.rowMeta,
    color: adminColors.brand,
  },

  // ─── 3. 2x2 Static KPI Grid (No navigation redirects) ───
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.3,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 2,
  },
  kpiSub: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '500',
  },

  // ─── Section Header ───
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    letterSpacing: -0.2,
  },
  sectionSubMuted: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
    marginBottom: 10,
  },
  viewLink: {
    ...adminType.body,
    color: adminColors.brand,
  },

  // ─── Handover History Cards ───
  historyCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 10,
  },
  historyCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  historyMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 3,
    lineHeight: 16,
  },
  historySubBold: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    marginTop: 4,
  },
  statusPillCompleted: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.success.bg,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 8,
    marginBottom: 6,
  },
  statusPillCompletedText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  cardActionLink: {
    ...adminType.rowMeta,
    color: adminColors.brandDeep,
    marginTop: 4,
  },

  // ─── Needs Attention Cards with Curved Left Accent Stripe ───
  attentionCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden', // Ensures the accent stripe curves cleanly with the card
  },
  accentStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4.5,
    backgroundColor: adminColors.brand,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  attentionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingLeft: 4,
  },
  attentionIconCircle: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionCardTitle: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  attentionCardMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 3,
    lineHeight: 16,
  },
  attentionActionLink: {
    ...adminType.rowMeta,
    color: adminColors.brandDeep,
  },

  // ─── Accordion Farmer Cards ───
  accordionCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    marginBottom: 8,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  initialsCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  farmerName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  farmerSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 1,
  },
  accordionContent: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    gap: 6,
  },
  accordionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  accordionCropName: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontWeight: '500',
  },
  accordionCropPrice: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    fontWeight: '700',
  },

  // ─── Big Outline Buttons ───
  bigOutlineBtn: {
    backgroundColor: adminColors.onBrand,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  bigOutlineBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // ─── Activity Card ───
  activityCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  activityTitle: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  activityMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },

  // ─── Quick Actions (Image 1: 5-Tile Grid) ───
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 8,
  },
  quickCard: {
    width: '31.5%', // 3 columns
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickCardWide: {
    width: '48.5%', // 2 columns for row 2
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickCardFull: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickCardLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    textAlign: 'center',
  },

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: 20,
    padding: 22,
    ...adminShadow.sm,
  },
  modalTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
    marginBottom: 8,
  },
  modalContent: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 19,
    marginBottom: 18,
  },
  modalCloseBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    ...adminType.body,
    color: adminColors.onBrand,
  },

  // ─── Bottom Tab Bar (5 Tabs) ───
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
});
