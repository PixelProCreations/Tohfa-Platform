import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { colors } from '../../../farmer/theme';
import { AdminProfileScreen } from './AdminProfileScreen';

// ─── Design Tokens (Matching Screen 12 Mockup) ────────────────────────────────
const PALETTE = {
  titleRust:     '#7E2E11',
  orange:        '#E85226',
  pageBg:        '#FAF8F5',
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#7D7571',
  border:        '#EDE8E0',
  peachBadge:    '#FDEEE9',
  peachText:     '#943818',
  peachIconBg:   '#FDEEE9',
  blueIconBg:    '#EBF3FA',
  blueText:      '#2563EB',
  greenBadge:    '#EAF5EA',
  greenText:     '#0D8253',
  redBadge:      '#FDEEE9',
  redText:       '#C93B27',
  tabInactive:   '#7D7571',
  tabBorder:     '#EDE8E0',
};

type MainWHTab = 'Dashboard' | 'Warehouses' | 'Allocation' | 'Profile';

// ─── SVG Icons Matching Screen 12 ─────────────────────────────────────────────
function WarehouseBadgeIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={PALETTE.peachText}
        strokeWidth="2"
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

function TruckTransferIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={PALETTE.orange} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={PALETTE.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={PALETTE.orange} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={PALETTE.orange} strokeWidth="2" />
    </Svg>
  );
}

function LowStockAlertIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={PALETTE.redText} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={PALETTE.redText} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#9A928D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DashboardTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function WarehousesTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AllocationTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ProfileTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface MainWarehouseAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string) => void;
}

