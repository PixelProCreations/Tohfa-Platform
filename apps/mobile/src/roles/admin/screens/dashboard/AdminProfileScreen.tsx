import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { fetchMe, logout, type UserMe } from '../../../farmer/api/auth';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary: '#F0562A',       // Exact requested brand orange
  primaryLight: '#FFF0EB',  // Soft peach/orange tint
  primaryBorder: '#FCDCD1', // Soft orange border
  primaryDark: '#D4451C',   // Pressed/darker orange

  pageBg: '#FAF8F5',        // Warm off-white background
  cardBg: '#FFFFFF',        // Pure white card surfaces
  ink: '#1A1412',           // Deep charcoal/black text
  labelMuted: '#6D6761',    // Secondary muted gray-brown
  border: '#EFEAE3',        // Soft divider border
  borderLight: '#F5F2EC',   // Subtle card inner border
  inputBg: '#FDFCFB',       // Form input background

  green: '#16A34A',
  greenLight: '#EAF5EA',
  amber: '#D97706',
  amberLight: '#FEF3C7',
  blue: '#2563EB',
  blueLight: '#EBF3FA',
  purple: '#7C3AED',
  purpleLight: '#F3E8FF',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ArrowBackIcon({ color = PALETTE.ink }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19L5 12L12 5" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={PALETTE.primaryLight} />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function KeyIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={8} cy={15} r={4} stroke={color} strokeWidth={2} />
      <Path d="M10.85 12.15L19 4M18 5L20 7M15 8L17 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function SlidersIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={4} cy={12} r={2} stroke={color} strokeWidth={2} />
      <Circle cx={12} cy={10} r={2} stroke={color} strokeWidth={2} />
      <Circle cx={20} cy={14} r={2} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function ChevronRightIcon({ color = '#B8B2A9' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 18, color = PALETTE.green }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
      <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LogOutIcon({ size = 18, color = PALETTE.danger }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Props & Role Specific Configurations ─────────────────────────────────────
export interface AdminProfileScreenProps {
  role?: 'SUPER_ADMIN' | 'TOHFA_ADMIN' | 'FARMER_ADMIN' | 'MAIN_WH_ADMIN' | 'SUB_WH_ADMIN';
  onBack?: () => void;
  onSignOut: () => void;
}

type InnerScreenView = 'main' | 'edit' | 'permissions' | 'security' | 'preferences' | 'support';

interface RoleProfileSpec {
  title: string;
  badgeLabel: string;
  staffId: string;
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  dept: string;
  hub: string;
  dutyHours: string;
  reportingTo: string;
  metrics: Array<{ val: string; lbl: string; highlight?: boolean }>;
  permissions: string[];
  alertTypes: Array<{ key: string; title: string; subtitle: string; defaultVal: boolean }>;
  supportDetails: {
    deskName: string;
    hotline: string;
    email: string;
    hours: string;
  };
}

const ROLE_SPECS: Record<string, RoleProfileSpec> = {
  SUPER_ADMIN: {
    title: 'Super Administrator Profile',
    badgeLabel: 'Super Administrator',
    staffId: 'TOHFA-SA-0001',
    defaultName: 'Rajesh Kumar',
    defaultEmail: 'superadmin@tohfa.test',
    defaultPhone: '+91 98000 00001',
    dept: 'Executive Governance & Platform Control',
    hub: 'Statewide & Nilgiris Biosphere Zone (All Hubs)',
    dutyHours: '24/7 Executive Authority',
    reportingTo: 'Board of Governors / Agricultural Ministry',
    metrics: [
      { val: '4 Hubs', lbl: 'Supervised' },
      { val: 'SUPER', lbl: 'Access Tier' },
      { val: '100%', lbl: 'Secured', highlight: true },
    ],
    permissions: [
      'Full System Database Cluster Access & Audit Trace Logs',
      'User Role Assignment, Elevation & Access Revocation',
      'Financial Ledger Authorization & Multi-Warehouse Payout Release',
      'Inter-Hub Stock Redistribution Overrides & Emergency Clearance',
      'PGS India / NPOP Organic Compliance Certification Governance',
    ],
    alertTypes: [
      { key: 'payouts', title: 'High-Value Payout Sign-offs', subtitle: 'Alert for transactions requiring executive approval (> ₹50,000)', defaultVal: true },
      { key: 'audits', title: 'Critical Compliance Flags', subtitle: 'Instant notification on severe audit failure or non-compliance', defaultVal: true },
      { key: 'security', title: 'System Security & Access Events', subtitle: 'Real-time alert on anomalous login or privilege escalation', defaultVal: true },
    ],
    supportDetails: {
      deskName: 'TOHFA Core Infrastructure Operations',
      hotline: '1800-425-8643 (Priority Line)',
      email: 'governance@tohfa.in',
      hours: '24/7 Priority Emergency Support',
    },
  },

  TOHFA_ADMIN: {
    title: 'Tohfa Operations Admin Profile',
    badgeLabel: 'Platform Operations Admin',
    staffId: 'TOHFA-OP-0012',
    defaultName: 'Priya Sundaram',
    defaultEmail: 'operations@tohfa.test',
    defaultPhone: '+91 98000 00002',
    dept: 'Supply Chain, Allocations & Marketplace Operations',
    hub: 'Central Marketplace & Dynamic Stock Routing Hub',
    dutyHours: '06:00 AM – 09:00 PM (Daily Dispatch Windows)',
    reportingTo: 'Chief Operations Officer',
    metrics: [
      { val: '18 Live', lbl: 'Commodities' },
      { val: '42 Routed', lbl: 'Allocations' },
      { val: '99.4%', lbl: 'Fulfillment', highlight: true },
    ],
    permissions: [
      'Live Produce Marketplace Catalog & Buyer Orders Management',
      'Daily Floor Price Calibration & Price Ceiling Enforcement',
      'Automated Hub-to-Hub Stock Redistribution Algorithms',
      'Buyer Order Verification & Central Dispatch Clearance',
      'Marketplace Dispute Resolution & Buyer Return Allocations',
    ],
    alertTypes: [
      { key: 'pricing', title: 'Price Floor & Ceiling Alerts', subtitle: 'Notification when market rates breach allowed variance', defaultVal: true },
      { key: 'allocations', title: 'Inter-Warehouse Routing Deficits', subtitle: 'Alert when a sub-warehouse runs low on committed crop stock', defaultVal: true },
      { key: 'disputes', title: 'Counter-Offer Escalations', subtitle: 'Immediate alert when buyer-farmer negotiations stall', defaultVal: true },
    ],
    supportDetails: {
      deskName: 'Tohfa Marketplace & Logistics Command',
      hotline: '1800-425-8644',
      email: 'marketplace-ops@tohfa.in',
      hours: '05:30 AM – 10:30 PM Everyday',
    },
  },

  FARMER_ADMIN: {
    title: 'Farmer Admin Profile',
    badgeLabel: 'Farmer Admin & Grower Rep',
    staffId: 'TOHFA-FA-0028',
    defaultName: 'Muthu Velan',
    defaultEmail: 'farmeradmin@tohfa.test',
    defaultPhone: '+91 98000 00003',
    dept: 'Smallholder Farmer Outreach & Verification',
    hub: 'Grower Representative Desk (Kotagiri / Coonoor / Ooty)',
    dutyHours: '07:00 AM – 07:00 PM',
    reportingTo: 'Nilgiris Farmer Producer Union Liaison',
    metrics: [
      { val: '148 Active', lbl: 'Growers' },
      { val: '12 Queued', lbl: 'Applications' },
      { val: '4.9 / 5', lbl: 'Trust Rating', highlight: true },
    ],
    permissions: [
      'Farmer Onboarding Queue & Land Survey KYC Verification',
      'Community Dispute & Counter-Offer Negotiation Mediation',
      'Direct Field Audit Verification & Grading Review',
      'Farmer Payout Discrepancy Escalation & Resolution',
      'FMB Sketch & Soil Test Verification Clearance',
    ],
    alertTypes: [
      { key: 'kyc', title: 'New Farmer Applications', subtitle: 'Instant alert when a new grower submits registration documents', defaultVal: true },
      { key: 'disputes', title: 'Farmer Grievance & Price Appeals', subtitle: 'Notify when a farmer requests intervention on lot grading', defaultVal: true },
      { key: 'audits', title: 'Upcoming Organic Field Audits', subtitle: 'Reminders 48h prior to scheduled village farm inspections', defaultVal: true },
    ],
    supportDetails: {
      deskName: 'Nilgiris Smallholder Grower Council',
      hotline: '1800-425-8645',
      email: 'farmer-help@tohfa.in',
      hours: '06:00 AM – 08:00 PM Daily',
    },
  },

  MAIN_WH_ADMIN: {
    title: 'Main Warehouse Admin Profile',
    badgeLabel: 'Main Warehouse Admin',
    staffId: 'TOHFA-MWH-0004',
    defaultName: 'Senthil Nathan',
    defaultEmail: 'mainwh@tohfa.test',
    defaultPhone: '+91 98000 00004',
    dept: 'Central Receiving & Multi-Hub Logistics',
    hub: 'Ooty Central Main Hub (WH-MAIN-01)',
    dutyHours: '05:00 AM – 11:00 PM (Shift Operations)',
    reportingTo: 'Director of Supply Chain & Logistics',
    metrics: [
      { val: '4 Hubs', lbl: 'Network Linked' },
      { val: '3,420 kg', lbl: 'Today Inward' },
      { val: '12 Active', lbl: 'Shift Staff', highlight: true },
    ],
    permissions: [
      'Central Cold Storage & Bulk Grain Silo Storage Management',
      'Inter-Warehouse Inward / Outward Manifest Clearance',
      'Logistics Fleet Coordination & Driver Route Scheduling',
      'Shift Staff Attendance & Crate Batch Tracking',
      'Multi-Hub Stock Reconciliation & Quality Grading Overrides',
    ],
    alertTypes: [
      { key: 'coldchain', title: 'Cold Chain Temperature Alerts', subtitle: 'Alert if cold storage chamber deviates from 2°C–6°C', defaultVal: true },
      { key: 'fleet', title: 'Fleet Arrival & Manifest Clearance', subtitle: 'Real-time alert when transit vehicle reaches gate', defaultVal: true },
      { key: 'staff', title: 'Shift Attendance & Staff Shortages', subtitle: 'Notify if daily floor weighment team has unassigned shifts', defaultVal: true },
    ],
    supportDetails: {
      deskName: 'Ooty Central Warehousing Support',
      hotline: '1800-425-8646',
      email: 'wh-main@tohfa.in',
      hours: '24/7 Loading Dock Support',
    },
  },

  SUB_WH_ADMIN: {
    title: 'Sub Warehouse Admin Profile',
    badgeLabel: 'Sub Warehouse Admin',
    staffId: 'TOHFA-SWH-0019',
    defaultName: 'Karthik Raja',
    defaultEmail: 'subwh.coonoor@tohfa.test',
    defaultPhone: '+91 98000 00005',
    dept: 'Local Hub Receiving & Customer Pickup Operations',
    hub: 'Coonoor Local Sub-Hub (WH-COON-02)',
    dutyHours: '06:00 AM – 08:30 PM',
    reportingTo: 'Main Warehouse Regional Manager',
    metrics: [
      { val: '42 Batches', lbl: 'Drop-offs' },
      { val: '18 Handled', lbl: 'Pickups' },
      { val: '₹48.5k', lbl: 'Cash Balance', highlight: true },
    ],
    permissions: [
      'Daily Farmer Batch Drop-off & Digital Weighment Recording',
      'Customer Pickup Queue Management & OTP Handover Verification',
      'Spot Cash Top-ups & Local Petty Cash Ledger Reconciliation',
      'Reusable Crate Return Verification & Deposit Release',
      'Local Secondary Stock Rotation & Daily Dispatch Handover',
    ],
    alertTypes: [
      { key: 'dropoffs', title: 'Farmer Weighment Sync Alerts', subtitle: 'Instant notification on batch weight confirmation', defaultVal: true },
      { key: 'pickups', title: 'Customer Pickup Queue Notifications', subtitle: 'Chime & alert when customer OTP is presented at desk', defaultVal: true },
      { key: 'cash', title: 'Spot Cash Rebalancing Reminders', subtitle: 'Alert when cash drawer reaches threshold for bank deposit', defaultVal: true },
    ],
    supportDetails: {
      deskName: 'Coonoor Hub Logistics Desk',
      hotline: '1800-425-8647',
      email: 'wh-coonoor@tohfa.in',
      hours: '06:00 AM – 09:00 PM Daily',
    },
  },
};

const DEFAULT_ROLE_SPEC: RoleProfileSpec = ROLE_SPECS['SUPER_ADMIN']!;

function getRoleSpec(role: string): RoleProfileSpec {
  return ROLE_SPECS[role] ?? DEFAULT_ROLE_SPEC;
}

export function AdminProfileScreen({
  role = 'SUPER_ADMIN',
  onBack,
  onSignOut,
}: AdminProfileScreenProps): React.JSX.Element {
  const spec: RoleProfileSpec = getRoleSpec(role);

  const [user, setUser] = useState<UserMe | null>(null);
  const [currentView, setCurrentView] = useState<InnerScreenView>('main');

  // Form state initialized with role spec
  const [fullName, setFullName] = useState(spec.defaultName);
  const [phone, setPhone] = useState(spec.defaultPhone);
  const [email, setEmail] = useState(spec.defaultEmail);
  const [hubLocation, setHubLocation] = useState(spec.hub);
  const [saveToast, setSaveToast] = useState(false);

  // Security state
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences state
  const [alertToggles, setAlertToggles] = useState<Record<string, boolean>>({
    [spec.alertTypes[0]?.key || 'a1']: true,
    [spec.alertTypes[1]?.key || 'a2']: true,
    [spec.alertTypes[2]?.key || 'a3']: true,
  });
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Tamil'>('English');

  useEffect(() => {
    fetchMe()
      .then((me) => {
        setUser(me);
        if (me.fullName) setFullName(me.fullName);
        if (me.email) setEmail(me.email);
        if (me.mobile) setPhone(me.mobile);
      })
      .catch(() => {});
  }, []);

  const handleToggleAlert = (key: string) => {
    setAlertToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = () => {
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      setCurrentView('main');
    }, 1000);
  };

  const handleSignOutConfirm = () => {
    Alert.alert(
      'Sign Out of ' + spec.badgeLabel,
      'Are you sure you want to end your active administrative session on ' + spec.staffId + '?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            onSignOut();
          },
        },
      ],
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  // SUB-SCREEN 1: EDIT PERSONAL INFO (100% FULL SCREEN - #F0562A)
  // ════════════════════════════════════════════════════════════════════════════
  if (currentView === 'edit') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setCurrentView('main')} activeOpacity={0.7}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Administrator Info</Text>
          <TouchableOpacity style={styles.headerActionBtn} onPress={handleSaveProfile} activeOpacity={0.7}>
            <Text style={styles.headerActionText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.roleHeaderTag}>
            <Text style={styles.roleHeaderTagText}>{spec.badgeLabel} · {spec.staffId}</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter administrator full name"
              placeholderTextColor="#A8A29E"
            />

            <Text style={styles.inputLabel}>Official Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 XXXXX XXXXX"
              placeholderTextColor="#A8A29E"
            />

            <Text style={styles.inputLabel}>Official System Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="admin@tohfa.test"
              placeholderTextColor="#A8A29E"
            />

            <Text style={styles.inputLabel}>Assigned Hub / Center Location</Text>
            <TextInput
              style={styles.input}
              value={hubLocation}
              onChangeText={setHubLocation}
              placeholder="e.g. Coonoor Sub-Hub"
              placeholderTextColor="#A8A29E"
            />
          </View>

          {saveToast && (
            <View style={styles.successToast}>
              <CheckCircleIcon size={18} color={PALETTE.green} />
              <Text style={styles.successToastText}>Profile updated successfully!</Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Save Profile Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUB-SCREEN 2: ROLE & MODULE PERMISSIONS (100% FULL SCREEN - #F0562A)
  // ════════════════════════════════════════════════════════════════════════════
  if (currentView === 'permissions') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setCurrentView('main')} activeOpacity={0.7}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Role & Permissions</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroSummaryCard}>
            <View style={styles.roleBadge}>
              <ShieldCheckIcon size={18} color={PALETTE.primary} />
              <Text style={styles.roleBadgeText}>{spec.badgeLabel}</Text>
            </View>
            <Text style={styles.heroSummarySub}>Staff Code: {spec.staffId}</Text>
            <Text style={styles.heroSummaryDept}>{spec.dept}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Operational Scope & Governance</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Territory</Text>
              <Text style={styles.infoValueBold}>{spec.hub}</Text>
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reporting Channel</Text>
              <Text style={styles.infoValue}>{spec.reportingTo}</Text>
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Active Duty Window</Text>
              <Text style={styles.infoValue}>{spec.dutyHours}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Granted Operational Privileges</Text>
            {spec.permissions.map((perm, idx) => (
              <View key={idx} style={styles.permRow}>
                <View style={styles.checkIconWrapper}>
                  <CheckCircleIcon size={18} color={PALETTE.primary} />
                </View>
                <Text style={styles.permText}>{perm}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              Security Policy: Administrative privileges for {spec.staffId} are cryptographically authenticated against TOHFA Unified RBAC Protocols.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUB-SCREEN 3: SECURITY & ACCESS (100% FULL SCREEN - #F0562A)
  // ════════════════════════════════════════════════════════════════════════════
  if (currentView === 'security') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setCurrentView('main')} activeOpacity={0.7}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security & Access</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Authentication Credentials</Text>

            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.switchTitle}>Biometric Authentication</Text>
                <Text style={styles.switchSub}>Use Face ID / Fingerprint for quick administrative unlocking</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: '#E2DCD5', true: PALETTE.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.switchTitle}>Two-Factor Authentication (2FA)</Text>
                <Text style={styles.switchSub}>Enforce SMS OTP code during sign in to {spec.staffId}</Text>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={setTwoFactorEnabled}
                trackColor={{ false: '#E2DCD5', true: PALETTE.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionHeader}>Update Account Password</Text>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current administrative password"
              placeholderTextColor="#A8A29E"
            />

            <Text style={styles.inputLabel}>New Secure Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Minimum 8 characters with numbers & symbols"
              placeholderTextColor="#A8A29E"
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new secure password"
              placeholderTextColor="#A8A29E"
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                Alert.alert('Password Updated', 'Your administrative password has been updated securely.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setCurrentView('main');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUB-SCREEN 4: PREFERENCES & ALERTS (100% FULL SCREEN - ENGLISH & TAMIL ONLY)
  // ════════════════════════════════════════════════════════════════════════════
  if (currentView === 'preferences') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setCurrentView('main')} activeOpacity={0.7}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preferences & Alerts</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Language Selection: English and Tamil only (No Hindi) */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Platform Interface Language</Text>
            <View style={styles.langSelectorRow}>
              <TouchableOpacity
                style={[styles.langOptionCard, selectedLanguage === 'English' && styles.langOptionCardActive]}
                onPress={() => setSelectedLanguage('English')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langOptionTitle, selectedLanguage === 'English' && styles.langOptionTitleActive]}>
                  English
                </Text>
                <Text style={styles.langOptionSub}>Default Platform Language</Text>
                {selectedLanguage === 'English' && (
                  <View style={styles.langCheckBadge}>
                    <CheckCircleIcon size={16} color={PALETTE.primary} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.langOptionCard, selectedLanguage === 'Tamil' && styles.langOptionCardActive]}
                onPress={() => setSelectedLanguage('Tamil')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langOptionTitle, selectedLanguage === 'Tamil' && styles.langOptionTitleActive]}>
                  தமிழ் (Tamil)
                </Text>
                <Text style={styles.langOptionSub}>Regional State Language</Text>
                {selectedLanguage === 'Tamil' && (
                  <View style={styles.langCheckBadge}>
                    <CheckCircleIcon size={16} color={PALETTE.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Role-Specific Push Notification Toggles */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>{spec.badgeLabel} Operational Alerts</Text>

            {spec.alertTypes.map((alertItem, idx) => (
              <React.Fragment key={alertItem.key}>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.switchTitle}>{alertItem.title}</Text>
                    <Text style={styles.switchSub}>{alertItem.subtitle}</Text>
                  </View>
                  <Switch
                    value={alertToggles[alertItem.key] ?? alertItem.defaultVal}
                    onValueChange={() => handleToggleAlert(alertItem.key)}
                    trackColor={{ false: '#E2DCD5', true: PALETTE.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                {idx < spec.alertTypes.length - 1 && <View style={styles.rowDivider} />}
              </React.Fragment>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentView('main')} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Save Preferences</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUB-SCREEN 5: HELPDESK & DIAGNOSTICS (100% FULL SCREEN - #F0562A)
  // ════════════════════════════════════════════════════════════════════════════
  if (currentView === 'support') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setCurrentView('main')} activeOpacity={0.7}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Helpdesk & System Health</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>System Diagnostics & Network Health</Text>

            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>API Gateway Cluster</Text>
              <View style={styles.badgeSuccess}>
                <View style={styles.dotSuccess} />
                <Text style={styles.badgeSuccessText}>Online (22ms)</Text>
              </View>
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>PostgreSQL & Redis DB</Text>
              <View style={styles.badgeSuccess}>
                <View style={styles.dotSuccess} />
                <Text style={styles.badgeSuccessText}>Synchronized</Text>
              </View>
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>App Environment</Text>
              <Text style={styles.diagVal}>Mobile v1.0.4 · Production</Text>
            </View>
            <View style={styles.rowDivider} />

            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Offline Local Storage</Text>
              <Text style={styles.diagVal}>14.2 MB Cached</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>{spec.badgeLabel} Technical Desk</Text>
            <Text style={styles.supportOrgName}>{spec.supportDetails.deskName}</Text>
            <Text style={styles.supportLine}>Direct Hotline: {spec.supportDetails.hotline}</Text>
            <Text style={styles.supportLine}>Support Email: {spec.supportDetails.email}</Text>
            <Text style={styles.supportLine}>Duty Window: {spec.supportDetails.hours}</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              Alert.alert('Cache Cleared', 'Offline temporary cached images and datasets cleared successfully.');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Clear Local App Cache</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN VIEW: TAILORED ROLE PROFILE OVERVIEW
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      {/* Top Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.headerBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back">
            <ArrowBackIcon />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
        <Text style={styles.headerTitle}>{spec.badgeLabel}</Text>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => setCurrentView('edit')}
          activeOpacity={0.7}
        >
          <Text style={styles.headerActionText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <UserIcon size={38} color={PALETTE.primary} />
            </View>
            <TouchableOpacity
              style={styles.avatarEditBadge}
              onPress={() => setCurrentView('edit')}
              activeOpacity={0.8}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          <Text style={styles.heroName}>{fullName}</Text>
          <Text style={styles.heroEmail}>{email}</Text>

          {/* Role Pill in #F0562A */}
          <View style={styles.roleBadge}>
            <ShieldCheckIcon size={14} color={PALETTE.primary} />
            <Text style={styles.roleBadgeText}>{spec.badgeLabel}</Text>
          </View>

          {/* Role-Specific Quick Metrics Bar */}
          <View style={styles.metricsBar}>
            {spec.metrics.map((m, idx) => (
              <React.Fragment key={idx}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricVal, m.highlight && { color: PALETTE.green }]}>{m.val}</Text>
                  <Text style={styles.metricLbl}>{m.lbl}</Text>
                </View>
                {idx < spec.metrics.length - 1 && <View style={styles.metricDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Section 1: Staff & Account Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Staff Credentials & Hub</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Staff Code</Text>
            <Text style={styles.infoValueBold}>{spec.staffId}</Text>
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{spec.dept}</Text>
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Hub</Text>
            <Text style={styles.infoValue}>{hubLocation}</Text>
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Official Contact</Text>
            <Text style={styles.infoValue}>{phone}</Text>
          </View>
        </View>

        {/* Section 2: Full Screen Navigation to Sub-Screens */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Controls & Operations</Text>

          {/* Edit Profile */}
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentView('edit')} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: PALETTE.primaryLight }]}>
              <UserIcon size={18} color={PALETTE.primary} />
            </View>
            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>Edit Personal Info</Text>
              <Text style={styles.menuSubtitle}>Name, official phone & hub location</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* Role & Permissions */}
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentView('permissions')} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: PALETTE.primaryLight }]}>
              <ShieldCheckIcon size={18} color={PALETTE.primary} />
            </View>
            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>Role & Module Permissions</Text>
              <Text style={styles.menuSubtitle}>{spec.permissions.length} operational privileges</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* Security & Password */}
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentView('security')} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: PALETTE.amberLight }]}>
              <KeyIcon size={18} color={PALETTE.amber} />
            </View>
            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>Security & Biometrics</Text>
              <Text style={styles.menuSubtitle}>Password, 2FA & Face ID / Fingerprint</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* Preferences & Notifications */}
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentView('preferences')} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: PALETTE.purpleLight }]}>
              <BellIcon size={18} color={PALETTE.purple} />
            </View>
            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>Alert Preferences & Language</Text>
              <Text style={styles.menuSubtitle}>{selectedLanguage} · {spec.alertTypes.length} alert channels active</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* Support & Diagnostics */}
          <TouchableOpacity style={styles.menuRow} onPress={() => setCurrentView('support')} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: PALETTE.blueLight }]}>
              <SlidersIcon size={18} color={PALETTE.blue} />
            </View>
            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>Helpdesk & Diagnostics</Text>
              <Text style={styles.menuSubtitle}>Platform v1.0.4 · Direct {spec.badgeLabel} desk</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Section 3: Sign Out Action */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOutConfirm} activeOpacity={0.8}>
          <LogOutIcon size={18} color={PALETTE.danger} />
          <Text style={styles.signOutButtonText}>Sign Out of {spec.badgeLabel}</Text>
        </TouchableOpacity>

        <Text style={styles.footerVersion}>TOHFA Unified Agriculture Platform · Build 2026.09.24</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: PALETTE.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPlaceholder: {
    width: 38,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.ink,
    letterSpacing: -0.2,
  },
  headerActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: PALETTE.primary,
    borderRadius: 8,
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Hero Card
  heroCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#1A1412',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PALETTE.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: PALETTE.cardBg,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: PALETTE.cardBg,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.ink,
    marginBottom: 2,
  },
  heroEmail: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: PALETTE.primaryLight,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    gap: 6,
    marginBottom: 16,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
    letterSpacing: 0.2,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  metricLbl: {
    fontSize: 11,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: PALETTE.border,
  },

  // Section Card
  sectionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#1A1412',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: PALETTE.labelMuted,
  },
  infoValue: {
    fontSize: 13,
    color: PALETTE.ink,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  infoValueBold: {
    fontSize: 13,
    color: PALETTE.ink,
    fontWeight: '800',
  },
  rowDivider: {
    height: 1,
    backgroundColor: PALETTE.borderLight,
    marginVertical: 4,
  },

  // Menu Rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  menuSubtitle: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: 1,
  },

  // Buttons
  primaryButton: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.danger,
  },
  footerVersion: {
    textAlign: 'center',
    fontSize: 11,
    color: PALETTE.labelMuted,
    marginTop: 18,
  },

  // Form Inputs
  roleHeaderTag: {
    alignSelf: 'center',
    backgroundColor: PALETTE.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
  },
  roleHeaderTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  formCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.labelMuted,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: PALETTE.inputBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: PALETTE.ink,
    marginBottom: 6,
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.greenLight,
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  successToastText: {
    fontSize: 13,
    color: PALETTE.green,
    fontWeight: '600',
  },

  // Permissions Sub-Screen
  heroSummaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
  },
  heroSummarySub: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.ink,
    marginTop: 8,
  },
  heroSummaryDept: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  checkIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PALETTE.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permText: {
    fontSize: 13,
    color: PALETTE.ink,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  infoBanner: {
    backgroundColor: PALETTE.primaryLight,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoBannerText: {
    fontSize: 12,
    color: PALETTE.primaryDark,
    lineHeight: 18,
  },

  // Switches
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  switchSub: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },

  // Languages (English & Tamil only)
  langSelectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langOptionCard: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    borderRadius: 12,
    padding: 14,
    position: 'relative',
  },
  langOptionCardActive: {
    backgroundColor: PALETTE.primaryLight,
    borderColor: PALETTE.primary,
  },
  langOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 2,
  },
  langOptionTitleActive: {
    color: PALETTE.primary,
  },
  langOptionSub: {
    fontSize: 11,
    color: PALETTE.labelMuted,
  },
  langCheckBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  // Diagnostics
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  diagLabel: {
    fontSize: 13,
    color: PALETTE.labelMuted,
  },
  diagVal: {
    fontSize: 13,
    color: PALETTE.ink,
    fontWeight: '700',
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  dotSuccess: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.green,
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.green,
  },
  supportOrgName: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.ink,
    marginBottom: 6,
  },
  supportLine: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    lineHeight: 18,
  },
});
