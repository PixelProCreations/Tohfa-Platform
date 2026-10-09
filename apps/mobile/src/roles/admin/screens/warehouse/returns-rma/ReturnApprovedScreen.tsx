/**
 * Return Approved — result screen after an RMA was approved.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - "Refund Status" only with `rma.refund.approve` (FINAL_LIST row 100).
 *     Without it the header back arrow is the way out.
 *
 * Absorbs MainWarehouseReturnApprovedScreen (pair M10-S04A), which W3b had
 * merged into ReturnResultScreen variant 'RETURN_APPROVED'; the Main review
 * flow now reaches this screen through ReturnsFlow and the variant is gone.
 */
// Design id: M10-S04A
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminSpacing } from '../../../theme';
import { ResultHero, ReturnsButton, ReturnsFooter, ReturnsScreen } from './ReturnsParts';
import type { RmaRecord, RmaScreenBaseProps } from './types';

export interface ReturnApprovedScreenProps extends RmaScreenBaseProps {
  onGoToRefundStatus: (rma: RmaRecord) => void;
}

function CheckmarkCircleIcon() {
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
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

function CashIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={adminColors.onBrand} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={adminColors.onBrand} strokeWidth="2" />
    </Svg>
  );
}

export function ReturnApprovedScreen({ can, rma, onBack, onGoToRefundStatus }: ReturnApprovedScreenProps) {
  const canSeeRefund = can('rma.refund.approve');

  return (
    <ReturnsScreen
      title="Return Approved"
      subtitle={rma.rmaId}
      onBack={onBack}
      footer={
        canSeeRefund ? (
          <ReturnsFooter>
            <ReturnsButton label="Refund Status" icon={<CashIcon />} onPress={() => onGoToRefundStatus(rma)} />
          </ReturnsFooter>
        ) : null
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResultHero tone="success" icon={<CheckmarkCircleIcon />} title="Return Approved" subtitle={rma.rmaId} />
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingBottom: adminSpacing.xl },
});
