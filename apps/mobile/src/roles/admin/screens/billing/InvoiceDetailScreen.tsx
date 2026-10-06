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
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A', // Brand warm orange (not yellow!)
  headerBg: '#F0562A',
  pageBg: '#F3EFE9', // Soft warm cream page background
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted: '#5F5E5A',
  orangeDeep: '#7A2E14',
  orangeGrandTotal: '#B5471A', // Distinct warm orange/brown for Grand Total in design
  tableHeaderBg: '#FEF3E2', // Warning BG / Warm light banner
  tableHeaderCol: '#7A4B2A',
  greenBadge: '#EAF3DE',
  greenText: '#173404',
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

function DownloadTrayIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v11M7.5 9.5l4.5 4.5 4.5-4.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export interface InvoiceDetailScreenProps {
  invoiceId?: string;
  onBack?: () => void;
  onNavigateToDownload?: () => void;
}

export function InvoiceDetailScreen({
  invoiceId = 'INV-2026-001245',
  onBack,
  onNavigateToDownload,
}: InvoiceDetailScreenProps) {
  const items = [
    { product: 'Tomato G1', qty: '10 KG', price: '₹100', amount: '₹1,000' },
    { product: 'Carrot G1', qty: '5 KG', price: '₹100', amount: '₹500' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.headerTitle}>Invoice Detail</Text>
              <Text style={styles.headerSubtitle}>{invoiceId} · Generated</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.downloadIconBtn}
            onPress={onNavigateToDownload}
            activeOpacity={0.7}
          >
            <DownloadTrayIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* TOHFA Brand Card */}
        <View style={styles.brandCard}>
          <Text style={styles.brandName}>TOHFA</Text>
          <Text style={styles.brandSub}>Invoice · {invoiceId} · 28 Sep 2026</Text>
        </View>

        {/* Customer Information */}
        <Text style={styles.sectionHeader}>Customer Information</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Customer</Text>
          <Text style={styles.infoValue}>Arun Kumar</Text>

          <View style={{ height: 12 }} />

          <Text style={styles.infoLabel}>Order ID</Text>
          <Text style={styles.infoValue}>ORD-2026-00982</Text>
        </View>

        {/* Product Details Table */}
        <Text style={styles.sectionHeader}>Product Details</Text>
        <View style={styles.tableCard}>
          {/* Table Header Strip with peach/warm cream bg */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colHeader, { flex: 2 }]}>PRODUCT</Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>QTY</Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>PRICE</Text>
            <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'right' }]}>AMOUNT</Text>
          </View>

          {/* Product Items */}
          {items.map((row, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.cellText, { flex: 2 }]}>{row.product}</Text>
              <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{row.qty}</Text>
              <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>{row.price}</Text>
              <Text style={[styles.cellText, { flex: 1.2, textAlign: 'right' }]}>{row.amount}</Text>
            </View>
          ))}

          <View style={styles.tableDivider} />

          {/* Subtotal */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹1,500</Text>
          </View>

          <View style={styles.tableDivider} />

          {/* Grand Total - Orange Theme matching left design */}
          <View style={styles.summaryRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹1,600</Text>
          </View>
        </View>

        {/* Traceability / Privacy Disclaimer Note */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            This customer-facing invoice never exposes farmer name, farm location, village, GPS, or internal listing ID.
          </Text>
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Sticky Bottom Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onNavigateToDownload}
          activeOpacity={0.8}
        >
          <DownloadTrayIcon size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Download Invoice</Text>
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
    marginTop: 2,
  },
  downloadIconBtn: {
    padding: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 8,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  brandCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  brandSub: {
    fontSize: 11,
    color: PALETTE.textMuted,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: PALETTE.textMuted,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  tableCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: PALETTE.tableHeaderBg,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  colHeader: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PALETTE.tableHeaderCol,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cellText: {
    fontSize: 12.5,
    color: PALETTE.textInk,
    fontWeight: '600',
  },
  tableDivider: {
    height: 1,
    backgroundColor: '#F0E7DD',
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  summaryValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  grandTotalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.orangeGrandTotal,
  },
  grandTotalValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.orangeGrandTotal,
  },
  disclaimerBox: {
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 10.5,
    color: PALETTE.textMuted,
    lineHeight: 15,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
