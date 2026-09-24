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

// ─── Design Tokens (Matching Screen 13 Mockup) ────────────────────────────────
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
  redText:       '#C93B27',
  tabInactive:   '#7D7571',
  tabBorder:     '#EDE8E0',
};

type SubWHTab = 'Dashboard' | 'Receiving' | 'Pickups' | 'Profile';

// ─── SVG Icons Matching Screen 13 ─────────────────────────────────────────────
function SubWarehouseBadgeIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        stroke={PALETTE.peachText}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V12h6v10" stroke={PALETTE.peachText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LocationPinIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a8 8 0 00-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 00-8-8z"
        stroke={PALETTE.blueText}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={PALETTE.blueText} strokeWidth="2.2" />
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

function TruckReceivingIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={PALETTE.orange} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={PALETTE.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={PALETTE.orange} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={PALETTE.orange} strokeWidth="2" />
    </Svg>
  );
}

function QrPickupsIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={PALETTE.blueText} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={PALETTE.blueText} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={PALETTE.blueText} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={PALETTE.blueText} strokeWidth="2" />
    </Svg>
  );
}

function CashCardIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={PALETTE.greenText} strokeWidth="2" />
      <Path d="M2 10h20" stroke={PALETTE.greenText} strokeWidth="2" />
      <Path d="M6 15h4" stroke={PALETTE.greenText} strokeWidth="2" strokeLinecap="round" />
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

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.orange : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PickupsTabIcon({ active }: { active: boolean }) {
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

export interface SubWarehouseAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string) => void;
}

