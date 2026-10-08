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

// ─── Design Tokens (TOHFA Admin App — Design System PDF) ─────────────────────
const PALETTE = {
  // Brand Palette
  primary:       '#F0562A', // Orange: Primary actions, active states, icons
  orangeDeep:    '#7A2E14', // Orange Deep: Section headings, emphasis text
  orangeTint:    '#FDF3F0', // Orange Tint: Icon chips, role badges, active pills
  pageBg:        '#F3EFE9', // Background: App canvas

  // Neutrals
  textInk:       '#1A1A1A', // Ink: Primary text
  textSecondary: '#5F5E5A', // Muted: Secondary text
  textMuted:     '#5F5E5A', // Muted
  textBody:      '#1A1A1A', // Ink: Body text
  border:        '#EEDCD3', // Border: Card and input borders
  divider:       '#EEDCD3', // Border
  cardBg:        '#FFFFFF', // Card: Card surfaces

  // Semantic Colors
  success:       '#173404',
  successBg:     '#EAF3DE',
  warning:       '#854F0B',
  warningBg:     '#FEF3E2',
  danger:        '#E24B4A',
  dangerBg:      '#FCEBEB',
  info:          '#0C447C',
  infoBg:        '#E6F1FB',
  purple:        '#3C3489',
  purpleBg:      '#EEEDFE',

  // Role & component mappings
  tabActiveBg:   '#F0562A',
  actionIconCol: '#F0562A',
  avatarBg:      '#FDF3F0',
  avatarText:    '#7A2E14',
  greenBadge:    '#EAF3DE',
  greenText:     '#173404',
  tabInactive:   '#5F5E5A',
  tabBorder:     '#EEDCD3',
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
    id?: string | undefined;
    name?: string | undefined;
    code?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    status?: string | undefined;
    ordersCount?: number | undefined;
    totalPurchases?: string | undefined;
    walletBalance?: string | undefined;
    openIssues?: number | undefined;
    completedOrders?: number | undefined;
    cancelledOrders?: number | undefined;
    lastPurchase?: string | undefined;
    regDate?: string | undefined;
  } | undefined;
  onBack: () => void;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onNavigateToOrders?: (() => void) | undefined;
  onNavigateToPurchases?: (() => void) | undefined;
  onNavigateToWallet?: (() => void) | undefined;
  onNavigateToIssues?: (() => void) | undefined;
  onNavigateToSupport?: (() => void) | undefined;
  onNavigateToNewSale?: (() => void) | undefined;
  onNavigateToCashTopUp?: (() => void) | undefined;
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

      {/* ─── Header Banner (Orange Theme with Back Arrow) ─── */}
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
              onPress={() => (onNavigateToOrders ? onNavigateToOrders() : setActiveTab('Orders'))}
              activeOpacity={0.8}
            >
              <Text style={styles.statTileNum}>{ordersCount}</Text>
              <Text style={styles.statTileLabel}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statTile}
              onPress={() => (onNavigateToPurchases ? onNavigateToPurchases() : setActiveTab('Purchases'))}
              activeOpacity={0.8}
            >
              <Text style={styles.statTileNum}>{purchasesVal}</Text>
              <Text style={styles.statTileLabel}>Purchases</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statTile}
              onPress={() => (onNavigateToWallet ? onNavigateToWallet() : setActiveTab('Wallet'))}
              activeOpacity={0.8}
            >
              <Text style={styles.statTileNum}>{walletVal}</Text>
              <Text style={styles.statTileLabel}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statTile}
              onPress={() => (onNavigateToIssues ? onNavigateToIssues() : setActiveTab('Issues'))}
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

        {/* ─── Tab Content (Conditional on activeTab) ─── */}
        {activeTab === 'Overview' && (
          <>
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
                <CartPlusIcon size={22} color={PALETTE.primary} />
                <Text style={styles.actionLabel}>New Sale</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => (onNavigateToCashTopUp ? onNavigateToCashTopUp() : onNavigateToWallet ? onNavigateToWallet() : Alert.alert('Cash Top-Up', `Deposit cash to ${customerName}'s wallet`))}
                activeOpacity={0.75}
              >
                <CashBanknoteIcon size={22} color={PALETTE.primary} />
                <Text style={styles.actionLabel}>Cash Top-Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => (onNavigateToIssues ? onNavigateToIssues() : Alert.alert('Issues', `Viewing open tickets for ${customerName}`))}
                activeOpacity={0.75}
              >
                <AlertExclamationIcon size={22} color={PALETTE.primary} />
                <Text style={styles.actionLabel}>View Issues</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── Orders Tab View ─── */}
        {activeTab === 'Orders' && (
          <View style={styles.tabSectionContainer}>
            <Text style={styles.sectionHeading}>Recent Orders</Text>
            <TouchableOpacity
              style={styles.tabCard}
              onPress={() => (onNavigateToOrders ? onNavigateToOrders() : null)}
              activeOpacity={0.8}
            >
              <View style={styles.tabCardHeaderRow}>
                <Text style={styles.tabCardCode}>ORD-00251</Text>
                <View style={styles.pickupBadge}>
                  <Text style={styles.pickupBadgeText}>Ready for Pickup</Text>
                </View>
              </View>
              <Text style={styles.tabCardItemSub}>3 Items</Text>
              <Text style={styles.tabCardPrice}>₹850</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewLinkButton}
              onPress={onNavigateToOrders}
              activeOpacity={0.75}
            >
              <Text style={styles.viewLinkText}>View All Orders →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Purchases Tab View ─── */}
        {activeTab === 'Purchases' && (
          <View style={styles.tabSectionContainer}>
            <Text style={styles.sectionHeading}>Recent Purchases</Text>
            <TouchableOpacity
              style={styles.tabCard}
              onPress={() => (onNavigateToPurchases ? onNavigateToPurchases() : null)}
              activeOpacity={0.8}
            >
              <View style={styles.tabCardHeaderRow}>
                <Text style={styles.tabCardCode}>INV-00251</Text>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>Paid</Text>
                </View>
              </View>
              <Text style={styles.tabCardItemSub}>Tomato Grade 1 · 2 KG</Text>
              <Text style={styles.tabCardPrice}>₹200</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewLinkButton}
              onPress={onNavigateToPurchases}
              activeOpacity={0.75}
            >
              <Text style={styles.viewLinkText}>View Purchase History →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Wallet Tab View ─── */}
        {activeTab === 'Wallet' && (
          <View style={styles.tabSectionContainer}>
            <Text style={styles.sectionHeading}>Wallet</Text>
            <TouchableOpacity
              style={styles.tabCard}
              onPress={() => (onNavigateToWallet ? onNavigateToWallet() : null)}
              activeOpacity={0.8}
            >
              <Text style={styles.walletLabel}>Available Balance</Text>
              <Text style={styles.walletAmountLarge}>{walletVal}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewLinkButton}
              onPress={onNavigateToWallet}
              activeOpacity={0.75}
            >
              <Text style={styles.viewLinkText}>View Wallet Summary →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Issues Tab View ─── */}
        {activeTab === 'Issues' && (
          <View style={styles.tabSectionContainer}>
            <Text style={styles.sectionHeading}>Recent Issues</Text>
            <TouchableOpacity
              style={[styles.tabCard, styles.tabCardIssue]}
              onPress={() => (onNavigateToIssues ? onNavigateToIssues() : null)}
              activeOpacity={0.8}
            >
              <View style={styles.tabCardHeaderRow}>
                <Text style={styles.tabCardCode}>ISSUE-00231</Text>
                <View style={styles.inReviewBadge}>
                  <Text style={styles.inReviewBadgeText}>In Review</Text>
                </View>
              </View>
              <Text style={styles.issueTitle}>Quality · Tomato Grade 1</Text>
              <Text style={styles.issueDate}>24 Sep 2026</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewLinkButton}
              onPress={onNavigateToIssues}
              activeOpacity={0.75}
            >
              <Text style={styles.viewLinkText}>View All Issues →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Support Tab View ─── */}
        {activeTab === 'Support' && (
          <View style={styles.tabSectionContainer}>
            <Text style={styles.sectionHeading}>Recent Support</Text>
            <TouchableOpacity
              style={[styles.tabCard, styles.tabCardSupport]}
              onPress={() => (onNavigateToSupport ? onNavigateToSupport() : null)}
              activeOpacity={0.8}
            >
              <View style={styles.tabCardHeaderRow}>
                <Text style={styles.tabCardCode}>TKT-00104</Text>
                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>Open</Text>
                </View>
              </View>
              <Text style={styles.issueTitle}>Order Assistance & Support</Text>
              <Text style={styles.issueDate}>24 Sep 2026</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewLinkButton}
              onPress={onNavigateToSupport}
              activeOpacity={0.75}
            >
              <Text style={styles.viewLinkText}>View All Support Tickets →</Text>
            </TouchableOpacity>
          </View>
        )}

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
    fontSize: 19,
    fontWeight: '800',
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
    borderRadius: 14,
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
    fontWeight: '800',
    fontSize: 18,
    color: PALETTE.avatarText,
  },
  profileName: {
    fontWeight: '800',
    fontSize: 19,
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  profileSub: {
    fontSize: 12,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  profileEmail: {
    fontSize: 12,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginBottom: 10,
  },
  activePill: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  activePillText: {
    fontSize: 11,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    alignItems: 'flex-start',
  },
  statTileNum: {
    fontWeight: '800',
    fontSize: 19,
    color: PALETTE.textInk,
  },
  statTileLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 12,
  },
  tabChip: {
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 7,
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
    fontSize: 12.5,
  },
  tabChipTextActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabChipTextInactive: {
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.1,
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
    fontSize: 11,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  infoValBold: {
    fontWeight: '700',
    fontSize: 13,
    color: PALETTE.textInk,
    marginTop: 2,
  },
  tabSectionContainer: {
    paddingBottom: 8,
  },
  tabCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginHorizontal: 16,
    padding: 14,
    marginBottom: 10,
  },
  tabCardIssue: {
    borderLeftWidth: 4,
    borderLeftColor: PALETTE.warning,
  },
  tabCardSupport: {
    borderLeftWidth: 4,
    borderLeftColor: PALETTE.info,
  },
  tabCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tabCardCode: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  pickupBadge: {
    backgroundColor: PALETTE.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  pickupBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.success,
  },
  paidBadge: {
    backgroundColor: PALETTE.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.success,
  },
  tabCardItemSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  tabCardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  walletLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  walletAmountLarge: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.primary,
  },
  inReviewBadge: {
    backgroundColor: PALETTE.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  inReviewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.warning,
  },
  openBadge: {
    backgroundColor: PALETTE.infoBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.info,
  },
  issueTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  issueDate: {
    fontSize: 11,
    color: PALETTE.textSecondary,
  },
  viewLinkButton: {
    marginHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  actionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
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
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
