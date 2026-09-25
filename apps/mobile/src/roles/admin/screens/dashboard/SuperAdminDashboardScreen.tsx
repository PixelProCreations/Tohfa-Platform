import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { fetchMe, logout, type UserMe } from '../../../farmer/api/auth';
import { Icon } from '@tohfa/mobile-ui';
import { colors } from '../../../farmer/theme';
import { AdminProfileScreen } from './AdminProfileScreen';
import {
  MarketPricingHomeScreen,
  FairPriceCeilingScreen,
  UpdateFairPriceScreen,
  BulkPriceUpdateScreen,
  PriceHistoryScreen,
  MarketDayScheduleScreen,
  AddMarketDayScreen,
  ListingApprovalQueueScreen,
  type MarketDay,
  MOCK_DAYS,
} from './';
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
import {
  SystemConfigScreen,
  EditChannelAllocationScreen,
  IntegrationDetailScreen,
  CompanyDetailsScreen,
  SystemAuditLogsScreen,
} from '../config';
import {
  CreateAdminAccountScreen,
  type AdminAccountData,
} from './CreateAdminAccountScreen';
import { ManageAdminsScreen } from './ManageAdminsScreen';
import { AdminDetailProfileScreen } from './AdminDetailProfileScreen';
import { AdminPermissionsMatrixScreen } from './AdminPermissionsMatrixScreen';
import { AdminActivityLogsScreen } from './AdminActivityLogsScreen';
import { AdminRequestsApprovalScreen } from './AdminRequestsApprovalScreen';
import { AdminRequestDetailScreen } from './AdminRequestDetailScreen';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust: '#6B230B', // Deep terracotta heading color
  orange: '#F0562A', // Signature brand orange
  pageBg: '#FAF7F2', // Warm light cream
  cardBg: '#FFFFFF',
  ink: '#1F1714', // Near-black text
  labelMuted: '#786F68', // Secondary muted text
  border: '#EDE7DE', // Soft card border
  peachBadge: '#FDEEE9', // Soft peach pill background
  peachText: '#943818', // Deep terracotta pill text
  peachIconBg: '#FFF1EB', // Soft peach icon container
  blueIconBg: '#EBF3FA', // Soft blue icon container
  blueText: '#2563EB',
  greenIconBg: '#DCFCE7', // Soft green icon container
  greenText: '#15803D',
  amberIconBg: '#FEF3C7', // Soft amber icon container
  amberText: '#B45309',
  alertRed: '#E04F34', // Alert 1 border & icon
  alertAmber: '#9A5B20', // Alert 2 border & icon
  tabInactive: '#786F68',
  tabBorder: '#EDE7DE',
  checkGreen: '#0D8253',
};

// Shorthand alias for colors used in components
const A = {
  orange: PALETTE.orange,
  orangeBg: PALETTE.peachIconBg,
  blue: PALETTE.blueText,
  blueBg: PALETTE.blueIconBg,
  greenBg: PALETTE.greenIconBg,
  amber: PALETTE.amberText,
  amberBg: PALETTE.amberIconBg,
  pageBg: PALETTE.pageBg,
  muted: PALETTE.labelMuted,
};

// ─── Tab Bar Types ────────────────────────────────────────────────────────────
type AdminTab = 'Dashboard' | 'Farmers' | 'Sales' | 'Reports' | 'Profile';

