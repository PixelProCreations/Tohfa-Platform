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
import { ORDERS_THEME } from './theme';

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
        stroke={ORDERS_THEME.textSecondary}
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
        stroke={ORDERS_THEME.warning}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={ORDERS_THEME.warning} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleRedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={ORDERS_THEME.danger} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={ORDERS_THEME.danger} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BigRedCrossCircleIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={ORDERS_THEME.danger} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={ORDERS_THEME.danger} strokeWidth="2.4" strokeLinecap="round" />
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

export const M5S17_CancelOrder: React.FC<M5S17Props> = ({
  orderId = 'ORD-1024',
  initialStep = 'form',
  onNavigate,
  onBack,
}) => {
  const [step, setStep] = useState<'form' | 'confirm' | 'cancelled'>(initialStep);
  const [reason, setReason] = useState('Select cancellation reason');
  const [showReasonPicker, setShowReasonPicker] = useState(false);

  const reasons = [
    'Customer Requested Cancellation',
    'Item Out of Stock',
    'Delivery Unserviceable',
    'Duplicate Order',
    'Payment Failed',
    'Customer Unreachable',
    'Other Operational Reason',
  ];

  // ─── STEP 3: Order Cancelled ─────────────────────────────────────────────
  if (step === 'cancelled') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
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
            <View style={styles.heroContainer}>
              <View style={styles.cancelCircleBadge}>
                <BigRedCrossCircleIcon />
              </View>
              <Text style={styles.heroTitle}>Order Cancelled</Text>
            </View>

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

  // ─── STEP 2: Confirm Cancellation ─────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
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
            <View style={styles.confirmPromptBox}>
              <WarningTriangleOrangeIcon />
              <Text style={styles.confirmPromptText}>Cancel this order?</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Order</Text>
              <Text style={styles.fieldValueBold}>{orderId}</Text>
            </View>

            <View style={[styles.redAlertBox, { marginTop: 14 }]}>
              <InfoCircleRedIcon />
              <Text style={styles.redAlertText}>
                This action cannot be undone. No refund logic is created here unless the payment/refund service supports it.
              </Text>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

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

  // ─── STEP 1: Cancel Order Form ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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

        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{orderId}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
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
          </View>

          <Text style={styles.sectionTitle}>Cancellation Reason</Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            activeOpacity={0.7}
            onPress={() => setShowReasonPicker(true)}
          >
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownLabel}>REASON</Text>
              <Text style={styles.dropdownValue}>{reason}</Text>
            </View>
            <ChevronDownIcon />
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>

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
              {reasons.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.modalOption,
                    reason === r && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setReason(r);
                    setShowReasonPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      reason === r && styles.modalOptionTextSelected,
                    ]}
                  >
                    {r}
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
    backgroundColor: ORDERS_THEME.primary,
  },
  container: {
    flex: 1,
    backgroundColor: ORDERS_THEME.pageBg,
  },
  header: {
    backgroundColor: ORDERS_THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitleRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: ORDERS_THEME.primary,
  },
  subtitleText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
    marginBottom: 4,
  },
  fieldValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
  },
  fieldValueBold: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
  },
  dropdownBox: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
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
    fontFamily: 'Poppins',
    fontSize: 9.5,
    fontWeight: '700',
    color: ORDERS_THEME.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dropdownValue: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '600',
    color: ORDERS_THEME.textInk,
  },
  confirmPromptBox: {
    backgroundColor: ORDERS_THEME.warningBg,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    borderRadius: ORDERS_THEME.radiusMD,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  confirmPromptText: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '700',
    color: ORDERS_THEME.warning,
  },
  redAlertBox: {
    backgroundColor: ORDERS_THEME.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: ORDERS_THEME.radiusMD,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  redAlertText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '600',
    color: ORDERS_THEME.danger,
    lineHeight: 16,
  },
  bottomBar: {
    backgroundColor: ORDERS_THEME.pageBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: ORDERS_THEME.border,
  },
  bottomBarStacked: {
    backgroundColor: ORDERS_THEME.pageBg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: ORDERS_THEME.border,
  },
  primaryBtn: {
    backgroundColor: ORDERS_THEME.primary,
    borderRadius: ORDERS_THEME.radiusLG,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ORDERS_THEME.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmCancelBtn: {
    backgroundColor: ORDERS_THEME.primary,
    borderRadius: ORDERS_THEME.radiusLG,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    shadowColor: ORDERS_THEME.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmCancelBtnText: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  keepOrderBtn: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    borderRadius: ORDERS_THEME.radiusLG,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepOrderBtnText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
  },
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
    backgroundColor: ORDERS_THEME.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    padding: 18,
  },
  modalTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
    marginBottom: 12,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: ORDERS_THEME.radiusXS,
  },
  modalOptionSelected: {
    backgroundColor: ORDERS_THEME.orangeTint,
  },
  modalOptionText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    color: ORDERS_THEME.textInk,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: ORDERS_THEME.primary,
  },
});
