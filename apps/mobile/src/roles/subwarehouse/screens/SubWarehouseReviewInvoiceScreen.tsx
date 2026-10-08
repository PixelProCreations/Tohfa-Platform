import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#6B7280',
  border:        '#E7E2D6',
  stepGreen:     '#10B981',
  stepOrange:    '#F0562A',
  stepInactive:  '#FED7AA',
  redError:      '#DC2626',
  redErrorBg:    '#FEE2E2',
};

// ─── SVG Icons ─────────────────────────────────────────────────────────────

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

function CheckmarkCircleIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ErrorCrossIcon({ size = 32, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
      <Path
        d="M15 9l-6 6M9 9l6 6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseReviewInvoiceScreenProps {
  onBack?: () => void;
  onGenerateSuccess?: () => void;
  invoiceData?: {
    invoiceType?: string;
    customerName?: string;
    itemsCount?: number;
    subtotal?: string;
    gst?: string;
    total?: string;
  };
}

export function SubWarehouseReviewInvoiceScreen({
  onBack,
  onGenerateSuccess,
  invoiceData = {
    invoiceType: 'Retail Sale',
    customerName: 'Ravi Kumar',
    itemsCount: 2,
    subtotal: '₹740',
    gst: '₹0',
    total: '₹740',
  },
}: SubWarehouseReviewInvoiceScreenProps): React.JSX.Element {
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateInvoice = () => {
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
      if (onGenerateSuccess) {
        onGenerateSuccess();
      }
    }, 400);
  };

  const handleRetry = () => {
    setShowFailureModal(false);
    handleGenerateInvoice();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <Text style={styles.headerTitle}>Review Invoice</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Step Indicator Dots (M9-S04) ─── */}
        <View style={styles.stepsRow}>
          <View style={[styles.stepDot, { backgroundColor: PALETTE.stepGreen }]} />
          <View style={[styles.stepDot, { backgroundColor: PALETTE.stepOrange, width: 22 }]} />
          <View style={[styles.stepDot, { backgroundColor: PALETTE.stepInactive }]} />
        </View>

        {/* ─── Review Invoice Card ─── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Review Invoice</Text>

          {/* Row 1: Invoice Type & Customer */}
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Invoice Type</Text>
              <Text style={styles.fieldValue}>{invoiceData.invoiceType}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldValue}>{invoiceData.customerName}</Text>
            </View>
          </View>

          {/* Row 2: Items & Subtotal */}
          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Items</Text>
              <Text style={styles.fieldValue}>{invoiceData.itemsCount}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Subtotal</Text>
              <Text style={styles.fieldValue}>{invoiceData.subtotal}</Text>
            </View>
          </View>

          {/* Row 3: GST & Total */}
          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>GST</Text>
              <Text style={styles.fieldValue}>{invoiceData.gst}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Total</Text>
              <Text style={styles.fieldValue}>{invoiceData.total}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* ─── Bottom Fixed Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={handleGenerateInvoice}
          activeOpacity={0.85}
          disabled={isGenerating}
        >
          <CheckmarkCircleIcon size={20} color="#FFFFFF" />
          <Text style={styles.generateBtnText}>Generate Invoice</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Invoice Generation Failed Popup Modal ─── */}
      <Modal
        visible={showFailureModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFailureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <ErrorCrossIcon size={34} color={PALETTE.redError} />
            </View>

            <Text style={styles.modalTitle}>Invoice Generation Failed</Text>
            <Text style={styles.modalMessage}>
              Unable to generate invoice. Fiscal registration service is currently unreachable or timed out. Please check your network and retry.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={handleRetry}
                activeOpacity={0.8}
              >
                <Text style={styles.retryBtnText}>Retry Generation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowFailureModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
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
    gap: 10,
  },
  backButton: {
    paddingRight: 6,
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
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
    paddingBottom: 24,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    marginTop: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#EFEAE2',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PALETTE.redErrorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  modalMessage: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  retryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: PALETTE.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
