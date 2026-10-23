/**
 * Receiving Search & Filters (design M2-03), shared by the Main and Sub
 * warehouse admins, opened from Incoming Shipments or Receiving History.
 *
 * Reduced to the facets the two list endpoints take, so every choice is
 * applied by the server as a query parameter:
 *   Warehouse         `warehouseId` on GET /admin/purchase-orders and
 *                     /admin/goods-receipts; Main only, options from the real
 *                     GET /warehouses list (uuids)
 *   Receiving Result  `status` on GET /admin/goods-receipts, so only when opened
 *                     from Receiving History (a purchase order has no result)
 * The design's search box, Date and Shipment Type are not drawn: neither list
 * takes a search text or a date, and transfers are a different list.
 *
 * Nothing is fetched for the lists or mutated here: Apply hands the facets to
 * the flow, which sets them on the list's route params (mappers.ts
 * receivingFilterParams). A Sub scope never gets the warehouse facet and is
 * pinned to its own warehouse (BR-30).
 * Gate: inventory.batch.view or inventory.goods_receipt.record.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { adminColors, adminSpacing } from '../../../theme';
import { t } from '../../../i18n';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  ChipGroup,
  InfoNote,
  LockIcon,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { EMPTY_RECEIVING_FILTERS, HISTORY_FILTERS, historyFilterLabel, isMainScope, receivingFilterFacets } from './mappers';
import { PermissionNote, canViewReceiving } from './ReceivingParts';
import type { ReceivingFilterTarget, ReceivingFilters, WarehouseScreenBaseProps } from './types';

const ALL_WAREHOUSES = 'All';

export interface ReceivingSearchFiltersScreenProps extends WarehouseScreenBaseProps {
  /** The list this screen narrows; it decides which facets apply. */
  target: ReceivingFilterTarget;
  /** Facets currently applied (the screen opens on them). */
  initialFilters?: ReceivingFilters | undefined;
  onApply: (filters: ReceivingFilters) => void;
}

export function ReceivingSearchFiltersScreen({
  scope,
  can,
  onBack,
  target,
  initialFilters = EMPTY_RECEIVING_FILTERS,
  onApply,
}: ReceivingSearchFiltersScreenProps) {
  const [f, setF] = useState<ReceivingFilters>(initialFilters);
  const mainView = isMainScope(scope);
  const facets = receivingFilterFacets(scope, can, target);
  // Main picks from the real GET /warehouses list (uuids); a Sub scope never
  // gets the facet and is pinned to its own warehouse (BR-30).
  const warehouses = useWarehouseOptions({ enabled: mainView && can('warehouse.all.view') });
  const warehouseIds = [ALL_WAREHOUSES, ...warehouses.options.map((w) => w.warehouseId)];
  const warehouseNameOf = (id: string): string => warehouses.options.find((w) => w.warehouseId === id)?.warehouseName ?? id;

  const header = {
    title: t('receiving.filters.title'),
    onBack,
    headerExtra: <ScopeHeader scope={scope} label={mainView ? undefined : scope.warehouseName ?? scope.warehouseId} />,
  };

  if (!canViewReceiving(can)) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message={t('receiving.filters.noPermission')} />
        </View>
      </WalletScreen>
    );
  }

  return (
    <WalletScreen
      {...header}
      footer={
        <WalletFooter>
          <View style={styles.footerRow}>
            <WalletButton label={t('receiving.filters.reset')} variant="outline" flex onPress={() => setF(EMPTY_RECEIVING_FILTERS)} />
            <WalletButton label={t('receiving.filters.apply')} flex onPress={() => onApply(f)} />
          </View>
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {facets.warehouse ? (
          <>
            <SectionTitle>{t('receiving.filters.warehouse')}</SectionTitle>
            <ChipGroup
              options={warehouseIds}
              value={f.warehouseId ?? ALL_WAREHOUSES}
              onChange={(id) => setF((prev) => ({ ...prev, warehouseId: id === ALL_WAREHOUSES ? undefined : id }))}
              labelOf={(id) => (id === ALL_WAREHOUSES ? t('filters.warehouse.all') : warehouseNameOf(id))}
            />
          </>
        ) : null}

        {facets.result ? (
          <>
            <SectionTitle>{t('receiving.filters.result')}</SectionTitle>
            <ChipGroup
              options={HISTORY_FILTERS}
              value={f.result}
              onChange={(result) => setF((prev) => ({ ...prev, result }))}
              labelOf={historyFilterLabel}
            />
          </>
        ) : null}

        <View style={styles.spacer} />
        {mainView ? (
          <InfoNote tone="brandSoft">{t('receiving.filters.saveNotBuilt')}</InfoNote>
        ) : (
          <InfoNote tone="brandSoft" icon={<LockIcon size={14} color={adminColors.brandDeep} />}>
            {t('filters.warehouse.lockedNote', { warehouse: scope.warehouseName ?? scope.warehouseId ?? '' })}
          </InfoNote>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: 'row', gap: adminSpacing.sm },
  spacer: { height: adminSpacing.md },
});
