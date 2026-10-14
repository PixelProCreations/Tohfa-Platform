/**
 * Request Rejected — the result of POST /admin/returns/{id}/reject (plan
 * phase 10). REJECTED is final (BR-61); Done goes back to the queue.
 */
// Design id: M10-S08
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { ResultHero, ReturnsButton, ReturnsFooter, ReturnsScreen } from './ReturnsParts';
import type { WarehouseScreenBaseProps } from './types';

export interface RequestRejectedScreenProps extends WarehouseScreenBaseProps {
  reference: string;
  onDone: () => void;
}

function RejectedIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={adminColors.danger.text} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function RequestRejectedScreen({ onBack, reference, onDone }: RequestRejectedScreenProps) {
  return (
    <ReturnsScreen
      title={t('returns.rejected.title')}
      subtitle={reference}
      onBack={onBack}
      footer={
        <ReturnsFooter>
          <ReturnsButton label={t('returns.backToList')} onPress={onDone} />
        </ReturnsFooter>
      }
    >
      <ResultHero tone="danger" icon={<RejectedIcon />} title={t('returns.rejected.title')} subtitle={t('returns.rejected.subtitle', { ref: reference })} />
    </ReturnsScreen>
  );
}
