import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Existing Orange Palette) ─────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  tabActiveBg:   '#E85226',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#7A726C',
  textMuted:     '#9CA3AF',
  textBody:      '#374151',
  border:        '#F0ECE3',
  divider:       '#F0ECE3',
  greenBadge:    '#E6F5ED',
  greenText:     '#1E8E5A',
  actionIconCol: '#F0562A',
  avatarBg:      '#FFF0EB',
  avatarText:    '#F0562A',
  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

// ─── Pure SVG Icons (No Rect or Circle to avoid Hermes runtime errors) ───────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CartPlusIcon({ size = 22, color = PALETTE.actionIconCol }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM20 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6M12 9v6M9 12h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CashBanknoteIcon({ size = 22, color = PALETTE.actionIconCol }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 8h.01M18 16h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertExclamationIcon({ size = 22, color = PALETTE.actionIconCol }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM19 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM5 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM19 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM5 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM19 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
        fill={color}
      />
    </Svg>
  );
}

export interface SubWarehouseCustomerDetailsScreenProps {
  customer?: {
    id?: string;
    name?: string;
    code?: string;
    phone?: string;
    email?: string;
    status?: string;
    ordersCount?: number;
    totalPurchases?: string;
    walletBalance?: string;
    openIssues?: number;
    completedOrders?: number;
    cancelledOrders?: number;
    lastPurchase?: string;
    regDate?: string;
  };
  onBack: () => void;
  onTabChange?: (tab: SubWHTab) => void;
  onNavigateToOrders?: () => void;
  onNavigateToPurchases?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToIssues?: () => void;
  onNavigateToSupport?: () => void;
  onNavigateToNewSale?: () => void;
  onNavigateToCashTopUp?: () => void;
  onOpenCustomerActions?: (() => void) | undefined;
}

const DETAIL_TABS = ['Overview', 'Orders', 'Purchases', 'Wallet', 'Issues', 'Support'];

