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

// Shorthand alias for colors used in components
const A = {
  orange:    PALETTE.orange,
  orangeBg:  PALETTE.peachIconBg,
  blue:      PALETTE.blueText,
  blueBg:    PALETTE.blueIconBg,
  greenBg:   PALETTE.greenIconBg,
  amber:     PALETTE.amberText,
  amberBg:   PALETTE.amberIconBg,
  pageBg:    PALETTE.pageBg,
  muted:     PALETTE.labelMuted,
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
    <View style={styles.alertCard}>
      <View style={styles.alertRow}>
        {imageSource ? (
          <Image source={imageSource} style={{ width: 18, height: 18, marginRight: 6 }} resizeMode="contain" />
        ) : (
          <Icon name="warning" size={16} color={A.orange} style={{ marginTop: 1 }} />
        )}
        <Text style={styles.alertTitle}>{title}</Text>
      </View>
      <Text style={styles.alertSub}>{subtitle}</Text>
      <Text style={styles.alertLink}>{linkLabel} →</Text>
    </View>
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

function FarmerAppRow({ name, location, status, onPress }: {
  name: string; location: string; status: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.farmerAppRow}
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.farmerAppIcon}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 20C19 16.6863 15.866 14 12 14C8.13401 14 5 16.6863 5 20"
            stroke="#F0562A"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Path
            d="M12 11C13.933 11 15.5 9.433 15.5 7.5C15.5 5.567 13.933 4 12 4C10.067 4 8.5 5.567 8.5 7.5C8.5 9.433 10.067 11 12 11Z"
            stroke="#F0562A"
            strokeWidth="1.8"
          />
        </Svg>
      </View>
      <View style={styles.farmerAppText}>
        <Text style={styles.farmerAppName}>{name} — {location}</Text>
        <Text style={styles.farmerAppStatus}>{status}</Text>
      </View>
      <Icon name="chevron_right" size={20} color="#827871" />
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

// ─── UI Helper Components ─────────────────────────────────────────────────────
// Using Icon component instead of PNG assets for mobile compatibility

function SectionTitle({ text }: { text: string }) {
  return (
    <View style={{ marginTop: 24, marginBottom: 12 }}>
      <Text style={styles.sectionTitle}>{text}</Text>
    </View>
  );
}

function StatCard({
  iconName,
  iconColor,
  iconBg,
  value,
  label,
  delta,
  deltaColor,
}: {
  iconName: string;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
  delta: string;
  deltaColor?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Icon name={iconName} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statDelta, { color: deltaColor || PALETTE.ink }]}>{delta}</Text>
    </View>
  );
}

function ApprovalCard({
  iconName,
  title,
  subtitle,
  badge,
}: {
  iconName: string;
  title: string;
  subtitle: string;
  badge: number;
}) {
  return (
    <TouchableOpacity style={styles.approvalCard} activeOpacity={0.7}>
      <View style={[styles.iconBox, { backgroundColor: A.orangeBg }]}>
        <Icon name={iconName} size={20} color={A.orange} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.approvalTitle}>{title}</Text>
        <Text style={styles.approvalSub}>{subtitle}</Text>
      </View>
      <View style={styles.badgeCircle}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
      <Icon name="chevron_right" size={20} color={PALETTE.labelMuted} />
    </TouchableOpacity>
  );
}

function AlertCard({
  imageSource,
  title,
  subtitle,
  linkLabel,
  onPress,
}: {
  imageSource?: any;
  title: string;
  subtitle: string;
  linkLabel: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.alertCard} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.alertRow}>
        {imageSource ? (
          <Image source={imageSource} style={{ width: 18, height: 18, marginRight: 6 }} resizeMode="contain" />
        ) : (
          <Icon name="warning" size={16} color={A.orange} style={{ marginTop: 1 }} />
        )}
        <Text style={styles.alertTitle}>{title}</Text>
      </View>
      <Text style={styles.alertSub}>{subtitle}</Text>
      <Text style={styles.alertLink}>{linkLabel} →</Text>
    </TouchableOpacity>
  );
}

