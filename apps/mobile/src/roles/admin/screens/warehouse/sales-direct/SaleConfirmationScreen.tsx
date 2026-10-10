import React, { useMemo, useState } from 'react';
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
import { adminColors, adminType } from '../../../theme';
import { BillingFlow, type BillingRouteParams } from '../billing-invoices';
import type { PermissionCheck, WarehouseScope } from '../finance-expenses';

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

function SuccessCheckIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx="16" cy="16" r="14" stroke={adminColors.success.text} strokeWidth="2.5" />
      <Path
        d="M10 16.5l4 4 8-8"
        stroke={adminColors.success.text}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InvoiceIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function ShieldCheckIcon({ size = 16, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SaleConfirmationScreenProps {
  saleId?: string | undefined;
  customerName?: string | undefined;
  customerCode?: string | undefined;
  paymentMethod?: string | undefined;
  totalAmount?: number | undefined;
  onBack?: (() => void) | undefined;
  onViewInvoice?: (() => void) | undefined;
  onNewSale?: (() => void) | undefined;
  /**
   * Needed only for the inline invoice fallback (no onViewInvoice): the shared
   * billing flow is scoped and permission-gated. Without them the fallback is
   * not offered (fail closed).
   */
  scope?: WarehouseScope | undefined;
  can?: PermissionCheck | undefined;
}

export function SaleConfirmationScreen({
  saleId = 'SALE-00251',
  customerName = 'Rajesh Kumar',
  customerCode = 'CUS-00291',
  paymentMethod = 'Cash',
  totalAmount = 320,
  onBack,
  onViewInvoice,
  onNewSale,
  scope,
  can,
}: SaleConfirmationScreenProps) {
  const [showInvoiceScreen, setShowInvoiceScreen] = useState(false);
  const canShowInvoice = onViewInvoice !== undefined || (scope !== undefined && can !== undefined);
  // Post-sale entry of the invoice wizard: opens on its Review step (W4).
  const invoiceParams = useMemo<BillingRouteParams>(
    () => ({
      review: {
        invoiceType: 'Direct Sale',
        customerName,
        itemsCount: 2,
        subtotal: `₹${totalAmount}`,
        gst: '₹0',
        total: `₹${totalAmount}`,
      },
    }),
    [customerName, totalAmount],
  );

  const handleViewInvoice = () => {
    if (onViewInvoice) {
      onViewInvoice();
    } else {
      setShowInvoiceScreen(true);
    }
  };

  const handleNewSale = () => {
    if (onNewSale) {
      onNewSale();
    } else {
      Alert.alert('New Sale', 'Starting a new sale...');
    }
  };

  if (showInvoiceScreen && scope && can) {
    return (
      <BillingFlow
        scope={scope}
        can={can}
        initialScreen="InvoiceWizard"
        initialParams={invoiceParams}
        onBack={() => setShowInvoiceScreen(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            accessibilityLabel="Back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sale Confirmation</Text>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Success Badge & Title ─── */}
        <View style={styles.successSection}>
          <View style={styles.successCircle}>
            <SuccessCheckIcon size={34} />
          </View>
          <Text style={styles.successTitle}>Sale Completed</Text>
        </View>

        {/* ─── 1. Sale Information ─── */}
        <Text style={styles.sectionHeading}>Sale Information</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Sale ID</Text>
              <Text style={styles.valueBold}>{saleId}</Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.valueBold}>24 Sep, 6:35 PM</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Warehouse</Text>
              <Text style={styles.valueBold}>Coonoor</Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.label}>Channel</Text>
              <Text style={styles.valueBold}>Direct Sale</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Customer ─── */}
        <Text style={styles.sectionHeading}>Customer</Text>
        <View style={styles.card}>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.customerCode}>{customerCode}</Text>
        </View>

        {/* ─── 3. Products ─── */}
        <Text style={styles.sectionHeading}>Products</Text>
        <View style={styles.card}>
          <View style={styles.productRow}>
            <View>
              <Text style={styles.productName}>Tomato</Text>
              <Text style={styles.productGrade}>Grade 1 · 2 KG</Text>
            </View>
            <Text style={styles.productPrice}>₹200</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.productRow}>
            <View>
              <Text style={styles.productName}>Carrot</Text>
              <Text style={styles.productGrade}>Grade 1 · 1 KG</Text>
            </View>
            <Text style={styles.productPrice}>₹120</Text>
          </View>
        </View>

        {/* ─── 4. Payment ─── */}
        <Text style={styles.sectionHeading}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Method</Text>
              <Text style={styles.valueBold}>{paymentMethod}</Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.valueBold}>Paid</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.valueBold}>₹{totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* ─── 5. Invoice ─── */}
        <Text style={styles.sectionHeading}>Invoice</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Invoice Number</Text>
          <Text style={styles.valueBold}>INV-00251</Text>
        </View>

        {/* ─── Server Confirmation Notice ─── */}
        <View style={styles.serverNoticeBanner}>
          <ShieldCheckIcon size={18} color={adminColors.success.text} />
          <Text style={styles.serverNoticeText}>
            This screen only ever appears after the server confirms payment, sale, and the inventory ledger movement together — never on a local/optimistic success.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Bottom Actions ─── */}
      <View style={styles.bottomBar}>
        {canShowInvoice && (
          <TouchableOpacity
            style={styles.viewInvoiceBtn}
            onPress={handleViewInvoice}
            activeOpacity={0.85}
          >
            <InvoiceIcon size={18} color={adminColors.onBrand} />
            <Text style={styles.viewInvoiceBtnText}>View Invoice</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.newSaleBtn}
          onPress={handleNewSale}
          activeOpacity={0.75}
        >
          <Text style={styles.newSaleBtnText}>New Sale</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    minHeight: 36,
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
    textAlign: 'left',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  successSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  successTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 12,
    marginBottom: 8,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  label: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 4,
  },
  valueBold: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  customerName: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 2,
  },
  customerCode: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  productName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 2,
  },
  productGrade: {
    ...adminType.body,
    color: adminColors.muted,
  },
  productPrice: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 10,
  },
  serverNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.success.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginTop: 14,
    marginBottom: 10,
  },
  serverNoticeText: {
    flex: 1,
    ...adminType.rowMeta,
    color: adminColors.success.text,
    lineHeight: 16.5,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: adminColors.canvas,
    gap: 10,
  },
  viewInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  viewInvoiceBtnText: {
    color: adminColors.onBrand,
    ...adminType.sectionHead,
  },
  newSaleBtn: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSaleBtnText: {
    color: adminColors.brand,
    ...adminType.sectionHead,
  },
});
