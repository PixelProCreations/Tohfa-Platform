/**
 * Sales history (design M6-S08): GET /admin/sales, newest first, page by page.
 *
 * Every filter is a real ListSalesParams query param (channel, status,
 * paymentMethod, q, from / to); there is no client-side filtering of a page.
 * The API defaults to today when neither a date range nor `q` is sent, so the
 * date presets always send an explicit IST range, and a search drops the range
 * so a sale number or invoice number is found whatever day it was made on.
 *
 * Main (all-warehouse scope) picks a warehouse with WarehouseChips; a Sub
 * admin is pinned to scope.warehouseId (salesWarehouseFilter). The server
 * applies the scope regardless (BR-30).
 */
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { SalePaymentMethod, SaleStatus } from '../../../api/sales';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { AdminEmptyState, AdminErrorState, AdminLoadingState, AdminStateButton } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { SALE_CHANNELS, SALE_PAYMENT_METHODS, salesWarehouseFilter, type SaleListRow } from './mappers';
import { WarehouseChips } from './SalesParts';
import {
  PAYMENT_METHOD_KEY,
  PAYMENT_STATUS_KEY,
  SALE_CHANNEL_KEY,
  SALE_STATUS_KEY,
} from './salesLabels';
import type { PermissionCheck, WarehouseScope, WarehouseTab } from './types';
import { useSalesList, useSalesWarehouseOptions, type SaleListFilters } from './useSalesData';

// ─── Date presets (IST) ──────────────────────────────────────────────────────

export type SalesHistoryRange = 'today' | 'last7' | 'last30';

const RANGE_DAYS_BACK: Record<SalesHistoryRange, number> = { today: 0, last7: 6, last30: 29 };
const RANGES: readonly SalesHistoryRange[] = ['today', 'last7', 'last30'];
/** India has no DST: IST is a fixed UTC+05:30 (see roles/admin/utils/datetime.ts). */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const SEARCH_DEBOUNCE_MS = 300;

