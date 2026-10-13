/**
 * In-module navigator for a cash top-up: form -> confirm -> success.
 *
 * NOT MOUNTED on the admin home yet. The flow needs a customer, and the only
 * endpoint that can supply one, `GET /admin/sales/customers/lookup`, is BR-91
 * scoped so a customer's first top-up at this warehouse cannot be found (see
 * ../availability.ts `cashTopupCustomerLookup`). Once that is decided, a
 * customer search screen feeds `customer` here and navigation/adminEntries.ts
 * lists the flow — nothing below needs to change.
 *
 * Gates (presentation only; the server re-checks every call):
 *  - `wallet.cash_topup.process` (feature `cashTopup`) and
 *    `wallet.cash_topup.fiscal_tag` — the admin marks the tag (BR-18);
 *  - an assigned warehouse: the body's `warehouseId` is `scope.warehouseId`
 *    and nothing else (BR-30). An HQ admin with no warehouse cannot use it.
 *
 * The Idempotency-Key handle lives HERE, not in the confirm screen, so going
 * back to the form and returning with the same values still reuses the key of
 * an attempt whose outcome was unknown.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { EmptyState } from '@tohfa/mobile-ui';
import { useIdempotencyKey } from '../../../api/hooks';
import type { CashTopupBody, WalletTransactionDto } from '../../../api/wallet';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import { isWarehouseFeatureVisible } from '../availability';
import { CashTopupConfirmScreen } from './CashTopupConfirmScreen';
import { CashTopupFormScreen } from './CashTopupFormScreen';
import { CashTopupSuccessScreen } from './CashTopupSuccessScreen';
import {
  buildCashTopupBody,
  emptyCashTopupForm,
  type CashTopupForm,
  type TopupCustomer,
  type ValidCashTopup,
} from './mappers';

export interface CashTopupFlowProps {
  customer: TopupCustomer;
  onExit: () => void;
}

type Route =
  | { screen: 'form' }
  | { screen: 'confirm'; value: ValidCashTopup; body: CashTopupBody }
  | { screen: 'success'; txn: WalletTransactionDto };

export function CashTopupFlow(props: CashTopupFlowProps): React.JSX.Element {
  const { can, scope } = useAdminSession();
  const idempotency = useIdempotencyKey();
  const [route, setRoute] = useState<Route>({ screen: 'form' });
  const [form, setForm] = useState<CashTopupForm>(emptyCashTopupForm);
  const { onExit } = props;

  const back = useCallback(() => {
    if (route.screen === 'confirm') setRoute({ screen: 'form' });
    else onExit();
  }, [route.screen, onExit]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  }, [back]);

  if (!isWarehouseFeatureVisible('cashTopup', can) || !can('wallet.cash_topup.fiscal_tag')) {
    return <EmptyState title={t('admin.errors.FORBIDDEN')} />;
  }
  const warehouseId = scope.warehouseId;
  if (warehouseId === null) {
    return <EmptyState title={t('admin.errors.WAREHOUSE_REQUIRED')} />;
  }

  switch (route.screen) {
    case 'confirm':
      return (
        <CashTopupConfirmScreen
          customer={props.customer}
          value={route.value}
          body={route.body}
          warehouseId={warehouseId}
          idempotency={idempotency}
          onBack={back}
          onSuccess={(txn) => {
            setForm(emptyCashTopupForm());
            setRoute({ screen: 'success', txn });
          }}
        />
      );
    case 'success':
      return <CashTopupSuccessScreen customer={props.customer} txn={route.txn} onDone={onExit} />;
    case 'form':
      return (
        <CashTopupFormScreen
          customer={props.customer}
          initialForm={form}
          onBack={back}
          onContinue={(nextForm, value) => {
            setForm(nextForm);
            setRoute({ screen: 'confirm', value, body: buildCashTopupBody(value, warehouseId) });
          }}
        />
      );
  }
}
