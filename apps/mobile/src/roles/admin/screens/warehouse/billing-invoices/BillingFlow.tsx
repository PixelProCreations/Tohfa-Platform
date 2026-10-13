/**
 * In-module navigator for invoices: list -> detail.
 *
 * Read-only by design: the API has no create-invoice endpoint, so the old
 * Generate Invoice / wizard screens are not built. The type filter lives here
 * so it survives a trip to a detail screen and back. The Android back button
 * pops the stack, and leaves the module from the list.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { EmptyState } from '@tohfa/mobile-ui';
import type { InvoiceTypeDto } from '../../../api/invoices';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import { isWarehouseFeatureVisible } from '../availability';
import { InvoiceDetailScreen } from './InvoiceDetailScreen';
import { InvoiceListScreen } from './InvoiceListScreen';

export type BillingRoute = { screen: 'list' } | { screen: 'detail'; invoiceId: string };

export interface BillingFlowProps {
  /** Leave the module (back from its first screen). */
  onExit: () => void;
}

export function BillingFlow(props: BillingFlowProps): React.JSX.Element {
  const { can } = useAdminSession();
  const [stack, setStack] = useState<BillingRoute[]>([{ screen: 'list' }]);
  const [typeFilter, setTypeFilter] = useState<InvoiceTypeDto | undefined>(undefined);
  const { onExit } = props;

  const back = useCallback(() => {
    if (stack.length > 1) setStack((s) => s.slice(0, -1));
    else onExit();
  }, [stack.length, onExit]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  }, [back]);

  // Presentation only; the server re-checks invoice.view_own on every call.
  if (!isWarehouseFeatureVisible('invoices', can)) {
    return <EmptyState title={t('admin.invoices.forbidden')} />;
  }

  const current = stack[stack.length - 1] ?? { screen: 'list' };
  if (current.screen === 'detail') {
    return <InvoiceDetailScreen invoiceId={current.invoiceId} onBack={back} />;
  }
  return (
    <InvoiceListScreen
      typeFilter={typeFilter}
      onTypeFilterChange={setTypeFilter}
      onOpenInvoice={(invoiceId) => setStack((s) => [...s, { screen: 'detail', invoiceId }])}
      onBack={back}
    />
  );
}
