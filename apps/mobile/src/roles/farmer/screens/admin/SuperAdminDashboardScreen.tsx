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
import { fetchMe, logout, type UserMe } from '../../api/auth';
import { Icon } from '@tohfa/mobile-ui';
import { colors } from '../../theme';
import { getGreetingKey } from '../../utils/greeting';

// ─── Palette ──────────────────────────────────────────────────────────────────
const A = {
  orange:    '#E8562A',
  orangeBg:  '#FFECE8',
  green:     '#2E7D32',
  greenBg:   '#E8F5E9',
  blue:      '#3B7DE8',
  blueBg:    '#E8F0FE',
  amber:     '#E08000',
  amberBg:   '#FFF3E0',
  purple:    '#7C4DFF',
  purpleBg:  '#EDE7F6',
  infoBlue:  '#1976D2',
  infoBlueBg:'#E3F0FF',
  cardBg:    '#FFFFFF',
  pageBg:    '#FAF8F5',
  muted:     '#9A8F88',
  body:      '#6B6560',
  ink:       '#1A1412',
  deltaGreen:'#2E7D32',
  shadow:    '#000000',
  tabBorder: '#EDE9E4',
  onDutyBg:  '#E8F5E9',
  onDutyText:'#2E7D32',
  absentBg:  '#FFECE8',
  absentText:'#E8562A',
};

// ─── Role meta ────────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:   'Super Admin',
  TOHFA_ADMIN:   'TOHFA Admin',
  MAIN_WH_ADMIN: 'Main Warehouse Admin',
  SUB_WH_ADMIN:  'Sub Warehouse Admin',
  FARMER_ADMIN:  'Farmer Admin · Elected',
};

const ADMIN_PRIORITY = [
  'SUPER_ADMIN', 'TOHFA_ADMIN', 'MAIN_WH_ADMIN', 'SUB_WH_ADMIN', 'FARMER_ADMIN',
] as const;

function getPrimaryAdminRole(roles: UserMe['roles']): string {
  for (const code of ADMIN_PRIORITY) {
    if (roles.some((r) => r.code === code)) return code;
  }
  return 'SUPER_ADMIN';
}
function getAdminRoleLabel(roles: UserMe['roles']): string {
  return ROLE_LABEL[getPrimaryAdminRole(roles)] ?? 'Admin';
}

// ─── Tab bar definitions ──────────────────────────────────────────────────────
type AdminTab =
  | 'Dashboard' | 'Farmers' | 'Sales' | 'Reports' | 'Profile'
  | 'Listings'  | 'Community'
  | 'Warehouses'| 'Allocation'
  | 'Receiving' | 'Pickups';

const SUPER_TABS: { name: AdminTab; icon: string; label: string }[] = [
  { name: 'Dashboard', icon: 'home',       label: 'Dashboard' },
  { name: 'Farmers',   icon: 'eco',        label: 'Farmers'   },
  { name: 'Sales',     icon: 'storefront', label: 'Sales'     },
  { name: 'Reports',   icon: 'assignment', label: 'Reports'   },
  { name: 'Profile',   icon: 'person',     label: 'Profile'   },
];

const FARMER_ADMIN_TABS: { name: AdminTab; icon: string; label: string }[] = [
  { name: 'Dashboard', icon: 'home',   label: 'Dashboard' },
  { name: 'Listings',  icon: 'badge',  label: 'Listings'  },
  { name: 'Community', icon: 'groups', label: 'Community' },
  { name: 'Profile',   icon: 'person', label: 'Profile'   },
];

const MAIN_WH_TABS: { name: AdminTab; icon: string; label: string }[] = [
  { name: 'Dashboard',  icon: 'home',        label: 'Dashboard'  },
  { name: 'Warehouses', icon: 'inventory_2', label: 'Warehouses' },
  { name: 'Allocation', icon: 'swap_horiz',  label: 'Allocation' },
  { name: 'Profile',    icon: 'person',      label: 'Profile'    },
];

