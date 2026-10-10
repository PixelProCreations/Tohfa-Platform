import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { SalePaymentMethod, WarehouseScreenBaseProps } from './types';
import { adminColors, adminType, adminShadow } from '../../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function CashIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UpiIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18h.01M18 14h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CardIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20M6 15h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WalletIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 14h.01M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuestionCircleIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkOutlineIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CancelCrossIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type PaymentMethod = SalePaymentMethod;

// Design id: M6-S06
// No direct-sale / payment-collection code exists in docs/rbac.json (SPEC_GAPS
// "Sales Direct" #111): the screen is scope-locked but ungated. The Wallet
// method is not gated on a wallet code either; none covers paying from a wallet
// at a counter, and inventing one is not allowed (noted in SPEC_GAPS).
export interface PaymentScreenProps extends WarehouseScreenBaseProps {
  amountDue?: number | undefined;
  /** Wallet balance of the sale's customer (Wallet method). */
  walletBalance?: number | undefined;
  onPaymentConfirmed: (method: PaymentMethod) => void;
}

export function PaymentScreen({
  amountDue = 320,
  walletBalance = 1250,
  onBack,
  onPaymentConfirmed,
}: PaymentScreenProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Cash');
  const [receivedAmount, setReceivedAmount] = useState<string>('500');
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  // UPI State
  const [upiStatus] = useState<'Waiting' | 'Received'>('Waiting');
  const [upiRef] = useState<string>('—');

  // Card State
  const [cardStatus] = useState<'Processing' | 'Approved'>('Processing');

  // Wallet State
  const balanceAfter = Math.max(0, walletBalance - amountDue);

  const numericReceived = parseFloat(receivedAmount) || 0;
  const changeAmount = Math.max(0, numericReceived - amountDue);

  const handleConfirm = () => {
    if (selectedMethod === 'Cash' && numericReceived < amountDue) {
      Alert.alert('Insufficient Amount', `Amount received must be at least ₹${amountDue}.`);
      return;
    }
    setShowConfirmPopup(true);
  };

  const handleFinalConfirm = () => {
    setShowConfirmPopup(false);
    onPaymentConfirmed(selectedMethod);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Amount Due Card ─── */}
        <View style={styles.amountDueCard}>
          <Text style={styles.amountDueValue}>₹{amountDue}</Text>
          <Text style={styles.amountDueLabel}>AMOUNT DUE</Text>
        </View>

        {/* ─── 2. Payment Method Selector ─── */}
        <View style={styles.paymentMethodsRow}>
          {/* Cash */}
          <TouchableOpacity
            style={[
              styles.methodBtn,
              selectedMethod === 'Cash' && styles.methodBtnSelected,
            ]}
            onPress={() => setSelectedMethod('Cash')}
            activeOpacity={0.8}
          >
            <CashIcon
              size={22}
              color={selectedMethod === 'Cash' ? adminColors.onBrand : adminColors.muted}
            />
            <Text
              style={[
                styles.methodBtnText,
                selectedMethod === 'Cash' && styles.methodBtnTextSelected,
              ]}
            >
              Cash
            </Text>
          </TouchableOpacity>

          {/* UPI */}
          <TouchableOpacity
            style={[
              styles.methodBtn,
              selectedMethod === 'UPI' && styles.methodBtnSelected,
            ]}
            onPress={() => setSelectedMethod('UPI')}
            activeOpacity={0.8}
          >
            <UpiIcon
              size={22}
              color={selectedMethod === 'UPI' ? adminColors.onBrand : adminColors.muted}
            />
            <Text
              style={[
                styles.methodBtnText,
                selectedMethod === 'UPI' && styles.methodBtnTextSelected,
              ]}
            >
              UPI
            </Text>
          </TouchableOpacity>

          {/* Card */}
          <TouchableOpacity
            style={[
              styles.methodBtn,
              selectedMethod === 'Card' && styles.methodBtnSelected,
            ]}
            onPress={() => setSelectedMethod('Card')}
            activeOpacity={0.8}
          >
            <CardIcon
              size={22}
              color={selectedMethod === 'Card' ? adminColors.onBrand : adminColors.muted}
            />
            <Text
              style={[
                styles.methodBtnText,
                selectedMethod === 'Card' && styles.methodBtnTextSelected,
              ]}
            >
              Card
            </Text>
          </TouchableOpacity>

          {/* Wallet */}
          <TouchableOpacity
            style={[
              styles.methodBtn,
              selectedMethod === 'Wallet' && styles.methodBtnSelected,
            ]}
            onPress={() => setSelectedMethod('Wallet')}
            activeOpacity={0.8}
          >
            <WalletIcon
              size={22}
              color={selectedMethod === 'Wallet' ? adminColors.onBrand : adminColors.muted}
            />
            <Text
              style={[
                styles.methodBtnText,
                selectedMethod === 'Wallet' && styles.methodBtnTextSelected,
              ]}
            >
              Wallet
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── 3. DYNAMIC CONTENT BASED ON SELECTED METHOD ─── */}

        {/* ── Option A: Cash ── */}
        {selectedMethod === 'Cash' && (
          <View>
            <Text style={styles.sectionHeading}>Amount Received</Text>
            <View style={styles.receivedInputCard}>
              <TextInput
                style={styles.receivedInput}
                value={receivedAmount}
                onChangeText={setReceivedAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={adminColors.placeholder}
              />
              <Text style={styles.currencySymbol}>₹</Text>
            </View>

            <View style={styles.changeCard}>
              <Text style={styles.changeLabel}>Change</Text>
              <Text style={styles.changeValue}>₹{changeAmount}</Text>
            </View>
          </View>
        )}

        {/* ── Option B: UPI ── */}
        {selectedMethod === 'UPI' && (
          <View>
            <View style={styles.statusDetailCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Payment Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    upiStatus === 'Received' && { color: adminColors.success.text },
                  ]}
                >
                  {upiStatus === 'Received' ? 'Received ✓' : 'Waiting for payment...'}
                </Text>
              </View>

              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={styles.detailLabel}>Transaction Reference</Text>
                <Text style={styles.detailValue}>{upiRef}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Option C: Card ── */}
        {selectedMethod === 'Card' && (
          <View>
            <View style={styles.statusDetailCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Payment Status</Text>
                <Text style={styles.detailValue}>{cardStatus}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Option D: Wallet ── */}
        {selectedMethod === 'Wallet' && (
          <View>
            <View style={styles.walletDetailCard}>
              <View style={styles.walletRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Wallet Available</Text>
                  <Text style={styles.detailValue}>₹{walletBalance.toLocaleString()}</Text>
                </View>

                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={styles.detailLabel}>Sale Amount</Text>
                  <Text style={styles.detailValue}>₹{amountDue}</Text>
                </View>
              </View>

              <View style={[styles.walletRow, { marginTop: 14 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Balance After Payment</Text>
                  <Text style={styles.detailValue}>₹{balanceAfter.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <CashIcon size={20} color={adminColors.onBrand} />
          <Text style={styles.confirmBtnText}>Confirm Payment</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Confirm Payment Popup Modal ─── */}
      <Modal
        visible={showConfirmPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            {/* Header: (?) Confirm Payment? */}
            <View style={styles.popupHeader}>
              <QuestionCircleIcon size={20} color={adminColors.brandDeep} />
              <Text style={styles.popupTitle}>Confirm Payment?</Text>
            </View>

            {/* Summary Box (Amount & Method) */}
            <View style={styles.popupSummaryBox}>
              <View style={styles.popupSummaryCol}>
                <Text style={styles.popupSummaryLabel}>Amount</Text>
                <Text style={styles.popupSummaryVal}>₹{amountDue}</Text>
              </View>
              <View style={styles.popupSummaryCol}>
                <Text style={styles.popupSummaryLabel}>Method</Text>
                <Text style={styles.popupSummaryVal}>{selectedMethod}</Text>
              </View>
            </View>

            {/* Confirm Payment Button (Green outline) */}
            <TouchableOpacity
              style={styles.popupConfirmBtn}
              onPress={handleFinalConfirm}
              activeOpacity={0.8}
            >
              <CheckmarkOutlineIcon size={18} color={adminColors.success.text} />
              <Text style={styles.popupConfirmBtnText}>Confirm Payment</Text>
            </TouchableOpacity>

            {/* Cancel Button (Orange/brown outline) */}
            <TouchableOpacity
              style={styles.popupCancelBtn}
              onPress={() => setShowConfirmPopup(false)}
              activeOpacity={0.8}
            >
              <CancelCrossIcon size={18} color={adminColors.brandDeep} />
              <Text style={styles.popupCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
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
  amountDueCard: {
    backgroundColor: adminColors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  amountDueValue: {
    ...adminType.title,
    color: adminColors.ink,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  amountDueLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.8,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  methodBtnSelected: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  methodBtnText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  methodBtnTextSelected: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 8,
    marginTop: 4,
  },
  receivedInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 14,
  },
  receivedInput: {
    flex: 1,
    ...adminType.title,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  currencySymbol: {
    ...adminType.title,
    color: adminColors.muted,
  },
  changeCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  changeLabel: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 4,
  },
  changeValue: {
    ...adminType.title,
    color: adminColors.success.text,
  },
  statusDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
  },
  detailLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  detailValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  walletDetailCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  simulateBtn: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  simulateBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  walletNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.brandTint,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 14,
  },
  walletNoticeText: {
    flex: 1,
    ...adminType.body,
    color: adminColors.brandDeep,
    lineHeight: 17,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: adminColors.canvas,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  confirmBtnText: {
    color: adminColors.onBrand,
    ...adminType.title,
  },
  modalOverlay: {
    flex: 1,
    // Was a translucent black scrim; no translucent token, so a solid canvas scrim (card raised by adminShadow.lg).
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popupCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    padding: 20,
    ...adminShadow.lg,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popupTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
  },
  popupSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 14,
    backgroundColor: adminColors.card,
  },
  popupSummaryCol: {
    flex: 1,
  },
  popupSummaryLabel: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 4,
  },
  popupSummaryVal: {
    ...adminType.title,
    color: adminColors.ink,
  },
  popupConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: adminColors.success.text,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: adminColors.card,
  },
  popupConfirmBtnText: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  popupCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: adminColors.card,
  },
  popupCancelBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
});
