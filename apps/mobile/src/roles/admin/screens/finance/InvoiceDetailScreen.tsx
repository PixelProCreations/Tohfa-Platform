import React, { useState } from 'react';
import {
  Alert,
  Modal,
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

export interface InvoiceDetailData {
  id: string;
  invoiceNumber: string;
  status: 'Issued' | 'Draft' | 'Cancelled';
  dateStr: string;
  soNumber: string;
  recipient: string;
  billingAddress: string;
  gstin: string;
  itemName: string;
  itemGrade: string;
  itemRate: string;
  itemTotal: string;
  taxableAmount: string;
  taxText: string;
  finalAmountText: string;
  historyEvents: { date: string; title: string }[];
  payoutInfo?: {
    payoutId: string;
    poNumber: string;
    farmerName: string;
    amount: string;
  };
}

export interface InvoiceDetailScreenProps {
  invoice: InvoiceDetailData;
  onBack: () => void;
}

export function InvoiceDetailScreen({ invoice, onBack }: InvoiceDetailScreenProps) {
  const [showIntimateModal, setShowIntimateModal] = useState(false);
  const [isIntimated, setIsIntimated] = useState(false);

  const payout = invoice.payoutInfo || {
    payoutId: 'PY-0005',
    poNumber: 'PO-0009',
    farmerName: 'Kumar',
    amount: '₹3,300.00',
  };

  const handleConfirmIntimate = () => {
    setShowIntimateModal(false);
    setIsIntimated(true);
    Alert.alert(
      'Payout Intimated',
      `Payout ${payout.payoutId} for ${payout.farmerName} (${payout.amount}) has been intimated to Accounts & Finance.`
    );
  };

  const isCancelled = invoice.status === 'Cancelled';
  const isIssued = invoice.status === 'Issued';

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
          accessibilityLabel="Back to Invoices"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice {invoice.invoiceNumber}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 1: Invoice Summary ── */}
        <Text style={styles.sectionHeading}>Invoice {invoice.invoiceNumber}</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice number</Text>
            <Text style={styles.detailValueBold}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text
              style={[
                styles.detailValueBold,
                isCancelled
                  ? { color: '#DC2626' }
                  : isIssued
                  ? { color: '#15803D' }
                  : { color: '#6D6761' },
              ]}
            >
              {invoice.status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice date</Text>
            <Text style={styles.detailValueBold}>{invoice.dateStr}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sales order</Text>
            <Text style={styles.detailValueBold}>{invoice.soNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValueBold}>{invoice.recipient}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Billing address</Text>
            <Text style={styles.detailValueBold}>{invoice.billingAddress || '—'}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>GSTIN</Text>
            <Text style={styles.detailValueBold}>{invoice.gstin || 'Not applicable'}</Text>
          </View>
        </View>

        {/* ── Section 2: Items ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Items</Text>
        <View style={styles.card}>
          <View style={styles.itemHeaderRow}>
            <Text style={styles.itemTitle}>{invoice.itemName} · {invoice.itemGrade}</Text>
            <Text style={styles.itemTotalText}>{invoice.itemTotal}</Text>
          </View>
          <Text style={styles.itemRateText}>{invoice.itemRate}</Text>
        </View>

        <View style={[styles.card, { marginTop: 10 }]}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Taxable amount</Text>
            <Text style={styles.detailValueBold}>{invoice.taxableAmount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tax</Text>
            <Text style={styles.detailValueBold}>{invoice.taxText}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Final invoice amount</Text>
            <Text style={styles.detailValueBold}>{invoice.finalAmountText}</Text>
          </View>
        </View>

        {/* ── Section 3: Invoice History ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Invoice history</Text>
        <View style={styles.card}>
          {invoice.historyEvents.map((evt, idx) => {
            const isLast = idx === invoice.historyEvents.length - 1;
            return (
              <View
                key={idx}
                style={[styles.historyRow, isLast && styles.detailRowLast]}
              >
                <Text style={styles.historyMeta}>{evt.date}</Text>
                <Text style={styles.historyTitle}>{evt.title}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Bottom Action Button: Intimate Payout ── */}
        <TouchableOpacity
          style={[styles.intimateBtn, isIntimated && styles.intimateBtnDone]}
          onPress={() => setShowIntimateModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.intimateBtnText}>
            {isIntimated ? 'Payout Intimated' : 'Intimate Payout'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* ── Image 5: Intimate This Payout? Modal Popup ── */}
      <Modal
        visible={showIntimateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowIntimateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowIntimateModal(false)}
        >
          <TouchableOpacity
            style={styles.modalSheet}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalSheetTitle}>Intimate this payout?</Text>

            <View style={styles.modalCard}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Payout</Text>
                <Text style={styles.modalValueBold}>
                  {payout.payoutId} · PO {payout.poNumber}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Farmer</Text>
                <Text style={styles.modalValueBold}>{payout.farmerName}</Text>
              </View>
              <View style={[styles.modalRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.modalLabel}>Amount</Text>
                <Text style={styles.modalValueBold}>{payout.amount}</Text>
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmIntimate}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Intimate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowIntimateModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    fontSize: 14.5,
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
    paddingVertical: 8,
    ...adminShadow.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 12.5,
    color: '#6D6761',
    fontWeight: '500',
  },
  detailValueBold: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    maxWidth: '60%',
    textAlign: 'right',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  itemTotalText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  itemRateText: {
    fontSize: 12,
    color: '#6D6761',
    marginTop: 4,
    paddingBottom: 4,
  },
  historyRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  historyMeta: {
    fontSize: 11,
    color: '#786F68',
    marginBottom: 2,
  },
  historyTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  intimateBtn: {
    marginTop: 24,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intimateBtnDone: {
    backgroundColor: '#FFF4EC',
  },
  intimateBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.brand,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 14,
  },
  modalCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEAE2',
  },
  modalLabel: {
    fontSize: 12.5,
    color: '#6D6761',
    fontWeight: '500',
  },
  modalValueBold: {
    fontSize: 13,
    color: adminColors.ink,
    fontWeight: '800',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.brand,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#4A4A4A',
  },
});
