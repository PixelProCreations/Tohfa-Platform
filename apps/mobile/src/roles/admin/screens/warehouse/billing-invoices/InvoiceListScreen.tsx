/**
 * Invoice List / History: one read-only list with two layouts.
 *
 *   - 'list' (M9-S02): cards with order, sale type and date; tapping a card
 *     expands its View / Download actions.
 *   - 'history' (M9-S07): Retail / B2B chips and cards grouped by date.
 *
 * The hub's Invoice List and Invoice History actions open the matching
 * layout; a segment toggle switches between them. Search and the applied
 * filters (InvoiceFiltersScreen, incl. Sort By) apply to both.
 *
 * Scope (FINAL_LIST row 7): rows are limited to the own warehouse when
 * scope.warehouseId is set; the all-warehouses selector renders only when it
 * is undefined (Main). Gates: read-only; View / Download need invoice.view_own.
 *
 * Absorbs SubWarehouseInvoiceHistoryScreen and the Main InvoiceListScreen /
 * InvoiceHistoryScreen (pairs M9-S02, M9-S07). The Main copies had no content
 * beyond the Sub list (their "Normal Invoice" type label was a placeholder).
 * The old "Load More" button had no handler and is dropped.
 */
// Design id: M9-S02
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  BillingButton,
  BillingScreen,
  ChipGroup,
  FilterSlidersIcon,
  HeaderIconButton,
  inScope,
  isAllWarehouses,
  rupeesOf,
  ScopeHeader,
  SearchBar,
  StatusBadge,
} from './BillingParts';
import { BILLING_WAREHOUSES, INITIAL_INVOICES } from './fixtures';
import type {
  InvoiceFilterState,
  InvoiceListLayout,
  InvoiceRecord,
  WarehouseScope,
  WarehouseScreenBaseProps,
} from './types';

export interface InvoiceListScreenProps extends WarehouseScreenBaseProps {
  initialLayout?: InvoiceListLayout | undefined;
  /** Lets the host keep the chosen layout across a trip to the filters screen. */
  onLayoutChange?: ((layout: InvoiceListLayout) => void) | undefined;
  onNavigateToInvoiceDetail: (invoiceId: string) => void;
  onOpenFilters: () => void;
  appliedFilters?: InvoiceFilterState | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Invoice rows; defaults to the mock set until the invoice API is wired. */
  invoices?: readonly InvoiceRecord[] | undefined;
}

type HistoryChip = 'All' | 'Retail Sale' | 'B2B Sale';
const HISTORY_CHIPS: readonly HistoryChip[] = ['All', 'Retail Sale', 'B2B Sale'];
const LAYOUTS: readonly { key: InvoiceListLayout; label: string }[] = [
  { key: 'list', label: 'List' },
  { key: 'history', label: 'History' },
];

function hasActiveFilters(f: InvoiceFilterState | undefined): boolean {
  if (!f) return false;
  return Boolean(
    f.status !== 'All' ||
      f.invoiceType !== 'All' ||
      f.datePreset !== 'All Time' ||
      f.sortBy !== 'Newest First' ||
      f.customer ||
      f.orderId ||
      f.minAmount ||
      f.maxAmount ||
      f.searchQuery ||
      f.warehouseId,
  );
}

function matchesFilters(item: InvoiceRecord, f: InvoiceFilterState | undefined): boolean {
  if (!f) return true;
  if (f.status !== 'All' && item.status !== f.status) return false;
  if (f.invoiceType !== 'All' && item.saleType !== f.invoiceType) return false;
  if (f.customer && !item.customerName.toLowerCase().includes(f.customer.toLowerCase())) return false;
  if (f.orderId && !item.orderNumber.toLowerCase().includes(f.orderId.toLowerCase())) return false;
  const amount = rupeesOf(item.amount);
  if (f.minAmount && amount < rupeesOf(f.minAmount)) return false;
  if (f.maxAmount && amount > rupeesOf(f.maxAmount)) return false;
  return true;
}

function compareBy(sort: InvoiceFilterState['sortBy']) {
  return (a: InvoiceRecord, b: InvoiceRecord): number => {
    if (sort === 'Oldest First') return a.id.localeCompare(b.id);
    if (sort === 'Highest Amount') return rupeesOf(b.amount) - rupeesOf(a.amount);
    if (sort === 'Lowest Amount') return rupeesOf(a.amount) - rupeesOf(b.amount);
    return b.id.localeCompare(a.id);
  };
}

