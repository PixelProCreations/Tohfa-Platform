/**
 * Farmer Admin dashboard — the five-tab shell for the FARMER_ADMIN role.
 *
 * Bottom tabs (design: origin/tofhafarmfin-rbac):
 *   Home          → KPI cards, attention items, quick actions
 *   Farmers       → FarmersFlow (shared, gated by canOpenFarmers)
 *   Produce Cal.  → not built yet → "Not available yet" alert
 *   Audits        → not built yet → "Not available yet" alert
 *   More          → AdminMoreMenuScreen (shared, gated by can())
 *
 * Sub-view navigation (over the tab content):
 *   settings      → ProfileFlow
 *   notifications → NotificationsFlow
 *
 * No role strings in checks — gate on can(code) only (root CLAUDE.md 2.1).
 * FarmersFlow gets the signed-in user's own adminCan (from /auth/me),
 * never a fixture or grant-all lambda (farmersFlow_wiring.test.ts).
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { fetchMe, type UserMe } from '../../../farmer/api/auth';
import { adminColors, adminRadius, adminShadow, adminSpacing } from '../../theme';
import { t } from '../../i18n';
import { makeCan } from '../../permissions/can';
import { FarmersFlow } from '../farmers/FarmersFlow';
import { FarmersPeopleGroupIcon } from '../farmers/flow/FarmersEntryIcons';
import { canOpenFarmers } from '../farmers/flow/farmersFlowNav';
import { NotificationsFlow } from '../warehouse/notifications/NotificationsFlow';
import { AdminMoreMenuScreen } from '../more/AdminMoreMenuScreen';
import { ProfileFlow } from '../warehouse/profile-settings';
import {
  OverviewDashboardCard,
  OverviewCardsGrid,
} from '../../components/OverviewDashboardCard';

// ─── Tab type (matches design: 5 tabs) ────────────────────────────────────────
export type FarmerAdminTab = 'Home' | 'Farmers' | 'Produce' | 'Audits' | 'More';

// ─── SVG Icons (design exact) ─────────────────────────────────────────────────

function ShieldHeaderIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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
      <Path d="M4 7h16M16 3l4 4-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 17H4M8 13l-4 4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarOutlineIcon({ size = 22, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="7.5" cy="12.5" r="1.1" fill={color} />
      <Circle cx="12" cy="12.5" r="1.1" fill={color} />
      <Circle cx="16.5" cy="12.5" r="1.1" fill={color} />
      <Circle cx="7.5" cy="16.5" r="1.1" fill={color} />
      <Circle cx="12" cy="16.5" r="1.1" fill={color} />
      <Circle cx="16.5" cy="16.5" r="1.1" fill={color} />
    </Svg>
  );
}

function ExactScalesIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v17M8 20h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 7h16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M4 7l-2.5 5.5h5L4 7z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <Path d="M20 7l-2.5 5.5h5L20 7z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

function OpposingArrowsIcon({ size = 18, color = adminColors.info.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M16 3l4 4-4 4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 17H4M8 13l-4 4 4 4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TomatoProduceIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  const leafColor = adminColors.muted;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14" r="5.8" stroke={color} strokeWidth="2.2" />
      <Path d="M12 8.2c.3-1.8 1.1-3 2.3-3.6" stroke={leafColor} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M11.8 8.2C11.6 5.8 9.6 4.2 7.8 4.8c-.3 2.1 1.5 3.6 4 3.4z" fill={leafColor} />
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

function ClipboardChecklistIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2.5h6a1 1 0 0 1 1 1V5H8V3.5a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Line x1="8.5" y1="10" x2="15.5" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8.5" y1="14" x2="15.5" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8.5" y1="18" x2="12.5" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PeopleGroupIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="2.2" stroke={color} strokeWidth="1.8" />
      <Path d="M7.5 21v-2a4.5 4.5 0 0 1 9 0v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="5" cy="8" r="1.8" stroke={color} strokeWidth="1.6" />
      <Path d="M2.5 20v-1.5A3.5 3.5 0 0 1 6 15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Circle cx="19" cy="8" r="1.8" stroke={color} strokeWidth="1.6" />
      <Path d="M21.5 20v-1.5A3.5 3.5 0 0 0 18 15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function StarRatingsIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LeafOutlineIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.5 21 2c-.5 4-1 5.5-2.1 11.2A7 7 0 0111 20z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M2 21c0-4 3.5-7.5 7.5-7.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
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

// ─── Tab Bar Icons (design) ────────────────────────────────────────────────────

function TabHomeIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabProduceCalendarIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="16" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="17" r="2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M6 13V9a1 1 0 0 1 1-1h4v4.5M11 11h6v3h2v3h-3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 8V5h2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 8v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function TabAuditsIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return <CalendarOutlineIcon size={21} color={color} />;
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

// ─── Component props ──────────────────────────────────────────────────────────

export interface FarmerAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string) => void;
  onSwitchRole?: (() => void) | undefined;
  initialTab?: FarmerAdminTab | undefined;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FarmerAdminDashboardScreen({
  onSignOut,
  onSwitchRole,
  initialTab = 'Home',
}: FarmerAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<FarmerAdminTab>(initialTab);
  const [subView, setSubView] = useState<'none' | 'notifications' | 'settings'>('none');
  const [user, setUser] = useState<UserMe | null>(null);
  const [expandedFarmer, setExpandedFarmer] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<{
    title: string;
    content: string;
    onAction?: () => void;
  } | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {});
  }, []);

  const displayName = user?.fullName ?? 'Suresh';
  // The signed-in admin's /auth/me permissions; empty (deny) until they arrive.
  const adminCan = useMemo(() => makeCan(user?.permissions), [user]);

  const handleSwitchToFarmerApp = () => {
    setModalItem(null);
    if (onSwitchRole) {
      onSwitchRole();
    }
  };

  const notAvailable = () => {
    Alert.alert(
      t('tohfaHome.notAvailable.title'),
      t('tohfaHome.notAvailable.body'),
    );
  };

  // ─── Sub-view: Notifications ────────────────────────────────────────────────
  if (subView === 'notifications') {
    return (
      <NotificationsFlow
        scope={{ warehouseId: 'farmer-admin', warehouseName: 'Farmer Admin' }}
        can={adminCan}
        onBack={() => setSubView('none')}
      />
    );
  }

  // ─── Sub-view: Settings / Profile ───────────────────────────────────────────
  if (subView === 'settings') {
    return (
      <ProfileFlow
        scope={{ warehouseId: 'farmer-admin', warehouseName: 'Farmer Admin Zone' }}
        can={adminCan}
        initialScreen="Settings"
        onBack={() => setSubView('none')}
        onLogout={onSignOut}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Orange Brand Header (Home tab only — hidden on Farmers/Produce/Audits/More) ─── */}
      {activeTab !== 'More' && activeTab !== 'Farmers' && activeTab !== 'Audits' && activeTab !== 'Produce' && (
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <ShieldHeaderIcon size={22} color={adminColors.onBrand} />
              <Text style={styles.headerTitle}>Farmer Admin</Text>
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
                onPress={() => setSubView('settings')}
                activeOpacity={0.8}
                accessibilityLabel="Admin Profile"
              >
                <ProfileHeaderIcon size={20} color={adminColors.onBrand} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.headerSubtitle}>Nilgiris · Coonoor Zone</Text>
        </View>
      )}

      {/* ─── Main Content Area ──────────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>

        {/* ─── Home Tab ─── */}
        {activeTab === 'Home' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Greeting */}
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
                  <Text style={styles.roleLabel}>Active Role</Text>
                  <Text style={styles.roleName}>Farmer Admin</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.switchRoleBtn}
                onPress={() =>
                  setModalItem({
                    title: 'Switch Role',
                    content: 'Tap to switch to Farmer application',
                    onAction: handleSwitchToFarmerApp,
                  })
                }
                activeOpacity={0.8}
              >
                <SwitchArrowsIcon size={14} color={adminColors.brand} />
                <Text style={styles.switchRoleText}>Switch Role</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Overview KPI Cards */}
            <View style={{ marginBottom: 16 }}>
              <OverviewCardsGrid>
                <OverviewDashboardCard
                  value={t('tohfaHome.dash')}
                  title="Pending listings"
                  subtitle="—"
                  icon="orders"
                  tone="warning"
                  onPress={notAvailable}
                />
                <OverviewDashboardCard
                  value={t('tohfaHome.dash')}
                  title="Today's reviews"
                  subtitle="—"
                  icon="box"
                  onPress={notAvailable}
                />
                <OverviewDashboardCard
                  value={t('tohfaHome.dash')}
                  title="Pending audit support"
                  subtitle="—"
                  icon="pickup"
                  onPress={notAvailable}
                />
                <OverviewDashboardCard
                  value={t('tohfaHome.dash')}
                  title="Open disputes"
                  subtitle="—"
                  icon="alert"
                  tone="danger"
                  onPress={notAvailable}
                />
              </OverviewCardsGrid>
            </View>

            {/* 4. Needs Your Attention */}
            <Text style={[styles.sectionTitle, { marginTop: adminSpacing.lg, marginBottom: adminSpacing.sm }]}>
              Needs Your Attention
            </Text>

            <TouchableOpacity style={styles.attentionCard} onPress={notAvailable} activeOpacity={0.8}>
              <View style={styles.accentStripe} />
              <View style={styles.attentionHeaderRow}>
                <View style={styles.attentionIconCircle}>
                  <TomatoProduceIcon size={20} color={adminColors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attentionCardTitle}>Tomato — Grade 1</Text>
                  <Text style={styles.attentionCardMeta}>
                    Farmer: Ramesh · Quantity: — · Listed Price: —
                  </Text>
                  <Text style={styles.attentionActionLink}>Review Listing →</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attentionCard} onPress={notAvailable} activeOpacity={0.8}>
              <View style={styles.accentStripe} />
              <View style={styles.attentionHeaderRow}>
                <View style={styles.attentionIconCircle}>
                  <OpposingArrowsIcon size={18} color={adminColors.info.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attentionCardTitle}>Counter Offer Response</Text>
                  <Text style={styles.attentionCardMeta}>
                    Farmer: — · Crop: — · Requires response
                  </Text>
                  <Text style={styles.attentionActionLink}>View →</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attentionCard} onPress={notAvailable} activeOpacity={0.8}>
              <View style={styles.accentStripe} />
              <View style={styles.attentionHeaderRow}>
                <View style={styles.attentionIconCircle}>
                  <CalendarOutlineIcon size={20} color={adminColors.warning.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attentionCardTitle}>Upcoming Farm Audit</Text>
                  <Text style={styles.attentionCardMeta}>
                    Farmer: — · Zone: Coonoor · Date: —
                  </Text>
                  <Text style={styles.attentionActionLink}>View Audit →</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attentionCard} onPress={notAvailable} activeOpacity={0.8}>
              <View style={styles.accentStripe} />
              <View style={styles.attentionHeaderRow}>
                <View style={styles.attentionIconCircle}>
                  <ExactScalesIcon size={20} color={adminColors.danger.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attentionCardTitle}>Farmer Dispute</Text>
                  <Text style={styles.attentionCardMeta}>Farmer vs Farmer · Status: —</Text>
                  <Text style={styles.attentionActionLink}>View Dispute →</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* 5. Farmer Product Listings Accordion */}
            <View style={{ marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Farmer Product Listings</Text>
            </View>
            <Text style={styles.sectionSubMuted}>— pending · — farmers</Text>

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
                  <Text style={styles.farmerSub}>— pending listings</Text>
                </View>
                {expandedFarmer === 'Ramesh' ? <ChevronUp /> : <ChevronDown />}
              </TouchableOpacity>

              {expandedFarmer === 'Ramesh' && (
                <View style={styles.accordionContent}>
                  <TouchableOpacity style={styles.accordionItemRow} onPress={notAvailable} activeOpacity={0.7}>
                    <Text style={styles.accordionCropName}>• Tomato — Grade 1 (—)</Text>
                    <Text style={styles.accordionCropPrice}>—/KG</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

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
                  <Text style={styles.farmerSub}>— pending listings</Text>
                </View>
                {expandedFarmer === 'Kumar' ? <ChevronUp /> : <ChevronDown />}
              </TouchableOpacity>

              {expandedFarmer === 'Kumar' && (
                <View style={styles.accordionContent}>
                  <TouchableOpacity style={styles.accordionItemRow} onPress={notAvailable} activeOpacity={0.7}>
                    <Text style={styles.accordionCropName}>• Green Beans — Grade 1 (—)</Text>
                    <Text style={styles.accordionCropPrice}>—/KG</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.bigOutlineBtn} onPress={notAvailable} activeOpacity={0.8}>
              <Text style={styles.bigOutlineBtnText}>View All Listings</Text>
            </TouchableOpacity>

            {/* 6. Recent Activity */}
            <View style={{ marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Recent Farmer Admin Activity</Text>
              <TouchableOpacity onPress={notAvailable} activeOpacity={0.7}>
                <Text style={styles.viewLinkText}>View →</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.activityCard} onPress={notAvailable} activeOpacity={0.8}>
              <CheckmarkCircleIcon size={22} color={adminColors.success.text} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>Listing approved</Text>
                <Text style={styles.activityMeta}>— · —</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bigOutlineBtn} onPress={notAvailable} activeOpacity={0.8}>
              <Text style={styles.bigOutlineBtnText}>View Activity</Text>
            </TouchableOpacity>

            {/* 7. Quick Actions (6-tile grid) */}
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>

            <View style={styles.quickGrid}>
              <TouchableOpacity style={styles.quickCard} onPress={notAvailable} activeOpacity={0.75}>
                <ClipboardChecklistIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Review Listings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => {
                  if (canOpenFarmers(adminCan)) setActiveTab('Farmers');
                  else notAvailable();
                }}
                activeOpacity={0.75}
              >
                <PeopleGroupIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>View Farmers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => {
                  Alert.alert(t('tohfaHome.notAvailable.title'), t('tohfaHome.notAvailable.body'));
                }}
                activeOpacity={0.75}
              >
                <CalendarOutlineIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Audit Calendar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={notAvailable} activeOpacity={0.75}>
                <ExactScalesIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Review Disputes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={notAvailable} activeOpacity={0.75}>
                <LeafOutlineIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Crop Breakdown</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={notAvailable} activeOpacity={0.75}>
                <StarRatingsIcon size={24} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Ratings</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        )}

        {/* ─── Farmers Tab (zone scoping is server-side, BR-108a) ─── */}
        {activeTab === 'Farmers' && canOpenFarmers(adminCan) && (
          <FarmersFlow can={adminCan} onBack={() => setActiveTab('Home')} />
        )}

        {/* ─── Produce Calendar Tab (not built) — rendered but no content; tab press toasts ─── */}
        {activeTab === 'Produce' && (
          <View style={styles.placeholderFill}>
            <Text style={styles.placeholderText}>{t('tohfaHome.notAvailable.title')}</Text>
            <Text style={styles.placeholderSub}>{t('tohfaHome.notAvailable.body')}</Text>
          </View>
        )}

        {/* ─── Audits Tab (not built) — rendered but no content; tab press toasts ─── */}
        {activeTab === 'Audits' && (
          <View style={styles.placeholderFill}>
            <Text style={styles.placeholderText}>{t('tohfaHome.notAvailable.title')}</Text>
            <Text style={styles.placeholderSub}>{t('tohfaHome.notAvailable.body')}</Text>
          </View>
        )}

        {/* ─── More Tab ─── */}
        {activeTab === 'More' && (
          <AdminMoreMenuScreen
            can={adminCan}
            onBack={() => setActiveTab('Home')}
            onLogout={onSignOut}
            hiddenRows={['farmers', 'audit']}
            handlers={{
              notifications: () => setSubView('notifications'),
              settings: () => setSubView('settings'),
              ...(onSwitchRole !== undefined ? { switch_role: onSwitchRole } : {}),
            }}
          />
        )}
      </View>

      {/* ─── Switch Role Modal ─── */}
      <Modal
        visible={modalItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalItem(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalItem(null)}>
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>{modalItem?.title}</Text>
            <Text style={styles.modalContent}>{modalItem?.content}</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                const action = modalItem?.onAction;
                setModalItem(null);
                action?.();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Bottom Tab Bar ─── */}
      {(activeTab !== 'Farmers' || !canOpenFarmers(adminCan)) && (
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

          {canOpenFarmers(adminCan) ? (
            <Pressable
              style={styles.tabItem}
              onPress={() => setActiveTab('Farmers')}
              accessibilityRole="tab"
              accessibilityLabel="Farmers"
            >
              <FarmersPeopleGroupIcon
                color={activeTab === 'Farmers' ? adminColors.brand : adminColors.muted}
                size={21}
              />
              <Text style={[styles.tabLabel, activeTab === 'Farmers' && styles.tabLabelActive]}>
                {t('farmersEntry.tab.farmers')}
              </Text>
            </Pressable>
          ) : (
            <Pressable style={styles.tabItem} onPress={notAvailable} accessibilityRole="tab" accessibilityLabel="Farmers">
              <FarmersPeopleGroupIcon color={adminColors.muted} size={21} />
              <Text style={styles.tabLabel}>{t('farmersEntry.tab.farmers')}</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.tabItem}
            onPress={() => {
              Alert.alert(t('tohfaHome.notAvailable.title'), t('tohfaHome.notAvailable.body'));
            }}
            accessibilityRole="tab"
            accessibilityLabel="Produce Calendar"
          >
            <TabProduceCalendarIcon active={activeTab === 'Produce'} />
            <Text style={[styles.tabLabel, activeTab === 'Produce' && styles.tabLabelActive]} numberOfLines={1}>
              Produce Calendar
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => {
              Alert.alert(t('tohfaHome.notAvailable.title'), t('tohfaHome.notAvailable.body'));
            }}
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
      )}
    </SafeAreaView>
  );
}

