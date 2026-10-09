import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { RmaRecord } from './SubWarehouseReturnsIssuesScreen';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',
  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueText:      '#1E40AF',
  greenBg:       '#ECFDF5',
  greenBorder:   '#A7F3D0',
  greenText:     '#059669',
  peachBg:       '#FFEDD5',
  peachBorder:   '#FED7AA',
};

// ─── Icons ───────────────────────────────────────────────────────────────────
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

function ServerIcon({ size = 16, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="3" width="20" height="8" rx="2" stroke={color} strokeWidth="1.8" />
      <Rect x="2" y="13" width="20" height="8" rx="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="6" cy="7" r="1" fill={color} />
      <Circle cx="6" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function WalletCardIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M16 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="16" cy="12" r="1" fill={color} />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 16, color = '#8D4321' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProhibitedIcon({ size = 16, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M5.5 5.5l13 13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function QuestionCircleIcon({ size = 18, color = '#8D4321' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 16, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseRefundStatusScreenProps {
  rma: RmaRecord;
  refundAmount?: string;
  onBack: () => void;
  onConfirmSuccess: (data: { rma: RmaRecord; refundAmount: string }) => void;
  onSimulateFailure?: ((rma: RmaRecord) => void) | undefined;
}

export function SubWarehouseRefundStatusScreen({
  rma,
  refundAmount = '₹200.00',
  onBack,
  onConfirmSuccess,
  onSimulateFailure,
}: SubWarehouseRefundStatusScreenProps) {
  // State to toggle the "Confirm Wallet Refund" overlay/card (Screenshots 3 & 4)
  const [showConfirmRefund, setShowConfirmRefund] = useState(false);

  const cleanAmount = refundAmount.replace('.00', '');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Refund Status</Text>
            <Text style={styles.headerSubtitle}>{rma.rmaId}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── CASE A: Confirm Wallet Refund Card (Screenshots 3 & 4) ─── */}
        {showConfirmRefund ? (
          <View style={styles.confirmWrapperCard}>
            <View style={styles.confirmHeaderRow}>
              <QuestionCircleIcon size={18} color="#8D4321" />
              <Text style={styles.confirmTitle}>Confirm Wallet Refund</Text>
            </View>

            {/* Inner details container */}
            <View style={styles.confirmInnerBox}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Customer</Text>
                  <Text style={styles.fieldBoldVal}>{rma.customerName}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Refund Amount</Text>
                  <Text style={styles.fieldBoldVal}>{cleanAmount}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Refund Method</Text>
                <Text style={styles.fieldBoldVal}>TOHFA Wallet</Text>
              </View>
            </View>

            <Text style={styles.confirmDisclaimer}>
              This will credit the customer's wallet after server confirmation.
            </Text>

            {/* Confirm Refund Button */}
            <TouchableOpacity
              style={styles.confirmGreenBtn}
              onPress={() => onConfirmSuccess({ rma, refundAmount })}
              activeOpacity={0.85}
            >
              <CheckmarkIcon size={16} color="#059669" />
              <Text style={styles.confirmGreenText}>Confirm Refund</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelOutlineBtn}
              onPress={() => setShowConfirmRefund(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelOutlineText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ─── CASE B: Normal Refund Status View (Screenshots 1 & 2) ─── */
          <>
            {/* Refund Summary */}
            <Text style={styles.sectionHeader}>Refund Summary</Text>
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Customer</Text>
                  <Text style={styles.fieldBoldVal}>{rma.customerName}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Order</Text>
                  <Text style={styles.fieldBoldVal}>{rma.orderId}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>RMA</Text>
                  <Text style={styles.fieldBoldVal}>{rma.rmaId}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Refund Status</Text>
                  <Text style={styles.fieldBoldVal}>Pending</Text>
                </View>
              </View>
            </View>

            {/* Refund Amount */}
            <Text style={styles.sectionHeader}>Refund Amount</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Refund Amount</Text>
              <Text style={styles.amountBigVal}>{refundAmount}</Text>
            </View>

            {/* Refund Method */}
            <Text style={styles.sectionHeader}>Refund Method</Text>
            <View style={styles.card}>
              <Text style={styles.fieldBoldVal}>TOHFA Wallet</Text>
            </View>

            {/* Wallet Refund Section */}
            <Text style={styles.sectionHeader}>Wallet Refund</Text>
            <TouchableOpacity
              style={styles.processWalletBtn}
              onPress={() => setShowConfirmRefund(true)}
              activeOpacity={0.88}
            >
              <WalletCardIcon size={18} color="#FFFFFF" />
              <Text style={styles.processWalletText}>Process Wallet Refund</Text>
            </TouchableOpacity>

            {/* SWA Permission Chip */}
            <View style={styles.permissionBox}>
              <ShieldCheckIcon size={16} color="#8D4321" />
              <Text style={styles.permissionText}>
                Available because SWA has wallet-refund permission and the RMA is approved and eligible for refund.
              </Text>
            </View>

            {/* Bank Refund Example Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Bank Refund Example</Text>
              <Text style={styles.ifExistsText}>If it exists</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Refund Method</Text>
                  <Text style={styles.fieldBoldVal}>Bank</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <Text style={styles.fieldBoldVal}>Processing</Text>
                </View>
              </View>
            </View>

            {/* No Bank Refund Action Notice */}
            <View style={styles.noBankNoticeBox}>
              <ProhibitedIcon size={16} color="#7A726C" />
              <Text style={styles.noBankNoticeText}>
                No "Process Bank Refund" action — SWA does not have that permission. Bank refunds are managed by an authorized finance/admin role; SWA can only view status here.
              </Text>
            </View>

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Section Header */
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 8,
    marginTop: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  ifExistsText: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    fontWeight: '600',
  },

  /* Card */
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  fieldBoldVal: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  amountBigVal: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },

  /* Blue Notice Box */
  blueNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PALETTE.blueBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    gap: 10,
  },
  blueNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.blueText,
    flex: 1,
    lineHeight: 16,
  },

  /* Process Wallet Refund Button */
  processWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 8,
  },
  processWalletText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* SWA Permission Box */
  permissionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PALETTE.peachBg,
    borderWidth: 1,
    borderColor: PALETTE.peachBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  permissionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8D4321',
    flex: 1,
    lineHeight: 16,
  },

  /* No Bank Notice Box */
  noBankNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F7F4EE',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 12,
    gap: 10,
  },
  noBankNoticeText: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    flex: 1,
    lineHeight: 16,
  },

  /* Simulate Failure Button */
  simulateFailureBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  simulateFailureText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8D4321',
  },

  /* ─── Confirm Wallet Refund Overlay Card (Screenshots 3 & 4) ─── */
  confirmWrapperCard: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8D4321',
  },
  confirmInnerBox: {
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  confirmDisclaimer: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 16,
    lineHeight: 17,
  },
  confirmGreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 12,
    paddingVertical: 13,
    gap: 8,
    marginBottom: 10,
  },
  confirmGreenText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  cancelOutlineBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    borderRadius: 12,
    paddingVertical: 13,
  },
  cancelOutlineText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8D4321',
  },
});
