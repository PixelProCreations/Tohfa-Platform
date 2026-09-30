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
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand Theme) ──────────────────────────────────────
const PALETTE = {
  primary:          '#F0562A',
  pageBg:           '#F7F5EE',
  cardBg:           '#FFFFFF',
  textInk:          '#1D2420',
  textSecondary:    '#7A726C',
  textMuted:        '#9CA3AF',
  textBody:         '#4B5563',
  border:           '#F0ECE3',
  divider:          '#F0ECE3',
  greenBadge:       '#E6F5ED',
  greenText:        '#1E8E5A',
  activeChipBg:     '#FFF0EB',
  activeChipBorder: '#F0562A',
  activeChipText:   '#F0562A',
  chipBg:           '#FFFFFF',
  chipBorder:       '#E5E7EB',
  chipText:         '#4B5563',
  inputBg:          '#FFFFFF',
  inputBorder:      '#E5E7EB',
  noticeBg:         '#FFF5F2',
  noticeBorder:     '#FED7AA',
  noticeText:       '#9A3412',
};

// ─── Pure SVG Icons (Only Path used to prevent Hermes errors) ─────────────────

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

function CashBanknoteIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 7h18a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V9a2 2 0 012-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 15a2 2 0 100-4 2 2 0 000 4zM6 11h.01M18 11h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StoreCheckIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const PRESET_AMOUNTS = [200, 500, 1000, 2000, 5000];

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseCashTopUpScreenProps {
  customerName?: string;
  customerCode?: string;
  currentBalance?: string;
  onBack: () => void;
  onSuccess?: (amount: number, newBalance: number) => void;
}

export function SubWarehouseCashTopUpScreen({
  customerName = 'Rajesh Kumar',
  customerCode = 'CUS-00291',
  currentBalance = '₹1,250',
  onBack,
  onSuccess,
}: SubWarehouseCashTopUpScreenProps): React.JSX.Element {
  const numericCurrentBalance = parseInt(currentBalance.replace(/[^0-9]/g, ''), 10) || 1250;
  const [amountStr, setAmountStr] = useState('500');
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const depositAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
  const newBalance = numericCurrentBalance + depositAmount;

  const handleSelectPreset = (val: number) => {
    setAmountStr(String(val));
  };

  const handleConfirm = () => {
    if (depositAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a cash amount greater than ₹0.');
      return;
    }

    if (depositAmount > 100000) {
      Alert.alert('Amount Limit', 'Single cash deposit cannot exceed ₹1,00,000 as per warehouse cash handling limits.');
      return;
    }

    Alert.alert(
      'Confirm Cash Deposit',
      `Accept ₹${depositAmount.toLocaleString('en-IN')} cash from ${customerName}?\n\nNew Wallet Balance will be ₹${newBalance.toLocaleString('en-IN')}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Collect Cash',
          onPress: () => {
            setIsProcessing(true);
            setTimeout(() => {
              setIsProcessing(false);
              Alert.alert(
                'Top-Up Successful',
                `₹${depositAmount.toLocaleString('en-IN')} cash received successfully.\n\nReceipt No: TOP-2026-${Math.floor(10000 + Math.random() * 90000)}\nUpdated Balance: ₹${newBalance.toLocaleString('en-IN')}`,
                [
                  {
                    text: 'Done',
                    onPress: () => {
                      if (onSuccess) onSuccess(depositAmount, newBalance);
                      else onBack();
                    },
                  },
                ]
              );
            }, 500);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Cash Top-Up</Text>
            <Text style={styles.headerSubtitle}>{customerName} · {customerCode}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Balance Calculation Card ─── */}
          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.heroCol}>
                <Text style={styles.heroLabel}>CURRENT BALANCE</Text>
                <Text style={styles.heroCurrentVal}>₹{numericCurrentBalance.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroCol}>
                <Text style={styles.heroLabel}>NEW BALANCE</Text>
                <Text style={styles.heroNewVal}>₹{newBalance.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* ─── Deposit Amount Input Card ─── */}
          <Text style={styles.sectionHeading}>Enter Cash Amount</Text>
          <View style={styles.amountCard}>
            <View style={styles.amountInputRow}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={amountStr}
                onChangeText={(text) => setAmountStr(text.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={PALETTE.textMuted}
                maxLength={6}
              />
            </View>

            {/* Quick Preset Amount Chips */}
            <View style={styles.presetRow}>
              {PRESET_AMOUNTS.map((val) => {
                const isSelected = depositAmount === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => handleSelectPreset(val)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                      + ₹{val.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ─── Collection & Verification Details Card ─── */}
          <Text style={styles.sectionHeading}>Deposit Details</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <StoreCheckIcon size={16} color={PALETTE.primary} />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>Coonoor Sub-Warehouse Counter</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <CashBanknoteIcon size={16} color={PALETTE.primary} />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>Cash Handover (Authorized Flow)</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <ShieldCheckIcon size={16} color={PALETTE.primary} />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Authorized By</Text>
                <Text style={styles.detailValue}>Sub-Warehouse Admin / Cashier</Text>
              </View>
            </View>
          </View>

          {/* ─── Optional Remarks Input ─── */}
          <Text style={styles.sectionHeading}>Remarks / Slip Reference (Optional)</Text>
          <View style={styles.remarksCard}>
            <TextInput
              style={styles.remarksInput}
              placeholder="e.g. Counter deposit slip #891"
              placeholderTextColor={PALETTE.textMuted}
              value={remarks}
              onChangeText={setRemarks}
            />
          </View>

          {/* ─── Security Notice Box ─── */}
          <View style={styles.noticeBox}>
            <View style={styles.noticeIconWrap}>
              <ShieldCheckIcon size={16} color={PALETTE.primary} />
            </View>
            <Text style={styles.noticeText}>
              All cash top-ups are ledger verified and logged under the sub-warehouse daily register.
              An SMS confirmation is dispatched to {customerName}.
            </Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ─── Bottom Action Bar ─── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.confirmBtn, isProcessing && { opacity: 0.7 }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
            disabled={isProcessing}
          >
            <CashBanknoteIcon size={20} color="#FFFFFF" />
            <Text style={styles.confirmBtnText}>
              {isProcessing
                ? 'Processing Deposit...'
                : `Confirm Deposit · ₹${depositAmount.toLocaleString('en-IN')}`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: PALETTE.pageBg,
  },
  heroCard: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroLabel: {
    fontFamily: 'Poppins',
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  heroCurrentVal: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroNewVal: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  sectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 8,
    marginTop: 4,
  },
  amountCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: PALETTE.primary,
    width: '80%',
    marginBottom: 14,
  },
  rupeeSymbol: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700',
    color: PALETTE.primary,
    marginRight: 6,
  },
  amountInput: {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: '700',
    color: PALETTE.textInk,
    minWidth: 120,
    textAlign: 'center',
    paddingVertical: 0,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  presetChip: {
    backgroundColor: PALETTE.chipBg,
    borderWidth: 1,
    borderColor: PALETTE.chipBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presetChipActive: {
    backgroundColor: PALETTE.activeChipBg,
    borderColor: PALETTE.activeChipBorder,
  },
  presetChipText: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.chipText,
  },
  presetChipTextActive: {
    color: PALETTE.activeChipText,
    fontWeight: '700',
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PALETTE.activeChipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  detailValue: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textInk,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  remarksCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  remarksInput: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  noticeBox: {
    backgroundColor: PALETTE.noticeBg,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorder,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noticeIconWrap: {
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.noticeText,
    lineHeight: 16,
    fontWeight: '500',
  },
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  confirmBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
