/**
 * Approvals Inbox Screen (SA-M2-S04), ported from the Super Admin design
 * (origin/Superadmin-main screens/dashboard/ApprovalsInboxScreen.tsx).
 *
 * One list over every kind of item a Super Admin decides: high-value
 * transfers, admin promotions, stock adjustments, farmer applications and
 * produce listings. Each kind is read from its own endpoint, gated by that
 * route's code AND the code that decides it, so a caller who could not act on
 * a row never sees it. A kind whose read fails or is not permitted simply
 * contributes no rows; the chrome (header, search, filter, count line, list
 * container) is always drawn.
 *
 * There is no payout list in the API (only create and approve), so escalated
 * farmer payouts cannot appear here yet.
 *
 * The screen only reads. Opening a row is the host's job (`onSelectApproval`).
 */
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import { BackArrowIcon, ChevronDownIcon, FilterSlidersIcon, SearchIcon } from '../../components/AdminIcons';
import { OverviewApprovalCard } from '../../components/OverviewSuperAdminCards';
import { useAdminQuery } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { listAdminListings, type AdminListingDto } from '../../api/listings';
import { listFarmerApplications, type FarmerApplicationDto } from '../../api/farmerApplications';
import { listPromotionRequests, type PromotionRequestDto } from '../../api/promotions';
import { listStockAdjustments, type StockAdjustmentDto } from '../../api/stockAdjustments';
import { listWarehouseTransfers, TRANSFER_LIST_MAX_PAGE_SIZE, type WarehouseTransferSummaryDto } from '../../api/transfers';
import { listAllWarehouses } from '../../api/warehouseList';
import { formatKg, parseKgToGrams } from '../../money/quantity';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import { formatAdminDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { moneyText } from './saOverviewFormat';

export interface ApprovalItem {
  id: string;
  category: string;
  statusText: string;
  statusTone?: 'warning' | 'info' | 'danger' | 'success';
  title: string;
  meta: string;
  type: 'payout' | 'transfer' | 'promotion' | 'stock' | 'farmer_application' | 'listing';
}

export interface ApprovalsInboxScreenProps {
  /** Permission check from /auth/me. Missing denies every read (fail closed). */
  can?: Can | undefined;
  onBack: () => void;
  onSelectApproval: (item: ApprovalItem) => void;
}

const MODULE = 'saApprovals';
const PAGE_SIZE = 100;
const HOUR_MS = 60 * 60 * 1000;
const HOURS_PER_DAY = 24;
const BACK_SIZE = adminSpacing.xxl + adminSpacing.xs;
const CONTROL_SIZE = adminSpacing.xxxl - adminSpacing.xs;
const ICON_SIZE = adminSpacing.lg + adminSpacing.xs;

type ApprovalType = ApprovalItem['type'];

const TYPE_LABEL = {
  payout: 'saApprovals.cat.payout',
  transfer: 'saApprovals.cat.transfer',
  promotion: 'saApprovals.cat.promotion',
  stock: 'saApprovals.cat.stock',
  farmer_application: 'saApprovals.cat.application',
  listing: 'saApprovals.cat.listing',
} as const;

/** "Waiting 3 days": hours below a day, whole days after; the dash for an unreadable instant. */
export function waitingText(createdAt: string | null | undefined, now: Date): string {
  const at = typeof createdAt === 'string' ? Date.parse(createdAt) : Number.NaN;
  if (!Number.isFinite(at)) return ADMIN_NO_VALUE;
  const hours = Math.floor(Math.max(0, now.getTime() - at) / HOUR_MS);
  if (hours < 1) return t('saApprovals.duration.underHour');
  if (hours < HOURS_PER_DAY) return t(hours === 1 ? 'saApprovals.duration.hour' : 'saApprovals.duration.hours', { count: hours });
  const days = Math.floor(hours / HOURS_PER_DAY);
  return t(days === 1 ? 'saApprovals.duration.day' : 'saApprovals.duration.days', { count: days });
}

function requestedMeta(createdAt: string, now: Date): string {
  // The API sends the requester as an id only, so the name is the dash.
  return t('saApprovals.meta.requested', { who: ADMIN_NO_VALUE, waiting: waitingText(createdAt, now) });
}

function submittedMeta(at: string | null | undefined, now: Date): string {
  const day = typeof at === 'string' ? formatAdminDay(at) : '';
  return t('saApprovals.meta.submitted', { day: day === '' ? ADMIN_NO_VALUE : day, waiting: waitingText(at, now) });
}

function titleCaseRole(role: string): string {
  return role
    .toLowerCase()
    .split('_')
    .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function signedKg(qty: string): string {
  const grams = parseKgToGrams(qty);
  return grams === null ? ADMIN_NO_VALUE : `${grams > 0 ? '+' : ''}${formatKg(grams)}`;
}

function gradeText(grade: string): string {
  const digits = grade.replace(/\D/g, '');
  return digits === '' ? ADMIN_NO_VALUE : t('saApprovals.listing.grade', { value: digits });
}

export function transferItem(dto: WarehouseTransferSummaryDto, names: ReadonlyMap<string, string>, now: Date): ApprovalItem {
  const from = names.get(dto.fromWarehouseId) ?? ADMIN_NO_VALUE;
  const to = names.get(dto.toWarehouseId) ?? ADMIN_NO_VALUE;
  return {
    id: dto.id,
    type: 'transfer',
    category: t(TYPE_LABEL.transfer),
    statusText: t('saApprovals.status.highValue'),
    statusTone: 'info',
    title: t('saApprovals.title.transfer', { code: dto.transferNumber, from, to, value: moneyText(dto.totalValue) }),
    meta: requestedMeta(dto.createdAt, now),
  };
}

export function promotionItem(dto: PromotionRequestDto, now: Date): ApprovalItem {
  return {
    id: dto.id,
    type: 'promotion',
    category: t(TYPE_LABEL.promotion),
    statusText: t('saApprovals.status.pending'),
    statusTone: 'warning',
    // The request carries ids only, so the person's name is the dash.
    title: t('saApprovals.title.promotion', { who: ADMIN_NO_VALUE, role: titleCaseRole(dto.toRole) }),
    meta: requestedMeta(dto.createdAt, now),
  };
}

export function adjustmentItem(dto: StockAdjustmentDto, names: ReadonlyMap<string, string>, now: Date): ApprovalItem {
  return {
    id: dto.id,
    type: 'stock',
    category: t(TYPE_LABEL.stock),
    statusText: t('saApprovals.status.pending'),
    statusTone: 'warning',
    title: t('saApprovals.title.stock', {
      code: dto.batchCode,
      qty: signedKg(dto.qtyDeltaKg),
      warehouse: names.get(dto.warehouseId) ?? ADMIN_NO_VALUE,
    }),
    meta: requestedMeta(dto.createdAt, now),
  };
}

export function applicationItem(dto: FarmerApplicationDto, now: Date): ApprovalItem {
  return {
    id: dto.id,
    type: 'farmer_application',
    category: t(TYPE_LABEL.farmer_application),
    statusText: t('saApprovals.status.pendingReview'),
    statusTone: 'warning',
    title: t('saApprovals.title.application', { name: dto.fullName ?? ADMIN_NO_VALUE }),
    meta: submittedMeta(dto.submittedAt ?? dto.createdAt, now),
  };
}

export function listingItem(dto: AdminListingDto, now: Date): ApprovalItem {
  const routed = dto.routedAway === true;
  return {
    id: dto.id,
    type: 'listing',
    category: t(TYPE_LABEL.listing),
    statusText: t(routed ? 'saApprovals.status.routedOwn' : 'saApprovals.status.pendingReview'),
    statusTone: 'warning',
    title: t('saApprovals.title.listing', {
      crop: dto.cropName ?? ADMIN_NO_VALUE,
      grade: gradeText(dto.grade),
      farmer: dto.farmerName ?? ADMIN_NO_VALUE,
    }),
    meta: routed
      ? t('saApprovals.meta.routed', { waiting: waitingText(dto.createdAt, now) })
      : submittedMeta(dto.createdAt, now),
  };
}

export function matchesSearch(item: ApprovalItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return [item.title, item.category, item.meta].some((s) => s.toLowerCase().includes(q));
}

interface InboxData {
  items: ApprovalItem[];
  isLoading: boolean;
  hasError: boolean;
  refetch: () => void;
}

function useInboxData(can: Can | undefined): InboxData {
  const has = (code: string): boolean => typeof can === 'function' && can(code);
  const transfersOn = has('transfer.inter_warehouse.view') && has('transfer.high_value.approve');
  const promotionsOn = has('admin.promotion.view') && has('admin.promotion.approve');
  const stockOn = has('inventory.stock_adjustment.create') && has('inventory.stock_adjustment.approve');
  const applicationsOn = has('farmer.application.list_pending') && has('farmer.application.approve');
  const listingsOn = has('listing.queue.view_pending') && has('listing.approve');
  const namesOn = has('warehouse.all.view') && (transfersOn || stockOn);

  const transfers = useAdminQuery(
    adminKeys.scoped(MODULE, undefined, { resource: 'transfers' }),
    (signal) => listWarehouseTransfers({ status: 'PENDING_APPROVAL', page: 1, pageSize: TRANSFER_LIST_MAX_PAGE_SIZE }, signal),
    { enabled: transfersOn },
  );
  const promotions = useAdminQuery(
    adminKeys.scoped(MODULE, undefined, { resource: 'promotions' }),
    (signal) => listPromotionRequests({ status: 'PENDING', limit: PAGE_SIZE }, signal),
    { enabled: promotionsOn },
  );
  const adjustments = useAdminQuery(
    adminKeys.scoped(MODULE, undefined, { resource: 'adjustments' }),
    (signal) => listStockAdjustments({ status: 'PENDING', page: 1, pageSize: PAGE_SIZE }, signal),
    { enabled: stockOn },
  );
  const applications = useAdminQuery(
    adminKeys.scoped(MODULE, undefined, { resource: 'applications' }),
    (signal) => listFarmerApplications({ status: 'SUBMITTED', limit: PAGE_SIZE }, signal),
    { enabled: applicationsOn },
  );
  const listings = useAdminQuery(
    adminKeys.scoped(MODULE, undefined, { resource: 'listings' }),
    (signal) => listAdminListings({ status: 'PENDING_APPROVAL', limit: PAGE_SIZE }, signal),
    { enabled: listingsOn },
  );
  const warehouses = useAdminQuery(
    adminKeys.scoped(MODULE, undefined, { resource: 'warehouses' }),
    (signal) => listAllWarehouses({}, signal),
    { enabled: namesOn },
  );

  const items = useMemo(() => {
    const now = new Date();
    const names = new Map<string, string>((warehouses.data ?? []).map((w) => [w.id, w.name]));
    return [
      ...(transfers.data?.items ?? []).map((d) => transferItem(d, names, now)),
      ...(promotions.data?.items ?? []).map((d) => promotionItem(d, now)),
      ...(adjustments.data?.items ?? []).map((d) => adjustmentItem(d, names, now)),
      ...(applications.data?.items ?? []).map((d) => applicationItem(d, now)),
      ...(listings.data?.items ?? []).map((d) => listingItem(d, now)),
    ];
  }, [transfers.data, promotions.data, adjustments.data, applications.data, listings.data, warehouses.data]);

  const sources = [
    { on: transfersOn, q: transfers },
    { on: promotionsOn, q: promotions },
    { on: stockOn, q: adjustments },
    { on: applicationsOn, q: applications },
    { on: listingsOn, q: listings },
  ];
  return {
    items,
    isLoading: sources.some((s) => s.on && s.q.isPending),
    hasError: sources.some((s) => s.on && s.q.isError),
    refetch: () => {
      for (const s of sources) if (s.on) void s.q.refetch();
    },
  };
}

export function ApprovalsInboxScreen({ can, onBack, onSelectApproval }: ApprovalsInboxScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | ApprovalType>('All');
  const data = useInboxData(can);

  const filteredItems = data.items.filter(
    (item) => (selectedFilter === 'All' || item.type === selectedFilter) && matchesSearch(item, searchQuery),
  );

  // The pill steps through "All" and each kind that currently has rows.
  const cycle = (): void => {
    const kinds = Array.from(new Set(data.items.map((i) => i.type)));
    const order: ('All' | ApprovalType)[] = ['All', ...kinds];
    const at = order.indexOf(selectedFilter);
    setSelectedFilter(order[(at + 1) % order.length] ?? 'All');
  };
  const countLabel =
    selectedFilter === 'All'
      ? t('saApprovals.allCount', { count: filteredItems.length })
      : t('saApprovals.typeCount', { type: t(TYPE_LABEL[selectedFilter]), count: filteredItems.length });

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="saApprovals.back"
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('saApprovals.back')}
        >
          <BackArrowIcon size={ICON_SIZE + adminSpacing.xs} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('saApprovals.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchBox}>
            <SearchIcon size={ICON_SIZE} color={adminColors.muted} />
            <TextInput
              testID="saApprovals.search"
              style={styles.searchInput}
              placeholder={t('saApprovals.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel={t('saApprovals.searchPlaceholder')}
            />
          </View>
          <TouchableOpacity
            testID="saApprovals.filter"
            style={styles.filterBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('saApprovals.filter')}
          >
            <FilterSlidersIcon size={ICON_SIZE} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Count & Filter Row */}
        <View style={styles.filterCountRow}>
          <TouchableOpacity
            testID="saApprovals.count"
            style={styles.filterDropdownPill}
            activeOpacity={0.7}
            onPress={cycle}
            accessibilityRole="button"
            accessibilityLabel={countLabel}
          >
            <Text style={styles.filterCountText}>{countLabel}</Text>
            <ChevronDownIcon size={adminSpacing.lg - adminSpacing.xs / 2} color={adminColors.muted} />
          </TouchableOpacity>
        </View>

        {/* Approvals List */}
        <View style={styles.approvalsList} testID="saApprovals.list">
          {data.hasError ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>{t('saApprovals.error')}</Text>
              <TouchableOpacity testID="saApprovals.retry" onPress={data.refetch} accessibilityRole="button" activeOpacity={0.7}>
                <Text style={styles.retryText}>{t('saApprovals.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {data.isLoading && data.items.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>{t('saApprovals.loading')}</Text>
            </View>
          ) : null}
          {!data.isLoading && filteredItems.length === 0 ? (
            <View style={styles.stateBox} testID="saApprovals.empty">
              <Text style={styles.stateText}>{t('saApprovals.empty')}</Text>
            </View>
          ) : null}
          {filteredItems.map((item) => (
            <OverviewApprovalCard
              key={`${item.type}:${item.id}`}
              category={item.category}
              badgeLabel={item.statusText}
              statusTone={item.statusTone}
              title={item.title}
              meta={item.meta}
              onPress={() => onSelectApproval(item)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    width: BACK_SIZE,
    height: BACK_SIZE,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: CONTROL_SIZE,
    gap: adminSpacing.xs,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtn: {
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  filterDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
  },
  filterCountText: {
    ...adminType.body,
    color: adminColors.muted,
    fontWeight: '500',
  },
  approvalsList: {
    gap: adminSpacing.sm,
    paddingBottom: adminSpacing.xl,
  },
  stateBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  stateText: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
  },
  retryText: {
    ...adminType.body,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
});
