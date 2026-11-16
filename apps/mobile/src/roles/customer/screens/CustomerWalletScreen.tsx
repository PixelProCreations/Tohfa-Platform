import React, { useState, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { customerFonts } from '../theme';
import {
  walletPouchCard,
  profileEmailVerified,
} from '../assets/images';
import { CustomerSendMoneyScreen } from './CustomerSendMoneyScreen';

export interface CustomerWalletScreenProps {
  initialBalance?: number;
  initialMode?: 'main' | 'add_money' | 'send_money';
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
  onBalanceChange?: (newBalance: number) => void;
}

// ── SVG ICONS ─────────────────────────────────────────────────────────────────

const BackArrowSvg = ({ color = '#1A1A1A', size = 18 }: { color?: string; size?: number }) => (
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

const CartIconSvg = ({ color = '#DC2626', size = 18 }: { color?: string; size?: number }) => (
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

const RefundIconSvg = ({ color = '#2563EB', size = 18 }: { color?: string; size?: number }) => (
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

const FilterSvg = ({ color = '#2E7D32', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CloseSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SendPaperPlaneSvg = ({ color = '#2E7D32', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusSvg = ({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth={2} strokeLinecap="round" />
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
    <Rect x={2} y={5} width={20} height={14} rx={2} stroke="#1A1A1A" strokeWidth={1.8} />
    <Path d="M2 10h20" stroke="#1A1A1A" strokeWidth={1.8} />
    <Rect x={6} y={14} width={4} height={2} rx={0.5} fill="#1A1A1A" />
  </Svg>
);

const BankSvg = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 21h18M3 10h18M5 10v7M9 10v7M15 10v7M19 10v7M12 3l9 5H3l9-5z" stroke="#1A1A1A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TinyTohfaLeafSvg = () => (
  <Svg width={20} height={14} viewBox="0 0 24 16" fill="none">
    <Path
      d="M12 1C6 1 2 5 2 11c0 3 3 5 7 5 5 0 13-5 13-15-4 0-8 0-10 0z"
      fill="#4CAF50"
    />
    <Path
      d="M12 1c2 4 6 7 10 8"
      stroke="#2E7D32"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

export const CustomerWalletScreen: React.FC<CustomerWalletScreenProps> = ({
  initialBalance = 1250,
  initialMode = 'main',
  onNavigate,
  onBack,
  onBalanceChange,
}) => {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState<number>(initialBalance);

  useEffect(() => {
    setBalance(initialBalance);
  }, [initialBalance]);

  const [viewMode, setViewMode] = useState<'main' | 'add_money' | 'send_money'>(initialMode);

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);
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
    setBalance((prev) => {
      const updated = prev + parsedAmount;
      onBalanceChange?.(updated);
      return updated;
    });
    setShowSuccessModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setViewMode('main');
    setAmountInput('');
  };

  if (viewMode === 'send_money') {
    return (
      <CustomerSendMoneyScreen
        walletBalance={balance}
        onBack={() => {
          if (initialMode === 'send_money' && onBack) {
            onBack();
          } else {
            setViewMode('main');
          }
        }}
        onNavigate={onNavigate}
        onSendSuccess={(amt) => setBalance((prev) => Math.max(0, prev - amt))}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (viewMode === 'add_money') {
                setViewMode('main');
              } else if (onBack) {
                onBack();
              } else {
                onNavigate?.('CustomerAccount');
              }
            }}
            style={styles.circleIconButton}
            accessibilityLabel="Back"
          >
            <BackArrowSvg color="#1A1A1A" size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My wallet</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP WALLET POUCH CARD WITH CASH (Matching Image 2) ─────────────────── */}
        <View style={styles.walletCardWrap}>
          <Image
            source={walletPouchCard}
            style={styles.walletCardImage}
            resizeMode="contain"
          />
          <View style={styles.walletBalanceOverlay}>
            <TinyTohfaLeafSvg />
            <Text style={styles.walletBalanceLabel}>Wallet Balance</Text>
            <Text style={styles.walletBalanceValue}>
              ₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Wallet ID Subtitle (Matching Image 2) */}
        <Text style={styles.walletIdText}>
          Wallet ID: <Text style={styles.walletIdBold}>TOHFA123456789</Text>
        </Text>

        {/* ── VIEW 1: MAIN WALLET VIEW (Screen 81 in Image 2) ─────────────────── */}
        {viewMode === 'main' ? (
          <>
            {/* Action Buttons (Matching Image 2) */}
            <View style={styles.actionButtonsWrap}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (onNavigate) {
                    onNavigate('CustomerSendMoney');
                  } else {
                    setViewMode('send_money');
                  }
                }}
                style={styles.sendMoneyBtn}
                accessibilityLabel="Send Money"
              >
                <SendPaperPlaneSvg color="#2E7D32" size={18} />
                <Text style={styles.sendMoneyBtnText}>Send Money</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setViewMode('add_money')}
                style={styles.addMoneyMainBtn}
                accessibilityLabel="Add Money"
              >
                <PlusSvg color="#FFFFFF" size={16} />
                <Text style={styles.addMoneyMainBtnText}>Add Money</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Transactions Section Header with Filter */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity style={styles.filterPill} activeOpacity={0.7} accessibilityLabel="Filter">
                <FilterSvg size={13} color="#2E7D32" />
                <Text style={styles.filterPillText}>Filter</Text>
              </TouchableOpacity>
            </View>

            {/* Transactions List (Matching Image 2) */}
            <View style={styles.transactionsList}>
              {/* Row 1: Added to Wallet */}
              <View style={styles.txRow}>
                <View style={[styles.txIconBox, { backgroundColor: '#EDF8EE' }]}>
                  <WalletIconSvg color="#2E7D32" size={18} />
                </View>
                <View style={styles.txDetailsCol}>
                  <Text style={styles.txTitle}>Added to Wallet</Text>
                  <Text style={styles.txDate}>12 Nov 2026, 10:24 Am</Text>
                </View>
                <View style={styles.txRightCol}>
                  <Text style={[styles.txAmount, { color: '#1A1A1A' }]}>+ ₹ 1,000.00</Text>
                  <View style={styles.successPill}>
                    <Text style={styles.successPillText}>Success</Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Row 2: Order Payment */}
              <View style={styles.txRow}>
                <View style={[styles.txIconBox, { backgroundColor: '#FFEBEE' }]}>
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

              {/* Row 3: Order Refund */}
              <View style={styles.txRow}>
                <View style={[styles.txIconBox, { backgroundColor: '#E3F2FD' }]}>
                  <RefundIconSvg color="#2563EB" size={18} />
                </View>
                <View style={styles.txDetailsCol}>
                  <Text style={styles.txTitle}>Order Refund</Text>
                  <Text style={styles.txOrderRef}>ORD-20261115-0039</Text>
                  <Text style={styles.txDate}>10 Nov 2026, 10:24 Am</Text>
                </View>
                <View style={styles.txRightCol}>
                  <Text style={[styles.txAmount, { color: '#1A1A1A' }]}>+ ₹ 390.00</Text>
                  <View style={styles.successPill}>
                    <Text style={styles.successPillText}>Success</Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />

              {/* Row 4: Added to Wallet */}
              <View style={styles.txRow}>
                <View style={[styles.txIconBox, { backgroundColor: '#EDF8EE' }]}>
                  <WalletIconSvg color="#2E7D32" size={18} />
                </View>
                <View style={styles.txDetailsCol}>
                  <Text style={styles.txTitle}>Added to Wallet</Text>
                  <Text style={styles.txDate}>10 Nov 2026, 10:24 Am</Text>
                </View>
                <View style={styles.txRightCol}>
                  <Text style={[styles.txAmount, { color: '#1A1A1A' }]}>+ ₹ 500.00</Text>
                  <View style={styles.successPill}>
                    <Text style={styles.successPillText}>Success</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* ── VIEW 2: ADD MONEY VIEW ─────────────────────────────────────────── */
          <View style={styles.addMoneyForm}>
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

            {/* UPI */}
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

            {/* Debit / Credit Card */}
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

            {/* Net Banking */}
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
          <View style={styles.successModalCard}>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    borderColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: customerFonts.editorial,
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  walletCardWrap: {
    width: '100%',
    height: 215,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  walletCardImage: {
    width: '100%',
    height: '100%',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  walletBalanceOverlay: {
    position: 'absolute',
    top: 92,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  walletBalanceLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  walletBalanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 2,
  },
  walletIdText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  walletIdBold: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  actionButtonsWrap: {
    width: '100%',
    gap: 10,
    marginBottom: 8,
  },
  sendMoneyBtn: {
    height: 46,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#2E7D32',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendMoneyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  addMoneyMainBtn: {
    height: 46,
    backgroundColor: '#2E7D32',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addMoneyMainBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: customerFonts.editorial,
    color: '#1A1A1A',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  transactionsList: {
    gap: 6,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDetailsCol: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  txOrderRef: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  txDate: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  txRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  successPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  successPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 52,
  },

  // ── ADD MONEY FORM STYLES ──────────────────────────────────────────────────
  addMoneyForm: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#1A1A1A',
    paddingVertical: 6,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
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
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickAmountPillSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  quickAmountTextSelected: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodTextCol: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  methodSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#2E7D32',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },
  addMoneySubmitBtn: {
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  addMoneySubmitBtnActive: {
    backgroundColor: '#2E7D32',
  },
  addMoneySubmitBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  addMoneySubmitBtnText: {
    fontSize: 14,
    fontWeight: '600',
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
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
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
    fontSize: 10,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 3,
  },
  viewWalletBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewWalletBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
