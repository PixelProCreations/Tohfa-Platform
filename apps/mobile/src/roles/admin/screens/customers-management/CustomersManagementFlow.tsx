/**
 * CustomersManagementFlow: host for the Tohfa Admin's Customers area.
 * Sub-screens: management hub → customer directory → add customer, and the
 * shared customer-detail flow (warehouse/customers/CustomersFlow) opened on
 * 'CustomerDetails' for whichever customer was tapped.
 */
import React, { useMemo, useState } from 'react';
import type { Can } from '../../permissions/can';
import { AddCustomerScreen } from '../dashboard/AddCustomerScreen';
import { CustomersFlow } from '../warehouse/customers/CustomersFlow';
import type { CustomersExternalRoute, CustomersRouteParams, WarehouseScope } from '../warehouse/customers/types';
import { OrdersFlow } from '../warehouse/orders';
import { ReturnsFlow, type ReturnsRouteParams, type ReturnsStackEntry } from '../warehouse/returns-rma';
import { WalletFlow, walletParamsForCustomer } from '../warehouse/wallet-cashtopup';
import { CustomerDirectoryScreen } from './CustomerDirectoryScreen';
import { CustomersManagementScreen } from './CustomersManagementScreen';

type SubScreen = 'management' | 'directory' | 'add' | 'detail';

/** Where the detail flow was opened from, so its back returns there. */
type DetailOrigin = 'management' | 'directory';

/**
 * A Tohfa Admin is not scoped to one warehouse: an empty scope means the
 * all-warehouses ("Main") view. Module-level so it stays referentially stable —
 * CustomersFlow resets its stack when its initial props change identity.
 */
const TOHFA_ADMIN_SCOPE: WarehouseScope = {};

/** The detail route is fixed; only the customer in `initialParams` varies. */
const DETAIL_ROUTE = 'CustomerDetails' as const;

/**
 * External customer routes drawn inside the flow, as the Main shell draws them.
 * 'NewSale' is deliberately absent: a direct sale is raised from one concrete
 * warehouse and this host's scope is every warehouse, so there is no correct
 * warehouse to sell from — an open product question, not an oversight. Until it
 * is answered the row stays inert rather than guessing a warehouse.
 */
const TOHFA_CUSTOMER_INLINE_ROUTES: readonly CustomersExternalRoute[] = [
  'CustomerWallet',
  'CashTopUp',
  'OrderDetail',
  'RmaDetail',
];

/** The return queue sits beneath a return opened from a customer issue. */
const ISSUE_RETURN_BACK_STACK: ReturnsStackEntry[] = [{ screen: 'ReturnsIssues' }];

/**
 * A customer issue's "View Return": a customer issue is a return request, so
 * its id is the return uuid. Params are memoised because ReturnsFlow restarts
 * its stack when they change identity.
 */
function IssueReturnFlow({ can, returnId, onBack }: { can: Can; returnId: string | undefined; onBack: () => void }) {
  const initialParams = useMemo<ReturnsRouteParams>(() => ({ returnId }), [returnId]);
  return (
    <ReturnsFlow
      scope={TOHFA_ADMIN_SCOPE}
      can={can}
      initialScreen="RmaDetail"
      initialParams={initialParams}
      initialBackStack={ISSUE_RETURN_BACK_STACK}
      onBack={onBack}
    />
  );
}

export interface CustomersManagementFlowProps {
  can: Can;
  onBack: () => void;
}

export function CustomersManagementFlow({ can, onBack }: CustomersManagementFlowProps) {
  const [subScreen, setSubScreen] = useState<SubScreen>('management');
  const [detailOrigin, setDetailOrigin] = useState<DetailOrigin>('management');
  const [selected, setSelected] = useState<{ id: string; name?: string | undefined } | undefined>(undefined);

  const detailParams: CustomersRouteParams = useMemo(
    () => ({ customer: selected === undefined ? undefined : { id: selected.id, name: selected.name } }),
    [selected],
  );

  const openCustomer = (from: DetailOrigin) => (customer: { id: string; name?: string | undefined }) => {
    setSelected({ id: customer.id, name: customer.name });
    setDetailOrigin(from);
    setSubScreen('detail');
  };

  if (subScreen === 'detail') {
    return (
      <CustomersFlow
        scope={TOHFA_ADMIN_SCOPE}
        can={can}
        initialScreen={DETAIL_ROUTE}
        initialParams={detailParams}
        onBack={() => setSubScreen(detailOrigin)}
        inlineExternalRoutes={TOHFA_CUSTOMER_INLINE_ROUTES}
        renderExternalScreen={(target, p: CustomersRouteParams, nav) => {
          if (target === 'CustomerWallet' || target === 'CashTopUp') {
            return (
              <WalletFlow
                scope={TOHFA_ADMIN_SCOPE}
                can={can}
                initialScreen={target}
                initialParams={walletParamsForCustomer(p.customer)}
                onBack={nav.back}
              />
            );
          }
          if (target === 'OrderDetail') {
            return (
              <OrdersFlow
                scope={TOHFA_ADMIN_SCOPE}
                can={can}
                initialScreen="M5S04"
                initialParams={{ orderId: p.orderId, customerName: p.customer?.name }}
                onBack={nav.back}
              />
            );
          }
          if (target === 'RmaDetail') {
            return <IssueReturnFlow can={can} returnId={p.issue?.id} onBack={nav.back} />;
          }
          return null;
        }}
      />
    );
  }

  if (subScreen === 'add') {
    return (
      <AddCustomerScreen
        can={can}
        onBack={() => setSubScreen('directory')}
        // The form returns only the new uuid; the detail screen's own
        // GET /admin/customers/{id} supplies the name.
        onSuccess={(customerId) => openCustomer('directory')({ id: customerId })}
      />
    );
  }

  if (subScreen === 'directory') {
    return (
      <CustomerDirectoryScreen
        can={can}
        onBack={() => setSubScreen('management')}
        onAddCustomer={() => setSubScreen('add')}
        onSelectCustomer={openCustomer('directory')}
      />
    );
  }

  return (
    <CustomersManagementScreen
      can={can}
      onBack={onBack}
      onOpenDirectory={() => setSubScreen('directory')}
      onSelectCustomer={openCustomer('management')}
    />
  );
}
