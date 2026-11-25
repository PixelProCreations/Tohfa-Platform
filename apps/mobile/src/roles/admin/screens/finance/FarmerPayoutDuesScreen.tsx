/**
 * Farmer Payout Dues (design: origin/Superadmin-main), fed by
 * GET /admin/payout-dues (payout.dues.view). Read-only: Bulk-Process stays
 * disabled although POST /admin/payouts/bulk now exists (BR-230, api/payouts.ts
 * createBulkPayouts / useBulkCreatePayouts). That endpoint takes `items` of
 * { farmerId, amount, mode: UPI|IMPS|NEFT, dueIds }, atomically, so wiring it
 * needs an owner decision on the payment mode and on which dues the "< 10K"
 * label selects (a due is not a payout). A due is not a payout, so nothing here
 * approves one.
 *
 * The header total and farmer count are the server's `totals` over every due
 * (an unfiltered request), never a sum of one page (R4). Each aging chip asks
 * the server for its bucket; "15+ days" asks for both D16_30 and D30_PLUS and
 * shows the two lists together, so a due older than 30 days is never hidden.
 * The aging words come from the server's ageBucket, not from local day limits.
 * The dues carry no dual-approval flag, so no card claims one (R8, BR-31).
 */
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';

import type { Money } from '@tohfa/shared-types';
import { listPayoutDues, type PayoutDueAgeBucket, type PayoutDueDto } from '../../api/payoutDues';
import { useAdminQuery } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { hasKey, t } from '../../i18n';
import { adminColors, adminShadow, adminSpacing } from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { countText, moneyText } from '../dashboard/saOverviewFormat';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={adminColors.ink}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={adminColors.card}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PenIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={adminColors.ink}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type AgingFilter = 'All' | '0-7 days' | '8-15 days' | '15+ days';

/** One due as the cards draw it (also handed to the processing screen by roles/farmer/App.tsx). */
export interface PayoutDueItem {
  id: string;
  initials: string;
  farmerName: string;
  /** Server ageDays; null when absent. */
  agingDays: number | null;
  /** The server bucket's words, or the dash. */
  agingStatus: string;
  overdue: boolean;
  /** API decimal string. */
  amount: Money;
  farmId: string;
  location: string;
}

export interface FarmerPayoutDuesScreenProps {
  onBack: () => void;
  onNavigateToProcessing: (dueItem?: PayoutDueItem | undefined) => void;
}

/** The server buckets each chip asks for; undefined = every due. */
export function agingBuckets(filter: AgingFilter): readonly PayoutDueAgeBucket[] | undefined {
  if (filter === '0-7 days') return ['D0_7'];
  if (filter === '8-15 days') return ['D8_15'];
  if (filter === '15+ days') return ['D16_30', 'D30_PLUS'];
  return undefined;
}

/** Page size per request (the API's maximum). */
const DUES_PAGE_LIMIT = 100;

export function toPayoutDueItem(dto: PayoutDueDto): PayoutDueItem {
  const name = dto.farmerName && dto.farmerName.trim() !== '' ? dto.farmerName : ADMIN_NO_VALUE;
  const initials =
    name === ADMIN_NO_VALUE
      ? ADMIN_NO_VALUE
      : name
          .split(/\s+/)
          .filter((p) => p !== '')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
  const bucketKey = dto.ageBucket === undefined ? undefined : `wiringPayouts.payoutDues.bucket.${dto.ageBucket}`;
  return {
    id: dto.id,
    initials,
    farmerName: name,
    agingDays: typeof dto.ageDays === 'number' ? dto.ageDays : null,
    agingStatus: bucketKey !== undefined && hasKey(bucketKey) ? t(bucketKey) : ADMIN_NO_VALUE,
    overdue: dto.ageBucket === 'D16_30' || dto.ageBucket === 'D30_PLUS',
    amount: dto.amountDue,
    farmId: dto.tohfaFarmerId ?? ADMIN_NO_VALUE,
    location: ADMIN_NO_VALUE,
  };
}

