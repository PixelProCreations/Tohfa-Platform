import React, { useState } from 'react';
import {
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

type PaymentMethod = SalePaymentMethod;

export interface PaymentScreenProps extends WarehouseScreenBaseProps {
  amountDue?: number | undefined;
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

  // UPI State
  const [upiStatus] = useState<'Waiting' | 'Received'>('Waiting');
  const [upiRef] = useState<string>('—');

  // Card State
  const [cardStatus] = useState<'Processing' | 'Approved'>('Processing');

  // Wallet State
  const balanceAfter = Math.max(0, walletBalance - amountDue);

  const numericReceived = parseFloat(receivedAmount);
  const changeAmount = isNaN(numericReceived) ? 180 : Math.max(0, numericReceived - amountDue);

  const handleConfirm = () => {
    onPaymentConfirmed(selectedMethod);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner ─── */}
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

        {/* ─── 3. Dynamic Content Based on Selected Method ─── */}
        {selectedMethod === 'Cash' && (
          <View>
            <Text style={styles.sectionHeading}>Amount Received</Text>
            <View style={styles.receivedInputCard}>
              <TextInput
                style={styles.receivedInput}
                value={receivedAmount}
                onChangeText={setReceivedAmount}
                keyboardType="numeric"
                placeholder="500"
                placeholderTextColor={adminColors.placeholder}
              />
              <Text style={styles.currencySymbol}>₹</Text>
            </View>

            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Change</Text>
              <Text style={styles.changeValue}>₹{changeAmount}</Text>
            </View>

            {/* Payment Summary */}
            <Text style={styles.sectionHeading}>Payment Summary</Text>
            <View style={styles.paymentSummaryCard}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>₹{amountDue}</Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Method</Text>
                <Text style={styles.summaryValue}>cash</Text>
              </View>
            </View>
          </View>
        )}

        {selectedMethod === 'UPI' && (
          <View>
            <Text style={styles.sectionHeading}>UPI Payment</Text>
            <View style={styles.paymentSummaryCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>Payment Status</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    upiStatus === 'Received' && { color: adminColors.success.text },
                  ]}
                >
                  {upiStatus === 'Received' ? 'Received ✓' : 'Waiting for payment...'}
                </Text>
              </View>
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={styles.summaryLabel}>Transaction Reference</Text>
                <Text style={styles.summaryValue}>{upiRef}</Text>
              </View>
            </View>
          </View>
        )}

        {selectedMethod === 'Card' && (
          <View>
            <Text style={styles.sectionHeading}>Card Payment</Text>
            <View style={styles.paymentSummaryCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>Payment Status</Text>
                <Text style={styles.summaryValue}>{cardStatus}</Text>
              </View>
            </View>
          </View>
        )}

        {selectedMethod === 'Wallet' && (
          <View>
            <Text style={styles.sectionHeading}>Customer Wallet</Text>
            <View style={styles.paymentSummaryCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>Wallet Available</Text>
                <Text style={styles.summaryValue}>₹{walletBalance.toLocaleString()}</Text>
              </View>
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={styles.summaryLabel}>Balance After</Text>
                <Text style={styles.summaryValue}>₹{balanceAfter.toLocaleString()}</Text>
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
    paddingTop: 12,
    paddingBottom: 16,
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
    paddingTop: 14,
    paddingBottom: 20,
  },
  amountDueCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  amountDueValue: {
    fontSize: 32,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 4,
  },
  amountDueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.muted,
    letterSpacing: 0.5,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: 6,
    ...adminShadow.sm,
  },
  methodBtnSelected: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  methodBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  methodBtnTextSelected: {
    color: adminColors.onBrand,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 10,
    marginBottom: 8,
    fontWeight: '700',
  },
  receivedInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    marginBottom: 10,
  },
  receivedInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.ink,
    padding: 0,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.ink,
  },
  changeRow: {
    paddingVertical: 4,
    marginBottom: 12,
  },
  changeLabel: {
    fontSize: 12.5,
    color: adminColors.muted,
    marginBottom: 2,
  },
  changeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },
  paymentSummaryCard: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
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
    fontSize: 16,
  },
});
