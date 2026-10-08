import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// ─── Design Tokens (Matching Exact Screenshots) ──────────────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF2E8',
  primaryBorder: '#F5C6A0',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#EBE5DC',
  divider: '#F4EFE9',

  // Accent & Callout colors
  blueInfoBg: '#EBF3FC',
  blueInfoBorder: '#BFDBFE',
  blueInfoText: '#1E40AF',

  greenAmount: '#0D9488',
  brownBalance: '#92400E',
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

function ArrowForwardIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = '#1E40AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8h.01M12 11v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface CashTopUpData {
  customerName: string;
  customerCode: string;
  currentBalance: number;
  topUpAmount: number;
  warehouseName: string;
  processedBy: string;
  channel: string;
}

export interface SubWarehouseCashTopUpScreenProps {
  onBack?: () => void;
  onSuccess?: (amount: number, newBalance: number) => void;
  onContinue?: (data: CashTopUpData) => void;
  customerName?: string;
  customerCode?: string;
  currentBalance?: string | number;
  initialCustomer?: {
    name: string;
    code: string;
    currentBalance: number;
  };
  warehouseName?: string;
  processedBy?: string;
}

export function SubWarehouseCashTopUpScreen({
  onBack,
  onSuccess,
  onContinue,
  customerName = 'Rajesh Kumar',
  customerCode = 'CUS-00291',
  currentBalance = '₹1,250',
  initialCustomer,
  warehouseName = 'Coonoor Warehouse',
  processedBy = 'SWA – Suresh',
}: SubWarehouseCashTopUpScreenProps) {
  const custName = initialCustomer?.name || customerName;
  const custCode = initialCustomer?.code || customerCode;
  const baseBalance = typeof currentBalance === 'number'
    ? currentBalance
    : (initialCustomer?.currentBalance ?? (parseInt(String(currentBalance).replace(/[^0-9]/g, ''), 10) || 1250));

  const [amount, setAmount] = useState<number>(2000);
  const [customInputVisible, setCustomInputVisible] = useState<boolean>(false);
  const [customInputValue, setCustomInputValue] = useState<string>('2000');

  const presetAmounts = [500, 1000, 2000, 5000];

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomInputValue(val.toString());
    setCustomInputVisible(false);
  };

  const handleToggleCustom = () => {
    setCustomInputVisible(true);
  };

  const handleCustomInputSubmit = (text: string) => {
    setCustomInputValue(text);
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    } else if (text === '') {
      setAmount(0);
    }
  };

  const newBalance = baseBalance + (amount || 0);

  const handleProceed = () => {
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cash top-up amount.');
      return;
    }

    if (amount > 100000) {
      Alert.alert('Amount Limit', 'Single cash deposit cannot exceed ₹1,00,000 as per warehouse cash handling limits.');
      return;
    }

    const payload: CashTopUpData = {
      customerName: custName,
      customerCode: custCode,
      currentBalance: baseBalance,
      topUpAmount: amount,
      warehouseName,
      processedBy,
      channel: 'Cash',
    };

    if (onContinue) {
      onContinue(payload);
    } else if (onSuccess) {
      Alert.alert(
        'Confirm Cash Deposit',
        `Accept ₹${amount.toLocaleString('en-IN')} cash from ${custName}?\n\nNew Wallet Balance will be ₹${newBalance.toLocaleString('en-IN')}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm & Collect Cash',
            onPress: () => onSuccess(amount, newBalance),
          },
        ]
      );
    } else {
      Alert.alert('Success', `Cash Top-Up of ₹${amount.toLocaleString('en-IN')} successful for ${custName}.`);
      onBack?.();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Orange Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash Top-Up</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* 1. Customer Card */}
          <View style={styles.customerCard}>
            <View style={styles.customerRow}>
              <Text style={styles.customerLine}>
                {custName}{' '}
                <Text style={styles.customerLineBold}>{custCode}</Text>
              </Text>
            </View>

            <View style={[styles.customerRow, { marginTop: 8 }]}>
              <Text style={styles.customerLine}>
                Current Wallet Balance{' '}
                <Text style={styles.customerLineBold}>
                  ₹{baseBalance.toLocaleString('en-IN')}
                </Text>
              </Text>
            </View>
          </View>

          {/* 2. Cash Amount Section */}
          <Text style={styles.sectionTitle}>Cash Amount</Text>
          <View style={styles.amountDisplayCard}>
            <Text style={styles.currencySymbol}>₹</Text>
            {customInputVisible ? (
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={customInputValue}
                onChangeText={handleCustomInputSubmit}
                autoFocus={true}
                selectTextOnFocus={true}
                placeholder="0"
                placeholderTextColor={PALETTE.textMuted}
              />
            ) : (
              <TouchableOpacity
                onPress={() => setCustomInputVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.amountLargeText}>
                  {amount ? amount.toString() : '0'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 3. Preset Amounts Row */}
          <View style={styles.presetHeaderRow}>
            <Text style={styles.sectionTitle}>Preset Amounts</Text>
            <Text style={styles.configDrivenText}>Config-driven</Text>
          </View>

          <View style={styles.presetGrid}>
            {presetAmounts.map((p) => {
              const isSelected = amount === p && !customInputVisible;
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.presetBtn,
                    isSelected && styles.presetBtnActive,
                  ]}
                  onPress={() => handleSelectPreset(p)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.presetBtnText,
                      isSelected && styles.presetBtnTextActive,
                    ]}
                  >
                    ₹{p.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Button */}
          <TouchableOpacity
            style={[
              styles.customBtn,
              customInputVisible && styles.customBtnActive,
            ]}
            onPress={handleToggleCustom}
            activeOpacity={0.75}
          >
            <Text style={styles.customBtnText}>Custom</Text>
          </TouchableOpacity>

          {/* 4. Balance Preview Section */}
          <Text style={styles.sectionTitle}>Balance Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Current Balance</Text>
              <Text style={styles.previewValue}>
                ₹{baseBalance.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Cash Top-Up</Text>
              <Text style={styles.previewTopUpValue}>
                +₹{amount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.previewRow}>
              <Text style={styles.previewNewBalanceLabel}>New Balance</Text>
              <Text style={styles.previewNewBalanceValue}>
                ₹{newBalance.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* 5. Transaction Information (Screenshot 3) */}
          <Text style={styles.sectionTitle}>Transaction Information</Text>
          <View style={styles.transactionCard}>
            <View style={styles.transactionRow}>
              <View style={styles.transactionCol}>
                <Text style={styles.txFieldLabel}>Warehouse</Text>
                <Text style={styles.txFieldValue}>{warehouseName}</Text>
              </View>
              <View style={styles.transactionCol}>
                <Text style={styles.txFieldLabel}>Processed By</Text>
                <Text style={styles.txFieldValue}>{processedBy}</Text>
              </View>
            </View>

            <View style={[styles.transactionCol, { marginTop: 12 }]}>
              <Text style={styles.txFieldLabel}>Channel</Text>
              <Text style={styles.txFieldValue}>Cash</Text>
            </View>
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Bottom Sticky Continue Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.continueBtn, (!amount || amount <= 0) && styles.continueBtnDisabled]}
          onPress={handleProceed}
          activeOpacity={0.85}
          disabled={!amount || amount <= 0}
        >
          <ArrowForwardIcon size={18} color="#FFFFFF" />
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
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

  // 1. Customer Card
  customerCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerLine: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '400',
    color: PALETTE.textInk,
  },
  customerLineBold: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: PALETTE.textInk,
  },

  // Section Headers
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 18,
    marginBottom: 8,
  },
  presetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  configDrivenText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },

  // 2. Amount Display Card
  amountDisplayCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  currencySymbol: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginBottom: 2,
  },
  amountLargeText: {
    fontFamily: 'Poppins',
    fontSize: 38,
    fontWeight: '700',
    color: PALETTE.textInk,
    letterSpacing: -0.5,
  },
  amountInput: {
    fontFamily: 'Poppins',
    fontSize: 38,
    fontWeight: '700',
    color: PALETTE.textInk,
    textAlign: 'center',
    minWidth: 160,
    paddingVertical: 0,
  },

  // 3. Preset Amounts Row
  presetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  presetBtnActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
    borderWidth: 1,
  },
  presetBtnText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  presetBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Custom Button
  customBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFD8CD',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  customBtnActive: {
    borderColor: PALETTE.primary,
    backgroundColor: '#FFF5EC',
  },
  customBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },

  // 4. Balance Preview Card
  previewCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '500',
    color: PALETTE.textInk,
  },
  previewValue: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  previewTopUpValue: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.greenAmount,
  },
  previewNewBalanceLabel: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '500',
    color: PALETTE.textInk,
  },
  previewNewBalanceValue: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.brownBalance,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },

  // 5. Transaction Information
  transactionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionCol: {
    flex: 1,
  },
  txFieldLabel: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  txFieldValue: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },

  // Sticky Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
  },
  continueBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    fontFamily: 'Poppins',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