export function FarmerPayoutDuesScreen({
  onBack,
}: FarmerPayoutDuesScreenProps) {
  const [activeFilter, setActiveFilter] = useState<AgingFilter>('All');

  // Header: the server's totals over every due (limit 1: only `totals` is read).
  const totalsQuery = useAdminQuery(adminKeys.scoped('payoutDues', undefined, { resource: 'totals' }), (signal) =>
    listPayoutDues({ limit: 1 }, signal),
  );
  const totals = totalsQuery.data?.totals;

  const buckets = agingBuckets(activeFilter);
  const listQuery = useAdminQuery(
    adminKeys.scoped('payoutDues', undefined, { resource: 'list', buckets: buckets === undefined ? 'all' : buckets.join(',') }),
    async (signal) => {
      const pages = await Promise.all(
        (buckets ?? [undefined]).map((ageBucket) => listPayoutDues({ ageBucket, limit: DUES_PAGE_LIMIT }, signal)),
      );
      return pages.flatMap((page) => page.items);
    },
  );
  const mappedList = (listQuery.data ?? []).map(toPayoutDueItem);

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button First */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Heading Next */}
        <Text style={styles.screenTitle}>Farmer Payout Dues</Text>
        <Text style={styles.screenSub}>
          {t('wiringPayouts.payoutDues.sub', { amount: moneyText(totals?.totalDue), farmers: countText(totals?.farmerCount) })}
        </Text>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['All', '0-7 days', '8-15 days', '15+ days'] as AgingFilter[]).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {listQuery.isPending ? (
          <AdminLoadingState label={t('wiringPayouts.payoutDues.loading')} />
        ) : listQuery.error ? (
          <AdminErrorState error={listQuery.error} onRetry={() => void listQuery.refetch()} />
        ) : mappedList.length === 0 ? (
          <AdminEmptyState title={t('wiringPayouts.payoutDues.empty.title')} subtitle={t('wiringPayouts.payoutDues.empty.subtitle')} />
        ) : (
          /* Farmer Dues List */
          <View style={styles.duesListCol}>
            {mappedList.map((item) => {
              const isOverdue = item.overdue;
              // A due is not a payout and carries no dual-approval flag, so a card opens nothing (R8).
              return (
                <TouchableOpacity key={item.id} style={styles.dueCard} activeOpacity={1} testID={`payoutDues.card.${item.id}`}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{item.initials}</Text>
                  </View>

                  <View style={styles.dueDetailsCol}>
                    <Text style={styles.farmerName}>{item.farmerName}</Text>
                    <Text style={[styles.agingText, isOverdue && styles.overdueText]}>
                      {t('wiringPayouts.payoutDues.aging', { days: countText(item.agingDays), status: item.agingStatus })}
                    </Text>
                  </View>

                  <Text style={styles.amountText}>{moneyText(item.amount)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.btnStack}>
          {/* Primary Bulk Process - disabled until the payment mode / dues selection is decided (see file header) */}
          <TouchableOpacity
            style={[styles.primaryBtn, styles.actionUnavailable]}
            activeOpacity={1}
            disabled
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            testID="payoutDues.bulk"
          >
            <CheckmarkIcon />
            <Text style={styles.primaryBtnText}>
              Bulk-Process Payouts &lt; ₹10K
            </Text>
          </TouchableOpacity>

          {/* Escalate (design): the dues carry no dual-approval flag and a due is not a payout, so it stays disabled (R3, R8). */}
          <TouchableOpacity
            style={[styles.secondaryBtn, styles.actionUnavailable]}
            disabled
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            testID="payoutDues.escalate"
          >
            <PenIcon />
            <Text style={styles.secondaryBtnText}>{t('wiringPayouts.payoutDues.escalate', { amount: ADMIN_NO_VALUE })}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...adminShadow.sm,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: adminColors.brandDeep,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: adminColors.muted,
    marginTop: 4,
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.muted,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  duesListCol: {
    gap: 10,
    marginBottom: 24,
  },
  dueCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...adminShadow.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brand,
  },
  dueDetailsCol: {
    flex: 1,
  },
  farmerName: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 3,
  },
  agingText: {
    fontSize: 12,
    color: adminColors.muted,
  },
  overdueText: {
    color: adminColors.danger.text,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  btnStack: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.md,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  secondaryBtn: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  /** The designed control, kept visible, drawn as unavailable. */
  actionUnavailable: {
    opacity: 0.5,
  },
});