function istDay(ms: number): string {
  const d = new Date(ms + IST_OFFSET_MS);
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}-${month}-${day}`;
}

/** YYYY-MM-DD from / to (inclusive, IST calendar days) for a preset. Pure. */
export function salesHistoryRangeDates(range: SalesHistoryRange, now: Date): { from: string; to: string } {
  const nowMs = now.getTime();
  return { from: istDay(nowMs - RANGE_DAYS_BACK[range] * DAY_MS), to: istDay(nowMs) };
}

const SALE_STATUSES: readonly SaleStatus[] = ['PENDING_PAYMENT', 'PICKED_UP', 'CANCELLED'];

function buyerLabel(row: Pick<SaleListRow, 'buyer'>): string {
  if (row.buyer.kind === 'WALK_IN') {
    return row.buyer.name.trim() === '' ? t('sales.common.walkIn') : t('sales.history.walkInNamed', { name: row.buyer.name });
  }
  return row.buyer.customerCode ? `${row.buyer.name} · ${row.buyer.customerCode}` : row.buyer.name;
}

function statusTone(status: SaleStatus): { bg: string; text: string } {
  if (status === 'PICKED_UP') return adminColors.success;
  if (status === 'CANCELLED') return adminColors.danger;
  return adminColors.warning;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Filter chips ────────────────────────────────────────────────────────────

interface ChipOption<V> {
  value: V;
  label: string;
}

function ChipRow<V>({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: readonly ChipOption<V>[];
  selected: V;
  onSelect: (value: V) => void;
}) {
  return (
    <View style={styles.chipGroup}>
      <Text style={styles.chipGroupTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {options.map((o) => {
          const active = o.value === selected;
          return (
            <TouchableOpacity
              key={String(o.value ?? 'all')}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelect(o.value)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

// Design id: M6-S08
export interface SalesHistoryScreenProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  onSelectSale: (saleId: string) => void;
}

export function SalesHistoryScreen({ scope, can, onBack, onSelectSale }: SalesHistoryScreenProps) {
  const canView = can('sales.history.view');
  const warehouses = useSalesWarehouseOptions(scope, can);
  // Main only: the picked warehouse (undefined = all). A Sub list is pinned to scope.warehouseId.
  const [pickedWarehouse, setPickedWarehouse] = useState<string | undefined>(undefined);

  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setQ(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  const [showFilters, setShowFilters] = useState(false);
  const [range, setRange] = useState<SalesHistoryRange>('today');
  const [channel, setChannel] = useState<'DIRECT' | 'MARKET' | undefined>(undefined);
  const [status, setStatus] = useState<SaleStatus | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod | undefined>(undefined);

  // A search spans every date (the server searches all days when `q` is set
  // and no range is sent); otherwise the preset's IST range is sent explicitly.
  const searching = q !== '';
  const dates: { from?: string; to?: string } = searching ? {} : salesHistoryRangeDates(range, new Date());
  const filters: SaleListFilters = {
    channel,
    status,
    paymentMethod,
    q: searching ? q : undefined,
    from: dates.from,
    to: dates.to,
  };

  const list = useSalesList(salesWarehouseFilter(scope, pickedWarehouse), filters, { enabled: canView });
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  const now = new Date();
  const isAll = scope.warehouseId === undefined;

  const allLabel = t('sales.history.filter.all');

  const renderRow = ({ item }: { item: SaleListRow }) => {
    const tone = statusTone(item.status);
    return (
      <TouchableOpacity
        style={styles.saleCard}
        onPress={() => onSelectSale(item.id)}
        activeOpacity={0.82}
        accessibilityRole="button"
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.saleIdText}>{item.saleNumber}</Text>
          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.statusText, { color: tone.text }]}>{t(SALE_STATUS_KEY[item.status])}</Text>
          </View>
        </View>

        <Text style={styles.customerSubText}>
          {buyerLabel(item)} · {t('sales.common.itemCount', { count: item.itemCount })}
        </Text>

        <Text style={styles.metaText}>
          {t(SALE_CHANNEL_KEY[item.channel])} · {t(PAYMENT_METHOD_KEY[item.paymentMethod])} ·{' '}
          {t(PAYMENT_STATUS_KEY[item.paymentStatus])}
          {isAll && warehouses.nameOf(item.warehouseId) ? ` · ${warehouses.nameOf(item.warehouseId)}` : ''}
        </Text>

        <View style={styles.cardBottomRow}>
          <Text style={styles.channelText}>
            {item.invoiceNumber ? t('sales.history.invoice', { number: item.invoiceNumber }) : ''}
          </Text>
          <View style={styles.rightInfoWrap}>
            <Text style={styles.dateText}>{formatAdminDate(item.createdAt, now)}</Text>
            <Text style={styles.amountText}>{formatPaise(item.totalPaise)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('sales.common.back')}
          >
            <ArrowBackIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('sales.history.title')}</Text>

          {canView ? (
            <TouchableOpacity
              style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
              onPress={() => setShowFilters((v) => !v)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('sales.history.filtersToggle')}
              accessibilityState={{ expanded: showFilters }}
            >
              <FilterSlidersIcon size={20} color={adminColors.onBrand} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {!canView ? (
        <View style={styles.mainContainer}>
          <AdminEmptyState title={t('sales.common.noPermission')} />
        </View>
      ) : (
        <View style={styles.mainContainer}>
          <View style={styles.searchBarWrap}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('sales.history.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={searchInput}
              onChangeText={setSearchInput}
              clearButtonMode="while-editing"
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel={t('sales.history.searchLabel')}
            />
          </View>

          <WarehouseChips
            scope={scope}
            selected={pickedWarehouse}
            onSelect={setPickedWarehouse}
            options={warehouses.options}
          />

          {searching ? (
            <Text style={styles.noteText}>{t('sales.history.searchAllDates')}</Text>
          ) : (
            <ChipRow
              title={t('sales.history.filter.range')}
              options={RANGES.map((r) => ({ value: r, label: t(`sales.history.range.${r}`) }))}
              selected={range}
              onSelect={setRange}
            />
          )}

          {showFilters ? (
            <View style={styles.filterPanel}>
              <ChipRow<'DIRECT' | 'MARKET' | undefined>
                title={t('sales.history.filter.channel')}
                options={[
                  { value: undefined, label: allLabel },
                  ...SALE_CHANNELS.map((c) => ({ value: c, label: t(SALE_CHANNEL_KEY[c]) })),
                ]}
                selected={channel}
                onSelect={setChannel}
              />
              <ChipRow<SaleStatus | undefined>
                title={t('sales.history.filter.status')}
                options={[
                  { value: undefined, label: allLabel },
                  ...SALE_STATUSES.map((s) => ({ value: s, label: t(SALE_STATUS_KEY[s]) })),
                ]}
                selected={status}
                onSelect={setStatus}
              />
              <ChipRow<SalePaymentMethod | undefined>
                title={t('sales.history.filter.method')}
                options={[
                  { value: undefined, label: allLabel },
                  ...SALE_PAYMENT_METHODS.map((m) => ({ value: m, label: t(PAYMENT_METHOD_KEY[m]) })),
                ]}
                selected={paymentMethod}
                onSelect={setPaymentMethod}
              />
            </View>
          ) : null}

          {view === 'loading' ? (
            <AdminLoadingState />
          ) : view === 'error' ? (
            <AdminErrorState error={list.error} onRetry={list.refresh} />
          ) : view === 'empty' ? (
            <AdminEmptyState title={t('sales.history.empty.title')} subtitle={t('sales.history.empty.subtitle')} />
          ) : (
            <FlatList
              data={list.items}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={renderRow}
              refreshControl={
                <RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} tintColor={adminColors.brand} />
              }
              onEndReachedThreshold={0.4}
              onEndReached={() => {
                if (list.hasMore && !list.isLoading) list.loadMore();
              }}
              ListFooterComponent={
                list.hasMore ? (
                  <View style={styles.loadMoreWrap}>
                    <AdminStateButton label={t('sales.common.loadMore')} onPress={list.loadMore} variant="secondary" />
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
    flex: 1,
    marginLeft: 8,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: adminColors.onBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: adminColors.brandDeep,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: adminSpacing.xs,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },
  noteText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginVertical: adminSpacing.sm,
  },
  filterPanel: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  chipGroup: {
    marginTop: adminSpacing.xs,
  },
  chipGroupTitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  chipRow: {
    gap: adminSpacing.sm,
    paddingVertical: adminSpacing.sm,
  },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  chipActive: {
    backgroundColor: adminColors.brandSoft.bg,
    borderColor: adminColors.brandSoft.border,
  },
  chipText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  chipTextActive: {
    ...adminType.caption,
    color: adminColors.brandSoft.text,
  },
  listContent: {
    paddingTop: adminSpacing.sm,
    paddingBottom: 20,
  },
  saleCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saleIdText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    ...adminType.rowTitle,
  },
  customerSubText: {
    ...adminType.body,
    color: adminColors.ink,
    marginTop: 4,
  },
  metaText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  channelText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    flex: 1,
  },
  rightInfoWrap: {
    alignItems: 'flex-end',
  },
  dateText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  amountText: {
    ...adminType.title,
    color: adminColors.ink,
  },
  loadMoreWrap: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
});
