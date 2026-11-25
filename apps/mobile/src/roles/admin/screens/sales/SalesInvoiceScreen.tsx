import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import { getInvoiceDownloadUrl } from '../../api/invoices';
import { t } from '../../i18n';
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

import { ADMIN_NO_VALUE } from '../../utils/noValue';

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface SalesInvoiceScreenProps {
  invoiceId?: string;
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
  invoiceId,
  orderNumber = ADMIN_NO_VALUE,
  customerName = ADMIN_NO_VALUE,
  warehouse = ADMIN_NO_VALUE,
  date = ADMIN_NO_VALUE,
  invoiceNumber = ADMIN_NO_VALUE,
  items = [],
  total,
  onBack,
}: SalesInvoiceScreenProps) {
  const [downloading, setDownloading] = useState(false);

  const canDownload = Boolean(invoiceId && !downloading);

  const handleDownloadPdf = async () => {
    if (!invoiceId || downloading) return;
    setDownloading(true);
    try {
      const signedUrl = await getInvoiceDownloadUrl(invoiceId);
      await Linking.openURL(signedUrl);
    } catch {
      Alert.alert(t('wiringSales.invoice.downloadPdf'), t('wiringSales.invoice.downloadFailed'), [{ text: 'OK' }]);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={SALES_PALETTE.pageBg} />
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
            {invoiceNumber}
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
            <View style={styles.itemRow}>
              <Text style={styles.itemDescMuted}>{t('wiringSales.invoice.taxBreakdownUnavailable')}</Text>
              <Text style={styles.itemAmountMuted}>{ADMIN_NO_VALUE}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Total row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{total !== undefined ? `₹${total}` : ADMIN_NO_VALUE}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.generatePdfBtn, !canDownload && { opacity: 0.45 }]}
            onPress={canDownload ? () => { void handleDownloadPdf(); } : undefined}
            disabled={!canDownload}
            accessibilityState={{ disabled: !canDownload }}
            activeOpacity={0.85}
          >
            <DocPdfIcon color="#FFFFFF" size={16} />
            <Text style={styles.generatePdfBtnText}>{t('wiringSales.invoice.downloadPdf')}</Text>
          </TouchableOpacity>
          {!invoiceId ? (
            <Text style={styles.itemDescMuted}>{t('wiringSales.invoice.downloadUnavailable')}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.gstInvoiceBtn, { opacity: 0.45 }]}
            disabled
            accessibilityState={{ disabled: true }}
            accessibilityHint={t('wiringSales.invoice.gstToggleUnavailable')}
            activeOpacity={0.7}
          >
            <DocPdfIcon color="#1F1714" size={16} />
            <Text style={styles.gstInvoiceBtnText}>
              {t('wiringSales.invoice.gstToggleUnavailable')}
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
