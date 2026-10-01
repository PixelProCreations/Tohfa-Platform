import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand + Inspect Element Tokens) ─────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#6B7280',
  border:        '#E7E2D6',
  divider:       '#F0ECE3',
  darkDivider:   '#1D2420',
  blueBoxBg:     '#EFF6FF',
  blueBoxBorder: '#BFDBFE',
  blueBoxText:   '#1E40AF',
};

// ─── Pure SVG Icons ─────────────────────────────────────────────────────────

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

function ShieldKeyIcon({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8a2 2 0 00-2 2v2a2 2 0 104 0v-2a2 2 0 00-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalculatorBookIcon({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4a2 2 0 012-2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm4 4h8M8 12h2m4 0h2m-8 4h2m4 0h2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseGSTInvoiceScreenProps {
  onBack?: (() => void) | undefined;
  onViewExisting?: (() => void) | undefined;
  onPreviewAuthorized?: (() => void) | undefined;
}

export function SubWarehouseGSTInvoiceScreen({
  onBack,
  onViewExisting,
  onPreviewAuthorized,
}: SubWarehouseGSTInvoiceScreenProps): React.JSX.Element {
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

          <Text style={styles.headerTitle}>GST Invoice</Text>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top Notice Box: Design Reference ─── */}
        <View style={styles.topNoticeBox}>
          <View style={styles.noticeIconWrap}>
            <ShieldKeyIcon size={18} />
          </View>
          <Text style={styles.topNoticeText}>
            Design reference only — this full screen is what SA/TA see. SWA never reaches this state in the real app.
          </Text>
        </View>

        {/* ─── Section 1: Business Information ─── */}
        <Text style={styles.sectionHeading}>Business Information</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Business Name</Text>
              <Text style={styles.fieldVal}>Green Valley Restaurant</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>GSTIN</Text>
              <Text style={styles.fieldVal}>33XXXXX1234X1Z5</Text>
            </View>
          </View>

          <View style={[styles.singleRow, { marginTop: 14 }]}>
            <Text style={styles.fieldLabel}>Billing Address</Text>
            <Text style={styles.fieldVal}>Coonoor, Nilgiris, TN</Text>
          </View>
        </View>

        {/* ─── Section 2: Invoice Information ─── */}
        <Text style={styles.sectionHeading}>Invoice Information</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Invoice Number</Text>
              <Text style={styles.fieldVal}>GST-2026-00042</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Invoice Date</Text>
              <Text style={styles.fieldVal}>25 Sep 2026</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Order Number</Text>
              <Text style={styles.fieldVal}>HORECA-0021</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Invoice Type</Text>
              <Text style={styles.fieldVal}>B2B / HORECA (GST-exclusive)</Text>
            </View>
          </View>
        </View>

        {/* ─── Section 3: Items ─── */}
        <Text style={styles.sectionHeading}>Items</Text>
        <View style={styles.card}>
          <View style={styles.itemRow}>
            <View>
              <Text style={styles.itemName}>Tomato</Text>
              <Text style={styles.itemGrade}>Grade 1 · 20 KG</Text>
            </View>
            <Text style={styles.itemAmount}>₹2,000</Text>
          </View>
        </View>

        {/* ─── Section 4: Tax Summary ─── */}
        <View style={styles.taxHeadingRow}>
          <Text style={styles.sectionHeading}>Tax Summary</Text>
          <Text style={styles.taxSubHeading}>Intra-state — CGST+SGST</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Taxable Amount</Text>
            <Text style={styles.taxValue}>₹2,000</Text>
          </View>
          <View style={styles.thinDivider} />

          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>CGST (2.5%)</Text>
            <Text style={styles.taxValue}>₹50</Text>
          </View>
          <View style={styles.thinDivider} />

          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>SGST (2.5%)</Text>
            <Text style={styles.taxValue}>₹50</Text>
          </View>
          <View style={styles.thinDivider} />

          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>IGST</Text>
            <Text style={styles.taxValue}>—</Text>
          </View>
          <View style={styles.thinDivider} />

          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Total Tax</Text>
            <Text style={styles.taxValue}>₹100</Text>
          </View>

          <View style={styles.darkDivider} />

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹2,100</Text>
          </View>
        </View>

        {/* ─── Bottom Notice Box: Tax Calculation ─── */}
        <View style={styles.bottomNoticeBox}>
          <View style={styles.noticeIconWrap}>
            <CalculatorBookIcon size={18} />
          </View>
          <Text style={styles.bottomNoticeText}>
            CGST/SGST and IGST are never applied together, and every figure here is backend-calculated — never computed in the mobile UI.
          </Text>
        </View>
      </ScrollView>
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
  },
  backButton: {
    paddingRight: 14,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: PALETTE.pageBg,
  },
  topNoticeBox: {
    flexDirection: 'row',
    backgroundColor: PALETTE.blueBoxBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.blueBoxBorder,
    padding: 13,
    marginBottom: 18,
    gap: 10,
    alignItems: 'flex-start',
  },
  noticeIconWrap: {
    marginTop: 1,
  },
  topNoticeText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.blueBoxText,
    lineHeight: 16.5,
  },
  sectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 10,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 15,
    marginBottom: 18,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  singleRow: {},
  fieldLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginBottom: 2,
  },
  fieldVal: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  itemGrade: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  itemAmount: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  taxHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taxSubHeading: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    color: PALETTE.textSecondary,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  taxLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  taxValue: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  thinDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  darkDivider: {
    height: 1,
    backgroundColor: PALETTE.darkDivider,
    marginTop: 6,
    marginBottom: 10,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  grandTotalValue: {
    fontFamily: 'Poppins',
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  bottomNoticeBox: {
    flexDirection: 'row',
    backgroundColor: PALETTE.blueBoxBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.blueBoxBorder,
    padding: 13,
    marginBottom: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  bottomNoticeText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.blueBoxText,
    lineHeight: 16.5,
  },
});
