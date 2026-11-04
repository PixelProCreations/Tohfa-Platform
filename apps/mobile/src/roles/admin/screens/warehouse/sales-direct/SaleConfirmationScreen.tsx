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
import Svg, { Circle, Path } from 'react-native-svg';
import { adminColors, adminType, adminShadow } from '../../../theme';
import { BillingFlow, type BillingRouteParams } from '../billing-invoices';
import type { WarehouseScope, WarehouseScreenBaseProps } from './types';

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

export interface SaleConfirmationScreenProps extends WarehouseScreenBaseProps {
  saleId?: string | undefined;
  customerName?: string | undefined;
  customerCode?: string | undefined;
  paymentMethod?: string | undefined;
  totalAmount?: number | undefined;
  itemsCount?: number | undefined;
  saleWarehouse?: WarehouseScope | undefined;
  onViewInvoice?: (() => void) | undefined;
  onNewSale?: (() => void) | undefined;
}

export function SaleConfirmationScreen({
  saleId = 'SALE-00251',
  customerName = 'Rajesh Kumar',
  customerCode = 'CUS-00291',
  paymentMethod = 'Cash',
  totalAmount = 320,
  itemsCount = 2,
  saleWarehouse,
  onViewInvoice,
  onNewSale,
  scope,
  can,
}: SaleConfirmationScreenProps) {
  const [showInvoiceScreen, setShowInvoiceScreen] = useState(false);
  const canShowInvoice = can ? can('invoice.generate') : true;
  const warehouseLabel =
    saleWarehouse?.warehouseName?.replace(/ Warehouse$/, '') ??
    scope.warehouseName?.replace(/ Warehouse$/, '') ??
    'Coonoor';

  const invoiceParams = useMemo<BillingRouteParams>(
    () => ({
      review: {
        invoiceType: 'Direct Sale',
        customerName,
        itemsCount,
        subtotal: `₹${totalAmount}`,
        gst: '₹0',
        total: `₹${totalAmount}`,
      },
    }),
    [customerName, itemsCount, totalAmount],
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

  if (showInvoiceScreen) {
    return (
      <BillingFlow
        scope={saleWarehouse?.warehouseId ? saleWarehouse : scope}
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

      {/* ─── Top Brand Header Banner (No back button per design) ─── */}
      <View style={styles.headerBanner}>
        <Text style={styles.headerTitle}>Sale Confirmation</Text>
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
              <Text style={styles.valueBold}>{warehouseLabel}</Text>
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
          activeOpacity={0.85}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
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
    paddingVertical: 18,
    gap: 12,
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.ink,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '700',
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCol: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 4,
  },
  valueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  customerCode: {
    fontSize: 12.5,
    color: adminColors.muted,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: adminColors.ink,
    marginBottom: 2,
  },
  productGrade: {
    fontSize: 12.5,
    color: adminColors.muted,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 12,
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
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  viewInvoiceBtnText: {
    color: adminColors.onBrand,
    ...adminType.title,
    fontSize: 16,
  },
  newSaleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  newSaleBtnText: {
    color: adminColors.brand,
    ...adminType.title,
    fontSize: 16,
  },
});
