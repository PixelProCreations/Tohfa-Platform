/**
 * Sales hub (design M6-S01 / M6-01). Everything on it is live:
 *
 *   - Today's KPIs and the payment-method split: GET /admin/sales/summary with
 *     no from / to (server default = today). Only paid-and-completed sales are
 *     counted there (BR-96), so a pending UPI sale is not revenue yet.
 *   - Needs attention: the same summary's needsAttention counters; each row
 *     opens the shared Needs Attention queue on that category.
 *   - Recent sales: the first page of GET /admin/sales.
 *   - HORECA / B2B have no summary endpoint, so they are plain navigation tiles
 *     rather than numbers we would have to make up.
 *
 * A Main (all-warehouses) viewer picks a real warehouse uuid from
 * GET /warehouses; a Sub viewer is locked to scope.warehouseId (BR-30). Every
 * control is gated on the rbac.json code the server enforces anyway; hiding is
 * presentation only (root CLAUDE.md 2.1).
 */
import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { SalePaymentStatus } from '../../../api/sales';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { SALE_PAYMENT_METHODS, salesWarehouseFilter, type SaleListRow } from './mappers';
import { PAYMENT_METHOD_KEY, PAYMENT_STATUS_KEY, SALE_CHANNEL_KEY } from './salesLabels';
import { WarehouseChips, isAllWarehouses } from './SalesParts';
import type { WarehouseScreenBaseProps } from './types';
import { useSalesList, useSalesSummary, useSalesWarehouseOptions } from './useSalesData';

const RECENT_SALES_LIMIT = 5;

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CashRegisterHeaderIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M7 3h10v4H7zM3 11h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9zM7 15h2M11 15h2M15 15h2M7 18h10"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GridSquareIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

function LockBadgeIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={adminColors.onBrand} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function BellHeaderIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoneyCardIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StorefrontCardIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8a2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0V4H3v4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 10.2V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9.8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarActionIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExclamationCircleCardIcon({ color = adminColors.danger.text }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ShoppingCartActionIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="20" r="1.5" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="20" r="1.5" stroke={color} strokeWidth="2" />
      <Path
        d="M2 4h3l2.2 10.5a1.8 1.8 0 0 0 1.8 1.5h8.5a1.8 1.8 0 0 0 1.8-1.5L21 8H6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13 2v4M11 4h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StoreActionIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9a2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0V5H3v4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 11.2V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 5V3M12 5V3M17 5V3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryClockActionIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CutleryActionIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 4v6a2.8 2.8 0 0 0 2.8 2.8v7.2M8.3 4v6M11.1 4v6a2.8 2.8 0 0 1-2.8 2.8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M18.5 4v16M18.5 4c-3 0-5 2.5-5 6v4h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BuildingActionIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 21V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 14 5v16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 10h5a1.5 1.5 0 0 1 1.5 1.5V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 8h3M7 12h3M7 16h3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M17 14h1M17 17h1" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StockBoxIcon({ color = adminColors.danger.text }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8l3-5h12l3 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InvoiceDocumentIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ color = adminColors.muted }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type AttentionCategory = 'all' | 'payment_pending' | 'stock_issue' | 'failed_sale' | 'invoice_issue';

type Tone = 'success' | 'warning' | 'danger' | 'info';

const PAYMENT_STATUS_TONE: Record<SalePaymentStatus, Tone> = {
  PAID: 'success',
  PENDING: 'warning',
  PARTIALLY_PAID: 'warning',
  FAILED: 'danger',
  REFUNDED: 'info',
};

function buyerLabel(row: SaleListRow): string {
  const name = row.buyer.name.trim();
  if (row.buyer.kind === 'WALK_IN') return name === '' ? t('sales.common.walkIn') : `${name} · ${t('sales.common.walkIn')}`;
  return name;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

// Design id: M6-S01 & M6-01 Sales Dashboard
export interface SalesScreenProps extends WarehouseScreenBaseProps {
  onNavigateToNotifications?: (() => void) | undefined;
  onNavigateToNewSale: (channel?: 'DIRECT' | 'MARKET') => void;
  onNavigateToSalesHistory: () => void;
  onNavigateToMarketDaySales: () => void;
  onNavigateToChannelSales: (channel: 'HORECA' | 'B2B') => void;
  /** Needs Attention is the shared dashboard-home-more queue (HomeFlow); the host opens it. Card hidden without it. */
  onNavigateToNeedsAttention?: ((category?: AttentionCategory) => void) | undefined;
  onSelectSale: (saleId: string) => void;
}

export function SalesScreen({
  scope,
  can,
  onBack,
  onNavigateToNotifications,
  onNavigateToNewSale,
  onNavigateToSalesHistory,
  onNavigateToMarketDaySales,
  onNavigateToChannelSales,
  onNavigateToNeedsAttention,
  onSelectSale,
}: SalesScreenProps) {
  const isMain = isAllWarehouses(scope);
  // Main only: the warehouse uuid the hub is for (undefined = all warehouses).
  const [pickedWarehouse, setPickedWarehouse] = useState<string | undefined>(undefined);
  const warehouses = useSalesWarehouseOptions(scope, can);
  const warehouseFilter = salesWarehouseFilter(scope, pickedWarehouse);

  const canDashboard = can('sales.dashboard.view');
  const canHistory = can('sales.history.view');
  const canCreate = can('sales.sale.create');
  const canMarketDay = can('sales.market_day.view');
  const canHoreca = can('sales.horeca.view');
  const canB2b = can('sales.b2b.view');

  const summaryQuery = useSalesSummary(warehouseFilter, {}, { enabled: canDashboard });
  const summary = summaryQuery.summary;
  const recent = useSalesList(warehouseFilter, {}, { enabled: canHistory });
  const recentRows = useMemo(() => recent.items.slice(0, RECENT_SALES_LIMIT), [recent.items]);
  const recentState = queryViewState({ isLoading: recent.isLoading, error: recent.error, itemCount: recentRows.length });
  const now = new Date();

  const summaryState = summary
    ? 'ready'
    : summaryQuery.isLoading
      ? 'loading'
      : summaryQuery.error !== null && summaryQuery.error !== undefined
        ? 'error'
        : 'loading';

  const actions: { key: string; label: string; icon: React.ReactNode; onPress: () => void }[] = [];
  if (canCreate) {
    actions.push({
      key: 'new',
      label: t('sales.hub.action.newSale'),
      icon: <ShoppingCartActionIcon />,
      onPress: () => onNavigateToNewSale('DIRECT'),
    });
  }
  if (canMarketDay) {
    actions.push({ key: 'market', label: t('sales.hub.action.marketDay'), icon: <StoreActionIcon />, onPress: onNavigateToMarketDaySales });
  }
  if (canHistory) {
    actions.push({ key: 'history', label: t('sales.hub.action.history'), icon: <HistoryClockActionIcon />, onPress: onNavigateToSalesHistory });
  }
  if (canHoreca) {
    actions.push({
      key: 'horeca',
      label: t('sales.hub.action.horeca'),
      icon: <CutleryActionIcon />,
      onPress: () => onNavigateToChannelSales('HORECA'),
    });
  }
  if (canB2b) {
    actions.push({
      key: 'b2b',
      label: t('sales.hub.action.b2b'),
      icon: <BuildingActionIcon />,
      onPress: () => onNavigateToChannelSales('B2B'),
    });
  }

  const attentionRows: {
    category: Exclude<AttentionCategory, 'all'>;
    title: string;
    sub: string;
    count: number;
    tone: 'warning' | 'danger';
    icon: React.ReactNode;
  }[] = summary
    ? [
        {
          category: 'payment_pending',
          title: t('sales.hub.attention.paymentPending'),
          sub: t('sales.hub.attention.paymentPendingSub', { count: summary.needsAttention.paymentPending }),
          count: summary.needsAttention.paymentPending,
          tone: 'warning',
          icon: <MoneyCardIcon color={adminColors.warning.text} />,
        },
        {
          category: 'stock_issue',
          title: t('sales.hub.attention.stockIssue'),
          sub: t('sales.hub.attention.stockIssueSub', { count: summary.needsAttention.stockIssues }),
          count: summary.needsAttention.stockIssues,
          tone: 'danger',
          icon: <StockBoxIcon color={adminColors.danger.text} />,
        },
        {
          category: 'failed_sale',
          title: t('sales.hub.attention.failedSale'),
          sub: t('sales.hub.attention.failedSaleSub', { count: summary.needsAttention.failedSales }),
          count: summary.needsAttention.failedSales,
          tone: 'danger',
          icon: <ExclamationCircleCardIcon color={adminColors.danger.text} />,
        },
        {
          category: 'invoice_issue',
          title: t('sales.hub.attention.invoiceIssue'),
          sub: t('sales.hub.attention.invoiceIssueSub', { count: summary.needsAttention.invoiceIssues }),
          count: summary.needsAttention.invoiceIssues,
          tone: 'warning',
          icon: <InvoiceDocumentIcon color={adminColors.warning.text} />,
        },
      ]
    : [];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={onBack}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('sales.common.back')}
            >
              <ArrowBackIcon />
            </TouchableOpacity>
            {isMain ? <GridSquareIcon /> : <CashRegisterHeaderIcon />}
            <Text style={styles.headerTitleText} accessibilityRole="header">
              {t('sales.hub.title')}
            </Text>
          </View>

          {onNavigateToNotifications ? (
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={onNavigateToNotifications}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('sales.hub.notifications')}
            >
              <BellHeaderIcon />
            </TouchableOpacity>
          ) : null}
        </View>

        {!isMain && scope.warehouseName ? (
          <View style={styles.warehouseBadge}>
            <LockBadgeIcon />
            <Text style={styles.warehouseBadgeText}>{scope.warehouseName}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Main: real warehouse picker ─── */}
        {isMain ? (
          <>
            <WarehouseChips
              scope={scope}
              selected={pickedWarehouse}
              onSelect={setPickedWarehouse}
              options={warehouses.options}
            />
            {warehouses.error ? (
              <View style={styles.inlineErrorRow}>
                <Text style={styles.inlineErrorText}>{t('sales.hub.warehousesError')}</Text>
                <TouchableOpacity onPress={warehouses.refresh} activeOpacity={0.7} accessibilityRole="button">
                  <Text style={styles.sectionLink}>{t('sales.hub.warehousesRetry')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        ) : null}

        {/* ─── Today's sales (BR-96: paid + completed only) ─── */}
        <Text style={styles.sectionTitle}>{t('sales.hub.todayHeading')}</Text>
        {!canDashboard ? (
          <Text style={styles.noteText}>{t('sales.common.noPermission')}</Text>
        ) : summaryState === 'loading' ? (
          <AdminLoadingState />
        ) : summaryState === 'error' || !summary ? (
          <AdminErrorState error={summaryQuery.error} onRetry={summaryQuery.refresh} />
        ) : (
          <>
            <Text style={styles.noteText}>{t('sales.hub.todayNote')}</Text>
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, styles.kpiCardWide]}>
                <View style={styles.cardIconWrap}>
                  <MoneyCardIcon />
                </View>
                <Text style={styles.kpiLabel}>{t('sales.hub.kpi.total')}</Text>
                <Text style={styles.kpiValue}>{formatPaise(summary.revenuePaise)}</Text>
                <Text style={styles.kpiSub}>{t('sales.hub.kpi.txnCount', { count: summary.count })}</Text>
              </View>
              <View style={styles.kpiCard}>
                <View style={styles.cardIconWrap}>
                  <StorefrontCardIcon />
                </View>
                <Text style={styles.kpiLabel}>{t(SALE_CHANNEL_KEY.DIRECT)}</Text>
                <Text style={styles.kpiValue}>{formatPaise(summary.byChannel.DIRECT.revenuePaise)}</Text>
                <Text style={styles.kpiSub}>{t('sales.hub.kpi.saleCount', { count: summary.byChannel.DIRECT.count })}</Text>
              </View>
              <View style={styles.kpiCard}>
                <View style={styles.cardIconWrap}>
                  <CalendarActionIcon />
                </View>
                <Text style={styles.kpiLabel}>{t(SALE_CHANNEL_KEY.MARKET)}</Text>
                <Text style={styles.kpiValue}>{formatPaise(summary.byChannel.MARKET.revenuePaise)}</Text>
                <Text style={styles.kpiSub}>{t('sales.hub.kpi.saleCount', { count: summary.byChannel.MARKET.count })}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('sales.hub.byMethodHeading')}</Text>
            <View style={styles.summaryCard}>
              {SALE_PAYMENT_METHODS.map((method) => (
                <View key={method}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t(PAYMENT_METHOD_KEY[method])}</Text>
                    <View style={styles.summaryRight}>
                      <Text style={styles.summaryValue}>{formatPaise(summary.byMethod[method].revenuePaise)}</Text>
                      <Text style={styles.summaryCount}>
                        {t('sales.hub.kpi.saleCount', { count: summary.byMethod[method].count })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('sales.hub.total')}</Text>
                <Text style={styles.totalValue}>{formatPaise(summary.revenuePaise)}</Text>
              </View>
            </View>

            {/* ─── Needs attention (shared queue opened by the host) ─── */}
            {onNavigateToNeedsAttention ? (
              <>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderLeft}>
                    <WarningTriangleIcon color={adminColors.ink} />
                    <Text style={styles.sectionTitleInline}>{t('sales.hub.attention.heading')}</Text>
                    {summary.needsAttentionTotal > 0 ? (
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{summary.needsAttentionTotal}</Text>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => onNavigateToNeedsAttention('all')}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <Text style={styles.sectionLink}>{t('sales.hub.attention.viewAll')}</Text>
                  </TouchableOpacity>
                </View>
                {summary.needsAttentionTotal === 0 ? (
                  <Text style={styles.noteText}>{t('sales.hub.attention.none')}</Text>
                ) : (
                  <View style={styles.alertsContainer}>
                    {attentionRows
                      .filter((row) => row.count > 0)
                      .map((row) => (
                        <TouchableOpacity
                          key={row.category}
                          style={styles.alertCardItem}
                          onPress={() => onNavigateToNeedsAttention(row.category)}
                          activeOpacity={0.75}
                          accessibilityRole="button"
                        >
                          <View
                            style={[
                              styles.alertAccentBar,
                              { backgroundColor: row.tone === 'danger' ? adminColors.danger.text : adminColors.warning.text },
                            ]}
                          />
                          <View style={styles.alertIconBox}>{row.icon}</View>
                          <View style={styles.alertTextBox}>
                            <Text style={styles.alertTitle}>{row.title}</Text>
                            <Text style={styles.alertSub}>{row.sub}</Text>
                          </View>
                          <ChevronRightIcon />
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
              </>
            ) : null}
          </>
        )}

        {/* ─── Quick actions (each one gated on its rbac code) ─── */}
        {actions.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{t('sales.hub.actionsHeading')}</Text>
            <View style={styles.actionsGrid}>
              {actions.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={styles.actionBtn}
                  onPress={a.onPress}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                >
                  {a.icon}
                  <Text style={styles.actionBtnLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {/* ─── Recent sales (first page of GET /admin/sales) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitleInline}>{t('sales.hub.recentHeading')}</Text>
          {canHistory ? (
            <TouchableOpacity onPress={onNavigateToSalesHistory} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.sectionLink}>{t('sales.hub.recentViewAll')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {!canHistory ? (
          <Text style={styles.noteText}>{t('sales.common.noPermission')}</Text>
        ) : recentState === 'loading' ? (
          <AdminLoadingState />
        ) : recentState === 'error' ? (
          <AdminErrorState error={recent.error} onRetry={recent.refresh} />
        ) : recentState === 'empty' ? (
          <AdminEmptyState title={t('sales.hub.recentEmpty')} subtitle={t('sales.hub.recentEmptySub')} />
        ) : (
          recentRows.map((row) => {
            const tone = PAYMENT_STATUS_TONE[row.paymentStatus];
            const items = t('sales.common.itemCount', { count: row.itemCount });
            const channel = t(SALE_CHANNEL_KEY[row.channel]);
            const warehouseName = isMain && pickedWarehouse === undefined ? warehouses.nameOf(row.warehouseId) : undefined;
            return (
              <TouchableOpacity
                key={row.id}
                style={styles.recentSaleCard}
                onPress={() => onSelectSale(row.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <View style={styles.recentSaleTopRow}>
                  <Text style={styles.recentSaleId}>{row.saleNumber}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: adminColors[tone].bg }]}>
                    <Text style={[styles.statusBadgeText, { color: adminColors[tone].text }]}>
                      {t(PAYMENT_STATUS_KEY[row.paymentStatus])}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recentSaleCustomer}>{buyerLabel(row)}</Text>
                <View style={styles.recentSaleBottomRow}>
                  <Text style={styles.recentSaleType}>
                    {warehouseName
                      ? t('sales.hub.saleMetaWarehouse', { channel, items, warehouse: warehouseName })
                      : t('sales.hub.saleMeta', { channel, items })}
                  </Text>
                  <View style={styles.recentSaleRight}>
                    <Text style={styles.recentSaleTime}>{formatAdminDate(row.completedAt ?? row.createdAt, now)}</Text>
                    <Text style={styles.recentSaleAmount}>{formatPaise(row.totalPaise)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.bottomSpacer} />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandDeep,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: adminRadius.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehouseBadgeText: {
    ...adminType.caption,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  inlineErrorText: {
    ...adminType.rowMeta,
    color: adminColors.danger.text,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 8,
    marginTop: 10,
  },
  sectionTitleInline: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLink: {
    ...adminType.caption,
    color: adminColors.brandDeep,
  },
  noteText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    minHeight: 96,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiCardWide: {
    width: '100%',
  },
  cardIconWrap: {
    marginBottom: 8,
  },
  kpiLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginBottom: 3,
  },
  kpiSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    ...adminShadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  summaryLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  summaryCount: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  totalLabel: {
    ...adminType.title,
    color: adminColors.ink,
  },
  totalValue: {
    ...adminType.title,
    color: adminColors.ink,
  },
  countBadge: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  countBadgeText: {
    ...adminType.caption,
    color: adminColors.danger.text,
  },
  alertsContainer: {
    gap: 10,
  },
  alertCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 20,
    position: 'relative',
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  alertAccentBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: 2,
  },
  alertIconBox: {
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTextBox: {
    flex: 1,
  },
  alertTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 2,
  },
  alertSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionBtn: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    ...adminShadow.sm,
  },
  actionBtnLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: 8,
  },
  recentSaleCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  recentSaleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recentSaleId: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  statusBadgeText: {
    ...adminType.caption,
  },
  recentSaleCustomer: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 10,
  },
  recentSaleBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  recentSaleType: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    flexShrink: 1,
  },
  recentSaleRight: {
    alignItems: 'flex-end',
  },
  recentSaleTime: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  recentSaleAmount: {
    ...adminType.title,
    color: adminColors.ink,
  },
  bottomSpacer: {
    height: 28,
  },
});
