import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { adminColors, adminShadow, adminSpacing } from '../../theme';
import type { PurchaseOrderRecord } from './PurchaseSalesOrdersScreen';

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

export interface PurchaseOrderReceiptScreenProps {
  order: PurchaseOrderRecord;
  onBack: () => void;
}

export function PurchaseOrderReceiptScreen({
  order,
  onBack,
}: PurchaseOrderReceiptScreenProps) {
  const qualityChecks = [
    { id: '1', title: '1. Appearance', result: 'Pass', notes: '—', evidence: '—' },
    { id: '2', title: '2. Size Uniformity', result: 'Pass', notes: '—', evidence: '—' },
    { id: '3', title: '3. Moisture', result: 'Pass', notes: '—', evidence: '—' },
    { id: '4', title: '4. Damage / Pest', result: 'Pass', notes: '—', evidence: '—' },
    { id: '5', title: '5. Freshness', result: 'Pass', notes: '—', evidence: '—' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{order.poNumber} · Receipt</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. PO Summary ── */}
        <Text style={styles.sectionHeading}>PO summary</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PO number</Text>
            <Text style={styles.detailValueBold}>{order.poNumber}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Source listing</Text>
            <Text style={styles.detailValueBold}>{order.listingCode}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Farmer</Text>
            <Text style={styles.detailValueBold}>
              {order.farmerName} (FMR-00098)
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product, grade</Text>
            <Text style={styles.detailValueBold}>
              {order.produceName} · {order.grade}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ordered quantity</Text>
            <Text style={styles.detailValueBold}>{order.quantityKg} kg</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Agreed unit price</Text>
            <Text style={styles.detailValueBold}>₹{order.unitPrice.toFixed(2)}/kg</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total amount</Text>
            <Text style={styles.detailValueBold}>
              ₹{order.unitPrice.toFixed(2)}/kg · total ₹
              {order.totalPrice.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Warehouse</Text>
            <Text style={styles.detailValueBold}>{order.warehouse}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purchase status</Text>
            <Text style={styles.detailValueBold}>{order.purchaseStatus}</Text>
          </View>

          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Listing negotiation</Text>
            <Text style={styles.detailValueBold}>
              No counter-offer (original price ₹{order.unitPrice.toFixed(2)}/kg)
            </Text>
          </View>
        </View>

        {/* ── 2. Goods Receipt ── */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Goods receipt</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Goods receipt ID</Text>
            <Text style={styles.detailValueBold}>GR-0008</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Received</Text>
            <Text style={styles.detailValueBold}>2 Oct 2026, 11:00</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PO number</Text>
            <Text style={styles.detailValueBold}>{order.poNumber}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Warehouse</Text>
            <Text style={styles.detailValueBold}>{order.warehouse}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gross quantity</Text>
            <Text style={styles.detailValueBold}>{order.quantityKg} kg</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Receipt notes</Text>
            <Text style={[styles.detailValueBold, { color: '#786F68', fontWeight: '500' }]}>
              (placeholder)
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Receipt photos</Text>
            <Text style={styles.detailValueBold}>receipt-GR-0008.jpg</Text>
          </View>

          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Recorded by</Text>
            <Text style={styles.detailValueBold}>Ooty Warehouse Admin</Text>
          </View>
        </View>

        {/* ── 3. Quality Check ── */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Quality check</Text>
        {qualityChecks.map((qc) => (
          <View key={qc.id} style={[styles.card, { marginBottom: 12 }]}>
            <Text style={styles.qualityCheckTitle}>{qc.title}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Result</Text>
              <Text style={styles.detailValueBold}>{qc.result}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValueBold}>{qc.notes}</Text>
            </View>
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Evidence</Text>
              <Text style={styles.detailValueBold}>{qc.evidence}</Text>
            </View>
          </View>
        ))}

        {/* ── 4. Decision ── */}
        <Text style={[styles.sectionHeading, { marginTop: 12 }]}>Decision</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Outcome</Text>
            <Text style={styles.detailValueBold}>Accepted</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gross quantity</Text>
            <Text style={styles.detailValueBold}>{order.quantityKg} kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Accepted quantity</Text>
            <Text style={styles.detailValueBold}>{order.quantityKg} kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rejected quantity</Text>
            <Text style={styles.detailValueBold}>0 kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Unaccounted</Text>
            <Text style={styles.detailValueBold}>0 kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rejection reason</Text>
            <Text style={styles.detailValueBold}>—</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Decision notes</Text>
            <Text style={styles.detailValueBold}>—</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Decision by</Text>
            <Text style={styles.detailValueBold}>Demo Warehouse Admin</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Decision date</Text>
            <Text style={styles.detailValueBold}>2 Oct 2026, 14:00</Text>
          </View>
        </View>

        {/* Inventory Queue Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Queued for Inventory & Warehouse (HO-0005).
          </Text>
        </View>

        {/* ── 5. Quality Counter-Offer ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Quality counter-offer</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Listing negotiation</Text>
            <Text style={styles.detailValueBold}>No counter-offer</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Goods receipt</Text>
            <Text style={styles.detailValueBold}>GR-0008 · PO {order.poNumber}</Text>
          </View>
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: 8,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: 16,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8A4A00',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...adminShadow.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9.5,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE9',
    borderStyle: 'dashed',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#786F68',
    flex: 1,
  },
  detailValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1714',
    textAlign: 'right',
    flexShrink: 1,
  },
  qualityCheckTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F1714',
    paddingTop: 10,
    paddingBottom: 4,
  },
  infoBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1714',
  },
});
