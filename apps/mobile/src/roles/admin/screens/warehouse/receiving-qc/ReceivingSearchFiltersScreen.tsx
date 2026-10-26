/**
 * Receiving Search & Filters (design M2-03), shared by the Main and Sub
 * warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "search_filters" sub-view
 * and absorbs the Main ReceivingSearchFiltersScreen. Only the facets the API
 * can apply are offered (LiveReceivingFilters): the search (`q`, BR-122), the
 * Date preset (`from` / `to` as IST days), and for Main the Warehouse (live
 * options; a Sub scope is pinned to its own, BR-30), the Shipment Type (which
 * lists are read) and the Receiving Result (Receiving History's status).
 * Not offered, because no list filters on them: the Sub Status, Grade, Source
 * and Product facets, the "Yesterday" preset, and "Custom" (this screen has no
 * date inputs to give it a range).
 *
 * Nothing is fetched or mutated here except the warehouse names: Apply hands
 * the facets to the host, which passes them to Incoming Shipments and
 * Receiving History (the server applies the real filter).
 * Gate: inventory.batch.view or inventory.goods_receipt.record.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { t } from '../../../i18n';
import { adminSpacing } from '../../../theme';
import {
  ChipGroup,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { PermissionNote, canViewReceiving } from './ReceivingParts';
import type { LiveDatePreset, LiveReceivingFilters, LiveResultFilter, LiveShipmentTypeFilter } from './liveTypes';
import { EMPTY_LIVE_FILTERS, isMainScope, warehouseNameFor } from './mappers';
import { useReceivingNaming } from './useReceivingData';
import type { WarehouseScreenBaseProps } from './types';

const DATE_OPTIONS: readonly LiveDatePreset[] = ['All', 'Today', 'Last 7 Days'];
const TYPE_OPTIONS: readonly LiveShipmentTypeFilter[] = ['All', 'Farmer/Admin', 'Inter-Warehouse Transfer'];
const RESULT_OPTIONS: readonly LiveResultFilter[] = ['All', 'Accepted', 'Partial', 'Rejected'];
const ALL_WAREHOUSES = 'All';

export interface ReceivingSearchFiltersScreenProps extends WarehouseScreenBaseProps {
  /** Facets currently applied (the screen opens on them). */
  initialFilters?: LiveReceivingFilters | undefined;
  onApply: (filters: LiveReceivingFilters) => void;
}

export function ReceivingSearchFiltersScreen({
  scope,
  can,
  onBack,
  initialFilters = EMPTY_LIVE_FILTERS,
  onApply,
}: ReceivingSearchFiltersScreenProps) {
  const [f, setF] = useState<LiveReceivingFilters>(initialFilters);
  const mainView = isMainScope(scope);
  const set = <K extends keyof LiveReceivingFilters>(key: K, value: LiveReceivingFilters[K]) => setF((prev) => ({ ...prev, [key]: value }));
  const naming = useReceivingNaming(scope, can);
  const warehouseIds = [ALL_WAREHOUSES, ...naming.options.map((w) => w.warehouseId ?? '').filter((id) => id !== '')];

  const header = {
    title: 'Search & Filters',
    onBack,
    headerExtra: <ScopeHeader scope={scope} label={mainView ? undefined : scope.warehouseName ?? scope.warehouseId} />,
  };

  if (!canViewReceiving(can)) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message="You do not have permission to search goods receiving." />
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
            <WalletButton label={t('receiving.filters.reset')} variant="outline" flex onPress={() => setF(EMPTY_LIVE_FILTERS)} />
            <WalletButton
              label={t('receiving.filters.apply')}
              flex
              onPress={() => onApply(mainView ? f : { ...f, warehouseId: undefined, shipmentType: 'All', result: 'All' })}
            />
          </View>
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SearchBar
          value={f.search}
          onChangeText={(text) => set('search', text)}
          placeholder={mainView ? 'Shipment ID, source ref, product, warehouse' : 'Search shipment / GR number / product'}
        />

        {mainView ? (
          <>
            <SectionTitle>Warehouse</SectionTitle>
            <ChipGroup
              options={warehouseIds}
              value={f.warehouseId ?? ALL_WAREHOUSES}
              onChange={(id) => set('warehouseId', id === ALL_WAREHOUSES ? undefined : id)}
              labelOf={(id) => (id === ALL_WAREHOUSES ? t('receiving.filters.all') : warehouseNameFor(id, naming.naming) ?? '')}
            />
            <SectionTitle>Shipment Type</SectionTitle>
            <ChipGroup options={TYPE_OPTIONS} value={f.shipmentType} onChange={(v) => set('shipmentType', v)} />
          </>
        ) : null}

        <SectionTitle>Date</SectionTitle>
        <ChipGroup options={DATE_OPTIONS} value={f.date} onChange={(v) => set('date', v)} />

        {mainView ? (
          <>
            <SectionTitle>Receiving Result</SectionTitle>
            <ChipGroup options={RESULT_OPTIONS} value={f.result} onChange={(v) => set('result', v)} />
          </>
        ) : null}

        <View style={styles.spacer} />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: 'row', gap: adminSpacing.sm },
  spacer: { height: adminSpacing.md },
});
