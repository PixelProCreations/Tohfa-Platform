/**
 * Accounts & Finance > Purchase Dues & Farmer Payouts (HEAD port of the
 * origin/Superadmin-main design). Live from two reads:
 *   GET /admin/payouts       payout.view       (cursor paged, no totals)
 *   GET /admin/payout-dues   payout.dues.view  (totals cover every due)
 *
 * Honesty rules (brief 07):
 *  - Each payout shows its own server status (APPROVED is "Approved", not
 *    "Pending initiation"); a due is "Not yet a payout".
 *  - KPI tiles: a count of loaded rows is shown only when the whole list is in
 *    (R4); "(PERIOD)" tiles have no period to count over, and "Pending
 *    initiation", "Unrequested dues" and "Overdue" have no server figure, so
 *    they are dashes (R1, R5). farmerCount is a count of farmers, not of dues.
 *  - No dual-authorization claim: the list rows carry no flag (R8, BR-31).
 *  - No invented ids (`DUE-…`), quantities, prices or PO statuses (R9). The
 *    drill-down to PurchaseOrderPayoutScreen needed exactly those invented
 *    fields (PurchaseOrderRecord takes numbers and fixed statuses), so the
 *    cards do not open it; see the W2 report.
 */
import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import { adminColors, adminShadow, adminSpacing, adminType } from '../../theme';
import { OverviewDashboardCard } from '../../components/OverviewDashboardCard';
import { listPayouts, type PayoutListItemDto } from '../../api/payouts';
import { listPayoutDues, type PayoutDueDto } from '../../api/payoutDues';
import { useAdminQuery } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { hasKey, t, type TranslationKey } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { formatAdminDate } from '../../utils/datetime';
import { countText, moneyText } from '../dashboard/saOverviewFormat';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
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
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

type RecordTone = 'blue' | 'red' | 'green' | 'amber' | 'gray';

export interface PayoutListItem {
  id: string;
  title: string;
  statusLabel: string;
  tone: RecordTone;
  line1: string;
  line2?: string | undefined;
}

/** Badge tone of each payout status (openapi PayoutStatus plus the list filter's REJECTED). */
const PAYOUT_TONE: Readonly<Record<string, RecordTone>> = {
  REQUESTED: 'blue',
  PENDING_APPROVAL: 'blue',
  APPROVED: 'gray',
  PROCESSING: 'gray',
  PAID: 'green',
  FAILED: 'red',
  REVERSED: 'red',
  REJECTED: 'red',
};

/** A payout status as words; one the app does not know is shown as sent, never guessed. */
export function payoutRecordStatus(status: string): { label: string; tone: RecordTone } {
  const key = `wiringPayouts.payoutStatus.${status}`;
  return { label: hasKey(key) ? t(key as TranslationKey) : status, tone: PAYOUT_TONE[status] ?? 'gray' };
}

export function toPayoutRecord(p: PayoutListItemDto, now: Date): PayoutListItem {
  const view = payoutRecordStatus(p.status);
  const requested = p.requestedAt ? formatAdminDate(p.requestedAt, now) : '';
  return {
    id: p.id,
    title: `${p.payoutNumber} · ${p.farmerName || ADMIN_NO_VALUE}`,
    statusLabel: view.label,
    tone: view.tone,
    line1: t('wiringPayouts.purchaseDues.payoutLine', { amount: moneyText(p.amount), date: requested || ADMIN_NO_VALUE }),
  };
}

export function toDueRecord(d: PayoutDueDto): PayoutListItem {
  return {
    id: `due:${d.id}`,
    title: t('wiringPayouts.purchaseDues.dueTitle', { name: d.farmerName || ADMIN_NO_VALUE }),
    statusLabel: t('wiringPayouts.payoutStatus.notYet'),
    tone: 'amber',
    // The goods receipt is only a uuid here, so its slot is the dash (R9).
    line1: t('wiringPayouts.purchaseDues.dueLine', { receipt: ADMIN_NO_VALUE, amount: moneyText(d.amountDue) }),
    line2: typeof d.ageDays === 'number' ? t('wiringPayouts.purchaseDues.dueAge', { days: d.ageDays }) : undefined,
  };
}

/** API maximum page size. */
const PAGE_LIMIT = 100;

export interface PurchaseDuesPayoutsScreenProps {
  onBack: () => void;
}

