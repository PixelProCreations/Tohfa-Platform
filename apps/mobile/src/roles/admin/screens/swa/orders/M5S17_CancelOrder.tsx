import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SWA_TYPOGRAPHY } from '../constants';

interface M5S17Props {
  orderId?: string;
  initialStep?: 'form' | 'confirm' | 'cancelled';
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke="#64748B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CancelCircleWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleOrangeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke="#C2410C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleRedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BigRedCrossCircleIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function DocumentWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const REASONS = [
  'Select Reason',
  'Customer request',
  'Stock not available',
  'Duplicate order',
  'Payment issue',
  'Delivery address issue',
  'Other',
];

export const M5S17_CancelOrder: React.FC<M5S17Props> = ({
  orderId = 'ORD-1024',
  initialStep = 'form',
  onNavigate,
  onBack,
}) => {
  const [step, setStep] = useState<'form' | 'confirm' | 'cancelled'>(initialStep);
  const [selectedReason, setSelectedReason] = useState('Select Reason');
  const [showReasonPicker, setShowReasonPicker] = useState(false);

  // ─── STATE 3: Order Cancelled (Image 5 Left) ──────────────────────────────
  if (step === 'cancelled') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => onNavigate('M5S01')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Cancelled</Text>
          </View>

          <View style={styles.contentPacked}>
            {/* Centered Red Cross Badge */}
            <View style={styles.heroContainer}>
              <View style={styles.cancelCircleBadge}>
                <BigRedCrossCircleIcon />
              </View>
              <Text style={styles.heroTitle}>Order Cancelled</Text>
            </View>

            {/* Summary Card */}
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Order</Text>
                  <Text style={styles.fieldValue}>{orderId}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <Text style={styles.fieldValue}>Cancelled</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Fixed Action Button */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate('M5S01')}
            >
              <DocumentWhiteIcon />
              <Text style={styles.primaryBtnText}>Back to Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STATE 2: Confirm Cancellation (Image 4 Right) ────────────────────────
  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => setStep('form')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirm Cancellation</Text>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Amber Alert Banner */}
            <View style={styles.confirmPromptBox}>
              <WarningTriangleOrangeIcon />
              <Text style={styles.confirmPromptText}>Cancel this order?</Text>
            </View>

            {/* Order Card */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Order</Text>
              <Text style={styles.fieldValueBold}>{orderId}</Text>
            </View>

            {/* Red Notice Box */}
            <View style={[styles.redAlertBox, { marginTop: 14 }]}>
              <InfoCircleRedIcon />
              <Text style={styles.redAlertText}>
                This action cannot be undone. No refund logic is created here unless the payment/refund service supports it.
              </Text>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Bottom Stacked Buttons matching Image 4 Right */}
          <View style={styles.bottomBarStacked}>
            <TouchableOpacity
              style={styles.confirmCancelBtn}
              activeOpacity={0.8}
              onPress={() => setStep('cancelled')}
            >
              <CheckmarkWhiteIcon />
              <Text style={styles.confirmCancelBtnText}>Cancel Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepOrderBtn}
              activeOpacity={0.8}
              onPress={() => setStep('form')}
            >
              <Text style={styles.keepOrderBtnText}>Keep Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STATE 1: Cancel Order Form (Image 4 Middle) ──────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cancel Order</Text>
        </View>

        {/* Subtitle directly below header */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{orderId}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Summary Section */}
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Customer</Text>
                <Text style={styles.fieldValue}>Arun Kumar</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Total</Text>
                <Text style={styles.fieldValue}>₹850</Text>
              </View>
            </View>

            <View style={[styles.singleRow, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Current Status</Text>
              <Text style={styles.fieldValue}>Confirmed</Text>
            </View>
          </View>

          {/* Cancellation Reason Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Cancellation Reason</Text>
            <Text style={styles.requiredText}>Required</Text>
          </View>

          {/* Dropdown Box */}
          <TouchableOpacity
            style={styles.dropdownBox}
            activeOpacity={0.7}
            onPress={() => setShowReasonPicker(true)}
          >
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownLabel}>REASON</Text>
              <Text style={styles.dropdownValue}>{selectedReason}</Text>
            </View>
            <ChevronDownIcon />
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button matching Image 4 Middle */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.8}
            onPress={() => setStep('confirm')}
          >
            <CancelCircleWhiteIcon />
            <Text style={styles.primaryBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>

        {/* Reason Picker Modal */}
        <Modal
          visible={showReasonPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowReasonPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowReasonPicker(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Cancellation Reason</Text>
              {REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.modalOption,
                    selectedReason === reason && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedReason(reason);
                    setShowReasonPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedReason === reason && styles.modalOptionTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    backgroundColor: '#E85226',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    marginRight: 14,
    padding: 2,
  },
  headerTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitleRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FAF8F5',
  },
  subtitleText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8C7A6B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  requiredText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
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
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 4,
  },
  fieldValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
  },
  fieldValueBold: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
  },
  dropdownBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  dropdownContent: {
    flex: 1,
  },
  dropdownLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dropdownValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  confirmPromptBox: {
    backgroundColor: '#FEF9EE',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  confirmPromptText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#9A3412',
  },
  redAlertBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  redAlertText: {
    flex: 1,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#B91C1C',
    lineHeight: 16,
  },
  bottomBar: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  bottomBarStacked: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  primaryBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmCancelBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  confirmCancelBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  keepOrderBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepOrderBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },

  // ─── Cancelled Screen Styles (Image 5 Left) ───────────────────────────────
  contentPacked: {
    flex: 1,
    paddingTop: 36,
    paddingHorizontal: 16,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  cancelCircleBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 19,
    fontWeight: '700',
    color: '#1D2420',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  modalTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
    marginBottom: 12,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#FFF7ED',
  },
  modalOptionText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    color: '#334155',
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: '#E85226',
  },
});