const SUB_WH_TABS: { name: AdminTab; icon: string; label: string }[] = [
  { name: 'Dashboard', icon: 'home',      label: 'Dashboard' },
  { name: 'Receiving', icon: 'download',  label: 'Receiving' },
  { name: 'Pickups',   icon: 'crop_free', label: 'Pickups'   },
  { name: 'Profile',   icon: 'person',    label: 'Profile'   },
];

function tabsForRole(code: string) {
  if (code === 'FARMER_ADMIN')  return FARMER_ADMIN_TABS;
  if (code === 'MAIN_WH_ADMIN') return MAIN_WH_TABS;
  if (code === 'SUB_WH_ADMIN')  return SUB_WH_TABS;
  return SUPER_TABS;
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function SectionTitle({
  text, action, onAction, accent = A.orange,
}: { text: string; action?: string; onAction?: () => void; accent?: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: accent }]}>{text}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.sectionAction, { color: accent }]}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StatCard({
  iconName, iconColor, iconBg, value, label, delta, deltaColor,
}: {
  iconName: string; iconColor: string; iconBg: string;
  value: string; label: string; delta?: string; deltaColor?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBox, { backgroundColor: iconBg }]}>
        <Icon name={iconName} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {delta ? <Text style={[styles.statDelta, { color: deltaColor ?? A.deltaGreen }]}>{delta}</Text> : null}
    </View>
  );
}

function ApprovalCard({
  iconName, title, subtitle, badge,
}: { iconName: string; title: string; subtitle: string; badge: number; }) {
  return (
    <View style={styles.approvalCard}>
      <View style={[styles.approvalIconBox, { backgroundColor: A.orangeBg }]}>
        <Icon name={iconName} size={20} color={A.orange} />
      </View>
      <View style={styles.approvalTextCol}>
        <Text style={styles.approvalTitle}>{title}</Text>
        <Text style={styles.approvalSub}>{subtitle}</Text>
      </View>
      <View style={styles.badgeCircle}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
      <Icon name="chevron_right" size={18} color={A.muted} />
    </View>
  );
}

function AlertCard({ title, subtitle, linkLabel }: {
  title: string; subtitle: string; linkLabel: string;
}) {
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertRow}>
        <Icon name="warning" size={16} color={A.orange} style={{ marginTop: 1 }} />
        <Text style={styles.alertTitle}>{title}</Text>
      </View>
      <Text style={styles.alertSub}>{subtitle}</Text>
      <Text style={styles.alertLink}>{linkLabel} →</Text>
    </View>
  );
}

