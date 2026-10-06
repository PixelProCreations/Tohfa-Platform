import React, { useState } from 'react';
import {
  Alert,
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

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F0EAE1',

  greenText:     '#15803D',
  amberNoticeBg: '#FEF1EC',
  amberNoticeBorder: '#FCD9CE',
  amberNoticeText: '#7A3E26',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function CashIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UpiIcon({ size = 20, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18h.01M18 14h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CardIcon({ size = 20, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20M6 15h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WalletIcon({ size = 20, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 14h.01M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 14, color = PALETTE.amberNoticeText }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

import { SubWarehouseSaleConfirmationScreen } from './SubWarehouseSaleConfirmationScreen';

type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Wallet';

export interface SubWarehousePaymentScreenProps {
  amountDue?: number | undefined;
  onBack?: (() => void) | undefined;
  onPaymentConfirmed?: (() => void) | undefined;
}

export function SubWarehousePaymentScreen({
  amountDue = 320,
  onBack,
  onPaymentConfirmed,
}: SubWarehousePaymentScreenProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Cash');
  const [receivedAmount, setReceivedAmount] = useState<string>('500');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // UPI State
  const [upiStatus, setUpiStatus] = useState<'Waiting' | 'Received'>('Waiting');
  const [upiRef, setUpiRef] = useState<string>('—');

  // Card State
  const [cardStatus, setCardStatus] = useState<'Processing' | 'Approved'>('Processing');

  // Wallet State
  const walletBalance = 1250;
  const balanceAfter = Math.max(0, walletBalance - amountDue);

  const numericReceived = parseFloat(receivedAmount) || 0;
  const changeAmount = Math.max(0, numericReceived - amountDue);

  const handleSimulateUpiPayment = () => {
    setUpiStatus('Received');
    setUpiRef('UPI-8839210');
    Alert.alert('Payment Received', 'UPI transaction of ₹' + amountDue + ' confirmed with Ref: UPI-8839210.');
  };

  const handleConfirm = () => {
    if (selectedMethod === 'Cash' && numericReceived < amountDue) {
      Alert.alert('Insufficient Amount', `Amount received must be at least ₹${amountDue}.`);
      return;
    }

    if (onPaymentConfirmed) {
      onPaymentConfirmed();
    } else {
      setShowConfirmation(true);
    }
  };

  if (showConfirmation) {
    return (
      <SubWarehouseSaleConfirmationScreen
        saleId="SALE-00251"
        customerName="Rajesh Kumar"
        customerCode="CUS-00291"
        paymentMethod={selectedMethod}
        totalAmount={amountDue}
        onNewSale={() => {
          setShowConfirmation(false);
          if (onBack) onBack();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

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
              color={selectedMethod === 'Cash' ? '#FFFFFF' : '#7A726C'}
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
              color={selectedMethod === 'UPI' ? '#FFFFFF' : '#7A726C'}
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
              color={selectedMethod === 'Card' ? '#FFFFFF' : '#7A726C'}
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
              color={selectedMethod === 'Wallet' ? '#FFFFFF' : '#7A726C'}
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
                placeholderTextColor="#9E9690"
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
                    upiStatus === 'Received' && { color: PALETTE.greenText },
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

            <TouchableOpacity
              style={styles.simulateBtn}
              onPress={handleSimulateUpiPayment}
              activeOpacity={0.75}
            >
              <Text style={styles.simulateBtnText}>Simulate payment received (demo)</Text>
            </TouchableOpacity>
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

            <View style={styles.walletNoticeBanner}>
              <LockIcon size={16} color={PALETTE.amberNoticeText} />
              <Text style={styles.walletNoticeText}>
                The wallet is debited only through the authorized backend transaction — SWA never directly edits the wallet balance.
              </Text>
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
          <CashIcon size={20} color="#FFFFFF" />
          <Text style={styles.confirmBtnText}>Confirm Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
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
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  amountDueValue: {
    fontSize: 34,
    fontWeight: '900',
    color: PALETTE.textInk,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  amountDueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textMuted,
    letterSpacing: 0.8,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  methodBtnSelected: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  methodBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  methodBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 8,
    marginTop: 4,
  },
  receivedInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 14,
  },
  receivedInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  changeCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  changeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.greenText,
  },
  statusDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  walletDetailCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  simulateBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  simulateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B420F',
  },
  walletNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PALETTE.amberNoticeBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.amberNoticeBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 14,
  },
  walletNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.amberNoticeText,
    lineHeight: 17,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: PALETTE.pageBg,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
