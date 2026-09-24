import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { fetchMe, logout, type UserMe } from '../../../farmer/api/auth';
import { Icon } from '@tohfa/mobile-ui';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../../../farmer/theme';
import { getGreetingKey } from '../../../farmer/utils/greeting';
import { HomeIcon } from '../../../farmer/assets/icons/AssetIcons';

const awardIconAsset = require('../../assets/images/award.png');
const calendarIconAsset = require('../../assets/images/calendar.png');
const inboxIconAsset = require('../../assets/images/inbox.png');
const pinIconAsset = require('../../assets/images/pin.png');
const telephoneIconAsset = require('../../assets/images/telephone.png');
import {
  AdminPendingApplicationsScreen,
  type PendingApplicationItem,
  DEMO_PENDING_APPLICATIONS,
} from '../registration/AdminPendingApplicationsScreen';
import { AdminApplicationDetailScreen } from '../registration/AdminApplicationDetailScreen';
import {
  AdminAllFarmersScreen,
  type FarmerListItem,
  DEMO_ALL_FARMERS,
} from '../farmers/AdminAllFarmersScreen';
import { AdminFarmerDetailScreen } from '../farmers/AdminFarmerDetailScreen';
import { AdminFarmMapScreen } from '../farmers/AdminFarmMapScreen';
import { AdminKycReviewScreen } from '../certifications/AdminKycReviewScreen';
import { AdminCertVerificationScreen } from '../certifications/AdminCertVerificationScreen';
import { AdminRatingScorecardScreen } from '../farmers/AdminRatingScorecardScreen';
import { AdminComplianceTiersScreen } from '../certifications/AdminComplianceTiersScreen';
import { AdminApplicationApproveScreen } from '../registration/AdminApplicationApproveScreen';
import { AdminApplicationRejectScreen } from '../registration/AdminApplicationRejectScreen';
import { AdminApplicationRequestInfoScreen } from '../registration/AdminApplicationRequestInfoScreen';

// ─── Palette ──────────────────────────────────────────────────────────────────
const A = {
  orange:    '#F0562A',
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
  absentText:'#F0562A',
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
  text, action, onAction,
}: { text: string; action?: string | undefined; onAction?: (() => void) | undefined }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{text}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StatCard({
  iconName, iconColor, iconBg, value, label, delta, deltaColor, imageSource,
}: {
  iconName?: string; iconColor?: string; iconBg?: string;
  value: string; label: string; delta?: string; deltaColor?: string; imageSource?: any;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBox, { backgroundColor: iconBg }]}>
        {imageSource ? (
          <Image source={imageSource} style={{ width: 20, height: 20 }} resizeMode="contain" />
        ) : (
          <Icon name={iconName!} size={20} color={iconColor!} />
        )}
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