// ─── Dashboard Content Components ─────────────────────────────────────────────
function SuperAdminDashboard({ onNavigate }: { onNavigate?: (screen: AdminScreenName, params?: Record<string, unknown>) => void }) {
  return (
    <>
      <SectionTitle text="System-wide overview" />
      <View style={styles.statsGrid}>
        <StatCard iconName="groups"        iconColor={A.orange}         iconBg={A.orangeBg} value="1,284" label="Total Farmers"     delta="↑ +18 this month" />
        <StatCard iconName="shopping_cart"  iconColor={A.blue}           iconBg={A.blueBg}   value="6,502" label="Total Customers"   delta="↑ +142 this month" />
        <StatCard iconName="credit_card"    iconColor={colors.brandGreen} iconBg={A.greenBg} value="₹18.4L" label="Revenue (MTD)"   delta="↑ +6.2%" />
        <StatCard iconName="inventory_2"    iconColor={A.amber}          iconBg={A.amberBg}  value="4 / 4" label="Warehouses Active" delta="✓ All operational" deltaColor={colors.brandGreen} />
      </View>
      <SectionTitle text="Needs your approval" />
      <View style={styles.cardStack}>
        <ApprovalCard iconName="credit_card" title="Dual-approval payouts"      subtitle="3 payouts above ₹10,000 awaiting your sign-off" badge={3} />
        <ApprovalCard iconName="person"      title="New admin account requests" subtitle="2 Sub Warehouse Admin accounts pending creation"  badge={2} />
      </View>
      <SectionTitle text="Compliance alerts" />
      <View style={styles.cardStack}>
        <AlertCard 
          title="7 farms overdue for quarterly audit" 
          subtitle="Q3 audit window closes in 5 days across Coonoor and Kotagiri zones." 
          linkLabel="Review audit calendar"
          onPress={() => onNavigate?.('AuditCalendar')}
        />
        <AlertCard title="12 certifications expiring within 30 days" subtitle="PGS Organic renewals needed before listings are auto-blocked." linkLabel="View farmers" />
      </View>
      <SectionTitle text="Quick actions" />
      <View style={styles.quickRow}>
        <QuickBtn iconName="person"        label="Create Admin"     />
        <QuickBtn iconName="settings"      label={`System\nConfig`} />
        <QuickBtn iconName="trending_up"   label="Market & Pricing" onPress={() => onNavigate?.('MarketPricingHome')} />
        <QuickBtn iconName="verified_user" label="Finance" onPress={() => onNavigate?.('FinancialDashboard')} />
      </View>
    </>
  );
}

function TohfaAdminDashboard() {
  return (
    <>
      <SectionTitle text="Tohfa Admin Dashboard" />
      <View style={styles.statsGrid}>
        <StatCard iconName="groups" iconColor={A.orange} iconBg={A.orangeBg} value="1,284" label="Total Farmers" delta="↑ +18 this month" />
        <StatCard iconName="shopping_cart" iconColor={A.blue} iconBg={A.blueBg} value="6,502" label="Total Customers" delta="↑ +142 this month" />
      </View>
    </>
  );
}

function FarmerAdminDashboard() {
  return (
    <>
      <SectionTitle text="Farmer Admin Dashboard" />
      <View style={styles.statsGrid}>
        <StatCard iconName="groups" iconColor={A.orange} iconBg={A.orangeBg} value="184" label="Farmers Managed" delta="↑ +8 this month" />
      </View>
    </>
  );
}

function MainWhAdminDashboard() {
  return (
    <>
      <SectionTitle text="Main Warehouse Dashboard" />
      <View style={styles.statsGrid}>
        <StatCard iconName="inventory_2" iconColor={A.orange} iconBg={A.orangeBg} value="642" label="Items in Stock" delta="↑ +24 today" />
      </View>
    </>
  );
}