export function MainWarehouseAdminDashboardScreen({
  onSignOut,
  onNavigate,
}: MainWarehouseAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<MainWHTab>('Dashboard');
  const [selectedWH, setSelectedWH] = useState('Ooty');
  const [user, setUser] = useState<UserMe | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {});
  }, []);

  const displayName = user?.fullName ?? 'Prakash Babu';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <View style={{ flex: 1 }}>
        {activeTab === 'Dashboard' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Greeting (Matching Screen 12) */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greetSmall}>Good morning,</Text>
                <Text style={styles.greetName}>{displayName}</Text>
                <View style={styles.rolePill}>
                  <WarehouseBadgeIcon />
                  <Text style={styles.rolePillText}>Main Warehouse Admin</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => setActiveTab('Profile')}
                activeOpacity={0.8}
              >
                <PersonAvatarIcon />
              </TouchableOpacity>
            </View>

            {/* Section 1: All 4 warehouses */}
            <Text style={styles.sectionTitle}>All 4 warehouses</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.whScroll}>
              <TouchableOpacity
                style={[styles.whChipCard, selectedWH === 'Ooty' && styles.whChipActive]}
                onPress={() => setSelectedWH('Ooty')}
                activeOpacity={0.8}
              >
                <Text style={styles.whChipTitle}>Ooty</Text>
                <Text style={styles.whChipStock}>Stock: <Text style={{ fontWeight: '800' }}>92%</Text></Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.whChipCard, selectedWH === 'Coonoor' && styles.whChipActive]}
                onPress={() => setSelectedWH('Coonoor')}
                activeOpacity={0.8}
              >
                <Text style={styles.whChipTitle}>Coonoor</Text>
                <Text style={styles.whChipStock}>Stock: <Text style={{ fontWeight: '800' }}>78%</Text></Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.whChipCard, selectedWH === 'Kotagiri' && styles.whChipActive]}
                onPress={() => setSelectedWH('Kotagiri')}
                activeOpacity={0.8}
              >
                <Text style={styles.whChipTitle}>Kotagiri</Text>
                <Text style={[styles.whChipStock, { color: PALETTE.redText }]}>Stock: 31% – Low</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.whChipCard, selectedWH === 'Gudalur' && styles.whChipActive]}
                onPress={() => setSelectedWH('Gudalur')}
                activeOpacity={0.8}
              >
                <Text style={styles.whChipTitle}>Gudalur</Text>
                <Text style={styles.whChipStock}>Stock: <Text style={{ fontWeight: '800' }}>65%</Text></Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Section 2: Overview */}
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.queueGrid}>
              <TouchableOpacity
                style={styles.overviewCard}
                onPress={() => Alert.alert('Incoming Transfers', '5 Inter-warehouse transfers currently in transit to Ooty Central Hub.')}
                activeOpacity={0.75}
              >
                <View style={styles.overviewIconBox}>
                  <TruckTransferIcon />
                </View>
                <Text style={styles.overviewNumber}>5</Text>
                <Text style={styles.overviewLabel}>Incoming Transfers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.overviewCard}
                onPress={() => Alert.alert('Low Stock Alerts', 'Kotagiri (Carrots, Garlic) & Coonoor (Beetroot) need stock rebalancing.')}
                activeOpacity={0.75}
              >
                <View style={styles.overviewIconBox}>
                  <LowStockAlertIcon />
                </View>
                <Text style={styles.overviewNumber}>4</Text>
                <Text style={styles.overviewLabel}>Low Stock Alerts</Text>
              </TouchableOpacity>
            </View>

            {/* Section 3: Staff attendance today */}
            <Text style={styles.sectionTitle}>Staff attendance today</Text>
            <View style={styles.cardStack}>
              {/* Staff 1 */}
              <View style={styles.staffCard}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffInitials}>KV</Text>
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.staffName}>Kannan V. — Ooty</Text>
                  <Text style={styles.staffSub}>Checked in 8:02 AM</Text>
                </View>
                <View style={styles.dutyPill}>
                  <Text style={styles.dutyPillText}>On duty</Text>
                </View>
              </View>

              {/* Staff 2 */}
              <View style={styles.staffCard}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffInitials}>MR</Text>
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.staffName}>Meena R. — Kotagiri</Text>
                  <Text style={styles.staffSub}>Not checked in</Text>
                </View>
                <View style={styles.absentPill}>
                  <Text style={styles.absentPillText}>Absent</Text>
                </View>
              </View>
            </View>

            {/* Section 4: Transfers pending action */}
            <Text style={styles.sectionTitle}>Transfers pending action</Text>
            <TouchableOpacity
              style={styles.transferCard}
              onPress={() => Alert.alert('Stock Transfer Manifest', 'Ooty → Kotagiri: 140kg mixed vegetables. Manifest #TRN-2026-042.')}
              activeOpacity={0.75}
            >
              <View style={styles.transferIconBox}>
                <TruckTransferIcon />
              </View>
              <View style={{ flex: 1, paddingRight: 6 }}>
                <Text style={styles.transferTitle}>Ooty → Kotagiri</Text>
                <Text style={styles.transferSub}>140kg mixed vegetables · Rebalancing low stock</Text>
              </View>
              <ChevronRight />
            </TouchableOpacity>

            {/* Section 5: Quick actions */}
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <View style={styles.quickRow}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => Alert.alert('Goods Receipt', 'Opening Inward Goods Receipt (GRN) weighbridge intake screen.')}
                activeOpacity={0.75}
              >
                <TruckTransferIcon />
                <Text style={styles.quickBtnLabel}>Receive Goods</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => setActiveTab('Allocation')}
                activeOpacity={0.75}
              >
                <AllocationTabIcon active={false} />
                <Text style={styles.quickBtnLabel}>Stock Ledger</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => Alert.alert('Cold Room Status', 'Chamber A: 2.4°C, Chamber B: 4.1°C, Humidity: 90% RH.')}
                activeOpacity={0.75}
              >
                <WarehouseBadgeIcon />
                <Text style={styles.quickBtnLabel}>Cold Storage</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 28 }} />
          </ScrollView>
        )}

        {/* Warehouses Tab */}
        {activeTab === 'Warehouses' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Nilgiris 4-Warehouse Network</Text>
            <View style={[styles.cardStack, { marginTop: 14 }]}>
              <View style={styles.whDetailCard}>
                <Text style={styles.whDetailTitle}>WH-MAIN • Ooty Central Hub</Text>
                <Text style={styles.whDetailSub}>Capacity: 500 MT • Utilization: 92% (460 MT)</Text>
              </View>
              <View style={styles.whDetailCard}>
                <Text style={styles.whDetailTitle}>WH-COON • Coonoor Sub-Hub</Text>
                <Text style={styles.whDetailSub}>Capacity: 200 MT • Utilization: 78% (156 MT)</Text>
              </View>
              <View style={styles.whDetailCard}>
                <Text style={styles.whDetailTitle}>WH-KOTA • Kotagiri Sub-Hub</Text>
                <Text style={styles.whDetailSub}>Capacity: 200 MT • Utilization: 31% (62 MT)</Text>
              </View>
              <View style={styles.whDetailCard}>
                <Text style={styles.whDetailTitle}>WH-GUDL • Gudalur Sub-Hub</Text>
                <Text style={styles.whDetailSub}>Capacity: 200 MT • Utilization: 65% (130 MT)</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Allocation Tab */}
        {activeTab === 'Allocation' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Stock Allocations & Dispatches</Text>
            <Text style={styles.subHint}>Inter-warehouse transit and wholesale delivery pipelines</Text>
            <View style={[styles.cardStack, { marginTop: 14 }]}>
              <View style={styles.whDetailCard}>
                <Text style={styles.whDetailTitle}>Bangalore Wholesale Direct</Text>
                <Text style={styles.whDetailSub}>5.2 MT loaded • Truck TN-43-E-8821</Text>
              </View>
              <View style={styles.whDetailCard}>
                <Text style={styles.whDetailTitle}>Chennai Cold Chain Express</Text>
                <Text style={styles.whDetailSub}>6.0 MT loaded • Truck TN-43-B-4412</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Profile Tab */}
        {activeTab === 'Profile' && (
          <AdminProfileScreen
            role="MAIN_WH_ADMIN"
            onSignOut={onSignOut}
            onBack={() => setActiveTab('Dashboard')}
          />
        )}
      </View>

      {/* ─── Bottom Navigation Tab Bar (Matching Screen 12) ─── */}
      <View style={styles.tabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Dashboard')}
          accessibilityRole="tab"
        >
          <DashboardTabIcon active={activeTab === 'Dashboard'} />
          <Text style={[styles.tabLabel, activeTab === 'Dashboard' && styles.tabLabelActive]}>Dashboard</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Warehouses')}
          accessibilityRole="tab"
        >
          <WarehousesTabIcon active={activeTab === 'Warehouses'} />
          <Text style={[styles.tabLabel, activeTab === 'Warehouses' && styles.tabLabelActive]}>Warehouses</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Allocation')}
          accessibilityRole="tab"
        >
          <AllocationTabIcon active={activeTab === 'Allocation'} />
          <Text style={[styles.tabLabel, activeTab === 'Allocation' && styles.tabLabelActive]}>Allocation</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Profile')}
          accessibilityRole="tab"
        >
          <ProfileTabIcon active={activeTab === 'Profile'} />
          <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.tabLabelActive]}>Profile</Text>
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
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetSmall: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    marginBottom: 2,
  },
  greetName: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.peachBadge,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
  },
  rolePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.peachText,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.titleRust,
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  subHint: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: -6,
    marginBottom: 8,
  },
  whScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  whChipCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginRight: 10,
    minWidth: 105,
  },
  whChipActive: {
    backgroundColor: '#FCF5EF',
    borderColor: PALETTE.orange,
    borderWidth: 1.5,
  },
  whChipTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  whChipStock: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    marginTop: 3,
  },
  queueGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  overviewIconBox: {
    marginBottom: 10,
  },
  overviewNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.5,
  },
  overviewLabel: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  cardStack: {
    gap: 10,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  staffAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3EFE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  staffInitials: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  staffName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  staffSub: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },
  dutyPill: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dutyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  absentPill: {
    backgroundColor: PALETTE.redBadge,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  absentPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.redText,
  },
  transferCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  transferIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PALETTE.peachIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transferTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  transferSub: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: 6,
  },
  quickBtnLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  whDetailCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  whDetailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  whDetailSub: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: 3,
  },
  profileBox: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
  },
  bigAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PALETTE.peachIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profName: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  profRole: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  profEmail: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.titleRust,
    marginTop: 3,
  },
  signOutBtn: {
    backgroundColor: '#FDEEE9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8D8CE',
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#943818',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 9,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  tabLabelActive: {
    color: PALETTE.orange,
    fontWeight: '800',
  },
});