export function SubWarehouseAdminDashboardScreen({
  onSignOut,
  onNavigate,
}: SubWarehouseAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<SubWHTab>('Dashboard');
  const [user, setUser] = useState<UserMe | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {});
  }, []);

  const displayName = user?.fullName ?? 'Deepa Suresh';

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
            {/* Header Greeting (Matching Screen 13) */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greetSmall}>Good morning,</Text>
                <Text style={styles.greetName}>{displayName}</Text>
                
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  <View style={styles.rolePill}>
                    <SubWarehouseBadgeIcon />
                    <Text style={styles.rolePillText}>Sub Warehouse Admin</Text>
                  </View>
                  <View style={styles.locationPill}>
                    <LocationPinIcon />
                    <Text style={styles.locationPillText}>Coonoor Warehouse</Text>
                  </View>
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

            {/* Section 1: Today at Coonoor */}
            <Text style={styles.sectionTitle}>Today at Coonoor</Text>
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => setActiveTab('Receiving')}
                activeOpacity={0.75}
              >
                <View style={styles.statIconBox}>
                  <TruckReceivingIcon />
                </View>
                <Text style={styles.statNumber}>6</Text>
                <Text style={styles.statLabel}>Receiving Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => setActiveTab('Pickups')}
                activeOpacity={0.75}
              >
                <View style={styles.statIconBox}>
                  <QrPickupsIcon />
                </View>
                <Text style={styles.statNumber}>14</Text>
                <Text style={styles.statLabel}>Pickups Ready</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => Alert.alert('Cash Top-Ups', '3 Farmer cash top-ups awaiting physical cash verification.')}
                activeOpacity={0.75}
              >
                <View style={styles.statIconBox}>
                  <CashCardIcon />
                </View>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Cash Top-Ups Pending</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => Alert.alert('Low Stock Items', 'Table Beetroot & Nilgiris Garlic below minimum reorder buffer.')}
                activeOpacity={0.75}
              >
                <View style={styles.statIconBox}>
                  <LowStockAlertIcon />
                </View>
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>Low Stock Items</Text>
              </TouchableOpacity>
            </View>

            {/* Section 2: Pickup queue – verify OTP */}
            <Text style={styles.sectionTitle}>Pickup queue – verify OTP</Text>
            <TouchableOpacity
              style={styles.queueItemCard}
              onPress={() => Alert.alert('Customer Pickup Verification', 'Order #ORD-20260910-0091. Enter 6-digit OTP from customer upon package handover.')}
              activeOpacity={0.75}
            >
              <View style={styles.queueItemIconBox}>
                <QrPickupsIcon />
              </View>
              <View style={{ flex: 1, paddingRight: 6 }}>
                <Text style={styles.queueItemTitle}>Order #ORD-20260910-0091</Text>
                <Text style={styles.queueItemSub}>Customer arriving — OTP not yet verified</Text>
              </View>
              <ChevronRight />
            </TouchableOpacity>

            {/* Section 3: Cash top-up requests */}
            <Text style={styles.sectionTitle}>Cash top-up requests</Text>
            <TouchableOpacity
              style={styles.queueItemCard}
              onPress={() => Alert.alert('Confirm Cash Handover', 'Accept ₹2,000 cash from Divya Ramesh and credit farmer wallet?')}
              activeOpacity={0.75}
            >
              <View style={styles.cashIconBox}>
                <CashCardIcon />
              </View>
              <View style={{ flex: 1, paddingRight: 6 }}>
                <Text style={styles.queueItemTitle}>₹2,000 – Divya Ramesh</Text>
                <Text style={styles.queueItemSub}>Awaiting cash handover confirmation</Text>
              </View>
              <ChevronRight />
            </TouchableOpacity>

            {/* Section 4: Quick actions */}
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <View style={styles.quickRow}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => setActiveTab('Receiving')}
                activeOpacity={0.75}
              >
                <TruckReceivingIcon />
                <Text style={styles.quickBtnLabel}>Receive Goods</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => Alert.alert('Quality Check', 'Moisture meter & produce grading inspection station.')}
                activeOpacity={0.75}
              >
                <QrPickupsIcon />
                <Text style={styles.quickBtnLabel}>Quality Check</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => Alert.alert('Coonoor Stock', 'Current Coonoor Hub Stock: 156 MT / 200 MT (78% capacity).')}
                activeOpacity={0.75}
              >
                <SubWarehouseBadgeIcon />
                <Text style={styles.quickBtnLabel}>My Stock</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 28 }} />
          </ScrollView>
        )}

        {/* Receiving Tab */}
        {activeTab === 'Receiving' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Coonoor Inward Receiving (6)</Text>
            <Text style={styles.subHint}>Incoming farmer lots & weighbridge intake</Text>
            
            <View style={[styles.cardStack, { marginTop: 14 }]}>
              <View style={styles.queueItemCard}>
                <View style={styles.queueItemIconBox}><TruckReceivingIcon /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueItemTitle}>Ramasamy S. • Nilgiris Tea</Text>
                  <Text style={styles.queueItemSub}>2,400 kg • Grade A • Lot #LOT-COON-081</Text>
                </View>
              </View>
              <View style={styles.queueItemCard}>
                <View style={styles.queueItemIconBox}><TruckReceivingIcon /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueItemTitle}>M. Senthil • Hill Carrots</Text>
                  <Text style={styles.queueItemSub}>1,800 kg • Grade A • Lot #LOT-COON-082</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Pickups Tab */}
        {activeTab === 'Pickups' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Customer & B2B Pickups (14)</Text>
            <Text style={styles.subHint}>Verify order OTP before handing over produce crates</Text>

            <View style={[styles.cardStack, { marginTop: 14 }]}>
              <TouchableOpacity
                style={styles.queueItemCard}
                onPress={() => Alert.alert('Verify OTP', 'Order #ORD-20260910-0091')}
              >
                <View style={styles.queueItemIconBox}><QrPickupsIcon /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueItemTitle}>Order #ORD-20260910-0091</Text>
                  <Text style={styles.queueItemSub}>2 Crates Nilgiris Tea & Carrots</Text>
                </View>
                <ChevronRight />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Profile Tab */}
        {activeTab === 'Profile' && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <View style={styles.profileBox}>
              <View style={styles.bigAvatar}><PersonAvatarIcon /></View>
              <Text style={styles.profName}>{displayName}</Text>
              <Text style={styles.profRole}>Sub Warehouse Admin • WH-COON (Coonoor Hub)</Text>
              <Text style={styles.profEmail}>{user?.email ?? 'subwarehouseadmin@tohfa.test'}</Text>
            </View>

            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={async () => {
                await logout();
                onSignOut();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.signOutText}>Sign Out of Sub Warehouse Admin</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* ─── Bottom Navigation Tab Bar (Matching Screen 13) ─── */}
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
          onPress={() => setActiveTab('Receiving')}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={activeTab === 'Receiving'} />
          <Text style={[styles.tabLabel, activeTab === 'Receiving' && styles.tabLabelActive]}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('Pickups')}
          accessibilityRole="tab"
        >
          <PickupsTabIcon active={activeTab === 'Pickups'} />
          <Text style={[styles.tabLabel, activeTab === 'Pickups' && styles.tabLabelActive]}>Pickups</Text>
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
    marginBottom: 4,
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
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.blueIconBg,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
  },
  locationPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.blueText,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  statIconBox: {
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  cardStack: {
    gap: 10,
  },
  queueItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 10,
  },
  queueItemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.blueIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cashIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.peachIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  queueItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  queueItemSub: {
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
