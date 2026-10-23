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
import { adminColors, adminRadius, adminShadow, adminSpacing } from '../../theme';
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

export interface PurchaseOrderDetailScreenProps {
  order: PurchaseOrderRecord;
  onBack: () => void;
  onOpenReceipt: () => void;
}

export function PurchaseOrderDetailScreen({
  order,
  onBack,
  onOpenReceipt,
}: PurchaseOrderDetailScreenProps) {
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
          accessibilityLabel="Back to purchase orders"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase order {order.poNumber}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section Title ── */}
        <Text style={styles.sectionHeading}>Purchase order {order.poNumber}</Text>

        {/* ── Main Details Card ── */}
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
            <Text style={styles.detailLabel}>Original listing price</Text>
            <Text style={styles.detailValueBold}>₹{order.unitPrice.toFixed(2)}/kg</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Accepted counter-offer</Text>
            <Text style={styles.detailValueBold}>None</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Final agreed terms</Text>
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
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValueBold}>{order.dateStr}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Receipt status</Text>
            <Text style={styles.detailValueBold}>{order.receiptStatus}</Text>
          </View>

          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>PO status</Text>
            <Text style={styles.detailValueBold}>{order.purchaseStatus}</Text>
          </View>
        </View>

        {/* ── Activity Section ── */}
        <Text style={[styles.sectionHeading, { marginTop: 22 }]}>Activity</Text>
        <View style={styles.activityBlock}>
          <Text style={styles.activityMeta}>{order.dateStr}, 09:00 · System</Text>
          <Text style={styles.activityTitle}>
            Purchase order generated: From listing {order.listingCode}
          </Text>
          <View style={styles.activityDivider} />
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.openReceiptButton}
            onPress={onOpenReceipt}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open Goods Receipt"
          >
            <Text style={styles.openReceiptButtonText}>Open Goods Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
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
    paddingVertical: 10,
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
  activityBlock: {
    marginTop: 4,
  },
  activityMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: '#786F68',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1714',
    marginBottom: 12,
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#EAE4DC',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  openReceiptButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  openReceiptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1714',
  },
  closeButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1714',
  },
});
