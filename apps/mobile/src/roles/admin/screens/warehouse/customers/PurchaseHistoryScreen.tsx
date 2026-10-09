/**
 * Purchase History: one customer's invoiced purchases with search, filters
 * and sort.
 *
 * Gates (FINAL_LIST row 18): read-only; nothing beyond customer.list.view.
 * Tapping a purchase opens its order (the host's order detail), as before.
 *
 * Absorbs Main PurchaseHistoryScreen (pair M7-S04: "SW 644 w/ filters, MWA
 * 279"): the Main card's sales channel ("Direct Sale") is shown on every row
 * that carries one. The Main twin's designer note ("tapping a purchase
 * deep-links to Module 6 / Module 9") was an annotation, not UI, and is not ported.
 */
// Design id: M7-S04
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminSpacing } from '../../../theme';
import {
  cardStyles,
  CustomersScreen,
  EmptyState,
  FilterIcon,
  HeaderIconButton,
  SearchField,
  StatTiles,
  StatusBadge,
} from './CustomersParts';
import { DEFAULT_CUSTOMER, INITIAL_PURCHASES, PURCHASE_KPIS } from './fixtures';
import type { CustomerRef, PurchaseFilterState, PurchaseRecord, WarehouseScreenBaseProps } from './types';

export interface PurchaseHistoryScreenProps extends WarehouseScreenBaseProps {
  customer?: CustomerRef | undefined;
  appliedFilters?: PurchaseFilterState | undefined;
  onOpenFilters?: (() => void) | undefined;
  onSelectPurchase?: ((purchase: PurchaseRecord) => void) | undefined;
  purchases?: readonly PurchaseRecord[] | undefined;
}

function amountOf(p: PurchaseRecord): number {
  return parseInt(p.amount.replace(/[^0-9]/g, ''), 10) || 0;
}

function hasActiveFilters(f: PurchaseFilterState | undefined): boolean {
  if (!f) return false;
  return (
    f.purchaseStatus !== 'All' ||
    f.grade !== 'All' ||
    f.datePreset !== 'All Time' ||
    f.sortBy !== 'Newest First' ||
    f.productCrop !== '' ||
    f.searchQuery !== ''
  );
}

export function PurchaseHistoryScreen({
  onBack,
  customer,
  appliedFilters,
  onOpenFilters,
  onSelectPurchase,
  purchases = INITIAL_PURCHASES,
}: PurchaseHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const customerName = customer?.name ?? DEFAULT_CUSTOMER.name;

  const query = (searchQuery || appliedFilters?.searchQuery || '').trim().toLowerCase();
  const crop = appliedFilters?.productCrop.trim().toLowerCase() ?? '';
  const sortBy = appliedFilters?.sortBy ?? 'Newest First';

  const rows = purchases
    .filter((p) => {
      if (appliedFilters && appliedFilters.purchaseStatus !== 'All' && p.status !== appliedFilters.purchaseStatus) return false;
      if (appliedFilters && appliedFilters.grade !== 'All' && !p.itemsSummary.toLowerCase().includes(appliedFilters.grade.toLowerCase())) {
        return false;
      }
      if (crop && !p.itemsSummary.toLowerCase().includes(crop)) return false;
      if (!query) return true;
      return (
        p.invoiceNo.toLowerCase().includes(query) ||
        p.itemsSummary.toLowerCase().includes(query) ||
        p.dateText.toLowerCase().includes(query) ||
        (p.orderNo ?? '').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'Oldest First') return a.id.localeCompare(b.id);
      if (sortBy === 'Highest Amount') return amountOf(b) - amountOf(a);
      if (sortBy === 'Lowest Amount') return amountOf(a) - amountOf(b);
      return b.id.localeCompare(a.id);
    });

  return (
    <CustomersScreen
      title="Purchase History"
      subtitle={customerName}
      onBack={onBack}
      headerRight={
        <HeaderIconButton label="Filter purchases" onPress={onOpenFilters} showDot={hasActiveFilters(appliedFilters)}>
          <FilterIcon />
        </HeaderIconButton>
      }
    >
      <StatTiles items={PURCHASE_KPIS} />
      <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder="Search product, order ID or invoice" />

      {rows.length === 0 ? (
        <EmptyState title="No purchases found" subtitle="Try adjusting your search query or filters." />
      ) : (
        rows.map((purchase) => (
          <TouchableOpacity
            key={purchase.id}
            style={cardStyles.card}
            activeOpacity={0.8}
            onPress={() => onSelectPurchase?.(purchase)}
            accessibilityRole="button"
          >
            <View style={cardStyles.rowBetween}>
              <Text style={cardStyles.code}>{purchase.invoiceNo}</Text>
              <StatusBadge label={purchase.status} tone={purchase.status === 'Paid' ? 'success' : 'warning'} />
            </View>
            <Text style={cardStyles.meta}>{purchase.dateText}</Text>
            {purchase.items && purchase.items.length > 0 ? (
              <View style={styles.items}>
                {purchase.items.map((item, idx) => (
                  <View key={item}>
                    <Text style={cardStyles.body}>{item}</Text>
                    {idx < (purchase.items?.length ?? 0) - 1 ? <View style={cardStyles.divider} /> : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[cardStyles.body, styles.items]} numberOfLines={2}>
                {purchase.itemsSummary}
              </Text>
            )}
            <View style={cardStyles.divider} />
            <View style={cardStyles.rowBetween}>
              <Text style={cardStyles.meta}>{purchase.channel ?? ''}</Text>
              <Text style={cardStyles.amount}>{purchase.amount}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </CustomersScreen>
  );
}

const styles = StyleSheet.create({
  items: { marginTop: adminSpacing.sm },
});
