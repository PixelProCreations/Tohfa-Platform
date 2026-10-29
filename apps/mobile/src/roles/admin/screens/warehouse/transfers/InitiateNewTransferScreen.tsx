import React from 'react';
import { EmptyState, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { t } from '../../../i18n';
import type { WarehouseScreenBaseProps } from './types';

export interface InitiateNewTransferScreenProps extends WarehouseScreenBaseProps {
  onSubmitTransfer?: ((transfer: any) => void) | undefined;
}

export function InitiateNewTransferScreen({ onBack }: InitiateNewTransferScreenProps) {
  return (
    <WalletScreen title={t('transfers.initiate.title')} onBack={onBack}>
      <EmptyState
        title={t('transfers.initiate.unavailable.title')}
        subtitle={t('transfers.initiate.unavailable')}
      />
    </WalletScreen>
  );
}
