/**
 * Invoice List / History: one read-only list with two layouts, on
 * GET /invoices (plan phase 7).
 *
 *   - 'list' (M9-S02): cards with the invoice number, type, date and total;
 *     tapping a card expands its View / Download actions.
 *   - 'history' (M9-S07): Retail / B2B chips and cards grouped by issue day.
 *     The chips are the server's `type` filter (SALE_RETAIL / SALE_B2B).
 *
 * The rows are the server's: newest first, paged with "Load more" and pull to
 * refresh. The search box narrows the rows already loaded by invoice number;
 * the API has no search. Scope is the server's too (BR-36): a Sub admin sees
 * the invoices of orders placed at its own warehouse, and nothing here filters
 * by warehouse. Gates: read-only; View / Download need invoice.view_own.
 *
 * Hidden, because GET /invoices cannot back them: the filters screen (status,
 * customer, order, amount and sort have no query parameter; the type filter is
 * the chips), the customer name and order number on a card (the invoice row
 * carries neither) and the time of day (the issue date is a calendar date).
 * The Main all-warehouses selector is not drawn: the API cannot filter by
 * warehouse.
 */
// Design id: M9-S02
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ActionError,
  BillingButton,
  BillingScreen,
  ChipGroup,
  isAllWarehouses,
  LoadMoreButton,
  ScopeHeader,
  SearchBar,
  ToneBadge,
} from './BillingParts';
import { groupInvoicesByDay } from './mappers';
import type {
  BillingLiveStateProps,
  InvoiceHistoryChip,
  InvoiceListLayout,
  InvoiceRow,
  WarehouseScreenBaseProps,
} from './types';

export interface InvoiceListScreenProps extends WarehouseScreenBaseProps, BillingLiveStateProps {
  initialLayout?: InvoiceListLayout | undefined;
  /** Lets the host keep the chosen layout. */
  onLayoutChange?: ((layout: InvoiceListLayout) => void) | undefined;
  onNavigateToInvoiceDetail: (invoiceId: string) => void;
  /** The loaded rows, page by page. */
  invoices?: readonly InvoiceRow[] | undefined;
  /** The history chip, owned by the host because it is the server's type filter. */
  historyChip?: InvoiceHistoryChip | undefined;
  onHistoryChipChange?: ((chip: InvoiceHistoryChip) => void) | undefined;
  /** Opens the invoice PDF (signed link). */
  onDownload?: ((invoiceId: string) => void) | undefined;
  isDownloading?: boolean | undefined;
  downloadError?: unknown;
}

const HISTORY_CHIPS: readonly InvoiceHistoryChip[] = ['All', 'Retail', 'B2B'];

export function InvoiceListScreen({
  scope,
  can,
  onBack,
  initialLayout = 'list',
  onNavigateToInvoiceDetail,
  invoices = [],
  historyChip = 'All',
  onHistoryChipChange,
  onDownload,
  isDownloading = false,
  downloadError,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: InvoiceListScreenProps) {
  const [layout, setLayout] = useState<InvoiceListLayout>(initialLayout);
  useEffect(() => {
    setLayout(initialLayout);
  }, [initialLayout]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | undefined>(undefined);
  const canView = can('invoice.view_own');
  const view = queryViewState({ isLoading, error, itemCount: invoices.length });

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((item) => item.invoiceNumber.toLowerCase().includes(q));
  }, [invoices, searchQuery]);
  const groups = useMemo(() => groupInvoicesByDay(rows), [rows]);

  const renderListCard = (inv: InvoiceRow) => {
    const expanded = expandedId === inv.id;
    return (
      <TouchableOpacity
        key={inv.id}
        style={styles.card}
        onPress={() => setExpandedId(expanded ? undefined : inv.id)}
        activeOpacity={0.88}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.invoiceId}>{inv.invoiceNumber}</Text>
          <ToneBadge label={inv.statusLabel} tone={inv.tone} />
        </View>
        <View style={[styles.rowBetween, styles.cardMidRow]}>
          <Text style={styles.metaText}>{inv.typeLabel}</Text>
          <Text style={styles.amountText}>{inv.amountLabel}</Text>
        </View>
        <Text style={styles.metaText}>{inv.issueDateLabel}</Text>
        {expanded && canView ? (
          <View style={styles.actionRow}>
            <BillingButton
              label={t('billing.action.view')}
              variant="tint"
              compact
              flex
              onPress={() => onNavigateToInvoiceDetail(inv.id)}
            />
            {onDownload ? (
              <BillingButton
                label={t(isDownloading ? 'billing.action.downloading' : 'billing.action.download')}
                variant="tint"
                compact
                flex
                disabled={isDownloading}
                onPress={() => onDownload(inv.id)}
              />
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderHistoryCard = (inv: InvoiceRow) => (
    <TouchableOpacity
      key={inv.id}
      style={styles.card}
      onPress={() => (canView ? onNavigateToInvoiceDetail(inv.id) : undefined)}
      disabled={!canView}
      activeOpacity={0.75}
    >
      <View style={styles.rowBetween}>
        <Text style={styles.invoiceId}>{inv.invoiceNumber}</Text>
        <ToneBadge label={inv.statusLabel} tone={inv.tone} />
      </View>
      <View style={[styles.rowBetween, styles.cardMidRow]}>
        <Text style={styles.metaText}>{inv.typeLabel}</Text>
        <Text style={styles.amountText}>{inv.amountLabel}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <BillingScreen
      title={layout === 'history' ? 'Invoice History' : 'Invoice List'}
      onBack={onBack}
      headerExtra={isAllWarehouses(scope) ? null : <ScopeHeader scope={scope} />}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={adminColors.brand} colors={[adminColors.brand]} />
          ) : undefined
        }
      >
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={t('billing.list.searchPlaceholder')} />

        {layout === 'history' ? (
          <View style={styles.chipsWrap}>
            <ChipGroup options={HISTORY_CHIPS} value={historyChip} onChange={(chip) => onHistoryChipChange?.(chip)} />
          </View>
        ) : null}

        {downloadError !== undefined && downloadError !== null ? (
          <View style={styles.errorWrap}>
            <ActionError error={downloadError} />
          </View>
        ) : null}

        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : rows.length === 0 ? (
          <AdminEmptyState title={t(invoices.length === 0 ? 'billing.empty.invoices' : 'billing.empty.filtered')} />
        ) : layout === 'history' ? (
          groups.map((group) => (
            <View key={group.day}>
              <Text style={styles.dateHeading}>{group.label}</Text>
              {group.rows.map(renderHistoryCard)}
            </View>
          ))
        ) : (
          rows.map(renderListCard)
        )}

        {view === 'ready' && hasMore && onLoadMore ? <LoadMoreButton onPress={onLoadMore} /> : null}
      </ScrollView>
    </BillingScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xl },
  chipsWrap: { marginBottom: adminSpacing.sm },
  errorWrap: { marginBottom: adminSpacing.md },
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
});
