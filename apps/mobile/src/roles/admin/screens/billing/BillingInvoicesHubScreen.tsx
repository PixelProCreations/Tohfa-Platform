import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A', // Vibrant brand orange (not yellow!)
  headerBg: '#F0562A',
  pageBg: '#F3EFE9', // App canvas soft cream
  cardBg: '#FFFFFF',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted: '#5F5E5A',
  border: '#EEDCD3',
  orangeDeep: '#7A2E14',
  greenBadge: '#EAF3DE',
  greenText: '#173404',
  tabActive: '#F0562A',
  tabInactive: '#786F66',
};

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

function HeaderInvoiceIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3h12a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-2-1.33V5a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 8h6M9 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Generate Invoice: Document outline with 3 horizontal lines and + badge at top-right */
function GenerateInvoiceIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Document border opening at top-right for + badge */}
      <Path
        d="M13.5 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* + Badge at top right */}
      <Path
        d="M18 2.5v5M15.5 5h5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* 3 horizontal lines inside document */}
      <Path d="M8 9.5h5.5M8 13.5h5.5M8 17.5h5.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

/** View Invoices: Rounded rectangle container with 3 bullet list items */
function ViewInvoicesIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="4"
        y="3.5"
        width="16"
        height="17"
        rx="2.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Row 1 */}
      <Circle cx="7.5" cy="8" r="1.15" fill={color} />
      <Path d="M10.5 8h6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      {/* Row 2 */}
      <Circle cx="7.5" cy="12" r="1.15" fill={color} />
      <Path d="M10.5 12h6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      {/* Row 3 */}
      <Circle cx="7.5" cy="16" r="1.15" fill={color} />
      <Path d="M10.5 16h6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

/** Invoice History: Counter-clockwise curved arrow with clock hands at center */
function InvoiceHistoryIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12a8 8 0 1 0 2.4-5.7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path d="M3 6.5h3.5V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7.5v4.5l2.5 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** GST Invoice: Legal gavel striking sound block */
function GstInvoiceIcon({ size = 26, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Sound block base */}
      <Path d="M4 20h11" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Gavel handle extending down-right */}
      <Path d="M9 9.5l9 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Lower striking barrel block */}
      <Path
        d="M4.2 12.2l4.2-4.2 2.5 2.5-4.2 4.2z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Upper rear barrel block */}
      <Path
        d="M8.2 8.2l4.2-4.2 2.5 2.5-4.2 4.2z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface BillingInvoicesHubScreenProps {
  showBack?: boolean;
  onBack?: () => void;
  onNavigateToGenerate?: () => void;
  onNavigateToViewInvoices?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToGst?: () => void;
  onNavigateToDetail?: (invoiceId: string) => void;
  onHomePress?: () => void;
  onMorePress?: () => void;
}

export function BillingInvoicesHubScreen({
  showBack = true,
  onBack,
  onNavigateToGenerate,
  onNavigateToViewInvoices,
  onNavigateToHistory,
  onNavigateToGst,
  onNavigateToDetail,
  onHomePress,
  onMorePress,
}: BillingInvoicesHubScreenProps) {
  const KPIS = [
    { label: "TODAY'S INVOICES", value: '42' },
    { label: 'GENERATED', value: '38' },
    { label: 'PENDING', value: '3' },
    { label: 'FAILED', value: '1' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          {showBack && onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <HeaderInvoiceIcon size={20} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Billing & Invoices</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 Stat Cards in 2x2 Grid */}
        <View style={styles.kpiGrid}>
          {KPIS.map((item, idx) => (
            <View key={idx} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{item.label}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {/* Card 1: Generate Invoice */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToGenerate}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrap}>
              <GenerateInvoiceIcon size={28} />
            </View>
            <Text style={styles.actionLabel}>Generate Invoice</Text>
          </TouchableOpacity>

          {/* Card 2: View Invoices */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToViewInvoices}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrap}>
              <ViewInvoicesIcon size={28} />
            </View>
            <Text style={styles.actionLabel}>View Invoices</Text>
          </TouchableOpacity>

          {/* Card 3: Invoice History */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToHistory}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrap}>
              <InvoiceHistoryIcon size={28} />
            </View>
            <Text style={styles.actionLabel}>Invoice History</Text>
          </TouchableOpacity>

          {/* Card 4: GST Invoice */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToGst}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrap}>
              <GstInvoiceIcon size={28} />
            </View>
            <Text style={styles.actionLabel}>GST Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Invoices */}
        <Text style={styles.sectionHeading}>Recent Invoices</Text>
        <TouchableOpacity
          style={styles.invoiceCard}
          onPress={() => onNavigateToDetail?.('INV-2026-001245')}
          activeOpacity={0.8}
        >
          <View style={styles.invoiceCardTop}>
            <Text style={styles.invoiceNumber}>INV-2026-001245</Text>
            <View style={styles.badgeGenerated}>
              <Text style={styles.badgeText}>Generated</Text>
            </View>
          </View>

          <Text style={styles.customerName}>Arun Kumar</Text>

          <View style={styles.cardDivider} />

          <View style={styles.invoiceCardBottom}>
            <Text style={styles.orderId}>ORD-2026-00982</Text>
            <Text style={styles.amount}>₹2,100</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Bottom Navigation matching screenshot (Home | More) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.tabItem} onPress={onHomePress} activeOpacity={0.7}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z"
              stroke={PALETTE.tabInactive}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={onMorePress} activeOpacity={0.7}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="5" cy="5" r="2" fill={PALETTE.tabActive} />
            <Circle cx="12" cy="5" r="2" fill={PALETTE.tabActive} />
            <Circle cx="19" cy="5" r="2" fill={PALETTE.tabActive} />
            <Circle cx="5" cy="12" r="2" fill={PALETTE.tabActive} />
            <Circle cx="12" cy="12" r="2" fill={PALETTE.tabActive} />
            <Circle cx="19" cy="12" r="2" fill={PALETTE.tabActive} />
            <Circle cx="5" cy="19" r="2" fill={PALETTE.tabActive} />
            <Circle cx="12" cy="19" r="2" fill={PALETTE.tabActive} />
            <Circle cx="19" cy="19" r="2" fill={PALETTE.tabActive} />
          </Svg>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 10,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48.4%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'left',
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800', // Bold in all dashboards
    color: PALETTE.textInk,
    lineHeight: 24,
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    marginBottom: 10,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    width: '48.4%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIconWrap: {
    marginBottom: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
  },
  invoiceCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  invoiceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  badgeGenerated: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  customerName: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0E7DD',
    marginBottom: 10,
  },
  invoiceCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  amount: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  bottomNav: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.tabInactive,
    marginTop: 2,
  },
  tabLabelActive: {
    color: PALETTE.tabActive,
  },
});
