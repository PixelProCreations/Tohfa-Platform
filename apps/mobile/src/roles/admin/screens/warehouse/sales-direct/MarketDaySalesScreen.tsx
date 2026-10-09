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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { adminColors, adminType, adminShadow } from '../../../theme';

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary:       adminColors.brand,
  primaryDark:   adminColors.brand,
  primaryLight:  adminColors.brandTint,
  primarySoft:   adminColors.brandTint,
  primaryBorder: adminColors.border,

  pageBg:        adminColors.canvas,
  cardBg:        adminColors.card,
  textInk:       adminColors.ink,
  textSecondary: adminColors.muted,
  textMuted:     adminColors.muted,
  border:        adminColors.border,
  divider:       adminColors.border,

  amberPillBg:   adminColors.warning.bg,
  amberText:     adminColors.warning.text,
  activeGreenBg: adminColors.success.bg,
  activeGreenText: adminColors.success.text,
  paidBg:        adminColors.success.bg,
  paidText:      adminColors.success.text,

  infoBoxBg:     adminColors.info.bg,
  infoBoxBorder: adminColors.info.border,
  infoBoxText:   adminColors.info.text,

  tabInactive:   adminColors.muted,
  tabBorder:     adminColors.border,
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function LockBadgeIcon({ size = 12, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ShoppingCartActionIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Path
        d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HistoryClockActionIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = adminColors.info.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface MarketDaySalesScreenProps {
  warehouseName?: string | undefined;
  marketDate?: string | undefined;
  onBack?: (() => void) | undefined;
  onNavigateToNewMarketSale?: (() => void) | undefined;
  onNavigateToSalesHistory?: (() => void) | undefined;
  onSelectTransaction?: ((tx: any) => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
}

export function MarketDaySalesScreen({
  warehouseName = 'Coonoor Warehouse',
  marketDate = '24 Sep 2026',
  onBack,
  onNavigateToNewMarketSale,
  onNavigateToSalesHistory,
  onSelectTransaction,
  onTabChange,
}: MarketDaySalesScreenProps) {
  const [activeTab, setActiveTab] = useState<SubWHTab>('Home');

  const handleTabPress = (tab: SubWHTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  const handleOpenNewSale = () => {
    if (onNavigateToNewMarketSale) {
      onNavigateToNewMarketSale();
    } else {
      Alert.alert('New Market Sale', 'Starting a live market day sale transaction...');
    }
  };

  const handleOpenHistory = () => {
    if (onNavigateToSalesHistory) {
      onNavigateToSalesHistory();
    } else {
      Alert.alert('Sales History', 'Viewing sales history...');
    }
  };

  const handleTxPress = (txId: string, itemText: string, amount: number) => {
    if (onSelectTransaction) {
      onSelectTransaction({
        id: txId,
        customerName: 'Walk-in Customer',
        customerCode: 'CUS-WALKIN',
        channel: 'Market Sale',
        dateText: '24 Sep · 3:10 PM',
        amount,
        status: 'Completed',
        invoiceNo: `INV-${txId.replace('SALE-', '')}`,
        paymentMethod: 'Cash',
      });
    } else {
      Alert.alert(txId, `${itemText} · ₹${amount} (Paid)`);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Market Day Sales</Text>
        </View>
      </View>

      {/* ─── Scrollable Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Warehouse Pill ─── */}
        <View style={styles.warehousePill}>
          <LockBadgeIcon size={12} color={PALETTE.amberText} />
          <Text style={styles.warehousePillText}>{warehouseName}</Text>
        </View>

        {/* ─── Market Day Active Banner ─── */}
        <View style={styles.marketDayCard}>
          <Text style={styles.marketDayTitle}>Market Day · {marketDate}</Text>
          <View style={styles.activePill}>
            <Text style={styles.activePillDot}>•</Text>
            <Text style={styles.activePillText}>Active</Text>
          </View>
        </View>

        {/* ─── Market KPIs Row ─── */}
        <Text style={styles.sectionHeading}>Market KPIs</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>₹7,850</Text>
            <Text style={styles.kpiLabel}>SALES</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>42</Text>
            <Text style={styles.kpiLabel}>TXNS</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>186 KG</Text>
            <Text style={styles.kpiLabel}>QTY SOLD</Text>
          </View>
        </View>

        {/* ─── Quick Actions Row ─── */}
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleOpenNewSale}
            activeOpacity={0.78}
          >
            <ShoppingCartActionIcon size={24} />
            <Text style={styles.actionCardLabel}>New Market Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleOpenHistory}
            activeOpacity={0.78}
          >
            <HistoryClockActionIcon size={24} />
            <Text style={styles.actionCardLabel}>Sales History</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Market Product Availability ─── */}
        <Text style={styles.sectionHeading}>Market Product Availability</Text>
        <View style={styles.card}>
          <View style={styles.productGridRow}>
            <View style={styles.productGridCol}>
              <Text style={styles.productName}>Tomato Grade 1</Text>
              <Text style={styles.productQty}>120 KG</Text>
            </View>

            <View style={styles.productGridCol}>
              <Text style={styles.productName}>Carrot Grade 1</Text>
              <Text style={styles.productQty}>80 KG</Text>
            </View>
          </View>

          <View style={[styles.productGridRow, { marginTop: 14 }]}>
            <View style={styles.productGridCol}>
              <Text style={styles.productName}>Beans Grade 1</Text>
              <Text style={styles.productQty}>60 KG</Text>
            </View>
          </View>
        </View>

        {/* ─── Market Transactions ─── */}
        <Text style={styles.sectionHeading}>Market Transactions</Text>
        <TouchableOpacity
          style={styles.txCard}
          onPress={() => handleTxPress('SALE-00321', 'Tomato · 2 KG', 200)}
          activeOpacity={0.82}
        >
          <View style={styles.txCardTop}>
            <Text style={styles.txSaleId}>SALE-00321</Text>
            <View style={styles.txPaidPill}>
              <Text style={styles.txPaidText}>Paid</Text>
            </View>
          </View>
          <View style={styles.txCardBottom}>
            <Text style={styles.txSubtitle}>Tomato · 2 KG</Text>
            <Text style={styles.txAmount}>₹200</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.txCard}
          onPress={() => handleTxPress('SALE-00322', 'Carrot · 5 KG', 450)}
          activeOpacity={0.82}
        >
          <View style={styles.txCardTop}>
            <Text style={styles.txSaleId}>SALE-00322</Text>
            <View style={styles.txPaidPill}>
              <Text style={styles.txPaidText}>Paid</Text>
            </View>
          </View>
          <View style={styles.txCardBottom}>
            <Text style={styles.txSubtitle}>Carrot · 5 KG</Text>
            <Text style={styles.txAmount}>₹450</Text>
          </View>
        </TouchableOpacity>

        {/* ─── Market Summary ─── */}
        <View style={styles.summaryHeaderRow}>
          <Text style={styles.sectionHeadingNoMargin}>Market Summary</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Previous Market Days', 'Showing archive of past market schedules.')}
            activeOpacity={0.7}
          >
            <Text style={styles.previousDaysLink}>Previous Market Days</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Sales</Text>
            <Text style={styles.summaryValue}>₹7,850</Text>
          </View>
          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>42</Text>
          </View>
          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cash</Text>
            <Text style={styles.summaryValue}>₹3,200</Text>
          </View>
          <View style={styles.summaryStrongDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryStrongLabel}>UPI</Text>
            <Text style={styles.summaryStrongValue}>₹4,650</Text>
          </View>
        </View>
      </ScrollView>


    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
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
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
    flex: 1,
    marginLeft: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.amberPillBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: PALETTE.amberText,
  },
  marketDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  marketDayTitle: {
    ...adminType.sectionHead,
    color: PALETTE.textInk,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.activeGreenBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  activePillDot: {
    ...adminType.sectionHead,
    color: PALETTE.activeGreenText,
  },
  activePillText: {
    ...adminType.rowTitle,
    color: PALETTE.activeGreenText,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: PALETTE.textInk,
    marginTop: 14,
    marginBottom: 10,
  },
  sectionHeadingNoMargin: {
    ...adminType.sectionHead,
    color: PALETTE.textInk,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiValue: {
    ...adminType.title,
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  kpiLabel: {
    ...adminType.caption,
    color: PALETTE.textMuted,
    letterSpacing: 0.5,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  actionCardLabel: {
    ...adminType.sectionHead,
    color: PALETTE.textInk,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    ...adminShadow.sm,
  },
  productGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productGridCol: {
    flex: 1,
  },
  productName: {
    ...adminType.body,
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  productQty: {
    ...adminType.sectionHead,
    color: PALETTE.textInk,
  },
  txCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  txCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txSaleId: {
    ...adminType.sectionHead,
    color: PALETTE.textInk,
  },
  txPaidPill: {
    backgroundColor: PALETTE.paidBg,
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  txPaidText: {
    ...adminType.caption,
    color: PALETTE.paidText,
  },
  txCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  txSubtitle: {
    ...adminType.body,
    color: PALETTE.textSecondary,
  },
  txAmount: {
    ...adminType.title,
    color: PALETTE.textInk,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  previousDaysLink: {
    ...adminType.rowTitle,
    color: PALETTE.amberText,
  },
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    ...adminShadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...adminType.body,
    color: PALETTE.textSecondary,
  },
  summaryValue: {
    ...adminType.sectionHead,
    color: PALETTE.textInk,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },
  summaryStrongDivider: {
    height: 1.5,
    backgroundColor: PALETTE.textInk,
    marginVertical: 10,
  },
  summaryStrongLabel: {
    ...adminType.sectionHead,
    color: PALETTE.textInk,
  },
  summaryStrongValue: {
    ...adminType.title,
    color: PALETTE.textInk,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.infoBoxBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.infoBoxBorder,
    padding: 12,
    marginTop: 14,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    ...adminType.body,
    color: PALETTE.infoBoxText,
    lineHeight: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingTop: 8,
    paddingBottom: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    ...adminType.rowMeta,
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