function AlertCard({ title, subtitle, linkLabel, imageSource }: {
  title: string; subtitle: string; linkLabel: string; imageSource?: any;
}) {
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
        <AlertCard imageSource={calendarIconAsset} title="7 farms overdue for quarterly audit" subtitle="Q3 audit window closes in 5 days across Coonoor and Kotagiri zones." linkLabel="Review audit calendar" />
        <AlertCard imageSource={awardIconAsset} title="12 certifications expiring within 30 days" subtitle="PGS Organic renewals needed before listings are auto-blocked." linkLabel="View farmers" />
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

function TohfaAdminDashboard({
  onSeeAllPending,
  onSelectPending,
}: {
  onSeeAllPending?: () => void;
  onSelectPending?: (item: PendingApplicationItem) => void;
}) {
  const firstApp = DEMO_PENDING_APPLICATIONS[0]!;
  const secondApp = DEMO_PENDING_APPLICATIONS[1]!;

  return (
    <>
      <SectionTitle text="Today’s operational snapshot" />
      <View style={styles.statsGrid}>
        {/* 1. Pending Applications */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#FFF1EE' }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19C15 16.7909 12.3137 15 9 15C5.68629 15 3 16.7909 3 19"
                stroke="#F0562A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <Path
                d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                stroke="#F0562A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <Path
                d="M18 8V14M15 11H21"
                stroke="#F0562A"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <Text style={styles.statValue}>9</Text>
          <Text style={styles.statLabel}>Pending Applications</Text>
        </View>

        {/* 2. Listings to Approve */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#EBF3FC' }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L3 7L12 12L21 7L12 2Z"
                stroke="#1E65B8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M3 7V17L12 22V12"
                stroke="#1E65B8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M21 7V17L12 22"
                stroke="#1E65B8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={styles.statValue}>23</Text>
          <Text style={styles.statLabel}>Listings to Approve</Text>
        </View>

        {/* 3. Audits This Quarter */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#FEF5E7' }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 12L11 14L15 9"
                stroke="#B25E00"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M19 7V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V7C5 5.9 5.9 5 7 5H17C18.1 5 19 5.9 19 7Z"
                stroke="#B25E00"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={styles.statValue}>6</Text>
          <Text style={styles.statLabel}>Audits This Quarter</Text>
        </View>

        {/* 4. Open Support Tickets */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#F0ECFC' }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2Z"
                stroke="#5E35B1"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M19 10V11C19 14.87 15.87 18 12 18C8.13 18 5 14.87 5 11V10"
                stroke="#5E35B1"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <Path
                d="M12 18V22M8 22H16"
                stroke="#5E35B1"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <Text style={styles.statValue}>14</Text>
          <Text style={styles.statLabel}>Open Support Tickets</Text>
        </View>
      </View>

      <SectionTitle
        text="Pending farmer applications"
        action="See all"
        onAction={onSeeAllPending}
      />
      <View style={styles.cardStack}>
        <FarmerAppRow
          name="Muthukumar S."
          location="Kotagiri"
          status="Applied 2 days ago · Documents complete"
          onPress={() => onSelectPending?.(firstApp)}
        />
        <FarmerAppRow
          name="Lakshmi R."
          location="Ooty"
          status="Applied 4 days ago · Awaiting KYC review"
          onPress={() => onSelectPending?.(secondApp)}
        />
      </View>

      <SectionTitle text="Sales channel snapshot" />
      <View style={[styles.cardStack, { marginBottom: 20 }]}>
        <View style={styles.salesSnapshotCard}>
          <View style={styles.salesSnapshotLeftBar} />
          <View style={styles.salesSnapshotContent}>
            <View style={styles.salesSnapshotHeaderRow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ marginRight: 10 }}>
                <Rect x="3" y="5" width="18" height="14" rx="2" stroke="#0E4473" strokeWidth="2" />
                <Path d="M3 12H21" stroke="#0E4473" strokeWidth="2" />
              </Svg>
              <Text style={styles.salesSnapshotBold}>
                Online 70% · Market 10% · Horeca/B2B 20%
              </Text>
            </View>
            <Text style={styles.salesSnapshotSub}>
              Current channel split is within the locked 70/10/10/10 allocation policy.
            </Text>
          </View>
        </View>
      </View>

      <SectionTitle text="Quick actions" />
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2L3 7L12 12L21 7L12 2Z"
              stroke="#F0562A"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M3 7V17L12 22V12"
              stroke="#F0562A"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M21 7V17L12 22"
              stroke="#F0562A"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.quickActionLabel}>{`Approve\nListings`}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 4H5C3.89 4 3 4.89 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.89 20.1 4 19 4Z"
              stroke="#F0562A"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M16 2V6M8 2V6M3 10H21"
              stroke="#F0562A"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </Svg>
          <Text style={styles.quickActionLabel}>{`Schedule\nAudit`}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2Z"
              stroke="#F0562A"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M19 10V11C19 14.87 15.87 18 12 18C8.13 18 5 14.87 5 11V10"
              stroke="#F0562A"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <Path
              d="M12 18V22M8 22H16"
              stroke="#F0562A"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </Svg>
          <Text style={styles.quickActionLabel}>Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 20V10M12 20V4M6 20V14"
              stroke="#F0562A"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <Path
              d="M3 20H21"
              stroke="#F0562A"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </Svg>
          <Text style={styles.quickActionLabel}>Reports</Text>
        </TouchableOpacity>
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
    isFarmerAdmin                                  ? 'Vanakkam,'
    : greetKey === 'farmer.dashboard.greeting.morning'   ? 'Good morning,'
    : greetKey === 'farmer.dashboard.greeting.afternoon' ? 'Good afternoon,'
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

  const displayName = user?.fullName || 'Ganga Devi';
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
              <SuperAdminDashboard />
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
        ) : activeTab === 'Farmers' ? (
          <AdminAllFarmersScreen
            onSelectFarmer={(farmer: FarmerListItem) => {
              setSelectedFarmer(farmer);
              setFarmerDetailTab('Overview');
              setCurrentView('FARMER_DETAIL');
            }}
          />
        ) : activeTab === 'Profile' ? (
          <ProfileContent />
        ) : (
          <Placeholder label={activeTab} />
        )}
      </View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = activeTab === tab.name;
          const color = active ? '#F0562A' : '#4A443F';
          return (
            <Pressable
              key={tab.name}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab.name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              {tab.name === 'Dashboard' ? (
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="3" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="2" />
                  <Rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="2" />
                  <Rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="2" />
                  <Rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={color} strokeWidth="2" />
                </Svg>
              ) : tab.name === 'Farmers' ? (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15C10.9391 15 9.92172 15.4214 9.17157 16.1716C8.42143 16.9217 8 17.9391 8 19V21"
                    stroke={color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z"
                    stroke={color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : tab.name === 'Sales' ? (
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.8" />
                  <Path d="M3 11H21" stroke={color} strokeWidth="1.8" />
                </Svg>
              ) : tab.name === 'Reports' ? (
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 20V10M12 20V4M6 20V14"
                    stroke={color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M3 20H21"
                    stroke={color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </Svg>
              ) : (
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19 20C19 16.6863 15.866 14 12 14C8.13401 14 5 16.6863 5 20"
                    stroke={color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M12 11C13.933 11 15.5 9.433 15.5 7.5C15.5 5.567 13.933 4 12 4C10.067 4 8.5 5.567 8.5 7.5C8.5 9.433 10.067 11 12 11Z"
                    stroke={color}
                    strokeWidth="1.8"
                  />
                </Svg>
              )}
              <Text style={[styles.tabLabel, active && { color: '#F0562A', fontWeight: '700' }]}>
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
  greetSmall:   { fontSize: 13, color: '#78736E', marginBottom: 2 },
  greetName:    { fontSize: 24, fontWeight: '800', color: '#1A1412', marginBottom: 8, letterSpacing: -0.3 },
  rolePill:     { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#FFF2EE', borderWidth: 1, borderColor: '#F5DDD6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  rolePillText: { fontSize: 12, fontWeight: '700', color: '#662208' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerAvatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF1EE', alignItems: 'center', justifyContent: 'center' },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#662208' },
  sectionAction:{ fontSize: 13, fontWeight: '700', color: '#F0562A' },

  statsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard:   { flex: 1, minWidth: '47%', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0ECE4', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  statIconBox:{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  statValue:  { fontSize: 26, fontWeight: '800', color: '#1A1412', marginBottom: 4, letterSpacing: -0.5 },
  statLabel:  { fontSize: 13, fontWeight: '500', color: '#6B6560' },
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

  farmerAppRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0ECE4', padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  farmerAppIcon:   { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF1EE', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  farmerAppText:   { flex: 1 },
  farmerAppName:   { fontSize: 15, fontWeight: '700', color: '#1A1412', marginBottom: 3 },
  farmerAppStatus: { fontSize: 13, color: '#78736E', lineHeight: 18 },

  salesSnapshotCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0ECE4', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  salesSnapshotLeftBar: { width: 5, backgroundColor: '#0E4473' },
  salesSnapshotContent: { flex: 1, padding: 16 },
  salesSnapshotHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  salesSnapshotBold: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1412' },
  salesSnapshotSub: { fontSize: 13, color: '#78736E', lineHeight: 18 },

  infoCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: A.cardBg, borderRadius: CARD_RADIUS, padding: 14, borderLeftWidth: 3, ...CARD_SHADOW },
  infoIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoCardBold:{ fontSize: 13, fontWeight: '700', color: A.ink, marginBottom: 4, lineHeight: 18 },
  infoCardSub: { fontSize: 12, color: A.body, lineHeight: 17 },

  quickRow:    { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickActionCard: { flex: 1, height: 105, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0ECE4', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 4, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  quickActionLabel: { fontSize: 12, fontWeight: '700', color: '#1A1412', textAlign: 'center', lineHeight: 16 },
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
