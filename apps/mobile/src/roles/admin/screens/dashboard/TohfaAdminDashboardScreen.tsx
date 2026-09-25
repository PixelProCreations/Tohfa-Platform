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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { fetchMe, logout, type UserMe } from '../../../farmer/api/auth';
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

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  pageBg: '#FFFFFF',
  cardBg: '#FFFFFF',
  textHeading: '#6B230B', // Dark chestnut / rust color for section titles
  textPrimary: '#111827', // Crisp near-black for primary text & numbers
  textSecondary: '#6B7280', // Neutral gray for secondary / timestamp text
  textMuted: '#4B5563', // Slate gray for card labels
  orangePrimary: '#D9532F', // Signature terracotta / orange
  orangeLight: '#FFF1EB', // Soft peach icon & avatar background
  borderSoft: '#F0ECE6', // Subtle warm card borders
  badgeBg: '#FFF1EB',
  badgeBorder: '#FAD9CC',
  badgeText: '#8B2C0D', // Deep terracotta badge text
  blueAccent: '#0C447C', // Exact blue shade from sales channel snapshot
  blueIconBg: '#EBF3FA',
  blueIcon: '#0C447C',
  amberIconBg: '#FFF4E8',
  amberIcon: '#C05621',
  purpleIconBg: '#F0EEFC',
  purpleIcon: '#5B45B2',
  greenAccent: '#16A34A',
  tabInactive: '#4B5563',
  tabActive: '#D9532F',
  tabBorder: '#ECE8E3',
};

