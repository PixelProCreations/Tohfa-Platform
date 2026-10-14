/**
 * Refund Not Confirmed — the wallet refund failed or its answer never came.
 *
 * Shown in place by ReturnsFlow's LiveRefundRoute, never as a route of its
 * own: Try Again calls the same useWalletRefund, so it resends the same
 * Idempotency-Key and the wallet is credited at most once (root CLAUDE.md 2.4,
 * BR-61d). The message comes from returnRefundErrorKey (an uncertain network
 * failure, a zero amount, a return that moved on).
 *
 * Gates: Try Again only with rma.refund.wallet_process; the server re-checks.
 */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminSpacing } from '../../../theme';
import { RETURN_CODES, returnRefundErrorKey } from './mappers';
import { ResultHero, ReturnsButton, ReturnsFooter, ReturnsScreen } from './ReturnsParts';
import type { WarehouseScreenBaseProps } from './types';

export interface RefundFailedScreenProps extends WarehouseScreenBaseProps {
  reference?: string | undefined;
  /** The failure of the last attempt. */
  error: unknown;
  /** A Try Again is in flight. */
  isRetrying?: boolean | undefined;
  /** Retry through the same hook and key. */
  onRetry: () => void;
}

function ExclamationCircleIcon() {
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path d="M12 8v5M12 16h.01" stroke={adminColors.danger.text} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function RefundFailedScreen({ can, reference, onBack, error, isRetrying = false, onRetry }: RefundFailedScreenProps) {
  const canRetry = can(RETURN_CODES.refundWallet);

  return (
    <ReturnsScreen
      title={t('returns.refund.failedTitle')}
      subtitle={reference}
      onBack={onBack}
      footer={
        canRetry ? (
          <ReturnsFooter>
            <ReturnsButton
              label={t(isRetrying ? 'returns.refund.pending' : 'returns.refund.retry')}
              disabled={isRetrying}
              onPress={onRetry}
            />
          </ReturnsFooter>
        ) : null
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResultHero
          tone="danger"
          icon={<ExclamationCircleIcon />}
          title={t('returns.refund.failedTitle')}
          subtitle={t(returnRefundErrorKey(error))}
        />
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.xl, paddingBottom: adminSpacing.xl },
});
