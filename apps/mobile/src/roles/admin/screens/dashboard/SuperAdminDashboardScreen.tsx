import React, { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { fetchMe, logout, type UserMe } from '../../../farmer/api/auth';
import { Icon } from '@tohfa/mobile-ui';
import { colors } from '../../../farmer/theme';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     '#7E2E11', // Deep terracotta heading color
  orange:        '#E85226', // Vibrant signature orange
  pageBg:        '#FAF8F5', // Warm light cream
  cardBg:        '#FFFFFF',
  ink:           '#1A1412', // Near-black text
  labelMuted:    '#6D6761', // Secondary muted text
  border:        '#F0ECE4', // Soft card border
  peachBadge:    '#FDEEE9', // Soft peach pill background
  peachText:     '#943818', // Deep terracotta pill text
  peachIconBg:   '#FDEEE9', // Soft peach icon container
  blueIconBg:    '#EBF3FA', // Soft blue icon container
  blueText:      '#2563EB',
  greenIconBg:   '#EAF5EA', // Soft green icon container
  greenText:     '#2E7D32',
  amberIconBg:   '#FEF3C7', // Soft amber icon container
  amberText:     '#B45309',
  alertRed:      '#C93B27', // Alert 1 border & icon
  alertAmber:    '#9A5B20', // Alert 2 border & icon
  tabInactive:   '#6D6761',
  tabBorder:     '#EDE8E0',
  checkGreen:    '#0D8253',
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
        d="M6 8V6a6 6 0 0112 0v2m-14 2h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8a2 2 0 012-2z"
        stroke={PALETTE.blueText}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 12a2 2 0 100 4 2 2 0 000-4z"
        stroke={PALETTE.blueText}
        strokeWidth="1.8"
      />
    </Svg>
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

function GavelIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 13l5 5m-9-9l5 5m-9 1l7-7 3 3-7 7-3-3zM3 21h6"
        stroke={PALETTE.orange}
        strokeWidth="2"
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
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="2" />
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
}: {
  iconBox: React.ReactNode;
  value: string;
  label: string;
  delta: string;
  deltaColor?: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.overviewCard}>
      <View style={styles.cardTopRow}>{iconBox}</View>
      <Text style={[styles.statValue, valueStyle]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statDelta, { color: deltaColor ?? PALETTE.ink }]}>{delta}</Text>
    </View>
  );
}

function ApprovalRow({
  icon,
  title,
  subtitle,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge: number;
}) {
  return (
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

// ─── Main Screen Component ────────────────────────────────────────────────────
export interface SuperAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string) => void;
}

export function SuperAdminDashboardScreen({
  onSignOut,
  onNavigate,
}: SuperAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [user, setUser]           = useState<UserMe | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {});
  }, []);

  const displayName = user?.fullName ?? 'Rajesh Kumar';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      {/* Main Content Area */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Dashboard' ? (
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
              <OverviewCard
                iconBox={
                  <View style={[styles.statIconBox, { backgroundColor: PALETTE.peachIconBg }]}>
                    <FarmersGridIcon />
                  </View>
                }
                value="1,284"
                label="Total Farmers"
                delta="↑ +18 this month"
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
              />
              <OverviewCard
                iconBox={
                  <View style={[styles.statIconBox, { backgroundColor: PALETTE.greenIconBg }]}>
                    <RevenueGridIcon />
                  </View>
                }
                value="₹18.4L"
                label="Revenue (MTD)"
                delta="↑ +6.2%"
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
              />
              <QuickActionCard
                icon={<GearIcon />}
                label={'System\nConfig'}
              />
              <QuickActionCard
                icon={<GavelIcon />}
                label="Fair Price"
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
          /* Blank screen for all other tabs (Farmers, Sales, Reports) */
          <View style={styles.blankPane} />
        )}
      </View>

      {/* ─── Bottom Navigation Tab Bar ─── */}
      <View style={styles.tabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Dashboard')}
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
          onPress={() => setActiveTab('Farmers')}
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
          onPress={() => setActiveTab('Sales')}
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
          onPress={() => setActiveTab('Reports')}
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
          onPress={() => setActiveTab('Profile')}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
  },
  overviewCard: {
    flex: 1,
    minWidth: '46%',
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
