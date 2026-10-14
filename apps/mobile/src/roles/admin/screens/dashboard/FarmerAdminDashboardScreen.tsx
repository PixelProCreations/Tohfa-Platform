import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import { fetchMe, type UserMe } from '../../../farmer/api/auth';
import { adminColors, adminRadius, adminSpacing, adminType, adminShadow, adminOverlay } from '../../theme';
import { t } from '../../i18n';
import { AdminProfileScreen } from './AdminProfileScreen';
import { FarmerProductListingsScreen } from './FarmerProductListingsScreen';
import { FarmerProduceTabScreen } from './FarmerProduceTabScreen';
import { ProduceListingsScreen } from './ProduceListingsScreen';
import { ListingHistoryScreen } from './ListingHistoryScreen';
import { ProduceVerificationApprovalScreen } from './ProduceVerificationApprovalScreen';
import { FarmerProfileDetailScreen } from './FarmerProfileDetailScreen';
import { HandoverHistoryScreen } from './HandoverHistoryScreen';
import { HandoverConfirmationScreen } from './HandoverConfirmationScreen';
import { HandoverDetailsScreen } from './HandoverDetailsScreen';
import { FarmerAdminActivityScreen } from './FarmerAdminActivityScreen';
import { FarmerAdminNotificationsScreen } from './FarmerAdminNotificationsScreen';
import { FarmerAdminMoreScreen } from './FarmerAdminMoreScreen';
import { FarmersDirectoryScreen } from './FarmersDirectoryScreen';
import { FarmerPurchasesScreen } from './FarmerPurchasesScreen';
import { PurchaseOrdersScreen } from './PurchaseOrdersScreen';
import { PurchaseOrderDetailScreen } from './PurchaseOrderDetailScreen';
import { PurchaseHistoryScreen } from './PurchaseHistoryScreen';
import { ConfirmPurchaseTermsScreen } from './ConfirmPurchaseTermsScreen';
import { FarmerHandoverScreen } from './FarmerHandoverScreen';
import { CollectionConfirmationScreen } from './CollectionConfirmationScreen';
import { InputsPestHomeScreen } from './InputsPestHomeScreen';
import { ApprovedInputsScreen, type ApprovedInputItem } from './ApprovedInputsScreen';
import { InputDetailScreen } from './InputDetailScreen';
import { PestLibraryScreen } from './PestLibraryScreen';
import { ApplicationGuideScreen } from './ApplicationGuideScreen';
import { FarmerPestIncidentsScreen, type IncidentItem } from './FarmerPestIncidentsScreen';
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

function ShieldBoxIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        fill={color}
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

function SpeechBubbleIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Front speech bubble */}
      <Path
        d="M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7l-4 3.5V7z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Back speech bubble (Image 1 Left Exact) */}
      <Path
        d="M16 6h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v2.5l-3-2.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
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

function TabProduceIcon({ active }: { active: boolean }) {
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

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string, params?: any) => void;
  initialTab?: FarmerAdminTab;
}

