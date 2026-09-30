import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Existing Orange Palette + Inspect Specs) ─────────
const PALETTE = {
  primary:       '#F0562A',
  headerBtnBg:   'rgba(255, 255, 255, 0.22)',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#7A726C',
  textBody:      '#4B5563',
  border:        '#F0ECE3',
  divider:       '#F0ECE3',
  greenBadge:    '#E6F5ED',
  greenText:     '#1E8E5A',
  amberCardBg:   '#FFF5F2',
  amberBorder:   '#F0562A',
  amberText:     '#F0562A',
  buttonPrimary: '#F0562A',
  iconColor:     '#F0562A',
  viewBtnBg:     '#FFF0EB',
  viewBtnText:   '#F0562A',
  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
  redCancelled:  '#DC2626',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface InvoiceItem {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  amount: string;
  status: 'Generated' | 'Pending' | 'Cancelled';
  date: string;
  saleType: string;
}

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

function ReceiptDocIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CashIcon({ size = 18, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PendingClockIcon({ size = 18, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM8 12h.01M12 12h.01M16 12h.01"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CancelledXIcon({ size = 18, color = PALETTE.redCancelled }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusCircleIcon({ size = 20, color = PALETTE.buttonPrimary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v8M8 12h8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ListIcon({ size = 20, color = PALETTE.buttonPrimary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h6m-6 4h6m-8-4h.01m-.01 4h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HistoryClockIcon({ size = 20, color = PALETTE.buttonPrimary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HomeTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10"
        stroke={active ? PALETTE.primary : PALETTE.tabInactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke={active ? PALETTE.primary : PALETTE.tabInactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        stroke={active ? PALETTE.primary : PALETTE.tabInactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoreTabIcon({ active = false }: { active?: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h.01M12 6h.01M20 6h.01M4 12h.01M12 12h.01M20 12h.01M4 18h.01M12 18h.01M20 18h.01"
        stroke={active ? PALETTE.primary : PALETTE.tabInactive}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseBillingHubScreenProps {
  onBack?: () => void;
  onTabChange?: (tab: SubWHTab) => void;
  onNavigateToInvoiceList?: () => void;
  onNavigateToInvoiceDetail?: (invoiceId?: string) => void;
  onGenerateInvoice?: (orderId?: string) => void;
  onNavigateToInvoiceHistory?: () => void;
  onNavigateToNotifications?: () => void;
}

export function SubWarehouseBillingHubScreen({
  onBack,
  onTabChange,
  onNavigateToInvoiceList,
  onNavigateToInvoiceDetail,
  onGenerateInvoice,
  onNavigateToInvoiceHistory,
  onNavigateToNotifications,
}: SubWarehouseBillingHubScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SubWHTab>('More');

  const handleBottomTabPress = (tab: SubWHTab) => {
    setActiveTab(tab);
    if (tab !== 'More' && onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Go back"
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <ReceiptDocIcon size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Billing & Invoices</Text>
          </View>

          <TouchableOpacity
            style={styles.notifButton}
            onPress={onNavigateToNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Warehouse active status pill */}
        <View style={styles.warehousePill}>
          <Text style={styles.warehousePillText}>🔒 Coonoor Warehouse · Active</Text>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Stat Cards (2x2 grid matching design) ─── */}
        <View style={styles.statGrid}>
          <View style={styles.statRow}>
            {/* Card 1: Today's Invoices */}
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <CalendarIcon size={18} />
              </View>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Today's Invoices</Text>
            </View>

            {/* Card 2: Invoice Value */}
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <CashIcon size={18} />
              </View>
              <Text style={styles.statNumber}>₹42,850</Text>
              <Text style={styles.statLabel}>Invoice Value</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            {/* Card 3: Pending */}
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <PendingClockIcon size={18} />
              </View>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            {/* Card 4: Cancelled */}
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <CancelledXIcon size={18} />
              </View>
              <Text style={[styles.statNumber, { color: PALETTE.redCancelled }]}>1</Text>
              <Text style={styles.statLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        {/* ─── Quick Actions ─── */}
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (onGenerateInvoice ? onGenerateInvoice() : Alert.alert('Generate Invoice', 'Opening Invoice Generator...'))}
            activeOpacity={0.7}
          >
            <PlusCircleIcon size={20} />
            <Text style={styles.actionLabel}>Generate Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToInvoiceList}
            activeOpacity={0.7}
          >
            <ListIcon size={20} />
            <Text style={styles.actionLabel}>Invoice List</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToInvoiceHistory ? onNavigateToInvoiceHistory : onNavigateToInvoiceList}
            activeOpacity={0.7}
          >
            <HistoryClockIcon size={20} />
            <Text style={styles.actionLabel}>Invoice History</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Invoice Required Section ─── */}
        <Text style={styles.sectionHeading}>Invoice Required</Text>
        <View style={styles.requiredCard}>
          <Text style={styles.requiredTag}>⚠ INVOICE REQUIRED</Text>
          <Text style={styles.requiredOrderId}>ORD-002178</Text>
          <Text style={styles.requiredCustomer}>Ravi Kumar</Text>
          <Text style={styles.requiredAmount}>₹1,850</Text>

          <TouchableOpacity
            style={styles.requiredBtn}
            onPress={() => (onGenerateInvoice ? onGenerateInvoice('ORD-002178') : Alert.alert('Invoice', 'Generating invoice for ORD-002178...'))}
            activeOpacity={0.8}
          >
            <Text style={styles.requiredBtnText}>Generate Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Recent Invoices Section ─── */}
        <View style={styles.recentHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Invoices</Text>
          <TouchableOpacity onPress={onNavigateToInvoiceList} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Invoice Card */}
        <View style={styles.recentInvoiceCard}>
          <View style={styles.invoiceCardTop}>
            <Text style={styles.invoiceNumber}>INV-2026-001245</Text>
            <View style={styles.badgeGenerated}>
              <Text style={styles.badgeTextGenerated}>Generated</Text>
            </View>
          </View>

          <Text style={styles.invoiceOrderSub}>Ravi Kumar · ORD-002154</Text>

          <View style={styles.invoiceCardBottom}>
            <Text style={styles.invoiceDate}>25 Sep 2026, 10:42 AM</Text>
            <Text style={styles.invoiceAmount}>₹2,450</Text>
          </View>

          {/* Action pills row */}
          <View style={styles.invoiceActionRow}>
            <View style={styles.actionCircleBtn} />
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => (onNavigateToInvoiceDetail ? onNavigateToInvoiceDetail('INV-2026-001245') : Alert.alert('View', 'Opening Invoice Detail...'))}
              activeOpacity={0.7}
            >
              <Text style={styles.viewBtnText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => Alert.alert('Download', 'Downloading PDF for INV-2026-001245...')}
              activeOpacity={0.7}
            >
              <Text style={styles.downloadBtnText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleBottomTabPress('Home')}
          activeOpacity={0.75}
        >
          <HomeTabIcon active={activeTab === 'Home'} />
          <Text style={[styles.navLabel, activeTab === 'Home' && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleBottomTabPress('Receiving')}
          activeOpacity={0.75}
        >
          <ReceivingTabIcon active={activeTab === 'Receiving'} />
          <Text style={[styles.navLabel, activeTab === 'Receiving' && styles.navLabelActive]}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleBottomTabPress('Inventory')}
          activeOpacity={0.75}
        >
          <InventoryTabIcon active={activeTab === 'Inventory'} />
          <Text style={[styles.navLabel, activeTab === 'Inventory' && styles.navLabelActive]}>Inventory</Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    paddingRight: 4,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  notifButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PALETTE.headerBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    marginTop: 10,
  },
  warehousePillText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  statGrid: {
    gap: 10,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
  },
  statIconWrap: {
    marginBottom: 8,
  },
  statNumber: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  sectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  actionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 8,
    textAlign: 'center',
  },
  requiredCard: {
    backgroundColor: PALETTE.amberCardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.amberBorder,
    padding: 16,
    marginBottom: 18,
  },
  requiredTag: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.amberText,
    marginBottom: 6,
  },
  requiredOrderId: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  requiredCustomer: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  requiredAmount: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 8,
    marginBottom: 12,
  },
  requiredBtn: {
    backgroundColor: PALETTE.buttonPrimary,
    borderRadius: 10,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requiredBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  viewAllText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.amberText,
  },
  recentInvoiceCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 16,
  },
  invoiceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceNumber: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  badgeGenerated: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTextGenerated: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  invoiceOrderSub: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  invoiceCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  invoiceDate: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    color: PALETTE.textSecondary,
  },
  invoiceAmount: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  invoiceActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E6E1D8',
  },
  viewBtn: {
    flex: 1,
    backgroundColor: PALETTE.viewBtnBg,
    borderRadius: 8,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.viewBtnText,
  },
  downloadBtn: {
    flex: 1,
    backgroundColor: PALETTE.viewBtnBg,
    borderRadius: 8,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.viewBtnText,
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