export function InvoiceListScreen({
  scope,
  can,
  onBack,
  initialLayout = 'list',
  onLayoutChange,
  onNavigateToInvoiceDetail,
  onOpenFilters,
  appliedFilters,
  warehouseOptions = BILLING_WAREHOUSES,
  invoices = INITIAL_INVOICES,
}: InvoiceListScreenProps) {
  const [layout, setLayout] = useState<InvoiceListLayout>(initialLayout);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyChip, setHistoryChip] = useState<HistoryChip>('All');
  const [expandedId, setExpandedId] = useState<string | undefined>(invoices[0]?.id);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(appliedFilters?.warehouseId);
  const canView = can('invoice.view_own');
  const warehouseFilter = isAllWarehouses(scope) ? selectedWarehouseId : undefined;
  const changeLayout = (next: InvoiceListLayout) => {
    setLayout(next);
    onLayoutChange?.(next);
  };

  const rows = useMemo(() => {
    const q = (searchQuery || appliedFilters?.searchQuery || '').trim().toLowerCase();
    return invoices
      .filter((item) => inScope(scope, item.warehouseId, warehouseFilter))
      .filter(
        (item) =>
          !q ||
          item.id.toLowerCase().includes(q) ||
          item.orderNumber.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q),
      )
      .filter((item) => matchesFilters(item, appliedFilters))
      .filter((item) => layout !== 'history' || historyChip === 'All' || item.saleType === historyChip)
      .sort(compareBy(appliedFilters?.sortBy ?? 'Newest First'));
  }, [invoices, scope, warehouseFilter, searchQuery, appliedFilters, layout, historyChip]);

  const groups = useMemo(() => {
    const byDate = new Map<string, InvoiceRecord[]>();
    for (const row of rows) byDate.set(row.date, [...(byDate.get(row.date) ?? []), row]);
    return [...byDate.entries()];
  }, [rows]);

  const headerExtra = (
    <>
      <ScopeHeader
        scope={scope}
        warehouseOptions={warehouseOptions}
        selectedWarehouseId={warehouseFilter}
        onSelectWarehouse={setSelectedWarehouseId}
      />
      <View style={styles.segment}>
        {LAYOUTS.map((option) => {
          const active = option.key === layout;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => changeLayout(option.key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  const renderListCard = (inv: InvoiceRecord) => {
    const expanded = expandedId === inv.id;
    return (
      <TouchableOpacity
        key={inv.id}
        style={styles.card}
        onPress={() => setExpandedId(expanded ? undefined : inv.id)}
        activeOpacity={0.88}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.invoiceId}>{inv.id}</Text>
          <StatusBadge status={inv.status} />
        </View>
        <Text style={styles.metaText}>
          {inv.customerName} · Order #{inv.orderNumber}
        </Text>
        <View style={[styles.rowBetween, styles.cardMidRow]}>
          <Text style={styles.metaText}>{inv.saleType}</Text>
          <Text style={styles.amountText}>{inv.amount}</Text>
        </View>
        <Text style={styles.metaText}>
          {inv.date} · {inv.time}
        </Text>
        {expanded && canView ? (
          <View style={styles.actionRow}>
            <BillingButton label="View" variant="tint" compact flex onPress={() => onNavigateToInvoiceDetail(inv.id)} />
            <BillingButton
              label="Download"
              variant="tint"
              compact
              flex
              onPress={() => onNavigateToInvoiceDetail(inv.id)}
            />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderHistoryCard = (inv: InvoiceRecord) => (
    <TouchableOpacity
      key={inv.id}
      style={styles.card}
      onPress={() => (canView ? onNavigateToInvoiceDetail(inv.id) : undefined)}
      disabled={!canView}
      activeOpacity={0.75}
    >
      <View style={styles.rowBetween}>
        <Text style={styles.invoiceId}>{inv.id}</Text>
        <StatusBadge status={inv.status} />
      </View>
      <Text style={styles.metaText}>{inv.customerName}</Text>
      <View style={[styles.rowBetween, styles.cardMidRow]}>
        <Text style={styles.metaText}>{inv.time}</Text>
        <Text style={styles.amountText}>{inv.amount}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <BillingScreen
      title={layout === 'history' ? 'Invoice History' : 'Invoice List'}
      onBack={onBack}
      headerRight={
        <HeaderIconButton
          onPress={onOpenFilters}
          accessibilityLabel="Filter Invoices"
          badge={hasActiveFilters(appliedFilters)}
        >
          <FilterSlidersIcon />
        </HeaderIconButton>
      }
      headerExtra={headerExtra}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={layout === 'history' ? 'Search Customer ID / Name / Invoice Number' : 'Search invoice, order or customer'}
        />

        {layout === 'history' ? (
          <>
            <View style={styles.chipsWrap}>
              <ChipGroup options={HISTORY_CHIPS} value={historyChip} onChange={setHistoryChip} />
            </View>
            {groups.map(([date, items]) => (
              <View key={date}>
                <Text style={styles.dateHeading}>{date}</Text>
                {items.map(renderHistoryCard)}
              </View>
            ))}
          </>
        ) : (
          rows.map(renderListCard)
        )}

        {rows.length === 0 ? <Text style={styles.emptyText}>No invoices match.</Text> : null}
      </ScrollView>
    </BillingScreen>
  );
}

const styles = StyleSheet.create({
  // Segment on the orange header: brandDeep track, card for the active item (as the inventory selector chips).
  segment: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.full,
    padding: 2,
    marginTop: adminSpacing.md,
  },
  segmentItem: { paddingHorizontal: adminSpacing.lg, paddingVertical: adminSpacing.xs, borderRadius: adminRadius.full },
  segmentItemActive: { backgroundColor: adminColors.card },
  segmentText: { ...adminType.rowTitle, color: adminColors.onBrand },
  segmentTextActive: { color: adminColors.brand },

  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xl },
  chipsWrap: { marginBottom: adminSpacing.sm },
  dateHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardMidRow: { marginTop: adminSpacing.sm, marginBottom: adminSpacing.xs },
  invoiceId: { ...adminType.rowTitle, color: adminColors.ink },
  metaText: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  amountText: { ...adminType.sectionHead, color: adminColors.ink },
  actionRow: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.md },
  emptyText: { ...adminType.body, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.lg },
});
