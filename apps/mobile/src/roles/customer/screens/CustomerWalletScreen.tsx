import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerRadius,
  customerShadow,
  customerSpacing,
} from '../theme';
import {
  walletPouchCard,
  profileEmailVerified,
} from '../assets/images';

export interface CustomerWalletScreenProps {
  initialBalance?: number;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

const BackArrowSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WalletIconSvg = ({ color = '#2E7D32', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Path
      d="M16 3H4a2 2 0 00-2 2v2h18V5a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Circle cx={16} cy={14} r={1.5} fill={color} />
  </Svg>
);

const CartIconSvg = ({ color = '#EF4444', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={9} cy={21} r={1} fill={color} />
    <Circle cx={20} cy={21} r={1} fill={color} />
    <Path
      d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RefundIconSvg = ({ color = '#3B82F6', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 4v6h6M23 20v-6h-6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FilterSvg = ({ color = '#2E7D32', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CloseSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UpiSvg = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 18l8-14 8 14H4z" stroke="#EA580C" strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M12 8v6M10 12h4" stroke="#16A34A" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const CardSvg = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={2} y={5} width={20} height={14} rx={2} stroke="#1A2E1A" strokeWidth={1.8} />
    <Path d="M2 10h20" stroke="#1A2E1A" strokeWidth={1.8} />
    <Rect x={6} y={14} width={4} height={2} rx={0.5} fill="#1A2E1A" />
  </Svg>
);

const BankSvg = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 21h18M3 10h18M5 10v7M9 10v7M15 10v7M19 10v7M12 3l9 5H3l9-5z" stroke="#1A2E1A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CustomerWalletScreen: React.FC<CustomerWalletScreenProps> = ({
  initialBalance = 1250,
  onNavigate,
  onBack,
}) => {
  const [balance, setBalance] = useState<number>(initialBalance);
  const [viewMode, setViewMode] = useState<'main' | 'add_money'>('main');
  const [amountInput, setAmountInput] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [lastAddedAmount, setLastAddedAmount] = useState<number>(0);

  const quickAmounts = [500, 1000, 2000, 5000];

  const parsedAmount = parseInt(amountInput, 10) || 0;

  const handleSelectQuickAmount = (val: number) => {
    setAmountInput(String(val));
  };

  const handleConfirmAddMoney = () => {
    if (parsedAmount <= 0) return;
    setLastAddedAmount(parsedAmount);
    setBalance(prev => prev + parsedAmount);
    setShowSuccessModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setViewMode('main');
    setAmountInput('');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (viewMode === 'add_money') {
                setViewMode('main');
              } else {
                onBack ? onBack() : onNavigate?.('CustomerAccount');
              }
            }}
            style={styles.circleIconButton}
            accessibilityLabel="Back"
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My wallet</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP WALLET POUCH CARD WITH CASH ─────────────────────────────────── */}
        <View style={styles.walletCardWrap}>
          <Image
            source={walletPouchCard}
            style={styles.walletCardImage}
            resizeMode="contain"
          />
          <View style={styles.walletCardOverlay} pointerEvents="box-none">
            <Text style={styles.walletBalanceLabel}>Wallet Balance</Text>
            <Text style={styles.walletBalanceValue}>
              ₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <Text style={styles.walletSubtitle}>
          Use your wallet balance for faster and smarter payments.
        </Text>

        {/* ── VIEW 1: MAIN WALLET VIEW (Screen 70) ────────────────────────────── */}
        {viewMode === 'main' ? (
          <>
            {/* + Add Money Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setViewMode('add_money')}
              style={styles.addMoneyMainBtn}
              accessibilityLabel="Add Money"
            >
              <Text style={styles.addMoneyMainBtnText}>+ Add Money</Text>
            </TouchableOpacity>

            {/* Recent Transactions Section Header with Filter */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity style={styles.filterPill} activeOpacity={0.7}>
                <FilterSvg size={13} color={customerColors.brand} />
                <Text style={styles.filterPillText}>Filter</Text>
              </TouchableOpacity>
            </View>

            {/* Transactions List */}
            <View style={styles.transactionsList}>
              {/* Row 1 */}
              <View style={styles.txRow}>
                <View style={[styles.txIconBox, { backgroundColor: '#EDF8EE' }]}>
                  <WalletIconSvg color="#2E7D32" size={18} />
                </View>
                <View style={styles.txDetailsCol}>
                  <Text style={styles.txTitle}>Added to Wallet</Text>
                  <Text style={styles.txDate}>12 Nov 2026, 10:24 Am</Text>
                </View>
                <View style={styles.txRightCol}>
                  <Text style={[styles.txAmount, { color: customerColors.body }]}>+ ₹ 1,000.00</Text>
                  <View style={styles.successPill}>
                    <Text style={styles.successPillText}>Success</Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Row 2 */}
              <View style={styles.txRow}>
                <View style={[styles.txIconBox, { backgroundColor: '#FEE4E2' }]}>
                  <CartIconSvg color="#DC2626" size={18} />
                </View>
                <View style={styles.txDetailsCol}>
                  <Text style={styles.txTitle}>Order Payment</Text>
                  <Text style={styles.txOrderRef}>ORD-20261115-0039</Text>
                  <Text style={styles.txDate}>12 Nov 2026, 10:24 Am</Text>
                </View>
                <View style={styles.txRightCol}>
                  <Text style={[styles.txAmount, { color: '#DC2626' }]}>- ₹ 360.00</Text>
                  <View style={styles.successPill}>
                    <Text style={styles.successPillText}>Success</Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Row 3 */}
              <View style={styles.txRow}>
                <View style={[styles.txIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <RefundIconSvg color="#2563EB" size={18} />
                </View>
                <View style={styles.txDetailsCol}>
                  <Text style={styles.txTitle}>Order Refund</Text>
                  <Text style={styles.txOrderRef}>ORD-20261115-0039</Text>
                  <Text style={styles.txDate}>10 Nov 2026, 10:24 Am</Text>
                </View>
                <View style={styles.txRightCol}>
                  <Text style={[styles.txAmount, { color: customerColors.body }]}>+ ₹ 390.00</Text>
                  <View style={styles.successPill}>
                    <Text style={styles.successPillText}>Success</Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Row 4 */}
              <View style={styles.txRow}>
                <View style={[styles.txIconBox, { backgroundColor: '#EDF8EE' }]}>
                  <WalletIconSvg color="#2E7D32" size={18} />
                </View>
                <View style={styles.txDetailsCol}>
                  <Text style={styles.txTitle}>Added to Wallet</Text>
                  <Text style={styles.txDate}>10 Nov 2026, 10:24 Am</Text>
                </View>
                <View style={styles.txRightCol}>
                  <Text style={[styles.txAmount, { color: customerColors.body }]}>+ ₹ 500.00</Text>
                  <View style={styles.successPill}>
                    <Text style={styles.successPillText}>Success</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* ── VIEW 2: ADD MONEY VIEW (Screen 71 & 72) ────────────────────────── */
          <View style={styles.addMoneyForm}>
            {/* Enter Amount */}
            <Text style={styles.inputLabel}>Enter Amount</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder=""
                keyboardType="numeric"
                value={amountInput}
                onChangeText={setAmountInput}
                autoFocus={true}
              />
            </View>

            {/* Quick Select Amount */}
            <Text style={[styles.inputLabel, { marginTop: 20 }]}>Quick Select Amount</Text>
            <View style={styles.quickSelectRow}>
              {quickAmounts.map(val => {
                const isSelected = parsedAmount === val;
                return (
                  <TouchableOpacity
                    key={val}
                    activeOpacity={0.7}
                    onPress={() => handleSelectQuickAmount(val)}
                    style={[
                      styles.quickAmountPill,
                      isSelected && styles.quickAmountPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        isSelected && styles.quickAmountTextSelected,
                      ]}
                    >
                      ₹ {val.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Choose Payment Method */}
            <Text style={[styles.inputLabel, { marginTop: 24 }]}>Choose Payment Method</Text>

            {/* UPI Option */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedMethod('upi')}
              style={styles.paymentMethodRow}
            >
              <View style={styles.methodIconBox}>
                <UpiSvg size={22} />
              </View>
              <View style={styles.methodTextCol}>
                <Text style={styles.methodTitle}>UPI</Text>
                <Text style={styles.methodSubtitle}>Pay using Google Pay, PhonePe, Paytm, etc.</Text>
              </View>
              <View style={[styles.radioCircle, selectedMethod === 'upi' && styles.radioCircleActive]}>
                {selectedMethod === 'upi' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {/* Debit / Credit Card Option */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedMethod('card')}
              style={styles.paymentMethodRow}
            >
              <View style={styles.methodIconBox}>
                <CardSvg size={22} />
              </View>
              <View style={styles.methodTextCol}>
                <Text style={styles.methodTitle}>Debit / Credit Card</Text>
                <Text style={styles.methodSubtitle}>Visa, Mastercard, RuPay, etc.</Text>
              </View>
              <View style={[styles.radioCircle, selectedMethod === 'card' && styles.radioCircleActive]}>
                {selectedMethod === 'card' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {/* Net Banking Option */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedMethod('netbanking')}
              style={styles.paymentMethodRow}
            >
              <View style={styles.methodIconBox}>
                <BankSvg size={22} />
              </View>
              <View style={styles.methodTextCol}>
                <Text style={styles.methodTitle}>Net Banking</Text>
                <Text style={styles.methodSubtitle}>Pay through your bank account</Text>
              </View>
              <View style={[styles.radioCircle, selectedMethod === 'netbanking' && styles.radioCircleActive]}>
                {selectedMethod === 'netbanking' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {/* Submit Add Money Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirmAddMoney}
              disabled={parsedAmount <= 0}
              style={[
                styles.addMoneySubmitBtn,
                parsedAmount > 0 ? styles.addMoneySubmitBtnActive : styles.addMoneySubmitBtnDisabled,
              ]}
              accessibilityLabel={`Add ₹${parsedAmount} to Wallet`}
            >
              <Text
                style={[
                  styles.addMoneySubmitBtnText,
                  parsedAmount > 0 ? styles.addMoneySubmitBtnTextActive : styles.addMoneySubmitBtnTextDisabled,
                ]}
              >
                + Add ₹ {parsedAmount} to Wallet
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── MODAL: SCREEN 72A MONEY ADDED SUCCESSFULLY! ─────────────────────── */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.successModalCard, customerShadow.overlay]}>
            {/* Close X */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleModalClose}
              style={styles.modalCloseBtn}
              accessibilityLabel="Close"
            >
              <CloseSvg size={18} color="#6B7280" />
            </TouchableOpacity>

            {/* Success Illustration */}
            <Image
              source={profileEmailVerified}
              style={styles.modalSuccessIllustration}
              resizeMode="contain"
            />

            {/* Title */}
            <Text style={styles.modalTitle}>Money added successfully!</Text>
            <Text style={styles.modalSubtitle}>
              ₹{lastAddedAmount.toLocaleString('en-IN')} has been added to your TOHFA Wallet.
            </Text>

            {/* Summary Metrics Row */}
            <View style={styles.summaryMetricsCard}>
              <View style={styles.summaryMetricItem}>
                <Text style={styles.metricLabel}>Added Amount</Text>
                <Text style={styles.metricValue}>₹{lastAddedAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.summaryMetricItem}>
                <Text style={styles.metricLabel}>Wallet Balance</Text>
                <Text style={styles.metricValue}>₹{balance.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.summaryMetricItem}>
                <Text style={styles.metricLabel}>Transaction ID</Text>
                <Text style={styles.metricValue}>WLT829456</Text>
              </View>
            </View>

            {/* View Wallet Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleModalClose}
              style={styles.viewWalletBtn}
              accessibilityLabel="View Wallet"
            >
              <Text style={styles.viewWalletBtnText}>View Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: customerSpacing.base,
  },
  walletCardWrap: {
    width: '100%',
    height: 180,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  walletCardImage: {
    width: '95%',
    height: '100%',
  },
  walletCardOverlay: {
    position: 'absolute',
    top: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBalanceLabel: {
    fontSize: 12,
    color: '#555555',
    fontFamily: customerFonts.regular,
  },
  walletBalanceValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A2E1A',
    fontFamily: customerFonts.bold,
    marginTop: 4,
  },
  walletSubtitle: {
    fontSize: 11,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  addMoneyMainBtn: {
    backgroundColor: customerColors.brand,
    borderRadius: customerRadius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoneyMainBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: customerFonts.semibold,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF8EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: customerRadius.pill,
  },
  filterPillText: {
    fontSize: 11,
    color: customerColors.brand,
    fontFamily: customerFonts.regular,
  },
  transactionsList: {
    gap: 10,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDetailsCol: {
    flex: 1,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: customerColors.body,
    fontFamily: customerFonts.semibold,
  },
  txOrderRef: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginTop: 1,
  },
  txDate: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginTop: 1,
  },
  txRightCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: customerFonts.bold,
  },
  successPill: {
    backgroundColor: '#EDF8EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: customerRadius.pill,
  },
  successPillText: {
    fontSize: 10,
    color: customerColors.brand,
    fontFamily: customerFonts.regular,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F0',
    marginLeft: 50,
  },

  // ── ADD MONEY FORM STYLES ──────────────────────────────────────────────────
  addMoneyForm: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 13,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth * 1.5,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 6,
  },
  currencySymbol: {
    fontSize: 18,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: customerColors.body,
    fontFamily: customerFonts.semibold,
    paddingVertical: 0,
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAmountPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: customerRadius.pill,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickAmountPillSelected: {
    borderColor: customerColors.brand,
    backgroundColor: '#E9F7E9',
  },
  quickAmountText: {
    fontSize: 12,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
  },
  quickAmountTextSelected: {
    color: customerColors.brand,
    fontWeight: '700',
    fontFamily: customerFonts.bold,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodTextCol: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: customerColors.body,
    fontFamily: customerFonts.semibold,
  },
  methodSubtitle: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginTop: 2,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: customerColors.brand,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: customerColors.brand,
  },
  addMoneySubmitBtn: {
    borderRadius: customerRadius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  addMoneySubmitBtnActive: {
    backgroundColor: customerColors.brand,
  },
  addMoneySubmitBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  addMoneySubmitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: customerFonts.semibold,
  },
  addMoneySubmitBtnTextActive: {
    color: '#FFFFFF',
  },
  addMoneySubmitBtnTextDisabled: {
    color: '#9CA3AF',
  },

  // ── MODAL STYLES ───────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
  },
  modalSuccessIllustration: {
    width: 70,
    height: 70,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 11,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  summaryMetricsCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F8F2',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 20,
  },
  summaryMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2E1A',
    fontFamily: customerFonts.bold,
    marginTop: 3,
  },
  viewWalletBtn: {
    width: '100%',
    backgroundColor: customerColors.brand,
    borderRadius: customerRadius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewWalletBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: customerFonts.semibold,
  },
});

