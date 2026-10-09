/**
 * Refund Failed — the wallet refund could not be confirmed.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1), FINAL_LIST row 96:
 *   - No blind retry. The only way forward is "Check Refund Status", which
 *     returns to RefundStatusScreen (where the wallet-refund action is itself
 *     gated), and it is offered only with `rma.refund.wallet_process`.
 */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminSpacing } from '../../../theme';
import { ResultHero, ReturnsButton, ReturnsFooter, ReturnsScreen } from './ReturnsParts';
import type { RmaRecord, RmaScreenBaseProps } from './types';

export interface RefundFailedScreenProps extends RmaScreenBaseProps {
  /** Back to the refund status to check it before any retry. */
  onCheckRefundStatus?: ((rma: RmaRecord) => void) | undefined;
}

function ExclamationCircleIcon() {
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path d="M12 8v5M12 16h.01" stroke={adminColors.danger.text} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function RefundFailedScreen({ can, rma, onBack, onCheckRefundStatus }: RefundFailedScreenProps) {
  const canRetry = can('rma.refund.wallet_process') && onCheckRefundStatus !== undefined;

  return (
    <ReturnsScreen
      title="Refund Failed"
      subtitle={rma.rmaId}
      onBack={onBack}
      footer={
        canRetry ? (
          <ReturnsFooter>
            <ReturnsButton variant="neutralOutline" label="Check Refund Status" onPress={() => onCheckRefundStatus?.(rma)} />
          </ReturnsFooter>
        ) : null
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResultHero
          tone="danger"
          icon={<ExclamationCircleIcon />}
          title="Refund Could Not Be Completed"
          subtitle="The wallet has not been confirmed as credited. Check refund status before retrying — do not blindly retry."
        />
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.xl, paddingBottom: adminSpacing.xl },
});
