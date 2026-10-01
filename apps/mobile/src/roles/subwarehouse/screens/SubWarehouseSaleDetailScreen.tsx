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

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F0EAE1',

  completedPillBg:   '#E6F4EA',
  completedPillText: '#0D9488',
  timelineGreen:     '#10B981',
  timelineLine:      '#D1D5DB',

  tabInactive:   '#827A74',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function InvoiceReceiptIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TimelineCheckIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="8.5" fill="#E6F4EA" stroke={PALETTE.timelineGreen} strokeWidth="1.8" />
      <Circle cx="10" cy="10" r="3.5" fill={PALETTE.timelineGreen} />
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

export interface SubWarehouseSaleDetailScreenProps {
  sale?: {
    id: string;
    customerName: string;
    customerCode?: string | undefined;
    channel: string;
    dateText: string;
    amount: number;
    status: string;
    invoiceNo?: string | undefined;
    paymentMethod?: string | undefined;
    items?: Array<{
      name: string;
      grade: string;
      batch: string;
      qtyText: string;
      pricePerUnit: number;
      lineTotal: number;
    }> | undefined;
  } | undefined;
  onBack?: (() => void) | undefined;
  onViewInvoice?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
}

export function SubWarehouseSaleDetailScreen({
  sale = {
    id: 'SALE-00251',
    customerName: 'Rajesh Kumar',
    customerCode: 'CUS-00291',
    channel: 'Direct Sale',
    dateText: '24 Sep, 6:35 PM',
    amount: 320,
    status: 'Completed',
    invoiceNo: 'INV-00251',
    paymentMethod: 'UPI',
    items: [
      {
        name: 'Tomato',
        grade: 'Grade 1',
        batch: 'BTH-00231',
        qtyText: '2 KG @ ₹100',
        pricePerUnit: 100,
        lineTotal: 200,
      },
    ],
  },
  onBack,
  onViewInvoice,
  onTabChange,
}: SubWarehouseSaleDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<SubWHTab>('Home');

  const handleTabPress = (tab: SubWHTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  const handleViewInvoice = () => {
    if (onViewInvoice) {
      onViewInvoice();
    } else {
      Alert.alert(
        `Invoice ${sale.invoiceNo ?? 'INV-00251'}`,
        `Invoice for ${sale.customerName} (${sale.customerCode ?? 'CUS-00291'})\nAmount: ₹${sale.amount}\nStatus: Paid\n\nPDF invoice generated successfully.`
      );
    }
  };

  const timelineSteps = [
    { title: 'Sale Created', time: '6:30 PM' },
    { title: 'Products Added', time: '6:31 PM' },
    { title: 'Stock Checked', time: '6:32 PM' },
    { title: 'Payment Initiated', time: '6:34 PM' },
    { title: 'Payment Confirmed', time: '6:35 PM' },
    { title: 'Sale Completed', time: '6:35 PM' },
    { title: 'Invoice Generated', time: '6:35 PM' },
  ];

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
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Sale Details</Text>

          <View style={styles.completedPill}>
            <Text style={styles.completedPillText}>{sale.status || 'Completed'}</Text>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Sale Information ─── */}
        <Text style={styles.sectionHeading}>Sale Information</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Sale ID</Text>
              <Text style={styles.fieldValueBold}>{sale.id}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Created</Text>
              <Text style={styles.fieldValueBold}>{sale.dateText || '24 Sep, 6:35 PM'}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValueBold}>Coonoor</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Channel</Text>
              <Text style={styles.fieldValueBold}>{sale.channel || 'Direct Sale'}</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Customer ─── */}
        <Text style={styles.sectionHeading}>Customer</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldValueBold}>{sale.customerName}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Customer ID</Text>
              <Text style={styles.fieldValueBold}>{sale.customerCode || 'CUS-00291'}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Mobile</Text>
              <Text style={styles.fieldValueBold}>+91 XXXXX XXXXX</Text>
            </View>
          </View>
        </View>

        {/* ─── 3. Items ─── */}
        <Text style={styles.sectionHeading}>Items</Text>
        <View style={styles.card}>
          {(sale.items && sale.items.length > 0 ? sale.items : [
            {
              name: 'Tomato',
              grade: 'Grade 1',
              batch: 'BTH-00231',
              qtyText: '2 KG @ ₹100',
              pricePerUnit: 100,
              lineTotal: 200,
            }
          ]).map((item, idx) => (
            <View key={idx} style={idx > 0 ? { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: PALETTE.divider } : {}}>
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.itemTitle}>{item.name} · {item.grade}</Text>
                  <Text style={styles.fieldValueBold}>{item.qtyText}</Text>
                </View>

                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Batch</Text>
                  <Text style={styles.fieldValueBold}>{item.batch}</Text>
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.fieldLabel}>Line Total</Text>
                <Text style={[styles.fieldValueBold, { fontSize: 15 }]}>₹{item.lineTotal}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── 4. Amount Breakdown ─── */}
        <Text style={styles.sectionHeading}>Amount Breakdown</Text>
        <View style={styles.card}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>₹{sale.amount || 320}</Text>
          </View>

          <View style={[styles.breakdownRow, { marginTop: 8 }]}>
            <Text style={styles.breakdownLabel}>Discount</Text>
            <Text style={styles.breakdownValue}>₹0</Text>
          </View>

          <View style={[styles.breakdownRow, { marginTop: 8 }]}>
            <Text style={styles.breakdownLabel}>GST</Text>
            <Text style={styles.breakdownValue}>₹0</Text>
          </View>

          <View style={styles.breakdownDivider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{sale.amount || 320}</Text>
          </View>
        </View>

        {/* ─── 5. Payment ─── */}
        <Text style={styles.sectionHeading}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Payment Method</Text>
              <Text style={styles.fieldValueBold}>{sale.paymentMethod || 'UPI'}</Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Payment Status</Text>
              <Text style={styles.fieldValueBold}>Paid</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Transaction ID</Text>
              <Text style={styles.fieldValueBold}>TXN-XXXXXX</Text>
            </View>
          </View>
        </View>

        {/* ─── 6. Invoice ─── */}
        <Text style={styles.sectionHeading}>Invoice</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Invoice No.</Text>
          <Text style={styles.fieldValueBold}>{sale.invoiceNo || 'INV-00251'}</Text>
        </View>

        <TouchableOpacity
          style={styles.viewInvoiceBtn}
          onPress={handleViewInvoice}
          activeOpacity={0.82}
        >
          <InvoiceReceiptIcon size={20} color="#D4451B" />
          <Text style={styles.viewInvoiceBtnText}>View Invoice</Text>
        </TouchableOpacity>

        {/* ─── 7. Sale Timeline ─── */}
        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Sale Timeline</Text>
        <View style={styles.timelineContainer}>
          {timelineSteps.map((step, idx) => {
            const isLast = idx === timelineSteps.length - 1;
            return (
              <View key={idx} style={styles.timelineRow}>
                {/* Left Indicator & connecting vertical line */}
                <View style={styles.indicatorCol}>
                  <TimelineCheckIcon size={18} />
                  {!isLast && <View style={styles.timelineVerticalLine} />}
                </View>

                {/* Right Step Content */}
                <View style={[styles.timelineContent, !isLast && { paddingBottom: 22 }]}>
                  <Text style={styles.timelineStepTitle}>{step.title}</Text>
                  <Text style={styles.timelineStepTime}>{step.time}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Home')}
          activeOpacity={0.75}
        >
          <HomeTabIcon active={activeTab === 'Home'} />
          <Text style={[styles.navLabel, activeTab === 'Home' && styles.navLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Receiving')}
          activeOpacity={0.75}
        >
          <ReceivingTabIcon active={activeTab === 'Receiving'} />
          <Text style={[styles.navLabel, activeTab === 'Receiving' && styles.navLabelActive]}>
            Receiving
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Inventory')}
          activeOpacity={0.75}
        >
          <InventoryTabIcon active={activeTab === 'Inventory'} />
          <Text style={[styles.navLabel, activeTab === 'Inventory' && styles.navLabelActive]}>
            Inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('More')}
          activeOpacity={0.75}
        >
          <MoreTabIcon active={activeTab === 'More'} />
          <Text style={[styles.navLabel, activeTab === 'More' && styles.navLabelActive]}>
            More
          </Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    flex: 1,
    marginLeft: 8,
  },
  completedPill: {
    backgroundColor: PALETTE.completedPillBg,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  completedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.completedPillText,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  fieldValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  breakdownDivider: {
    height: 1.5,
    backgroundColor: PALETTE.textInk,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  viewInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: PALETTE.primaryDark,
    borderRadius: 12,
    backgroundColor: PALETTE.cardBg,
    paddingVertical: 14,
    marginTop: 14,
  },
  viewInvoiceBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.primaryDark,
  },
  timelineContainer: {
    paddingLeft: 4,
    marginTop: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: PALETTE.border,
    marginVertical: 2,
  },
  timelineContent: {
    marginLeft: 12,
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  timelineStepTime: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginTop: 2,
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
    fontSize: 11,
    color: PALETTE.tabInactive,
    marginTop: 3,
    fontWeight: '500',
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