export function FarmerAdminDashboardScreen({
  onSignOut,
  onNavigate,
  initialTab = 'Home',
}: FarmerAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<FarmerAdminTab>(initialTab);
  const [user, setUser] = useState<UserMe | null>(null);

  // Accordion state: both collapsed by default as in left design mockup
  const [expandedFarmer, setExpandedFarmer] = useState<string | null>(null);

  // SubView state for full screen flows
  const [subView, setSubView] = useState<
    | 'none'
    | 'product_listings'
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
  >('none');
  const [activeHandoverId, setActiveHandoverId] = useState<string>('HO-2026-0002');
  const [activeOrderId, setActiveOrderId] = useState<string>('PO-2026-00124');
  const [activeInputItem, setActiveInputItem] = useState<ApprovedInputItem | undefined>(undefined);
  const [activeIncidentItem, setActiveIncidentItem] = useState<IncidentItem | undefined>(undefined);
  const [selectedRetailItem, setSelectedRetailItem] = useState<RetailPriceItem | undefined>(undefined);
  const [breakdownReturnSubView, setBreakdownReturnSubView] = useState<'retail_pricing' | 'fair_price'>('retail_pricing');
  const [incidentReturnSubView, setIncidentReturnSubView] = useState<'inputs_pest' | 'farmer_pest_incidents'>('inputs_pest');
  const [listingInitialFilter, setListingInitialFilter] = useState<'all' | 'pending' | 'counter'>('all');
  const [produceReturnSubView, setProduceReturnSubView] = useState<'none' | 'purchases' | 'purchase_orders'>('none');
  const [confirmTermsReturnSubView, setConfirmTermsReturnSubView] = useState<'purchases' | 'purchase_orders'>('purchase_orders');
  const [auditInitialFilter, setAuditInitialFilter] = useState<'all' | 'field_visit' | 'history' | 'calendar' | 'report'>('calendar');
  const [auditInitialId, setAuditInitialId] = useState<string | undefined>(undefined);
  const [auditInitialView, setAuditInitialView] = useState<any>(undefined);
  const [farmerProfileReturnSubView, setFarmerProfileReturnSubView] = useState<'none' | 'audit_schedule' | 'verification_approval'>('none');

  // Modal State for details
  const [modalItem, setModalItem] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {});
  }, []);

  const displayName = 'Suresh';

  // If currently in S-02 Farmer Product Listings subview, render it with back navigation
  if (subView === 'product_listings') {
    return (
      <FarmerProductListingsScreen
        onBack={() => setSubView('none')}
      />
    );
  }

  // If currently in Produce Listings subview (Module 3 Produce screen)
  if (subView === 'produce_listings') {
    return (
      <ProduceListingsScreen
        initialFilter={listingInitialFilter}
        onBack={() => {
          if (produceReturnSubView === 'purchase_orders') {
            setProduceReturnSubView('none');
            setSubView('purchase_orders');
          } else if (produceReturnSubView === 'purchases') {
            setProduceReturnSubView('none');
            setSubView('purchases');
          } else {
            setSubView('none');
          }
        }}
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
        onBack={() => setSubView('none')}
      />
    );
  }

  // If currently in S-03 Produce Verification & Approval subview, render it with back navigation
  if (subView === 'verification_approval') {
    return (
      <ProduceVerificationApprovalScreen
        listingId="PL-001245"
        cropName="Tomato"
        farmerName="Ramesh Kumar"
        onBack={() => setSubView('none')}
        onSubmitSuccess={() => setSubView('none')}
        onViewListing={() => setSubView('product_listings')}
        onViewFarmerProfile={() => setSubView('farmer_profile')}
      />
    );
  }

  // If currently in Farmer Profile subview (Module 2)
  if (subView === 'farmer_profile') {
    return (
      <FarmerProfileDetailScreen
        onBack={() => {
          if (farmerProfileReturnSubView === 'audit_schedule') {
            setFarmerProfileReturnSubView('none');
            setSubView('audit_schedule');
          } else {
            setSubView('verification_approval');
          }
        }}
      />
    );
  }

  // If currently in Handover History subview, render it with back navigation
  if (subView === 'handover_history') {
    return (
      <HandoverHistoryScreen
        onBack={() => setSubView('none')}
        onNavigateToHandover={(hId) => {
          setActiveHandoverId(hId);
          setSubView('handover_confirmation');
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
        onBack={() => setSubView('handover_history')}
        onViewHistory={() => setSubView('handover_history')}
        onViewHandoverDetails={() => {
          setSubView('handover_details');
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
        onBack={() => setSubView('handover_confirmation')}
        onViewReceivingResult={() => setSubView('handover_confirmation')}
        onViewHistory={() => setSubView('handover_history')}
      />
    );
  }

  // If currently in Farmer Admin Activity subview
  if (subView === 'admin_activity') {
    return (
      <FarmerAdminActivityScreen
        onBack={() => setSubView('none')}
        onNavigateToListings={() => setSubView('product_listings')}
      />
    );
  }

  // If currently in Notifications subview
  if (subView === 'notifications') {
    return (
      <FarmerAdminNotificationsScreen
        onBack={() => setSubView('none')}
        onViewListing={() => setSubView('product_listings')}
        onViewAudit={() => {
          setSubView('none');
          setActiveTab('Audits');
        }}
        onViewDispute={() =>
          setModalItem({
            title: 'Dispute Mediation Desk',
            content: 'Boundary irrigation runoff disagreement between Farm #FR-00214 and Farm #FR-00215 in Ooty North.',
          })
        }
      />
    );
  }

  // If currently in Profile subview
  if (subView === 'profile') {
    return (
      <AdminProfileScreen
        role="FARMER_ADMIN"
        onSignOut={onSignOut}
        onBack={() => setSubView('none')}
      />
    );
  }

  // If currently in Purchases subview (Image 1)
  if (subView === 'purchases') {
    return (
      <FarmerPurchasesScreen
        onBack={() => {
          setSubView('none');
          setActiveTab('More');
        }}
        onNavigatePurchaseOrders={() => setSubView('purchase_orders')}
        onNavigateReadyForCollection={() => {
          setActiveOrderId('PO-2026-00119');
          setConfirmTermsReturnSubView('purchases');
          setSubView('confirm_purchase_terms');
        }}
        onNavigatePurchaseHistory={() => setSubView('purchase_history')}
        onNavigateProduceListings={() => {
          setProduceReturnSubView('purchases');
          setSubView('produce_listings');
        }}
        onViewPurchaseOrder={(orderId) => {
          setActiveOrderId(orderId);
          setSubView('purchase_order_detail');
        }}
        onProcessHandover={(orderId) => {
          setActiveOrderId(orderId || 'PO-2026-00124');
          setSubView('farmer_handover');
        }}
        onCollect={(orderId) => {
          setActiveOrderId(orderId || 'PO-2026-00119');
          setConfirmTermsReturnSubView('purchases');
          setSubView('confirm_purchase_terms');
        }}
        onOpenNotifications={() => setSubView('notifications')}
      />
    );
  }

  // If currently in Purchase Orders subview (Image 2)
  if (subView === 'purchase_orders') {
    return (
      <PurchaseOrdersScreen
        onBack={() => setSubView('purchases')}
        onViewOrder={(orderId) => {
          setActiveOrderId(orderId);
          setSubView('purchase_order_detail');
        }}
        onHandover={(orderId) => {
          setActiveOrderId(orderId);
          setSubView('farmer_handover');
        }}
        onCollect={(orderId) => {
          setActiveOrderId(orderId);
          setConfirmTermsReturnSubView('purchase_orders');
          setSubView('confirm_purchase_terms');
        }}
        onViewHistory={() => setSubView('purchase_history')}
      />
    );
  }

  // If currently in Purchase Order Detail subview (Image 3 & 4)
  if (subView === 'purchase_order_detail') {
    return (
      <PurchaseOrderDetailScreen
        orderId={activeOrderId}
        onBack={() => setSubView('purchase_orders')}
        onViewOriginalListing={() => {
          setProduceReturnSubView('purchase_orders');
          setSubView('produce_listings');
        }}
        onProcessHandover={() => {
          setSubView('farmer_handover');
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
        onBack={() => setSubView('purchase_orders')}
        onConfirmHandover={() => {
          setSubView('collection_confirmation');
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
        onBack={() => setSubView('confirm_purchase_terms')}
        onConfirmCollection={() => {
          setSubView('purchase_history');
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
        onBack={() => setSubView(confirmTermsReturnSubView)}
        onConfirm={() => {
          setSubView('collection_confirmation');
        }}
      />
    );
  }

  // If currently in Purchase History subview (with Filter popup modal)
  if (subView === 'purchase_history') {
    return (
      <PurchaseHistoryScreen
        onBack={() => setSubView('purchases')}
        onViewOrder={(orderId) => {
          setActiveOrderId(orderId);
          setSubView('purchase_order_detail');
        }}
      />
    );
  }

  // Module 6: Inputs & Pest Management Home (Image 1)
  if (subView === 'inputs_pest') {
    return (
      <InputsPestHomeScreen
        onBack={() => {
          setSubView('none');
          setActiveTab('More');
        }}
        onNavigateApprovedInputs={() => setSubView('approved_inputs')}
        onNavigatePestLibrary={() => setSubView('pest_library')}
        onNavigateApplicationGuides={() => setSubView('application_guide')}
        onNavigatePestIncidents={() => setSubView('farmer_pest_incidents')}
        onViewRecentIncident={() => {
          setIncidentReturnSubView('inputs_pest');
          setSubView('pest_incident_detail');
        }}
        onOpenNotifications={() => setSubView('notifications')}
      />
    );
  }

  // Module 6: Approved Inputs (Image 2 & 3)
  if (subView === 'approved_inputs') {
    return (
      <ApprovedInputsScreen
        onBack={() => setSubView('inputs_pest')}
        onSelectInput={(item) => {
          setActiveInputItem(item);
          setSubView('input_detail');
        }}
      />
    );
  }

  // Module 6: Input Detail (Image 4)
  if (subView === 'input_detail') {
    return (
      <InputDetailScreen
        inputItem={activeInputItem}
        onBack={() => setSubView('approved_inputs')}
      />
    );
  }

  // Module 6: Pest & Pesticide Library (Image 5)
  if (subView === 'pest_library') {
    return (
      <PestLibraryScreen
        onBack={() => setSubView('inputs_pest')}
        onSelectPest={() => setSubView('application_guide')}
      />
    );
  }

  // Module 6: Application Guide (Screenshot 1)
  if (subView === 'application_guide') {
    return (
      <ApplicationGuideScreen
        onBack={() => setSubView('inputs_pest')}
        onViewIncidents={() => setSubView('farmer_pest_incidents')}
        onSelectRelatedInput={() => setSubView('approved_inputs')}
      />
    );
  }

  // Module 6: Farmer Pest Incidents (Screenshot 2 & 3)
  if (subView === 'farmer_pest_incidents') {
    return (
      <FarmerPestIncidentsScreen
        onBack={() => setSubView('inputs_pest')}
        onSelectIncident={(incident) => {
          setActiveIncidentItem(incident);
          setIncidentReturnSubView('farmer_pest_incidents');
          setSubView('pest_incident_detail');
        }}
      />
    );
  }

  // Module 6: Pest Incident Detail (Screenshot 4 & 5)
  if (subView === 'pest_incident_detail') {
    return (
      <PestIncidentDetailScreen
        incident={activeIncidentItem}
        onBack={() => setSubView(incidentReturnSubView)}
        onViewPest={() => setSubView('pest_library')}
        onViewApplicationGuide={() => setSubView('application_guide')}
      />
    );
  }

  // Module 7: Market & Pricing Home (Screenshot 1 & 2)
  if (subView === 'market_pricing') {
    return (
      <MarketPricingHomeScreen
        onBack={() => {
          setSubView('none');
          setActiveTab('More');
        }}
        onNavigateToFairPrice={() => setSubView('fair_price')}
        onNavigateToCategories={() => setSubView('categories_grades')}
        onNavigateToPriceHistory={() => setSubView('price_history')}
        onNavigateToRetailPricing={() => setSubView('retail_pricing')}
        onOpenNotifications={() => setSubView('notifications')}
      />
    );
  }

  // Module 7: Fair Price Ceilings & Filters (Screenshot 3 & 4)
  if (subView === 'fair_price') {
    return (
      <FairPriceCeilingScreen
        onBack={() => setSubView('market_pricing')}
        onNavigateToBreakdown={(item) => {
          setSelectedRetailItem({
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
          });
          setBreakdownReturnSubView('fair_price');
          setSubView('markup_breakdown');
        }}
      />
    );
  }

  // Module 7: Categories & Grades (Mockup 1)
  if (subView === 'categories_grades') {
    return (
      <CategoriesGradesScreen
        onBack={() => setSubView('market_pricing')}
      />
    );
  }

  // Module 7: Price History & Filters (Mockup 2 & 3 Left)
  if (subView === 'price_history') {
    return (
      <PriceHistoryScreen
        onBack={() => setSubView('market_pricing')}
      />
    );
  }

  // Module 7: Retail Pricing & Filters (Mockup 3 Right & 4)
  if (subView === 'retail_pricing') {
    return (
      <RetailPricingScreen
        onBack={() => setSubView('market_pricing')}
        onSelectBreakdown={(item) => {
          setSelectedRetailItem(item);
          setBreakdownReturnSubView('retail_pricing');
          setSubView('markup_breakdown');
        }}
      />
    );
  }

  // Module 7: Markup & Pricing Breakdown (Mockup 5)
  if (subView === 'markup_breakdown') {
    return (
      <MarkupPricingBreakdownScreen
        onBack={() => setSubView(breakdownReturnSubView)}
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
          setSubView('none');
        }}
        onNavigateFarmerProfile={(farmerId) => {
          setFarmerProfileReturnSubView('audit_schedule');
          setSubView('farmer_profile');
        }}
        onOpenNotifications={() => setSubView('notifications')}
      />
    );
  }

  // Module 8: Farm Ratings & Adherence (Screenshots 1-5)
  if (subView === 'farmer_ratings') {
    return (
      <FarmerRatingsScreen
        onBack={() => setSubView('none')}
        onOpenNotifications={() => setSubView('notifications')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Terracotta Header (Only on Home — REMOVED on More, Farmers, Produce, & Audits pages) ─── */}
      {activeTab !== 'More' && activeTab !== 'Farmers' && activeTab !== 'Produce' && activeTab !== 'Audits' && (
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <ShieldHeaderIcon size={22} color={adminColors.onBrand} />
              <Text style={styles.headerTitle}>{t('farmerAdminDashboard.header.title')}</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => setSubView('notifications')}
                activeOpacity={0.8}
                accessibilityLabel="Notifications"
              >
                <BellHeaderIcon size={19} color={adminColors.onBrand} />
                <View style={styles.headerNotificationDot} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => setSubView('profile')}
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

            {/* 3. 4 KPI Grid (2x2) — PURELY STATIC DISPLAY AS REQUESTED */}
            <View style={styles.kpiGrid}>
              {/* Tile 1: Pending Listings */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>PENDING LISTINGS</Text>
                <Text style={styles.kpiValue}>24</Text>
                <Text style={[styles.kpiSub, { color: adminColors.warning.text, fontWeight: '600' }]}>
                  12 require review
                </Text>
              </View>

              {/* Tile 2: Today's Reviews */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TODAY&apos;S REVIEWS</Text>
                <Text style={styles.kpiValue}>18</Text>
                <Text style={styles.kpiSub}>14 approved · 4 pending</Text>
              </View>

              {/* Tile 3: Pending Audit Support */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>PENDING AUDIT SUPPORT</Text>
                <Text style={styles.kpiValue}>6</Text>
                <Text style={styles.kpiSub}>3 upcoming · 3 pending</Text>
              </View>

              {/* Tile 4: Open Disputes */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>OPEN DISPUTES</Text>
                <Text style={[styles.kpiValue, { color: adminColors.danger.text }]}>4</Text>
                <Text style={[styles.kpiSub, { color: adminColors.danger.text, fontWeight: '700' }]}>
                  2 need attention
                </Text>
              </View>
            </View>

            {/* 4. Handover History Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Handover History</Text>
              <TouchableOpacity
                onPress={() => setSubView('handover_history')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewLink}>View →</Text>
              </TouchableOpacity>
            </View>

            {/* Handover Card 1 */}
            <View style={styles.historyCard}>
              <Text style={styles.historyCardTitle}>HO-2026-0002 · Handover</Text>
              <Text style={styles.historyMeta}>6 Oct 2026 · 1 collection</Text>
              <Text style={styles.historyMeta}>Carrot · 30 KG</Text>
              <Text style={styles.historyMeta}>Destination: Main Warehouse</Text>

              <View style={styles.statusPillCompleted}>
                <Text style={styles.statusPillCompletedText}>Completed</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setActiveHandoverId('HO-2026-0002');
                  setSubView('handover_confirmation');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cardActionLink}>View Details</Text>
              </TouchableOpacity>
            </View>

            {/* Handover Card 2 */}
            <View style={styles.historyCard}>
              <Text style={styles.historyCardTitle}>COL-0006 · Collection</Text>
              <Text style={styles.historyMeta}>5 Oct 2026 · Selvi - FR-00242</Text>
              <Text style={styles.historyMeta}>Carrot · 30 KG</Text>
              <Text style={styles.historyMeta}>Destination: Main Warehouse</Text>
              <Text style={styles.historySubBold}>In HO-2026-0002</Text>

              <TouchableOpacity
                onPress={() => {
                  setActiveHandoverId('HO-2026-0002');
                  setSubView('handover_history');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cardActionLink}>View Details</Text>
              </TouchableOpacity>
            </View>

            {/* 5. Needs Your Attention Section */}
            <Text style={styles.sectionTitle}>Needs Your Attention</Text>

            {/* Attention Item 1: Tomato Grade 1 */}
            <View style={styles.attentionCard}>
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

              <View style={{ alignSelf: 'flex-start', marginTop: 8, marginLeft: 34 }}>
                <Text style={styles.attentionActionLink}>Review Listing →</Text>
              </View>
            </View>

            {/* Attention Item 2: Counter Offer Response */}
            <View style={styles.attentionCard}>
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

              <View style={{ alignSelf: 'flex-start', marginTop: 8, marginLeft: 34 }}>
                <Text style={styles.attentionActionLink}>View →</Text>
              </View>
            </View>

            {/* Attention Item 3: Upcoming Farm Audit */}
            <View style={styles.attentionCard}>
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

              <View style={{ alignSelf: 'flex-start', marginTop: 8, marginLeft: 34 }}>
                <Text style={styles.attentionActionLink}>View Audit →</Text>
              </View>
            </View>

            {/* Attention Item 4: Farmer Dispute */}
            <View style={styles.attentionCard}>
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

              <View style={{ alignSelf: 'flex-start', marginTop: 8, marginLeft: 34 }}>
                <Text style={styles.attentionActionLink}>View Dispute →</Text>
              </View>
            </View>

            {/* 6. Farmer Product Listings Section */}
            <TouchableOpacity
              style={{ marginTop: 18 }}
              onPress={() => setSubView('product_listings')}
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
                    onPress={() => setSubView('product_listings')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionCropName}>• Tomato — Grade 1 (50 KG)</Text>
                    <Text style={styles.accordionCropPrice}>₹100/KG</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.accordionItemRow}
                    onPress={() => setSubView('product_listings')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionCropName}>• Potato — Grade 2 (120 KG)</Text>
                    <Text style={styles.accordionCropPrice}>₹28/KG</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.accordionItemRow}
                    onPress={() => setSubView('product_listings')}
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
                    onPress={() => setSubView('product_listings')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionCropName}>• Green Beans — Grade 1 (75 KG)</Text>
                    <Text style={styles.accordionCropPrice}>₹45/KG</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.accordionItemRow}
                    onPress={() => setSubView('product_listings')}
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
              onPress={() => setSubView('product_listings')}
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
              onPress={() => setSubView('product_listings')}
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
              onPress={() => setSubView('admin_activity')}
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
                onPress={() => setSubView('product_listings')}
                activeOpacity={0.75}
              >
                <ClipboardChecklistIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Review Listings</Text>
              </TouchableOpacity>

              {/* Row 1, Col 2: View Farmers */}
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => setActiveTab('Farmers')}
                activeOpacity={0.75}
              >
                <PeopleGroupIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>View Farmers</Text>
              </TouchableOpacity>

              {/* Row 1, Col 3: Audit Calendar */}
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => {
                  setAuditInitialFilter('calendar');
                  setAuditInitialView('calendar');
                  setSubView('audit_schedule');
                }}
                activeOpacity={0.75}
              >
                <CalendarOutlineIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Audit Calendar</Text>
              </TouchableOpacity>

              {/* Row 2, Col 1: Review Disputes */}
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() =>
                  setModalItem({
                    title: 'Review Disputes',
                    content: '4 active farmer mediation cases open in Nilgiris cooperative zone.',
                  })
                }
                activeOpacity={0.75}
              >
                <ExactScalesIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Review Disputes</Text>
              </TouchableOpacity>

              {/* Row 2, Col 2: Community */}
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() =>
                  setModalItem({
                    title: 'Farmer Community Forum',
                    content: 'Nilgiris Smallholder Association noticeboard: Next cooperative assembly on Saturday.',
                  })
                }
                activeOpacity={0.75}
              >
                <SpeechBubbleIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Community</Text>
              </TouchableOpacity>

              {/* Row 2, Col 3: Ratings */}
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => setSubView('farmer_ratings')}
                activeOpacity={0.85}
              >
                <StarRatingsIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Ratings</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        )}

        {/* ─── Farmers Tab (Matching Screenshot 1) ─── */}
        {activeTab === 'Farmers' && (
          <FarmersDirectoryScreen onBack={() => setActiveTab('Home')} />
        )}

        {/* ─── Produce Tab (Image 1 Mockup) ─── */}
        {activeTab === 'Produce' && (
          <FarmerProduceTabScreen
            onBack={() => setActiveTab('Home')}
            onNavigateToListings={(filter) => {
              setListingInitialFilter(filter || 'all');
              setSubView('produce_listings');
            }}
            onNavigateToHistory={() => setSubView('produce_history')}
            onOpenNotifications={() => setSubView('notifications')}
          />
        )}

        {/* ─── Audits Tab (Screenshots 1 & 2) ─── */}
        {activeTab === 'Audits' && (
          <FarmerAuditsTabScreen
            onBack={() => setActiveTab('Home')}
            onNavigateSchedule={(preFilter, auditId) => {
              setAuditInitialFilter(
                preFilter === 'calendar'
                  ? 'calendar'
                  : preFilter === 'field_visit'
                  ? 'field_visit'
                  : preFilter === 'history'
                  ? 'history'
                  : preFilter === 'report'
                  ? 'report'
                  : 'calendar'
              );
              setAuditInitialId(auditId);
              setAuditInitialView(
                preFilter === 'field_visit'
                  ? 'calendar'
                  : preFilter === 'report'
                  ? 'audit_report'
                  : preFilter === 'calendar'
                  ? 'calendar'
                  : auditId
                  ? 'audit_details_m5'
                  : preFilter === 'history'
                  ? 'history'
                  : undefined
              );
              setSubView('audit_schedule');
            }}
            onOpenNotifications={() => setSubView('notifications')}
          />
        )}

        {/* ─── More Tab (Screenshot 5) ─── */}
        {activeTab === 'More' && (
          <FarmerAdminMoreScreen
            onBack={() => setActiveTab('Home')}
            onNavigatePurchases={() => setSubView('purchases')}
            onNavigateInputsPest={() => setSubView('inputs_pest')}
            onNavigateMarketPricing={() => setSubView('market_pricing')}
            onNavigateProduceListings={() => setSubView('produce_listings')}
            onNavigateProfile={() => setSubView('profile')}
            onNavigateNotifications={() => setSubView('notifications')}
            onSwitchRole={() =>
              setModalItem({
                title: 'Switch Role',
                content: 'You are currently in Farmer Admin mode. Tap to switch to Smallholder Farmer mode.',
              })
            }
            onItemSelect={(title) => {
              if (title === 'Inputs & Pest Management') {
                setSubView('inputs_pest');
              } else if (title === 'Market & Pricing') {
                setSubView('market_pricing');
              } else if (title === 'Ratings') {
                setSubView('farmer_ratings');
              } else if (title === 'Disputes') {
                setModalItem({
                  title: 'Disputes Mediation',
                  content: '4 active farmer mediation cases open in Nilgiris cooperative zone.',
                });
              } else if (title === 'Community') {
                setModalItem({
                  title: 'Community Forum',
                  content: 'Nilgiris Smallholder Association noticeboard: Next cooperative assembly on Saturday.',
                });
              } else {
                setModalItem({
                  title,
                  content: `Detailed management and parameters for ${title}.`,
                });
              }
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

      {/* ─── Bottom Tab Bar (5 Tabs) ─── */}
      <View style={styles.tabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Home')}
          accessibilityRole="tab"
          accessibilityLabel="Home"
        >
          <TabHomeIcon active={activeTab === 'Home'} />
          <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Farmers')}
          accessibilityRole="tab"
          accessibilityLabel="Farmers"
        >
          <TabFarmersIcon active={activeTab === 'Farmers'} />
          <Text style={[styles.tabLabel, activeTab === 'Farmers' && styles.tabLabelActive]}>Farmers</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Produce')}
          accessibilityRole="tab"
          accessibilityLabel="Produce"
        >
          <TabProduceIcon active={activeTab === 'Produce'} />
          <Text style={[styles.tabLabel, activeTab === 'Produce' && styles.tabLabelActive]}>Produce</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Audits')}
          accessibilityRole="tab"
          accessibilityLabel="Audits"
        >
          <TabAuditsIcon active={activeTab === 'Audits'} />
          <Text style={[styles.tabLabel, activeTab === 'Audits' && styles.tabLabelActive]}>Audits</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('More')}
          accessibilityRole="tab"
          accessibilityLabel="More"
        >
          <TabMoreIcon active={activeTab === 'More'} />
          <Text style={[styles.tabLabel, activeTab === 'More' && styles.tabLabelActive]}>More</Text>
        </Pressable>
      </View>
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
    color: adminColors.rustDeep,
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
    backgroundColor: adminColors.brandTintWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    ...adminType.rowTitle,
    color: adminColors.rustDeep,
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

  // ─── Quick Actions (Image 4 Exact 6-Tile Grid) ───
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
