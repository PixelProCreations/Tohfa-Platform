/**
 * Receiving Search & Filters, shared by the Main and Sub warehouse admins.
 * Brings back the facets the wizard never got (SPEC_GAPS W4n-1).
 *
 * Extracted from the Sub shell's inline Receiving "search_filters" sub-view
 * (search, Status, Date, Grade, Source, Product and the locked-warehouse note)
 * and absorbs the Main ReceivingSearchFiltersScreen: the Warehouse, Shipment
 * Type and Receiving Result facets (Main-only, scope.warehouseId undefined),
 * Reset and the note that saved filters are not built.
 *
 * Nothing is fetched or mutated here: Apply hands the facets to the host,
 * which narrows Incoming Shipments (the server applies the real filter, and a
 * Sub scope can never widen past its own warehouse).
 * Gate: inventory.batch.view or inventory.goods_receipt.record.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import {
  ChipGroup,
  InfoNote,
  LockIcon,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { EMPTY_RECEIVING_FILTERS, isMainScope } from './fixtures';
import { PermissionNote, canViewReceiving } from './ReceivingParts';
import type { ReceivingFilters, WarehouseScreenBaseProps } from './types';

const STATUS_OPTIONS = ['All', 'Expected', 'Arrived', 'Receiving', 'QC Pending', 'Partially Accepted', 'Accepted', 'Rejected', 'Completed'] as const;
const DATE_OPTIONS = ['All', 'Today', 'Yesterday', 'Last 7 Days', 'Custom'] as const;
const GRADE_OPTIONS = ['All', 'Grade 1', 'Grade 2', 'Grade 3'] as const;
const SOURCE_OPTIONS = ['All', 'Main Warehouse', 'Farmer Admin', 'Purchase Order'] as const;
const TYPE_OPTIONS = ['All', 'Farmer/Admin', 'Inter-Warehouse Transfer'] as const;
const RESULT_OPTIONS = ['All', 'Accepted', 'Partial', 'Rejected'] as const;
const ALL_WAREHOUSES = 'All';

export interface ReceivingSearchFiltersScreenProps extends WarehouseScreenBaseProps {
  /** Facets currently applied (the screen opens on them). */
  initialFilters?: ReceivingFilters | undefined;
  onApply: (filters: ReceivingFilters) => void;
}

export function ReceivingSearchFiltersScreen({
  scope,
  can,
  onBack,
  initialFilters = EMPTY_RECEIVING_FILTERS,
  onApply,
}: ReceivingSearchFiltersScreenProps) {
  const [f, setF] = useState<ReceivingFilters>(initialFilters);
  const mainView = isMainScope(scope);
  const set = <K extends keyof ReceivingFilters>(key: K, value: ReceivingFilters[K]) => setF((prev) => ({ ...prev, [key]: value }));
  const warehouseIds = [ALL_WAREHOUSES, ...WALLET_WAREHOUSES.map((w) => w.warehouseId ?? '')];

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
            <WalletButton label="Reset" variant="outline" flex onPress={() => setF(EMPTY_RECEIVING_FILTERS)} />
            <WalletButton label="Apply Filters" flex onPress={() => onApply(mainView ? f : { ...f, warehouseId: undefined })} />
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
              labelOf={(id) => (id === ALL_WAREHOUSES ? 'All' : warehouseNameOf(id))}
            />
            <SectionTitle>Shipment Type</SectionTitle>
            <ChipGroup options={TYPE_OPTIONS} value={f.shipmentType as (typeof TYPE_OPTIONS)[number]} onChange={(v) => set('shipmentType', v)} />
          </>
        ) : null}

        <SectionTitle>Status</SectionTitle>
        <ChipGroup options={STATUS_OPTIONS} value={f.status as (typeof STATUS_OPTIONS)[number]} onChange={(v) => set('status', v)} />

        <SectionTitle>Date</SectionTitle>
        <ChipGroup options={DATE_OPTIONS} value={f.date as (typeof DATE_OPTIONS)[number]} onChange={(v) => set('date', v)} />

        <SectionTitle>Grade</SectionTitle>
        <ChipGroup options={GRADE_OPTIONS} value={f.grade as (typeof GRADE_OPTIONS)[number]} onChange={(v) => set('grade', v)} />

        <SectionTitle>Source</SectionTitle>
        <ChipGroup options={SOURCE_OPTIONS} value={f.source as (typeof SOURCE_OPTIONS)[number]} onChange={(v) => set('source', v)} />

        {mainView ? (
          <>
            <SectionTitle>Receiving Result</SectionTitle>
            <ChipGroup options={RESULT_OPTIONS} value={f.result as (typeof RESULT_OPTIONS)[number]} onChange={(v) => set('result', v)} />
          </>
        ) : null}

        <SectionTitle>Product</SectionTitle>
        <TextInput
          style={styles.input}
          placeholder="Search crop / product"
          placeholderTextColor={adminColors.placeholder}
          value={f.product}
          onChangeText={(text) => set('product', text)}
        />

        <View style={styles.spacer} />
        {mainView ? (
          <InfoNote tone="brandSoft">
            Save Filter is not built here — added only if the product requirement eventually supports saved filters.
          </InfoNote>
        ) : (
          <InfoNote tone="brandSoft" icon={<LockIcon size={14} color={adminColors.brandDeep} />}>
            {`No warehouse selector — results always scoped to ${scope.warehouseName ?? scope.warehouseId ?? ''}.`}
          </InfoNote>
        )}
        <Text style={styles.hint}>The date facet is applied by the server once shipments are served from the API.</Text>
      </ScrollView>
    </WalletScreen>
  );
}

const INPUT_HEIGHT = 46;

const styles = StyleSheet.create({
  footerRow: { flexDirection: 'row', gap: adminSpacing.sm },
  spacer: { height: adminSpacing.md },
  input: {
    ...adminType.body,
    height: INPUT_HEIGHT,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    color: adminColors.ink,
  },
  hint: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.sm },
});
