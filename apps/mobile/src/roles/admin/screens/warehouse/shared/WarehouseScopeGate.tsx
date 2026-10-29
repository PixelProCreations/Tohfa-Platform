import React from 'react';
import { useSubWarehouseScope } from '../../../permissions/useSubWarehouseScope';
import type { WarehouseScope } from '../finance-expenses/types';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from './AsyncStates';
import { t } from '../../../i18n';

export interface WarehouseScopeGateProps {
  children: (scope: WarehouseScope) => React.ReactNode;
}

export function WarehouseScopeGate({ children }: WarehouseScopeGateProps): React.ReactElement {
  const { status, scope, error, refetch } = useSubWarehouseScope();

  if (status === 'loading') {
    return <AdminLoadingState />;
  }

  if (status === 'error') {
    return <AdminErrorState error={error} onRetry={refetch} />;
  }

  if (status === 'none' || !scope) {
    return (
      <AdminEmptyState
        title={t('scope.none.title')}
        subtitle={t('scope.none.subtitle')}
      />
    );
  }

  return <>{children(scope)}</>;
}