function SubWhAdminDashboard() {
  return (
    <>
      <SectionTitle text="Sub Warehouse Dashboard" />
      <View style={styles.statsGrid}>
        <StatCard iconName="inventory_2" iconColor={A.orange} iconBg={A.orangeBg} value="342" label="Items in Stock" delta="↑ +12 today" />
      </View>
    </>
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
    <>
      {/* Section: Today at Coonoor */}
      <SectionTitle text="Today at Coonoor" />
      <View style={styles.statsGrid}>
        {/* Receiving Today — orange truck on orange bg */}
        <StatCard iconName="download"   iconColor={A.orange} iconBg={A.orangeBg} value="6"  label="Receiving Today"     />
        {/* Pickups Ready — blue crop_free (scan grid) on blue bg */}
        <StatCard iconName="crop_free"  iconColor={A.blue}   iconBg={A.blueBg}   value="14" label="Pickups Ready"       />
        {/* Cash Top-Ups Pending — green credit card on green bg */}
        <StatCard iconName="credit_card" iconColor={colors.brandGreen} iconBg={A.greenBg} value="3"  label="Cash Top-Ups Pending" />
        {/* Low Stock Items — orange block on pink bg */}
        <StatCard iconName="block"      iconColor={A.orange} iconBg={A.orangeBg} value="2"  label="Low Stock Items"     />
      </View>

      {/* Section: Pickup queue — verify OTP */}
      <SectionTitle text="Pickup queue — verify OTP" />
      <View style={[styles.cardStack, { marginBottom: 20 }]}>
        <ActionRow
          iconName="crop_free"
          iconBg={A.orangeBg}
          iconColor={A.orange}
          title="Order #ORD-20260910-0091"
          subtitle="Customer arriving — OTP not yet verified"
        />
      </View>

      {/* Section: Cash top-up requests */}
      <SectionTitle text="Cash top-up requests" />
      <View style={[styles.cardStack, { marginBottom: 20 }]}>
        <ActionRow
          iconName="credit_card"
          iconBg={A.orangeBg}
          iconColor={A.orange}
          title="₹2,000 — Divya Ramesh"
          subtitle="Awaiting cash handover confirmation"
        />
      </View>

      {/* Section: Quick actions */}
      <SectionTitle text="Quick actions" />
      <View style={[styles.quickRow, { justifyContent: 'flex-start', gap: 12 }]}>
        <QuickBtn iconName="download"    label={`Receive\nGoods`}   />
        <QuickBtn iconName="check_circle" label={`Quality\nCheck`} />
        <QuickBtn iconName="inventory_2"  label="My Stock"          />
      </View>
    </>
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
  const [user, setUser]           = useState<UserMe | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {});
  }, []);

  const displayName = user?.fullName || 'Ganga Devi';
  const roleCode = user?.roleCode || 'SUPER_ADMIN';
  const greeting = 'Good morning';
  
  // Role label mapping
  const roleLabel = 
    roleCode === 'SUPER_ADMIN' ? 'Super Admin' :
    roleCode === 'TOHFA_ADMIN' ? 'Tohfa Admin' :
    roleCode === 'FARMER_ADMIN' ? 'Farmer Admin' :
    roleCode === 'MAIN_WH_ADMIN' ? 'Main Warehouse Admin' :
    roleCode === 'SUB_WH_ADMIN' ? 'Sub Warehouse Admin' :
    'Admin';
  
  const isSubWh = roleCode === 'SUB_WH_ADMIN';
  
  // Role styling
  const roleIcon = 'shield';
  const accent = PALETTE.orange;
  const accentBg = PALETTE.peachBadge;

  function handleSignOut() {
    void (async () => { await logout(); onSignOut(); })();
  }

  /** Header — Sub WH Admin gets a second "warehouse location" badge */
  function PageHeader() {
    return (
      <View style={styles.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetSmall}>{greeting}</Text>
          <Text style={styles.greetName}>{displayName}</Text>
          {/* Primary role badge */}
          <View style={styles.rolePill}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
              <Path
                d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z"
                stroke="#662208"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M9 11.5L11 13.5L15 9.5"
                stroke="#662208"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.rolePillText}>{roleLabel}</Text>
          </View>
          {/* Sub WH Admin gets a second location badge */}
          {isSubWh ? (
            <View style={[styles.rolePill, { backgroundColor: A.blueBg, marginTop: 6 }]}>
              <Icon name="place" size={12} color={A.blue} />
              <Text style={[styles.rolePillText, { color: A.blue }]}>Coonoor Warehouse</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity style={styles.headerAvatarCircle} activeOpacity={0.8}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 20C19 16.6863 15.866 14 12 14C8.13401 14 5 16.6863 5 20"
              stroke="#F0562A"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <Path
              d="M12 11C13.933 11 15.5 9.433 15.5 7.5C15.5 5.567 13.933 4 12 4C10.067 4 8.5 5.567 8.5 7.5C8.5 9.433 10.067 11 12 11Z"
              stroke="#F0562A"
              strokeWidth="1.8"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    );
  }

  function DashboardContent() {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <PageHeader />
        {roleCode === 'SUPER_ADMIN'   ? <SuperAdminDashboard onNavigate={onNavigate} />   :
         roleCode === 'TOHFA_ADMIN'   ? <TohfaAdminDashboard />   :
         roleCode === 'FARMER_ADMIN'  ? <FarmerAdminDashboard />  :
         roleCode === 'MAIN_WH_ADMIN' ? <MainWhAdminDashboard />  :
         <SubWhAdminDashboard />}
        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  function ProfileContent() {
    return (
      <View style={styles.profilePane}>
        <View style={[styles.avatarCircle, styles.profileAvatar, { backgroundColor: accentBg }]}>
          <Icon name="person" size={44} color={accent} />
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <View style={[styles.rolePill, { backgroundColor: accentBg, alignSelf: 'center', marginBottom: isSubWh ? 6 : 32 }]}>
          <Icon name={roleIcon} size={12} color={accent} />
          <Text style={[styles.rolePillText, { color: accent }]}>{roleLabel}</Text>
        </View>
        {isSubWh ? (
          <View style={[styles.rolePill, { backgroundColor: A.blueBg, alignSelf: 'center', marginBottom: 32 }]}>
            <Icon name="place" size={12} color={A.blue} />
            <Text style={[styles.rolePillText, { color: A.blue }]}>Coonoor Warehouse</Text>
          </View>
        ) : null}
        {user?.email  ? <Text style={styles.profileMeta}>{user.email}</Text>  : null}
        {user?.mobile ? <Text style={styles.profileMeta}>{user.mobile}</Text> : null}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Icon name="cancel" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Drill-down states for Tohfa Admin flows
  const [currentView, setCurrentView] = useState<
    | 'MAIN'
    | 'PENDING_APPLICATIONS'
    | 'APPLICATION_DETAIL'
    | 'APPLICATION_APPROVE'
    | 'APPLICATION_REJECT'
    | 'APPLICATION_REQUEST_INFO'
    | 'FARMER_DETAIL'
    | 'FARM_MAP'
    | 'KYC_REVIEW'
    | 'CERT_VERIFICATION'
    | 'RATING_SCORECARD'
    | 'COMPLIANCE_TIERS'
  >('MAIN');
  const [selectedPendingApp, setSelectedPendingApp] = useState<PendingApplicationItem | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerListItem | null>(null);
  const [farmerDetailTab, setFarmerDetailTab] = useState<'Overview' | 'Farm' | 'KYC' | 'Ratings'>('Overview');

  // When switching bottom tabs, reset drill-down view to MAIN
  const handleTabPress = (tabName: AdminTab) => {
    setActiveTab(tabName);
    setCurrentView('MAIN');
  };

  if (currentView === 'PENDING_APPLICATIONS') {
    return (
      <AdminPendingApplicationsScreen
        onBack={() => setCurrentView('MAIN')}
        onSelectApplication={(app: PendingApplicationItem) => {
          setSelectedPendingApp(app);
          setCurrentView('APPLICATION_DETAIL');
        }}
      />
    );
  }

  function Placeholder({ label }: { label: string }) {
    return (
      <View style={styles.placeholder}>
        <Icon name="info" size={40} color={A.muted} />
        <Text style={styles.placeholderTitle}>{label}</Text>
        <Text style={styles.placeholderSub}>Manage this section on the Web Admin Portal.</Text>
      </View>
    );
  }

  if (currentView === 'APPLICATION_DETAIL' && selectedPendingApp) {
    return (
      <AdminApplicationDetailScreen
        application={selectedPendingApp}
        onBack={() => setCurrentView('PENDING_APPLICATIONS')}
        onApprove={() => setCurrentView('APPLICATION_APPROVE')}
        onReject={() => setCurrentView('APPLICATION_REJECT')}
        onRequestMoreInfo={() => setCurrentView('APPLICATION_REQUEST_INFO')}
      />
    );
  }

  if (currentView === 'APPLICATION_APPROVE' && selectedPendingApp) {
    return (
      <AdminApplicationApproveScreen
        application={selectedPendingApp}
        onBack={() => setCurrentView('APPLICATION_DETAIL')}
        onConfirmApprove={(notes: string) => {
          Alert.alert(
            'Application Approved',
            `Farmer ${selectedPendingApp.name} has been onboarded to Tohfa Platform successfully!`,
          );
          setCurrentView('PENDING_APPLICATIONS');
        }}
      />
    );
  }

  if (currentView === 'APPLICATION_REJECT' && selectedPendingApp) {
    return (
      <AdminApplicationRejectScreen
        application={selectedPendingApp}
        onBack={() => setCurrentView('APPLICATION_DETAIL')}
        onConfirmReject={(reason: string, details?: string) => {
          Alert.alert(
            'Application Rejected',
            `Application for ${selectedPendingApp.name} was rejected.\nReason: ${reason}`,
          );
          setCurrentView('PENDING_APPLICATIONS');
        }}
      />
    );
  }

  if (currentView === 'APPLICATION_REQUEST_INFO' && selectedPendingApp) {
    return (
      <AdminApplicationRequestInfoScreen
        application={selectedPendingApp}
        onBack={() => setCurrentView('APPLICATION_DETAIL')}
        onConfirmRequest={(items: string[], message: string) => {
          Alert.alert(
            'Information Requested',
            `SMS & notification dispatched to ${selectedPendingApp.name} for ${items.length} requested item(s).`,
          );
          setCurrentView('PENDING_APPLICATIONS');
        }}
      />
    );
  }

  if (currentView === 'FARMER_DETAIL' && selectedFarmer) {
    return (
      <AdminFarmerDetailScreen
        farmer={selectedFarmer}
        initialTab={farmerDetailTab}
        onTabChange={setFarmerDetailTab}
        onBack={() => {
          setFarmerDetailTab('Overview');
          setCurrentView('MAIN');
        }}
        onEdit={() => {
          Alert.alert('Edit', `Editing ${selectedFarmer.name}`);
        }}
        onDisable={() => {
          Alert.alert('Disabled', `Farmer ${selectedFarmer.name} disabled.`);
          setFarmerDetailTab('Overview');
          setCurrentView('MAIN');
        }}
        onOpenFarmMap={() => {
          setFarmerDetailTab('Farm');
          setCurrentView('FARM_MAP');
        }}
        onOpenKycReview={() => {
          setFarmerDetailTab('KYC');
          setCurrentView('KYC_REVIEW');
        }}
        onOpenRatingScorecard={() => {
          setFarmerDetailTab('Ratings');
          setCurrentView('RATING_SCORECARD');
        }}
      />
    );
  }

  if (currentView === 'FARM_MAP' && selectedFarmer) {
    return (
      <AdminFarmMapScreen
        farmer={selectedFarmer}
        onBack={() => {
          setFarmerDetailTab('Farm');
          setCurrentView('FARMER_DETAIL');
        }}
      />
    );
  }

  if (currentView === 'KYC_REVIEW' && selectedFarmer) {
    return (
      <AdminKycReviewScreen
        farmer={selectedFarmer}
        onBack={() => {
          setFarmerDetailTab('KYC');
          setCurrentView('FARMER_DETAIL');
        }}
        onGoToCertificationVerification={() => setCurrentView('CERT_VERIFICATION')}
      />
    );
  }

  if (currentView === 'CERT_VERIFICATION' && selectedFarmer) {
    return (
      <AdminCertVerificationScreen
        farmer={selectedFarmer}
        onBack={() => setCurrentView('KYC_REVIEW')}
        onVerified={() => {
          setCurrentView('KYC_REVIEW');
        }}
        onUnverified={() => {
          setCurrentView('KYC_REVIEW');
        }}
      />
    );
  }

  if (currentView === 'RATING_SCORECARD' && selectedFarmer) {
    return (
      <AdminRatingScorecardScreen
        farmer={selectedFarmer}
        onBack={() => {
          setFarmerDetailTab('Ratings');
          setCurrentView('FARMER_DETAIL');
        }}
        onOpenComplianceTiers={() => setCurrentView('COMPLIANCE_TIERS')}
        onEditCategories={() => {
          Alert.alert('Edit Categories', `Editing categories for ${selectedFarmer.name}`);
        }}
      />
    );
  }

  if (currentView === 'COMPLIANCE_TIERS') {
    return (
      <AdminComplianceTiersScreen
        onBack={() => setCurrentView('RATING_SCORECARD')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={A.pageBg} />
      <View style={{ flex: 1 }}>
        {activeTab === 'Dashboard' ? (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <PageHeader />
            {roleCode === 'SUPER_ADMIN' ? (
              <SuperAdminDashboard onNavigate={onNavigate} />
            ) : roleCode === 'TOHFA_ADMIN' ? (
              <TohfaAdminDashboard
                onSeeAllPending={() => setCurrentView('PENDING_APPLICATIONS')}
                onSelectPending={(app) => {
                  setSelectedPendingApp(app);
                  setCurrentView('APPLICATION_DETAIL');
                }}
              />
            ) : roleCode === 'FARMER_ADMIN' ? (
              <FarmerAdminDashboard />
            ) : roleCode === 'MAIN_WH_ADMIN' ? (
              <MainWhAdminDashboard />
            ) : (
              <SubWhAdminDashboard />
            )}
            <View style={{ height: 32 }} />
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
          /* Blank screen for other tabs (Sales, Reports) */
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
          onPress={() => onNavigate?.('AdminAllFarmers')}
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

  // Missing styles for helper components
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  alertSub: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  alertLink: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.orange,
  },
  alertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    minWidth: 150,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    marginBottom: 4,
  },
  statDelta: {
    fontSize: 12,
    color: PALETTE.ink,
  },
  approvalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 12,
  },
  approvalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
    marginBottom: 4,
  },
  approvalSub: {
    fontSize: 13,
    color: PALETTE.labelMuted,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  cardStack: {
    marginBottom: 20,
  },
  farmerAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 12,
  },
  farmerAppIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PALETTE.peachIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  farmerAppText: {
    flex: 1,
  },
  farmerAppName: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.ink,
    marginBottom: 4,
  },
  farmerAppStatus: {
    fontSize: 13,
    color: PALETTE.labelMuted,
  },
  headerAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PALETTE.peachBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: {
    fontSize: 14,
    color: PALETTE.labelMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.ink,
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSub: {
    fontSize: 14,
    color: PALETTE.labelMuted,
    textAlign: 'center',
  },
});
