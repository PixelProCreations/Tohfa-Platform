// Design id: M8-S01
import React from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { SAMPLE_FISCAL_TAG, SAMPLE_WALLET_CUSTOMER } from './fixtures';
import type { AttentionCategory, WalletCustomer, WarehouseScreenBaseProps } from './types';
import { WarehouseTabBar } from './WalletParts';

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

function WalletHeaderIcon({ size = 24, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="2.2" />
      <Path d="M2 10h20" stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="14" r="1.5" fill={color} />
    </Svg>
  );
}

function BellIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockBadgeIcon({ size = 13, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="10" width="16" height="11" rx="2.5" stroke={color} strokeWidth="2" />
      <Path d="M8 10V6.5a4 4 0 0 1 8 0V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CashIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function EllipsisPendingIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="12" r="1.2" fill={color} />
      <Circle cx="12" cy="12" r="1.2" fill={color} />
      <Circle cx="16" cy="12" r="1.2" fill={color} />
    </Svg>
  );
}

function ExclamationFailedIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7.5v5M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserSearchIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Circle cx="19" cy="11" r="3" stroke={color} strokeWidth="2" />
      <Path d="M21 13l2 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryClockIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5M12 7v5l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ScalesIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v18M6 7l6-3 6 3M6 7l-3 7h6l-3-7zM18 7l-3 7h6l-3-7zM4 21h16" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TagIcon({ size = 20, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="7" r="1.5" fill={color} />
    </Svg>
  );
}

