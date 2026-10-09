// Design id: M8-S01A
/**
 * Needs Attention: pending, failed, missing-fiscal-tag and reconciliation
 * items of the cash top-up desk. Items are limited to the own warehouse when
 * scope.warehouseId is set.
 *
 * Gates (FINAL_LIST #153):
 *   - 'Mark Cash Verified & Credit Wallet' and 'Retry Top-Up' only when
 *     can('wallet.cash_topup.process') AND can('wallet.cash_topup.fiscal_tag').
 *     "Mark verified" only SUBMITS the verification: the wallet credit is the
 *     server's fiscal-tag-triggered credit, never a local balance edit (BR-18,
 *     CLAUDE.md 2.3). Retry re-enters the gated cash top-up wizard.
 *   - 'Generate & Attach Fiscal Tag' only when can('wallet.cash_topup.fiscal_tag').
 *   - 'Refund Cash to Customer' is never rendered: no rbac code governs a cash
 *     refund (rma.refund.wallet_process / bank_process cover RMA refunds only).
 *     SPEC_GAPS W4i-2.
 *   - 'Acknowledge & Close Day Variance' has no code (daily cash
 *     reconciliation is unspecified in rbac.json): ungated, SPEC_GAPS W4i-3.
 *
 * Absorbs dashboard/MainWarehouseWalletAttentionScreen (its failed top-up ->
 * cash top-up link and "daily cash reconciliation pending" row, which opens
 * the daily cash summary).
 */
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { ATTENTION_ISSUES, warehouseNameOf } from './fixtures';
import type { AttentionCategory, AttentionIssue, WalletTransactionRecord, WarehouseScreenBaseProps } from './types';
import {
  ChipGroup,
  EmptyState,
  PermissionNote,
  StatusBadge,
  SuccessCircleIcon,
  WalletButton,
  WalletScreen,
  inScope,
  isAllWarehouses,
  walletLayout,
} from './WalletParts';

export interface WalletAttentionScreenProps extends WarehouseScreenBaseProps {
  initialCategory?: AttentionCategory | undefined;
  issues?: readonly AttentionIssue[] | undefined;
  /** Re-enter the cash top-up wizard (failed top-up). */
  onRetryTopUp?: (() => void) | undefined;
  /** Open the daily cash summary (reconciliation items). */
  onOpenDailyCash?: (() => void) | undefined;
  /** Open a transaction (missing fiscal tag item). */
  onReviewTransaction?: ((transaction: WalletTransactionRecord) => void) | undefined;
}

const CATEGORIES: readonly AttentionCategory[] = ['all', 'pending', 'failed', 'fiscal', 'reconciliation'];
const CATEGORY_LABEL: Record<AttentionCategory, string> = {
  all: 'All',
  pending: 'Pending',
  failed: 'Failed',
  fiscal: 'Fiscal Tag',
  reconciliation: 'Discrepancy',
};

/** Secondary actions with no governing rbac code that must never be offered (SPEC_GAPS W4i-2). */
const NEVER_RENDERED = new Set(['Refund Cash to Customer']);