// ─── Styles (adminColors — no hex literals) ───────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  // ── Header ──
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: adminColors.onBrand,
    opacity: 0.75,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNotificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.danger.text,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  // ── Scroll ──
  scroll: { flex: 1 },
  scrollPad: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24 },
  // ── Greeting ──
  greetingSection: { marginBottom: 14 },
  greetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  greetSub: {
    fontSize: 13,
    color: adminColors.muted,
    lineHeight: 18,
  },
  // ── Role Card ──
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  roleLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleIconBadge: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: { fontSize: 11, color: adminColors.muted, fontWeight: '500' },
  roleName: { fontSize: 14, fontWeight: '800', color: adminColors.ink },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  switchRoleText: { fontSize: 12, fontWeight: '700', color: adminColors.brand },
  // ── Section titles ──
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    letterSpacing: -0.2,
  },
  sectionSubMuted: {
    fontSize: 12,
    color: adminColors.muted,
    marginTop: -4,
    marginBottom: 10,
  },
  viewLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brand,
  },
  // ── Attention Cards ──
  attentionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    ...adminShadow.sm,
  },
  accentStripe: {
    width: 4,
    backgroundColor: adminColors.brand,
  },
  attentionHeaderRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  attentionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  attentionCardMeta: {
    fontSize: 11.5,
    color: adminColors.muted,
    lineHeight: 15,
    marginBottom: 4,
  },
  attentionActionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.brand,
  },
  // ── Accordion ──
  accordionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  initialsCircle: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brand,
  },
  farmerName: { fontSize: 14, fontWeight: '700', color: adminColors.ink },
  farmerSub: { fontSize: 11.5, color: adminColors.muted, marginTop: 1 },
  accordionContent: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  accordionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionCropName: { fontSize: 13, color: adminColors.ink, flex: 1 },
  accordionCropPrice: { fontSize: 13, fontWeight: '700', color: adminColors.brandDeep },
  bigOutlineBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    padding: 13,
    alignItems: 'center',
    marginBottom: 4,
  },
  bigOutlineBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.brand,
  },
  // ── Activity ──
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 13,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  activityTitle: { fontSize: 13.5, fontWeight: '700', color: adminColors.ink },
  activityMeta: { fontSize: 11.5, color: adminColors.muted, marginTop: 1 },
  // ── Quick Grid ──
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: 6,
    ...adminShadow.sm,
  },
  quickCardLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: adminColors.ink,
    textAlign: 'center',
  },
  // ── Placeholder ──
  placeholderFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 8,
  },
  placeholderSub: {
    fontSize: 13,
    color: adminColors.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: 9,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 2,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 3,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: adminColors.brand,
    fontWeight: '800',
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 24,
    width: '82%',
    ...adminShadow.lg,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 10,
  },
  modalContent: {
    fontSize: 14,
    color: adminColors.muted,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalCloseBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.full,
    padding: 13,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
});
