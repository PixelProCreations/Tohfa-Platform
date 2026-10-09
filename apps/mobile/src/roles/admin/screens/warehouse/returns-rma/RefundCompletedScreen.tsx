/**
 * Refund Completed — result screen after the wallet refund was confirmed.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - none for the result itself; the "View Return History" link is offered
 *     only with `rma.request.process` (FINAL_LIST row 95).
 *
 * Absorbs MainWarehouseRefundCompletedScreen (pair M10-S05C): its "View
 * Return History" footer button is ported behind the gate above; its
 * row-style timeline is covered by the Sub timeline.
 */
// Design id: M10-S05C
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { REFUND_TIMELINE, SAMPLE_REFUND_TRANSACTION_ID } from './fixtures';
import { ResultHero, ReturnsButton, ReturnsFooter, ReturnsScreen, ReturnsTimeline, SectionTitle } from './ReturnsParts';
import type { RmaScreenBaseProps } from './types';

export interface RefundCompletedScreenProps extends RmaScreenBaseProps {
  refundAmount: string;
  transactionId?: string | undefined;
  onViewReturnHistory?: (() => void) | undefined;
}

function SuccessCheckmarkIcon() {
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2.2" />
      <Path
        d="M8 12l2.5 2.5 5.5-5.5"
        stroke={adminColors.success.text}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RefundCompletedScreen({
  can,
  rma,
  refundAmount,
  transactionId = SAMPLE_REFUND_TRANSACTION_ID,
  onBack,
  onViewReturnHistory,
}: RefundCompletedScreenProps) {
  const showHistoryLink = can('rma.request.process') && onViewReturnHistory !== undefined;
  const cleanAmount = refundAmount.replace('.00', '');

  return (
    <ReturnsScreen
      title="Refund Completed"
      subtitle={rma.rmaId}
      onBack={onBack}
      footer={
        showHistoryLink ? (
          <ReturnsFooter>
            <ReturnsButton label="View Return History" onPress={() => onViewReturnHistory?.()} />
          </ReturnsFooter>
        ) : null
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResultHero
          tone="success"
          icon={<SuccessCheckmarkIcon />}
          title="Refund Completed"
          subtitle={`${cleanAmount} credited to customer wallet`}
        />

        <View style={styles.transactionCard}>
          <Text style={styles.transactionLabel}>Transaction ID</Text>
          <Text style={styles.transactionValue}>{transactionId}</Text>
        </View>

        <SectionTitle>Refund Timeline</SectionTitle>
        <ReturnsTimeline items={REFUND_TIMELINE} />
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingBottom: adminSpacing.xxl },
  transactionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  transactionLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  transactionValue: { ...adminType.kpiValue, color: adminColors.ink },
});
