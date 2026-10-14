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
import Svg, { Path } from 'react-native-svg';
import {
  BackChevronIcon,
  SALES_PALETTE,
} from './SalesChannelOverviewScreen';

function DocPdfIcon({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface SalesInvoiceScreenProps {
  orderNumber?: string;
  customerName?: string;
  warehouse?: string;
  date?: string;
  invoiceNumber?: string;
  items?: InvoiceItem[];
  total?: number;
  onBack?: () => void;
}

export function SalesInvoiceScreen({
  orderNumber = 'ORD-20260909-0084',
  customerName = 'Ramesh P.',
  warehouse = 'Gudalur Warehouse',
  date = 'Sep 9, 2026',
  invoiceNumber = 'Invoice #INV-20260909-084',
  items = [
    { description: 'Cabbage — 2kg @ ₹28/kg', amount: 56 },
    { description: 'Carrots — 1kg @ ₹39/kg', amount: 39 },
  ],
  total = 95,
  onBack,
}: SalesInvoiceScreenProps) {
  const [isGst, setIsGst] = useState(false);

  const handleGeneratePdf = () => {
    Alert.alert(
      'Invoice PDF Generated',
      `${invoiceNumber} has been generated and queued for download/print.`,
      [{ text: 'OK' }]
    );
  };

  const handleToggleGst = () => {
    setIsGst(!isGst);
    Alert.alert(
      'GST Invoice Mode',
      isGst
        ? 'Switched to Standard Customer Invoice'
        : 'Switched to B2B Tax / GST Invoice format with HSN 0709 codes and 5% GST breakdown.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={SALES_PALETTE.pageBg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Invoice</Text>
          <Text style={styles.screenSubtitle}>
            {orderNumber} · {customerName}
          </Text>
        </View>

        {/* Invoice Card */}
        <View style={styles.invoiceCard}>
          {/* Header row */}
          <View style={styles.invoiceTopRow}>
            <Text style={styles.brandTitle}>TOHFA</Text>
            <View style={styles.warehouseDetails}>
              <Text style={styles.dateText}>{date}</Text>
              <Text style={styles.warehouseText}>{warehouse}</Text>
            </View>
          </View>

          {/* Invoice ID */}
          <Text style={styles.invoiceIdText}>
            {isGst ? `Tax ${invoiceNumber}-GST` : invoiceNumber}
          </Text>

          <View style={styles.divider} />

          {/* Line items */}
          <View style={styles.itemsList}>
            {items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemAmount}>₹{item.amount}</Text>
              </View>
            ))}
            {isGst && (
              <View style={styles.itemRow}>
                <Text style={styles.itemDescMuted}>CGST 2.5% + SGST 2.5% (included)</Text>
                <Text style={styles.itemAmountMuted}>₹{((total * 0.05) / 1.05).toFixed(2)}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Total row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{total}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.generatePdfBtn}
            onPress={handleGeneratePdf}
            activeOpacity={0.85}
          >
            <DocPdfIcon color="#FFFFFF" size={16} />
            <Text style={styles.generatePdfBtnText}>Generate Invoice PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gstInvoiceBtn}
            onPress={handleToggleGst}
            activeOpacity={0.7}
          >
            <DocPdfIcon color="#1F1714" size={16} />
            <Text style={styles.gstInvoiceBtnText}>
              {isGst ? 'Generate Standard Invoice Instead' : 'Generate GST Invoice Instead'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  titleBlock: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: SALES_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: SALES_PALETTE.textSecondary,
    lineHeight: 18,
  },
  invoiceCard: {
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  invoiceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: SALES_PALETTE.textHeading,
    letterSpacing: 1,
  },
  warehouseDetails: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 11,
    color: SALES_PALETTE.textSecondary,
    marginBottom: 2,
  },
  warehouseText: {
    fontSize: 11,
    color: SALES_PALETTE.textSecondary,
  },
  invoiceIdText: {
    fontSize: 12,
    color: SALES_PALETTE.textMuted,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0ECE6',
    marginVertical: 12,
  },
  itemsList: {
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemDesc: {
    fontSize: 13,
    color: SALES_PALETTE.textPrimary,
    fontWeight: '500',
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: SALES_PALETTE.textPrimary,
  },
  itemDescMuted: {
    fontSize: 11,
    color: SALES_PALETTE.textSecondary,
    fontStyle: 'italic',
  },
  itemAmountMuted: {
    fontSize: 11,
    color: SALES_PALETTE.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
  },
  actionButtonsContainer: {
    gap: 12,
  },
  generatePdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SALES_PALETTE.primaryOrange,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 8,
    shadowColor: SALES_PALETTE.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  generatePdfBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gstInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    gap: 8,
  },
  gstInvoiceBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: SALES_PALETTE.textPrimary,
  },
});
