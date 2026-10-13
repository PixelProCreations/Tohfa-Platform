/**
 * Warehouse info — `GET /warehouses/{id}` and `GET /warehouses/{id}/capacity`
 * (`warehouse.own.view`, BR-30/BR-66), read-only.
 *
 * `{id}` is the session's warehouse (passed in by the flow). Another id would
 * be 404 NOT_FOUND, never 403 (BR-66a).
 *
 * Capacity is shown exactly as the server derives it (BR-66): over capacity
 * shows a negative "available" figure and a notice — never clamped; with no
 * capacity set the derived figures are absent, not zero.
 *
 * Not shown: coordinates, and `marketDayOfWeek` (0..6 with no defined
 * weekday mapping in the spec — showing a day would be a guess).
 * HIDDEN — edit contact/hours (`warehouse.profile.edit`), set capacity
 * (`warehouse.capacity.set`): SUB_WH_ADMIN `none`; this screen has no edit
 * affordance for anyone yet, and says the details are read-only when the
 * admin lacks `warehouse.profile.edit`.
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@tohfa/mobile-ui';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getWarehouse, getWarehouseCapacity } from '../../../api/warehouseInfo';
import { t } from '../../../i18n';
import { formatGramsAsKg, type Grams } from '../../../money/quantity';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { isWarehouseFeatureVisible } from '../availability';
import { AsyncStates } from '../shared/AsyncStates';
import { InfoRow, InfoSection, MenuRow } from '../shared/InfoSection';
import { queryViewState } from '../shared/queryViewState';
import { ScreenHeader } from '../shared/ScreenHeader';
import { toCapacity, toWarehouseInfo, type CapacityModel, type WarehouseInfo } from './mappers';

export const WAREHOUSE_RESOURCE = 'warehouse';

const { colors, spacing, typography } = adminTheme;

function kg(grams: Grams): string {
  return t('admin.warehouseInfo.kg', { qty: formatGramsAsKg(grams) });
}

export function WarehouseInfoScreen(props: {
  warehouseId: string;
  onBack: () => void;
  onOpenStorage: () => void;
}): React.JSX.Element {
  const { scope, can } = useAdminSession();
  const showCapacity = isWarehouseFeatureVisible('warehouseCapacity', can);
  const info = useAdminQuery(
    adminKeys.detail(scope.warehouseId, WAREHOUSE_RESOURCE, props.warehouseId),
    async (signal) => toWarehouseInfo(await getWarehouse(props.warehouseId, signal)),
  );
  const capacity = useAdminQuery(
    adminKeys.detail(scope.warehouseId, WAREHOUSE_RESOURCE, `${props.warehouseId}:capacity`),
    async (signal) => toCapacity(await getWarehouseCapacity(props.warehouseId, signal)),
    { enabled: showCapacity },
  );
  const state = queryViewState(info, () => false);
  const refreshing = info.isRefetching || capacity.isRefetching;
  const refresh = (): void => {
    void info.refetch();
    if (showCapacity) void capacity.refetch();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title={info.data?.name ?? t('admin.warehouseInfo.title')}
        subtitle={info.data?.code ?? scope.warehouseName}
        onBack={props.onBack}
      />
      <AsyncStates state={state} error={info.error} onRetry={refresh}>
        {info.data === undefined ? null : (
          <ScrollView
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <Details info={info.data} />
            <ContactAndHours info={info.data} readOnly={!can('warehouse.profile.edit')} />
            {showCapacity ? (
              <InfoSection title={t('admin.warehouseInfo.capacity')}>
                <AsyncStates state={queryViewState(capacity, () => false)} error={capacity.error} onRetry={() => void capacity.refetch()}>
                  {capacity.data === undefined ? null : <Capacity model={capacity.data} />}
                </AsyncStates>
              </InfoSection>
            ) : null}
            {isWarehouseFeatureVisible('storageLocations', can) ? (
              <InfoSection>
                <MenuRow icon="inventory_2" label={t('admin.warehouseInfo.menu.storage')} onPress={props.onOpenStorage} />
              </InfoSection>
            ) : null}
          </ScrollView>
        )}
      </AsyncStates>
    </View>
  );
}

function Details(props: { info: WarehouseInfo }): React.JSX.Element {
  const { info } = props;
  const notSet = t('admin.warehouseInfo.notSet');
  return (
    <InfoSection title={t('admin.warehouseInfo.details')}>
      <InfoRow label={t('admin.warehouseInfo.field.name')} value={info.name} />
      <InfoRow label={t('admin.warehouseInfo.field.code')} value={info.code} />
      <InfoRow label={t('admin.warehouseInfo.field.type')} value={t(info.typeLabelKey)} />
      <InfoRow
        label={t('admin.warehouseInfo.field.status')}
        value={t(info.status.labelKey)}
        trailing={<Badge label={t(info.status.labelKey)} variant={info.status.tone} />}
      />
      <InfoRow label={t('admin.warehouseInfo.field.address')} value={info.address ?? notSet} />
      <InfoRow label={t('admin.warehouseInfo.field.city')} value={info.city ?? notSet} />
      <InfoRow label={t('admin.warehouseInfo.field.pincode')} value={info.pincode ?? notSet} />
      <InfoRow
        label={t('admin.warehouseInfo.field.marketDayVenue')}
        value={t(info.isMarketDayVenue ? 'admin.warehouseInfo.yes' : 'admin.warehouseInfo.no')}
      />
    </InfoSection>
  );
}

function ContactAndHours(props: { info: WarehouseInfo; readOnly: boolean }): React.JSX.Element {
  const { info } = props;
  return (
    <InfoSection title={t('admin.warehouseInfo.contact')}>
      <InfoRow
        label={t('admin.warehouseInfo.field.phone')}
        value={info.contactPhone ?? t('admin.warehouseInfo.notSet')}
      />
      {info.operatingHours === null ? (
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
          {t('admin.warehouseInfo.hoursNotSpecified')}
        </Text>
      ) : (
        info.operatingHours.map((row) => (
          <InfoRow
            key={row.day}
            label={t(row.dayLabelKey)}
            value={
              row.closed
                ? t('admin.warehouseInfo.closed')
                : t('admin.warehouseInfo.hoursRange', { open: row.open ?? '', close: row.close ?? '' })
            }
            tone={row.closed ? 'muted' : 'default'}
          />
        ))
      )}
      {props.readOnly ? (
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.caption }}>
          {t('admin.warehouseInfo.readOnlyHint')}
        </Text>
      ) : null}
    </InfoSection>
  );
}

function Capacity(props: { model: CapacityModel }): React.JSX.Element {
  const { model } = props;
  return (
    <View style={{ gap: spacing.sm }}>
      {model.capacityGrams === null ? (
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
          {t('admin.warehouseInfo.noCapacity')}
        </Text>
      ) : (
        <InfoRow label={t('admin.warehouseInfo.capacityTotal')} value={kg(model.capacityGrams)} />
      )}
      <InfoRow label={t('admin.warehouseInfo.capacityUsed')} value={kg(model.usedGrams)} />
      {model.availableGrams === null ? null : (
        <InfoRow
          label={t('admin.warehouseInfo.capacityAvailable')}
          value={kg(model.availableGrams)}
          tone={model.overCapacity ? 'error' : 'default'}
        />
      )}
      {model.utilizationPercent === null ? null : (
        <InfoRow
          label={t('admin.warehouseInfo.capacityUtilization')}
          value={t('admin.warehouseInfo.percent', { value: model.utilizationPercent.toFixed(2) })}
          tone={model.overCapacity ? 'error' : 'default'}
        />
      )}
      {model.overCapacity ? (
        <Text accessibilityLiveRegion="polite" style={{ color: colors.error, fontSize: typography.bodySmall }}>
          {t('admin.warehouseInfo.overCapacity')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