// ─── SVG Icons Matching Exact Design Mockup ──────────────────────────────────
function ShieldIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={PALETTE.peachText}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PersonAvatarIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke={PALETTE.orange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FarmersGridIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke={PALETTE.orange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CustomersGridIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke={PALETTE.blueText}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QuickBtn({
  iconName, label, accent = A.orange, bg = A.orangeBg, onPress,
}: { iconName: string; label: string; accent?: string; bg?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} activeOpacity={0.75} onPress={onPress}>
      <View style={[styles.quickIconWrap, { backgroundColor: bg }]}>
        <Icon name={iconName} size={22} color={accent} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}


function RevenueGridIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={PALETTE.greenText} strokeWidth="2" />
      <Path d="M2 10h20" stroke={PALETTE.greenText} strokeWidth="2" />
      <Path d="M6 15h4" stroke={PALETTE.greenText} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarehouseGridIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={PALETTE.amberText}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CardPaymentIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={PALETTE.orange} strokeWidth="2" />
      <Path d="M2 10h20" stroke={PALETTE.orange} strokeWidth="2" />
      <Path d="M6 15h3" stroke={PALETTE.orange} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UserPlusIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"
        stroke={PALETTE.orange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GearIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={PALETTE.orange} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={PALETTE.orange}
        strokeWidth="2"
      />
    </Svg>
  );
}

function MarketPriceIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6L13.5 15.5L8.5 10.5L1 18"
        stroke={PALETTE.orange}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 6H23V12"
        stroke={PALETTE.orange}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BankIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={PALETTE.orange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertTriangleIcon({ color = PALETTE.orange }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Bottom Tab Icons ─────────────────────────────────────────────────────────
function DashboardTabIcon({ active }: { active: boolean }) {
  const c = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={c} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={c} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={c} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="1" stroke={c} strokeWidth="2" />
    </Svg>
  );
}

function FarmersTabIcon({ active }: { active: boolean }) {
  const c = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SalesTabIcon({ active }: { active: boolean }) {
  const c = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="2" />
      <Path d="M3 9h18M8 14h8" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ReportsTabIcon({ active }: { active: boolean }) {
  const c = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 20V10M12 20V4M6 20v-6"
        stroke={c}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileNavIcon({ active }: { active: boolean }) {
  const c = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── UI Helper Components ─────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function OverviewCard({
  iconBox,
  value,
  label,
  delta,
  deltaColor,
  valueStyle,
  onPress,
}: {
  iconBox: React.ReactNode;
  value: string;
  label: string;
  delta: string;
  deltaColor?: string;
  valueStyle?: object;
  onPress?: () => void;
}) {
  const cardBody = (
    <View style={styles.overviewCard}>
      <View style={styles.cardTopRow}>{iconBox}</View>
      <Text style={[styles.statValue, valueStyle]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statDelta, { color: deltaColor ?? PALETTE.ink }]}>{delta}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.overviewCardWrapper}>
        {cardBody}
      </TouchableOpacity>
    );
  }

  return <View style={styles.overviewCardWrapper}>{cardBody}</View>;
}

function ApprovalRow({
  icon,
  title,
  subtitle,
  badge,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge: number;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.approvalCard}>
      <View style={styles.approvalIconBox}>{icon}</View>
      <View style={styles.approvalTextCol}>
        <Text style={styles.approvalTitle}>{title}</Text>
        <Text style={styles.approvalSub}>{subtitle}</Text>
      </View>
      <View style={styles.badgeCircle}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 18l6-6-6-6"
          stroke="#A8A29E"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

function ComplianceAlertCard({
  title,
  subtitle,
  linkLabel,
  accentColor = PALETTE.orange,
  onLinkPress,
}: {
  title: string;
  subtitle: string;
  linkLabel: string;
  accentColor?: string;
  onLinkPress?: () => void;
}) {
  return (
    <View style={[styles.alertCard, { borderLeftColor: accentColor }]}>
      <View style={styles.alertHeaderRow}>
        <AlertTriangleIcon color={accentColor} />
        <Text style={styles.alertTitle}>{title}</Text>
      </View>
      <Text style={styles.alertSub}>{subtitle}</Text>
      {onLinkPress ? (
        <TouchableOpacity onPress={onLinkPress} activeOpacity={0.7}>
          <Text style={styles.alertLink}>{linkLabel} →</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.alertLink, { color: PALETTE.labelMuted }]}>{linkLabel} →</Text>
      )}
    </View>
  );
}

function QuickActionCard({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.75}>
        <View style={styles.quickIconWrap}>{icon}</View>
        <Text style={styles.quickLabel}>{label}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.quickCard}>
      <View style={styles.quickIconWrap}>{icon}</View>
      <Text style={styles.quickLabel}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export type AdminScreenName =
  | 'MarketPricingHome'
  | 'FairPriceCeiling'
  | 'UpdateFairPrice'
  | 'BulkPriceUpdate'
  | 'PriceHistory'
  | 'MarketDaySchedule'
  | 'ListingApprovalQueue'
  | 'AuditCalendar'
  | 'FinancialDashboard'
  | 'AdminAllFarmers'
  | 'AdminFarmerDetail'
  | 'AdminFarmMap'
  | 'AdminRatingScorecard'
  | 'AdminCertVerification'
  | 'AdminKycReview'
  | 'AdminComplianceTiers';

export interface SuperAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: AdminScreenName, params?: Record<string, unknown>) => void;
}