function ChevronRight({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertTriangleIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Interfaces ──────────────────────────────────────────────────────────────
/**
 * Wallet Operations hub, shared by Main and Sub Warehouse.
 * `scope.warehouseId === undefined` is Main (all warehouses); otherwise the
 * screen is locked to that warehouse. `can` only decides what is worth
 * rendering; the server re-checks every permission (CLAUDE.md 2.1).
 *
 * W4: the hub is a plain screen now. The sub-screen state machine it carried
 * (customer search -> wallet -> cash top-up -> fiscal tag -> confirm, history,
 * daily summary, needs attention) is WalletFlow, which also adds the steps W2b
 * skipped (Top-Up Successful -> Top-Up Details after confirm).
 */
export interface WalletOperationsScreenProps extends WarehouseScreenBaseProps {
  onNavigateToNotifications?: (() => void) | undefined;
  onNavigateToProfile?: (() => void) | undefined;
  onNavigateToCashTopUp: () => void;
  onNavigateToCustomerSearch: () => void;
  onNavigateToTopUpHistory: () => void;
  onNavigateToDailySummary: () => void;
  onNavigateToAttention: (category: AttentionCategory) => void;
  /** Open the wallet of a recent top-up's customer. */
  onOpenCustomerWallet: (customer: WalletCustomer) => void;
  /** Today's counters (mock until the wallet-operations API exists). */
  todayTopUpsCount?: number | undefined;
  cashCollectedTotal?: number | undefined;
}

export function WalletOperationsScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToCashTopUp,
  onNavigateToCustomerSearch,
  onNavigateToTopUpHistory,
  onNavigateToDailySummary,
  onNavigateToAttention,
  onOpenCustomerWallet,
  todayTopUpsCount = 24,
  cashCollectedTotal = 18500,
}: WalletOperationsScreenProps) {
  const isLockedToWarehouse = scope.warehouseId !== undefined;
  const warehouseLabel = isLockedToWarehouse ? scope.warehouseName ?? '' : 'All Warehouses';

  // BR-18: a cash top-up cannot complete without the fiscal cash tag, so the
  // flow is only offered to admins who hold both permissions. Server re-checks.
  const canFiscalTag = can('wallet.cash_topup.fiscal_tag');
  const canCashTopUp = can('wallet.cash_topup.process') && canFiscalTag;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        decelerationRate={0.985}
        bounces={true}
      >
        {/* ─── Top Brand Header Banner ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleGroup}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Go back"
              >
                <ArrowBackIcon size={24} color={adminColors.onBrand} />
              </TouchableOpacity>
              <WalletHeaderIcon size={24} color={adminColors.onBrand} />
              <Text style={styles.headerTitleText}>Wallet Operations</Text>
            </View>

            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                if (onNavigateToNotifications) onNavigateToNotifications();
                else Alert.alert('Notifications', 'Wallet and inventory notifications.');
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Notifications"
            >
              <BellIcon size={20} color={adminColors.onBrand} />
            </TouchableOpacity>
          </View>

          {/* Lock + "Active" only when the admin is pinned to one warehouse; Main sees all. */}
          <View style={styles.assignedWarehousePill}>
            {isLockedToWarehouse && <LockBadgeIcon size={12} color={adminColors.onBrand} />}
            <Text style={styles.assignedWarehouseText}>
              {isLockedToWarehouse ? `${warehouseLabel} · Active` : warehouseLabel}
            </Text>
          </View>
        </View>

        {/* ─── Main Content Body ─── */}
        <View style={styles.mainContainer}>
          {/* 1. KPI Overview Grid (2x2) */}
          <View style={styles.kpiGrid}>
            {/* Today's Top-Ups */}
            <TouchableOpacity
              style={styles.kpiCard}
              activeOpacity={0.8}
              onPress={onNavigateToTopUpHistory}
            >
              <View style={styles.kpiIconWrap}>
                <CalendarIcon size={20} color={adminColors.brandDeep} />
              </View>
              <Text style={styles.kpiValue}>{todayTopUpsCount}</Text>
              <Text style={styles.kpiLabel}>Today's Top-Ups</Text>
            </TouchableOpacity>

            {/* Cash Collected */}
            <TouchableOpacity
              style={styles.kpiCard}
              activeOpacity={0.8}
              onPress={onNavigateToDailySummary}
            >
              <View style={styles.kpiIconWrap}>
                <CashIcon size={20} color={adminColors.brandDeep} />
              </View>
              <Text style={styles.kpiValue}>₹{cashCollectedTotal.toLocaleString('en-IN')}</Text>
              <Text style={styles.kpiLabel}>Cash Collected</Text>
            </TouchableOpacity>

            {/* Pending */}
            <TouchableOpacity
              style={styles.kpiCard}
              activeOpacity={0.8}
              onPress={() => onNavigateToAttention('pending')}
            >
              <View style={styles.kpiIconWrap}>
                <EllipsisPendingIcon size={20} color={adminColors.brandDeep} />
              </View>
              <Text style={styles.kpiValue}>2</Text>
              <Text style={styles.kpiLabel}>Pending</Text>
            </TouchableOpacity>

            {/* Failed */}
            <TouchableOpacity
              style={styles.kpiCard}
              activeOpacity={0.8}
              onPress={() => onNavigateToAttention('failed')}
            >
              <View style={styles.kpiIconWrap}>
                <ExclamationFailedIcon size={20} color={adminColors.brandDeep} />
              </View>
              <Text style={[styles.kpiValue, { color: adminColors.danger.text }]}>1</Text>
              <Text style={styles.kpiLabel}>Failed</Text>
            </TouchableOpacity>
          </View>

          {/* 2. Quick Actions Section */}
          <Text style={styles.sectionHeading}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {/* Cash Top-Up (hidden unless the admin may process + fiscal-tag) */}
            {canCashTopUp && (
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={onNavigateToCashTopUp}
                activeOpacity={0.75}
              >
                <View style={styles.quickActionIconWrap}>
                  <PlusIcon size={20} color={adminColors.brand} />
                </View>
                <Text style={styles.quickActionLabel}>Cash Top-Up</Text>
              </TouchableOpacity>
            )}

            {/* Find Customer */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={onNavigateToCustomerSearch}
              activeOpacity={0.75}
            >
              <View style={styles.quickActionIconWrap}>
                <UserSearchIcon size={20} color={adminColors.brand} />
              </View>
              <Text style={styles.quickActionLabel}>Find Customer</Text>
            </TouchableOpacity>

            {/* Top-Up History */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={onNavigateToTopUpHistory}
              activeOpacity={0.75}
            >
              <View style={styles.quickActionIconWrap}>
                <HistoryClockIcon size={20} color={adminColors.brand} />
              </View>
              <Text style={styles.quickActionLabel}>Top-Up History</Text>
            </TouchableOpacity>
          </View>

          {/* Full Width Action: Daily Summary */}
          <TouchableOpacity
            style={styles.dailySummaryCard}
            onPress={onNavigateToDailySummary}
            activeOpacity={0.75}
          >
            <View style={styles.dailySummaryIconWrap}>
              <ScalesIcon size={22} color={adminColors.brand} />
            </View>
            <Text style={styles.dailySummaryLabel}>Daily Summary</Text>
          </TouchableOpacity>

          {/* 3. Recent Top-Ups Section */}
          <Text style={styles.sectionHeading}>Recent Top-Ups</Text>
          <TouchableOpacity
            style={styles.recentTopUpCard}
            onPress={() => onOpenCustomerWallet(SAMPLE_WALLET_CUSTOMER)}
            activeOpacity={0.8}
          >
            <View style={styles.recentTopUpTopRow}>
              <Text style={styles.recentCustomerName}>Ravi Kumar</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            </View>

            <Text style={styles.recentCustCode}>CUS-001245</Text>

            <View style={styles.recentTagAndAmountRow}>
              <Text style={styles.recentFiscalTag}>Fiscal Tag: {SAMPLE_FISCAL_TAG}</Text>
              <Text style={styles.recentAmount}>₹2,000</Text>
            </View>

            <View style={styles.recentBottomRow}>
              <Text style={styles.recentTypeAndDate}>Cash Top-Up</Text>
              <Text style={styles.recentDateText}>Today, 10:42 AM</Text>
            </View>
          </TouchableOpacity>

          {/* 4. Needs Attention Section */}
          <TouchableOpacity
            style={styles.needsAttentionHeadingRow}
            onPress={() => onNavigateToAttention('all')}
            activeOpacity={0.7}
          >
            <AlertTriangleIcon size={16} color={adminColors.ink} />
            <Text style={styles.needsAttentionHeading}>Needs Attention</Text>
          </TouchableOpacity>

          <View style={styles.needsAttentionList}>
            {/* 1. Pending top-up */}
            <TouchableOpacity
              style={styles.attentionRowCard}
              onPress={() => onNavigateToAttention('pending')}
              activeOpacity={0.75}
            >
              <View style={[styles.attentionLeftStripe, { backgroundColor: adminColors.warning.text }]} />
              <View style={styles.attentionLeftWrap}>
                <EllipsisPendingIcon size={20} color={adminColors.warning.text} />
                <View style={styles.attentionTextWrap}>
                  <Text style={styles.attentionTitle}>Pending top-up</Text>
                  <Text style={styles.attentionSub}>1 transaction awaiting verification</Text>
                </View>
              </View>
              <ChevronRight size={18} color={adminColors.muted} />
            </TouchableOpacity>

            {/* 2. Failed transaction */}
            <TouchableOpacity
              style={styles.attentionRowCard}
              onPress={() => onNavigateToAttention('failed')}
              activeOpacity={0.75}
            >
              <View style={[styles.attentionLeftStripe, { backgroundColor: adminColors.danger.text }]} />
              <View style={styles.attentionLeftWrap}>
                <ExclamationFailedIcon size={20} color={adminColors.danger.text} />
                <View style={styles.attentionTextWrap}>
                  <Text style={styles.attentionTitle}>Failed transaction</Text>
                  <Text style={styles.attentionSub}>1 top-up did not complete</Text>
                </View>
              </View>
              <ChevronRight size={18} color={adminColors.danger.text} />
            </TouchableOpacity>

            {/* 3. Missing fiscal tag */}
            {canFiscalTag && (
              <TouchableOpacity
                style={styles.attentionRowCard}
                onPress={() => onNavigateToAttention('fiscal')}
                activeOpacity={0.75}
              >
                <View style={[styles.attentionLeftStripe, { backgroundColor: adminColors.warning.text }]} />
                <View style={styles.attentionLeftWrap}>
                  <TagIcon size={20} color={adminColors.warning.text} />
                  <View style={styles.attentionTextWrap}>
                    <Text style={styles.attentionTitle}>Missing fiscal tag</Text>
                    <Text style={styles.attentionSub}>1 transaction needs review</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={adminColors.muted} />
              </TouchableOpacity>
            )}

            {/* 4. Reconciliation discrepancy */}
            <TouchableOpacity
              style={styles.attentionRowCard}
              onPress={() => onNavigateToAttention('reconciliation')}
              activeOpacity={0.75}
            >
              <View style={[styles.attentionLeftStripe, { backgroundColor: adminColors.warning.text }]} />
              <View style={styles.attentionLeftWrap}>
                <ScalesIcon size={20} color={adminColors.warning.text} />
                <View style={styles.attentionTextWrap}>
                  <Text style={styles.attentionTitle}>Reconciliation discrepancy</Text>
                  <Text style={styles.attentionSub}>Yesterday's cash count</Text>
                </View>
              </View>
              <ChevronRight size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />
    </SafeAreaView>
  );
}
// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingBottom: adminSpacing.xl,
  },
  mainContainer: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },

  // ─── Top Brand Header Banner ────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    marginRight: 2,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    // Was white at 20% over the orange header; no overlay token, so a solid darker brand disc.
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignedWarehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    // Was white 20% fill + white 40% border; solid brandDeep, no border.
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 6,
    marginTop: adminSpacing.md,
    gap: 6,
  },
  assignedWarehouseText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },

  // ─── KPI 2x2 Grid ──────────────────────────────────────────────────────────
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48.2%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  kpiIconWrap: {
    marginBottom: adminSpacing.md,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  kpiLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },

  // ─── Section Headings ──────────────────────────────────────────────────────
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },

  // ─── Quick Actions ─────────────────────────────────────────────────────────
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: 18,
    paddingHorizontal: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  quickActionIconWrap: {
    marginBottom: adminSpacing.sm,
  },
  quickActionLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'center',
  },
  dailySummaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 20,
  },
  dailySummaryIconWrap: {
    marginBottom: 6,
  },
  dailySummaryLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },

  // ─── Recent Top-Ups ────────────────────────────────────────────────────────
  recentTopUpCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 20,
  },
  recentTopUpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentCustomerName: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  completedBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 10,
    paddingVertical: adminSpacing.xs,
  },
  completedBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  recentCustCode: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
    marginBottom: adminSpacing.md,
  },
  recentTagAndAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  recentFiscalTag: {
    ...adminType.body,
    color: adminColors.muted,
  },
  recentAmount: {
    ...adminType.title,
    color: adminColors.ink,
  },
  recentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: adminSpacing.xs,
  },
  recentTypeAndDate: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  recentDateText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },

  // ─── Needs Attention ───────────────────────────────────────────────────────
  needsAttentionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: adminSpacing.md,
  },
  needsAttentionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  needsAttentionList: {
    gap: adminSpacing.md,
    marginBottom: 20,
  },
  attentionRowCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    position: 'relative',
    ...adminShadow.sm,
  },
  attentionLeftStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: adminRadius.xl,
    borderBottomLeftRadius: adminRadius.xl,
  },
  attentionLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  attentionTextWrap: {
    flex: 1,
  },
  attentionTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  attentionSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
});
