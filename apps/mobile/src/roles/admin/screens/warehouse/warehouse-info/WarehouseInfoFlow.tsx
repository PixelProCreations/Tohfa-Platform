/**
 * In-module navigator for Warehouse info: info -> storage locations.
 *
 * READ-ONLY. For a Sub Warehouse Admin every write here is `none` in
 * docs/rbac.json — `warehouse.profile.edit` (contact phone, operating hours),
 * `warehouse.capacity.set`, `warehouse.storage_location.manage` — so no edit
 * action is rendered or wrapped. Warehouse performance (`warehouse.all.view`)
 * has no endpoint and SUB holds none of it (availability
 * `warehousePerformance`), so it is not offered either.
 *
 * The warehouse is always the session's (`scope.warehouseId`, BR-30). An
 * admin with no assigned warehouse gets a message, not an id prompt.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { EmptyState } from '@tohfa/mobile-ui';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { isWarehouseFeatureVisible } from '../availability';
import { ScreenHeader } from '../shared/ScreenHeader';
import { scopedWarehouseId } from './mappers';
import { StorageLocationsScreen } from './StorageLocationsScreen';
import { WarehouseInfoScreen } from './WarehouseInfoScreen';

export interface WarehouseInfoFlowProps {
  onExit: () => void;
}

type Route = 'info' | 'locations';

export function WarehouseInfoFlow(props: WarehouseInfoFlowProps): React.JSX.Element {
  const { scope, can } = useAdminSession();
  const [stack, setStack] = useState<Route[]>(['info']);
  const { onExit } = props;
  const warehouseId = scopedWarehouseId(scope);

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

  if (warehouseId === null || !isWarehouseFeatureVisible('warehouseProfile', can)) {
    return (
      <View style={[styles.screen, { backgroundColor: adminTheme.colors.surface }]}>
        <ScreenHeader title={t('admin.warehouseInfo.title')} onBack={back} />
        <EmptyState
          title={t(warehouseId === null ? 'admin.warehouseInfo.noWarehouse' : 'admin.errors.FORBIDDEN')}
        />
      </View>
    );
  }

  const current = stack[stack.length - 1] ?? 'info';
  if (current === 'locations') {
    return <StorageLocationsScreen warehouseId={warehouseId} onBack={back} />;
  }
  return (
    <WarehouseInfoScreen
      warehouseId={warehouseId}
      onBack={back}
      onOpenStorage={() => setStack((s) => [...s, 'locations'])}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