export function PurchaseDuesPayoutsScreen({ onBack }: PurchaseDuesPayoutsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const payoutsQuery = useAdminQuery(adminKeys.scoped('payouts', undefined, { resource: 'list' }), (signal) =>
    listPayouts({ limit: PAGE_LIMIT }, signal),
  );
  const duesQuery = useAdminQuery(adminKeys.scoped('payoutDues', undefined, { resource: 'list', buckets: 'all' }), (signal) =>
    listPayoutDues({ limit: PAGE_LIMIT }, signal),
  );

  const allItems: PayoutListItem[] = useMemo(() => {
    const now = new Date();
    return [...(payoutsQuery.data?.items ?? []).map((p) => toPayoutRecord(p, now)), ...(duesQuery.data?.items ?? []).map(toDueRecord)];
  }, [payoutsQuery.data, duesQuery.data]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase().trim();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.line1.toLowerCase().includes(q) ||
        (item.line2 !== undefined && item.line2.toLowerCase().includes(q)) ||
        item.statusLabel.toLowerCase().includes(q),
    );
  }, [allItems, searchQuery]);

  // R4: a count of loaded rows is a total only when the server said there is no more.
  const payouts = payoutsQuery.data;
  const payoutsComplete = payouts !== undefined && !payouts.hasMore;
  const dues = duesQuery.data;
  const duesComplete = dues !== undefined && !dues.page.hasMore;
  const countWhere = (pred: (p: PayoutListItemDto) => boolean) =>
    payoutsComplete ? countText(payouts.items.filter(pred).length) : ADMIN_NO_VALUE;
  const awaitingText = countWhere((p) => p.status === 'REQUESTED' || p.status === 'PENDING_APPROVAL');
  const failedText = countWhere((p) => p.status === 'FAILED');
  const payoutCountText = payoutsComplete ? countText(payouts.items.length) : ADMIN_NO_VALUE;
  const dueCountText = duesComplete ? countText(dues.items.length) : ADMIN_NO_VALUE;

  const isPending = payoutsQuery.isPending || duesQuery.isPending;
  const error = payoutsQuery.error ?? duesQuery.error;

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Accounts & Finance"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase Dues & Farmer Payouts</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 6 KPI Cards in 2 columns ── */}
        <View style={styles.kpiGrid}>
          {/* No period is set on this screen, so the (PERIOD) tiles have nothing to count over. */}
          <OverviewDashboardCard title="TOTAL PAYOUTS (PERIOD)" value={ADMIN_NO_VALUE} titlePosition="top" style={styles.kpiCard} />
          <OverviewDashboardCard title="PENDING INITIATION" value={ADMIN_NO_VALUE} titlePosition="top" style={styles.kpiCard} />
          <OverviewDashboardCard title="AWAITING APPROVAL" value={awaitingText} titlePosition="top" style={styles.kpiCard} />
          <OverviewDashboardCard title="PAID (PERIOD)" value={ADMIN_NO_VALUE} titlePosition="top" style={styles.kpiCard} />
          <OverviewDashboardCard title="FAILED" value={failedText} titlePosition="top" style={styles.kpiCard} />
          <OverviewDashboardCard title="UNREQUESTED DUES" value={ADMIN_NO_VALUE} titlePosition="top" style={styles.kpiCard} />

          {/* Full-width card: Overdue */}
          <OverviewDashboardCard title="OVERDUE (PERIOD YOU SET)" value={ADMIN_NO_VALUE} titlePosition="top" style={styles.kpiCardFull} />
        </View>

        {/* ── Search & Filter Bar ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor={adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Filter"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── Counter Line ── */}
        <Text style={styles.counterText}>
          {t('wiringPayouts.purchaseDues.counter', { payouts: payoutCountText, dues: dueCountText })}
        </Text>

        {/* ── Records List ── */}
        {isPending ? (
          <AdminLoadingState label={t('wiringPayouts.purchaseDues.loading')} />
        ) : error && allItems.length === 0 ? (
          <AdminErrorState
            error={error}
            onRetry={() => {
              void payoutsQuery.refetch();
              void duesQuery.refetch();
            }}
          />
        ) : filteredItems.length === 0 ? (
          <AdminEmptyState
            title={t('wiringPayouts.purchaseDues.empty.title')}
            subtitle={t(searchQuery ? 'wiringPayouts.purchaseDues.empty.search' : 'wiringPayouts.purchaseDues.empty.subtitle')}
          />
        ) : (
          filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.recordCard, selectedCardId === item.id && styles.recordCardAlert]}
              onPress={() => setSelectedCardId(item.id)}
              activeOpacity={0.8}
              testID={`purchaseDues.record.${item.id}`}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordTitle}>{item.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.tone === 'blue'
                      ? styles.badgeBlue
                      : item.tone === 'red'
                        ? styles.badgeRed
                        : item.tone === 'green'
                          ? styles.badgeGreen
                          : item.tone === 'amber'
                            ? styles.badgeAmber
                            : styles.badgeGray,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      item.tone === 'blue'
                        ? styles.badgeTextBlue
                        : item.tone === 'red'
                          ? styles.badgeTextRed
                          : item.tone === 'green'
                            ? styles.badgeTextGreen
                            : item.tone === 'amber'
                              ? styles.badgeTextAmber
                              : styles.badgeTextGray,
                    ]}
                  >
                    {item.statusLabel}
                  </Text>
                </View>
              </View>

              <Text style={styles.recordLine1}>{item.line1}</Text>
              {item.line2 ? <Text style={styles.recordLine2}>{item.line2}</Text> : null}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingBottom: adminSpacing.xxxl,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    marginTop: 14,
    rowGap: 10,
  },
  kpiCard: {
    width: '48.5%',
    minHeight: 74,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiCardFull: {
    width: '100%',
    minHeight: 70,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  searchBarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: adminSpacing.md,
    marginTop: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    ...adminType.caption,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginHorizontal: adminSpacing.md,
    marginTop: 12,
    marginBottom: 10,
  },
  recordCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: adminSpacing.md,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  recordCardAlert: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recordTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeBlue: {
    backgroundColor: adminColors.info.bg,
  },
  badgeRed: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgeAmber: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeGray: {
    backgroundColor: adminColors.canvas,
  },
  badgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  badgeTextBlue: {
    color: adminColors.info.text,
  },
  badgeTextRed: {
    color: adminColors.danger.text,
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextAmber: {
    color: adminColors.warning.text,
  },
  badgeTextGray: {
    color: adminColors.muted,
  },
  recordLine1: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  recordLine2: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 3,
    lineHeight: 16,
  },
});