export function SuperAdminDashboardScreen({
  onSignOut,
  onNavigate,
}: SuperAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [user, setUser] = useState<UserMe | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerListItem | null>(null);
  const [farmerSubScreen, setFarmerSubScreen] = useState<'detail' | 'map' | 'scorecard' | null>(null);

  // Sales subscreen navigation state
  const [salesSubScreen, setSalesSubScreen] = useState<
    'overview' | 'online' | 'market' | 'horeca' | 'b2b' | 'fulfillment' | 'invoice' | 'returns'
  >('overview');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<OnlineOrderItem | null>(null);
  const [selectedSalesB2B, setSelectedSalesB2B] = useState<B2BAccount | null>(null);

  // System config subscreen navigation state
  const [configSubScreen, setConfigSubScreen] = useState<
    'main' | 'channel_allocation' | 'integration' | 'company' | 'audit_logs' | null
  >(null);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string>('razorpay');

  // Admin management subscreen navigation state
  const [adminSubScreen, setAdminSubScreen] = useState<
    'create' | 'manage' | 'detail' | 'permissions' | 'activity' | 'requests' | null
  >(null);
  const [selectedAdminToEdit, setSelectedAdminToEdit] = useState<AdminAccountData | null>(null);
  const [selectedAdminProfile, setSelectedAdminProfile] = useState<AdminAccountData | null>(null);
  // Market & Pricing subscreen navigation state
  const [pricingSubScreen, setPricingSubScreen] = useState<
    | 'home'
    | 'fair_price'
    | 'update_price'
    | 'bulk_update'
    | 'price_history'
    | 'market_days'
    | 'add_market_day'
    | 'listing_approval'
    | null
  >(null);
  const [selectedPriceCrop, setSelectedPriceCrop] = useState<{
    name: string;
    category: string;
    price: number;
    change?: number;
    lastUpdate: string;
  } | null>(null);
  const [marketDaysList, setMarketDaysList] = useState<MarketDay[]>(MOCK_DAYS);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => { });
  }, []);

  const displayName = user?.fullName && user.fullName !== 'Super Administrator' ? user.fullName : 'Rajesh Kumar';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      {/* Main Content Area */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Dashboard' ? (
          adminSubScreen === 'create' ? (
            <CreateAdminAccountScreen
              initialData={selectedAdminToEdit ?? undefined}
              currentUserRole="SUPER_ADMIN"
              onBack={() => {
                setSelectedAdminToEdit(null);
                setAdminSubScreen(null);
              }}
              onViewDirectory={() => {
                setSelectedAdminToEdit(null);
                setAdminSubScreen('manage');
              }}
              onSuccess={() => {
                setSelectedAdminToEdit(null);
                setAdminSubScreen(null);
              }}
            />
          ) : adminSubScreen === 'manage' ? (
            <ManageAdminsScreen
              onBack={() => setAdminSubScreen(null)}
              onCreateNew={() => {
                setSelectedAdminToEdit(null);
                setAdminSubScreen('create');
              }}
              onEditAdmin={(adm) => {
                setSelectedAdminToEdit(adm);
                setAdminSubScreen('create');
              }}
              onViewAdminDetail={(adm) => {
                setSelectedAdminProfile(adm);
                setAdminSubScreen('detail');
              }}
              onViewPermissionsMatrix={() => setAdminSubScreen('permissions')}
              onViewActivityLogs={() => setAdminSubScreen('activity')}
              onViewRequests={() => setAdminSubScreen('requests')}
            />
          ) : adminSubScreen === 'detail' && selectedAdminProfile ? (
            <AdminDetailProfileScreen
              admin={selectedAdminProfile}
              onBack={() => setAdminSubScreen('manage')}
              onEdit={(adm) => {
                setSelectedAdminToEdit(adm);
                setAdminSubScreen('create');
              }}
              onViewPermissionsMatrix={() => setAdminSubScreen('permissions')}
              onViewActivityLogs={() => setAdminSubScreen('activity')}
            />
          ) : adminSubScreen === 'permissions' ? (
            <AdminPermissionsMatrixScreen
              onBack={() => setAdminSubScreen('manage')}
            />
          ) : adminSubScreen === 'activity' ? (
            <AdminActivityLogsScreen
              onBack={() => setAdminSubScreen('manage')}
            />
          ) : adminSubScreen === 'requests' ? (
            <AdminRequestsApprovalScreen
              onBack={() => setAdminSubScreen(null)}
              onRequestHandled={() => { }}
            />
          ) : configSubScreen === 'main' ? (
            <SystemConfigScreen
              onBack={() => setConfigSubScreen(null)}
              onOpenChannelAllocation={() => setConfigSubScreen('channel_allocation')}
              onOpenIntegration={(id) => {
                setSelectedIntegrationId(id);
                setConfigSubScreen('integration');
              }}
              onOpenCompanyDetails={() => setConfigSubScreen('company')}
              onOpenAuditLogs={() => setConfigSubScreen('audit_logs')}
            />
          ) : configSubScreen === 'channel_allocation' ? (
            <EditChannelAllocationScreen onBack={() => setConfigSubScreen('main')} />
          ) : configSubScreen === 'integration' ? (
            <IntegrationDetailScreen
              integrationId={selectedIntegrationId}
              onBack={() => setConfigSubScreen('main')}
            />
          ) : configSubScreen === 'company' ? (
            <CompanyDetailsScreen onBack={() => setConfigSubScreen('main')} />
          ) : configSubScreen === 'audit_logs' ? (
            <SystemAuditLogsScreen onBack={() => setConfigSubScreen('main')} />
          ) : pricingSubScreen === 'home' ? (
            <MarketPricingHomeScreen
              onBack={() => setPricingSubScreen(null)}
              onNavigateToFairPrice={() => setPricingSubScreen('fair_price')}
              onNavigateToMarketDay={() => setPricingSubScreen('market_days')}
              onNavigateToListingApproval={() => setPricingSubScreen('listing_approval')}
            />
          ) : pricingSubScreen === 'fair_price' ? (
            <FairPriceCeilingScreen
              onBack={() => setPricingSubScreen('home')}
              onUpdatePrice={(item) => {
                setSelectedPriceCrop(item);
                setPricingSubScreen('update_price');
              }}
              onBulkUpdate={() => setPricingSubScreen('bulk_update')}
              onViewHistory={(item) => {
                setSelectedPriceCrop(item);
                setPricingSubScreen('price_history');
              }}
            />
          ) : pricingSubScreen === 'update_price' ? (
            <UpdateFairPriceScreen
              onBack={() => setPricingSubScreen('fair_price')}
              itemName={selectedPriceCrop?.name ?? 'Carrots'}
              category={selectedPriceCrop?.category ?? 'Vegetables'}
              currentPrice={selectedPriceCrop?.price ?? 42}
              onSave={(newPrice) => {
                if (selectedPriceCrop) {
                  setSelectedPriceCrop({ ...selectedPriceCrop, price: newPrice });
                }
                setPricingSubScreen('fair_price');
              }}
            />
          ) : pricingSubScreen === 'bulk_update' ? (
            <BulkPriceUpdateScreen
              onBack={() => setPricingSubScreen('fair_price')}
              onApply={() => {
                setPricingSubScreen('fair_price');
              }}
            />
          ) : pricingSubScreen === 'price_history' ? (
            <PriceHistoryScreen
              onBack={() => setPricingSubScreen('fair_price')}
              itemName={selectedPriceCrop?.name ?? 'Carrots'}
              category={selectedPriceCrop?.category ?? 'Vegetables'}
              currentPrice={selectedPriceCrop?.price ?? 42}
            />
          ) : pricingSubScreen === 'market_days' ? (
            <MarketDayScheduleScreen
              onBack={() => setPricingSubScreen('home')}
              onAddMarketDay={() => setPricingSubScreen('add_market_day')}
              onToggle={(id, val) => {
                setMarketDaysList((prev) =>
                  prev.map((d) => (d.id === id ? { ...d, isActive: val } : d)),
                );
              }}
              days={marketDaysList}
              onDaysChange={setMarketDaysList}
            />
          ) : pricingSubScreen === 'add_market_day' ? (
            <AddMarketDayScreen
              onBack={() => setPricingSubScreen('market_days')}
              onSave={(newDay) => {
                setMarketDaysList((prev) => [
                  {
                    id: String(Date.now()),
                    date: newDay.date,
                    month: newDay.month,
                    warehouse: newDay.warehouse,
                    timeRange: newDay.timeRange,
                    isActive: true,
                  },
                  ...prev,
                ]);
                setPricingSubScreen('market_days');
              }}
            />
          ) : pricingSubScreen === 'listing_approval' ? (
            <ListingApprovalQueueScreen
              onBack={() => setPricingSubScreen('home')}
              onApprove={() => {}}
              onCounter={() => {}}
              onReject={() => {}}
            />
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollPad}
              showsVerticalScrollIndicator={false}
            >
              {/* Header: Greeting & Role */}
              <View style={styles.pageHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.greetSmall}>Good morning,</Text>
                  <Text style={styles.greetName}>{displayName}</Text>

                  {/* Role Pill */}
                  <View style={styles.rolePill}>
                    <ShieldIcon />
                    <Text style={styles.rolePillText}>Super Admin</Text>
                  </View>
                </View>

                {/* Profile Avatar */}
                <TouchableOpacity
                  style={styles.avatarCircle}
                  onPress={() => setActiveTab('Profile')}
                  activeOpacity={0.8}
                >
                  <PersonAvatarIcon />
                </TouchableOpacity>
              </View>

              {/* Section 1: System-wide overview */}
              <SectionHeader title="System-wide overview" />
              <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                  <OverviewCard
                    iconBox={
                      <View style={[styles.statIconBox, { backgroundColor: PALETTE.peachIconBg }]}>
                        <FarmersGridIcon />
                      </View>
                    }
                    value="1,284"
                    label="Total Farmers"
                    delta="↑ +18 this month"
                    deltaColor={PALETTE.greenText}
                    onPress={() => {
                      if (onNavigate) {
                        onNavigate('AdminAllFarmers');
                      } else {
                        setActiveTab('Farmers');
                      }
                    }}
                  />
                  <OverviewCard
                    iconBox={
                      <View style={[styles.statIconBox, { backgroundColor: PALETTE.blueIconBg }]}>
                        <CustomersGridIcon />
                      </View>
                    }
                    value="6,502"
                    label="Total Customers"
                    delta="↑ +142 this month"
                    deltaColor={PALETTE.greenText}
                  />
                </View>

                <View style={styles.statsRow}>
                  <OverviewCard
                    iconBox={
                      <View style={[styles.statIconBox, { backgroundColor: PALETTE.greenIconBg }]}>
                        <RevenueGridIcon />
                      </View>
                    }
                    value="₹18.4L"
                    label="Revenue (MTD)"
                    delta="↑ +6.2%"
                    deltaColor={PALETTE.greenText}
                  />
                  <OverviewCard
                    iconBox={
                      <View style={[styles.statIconBox, { backgroundColor: PALETTE.amberIconBg }]}>
                        <WarehouseGridIcon />
                      </View>
                    }
                    value="4 / 4"
                    valueStyle={styles.italicVal}
                    label="Warehouses Active"
                    delta="✓ All operational"
                    deltaColor={PALETTE.checkGreen}
                  />
                </View>
              </View>

              {/* Section 2: Needs your approval */}
              <SectionHeader title="Needs your approval" />
              <View style={styles.cardStack}>
                <ApprovalRow
                  icon={<CardPaymentIcon />}
                  title="Dual-approval payouts"
                  subtitle="3 payouts above ₹10,000 awaiting your sign-off"
                  badge={3}
                />
                <ApprovalRow
                  icon={<UserPlusIcon />}
                  title="New admin account requests"
                  subtitle="2 Sub Warehouse Admin accounts pending creation"
                  badge={2}
                  onPress={() => setAdminSubScreen('requests')}
                />
              </View>

              {/* Section 3: Compliance alerts */}
              <SectionHeader title="Compliance alerts" />
              <View style={styles.cardStack}>
                {/* Only Audit module navigation is enabled */}
                <ComplianceAlertCard
                  title="7 farms overdue for quarterly audit"
                  subtitle="Q3 audit window closes in 5 days across Coonoor and Kotagiri zones."
                  linkLabel="Review audit calendar"
                  accentColor={PALETTE.alertRed}
                  onLinkPress={() => onNavigate?.('AuditCalendar')}
                />
                <ComplianceAlertCard
                  title="12 certifications expiring within 30 days"
                  subtitle="PGS Organic renewals needed before listings are auto-blocked."
                  linkLabel="View farmers"
                  accentColor={PALETTE.alertAmber}
                />
              </View>

              {/* Section 4: Quick actions */}
              <SectionHeader title="Quick actions" />
              <View style={styles.quickRow}>
                <QuickActionCard
                  icon={<UserPlusIcon />}
                  label={'Create\nAdmin'}
                  onPress={() => {
                    setSelectedAdminToEdit(null);
                    setAdminSubScreen('create');
                  }}
                />
                <QuickActionCard
                  icon={<GearIcon />}
                  label={'System\nConfig'}
                  onPress={() => setConfigSubScreen('main')}
                />
                <QuickActionCard
                  icon={<MarketPriceIcon />}
                  label={'Market &\nPrice'}
                  onPress={() => setPricingSubScreen('home')}
                />
                {/* Only Finance module navigation is enabled */}
                <QuickActionCard
                  icon={<BankIcon />}
                  label="Finance"
                  onPress={() => onNavigate?.('FinancialDashboard')}
                />
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          )
        ) : activeTab === 'Farmers' ? (
          farmerSubScreen === 'map' && selectedFarmer ? (
            <AdminFarmMapScreen
              farmer={selectedFarmer}
              onBack={() => setFarmerSubScreen(null)}
            />
          ) : farmerSubScreen === 'scorecard' && selectedFarmer ? (
            <AdminRatingScorecardScreen
              farmer={selectedFarmer}
              onBack={() => setFarmerSubScreen(null)}
              onOpenComplianceTiers={() => { }}
            />
          ) : selectedFarmer ? (
            <AdminFarmerDetailScreen
              farmer={selectedFarmer}
              onBack={() => setSelectedFarmer(null)}
              onOpenFarmMap={() => setFarmerSubScreen('map')}
              onOpenRatingScorecard={() => setFarmerSubScreen('scorecard')}
            />
          ) : (
            <AdminAllFarmersScreen
              onBack={() => setActiveTab('Dashboard')}
              onSelectFarmer={(f) => {
                if (onNavigate) {
                  onNavigate('AdminFarmerDetail');
                } else {
                  setSelectedFarmer(f);
                }
              }}
            />
          )
        ) : activeTab === 'Sales' ? (
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
              onBack={() => setActiveTab('Dashboard')}
              onSelectChannel={(ch) => setSalesSubScreen(ch)}
              onOpenFulfillment={() => setSalesSubScreen('fulfillment')}
              onOpenReturns={() => setSalesSubScreen('returns')}
            />
          )
        ) : activeTab === 'Reports' ? (
          <View style={styles.profilePane}>
            <Text style={styles.profileName}>Operational Reports</Text>
            <Text style={{ color: PALETTE.labelMuted, marginTop: 8, textAlign: 'center' }}>
              Nilgiris regional exchange & audit progress reports
            </Text>
          </View>
        ) : activeTab === 'Profile' ? (
          <View style={styles.profilePane}>
            <View style={styles.profileAvatar}>
              <PersonAvatarIcon />
            </View>
            <Text style={styles.profileName}>{displayName}</Text>
            <View style={[styles.rolePill, { alignSelf: 'center', marginBottom: 24 }]}>
              <ShieldIcon />
              <Text style={styles.rolePillText}>Super Admin</Text>
            </View>
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={() => {
                void (async () => {
                  await logout();
                  onSignOut();
                })();
              }}
              activeOpacity={0.8}
            >
              <Icon name="cancel" size={18} color={colors.danger} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.blankPane} />
        )}
      </View>

      {/* ─── Bottom Navigation Tab Bar ─── */}
      <View style={styles.tabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => {
            setConfigSubScreen(null);
            setPricingSubScreen(null);
            setActiveTab('Dashboard');
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Dashboard' }}
        >
          <DashboardTabIcon active={activeTab === 'Dashboard'} />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Dashboard' && styles.tabLabelActive,
            ]}
          >
            Dashboard
          </Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            setConfigSubScreen(null);
            setPricingSubScreen(null);
            if (onNavigate) {
              onNavigate('AdminAllFarmers');
            } else {
              setActiveTab('Farmers');
            }
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Farmers' }}
        >
          <FarmersTabIcon active={activeTab === 'Farmers'} />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Farmers' && styles.tabLabelActive,
            ]}
          >
            Farmers
          </Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            setConfigSubScreen(null);
            setPricingSubScreen(null);
            setSalesSubScreen('overview');
            setActiveTab('Sales');
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Sales' }}
        >
          <SalesTabIcon active={activeTab === 'Sales'} />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Sales' && styles.tabLabelActive,
            ]}
          >
            Sales
          </Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            setConfigSubScreen(null);
            setPricingSubScreen(null);
            setActiveTab('Reports');
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Reports' }}
        >
          <ReportsTabIcon active={activeTab === 'Reports'} />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Reports' && styles.tabLabelActive,
            ]}
          >
            Reports
          </Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            setConfigSubScreen(null);
            setPricingSubScreen(null);
            setActiveTab('Profile');
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Profile' }}
        >
          <ProfileNavIcon active={activeTab === 'Profile'} />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Profile' && styles.tabLabelActive,
            ]}
          >
            Profile
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },

  // Header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  greetSmall: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    marginBottom: 2,
  },
  greetName: {
    fontSize: 24,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.peachBadge,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.peachText,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PALETTE.peachBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section Headers
  sectionRow: {
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: PALETTE.titleRust,
  },

  // Stats Grid
  statsGrid: {
    gap: 12,
    marginBottom: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCardWrapper: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTopRow: {
    marginBottom: 12,
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.3,
  },
  italicVal: {
    fontStyle: 'italic',
  },
  statLabel: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: 3,
    marginBottom: 5,
  },
  statDelta: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Stack of full-width cards
  cardStack: {
    gap: 10,
    marginBottom: 22,
  },

  // Approval Row
  approvalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  approvalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: PALETTE.peachIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  approvalTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  approvalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 3,
  },
  approvalSub: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    lineHeight: 16,
  },
  badgeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PALETTE.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Compliance Alert Card
  alertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderLeftWidth: 3.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    marginLeft: 8,
    flex: 1,
  },
  alertSub: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    lineHeight: 17,
    paddingLeft: 26,
    marginBottom: 8,
  },
  alertLink: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.orange,
    paddingLeft: 26,
  },

  // Quick Actions Row
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.ink,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 15,
  },

  // Bottom Tab Bar
  tabBar: {
    flexDirection: 'row',
    height: 66,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: '100%',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: PALETTE.tabInactive,
  },
  tabLabelActive: {
    color: PALETTE.orange,
    fontWeight: '700',
  },

  // Profile Fallback Pane
  profilePane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: PALETTE.pageBg,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PALETTE.peachBadge,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },

  // Blank Screen for other tabs
  blankPane: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
});
