import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  SubWarehouseTopUpSuccessScreen,
  type TopUpSuccessData,
} from './SubWarehouseTopUpSuccessScreen';
import {
  SubWarehouseTopUpDetailsScreen,
  type TopUpDetailsData,
} from './SubWarehouseTopUpDetailsScreen';

// ─── Design Tokens (TOHFA Admin App Design System) ───────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#7A2E14',
  primaryLight:  '#FDF3F0',
  primaryBorder: '#EEDCD3',

  pageBg:        '#F3EFE9',
  cardBg:        '#FFFFFF',
  textInk:       '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted:     '#5F5E5A',
  border:        '#EEDCD3',
  divider:       '#EEDCD3',

  // Amber callout banner
  amberCalloutBg:     '#FEF3E2',
  amberCalloutBorder: '#EEDCD3',
  amberCalloutText:   '#854F0B',

  greenAmount:   '#173404',
  brownBalance:  '#7A2E14',
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

function CheckmarkIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleAmberIcon({ size = 18, color = '#B45309' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8h.01M12 11v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface ConfirmTopUpDetails {
  customerName?: string;
  customerCode?: string;
  currentBalance?: number;
  topUpAmount?: number;
  warehouseName?: string;
  processedBy?: string;
  fiscalCashTag?: string;
  dateStr?: string;
  timeStr?: string;
}

export interface SubWarehouseConfirmCashTopUpScreenProps {
  onBack?: () => void;
  onSuccess?: (confirmedData: ConfirmTopUpDetails) => void;
  details?: ConfirmTopUpDetails;
}

export function SubWarehouseConfirmCashTopUpScreen({
  onBack,
  onSuccess,
  details = {},
}: SubWarehouseConfirmCashTopUpScreenProps) {
  const customerName = details.customerName || 'Ravi Kumar';
  const customerCode = details.customerCode || 'CUS-001245';
  const [currentBalance, setCurrentBalance] = useState<number>(
    details.currentBalance ?? 4500
  );
  const topUpAmount = details.topUpAmount ?? 2000;
  const warehouseName = details.warehouseName || 'Coonoor Warehouse';
  const processedBy = details.processedBy || 'SWA – Suresh';
  const fiscalCashTag = details.fiscalCashTag || 'FC-20260925-0012';
  const dateStr = details.dateStr || '25 Sep 2026';
  const timeStr = details.timeStr || '10:42 AM';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [showDetailsScreen, setShowDetailsScreen] = useState(false);

  const newBalance = currentBalance + topUpAmount;

  // Demo Simulation 1: Mid-flow balance change
  const handleSimulateBalanceChanged = () => {
    const updated = 5200;
    setCurrentBalance(updated);
    setDemoNotice('Wallet balance changed to ₹5,200 by concurrent order! Preview updated.');
    Alert.alert(
      'Demo: Mid-flow Balance Update',
      `Another terminal updated customer wallet to ₹5,200.00.\n\nNew Balance recalculated to ₹${(updated + topUpAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`
    );
  };

  // Demo Simulation 2: Top-up failure
  const handleSimulateFailedTopUp = () => {
    Alert.alert(
      'Demo: Top-Up Failed (Simulated)',
      'Transaction rejected by banking switch (ERR_AUTH_REJECTED).\n\nCash tag tagged for manual reconciliation.',
      [{ text: 'Dismiss' }]
    );
  };

  // Confirm Top-Up Execution
  const handleConfirmTopUp = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessScreen(true);
    }, 500);
  };

  // ─── Screen: Top-Up Details (Screenshot 1) ───
  if (showDetailsScreen) {
    return (
      <SubWarehouseTopUpDetailsScreen
        details={{
          customerName,
          customerId: customerCode,
          previousBalance: `₹${currentBalance.toLocaleString('en-IN')}`,
          topUpAmount: `₹${topUpAmount.toLocaleString('en-IN')}`,
          newBalance: `₹${newBalance.toLocaleString('en-IN')}`,
          transactionId: 'WT-20260925-001245',
          status: 'Completed',
          type: 'Cash Top-Up',
          fiscalCashTag,
          dateTime: `${dateStr}, ${timeStr}`,
          createdBy: processedBy,
          createdAt: `${dateStr}, ${timeStr}`,
          warehouse: 'Coonoor',
        }}
        onBack={() => setShowDetailsScreen(false)}
      />
    );
  }

  // ─── Screen: Top-Up Successful (Screenshot 2) ───
  if (showSuccessScreen) {
    return (
      <SubWarehouseTopUpSuccessScreen
        data={{
          walletBalance: `₹${newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          topUpAmount: `₹${topUpAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          transactionId: 'WT-20260925-001245',
          customerName,
          fiscalCashTag,
          warehouseName,
          dateTime: `${dateStr}, ${timeStr}`,
        }}
        onBack={() => {
          if (onSuccess) {
            onSuccess({
              customerName,
              customerCode,
              currentBalance,
              topUpAmount,
              warehouseName,
              processedBy,
              fiscalCashTag,
              dateStr,
              timeStr,
            });
          } else if (onBack) {
            onBack();
          }
        }}
        onDone={() => {
          if (onSuccess) {
            onSuccess({
              customerName,
              customerCode,
              currentBalance,
              topUpAmount,
              warehouseName,
              processedBy,
              fiscalCashTag,
              dateStr,
              timeStr,
            });
          } else if (onBack) {
            onBack();
          }
        }}
        onViewTransaction={() => {
          setShowDetailsScreen(true);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Cash Top-Up</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Notice from demo simulation if triggered */}
        {demoNotice && (
          <View style={styles.demoNoticeBanner}>
            <Text style={styles.demoNoticeText}>{demoNotice}</Text>
          </View>
        )}

        {/* 1. Customer Section */}
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.card}>
          <Text style={styles.fieldSubLabel}>{customerName}</Text>
          <Text style={styles.fieldMainTitle}>{customerCode}</Text>
        </View>

        {/* 2. Wallet Section */}
        <Text style={styles.sectionTitle}>Wallet</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Current Balance</Text>
            <Text style={styles.cardRowValue}>
              ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Top-Up Amount</Text>
            <Text style={styles.cardRowTopUp}>
              ₹{topUpAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <Text style={styles.cardRowNewBalanceLabel}>New Balance</Text>
            <Text style={styles.cardRowNewBalanceValue}>
              ₹{newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* 3. Cash Information Section */}
        <Text style={styles.sectionTitle}>Cash Information</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldSubLabel}>Payment Method</Text>
              <Text style={styles.fieldMainTitle}>Cash</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldSubLabel}>Fiscal Cash Tag</Text>
              <Text style={styles.fieldMainTitle}>{fiscalCashTag}</Text>
            </View>
          </View>

          <View style={[styles.col, { marginTop: 12 }]}>
            <Text style={styles.fieldSubLabel}>Warehouse</Text>
            <Text style={styles.fieldMainTitle}>{warehouseName}</Text>
          </View>
        </View>

        {/* 4. Admin Information Section */}
        <Text style={styles.sectionTitle}>Admin Information</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldSubLabel}>Processed By</Text>
              <Text style={styles.fieldMainTitle}>{processedBy}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldSubLabel}>Date</Text>
              <Text style={styles.fieldMainTitle}>{dateStr}</Text>
            </View>
          </View>

          <View style={[styles.col, { marginTop: 12 }]}>
            <Text style={styles.fieldSubLabel}>Time</Text>
            <Text style={styles.fieldMainTitle}>{timeStr}</Text>
          </View>
        </View>

        {/* Amber Callout Banner (Matching Screenshot) */}
        <View style={styles.amberCalloutCard}>
          <View style={styles.amberCalloutLeft}>
            <InfoCircleAmberIcon size={18} color="#B45309" />
            <Text style={styles.amberAmountHighlight}>
              ₹ {topUpAmount.toLocaleString('en-IN')}
            </Text>
          </View>
          <Text style={styles.amberCalloutText}>
            cash will be credited to the customer's wallet. This action cannot be completed without server confirmation.
          </Text>
        </View>

        {/* Demo Simulation Buttons (in ScrollView, partially covered by sticky bar until scrolled) */}
        <TouchableOpacity
          style={styles.demoBtn}
          onPress={handleSimulateBalanceChanged}
          activeOpacity={0.75}
        >
          <Text style={styles.demoBtnText}>Simulate wallet changed mid-flow (demo)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoBtn}
          onPress={handleSimulateFailedTopUp}
          activeOpacity={0.75}
        >
          <Text style={styles.demoBtnText}>Simulate failed top-up (demo)</Text>
        </TouchableOpacity>

        {/* Bottom padding for scrolling content above sticky bar */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Sticky Bottom Action Buttons (Matching Screenshot) */}
      <View style={styles.stickyBottomBar}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirmTopUp}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <CheckmarkIcon size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Confirm Top-Up</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backOutlineBtn}
          onPress={onBack}
          activeOpacity={0.75}
        >
          <Text style={styles.backOutlineBtnText}>Back</Text>
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },

  demoNoticeBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  demoNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 16,
    marginBottom: 8,
  },

  card: {
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
  fieldSubLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  fieldMainTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // Two column row
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },

  // Wallet Card Rows
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardRowLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.textInk,
  },
  cardRowValue: {
    fontSize: 13.5,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  cardRowTopUp: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.greenAmount,
  },
  cardRowNewBalanceLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.brownBalance,
  },
  cardRowNewBalanceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.brownBalance,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },

  // Amber Callout Card (Matching User's Screenshot)
  amberCalloutCard: {
    backgroundColor: '#FEF5E7',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amberCalloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amberAmountHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },
  amberCalloutText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B45309',
    lineHeight: 18,
  },

  // Demo Simulation Buttons (In ScrollView, partially covered by sticky bar)
  demoBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  demoBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#6B3B00',
  },

  // Sticky Bottom Action Bar (Fixed at bottom of screen)
  stickyBottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#F4EFE9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  backOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  backOutlineBtnText: {
    color: '#6B3B00',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