export type TohfaAdminTab = 'Dashboard' | 'Farmers' | 'Sales' | 'Reports' | 'Profile';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ShieldCheckIcon({ color = PALETTE.badgeText, size = 13 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PersonAvatarIcon({ color = PALETTE.orangePrimary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="7"
        r="4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserPlusIcon({ color = PALETTE.orangePrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="8.5"
        cy="7"
        r="4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="19"
        y1="8"
        x2="19"
        y2="14"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="22"
        y1="11"
        x2="16"
        y2="11"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PackageCubeIcon({ color = PALETTE.blueIcon, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22.08V12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EditChecklistIcon({ color = PALETTE.amberIcon, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MicrophoneIcon({ color = PALETTE.purpleIcon, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 10v2a7 7 0 01-14 0v-2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="12"
        y1="19"
        x2="12"
        y2="22"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ color = PALETTE.textSecondary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WindowSplitIcon({ color = PALETTE.blueAccent, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2.2" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickHexagonCubeIcon({ color = PALETTE.orangePrimary, size = 26 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QuickCalendarIcon({ color = PALETTE.orangePrimary, size = 26 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2.2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickBarChartIcon({ color = PALETTE.orangePrimary, size = 26 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20h18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M7 20V14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M12 20V8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M17 20V4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Navigation Icons ──────────────────────────────────────────────────
function NavDashboardIcon({ color = PALETTE.tabActive, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

function NavFarmersIcon({ color = PALETTE.tabInactive, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 00-3-3.87"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21v-2a4 4 0 00-4-4H4a4 4 0 00-4 4v2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M23 21v-2a4 4 0 00-3-3.87"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NavSalesIcon({ color = PALETTE.tabInactive, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2.5" stroke={color} strokeWidth="2.2" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function NavReportsIcon({ color = PALETTE.tabInactive, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20h18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M7 20V14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M12 20V9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M17 20V5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function NavProfileIcon({ color = PALETTE.tabInactive, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Types & Props ────────────────────────────────────────────────────────────
export interface TohfaAdminDashboardScreenProps {
  onSignOut?: () => void;
  onNavigate?: (screen: string) => void;
  onSwitchRole?: (role: string) => void;
}

export function TohfaAdminDashboardScreen({
  onSignOut,
  onNavigate,
  onSwitchRole,
}: TohfaAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<TohfaAdminTab>('Dashboard');
  const [user, setUser] = useState<UserMe | null>(null);

  // Modal / Interaction states
  const [activeModal, setActiveModal] = useState<
    'approveListings' | 'scheduleAudit' | 'support' | null
  >(null);
  const [selectedAdminFarmer, setSelectedAdminFarmer] = useState<FarmerListItem | null>(null);
  const [farmerSubScreen, setFarmerSubScreen] = useState<'detail' | 'map' | 'scorecard' | null>(null);

  // Sales subscreen navigation state
  const [salesSubScreen, setSalesSubScreen] = useState<
    'overview' | 'online' | 'market' | 'horeca' | 'b2b' | 'fulfillment' | 'invoice' | 'returns'
  >('overview');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<OnlineOrderItem | null>(null);
  const [selectedSalesB2B, setSelectedSalesB2B] = useState<B2BAccount | null>(null);
  const [reportsSubScreen, setReportsSubScreen] = useState<
    'analytics' | 'pl' | 'farmerPerformance' | 'warehouseOps' | 'builder' | 'alerts' | 'announcements' | 'allRecent' | null
  >(null);

  // Operational snapshot dynamic counters
  const [stats, setStats] = useState({
    pendingApplications: 9,
    listingsToApprove: 23,
    auditsQuarter: 6,
    openTickets: 14,
  });

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => { });
  }, []);

  const adminName = user?.fullName ?? 'Ganga Devi';

  const handleOpenFarmers = () => {
    if (onNavigate) {
      onNavigate('AdminAllFarmers');
    } else {
      setActiveTab('Farmers');
    }
  };

  const handleOpenPendingApplications = () => {
    if (onNavigate) {
      onNavigate('AdminPendingApplications');
    } else {
      setActiveTab('Farmers');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <View style={{ flex: 1 }}>
        {/* ══════════════════════════════════════════════════════════════════════
            DASHBOARD TAB (Main Screen matching user design 100%)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Dashboard' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header: Greeting, Admin Name, Badge, Avatar */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeftCol}>
                <Text style={styles.greetingText}>Good morning,</Text>
                <Text style={styles.adminNameText}>{adminName}</Text>
                <View style={styles.adminBadge}>
                  <ShieldCheckIcon />
                  <Text style={styles.adminBadgeText}>TOHFA Admin</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => setActiveTab('Profile')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Admin Profile"
              >
                <PersonAvatarIcon />
              </TouchableOpacity>
            </View>

            {/* Section 1: Today's operational snapshot */}
            <Text style={styles.sectionHeading}>Today’s operational snapshot</Text>

            {/* 2x2 Snapshot Grid */}
            <View style={styles.snapshotGrid}>
              {/* Row 1 */}
              <View style={styles.gridRow}>
                {/* Card 1: 9 Pending Applications */}
                <TouchableOpacity
                  style={styles.snapshotCard}
                  onPress={handleOpenPendingApplications}
                  activeOpacity={0.85}
                >
                  <View style={[styles.snapshotIconBox, { backgroundColor: PALETTE.orangeLight }]}>
                    <UserPlusIcon color={PALETTE.orangePrimary} />
                  </View>
                  <Text style={styles.snapshotValue}>{stats.pendingApplications}</Text>
                  <Text style={styles.snapshotLabel}>Pending Applications</Text>
                </TouchableOpacity>

                {/* Card 2: 23 Listings to Approve */}
                <TouchableOpacity
                  style={styles.snapshotCard}
                  onPress={() => setActiveModal('approveListings')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.snapshotIconBox, { backgroundColor: PALETTE.blueIconBg }]}>
                    <PackageCubeIcon color={PALETTE.blueIcon} />
                  </View>
                  <Text style={styles.snapshotValue}>{stats.listingsToApprove}</Text>
                  <Text style={styles.snapshotLabel}>Listings to Approve</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
              <View style={styles.gridRow}>
                {/* Card 3: 6 Audits This Quarter */}
                <TouchableOpacity
                  style={styles.snapshotCard}
                  onPress={() => setActiveModal('scheduleAudit')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.snapshotIconBox, { backgroundColor: PALETTE.amberIconBg }]}>
                    <EditChecklistIcon color={PALETTE.amberIcon} />
                  </View>
                  <Text style={styles.snapshotValue}>{stats.auditsQuarter}</Text>
                  <Text style={styles.snapshotLabel}>Audits This Quarter</Text>
                </TouchableOpacity>

                {/* Card 4: 14 Open Support Tickets */}
                <TouchableOpacity
                  style={styles.snapshotCard}
                  onPress={() => setActiveModal('support')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.snapshotIconBox, { backgroundColor: PALETTE.purpleIconBg }]}>
                    <MicrophoneIcon color={PALETTE.purpleIcon} />
                  </View>
                  <Text style={styles.snapshotValue}>{stats.openTickets}</Text>
                  <Text style={styles.snapshotLabel}>Open Support Tickets</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 2: Pending farmer applications */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Pending farmer applications</Text>
              <TouchableOpacity
                onPress={handleOpenPendingApplications}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            {/* Farmer Item 1: Muthukumar S. — Kotagiri */}
            <TouchableOpacity
              style={styles.farmerCard}
              onPress={handleOpenPendingApplications}
              activeOpacity={0.85}
            >
              <View style={styles.farmerIconBox}>
                <PersonAvatarIcon size={22} color={PALETTE.orangePrimary} />
              </View>
              <View style={styles.farmerInfoCol}>
                <Text style={styles.farmerNameTitle}>Muthukumar S. — Kotagiri</Text>
                <Text style={styles.farmerSubText}>Applied 2 days ago · Documents complete</Text>
              </View>
              <ChevronRightIcon color="#737373" size={18} />
            </TouchableOpacity>

            {/* Farmer Item 2: Lakshmi R. — Ooty */}
            <TouchableOpacity
              style={styles.farmerCard}
              onPress={handleOpenPendingApplications}
              activeOpacity={0.85}
            >
              <View style={styles.farmerIconBox}>
                <PersonAvatarIcon size={22} color={PALETTE.orangePrimary} />
              </View>
              <View style={styles.farmerInfoCol}>
                <Text style={styles.farmerNameTitle}>Lakshmi R. — Ooty</Text>
                <Text style={styles.farmerSubText}>Applied 4 days ago · Awaiting KYC review</Text>
              </View>
              <ChevronRightIcon color="#737373" size={18} />
            </TouchableOpacity>

            {/* Section 3: Sales channel snapshot */}
            <Text style={styles.sectionHeading}>Sales channel snapshot</Text>

            <TouchableOpacity
              style={styles.salesSnapshotCard}
              onPress={() => {
                setSalesSubScreen('overview');
                setActiveTab('Sales');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.salesCardLeftAccent} />
              <View style={styles.salesCardTopRow}>
                <WindowSplitIcon color={PALETTE.blueAccent} size={22} />
                <Text style={styles.salesCardTitle}>
                  Online 70% · Market 10% · Horeca/B2B 20%
                </Text>
              </View>
              <Text style={styles.salesCardSubtitle}>
                Current channel split is within the locked 70/10/10/10 allocation policy.
              </Text>
            </TouchableOpacity>

            {/* Section 4: Quick actions */}
            <Text style={styles.sectionHeading}>Quick actions</Text>

            <View style={styles.quickActionsRow}>
              {/* Action 1: Approve Listings */}
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => setActiveModal('approveListings')}
                activeOpacity={0.8}
              >
                <QuickHexagonCubeIcon color={PALETTE.orangePrimary} size={26} />
                <Text style={styles.quickActionLabel}>Approve{'\n'}Listings</Text>
              </TouchableOpacity>

              {/* Action 2: Schedule Audit */}
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => setActiveModal('scheduleAudit')}
                activeOpacity={0.8}
              >
                <QuickCalendarIcon color={PALETTE.orangePrimary} size={26} />
                <Text style={styles.quickActionLabel}>Schedule{'\n'}Audit</Text>
              </TouchableOpacity>

              {/* Action 3: Support */}
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => setActiveModal('support')}
                activeOpacity={0.8}
              >
                <MicrophoneIcon color={PALETTE.orangePrimary} size={26} />
                <Text style={styles.quickActionLabelSingle}>Support</Text>
              </TouchableOpacity>

              {/* Action 4: Reports */}
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => {
                  setReportsSubScreen(null);
                  setActiveTab('Reports');
                }}
                activeOpacity={0.8}
              >
                <QuickBarChartIcon color={PALETTE.orangePrimary} size={26} />
                <Text style={styles.quickActionLabelSingle}>Reports</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            FARMERS TAB (Uses existing screens from Farmer management module)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Farmers' && (
          farmerSubScreen === 'map' && selectedAdminFarmer ? (
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
              onBack={() => setActiveTab('Dashboard')}
              onSelectFarmer={(f) => {
                if (onNavigate) {
                  onNavigate('AdminFarmerDetail');
                } else {
                  setSelectedAdminFarmer(f);
                }
              }}
            />
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SALES TAB (Screens 51 - 58)
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
              onBack={() => setActiveTab('Dashboard')}
              onSelectChannel={(ch) => setSalesSubScreen(ch)}
              onOpenFulfillment={() => setSalesSubScreen('fulfillment')}
              onOpenReturns={() => setSalesSubScreen('returns')}
            />
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            REPORTS TAB
           ══════════════════════════════════════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════════════════════
            REPORTS TAB (Matches 100% user design & attached screenshots)
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
              onBack={() => setActiveTab('Dashboard')}
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
            onBack={() => setActiveTab('Dashboard')}
          />
        )}
      </View>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM NAVIGATION BAR (5 Tabs)
         ══════════════════════════════════════════════════════════════════════ */}
      <View style={styles.bottomNav}>
        {/* Tab 1: Dashboard */}
        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => setActiveTab('Dashboard')}
          activeOpacity={0.7}
        >
          <NavDashboardIcon
            color={activeTab === 'Dashboard' ? PALETTE.tabActive : PALETTE.tabInactive}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'Dashboard' && styles.navTabLabelActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>


        {/* Tab 2: Farmers */}
        <TouchableOpacity
          style={styles.navTabItem}
          onPress={handleOpenFarmers}
          activeOpacity={0.7}
        >
          <NavFarmersIcon
            color={activeTab === 'Farmers' ? PALETTE.tabActive : PALETTE.tabInactive}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'Farmers' && styles.navTabLabelActive,
            ]}
          >
            Farmers
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Sales */}
        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => {
            setSalesSubScreen('overview');
            setActiveTab('Sales');
          }}
          activeOpacity={0.7}
        >
          <NavSalesIcon
            color={activeTab === 'Sales' ? PALETTE.tabActive : PALETTE.tabInactive}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'Sales' && styles.navTabLabelActive,
            ]}
          >
            Sales
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Reports */}
        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => {
            setReportsSubScreen(null);
            setActiveTab('Reports');
          }}
          activeOpacity={0.7}
        >
          <NavReportsIcon
            color={activeTab === 'Reports' ? PALETTE.tabActive : PALETTE.tabInactive}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'Reports' && styles.navTabLabelActive,
            ]}
          >
            Reports
          </Text>
        </TouchableOpacity>

        {/* Tab 5: Profile */}
        <TouchableOpacity
          style={styles.navTabItem}
          onPress={() => setActiveTab('Profile')}
          activeOpacity={0.7}
        >
          <NavProfileIcon
            color={activeTab === 'Profile' ? PALETTE.tabActive : PALETTE.tabInactive}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'Profile' && styles.navTabLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS / ACTION SHEETS
         ══════════════════════════════════════════════════════════════════════ */}
      {/* Modal 1: Approve Listings */}
      <Modal
        visible={activeModal === 'approveListings'}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Listings to Approve (23)</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Pending farmer batch quality & grade verifications</Text>

            <ScrollView style={{ maxHeight: 340 }}>
              <View style={styles.modalItemCard}>
                <Text style={styles.modalItemTitle}>LST-902 · Nilgiris CTC Tea (Leaf Grade A)</Text>
                <Text style={styles.modalItemSub}>Farmer: K. Ramasamy · Coonoor Valley · 2,400 kg</Text>
                <Text style={styles.modalItemPrice}>Asking: ₹240/kg · Mandi Parity: ₹245/kg</Text>
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => {
                    setStats((s) => ({ ...s, listingsToApprove: Math.max(0, s.listingsToApprove - 1) }));
                    Alert.alert('Approved', 'Batch LST-902 approved and released to catalog.');
                  }}
                >
                  <Text style={styles.modalActionBtnText}>Approve Batch</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalItemCard}>
                <Text style={styles.modalItemTitle}>LST-903 · Organic Hill Carrots</Text>
                <Text style={styles.modalItemSub}>Farmer: M. Senthil · Ooty Hills · 1,800 kg</Text>
                <Text style={styles.modalItemPrice}>Asking: ₹39/kg · Mandi Parity: ₹38/kg</Text>
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => {
                    setStats((s) => ({ ...s, listingsToApprove: Math.max(0, s.listingsToApprove - 1) }));
                    Alert.alert('Approved', 'Batch LST-903 approved and released to catalog.');
                  }}
                >
                  <Text style={styles.modalActionBtnText}>Approve Batch</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Schedule Audit */}
      <Modal
        visible={activeModal === 'scheduleAudit'}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Quarterly Quality Audits (6)</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Scheduled on-site farm inspections & organic testing</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              <View style={styles.modalItemCard}>
                <Text style={styles.modalItemTitle}>Kotagiri Ridge Estates (Audit #04)</Text>
                <Text style={styles.modalItemSub}>Inspector: R. Rajesh · Scheduled: Tomorrow, 10:00 AM</Text>
                <Text style={styles.modalItemPrice}>Scope: Soil purity, irrigation runoff & pesticide residue test</Text>
              </View>
              <View style={styles.modalItemCard}>
                <Text style={styles.modalItemTitle}>Coonoor Valley Cooperative (Audit #05)</Text>
                <Text style={styles.modalItemSub}>Inspector: S. Meenakshi · Scheduled: 28 Sep, 11:30 AM</Text>
                <Text style={styles.modalItemPrice}>Scope: Tea leaf grading standard & weighing scale calibration</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                Alert.alert('Schedule New Audit', 'Opening inspector dispatch form...');
                setActiveModal(null);
              }}
            >
              <Text style={styles.modalActionBtnText}>+ Schedule New Farm Audit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Support Tickets */}
      <Modal
        visible={activeModal === 'support'}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Open Support Tickets (14)</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Voice & text tickets from Nilgiris farmers</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              <View style={styles.modalItemCard}>
                <Text style={styles.modalItemTitle}>TK-419 · Voice Message in Tamil</Text>
                <Text style={styles.modalItemSub}>Farmer: Murugan P. · Gudalur</Text>
                <Text style={styles.modalItemPrice}>"Inquiry regarding potato pickup scheduling for tomorrow morning."</Text>
              </View>
              <View style={styles.modalItemCard}>
                <Text style={styles.modalItemTitle}>TK-418 · Payout Status Check</Text>
                <Text style={styles.modalItemSub}>Farmer: Revathi S. · Kotagiri</Text>
                <Text style={styles.modalItemPrice}>"Bank NEFT clearance confirmation for tea harvest batch #441."</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalDoneBtnText}>Close Tickets</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeftCol: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14.5,
    color: PALETTE.textSecondary,
    fontWeight: '400',
    marginBottom: 3,
  },
  adminNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.badgeBg,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.badgeText,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PALETTE.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // Section Headings
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textHeading,
    letterSpacing: -0.2,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 0,
  },
  seeAllText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: PALETTE.orangePrimary,
  },

  // 2x2 Snapshot Grid
  snapshotGrid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    padding: 16,
    minHeight: 136,
    justifyContent: 'flex-start',
  },
  snapshotIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotValue: {
    fontSize: 27,
    fontWeight: '800',
    color: PALETTE.textPrimary,
    marginTop: 14,
    marginBottom: 3,
    letterSpacing: -0.5,
  },
  snapshotLabel: {
    fontSize: 13.5,
    color: PALETTE.textMuted,
    fontWeight: '400',
    lineHeight: 18,
  },

  // Farmer Application Cards
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  farmerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PALETTE.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  farmerInfoCol: {
    flex: 1,
  },
  farmerNameTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  farmerSubText: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    marginTop: 3,
  },

  // Sales Channel Snapshot Card
  salesSnapshotCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    paddingVertical: 18,
    paddingHorizontal: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  salesCardLeftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    backgroundColor: '#0C447C',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  salesCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salesCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 12,
  },
  salesCardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 6,
    marginLeft: 34,
  },

  // Quick Actions Row
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F5EAE4',
    paddingVertical: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickActionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 10,
  },
  quickActionLabelSingle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    textAlign: 'center',
    marginTop: 10,
  },

  // Bottom Navigation Bar
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingTop: 10,
    paddingBottom: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navTabLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.tabInactive,
    marginTop: 4,
  },
  navTabLabelActive: {
    color: PALETTE.tabActive,
    fontWeight: '600',
  },

  // Sub-pages (Farmers, Sales, Reports, Profile)
  backButtonSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: '#EFE7DE',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  subPageHeaderBlock: {
    marginBottom: 16,
  },
  salesPageTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: PALETTE.textHeading,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  salesPageSubtitle: {
    fontSize: 13.5,
    color: PALETTE.textSecondary,
    lineHeight: 19,
  },
  policyBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    borderWidth: 1.2,
    borderColor: '#EFE6DC',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  policyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textHeading,
    marginBottom: 2,
  },
  policySubtitle: {
    fontSize: 12,
    color: '#78716C',
    lineHeight: 16,
  },
  salesKpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  salesKpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: PALETTE.borderSoft,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  salesKpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textPrimary,
    marginBottom: 2,
  },
  salesKpiLabel: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  channelCardPremium: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: PALETTE.borderSoft,
    borderLeftWidth: 4.5,
    borderLeftColor: PALETTE.borderSoft,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  channelCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  channelPillTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    marginBottom: 6,
  },
  channelPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  salesChannelDesc: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    lineHeight: 18,
    paddingRight: 8,
  },
  channelPctBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 64,
  },
  channelPctNumber: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  channelPctSub: {
    fontSize: 10,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  channelProgressContainer: {
    marginBottom: 14,
  },
  channelMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F3EFEA',
  },
  channelMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  channelMetricLabel: {
    fontSize: 10.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  channelMetricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  subPageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textHeading,
  },
  subPageSubtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
  farmerDetailCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    padding: 16,
    marginBottom: 12,
  },
  farmerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    backgroundColor: PALETTE.orangeLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.orangePrimary,
  },
  farmerDetailRow: {
    marginVertical: 12,
    gap: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  detailValue: {
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  farmerActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  primaryBtn: {
    backgroundColor: PALETTE.orangePrimary,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Sales Tab Cards
  channelCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    padding: 16,
    marginBottom: 12,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelName: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  channelPct: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textHeading,
  },
  channelDesc: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    marginVertical: 8,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F3EFEA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Report Cards
  reportSummaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    padding: 16,
    marginBottom: 12,
  },
  reportCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  reportCardNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textPrimary,
    marginVertical: 6,
  },
  reportCardSub: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    lineHeight: 18,
  },

  // Profile
  profileCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  bigAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PALETTE.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textPrimary,
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginTop: 8,
  },
  signOutButton: {
    backgroundColor: '#FDEEE9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FAD9CC',
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.badgeText,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: PALETTE.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textPrimary,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  modalItemCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.borderSoft,
    padding: 12,
    marginBottom: 10,
  },
  modalItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  modalItemSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  modalItemPrice: {
    fontSize: 12,
    color: PALETTE.textHeading,
    fontWeight: '600',
    marginTop: 4,
  },
  modalActionBtn: {
    backgroundColor: PALETTE.orangePrimary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalDoneBtn: {
    backgroundColor: '#F3EFEA',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
});
