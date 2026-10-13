/**
 * Who is being topped up. Masked mobile only (BR-92g) — the full number is
 * never available to a Sub Warehouse Admin.
 */
import React from 'react';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { InfoRow, InfoSection } from '../shared/InfoSection';
import type { TopupCustomer } from './mappers';

export function TopupCustomerCard(props: { customer: TopupCustomer }): React.JSX.Element {
  const { customer } = props;
  return (
    <InfoSection title={t('admin.wallet.topup.customer')}>
      <InfoRow label={t('admin.wallet.topup.customerName')} value={customer.name} />
      <InfoRow label={t('admin.wallet.topup.customerCode')} value={customer.customerCode} />
      <InfoRow label={t('admin.wallet.topup.customerMobile')} value={customer.mobileMasked} />
      {customer.walletBalancePaise === null ? null : (
        <InfoRow
          label={t('admin.wallet.topup.currentBalance')}
          value={formatPaise(customer.walletBalancePaise)}
        />
      )}
    </InfoSection>
  );
}