export function WalletAttentionScreen({
  scope,
  can,
  onBack,
  initialCategory = 'all',
  issues: sourceIssues = ATTENTION_ISSUES,
  onRetryTopUp,
  onOpenDailyCash,
  onReviewTransaction,
}: WalletAttentionScreenProps) {
  const [category, setCategory] = useState<AttentionCategory>(initialCategory);
  const [resolvedIds, setResolvedIds] = useState<readonly string[]>([]);

  const canTopUp = can('wallet.cash_topup.process') && can('wallet.cash_topup.fiscal_tag');
  const canTag = can('wallet.cash_topup.fiscal_tag');

  const issues = useMemo(
    () => sourceIssues.filter((item) => inScope(scope, item.warehouseId) && !resolvedIds.includes(item.id)),
    [sourceIssues, scope, resolvedIds],
  );
  const filtered = category === 'all' ? issues : issues.filter((item) => item.category === category);
  const countOf = (c: AttentionCategory) => (c === 'all' ? issues.length : issues.filter((i) => i.category === c).length);

  const resolveLocally = (item: AttentionIssue) => setResolvedIds((prev) => [...prev, item.id]);

  /** Whether the primary action is offered, by category (see the header). */
  const primaryAllowed = (item: AttentionIssue): boolean => {
    switch (item.category) {
      case 'pending':
      case 'failed':
        return canTopUp;
      case 'fiscal':
        return canTag;
      default:
        return true; // reconciliation: no code exists (SPEC_GAPS W4i-3).
    }
  };

  const handlePrimary = (item: AttentionIssue) => {
    if (!primaryAllowed(item)) return;
    if (item.category === 'failed') {
      onRetryTopUp?.();
      return;
    }
    const message =
      item.category === 'pending'
        ? `Cash verification for ${item.id} was submitted. The wallet is credited by the server once the fiscal tag is confirmed.`
        : `Action submitted for ${item.title} (${item.id}).`;
    Alert.alert(item.primaryAction, message, [{ text: 'OK', onPress: () => resolveLocally(item) }]);
  };

  const handleSecondary = (item: AttentionIssue) => {
    if (item.category === 'reconciliation' && onOpenDailyCash) {
      onOpenDailyCash();
    } else if (item.category === 'fiscal' && onReviewTransaction) {
      onReviewTransaction({
        transactionId: item.id,
        customerName: item.customer,
        customerId: item.customerId,
        amount: item.amount,
        status: 'Completed',
        type: 'Cash Top-Up',
        fiscalCashTag: 'Missing',
        dateTime: item.time,
        warehouseId: item.warehouseId,
      });
    } else if (item.category === 'failed') {
      resolveLocally(item);
    } else {
      Alert.alert(item.secondaryAction ?? 'Dismissed', `Action recorded for ${item.id}.`);
    }
  };

  return (
    <WalletScreen title="Needs Attention" onBack={onBack}>
      <View style={styles.filterBar}>
        <ChipGroup
          options={CATEGORIES}
          value={category}
          onChange={setCategory}
          labelOf={(c) => `${CATEGORY_LABEL[c]} (${countOf(c)})`}
        />
      </View>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <SuccessCircleIcon />
            <EmptyState title="All Caught Up!" subtitle="No pending issues requiring your attention in this category." />
          </View>
        ) : (
          filtered.map((item) => {
            const showPrimary = primaryAllowed(item);
            const showSecondary = item.secondaryAction !== undefined && !NEVER_RENDERED.has(item.secondaryAction);
            return (
              <View key={item.id} style={styles.issueCard}>
                <View style={styles.cardHeader}>
                  <StatusBadge label={item.badgeLabel} tone={item.severity === 'error' ? 'danger' : 'warning'} />
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                <Text style={styles.issueTitle}>{item.title}</Text>
                <View style={styles.targetRow}>
                  <Text style={styles.customer}>{item.customer}</Text>
                  <Text style={styles.meta}>· {item.customerId}</Text>
                  <View style={styles.amountPill}>
                    <Text style={styles.amountText}>{item.amount}</Text>
                  </View>
                </View>
                {isAllWarehouses(scope) ? <Text style={styles.meta}>{warehouseNameOf(item.warehouseId)}</Text> : null}
                <View style={styles.descriptionBox}>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
                <View style={styles.diagnosticsBox}>
                  <Text style={styles.diagnosticsLabel}>Diagnostic Info:</Text>
                  <Text style={styles.diagnostics}>{item.diagnostics}</Text>
                </View>
                <View style={styles.actions}>
                  {showPrimary ? (
                    <WalletButton label={item.primaryAction} onPress={() => handlePrimary(item)} />
                  ) : (
                    <PermissionNote>
                      {item.category === 'fiscal'
                        ? 'Attaching a fiscal tag needs wallet.cash_topup.fiscal_tag.'
                        : 'Resolving a top-up needs wallet.cash_topup.process and wallet.cash_topup.fiscal_tag.'}
                    </PermissionNote>
                  )}
                  {showSecondary ? (
                    <WalletButton label={item.secondaryAction ?? ''} variant="outline" onPress={() => handleSecondary(item)} />
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    backgroundColor: adminColors.card,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.lg,
  },
  empty: { alignItems: 'center', paddingTop: adminSpacing.xxl },
  issueCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { ...adminType.rowMeta, color: adminColors.muted },
  issueTitle: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.sm },
  targetRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: adminSpacing.xs, marginTop: adminSpacing.xs },
  customer: { ...adminType.rowTitle, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted },
  amountPill: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  amountText: { ...adminType.caption, color: adminColors.brandDeep },
  descriptionBox: { backgroundColor: adminColors.canvas, borderRadius: adminRadius.sm, padding: adminSpacing.sm, marginTop: adminSpacing.sm },
  description: { ...adminType.rowMeta, color: adminColors.ink },
  diagnosticsBox: {
    borderLeftWidth: 3,
    borderLeftColor: adminColors.border,
    paddingLeft: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  diagnosticsLabel: { ...adminType.caption, color: adminColors.muted },
  diagnostics: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  actions: { gap: adminSpacing.sm, marginTop: adminSpacing.md },
});
