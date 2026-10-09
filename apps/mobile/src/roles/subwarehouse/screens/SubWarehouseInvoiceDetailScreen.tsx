import React from 'react';
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
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#7A726C',
  textBody:      '#4B5563',
  border:        '#F0ECE3',
  divider:       '#F0ECE3',
  greenBadge:    '#E6F5ED',
  greenText:     '#1E8E5A',
  greenDot:      '#10B981',
  brandGold:     '#F0562A',
  buttonPrimary: '#F0562A',
  buttonSecondaryBorder: '#F0562A',
  buttonSecondaryText: '#F0562A',
};

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

function DownloadIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TimelineCheckIcon({ size = 16, color = PALETTE.greenDot }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9 12l2 2 4-4"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldInfoIcon({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4m0 4h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseInvoiceDetailScreenProps {
  invoiceId?: string;
  onBack?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export function SubWarehouseInvoiceDetailScreen({
  invoiceId = 'INV-2026-001245',
  onBack,
  onDownload,
  onShare,
}: SubWarehouseInvoiceDetailScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Invoice Detail</Text>
            <Text style={styles.headerSubtitle}>{invoiceId} · • Generated</Text>
          </View>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={onDownload ? onDownload : () => Alert.alert('Download', `Downloading ${invoiceId}...`)}
            activeOpacity={0.8}
            accessibilityLabel="Download Invoice"
          >
            <DownloadIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── TOHFA Branding Card ─── */}
        <View style={styles.brandCard}>
          <Text style={styles.brandTitle}>TOHFA</Text>
          <Text style={styles.brandSubtitle}>Nilgiris Horticulture Organic Farmers Association</Text>
          <View style={styles.brandDivider} />
          <Text style={styles.invoiceDocLabel}>Invoice · {invoiceId}</Text>
        </View>

        {/* ─── Section 1: Invoice Information ─── */}
        <Text style={styles.sectionHeading}>Invoice Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Invoice Number</Text>
              <Text style={styles.infoVal}>{invoiceId}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Order Number</Text>
              <Text style={styles.infoVal}>ORD-002154</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: 14 }]}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoVal}>25 Sep 2026</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Sales Channel</Text>
              <Text style={styles.infoVal}>Direct Sale</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: 14 }]}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Warehouse</Text>
              <Text style={styles.infoVal}>Coonoor Warehouse</Text>
            </View>
          </View>
        </View>

        {/* ─── Section 2: Bill To ─── */}
        <Text style={styles.sectionHeading}>Bill To</Text>
        <View style={styles.billToCard}>
          <Text style={styles.billToCustomer}>Ravi Kumar</Text>
          <Text style={styles.billToDetails}>
            Customer ID: CUS-001245 · Mobile: +91 XXXXX XXXXX
          </Text>
        </View>

        {/* ─── Section 3: Product / Line Items ─── */}
        <Text style={styles.sectionHeading}>Product / Line Items</Text>
        <View style={styles.itemsCard}>
          {/* Item 1 */}
          <View style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemName}>Tomato</Text>
              <Text style={styles.itemGrade}>Grade 1 · KG</Text>
              <Text style={styles.itemQty}>5 KG × ₹100</Text>
            </View>
            <Text style={styles.itemPrice}>₹500</Text>
          </View>

          <View style={styles.itemDivider} />

          {/* Item 2 */}
          <View style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemName}>Carrot</Text>
              <Text style={styles.itemGrade}>Grade 1 · KG</Text>
              <Text style={styles.itemQty}>3 KG × ₹80</Text>
            </View>
            <Text style={styles.itemPrice}>₹240</Text>
          </View>
        </View>

        {/* ─── Section 4: Amount Summary ─── */}
        <Text style={styles.sectionHeading}>Amount Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>₹740</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryVal}>₹0</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST</Text>
            <Text style={styles.summaryVal}>₹0</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹740</Text>
          </View>
        </View>

        {/* ─── Section 5: Payment Information ─── */}
        <Text style={styles.sectionHeading}>Payment Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Payment Status</Text>
              <Text style={styles.infoVal}>Paid</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text style={styles.infoVal}>Wallet</Text>
            </View>
          </View>
        </View>

        {/* ─── Section 6: Invoice Timeline ─── */}
        <Text style={styles.sectionHeading}>Invoice Timeline</Text>
        <View style={styles.timelineCard}>
          {/* Step 1 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineIconCol}>
              <TimelineCheckIcon size={18} />
              <View style={styles.timelineVerticalLine} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Invoice Generated</Text>
              <Text style={styles.timelineTime}>25 Sep 2026, 10:42 AM</Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineIconCol}>
              <TimelineCheckIcon size={18} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Invoice Linked to Order</Text>
              <Text style={styles.timelineTime}>25 Sep 2026, 10:42 AM</Text>
            </View>
          </View>
        </View>

        {/* ─── Section 7: Generated By ─── */}
        <View style={styles.generatedByCard}>
          <Text style={styles.generatedByLabel}>Generated By</Text>
          <Text style={styles.generatedByVal}>SWA – Suresh</Text>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryDownloadBtn}
          onPress={onDownload ? onDownload : () => Alert.alert('Download', `Downloading ${invoiceId} PDF...`)}
          activeOpacity={0.8}
        >
          <View style={styles.btnRow}>
            <DownloadIcon size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Download Invoice</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryShareBtn}
          onPress={onShare ? onShare : () => Alert.alert('Share', `Sharing ${invoiceId}...`)}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>Share</Text>
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
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: 1,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
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
  brandCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  brandTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.brandGold,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  brandDivider: {
    width: '100%',
    height: 1,
    backgroundColor: PALETTE.buttonPrimary,
    opacity: 0.35,
    marginVertical: 10,
  },
  invoiceDocLabel: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  sectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 14,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
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
    fontWeight: '400',
    color: PALETTE.textSecondary,
  },
  infoVal: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 2,
  },
  billToCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  billToCustomer: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginBottom: 2,
  },
  billToDetails: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  itemsCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  itemGrade: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 1,
  },
  itemQty: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 1,
  },
  itemPrice: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  itemDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: PALETTE.textSecondary,
  },
  summaryVal: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 8,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  totalLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  totalAmount: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  timelineCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineVerticalLine: {
    width: 2,
    height: 28,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 8,
    paddingBottom: 14,
  },
  timelineTitle: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  timelineTime: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  generatedByCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  generatedByLabel: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
  },
  generatedByVal: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 2,
  },
  traceabilityNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 13,
    marginTop: 10,
    marginBottom: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  noticeIconWrap: {
    marginTop: 1,
  },
  traceabilityNoticeText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: '#1E40AF',
    lineHeight: 16.5,
  },
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  primaryDownloadBtn: {
    backgroundColor: PALETTE.buttonPrimary,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryShareBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.buttonSecondaryBorder,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.buttonSecondaryText,
  },
});
