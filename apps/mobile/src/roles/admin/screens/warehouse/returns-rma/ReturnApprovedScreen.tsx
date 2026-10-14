/**
 * Return Approved — the result of POST /admin/returns/{id}/approve (plan
 * phase 10). The return is APPROVED; its next step is the wallet refund, which
 * is offered only with rma.refund.wallet_process (the refund route re-reads
 * the return and re-checks, BR-61).
 */
// Design id: M10-S06
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { RETURN_CODES } from './mappers';
import { ResultHero, ReturnsButton, ReturnsFooter, ReturnsScreen } from './ReturnsParts';
import type { WarehouseScreenBaseProps } from './types';

export interface ReturnApprovedScreenProps extends WarehouseScreenBaseProps {
  reference: string;
  onGoToRefundStatus: () => void;
  onDone: () => void;
}

export function SuccessCheckIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2" />
      <Path d="M7.5 12.5l3 3 6-6.5" stroke={adminColors.success.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ReturnApprovedScreen({ can, onBack, reference, onGoToRefundStatus, onDone }: ReturnApprovedScreenProps) {
  return (
    <ReturnsScreen
      title={t('returns.approved.title')}
      subtitle={reference}
      onBack={onBack}
      footer={
        <ReturnsFooter>
          {can(RETURN_CODES.refundWallet) ? <ReturnsButton label={t('returns.approved.toRefund')} onPress={onGoToRefundStatus} /> : null}
          <ReturnsButton label={t('returns.backToList')} variant="neutralOutline" onPress={onDone} />
        </ReturnsFooter>
      }
    >
      <ResultHero tone="success" icon={<SuccessCheckIcon />} title={t('returns.approved.title')} subtitle={t('returns.approved.subtitle', { ref: reference })} />
    </ReturnsScreen>
  );
}