export function SubWarehouseCustomerDetailsScreen({
  customer,
  onBack,
  onTabChange,
  onNavigateToOrders,
  onNavigateToPurchases,
  onNavigateToWallet,
  onNavigateToIssues,
  onNavigateToSupport,
  onNavigateToNewSale,
  onNavigateToCashTopUp,
  onOpenCustomerActions,
}: SubWarehouseCustomerDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState('Overview');

  const customerName = customer?.name || 'Rajesh Kumar';
  const customerCode = customer?.code || customer?.id || 'CUS-00291';
  const customerPhone = customer?.phone || '+91 XXXXX XXXXX';
  const customerEmail = customer?.email || 'customer@example.com';
  const customerStatus = customer?.status || 'Active';
  const regDate = customer?.regDate || '12 Jan 2026';
  const ordersCount = customer?.ordersCount ?? 12;
  const purchasesVal = customer?.totalPurchases || '₹8,450';
  const walletVal = customer?.walletBalance || '₹1,250';
  const issuesVal = customer?.openIssues ?? 2;
  const completedVal = customer?.completedOrders ?? 10;
  const cancelledVal = customer?.cancelledOrders ?? 1;
  const lastPurchaseDate = customer?.lastPurchase || '24 Sep 2026';

  // Compute initials
  const initials = customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleTabPress = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === 'Orders' && onNavigateToOrders) {
      onNavigateToOrders();
    } else if (tabName === 'Purchases' && onNavigateToPurchases) {
      onNavigateToPurchases();
    } else if (tabName === 'Wallet' && onNavigateToWallet) {
      onNavigateToWallet();
    } else if (tabName === 'Issues' && onNavigateToIssues) {
      onNavigateToIssues();
    } else if (tabName === 'Support' && onNavigateToSupport) {
      onNavigateToSupport();
    }
  };

  const handleBottomTabPress = (tab: SubWHTab) => {
    if (tab === 'More') {
      onBack();
      return;
    }
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home') {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner (Orange Theme with Back Arrow & 3-dot options) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Details</Text>

          <TouchableOpacity
            style={styles.moreButton}
            onPress={onOpenCustomerActions || (() => Alert.alert('Customer Actions', `Options for ${customerName}`))}
            activeOpacity={0.8}
            accessibilityLabel="Customer Actions"
          >
            <View style={styles.dotsWrap}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scrollable Sections ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Profile Hero Card ─── */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials || 'RK'}</Text>
          </View>
          <Text style={styles.profileName}>{customerName}</Text>
          <Text style={styles.profileSub}>
            {customerCode} · {customerPhone}
          </Text>
          <Text style={styles.profileEmail}>{customerEmail}</Text>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>{customerStatus}</Text>
          </View>
        </View>

        {/* ─── 2. Four Statistic Cards (2×2 Grid) ─── */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statTile}
              onPress={onNavigateToOrders}
              activeOpacity={0.8}
            >
              <Text style={styles.statTileNum}>{ordersCount}</Text>
              <Text style={styles.statTileLabel}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statTile}
              onPress={onNavigateToPurchases}
              activeOpacity={0.8}
            >
              <Text style={styles.statTileNum}>{purchasesVal}</Text>
              <Text style={styles.statTileLabel}>Purchases</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statTile}
              onPress={onNavigateToWallet}
              activeOpacity={0.8}
            >
              <Text style={styles.statTileNum}>{walletVal}</Text>
              <Text style={styles.statTileLabel}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statTile}
              onPress={onNavigateToIssues}
              activeOpacity={0.8}
            >
              <Text style={styles.statTileNum}>{issuesVal}</Text>
              <Text style={styles.statTileLabel}>Issues</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── 3. Horizontal Scrollable Tabs ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {DETAIL_TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabChip,
                  isSelected ? styles.tabChipActive : styles.tabChipInactive,
                ]}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    isSelected ? styles.tabChipTextActive : styles.tabChipTextInactive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── 4. Basic Information Card ─── */}
        <Text style={styles.sectionHeading}>Basic Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Customer Name</Text>
              <Text style={styles.infoValBold}>{customerName}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Customer ID</Text>
              <Text style={styles.infoValBold}>{customerCode}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: 14 }]}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Mobile</Text>
              <Text style={styles.infoValBold}>{customerPhone}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValBold}>{customerEmail}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: 14 }]}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <Text style={styles.infoValBold}>{customerStatus}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Registration Date</Text>
              <Text style={styles.infoValBold}>{regDate}</Text>
            </View>
          </View>
        </View>

        {/* ─── 5. Activity Summary Card ─── */}
        <Text style={styles.sectionHeading}>Activity Summary</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Total Orders</Text>
              <Text style={styles.infoValBold}>{ordersCount}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Completed</Text>
              <Text style={styles.infoValBold}>{completedVal}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: 14 }]}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Cancelled</Text>
              <Text style={styles.infoValBold}>{cancelledVal}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Total Purchase Value</Text>
              <Text style={styles.infoValBold}>{purchasesVal}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: 14 }]}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Last Purchase</Text>
              <Text style={styles.infoValBold}>{lastPurchaseDate}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Open Issues</Text>
              <Text style={styles.infoValBold}>{issuesVal}</Text>
            </View>
          </View>
        </View>

        {/* ─── 6. Quick Actions ─── */}
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (onNavigateToNewSale ? onNavigateToNewSale() : Alert.alert('New Sale', `Opening sale checkout for ${customerName}`))}
            activeOpacity={0.75}
          >
            <CartPlusIcon size={22} color={PALETTE.actionIconCol} />
            <Text style={styles.actionLabel}>New Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (onNavigateToWallet ? onNavigateToWallet() : onNavigateToCashTopUp ? onNavigateToCashTopUp() : Alert.alert('Cash Top-Up', `Deposit cash to ${customerName}'s wallet`))}
            activeOpacity={0.75}
          >
            <CashBanknoteIcon size={22} color={PALETTE.actionIconCol} />
            <Text style={styles.actionLabel}>Cash Top-Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (onNavigateToIssues ? onNavigateToIssues() : Alert.alert('Issues', `Viewing open tickets for ${customerName}`))}
            activeOpacity={0.75}
          >
            <AlertExclamationIcon size={22} color={PALETTE.actionIconCol} />
            <Text style={styles.actionLabel}>View Issues</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleBottomTabPress('Home')}
          activeOpacity={0.75}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleBottomTabPress('Receiving')}
          activeOpacity={0.75}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.navLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleBottomTabPress('Inventory')}
          activeOpacity={0.75}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.navLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleBottomTabPress('More')}
          activeOpacity={0.75}
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  moreButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsWrap: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  profileHeroCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PALETTE.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 16,
    color: PALETTE.avatarText,
  },
  profileName: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 16,
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  profileSub: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  profileEmail: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginBottom: 10,
  },
  activePill: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  activePillText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  statsGrid: {
    marginHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    alignItems: 'flex-start',
  },
  statTileNum: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 16,
    color: PALETTE.textInk,
  },
  statTileLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 12,
  },
  tabChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipActive: {
    backgroundColor: PALETTE.tabActiveBg,
  },
  tabChipInactive: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  tabChipText: {
    fontFamily: 'Poppins',
    fontSize: 12,
  },
  tabChipTextActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabChipTextInactive: {
    fontWeight: '600',
    color: PALETTE.textBody,
  },
  sectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginHorizontal: 16,
    padding: 14,
  },
  infoRow: {
    flexDirection: 'row',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    color: PALETTE.textSecondary,
    fontWeight: '400',
  },
  infoValBold: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 13,
    color: PALETTE.textInk,
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontSize: 11.5,
    color: PALETTE.textInk,
    marginTop: 6,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 60,
  },
  navLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
