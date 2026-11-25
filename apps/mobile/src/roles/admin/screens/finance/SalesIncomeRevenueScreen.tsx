import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors, adminShadow, adminSpacing, adminType } from '../../theme';
import { OverviewDashboardCard } from '../../components/OverviewDashboardCard';
import { listFinanceRevenue, type FinanceRevenueItemDto } from '../../api/finance';
import { useAdminQuery } from '../../api/hooks';
import { listAllWarehouses } from '../../api/warehouseList';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { formatAdminDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { countText, moneyText } from '../dashboard/saOverviewFormat';
import { RevenueDetailScreen } from '../warehouse/finance-expenses';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

const INCOME_PAGE = 50;

/** The badge for an order's payment status; a status with no label shows as the server sent it. */
function paymentStatusLabel(status: string): string {
  switch (status) {
    case 'PAID':
      return t('wiringFinance.salesIncome.status.PAID');
    case 'FAILED':
      return t('wiringFinance.salesIncome.status.FAILED');
    case 'PENDING':
      return t('wiringFinance.salesIncome.status.PENDING');
    default:
      return status;
  }
}

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

export interface SalesIncomeRevenueScreenProps {
  onBack: () => void;
  /** The signed-in admin's permission check, handed to the live revenue detail. */
  can?: Can | undefined;
}

/**
 * Sales income on GET /admin/finance/revenue (completed paid orders, BR-63).
 * The KPI and counter figures are the list's own `summary` over every row
 * (R4). The API gives gross sales only: discounts, refunds, pending, failed
 * and net are dashed (R5), and so is "collected" while the revenue definition
 * is an unconfirmed owner default. A revenue row has no buyer or order
 * number, so those slots are dashed (R9). A row opens the live revenue detail
 * by its real order id.
 */
export function SalesIncomeRevenueScreen({ onBack, can = () => false }: SalesIncomeRevenueScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const revenueQuery = useAdminQuery(['admin', 'finance', 'revenue-list', INCOME_PAGE], (signal) =>
    listFinanceRevenue({ limit: INCOME_PAGE }, signal),
  );
  const warehousesQuery = useAdminQuery(['admin', 'warehouses', 'all'], (signal) => listAllWarehouses({}, signal));
  const warehouseName = (id: string) => warehousesQuery.data?.find((w) => w.id === id)?.name ?? ADMIN_NO_VALUE;

  const summary = revenueQuery.data?.summary;
  const rows = (revenueQuery.data?.items ?? []).map((item: FinanceRevenueItemDto) => ({
    item,
    title: t('wiringFinance.salesIncome.title', { number: ADMIN_NO_VALUE, customer: ADMIN_NO_VALUE }),
    status: paymentStatusLabel(item.paymentStatus),
    line1: t('wiringFinance.salesIncome.line1', {
      channel: item.channel,
      amount: moneyText(item.totalAmount),
      warehouse: warehouseName(item.warehouseId),
      date: formatAdminDay(item.completedAt) || ADMIN_NO_VALUE,
    }),
    line2: t('wiringFinance.salesIncome.line2', { invoice: ADMIN_NO_VALUE, tax: moneyText(item.gstAmount) }),
  }));
  const query = searchQuery.toLowerCase().trim();
  const filteredItems = query
    ? rows.filter((row) => [row.title, row.status, row.line1, row.line2].some((v) => v.toLowerCase().includes(query)))
    : rows;

  if (openOrderId !== null) {
    return (
      <RevenueDetailScreen
        scope={{ warehouseId: undefined, warehouseName: undefined }}
        can={can}
        orderId={openOrderId}
        onBack={() => setOpenOrderId(null)}
      />
    );
  }

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
        <Text style={styles.headerTitle}>Sales Income & Revenue</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top KPI Grid: 7 Cards ── */}
        <View style={styles.kpiGrid}>
          <OverviewDashboardCard title="GROSS SALES VALUE" value={moneyText(summary?.total)} titlePosition="top" style={styles.kpiCard} />
          <OverviewDashboardCard title="DISCOUNTS" value={ADMIN_NO_VALUE} titlePosition="top" style={styles.kpiCard} />
          <OverviewDashboardCard title="REFUNDS" value={ADMIN_NO_VALUE} titlePosition="top" style={styles.kpiCard} />
          <OverviewDashboardCard title="COLLECTED" value={ADMIN_NO_VALUE} titlePosition="top" style={styles.kpiCard} />
          <OverviewDashboardCard title="PENDING" value={ADMIN_NO_VALUE} titlePosition="top" style={styles.kpiCard} />
          <OverviewDashboardCard title="FAILED" value={ADMIN_NO_VALUE} titlePosition="top" style={styles.kpiCard} />

          {/* Full-width card: Net Sales Value. The API gives gross only (R5). */}
          <OverviewDashboardCard title="NET SALES VALUE" value={ADMIN_NO_VALUE} titlePosition="top" style={styles.kpiCardFull} />
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

        {/* ── Counter Line: the server's count and the channels it reports (R4) ── */}
        <Text style={styles.counterText}>
          {t('wiringFinance.salesIncome.counter', {
            count: countText(summary?.count),
            channels: summary === undefined ? ADMIN_NO_VALUE : String(summary.byChannel.length),
          })}
        </Text>

        {/* ── Records List ── */}
        {revenueQuery.isPending ? (
          <AdminLoadingState />
        ) : revenueQuery.error ? (
          <AdminErrorState error={revenueQuery.error} onRetry={() => void revenueQuery.refetch()} />
        ) : filteredItems.length === 0 ? (
          <AdminEmptyState title={t(query ? 'wiringFinance.salesIncome.noMatch' : 'wiringFinance.salesIncome.empty')} />
        ) : (
          filteredItems.map((row) => {
            const isCollected = row.item.paymentStatus === 'PAID';
            const isFailed = row.item.paymentStatus === 'FAILED';

            return (
              <TouchableOpacity
                key={row.item.orderId}
                style={styles.recordCard}
                onPress={() => setOpenOrderId(row.item.orderId)}
                activeOpacity={0.8}
                testID={`finance.salesIncome.row.${row.item.orderId}`}
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordTitle}>{row.title}</Text>
                  <View style={[styles.statusBadge, isCollected ? styles.badgeGreen : isFailed ? styles.badgeRed : styles.badgeGray]}>
                    <Text
                      style={[styles.badgeText, isCollected ? styles.badgeTextGreen : isFailed ? styles.badgeTextRed : styles.badgeTextGray]}
                    >
                      {row.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.recordLine1}>{row.line1}</Text>
                <Text style={styles.recordLine2}>{row.line2}</Text>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
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
  kpiTitle: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    letterSpacing: -0.3,
  },
  kpiValueSubdued: {
    ...adminType.sectionHead,
    color: adminColors.muted,
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
    ...adminType.body,
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
    fontWeight: '600',
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
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgeRed: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeGray: {
    backgroundColor: adminColors.canvas,
  },
  badgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextRed: {
    color: adminColors.danger.text,
  },
  badgeTextGray: {
    color: adminColors.muted,
  },
  recordLine1: {
    ...adminType.body,
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