function QuickBtn({
  iconName, label, accent = A.orange, bg = A.orangeBg,
}: { iconName: string; label: string; accent?: string; bg?: string }) {
  return (
    <TouchableOpacity style={styles.quickBtn} activeOpacity={0.75}>
      <View style={[styles.quickIconBox, { backgroundColor: bg }]}>
        <Icon name={iconName} size={22} color={accent} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function FarmerAppRow({ name, location, status }: {
  name: string; location: string; status: string;
}) {
  return (
    <View style={styles.farmerAppRow}>
      <View style={[styles.farmerAppIcon, { backgroundColor: A.orangeBg }]}>
        <Icon name="person" size={18} color={A.orange} />
      </View>
      <View style={styles.farmerAppText}>
        <Text style={styles.farmerAppName}>{name} — {location}</Text>
        <Text style={styles.farmerAppStatus}>{status}</Text>
      </View>
      <Icon name="chevron_right" size={18} color={A.muted} />
    </View>
  );
}

function InfoCard({ bold, sub, borderColor = A.infoBlue, iconBg = A.infoBlueBg, iconColor = A.infoBlue }: {
  bold: string; sub: string; borderColor?: string; iconBg?: string; iconColor?: string;
}) {
  return (
    <View style={[styles.infoCard, { borderLeftColor: borderColor }]}>
      <View style={[styles.infoIconBox, { backgroundColor: iconBg }]}>
        <Icon name="credit_card" size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoCardBold}>{bold}</Text>
        <Text style={styles.infoCardSub}>{sub}</Text>
      </View>
    </View>
  );
}

function ListingReviewRow({
  iconName, iconColor, iconBg, title, subtitle, muted = false,
}: {
  iconName: string; iconColor: string; iconBg: string;
  title: string; subtitle: string; muted?: boolean;
}) {
  return (
    <View style={[styles.farmerAppRow, muted && { opacity: 0.55 }]}>
      <View style={[styles.farmerAppIcon, { backgroundColor: iconBg }]}>
        <Icon name={iconName} size={18} color={iconColor} />
      </View>
      <View style={styles.farmerAppText}>
        <Text style={[styles.farmerAppName, muted && { color: A.muted }]}>{title}</Text>
        <Text style={styles.farmerAppStatus}>{subtitle}</Text>
      </View>
      {!muted && <Icon name="chevron_right" size={18} color={A.muted} />}
    </View>
  );
}

function DisputeCard({ title, subtitle, actionLabel }: {
  title: string; subtitle: string; actionLabel: string;
}) {
  return (
    <View style={[styles.alertCard, { borderLeftColor: A.orange }]}>
      <View style={styles.alertRow}>
        <Icon name="warning" size={16} color={A.orange} style={{ marginTop: 1 }} />
        <Text style={[styles.alertTitle, { fontWeight: '700' }]}>{title}</Text>
      </View>
      <Text style={styles.alertSub}>{subtitle}</Text>
      <Text style={styles.alertLink}>{actionLabel} →</Text>
    </View>
  );
}

// ─── Warehouse chip row (Main WH Admin) ───────────────────────────────────────

type WarehouseChip = { name: string; stock: number; low?: boolean };

const WAREHOUSES: WarehouseChip[] = [
  { name: 'Ooty',           stock: 92 },
  { name: 'Coonoor',        stock: 78 },
  { name: 'Kotagiri',       stock: 31, low: true },
  { name: 'Gudalur Market', stock: 85 },
];

function WarehouseChipRow({ selected, onSelect }: { selected: string; onSelect: (n: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll} style={{ marginBottom: 16 }}>
      {WAREHOUSES.map((wh) => {
        const isActive = wh.name === selected;
        return (
          <TouchableOpacity
            key={wh.name}
            style={[styles.warehouseChip, isActive && styles.warehouseChipActive]}
            onPress={() => onSelect(wh.name)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipName, isActive && styles.chipNameActive]}>{wh.name}</Text>
            <Text style={[styles.chipStock, wh.low && { color: A.orange }]}>
              {`Stock: ${wh.stock}%`}{wh.low ? ' — Low' : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Staff attendance row ─────────────────────────────────────────────────────

function InitialsAvatar({ initials }: { initials: string }) {
  return (
    <View style={styles.initialsAvatar}>
      <Text style={styles.initialsText}>{initials}</Text>
    </View>
  );
}

function StaffRow({ initials, name, location, time, status }: {
  initials: string; name: string; location: string;
  time: string; status: 'onduty' | 'absent';
}) {
  const onDuty = status === 'onduty';
  return (
    <View style={styles.staffRow}>
      <InitialsAvatar initials={initials} />
      <View style={styles.staffText}>
        <Text style={styles.staffName}>{name} — {location}</Text>
        <Text style={styles.staffTime}>{time}</Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: onDuty ? A.onDutyBg : A.absentBg }]}>
        <Text style={[styles.statusPillText, { color: onDuty ? A.onDutyText : A.absentText }]}>
          {onDuty ? 'On duty' : 'Absent'}
        </Text>
      </View>
    </View>
  );
}

function TransferRow({ from, to, detail }: { from: string; to: string; detail: string }) {
  return (
    <View style={styles.transferRow}>
      <View style={[styles.transferIconBox, { backgroundColor: A.orangeBg }]}>
        <Icon name="swap_horiz" size={20} color={A.orange} />
      </View>
      <View style={styles.transferText}>
        <Text style={styles.transferRoute}>{from} → {to}</Text>
        <Text style={styles.transferDetail}>{detail}</Text>
      </View>
      <Icon name="chevron_right" size={18} color={A.muted} />
    </View>
  );
}

/** Generic action card row (OTP queue, cash top-up) */
function ActionRow({
  iconName, iconBg, iconColor, title, subtitle,
}: {
  iconName: string; iconBg: string; iconColor: string;
  title: string; subtitle: string;
}) {
  return (
    <View style={styles.transferRow}>
      <View style={[styles.transferIconBox, { backgroundColor: iconBg }]}>
        <Icon name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.transferText}>
        <Text style={styles.transferRoute}>{title}</Text>
        <Text style={[styles.transferDetail, { color: A.orange }]}>{subtitle}</Text>
      </View>
      <Icon name="chevron_right" size={18} color={A.muted} />
    </View>
  );
}

// ─── Role-specific dashboard bodies ──────────────────────────────────────────

function SuperAdminDashboard() {
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
        <AlertCard title="7 farms overdue for quarterly audit"        subtitle="Q3 audit window closes in 5 days across Coonoor and Kotagiri zones."   linkLabel="Review audit calendar" />
        <AlertCard title="12 certifications expiring within 30 days" subtitle="PGS Organic renewals needed before listings are auto-blocked."            linkLabel="View farmers" />
      </View>
      <SectionTitle text="Quick actions" />
      <View style={styles.quickRow}>
        <QuickBtn iconName="person"        label="Create Admin"     />
        <QuickBtn iconName="settings"      label={`System\nConfig`} />
        <QuickBtn iconName="edit"          label="Fair Price"       />
        <QuickBtn iconName="verified_user" label="Finance"          />
      </View>
    </>
  );
}

function TohfaAdminDashboard() {
  return (
    <>
      <SectionTitle text="Today's operational snapshot" />
      <View style={styles.statsGrid}>
        <StatCard iconName="person"        iconColor={A.orange}  iconBg={A.orangeBg} value="9"  label="Pending Applications" />
        <StatCard iconName="storefront"    iconColor={A.blue}    iconBg={A.blueBg}   value="23" label="Listings to Approve"  />
        <StatCard iconName="check_circle"  iconColor={A.amber}   iconBg={A.amberBg}  value="6"  label="Audits This Quarter"  />
        <StatCard iconName="notifications" iconColor={A.purple}  iconBg={A.purpleBg} value="14" label="Open Support Tickets" />
      </View>
      <SectionTitle text="Pending farmer applications" action="See all" />
      <View style={styles.cardStack}>
        <FarmerAppRow name="Muthukumar S." location="Kotagiri" status="Applied 2 days ago · Documents complete"  />
        <FarmerAppRow name="Lakshmi R."    location="Ooty"     status="Applied 4 days ago · Awaiting KYC review" />
      </View>
      <SectionTitle text="Sales channel snapshot" />
      <View style={[styles.cardStack, { marginBottom: 20 }]}>
        <InfoCard bold="Online 70% · Market 10% · Horeca/B2B 20%" sub="Current channel split is within the locked 70/10/10/10 allocation policy." />
      </View>
      <SectionTitle text="Quick actions" />
      <View style={styles.quickRow}>
        <QuickBtn iconName="check_circle"   label={`Approve\nListings`} />
        <QuickBtn iconName="calendar_month" label={`Schedule\nAudit`}   />
        <QuickBtn iconName="help"           label="Support"             />
        <QuickBtn iconName="assignment"     label="Reports"             />
      </View>
    </>
  );
}

function FarmerAdminDashboard() {
  return (
    <>
      <SectionTitle text="Community queue" />
      <View style={styles.statsGrid}>
        <StatCard iconName="badge"          iconColor={A.orange} iconBg={A.orangeBg} value="11" label="Listings to Review"     />
        <StatCard iconName="calendar_month" iconColor={A.blue}   iconBg={A.blueBg}   value="3"  label="Field Visits Scheduled" />
      </View>
      <SectionTitle text="Listings awaiting your approval" />
      <View style={styles.cardStack}>
        <ListingReviewRow iconName="eco"   iconColor={A.orange} iconBg={A.orangeBg} title="Carrots — Grade 1, 80kg"    subtitle="Submitted by Farmer #TOHFA-F-00312" />
        <ListingReviewRow iconName="block" iconColor={A.muted}  iconBg="#F0F0F0"    title="Beetroot — your own listing" subtitle="Auto-routed to TOHFA Admin — conflict of interest" muted />
      </View>
      <SectionTitle text="Dispute mediation" />
      <View style={[styles.cardStack, { marginBottom: 20 }]}>
        <DisputeCard title="1 active dispute — pricing disagreement" subtitle="Between Farmer #TOHFA-F-00289 and Coonoor warehouse quality check." actionLabel="Mediate now" />
      </View>
      <SectionTitle text="Quick actions" />
      <View style={[styles.quickRow, { justifyContent: 'flex-start', gap: 12 }]}>
        <QuickBtn iconName="calendar_month" label={`Schedule\nVisit`} />
        <QuickBtn iconName="groups"         label="Community"         />
        <QuickBtn iconName="star"           label="Ratings"           />
      </View>
    </>
  );
}

function MainWhAdminDashboard() {
  const [selectedWh, setSelectedWh] = useState('Ooty');
  return (
    <>
      <Text style={[styles.sectionTitle, { color: A.orange, marginBottom: 10 }]}>All 4 warehouses</Text>
      <WarehouseChipRow selected={selectedWh} onSelect={setSelectedWh} />
      <SectionTitle text="Overview" />
      <View style={styles.statsGrid}>
        <StatCard iconName="swap_horiz" iconColor={A.orange} iconBg={A.orangeBg} value="5" label="Incoming Transfers" />
        <StatCard iconName="block"       iconColor={A.orange} iconBg={A.orangeBg} value="4" label="Low Stock Alerts"   />
      </View>
      <SectionTitle text="Staff attendance today" />
      <View style={styles.cardStack}>
        <StaffRow initials="KV" name="Kannan V." location="Ooty"     time="Checked in 8:02 AM" status="onduty" />
        <StaffRow initials="MR" name="Meena R."  location="Kotagiri" time="Not checked in"      status="absent" />
      </View>
      <SectionTitle text="Transfers pending action" />
      <View style={[styles.cardStack, { marginBottom: 20 }]}>
        <TransferRow from="Ooty" to="Kotagiri" detail="140kg mixed vegetables · Rebalancing low stock" />
      </View>
      <SectionTitle text="Quick actions" />
      <View style={[styles.quickRow, { justifyContent: 'flex-start', gap: 12 }]}>
        <QuickBtn iconName="swap_horiz"  label={`New\nTransfer`} />
        <QuickBtn iconName="description" label={`Stock\nLedger`} />
        <QuickBtn iconName="badge"       label="Attendance"      />
      </View>
    </>
  );
}

/** Screen 13 — Sub Warehouse Admin Dashboard */
function SubWhAdminDashboard() {
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

export interface SuperAdminDashboardScreenProps {
  onSignOut: () => void;
}

export function SuperAdminDashboardScreen({ onSignOut }: SuperAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [user, setUser]           = useState<UserMe | null>(null);
  const [roleCode, setRoleCode]   = useState<string>('SUPER_ADMIN');
  const [roleLabel, setRoleLabel] = useState('Admin');

  const isFarmerAdmin = roleCode === 'FARMER_ADMIN';
  const isSubWh       = roleCode === 'SUB_WH_ADMIN';
  const isMainWh      = roleCode === 'MAIN_WH_ADMIN';
  const accent        = isFarmerAdmin ? A.green : A.orange;
  const accentBg      = isFarmerAdmin ? A.greenBg : A.orangeBg;
  const roleIcon      = isFarmerAdmin ? 'eco' : (isMainWh || isSubWh) ? 'inventory_2' : 'shield';

  const greetKey = getGreetingKey();
  const greeting =
    isFarmerAdmin                     ? 'Vanakkam,'
    : greetKey === 'greeting.morning'   ? 'Good morning,'
    : greetKey === 'greeting.afternoon' ? 'Good afternoon,'
    : 'Good evening,';

  useEffect(() => {
    fetchMe()
      .then((me) => {
        setUser(me);
        const primary = getPrimaryAdminRole(me.roles);
        setRoleCode(primary);
        setRoleLabel(getAdminRoleLabel(me.roles));
      })
      .catch(() => {});
  }, []);

  const displayName = user?.fullName ?? 'Administrator';
  const tabs        = tabsForRole(roleCode);

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
          <View style={[styles.rolePill, { backgroundColor: accentBg }]}>
            <Icon name={roleIcon} size={12} color={accent} />
            <Text style={[styles.rolePillText, { color: accent }]}>{roleLabel}</Text>
          </View>
          {/* Sub WH Admin gets a second location badge */}
          {isSubWh ? (
            <View style={[styles.rolePill, { backgroundColor: A.blueBg, marginTop: 6 }]}>
              <Icon name="place" size={12} color={A.blue} />
              <Text style={[styles.rolePillText, { color: A.blue }]}>Coonoor Warehouse</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.avatarCircle, { backgroundColor: accentBg }]}>
          <Icon name="person" size={22} color={accent} />
        </View>
      </View>
    );
  }

  function DashboardContent() {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <PageHeader />
        {roleCode === 'SUPER_ADMIN'   ? <SuperAdminDashboard />   :
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

  function Placeholder({ label }: { label: string }) {
    return (
      <View style={styles.placeholder}>
        <Icon name="info" size={40} color={A.muted} />
        <Text style={styles.placeholderTitle}>{label}</Text>
        <Text style={styles.placeholderSub}>Manage this section on the Web Admin Portal.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={A.pageBg} />
      <View style={{ flex: 1 }}>
        {activeTab === 'Dashboard' ? <DashboardContent /> :
         activeTab === 'Profile'   ? <ProfileContent />  :
         <Placeholder label={activeTab} />}
      </View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = activeTab === tab.name;
          return (
            <Pressable
              key={tab.name}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Icon name={tab.icon} size={24} color={active ? accent : A.muted} />
              <Text style={[styles.tabLabel, active && { color: accent, fontWeight: '700' }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_RADIUS = 14;
const CARD_SHADOW = {
  shadowColor: A.shadow, shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
};

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: A.pageBg },
  scroll:    { flex: 1 },
  scrollPad: { paddingHorizontal: 20, paddingTop: 20 },

  pageHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  greetSmall:   { fontSize: 13, color: A.muted, marginBottom: 2 },
  greetName:    { fontSize: 24, fontWeight: '700', color: A.ink, marginBottom: 8, letterSpacing: -0.3 },
  rolePill:     { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  rolePillText: { fontSize: 12, fontWeight: '600' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionAction:{ fontSize: 13, fontWeight: '600' },

  statsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard:   { flex: 1, minWidth: '45%', backgroundColor: A.cardBg, borderRadius: CARD_RADIUS, padding: 14, ...CARD_SHADOW },
  statIconBox:{ width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue:  { fontSize: 22, fontWeight: '700', color: A.ink, marginBottom: 2, letterSpacing: -0.3 },
  statLabel:  { fontSize: 12, color: A.body, marginBottom: 5 },
  statDelta:  { fontSize: 11, fontWeight: '500' },

  cardStack: { gap: 10, marginBottom: 20 },

  approvalCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: A.cardBg, borderRadius: CARD_RADIUS, padding: 14, gap: 12, ...CARD_SHADOW },
  approvalIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  approvalTextCol: { flex: 1 },
  approvalTitle:   { fontSize: 14, fontWeight: '600', color: A.ink, marginBottom: 3 },
  approvalSub:     { fontSize: 12, color: A.body, lineHeight: 17 },
  badgeCircle:     { width: 26, height: 26, borderRadius: 13, backgroundColor: A.orange, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badgeText:       { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  alertCard: { backgroundColor: A.cardBg, borderRadius: CARD_RADIUS, padding: 14, borderLeftWidth: 3, borderLeftColor: A.orange, ...CARD_SHADOW },
  alertRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  alertTitle:{ flex: 1, fontSize: 13, fontWeight: '600', color: A.ink, lineHeight: 18 },
  alertSub:  { fontSize: 12, color: A.body, lineHeight: 17, marginBottom: 8, paddingLeft: 22 },
  alertLink: { fontSize: 12, fontWeight: '600', color: A.orange, paddingLeft: 22 },

  farmerAppRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: A.cardBg, borderRadius: CARD_RADIUS, padding: 14, gap: 12, ...CARD_SHADOW },
  farmerAppIcon:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  farmerAppText:   { flex: 1 },
  farmerAppName:   { fontSize: 14, fontWeight: '600', color: A.ink, marginBottom: 3 },
  farmerAppStatus: { fontSize: 12, color: A.body, lineHeight: 17 },

  infoCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: A.cardBg, borderRadius: CARD_RADIUS, padding: 14, borderLeftWidth: 3, ...CARD_SHADOW },
  infoIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoCardBold:{ fontSize: 13, fontWeight: '700', color: A.ink, marginBottom: 4, lineHeight: 18 },
  infoCardSub: { fontSize: 12, color: A.body, lineHeight: 17 },

  quickRow:    { flexDirection: 'row', gap: 10, marginBottom: 8 },
  quickBtn:    { flex: 1, alignItems: 'center', gap: 8 },
  quickIconBox:{ width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW },
  quickLabel:  { fontSize: 11, fontWeight: '600', color: A.ink, textAlign: 'center', lineHeight: 15 },

  chipScroll:          { paddingHorizontal: 0, gap: 10, paddingRight: 20 },
  warehouseChip:       { backgroundColor: A.cardBg, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5DFD8', paddingHorizontal: 14, paddingVertical: 10, minWidth: 100, ...CARD_SHADOW },
  warehouseChipActive: { borderColor: A.orange, backgroundColor: '#FFFAF8' },
  chipName:            { fontSize: 14, fontWeight: '600', color: A.muted, marginBottom: 2 },
  chipNameActive:      { color: A.orange },
  chipStock:           { fontSize: 11, color: A.body },

  staffRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: A.cardBg, borderRadius: CARD_RADIUS, padding: 14, gap: 12, ...CARD_SHADOW },
  initialsAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EDEAE6', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  initialsText:   { fontSize: 13, fontWeight: '700', color: A.body },
  staffText:      { flex: 1 },
  staffName:      { fontSize: 14, fontWeight: '600', color: A.ink, marginBottom: 2 },
  staffTime:      { fontSize: 12, color: A.muted },
  statusPill:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 12, fontWeight: '600' },

  transferRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: A.cardBg, borderRadius: CARD_RADIUS, padding: 14, gap: 12, ...CARD_SHADOW },
  transferIconBox:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  transferText:   { flex: 1 },
  transferRoute:  { fontSize: 14, fontWeight: '600', color: A.ink, marginBottom: 3 },
  transferDetail: { fontSize: 12, color: A.body, lineHeight: 17 },

  tabBar:       { flexDirection: 'row', height: 70, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: A.tabBorder, alignItems: 'center', justifyContent: 'space-around', elevation: 10, shadowColor: A.shadow, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  tabItem:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%' },
  tabLabel:     { fontSize: 10, fontWeight: '500', color: A.muted },

  profilePane:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, backgroundColor: A.pageBg },
  profileAvatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 16 },
  profileName:   { fontSize: 22, fontWeight: '700', color: A.ink, marginBottom: 8, textAlign: 'center' },
  profileMeta:   { fontSize: 14, color: A.body, marginBottom: 4 },
  signOutBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 32, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.danger },
  signOutText:   { fontSize: 15, fontWeight: '600', color: colors.danger },

  placeholder:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40, backgroundColor: A.pageBg },
  placeholderTitle: { fontSize: 20, fontWeight: '700', color: A.ink },
  placeholderSub:   { fontSize: 14, color: A.body, textAlign: 'center', lineHeight: 22 },
});
