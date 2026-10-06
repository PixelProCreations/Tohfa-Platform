import React from 'react';
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
  greenBg:       '#ECFDF5',
  greenBorder:   '#A7F3D0',
  greenText:     '#059669',
  redBg:         '#FEF2F2',
  redBorder:     '#FECACA',
  redText:       '#DC2626',
};

// ─── Icons ───────────────────────────────────────────────────────────────────
function BigSuccessCheckIcon({ size = 52, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
      <Path d="M8 12l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BigRejectCrossIcon({ size = 52, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseRmaResolutionSuccessScreenProps {
  rma: RmaRecord;
  status: 'Approved' | 'Rejected';
  approvedQty?: string;
  refundAmount?: string;
  onViewReturnsList: () => void;
  onBackToMore: () => void;
}

export function SubWarehouseRmaResolutionSuccessScreen({
  rma,
  status = 'Approved',
  approvedQty = '1.8 KG',
  refundAmount = '₹180.00',
  onViewReturnsList,
  onBackToMore,
}: SubWarehouseRmaResolutionSuccessScreenProps) {
  const isApproved = status === 'Approved';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Success Badge */}
        <View style={styles.statusWrap}>
          <View
            style={[
              styles.iconCircle,
              isApproved ? styles.iconCircleGreen : styles.iconCircleRed,
            ]}
          >
            {isApproved ? (
              <BigSuccessCheckIcon size={44} color="#059669" />
            ) : (
              <BigRejectCrossIcon size={44} color="#DC2626" />
            )}
          </View>

          <Text style={styles.statusTitle}>
            {isApproved ? 'Return Request Approved' : 'Return Request Rejected'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isApproved
              ? `Refund processed & credited to ${rma.customerName}'s wallet.`
              : 'Claim has been marked as rejected with no refund issued.'}
          </Text>
        </View>

        {/* Resolution Details Card */}
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>RMA Reference</Text>
              <Text style={styles.fieldBoldVal}>{rma.rmaId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Order ID</Text>
              <Text style={styles.fieldBoldVal}>{rma.orderId}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldBoldVal}>{rma.customerName}</Text>
              <Text style={styles.fieldSubVal}>{rma.customerId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Settlement Status</Text>
              <View
                style={[
                  styles.badgePill,
                  isApproved ? styles.badgePillGreen : styles.badgePillRed,
                ]}
              >
                <Text
                  style={[
                    styles.badgePillText,
                    isApproved ? styles.badgePillTextGreen : styles.badgePillTextRed,
                  ]}
                >
                  {status}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {isApproved && (
            <>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Approved Quantity</Text>
                  <Text style={styles.fieldBoldVal}>{approvedQty}</Text>
                  <Text style={styles.fieldSubVal}>{rma.productName} ({rma.grade})</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Refund Credited</Text>
                  <Text style={[styles.fieldBoldVal, { color: PALETTE.primary, fontSize: 18 }]}>
                    {refundAmount}
                  </Text>
                  <Text style={styles.fieldSubVal}>Customer Wallet</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Stock Disposition</Text>
                <Text style={styles.dispositionText}>
                  {approvedQty} written off to Spoilage / Damage Waste Log
                </Text>
              </View>
            </>
          )}

          {!isApproved && (
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Rejection Disposition</Text>
              <Text style={styles.dispositionText}>
                No refund issued. Produce returned to customer custody.
              </Text>
            </View>
          )}
        </View>

        {/* Audit Timestamp Banner */}
        <View style={styles.auditBanner}>
          <Text style={styles.auditBannerText}>
            Resolved by SWA – Suresh on 25 Sep 2026, 10:45 AM · Coonoor Warehouse
          </Text>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onViewReturnsList}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>View in Returns & Issues</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onBackToMore}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryBtnText}>Back to More Menu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 36,
  },

  /* Top Status */
  statusWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleGreen: {
    backgroundColor: '#DCFCE7',
  },
  iconCircleRed: {
    backgroundColor: '#FEE2E2',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
    marginBottom: 6,
  },
  statusSubtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },

  /* Card */
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 14,
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
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  fieldSubVal: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },
  dispositionText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },

  /* Badge Pill */
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 2,
  },
  badgePillGreen: {
    backgroundColor: '#DCFCE7',
  },
  badgePillRed: {
    backgroundColor: '#FEE2E2',
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgePillTextGreen: {
    color: '#15803D',
  },
  badgePillTextRed: {
    color: '#B91C1C',
  },

  /* Audit Banner */
  auditBanner: {
    backgroundColor: '#F4EFE9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  auditBannerText: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },

  /* Bottom Bar */
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
});
