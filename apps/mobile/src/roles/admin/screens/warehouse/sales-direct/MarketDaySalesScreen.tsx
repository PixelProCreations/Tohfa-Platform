/**
 * Market day sales (design M6-S10): GET /admin/sales/market-day for today (the
 * server's Asia/Kolkata default). Shows the paid-and-completed MARKET totals
 * (BR-96), their split by payment method, the LIVE_MARKET allocation with sold
 * and remaining quantities, and the first page of the day's MARKET sales
 * (BR-95). The full list lives in Sales History.
 *
 * A warehouse that is not a market venue has no LIVE_MARKET allocation; that
 * renders as an honest empty note, never as sample rows.
 */
import React, { useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { SaleStatus } from '../../../api/sales';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminShadow, adminSpacing, adminType } from '../../../theme';
import { formatAdminDate, formatAdminDay } from '../../../utils/datetime';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { SALE_PAYMENT_METHODS, salesWarehouseFilter, type SaleListRow, type SalesMarketDayView } from './mappers';
import { WarehouseChips } from './SalesParts';
import { GRADE_KEY, PAYMENT_METHOD_KEY, SALE_STATUS_KEY } from './salesLabels';
import type { PermissionCheck, WarehouseScope, WarehouseTab } from './types';
import { useSalesMarketDay, useSalesWarehouseOptions } from './useSalesData';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockBadgeIcon({ size = 12, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ShoppingCartActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Path
        d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HistoryClockActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function statusTone(status: SaleStatus): { bg: string; text: string } {
  if (status === 'PICKED_UP') return adminColors.success;
  if (status === 'CANCELLED') return adminColors.danger;
  return adminColors.warning;
}

function buyerLabel(row: Pick<SaleListRow, 'buyer'>): string {
  if (row.buyer.kind === 'WALK_IN') {
    return row.buyer.name.trim() === '' ? t('sales.common.walkIn') : t('sales.history.walkInNamed', { name: row.buyer.name });
  }
  return row.buyer.name;
}

// ─── Component ───────────────────────────────────────────────────────────────

// Design id: M6-S10
export interface MarketDaySalesScreenProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  onNavigateToNewMarketSale: () => void;
  onNavigateToSalesHistory: () => void;
  onSelectSale: (saleId: string) => void;
}

export function MarketDaySalesScreen({
  scope,
  can,
  onBack,
  onNavigateToNewMarketSale,
  onNavigateToSalesHistory,
  onSelectSale,
}: MarketDaySalesScreenProps) {
  const canView = can('sales.market_day.view');
  const canCreateSale = can('sales.sale.create');
  const warehouses = useSalesWarehouseOptions(scope, can);
  // Main picks the market's warehouse (undefined = all in scope); a Sub admin is locked to its own.
  const [pickedWarehouse, setPickedWarehouse] = useState<string | undefined>(undefined);
  const { marketDay, isLoading, error, refresh, isRefreshing } = useSalesMarketDay(
    salesWarehouseFilter(scope, pickedWarehouse),
    undefined,
    { enabled: canView },
  );

  let body: React.ReactNode;
  if (!canView) {
    body = <AdminEmptyState title={t('sales.common.noPermission')} />;
  } else if (marketDay) {
    body = <MarketDayBody marketDay={marketDay} onSelectSale={onSelectSale} />;
  } else if (isLoading) {
    body = <AdminLoadingState />;
  } else {
    body = <AdminErrorState error={error} onRetry={refresh} />;
  }

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
          <Text style={styles.headerTitle}>{t('sales.marketDay.title')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          canView ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={adminColors.brand} />
          ) : undefined
        }
      >
        {scope.warehouseId !== undefined ? (
          scope.warehouseName ? (
            <View style={styles.warehousePill}>
              <LockBadgeIcon size={12} color={adminColors.warning.text} />
              <Text style={styles.warehousePillText}>{scope.warehouseName}</Text>
            </View>
          ) : null
        ) : (
          <WarehouseChips
            scope={scope}
            selected={pickedWarehouse}
            onSelect={setPickedWarehouse}
            options={warehouses.options}
          />
        )}

        {/* ─── Quick actions ─── */}
        <Text style={styles.sectionHeading}>{t('sales.marketDay.section.actions')}</Text>
        <View style={styles.quickActionsRow}>
          {canCreateSale ? (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateToNewMarketSale}
              activeOpacity={0.78}
              accessibilityRole="button"
            >
              <ShoppingCartActionIcon size={24} />
              <Text style={styles.actionCardLabel}>{t('sales.marketDay.newSale')}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToSalesHistory}
            activeOpacity={0.78}
            accessibilityRole="button"
          >
            <HistoryClockActionIcon size={24} />
            <Text style={styles.actionCardLabel}>{t('sales.marketDay.history')}</Text>
          </TouchableOpacity>
        </View>

        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

function MarketDayBody({
  marketDay,
  onSelectSale,
}: {
  marketDay: SalesMarketDayView;
  onSelectSale: (saleId: string) => void;
}) {
  const now = new Date();
  return (
    <>
      {/* ─── Day + totals ─── */}
      <View style={styles.marketDayCard}>
        <Text style={styles.marketDayTitle}>
          {t('sales.marketDay.dayLabel', { date: formatAdminDay(marketDay.date) })}
        </Text>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{formatPaise(marketDay.revenuePaise)}</Text>
          <Text style={styles.kpiLabel}>{t('sales.marketDay.kpi.revenue')}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{String(marketDay.count)}</Text>
          <Text style={styles.kpiLabel}>{t('sales.marketDay.kpi.count')}</Text>
        </View>
      </View>
      <Text style={styles.noteText}>{t('sales.marketDay.totalsNote')}</Text>

      {/* ─── By payment method ─── */}
      <Text style={styles.sectionHeading}>{t('sales.marketDay.section.byMethod')}</Text>
      <View style={styles.summaryCard}>
        {SALE_PAYMENT_METHODS.map((m, idx) => (
          <View key={m}>
            {idx > 0 ? <View style={styles.summaryDivider} /> : null}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t(PAYMENT_METHOD_KEY[m])}</Text>
              <Text style={styles.summaryValue}>
                {t('sales.marketDay.methodValue', {
                  amount: formatPaise(marketDay.byMethod[m].revenuePaise),
                  count: marketDay.byMethod[m].count,
                })}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* ─── LIVE_MARKET allocation ─── */}
      <Text style={styles.sectionHeading}>{t('sales.marketDay.section.allocation')}</Text>
      <View style={styles.card}>
        {marketDay.allocation.length === 0 ? (
          <Text style={styles.summaryLabel}>{t('sales.marketDay.alloc.empty')}</Text>
        ) : (
          <>
            <View style={styles.allocRow}>
              <Text style={[styles.allocHead, styles.allocNameCol]} />
              <Text style={[styles.allocHead, styles.allocQtyCol]}>{t('sales.marketDay.alloc.allocated')}</Text>
              <Text style={[styles.allocHead, styles.allocQtyCol]}>{t('sales.marketDay.alloc.sold')}</Text>
              <Text style={[styles.allocHead, styles.allocQtyCol]}>{t('sales.marketDay.alloc.remaining')}</Text>
            </View>
            {marketDay.allocation.map((a) => (
              <View key={`${a.productId}:${a.grade}`}>
                <View style={styles.summaryDivider} />
                <View style={styles.allocRow}>
                  <View style={styles.allocNameCol}>
                    <Text style={styles.productQty}>{a.name}</Text>
                    <Text style={styles.productName}>{t(GRADE_KEY[a.grade])}</Text>
                  </View>
                  <Text style={[styles.allocCell, styles.allocQtyCol]}>{formatKg(a.allocatedGrams)}</Text>
                  <Text style={[styles.allocCell, styles.allocQtyCol]}>{formatKg(a.soldGrams)}</Text>
                  <Text style={[styles.allocCell, styles.allocQtyCol]}>{formatKg(a.remainingGrams)}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      {/* ─── The day's MARKET sales ─── */}
      <Text style={styles.sectionHeading}>{t('sales.marketDay.section.sales')}</Text>
      {marketDay.items.length === 0 ? (
        <Text style={styles.summaryLabel}>{t('sales.marketDay.sales.empty')}</Text>
      ) : (
        marketDay.items.map((row) => {
          const tone = statusTone(row.status);
          return (
            <TouchableOpacity
              key={row.id}
              style={styles.txCard}
              onPress={() => onSelectSale(row.id)}
              activeOpacity={0.82}
              accessibilityRole="button"
            >
              <View style={styles.txCardTop}>
                <Text style={styles.txSaleId}>{row.saleNumber}</Text>
                <View style={[styles.txPill, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.txPillText, { color: tone.text }]}>{t(SALE_STATUS_KEY[row.status])}</Text>
                </View>
              </View>
              <Text style={styles.txSubtitle}>
                {buyerLabel(row)} · {t('sales.common.itemCount', { count: row.itemCount })} ·{' '}
                {t(PAYMENT_METHOD_KEY[row.paymentMethod])}
              </Text>
              <View style={styles.txCardBottom}>
                <Text style={styles.txSubtitle}>{formatAdminDate(row.createdAt, now)}</Text>
                <Text style={styles.txAmount}>{formatPaise(row.totalPaise)}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.warning.text,
  },
  marketDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  marketDayTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 10,
  },
  noteText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginBottom: 4,
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  actionCardLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    ...adminShadow.sm,
  },
  allocRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allocNameCol: {
    flex: 1.4,
    paddingRight: adminSpacing.xs,
  },
  allocQtyCol: {
    flex: 1,
    textAlign: 'right',
  },
  allocHead: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  allocCell: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  productName: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  productQty: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  txCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  txCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txSaleId: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  txPill: {
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  txPillText: {
    ...adminType.caption,
  },
  txCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  txSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 4,
  },
  txAmount: {
    ...adminType.title,
    color: adminColors.ink,
  },
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    ...adminShadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  summaryValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 10,
  },
});
