/**
 * Billing & Invoices hub: quick actions and the most recent invoice, on
 * GET /invoices (plan phase 7).
 *
 * Scope is the server's (BR-36, BR-30): a Sub admin sees the invoices of
 * orders placed at its own warehouse, the Main admin every invoice. The most
 * recent invoice is the first row of the live list (newest first); View opens
 * the detail and Download the signed PDF link. Gates: View / Download need
 * invoice.view_own.
 *
 * Every designed element is drawn. A figure the API cannot supply renders the
 * dash, never disappears:
 *   - KPI tiles (Today's Invoices / Generated / Pending / Failed): the server's
 *     GET /invoices/summary (kpis); "Failed" has no source (no such
 *     InvoiceStatus), so it is the dash.
 *   - Generate Invoice (quick action, Main tile) and the "Invoice Required"
 *     card: there is no create-invoice route, so they open onGenerateInvoice
 *     when a host passes one, and are drawn disabled (dimmed, not tappable)
 *     when it does not, never a tappable control that does nothing; the card's order, customer and amount have no
 *     source and are the dash.
 *   - The customer name and order number on the recent card: the invoice row
 *     carries neither, so both are the dash.
 *   - The Main all-warehouses selector: drawn from GET /warehouses; the invoice
 *     API cannot filter by warehouse, so choosing one does not narrow the list.
 *
 * Absorbs the Main BillingInvoicesHubScreen (pair M9-S01): its View Invoices,
 * Invoice History and GST Invoice tiles open the list and the history here.
 * The GST tile (M9-05) lists the existing B2B invoices: the history layout on
 * its B2B chip, GET /invoices?type=SALE_B2B (BR-15: GST is B2B / Horeca
 * only). It offers no generation and no "generation restricted" notice:
 * invoice.gst.generate is none/none for both warehouse roles (SPEC_GAPS W4g),
 * and restoring the notice needs owner sign-off.
 */
// Design id: M9-S01
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { OverviewDashboardCard } from '../../../components';
import { SWABottomNav } from '../../swa/components';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  ActionError,
  BillingButton,
  BillingScreen,
  HeaderIconButton,
  isAllWarehouses,
  ScopeHeader,
  SectionTitle,
  ToneBadge,
} from './BillingParts';
import type { InvoiceKpiView, InvoiceRow, WarehouseScope, WarehouseScreenBaseProps } from './types';

export interface BillingHubScreenProps extends WarehouseScreenBaseProps {
  onNavigateToInvoiceList: () => void;
  onNavigateToInvoiceHistory: () => void;
  /** Main GST Invoice tile: the B2B invoices (GST_INVOICE_LIST_PARAMS). */
  onNavigateToGstInvoices: () => void;
  onNavigateToInvoiceDetail: (invoiceId: string) => void;
  /** Generate Invoice (quick action and the Invoice Required card). No create-invoice route exists, so a host that has none omits this. */
  onGenerateInvoice?: (() => void) | undefined;
  /** The four KPI tiles from GET /invoices/summary; absent = every tile is the dash. */
  kpis?: InvoiceKpiView | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  /** Warehouses for the Main selector; omitted = the live GET /warehouses list. */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** The newest invoice (first row of GET /invoices); undefined while loading or when there is none. */
  recent?: InvoiceRow | undefined;
  recentLoading?: boolean | undefined;
  recentError?: unknown;
  onRetryRecent?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  /** Opens the invoice PDF (signed link). */
  onDownload?: ((invoiceId: string) => void) | undefined;
  isDownloading?: boolean | undefined;
  downloadError?: unknown;
}

function BellIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TileIcon({ d, color = adminColors.brand }: { d: string; color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GenerateInvoiceIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M12 18v-6M9 15h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ViewInvoicesIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InvoiceHistoryIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5M12 7v5l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GstInvoiceIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M9 15l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const ICON = {
  plus: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v8M8 12h8',
  list: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h6m-6 4h6m-8-4h.01m-.01 4h.01',
  history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
} as const;

export function BillingHubScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onNavigateToInvoiceList,
  onNavigateToInvoiceHistory,
  onNavigateToGstInvoices,
  onNavigateToInvoiceDetail,
  onGenerateInvoice,
  kpis,
  onNavigateToNotifications,
  warehouseOptions: warehouseOptionsProp,
  recent,
  recentLoading = false,
  recentError,
  onRetryRecent,
  onRefresh,
  isRefreshing = false,
  onDownload,
  isDownloading = false,
  downloadError,
}: BillingHubScreenProps) {
  const canView = can('invoice.view_own');
  const canGenerate = can('invoice.generate');
  // Generate Invoice is excluded from the app (availability.ts EXCLUDED_BILLING_ROUTES), so a
  // host passes no handler: the tile stays drawn but reads as unavailable and cannot be tapped.
  const generateAvailable = onGenerateInvoice !== undefined;
  const allWarehouses = isAllWarehouses(scope);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const live = useWarehouseOptions({
    enabled: allWarehouses && can('warehouse.all.view') && warehouseOptionsProp === undefined,
  });
  const warehouseOptions: readonly WarehouseScope[] =
    warehouseOptionsProp ??
    live.options.map((o) => ({ warehouseId: o.warehouseId, warehouseName: o.warehouseName, warehouseCode: o.warehouseCode }));
  const dash = t('billing.noValue');
  const kpiToday = kpis?.today ?? dash;
  const kpiGenerated = kpis?.generated ?? dash;
  const kpiPending = kpis?.pending ?? dash;
  const kpiFailed = kpis?.failed ?? dash;
  const kpiCards = (
    <>
      <OverviewDashboardCard value={kpiToday} title={t('billing.hub.kpi.today')} subtitle={t('billing.hub.kpi.todaySub')} icon="orders" />
      <OverviewDashboardCard value={kpiGenerated} title={t('billing.hub.kpi.generated')} subtitle={t('billing.hub.kpi.generatedSub')} icon="pickup" />
      <OverviewDashboardCard value={kpiPending} title={t('billing.hub.kpi.pending')} subtitle={t('billing.hub.kpi.pendingSub')} icon="orders" tone="warning" />
      <OverviewDashboardCard value={kpiFailed} title={t('billing.hub.kpi.failed')} subtitle={t('billing.hub.kpi.failedSub')} icon="alert" tone="danger" />
    </>
  );
  const recentView = queryViewState({ isLoading: recentLoading, error: recentError, itemCount: recent === undefined ? 0 : 1 });

  const recentCard =
    recentView === 'loading' ? (
      <AdminLoadingState />
    ) : recentView === 'error' ? (
      <AdminErrorState error={recentError} onRetry={onRetryRecent} />
    ) : recent === undefined ? (
      <AdminEmptyState title={t('billing.empty.invoices')} />
    ) : (
      <View style={styles.recentCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.invoiceNumber}>{recent.invoiceNumber}</Text>
          <ToneBadge label={recent.statusLabel} tone={recent.tone} />
        </View>
        <Text style={styles.invoiceSub}>
          {dash} · {dash}
        </Text>
        <Text style={styles.invoiceSub}>{recent.typeLabel}</Text>
        <View style={[styles.rowBetween, styles.recentBottom]}>
          <Text style={styles.invoiceDate}>{recent.issueDateLabel}</Text>
          <Text style={styles.invoiceAmount}>{recent.amountLabel}</Text>
        </View>
        {canView ? (
          <View style={styles.recentActions}>
            <BillingButton
              label={t('billing.action.view')}
              variant="tint"
              compact
              flex
              onPress={() => onNavigateToInvoiceDetail(recent.id)}
            />
            {onDownload ? (
              <BillingButton
                label={t(isDownloading ? 'billing.action.downloading' : 'billing.action.download')}
                variant="tint"
                compact
                flex
                disabled={isDownloading}
                onPress={() => onDownload(recent.id)}
              />
            ) : null}
          </View>
        ) : null}
        {downloadError !== undefined && downloadError !== null ? (
          <View style={styles.errorWrap}>
            <ActionError error={downloadError} />
          </View>
        ) : null}
      </View>
    );

  return (
    <BillingScreen
      title={t('billing.hub.title')}
      onBack={onBack}
      headerRight={
        onNavigateToNotifications ? (
          <HeaderIconButton onPress={onNavigateToNotifications} accessibilityLabel={t('billing.hub.notifications')}>
            <BellIcon />
          </HeaderIconButton>
        ) : null
      }
      headerExtra={
        <ScopeHeader
          scope={scope}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      }
      footer={!allWarehouses && onTabChange ? <SWABottomNav activeTab="More" onTabChange={onTabChange} /> : null}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={adminColors.brand} colors={[adminColors.brand]} />
          ) : undefined
        }
      >
        {allWarehouses ? (
          <>
            <View style={styles.mainKpiGrid}>{kpiCards}</View>
            <Text style={styles.mainSectionTitle}>{t('billing.hub.quickActions')}</Text>
            <View style={styles.mainActionGrid}>
              <TouchableOpacity
                style={[styles.mainActionCard, !generateAvailable && styles.actionUnavailable]}
                onPress={onGenerateInvoice}
                disabled={!generateAvailable}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ disabled: !generateAvailable }}
              >
                <View style={styles.mainActionIconWrap}>
                  <GenerateInvoiceIcon size={26} />
                </View>
                <Text style={styles.mainActionLabel}>{t('billing.hub.generateInvoice')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mainActionCard} onPress={onNavigateToInvoiceList} activeOpacity={0.7}>
                <View style={styles.mainActionIconWrap}>
                  <ViewInvoicesIcon size={26} />
                </View>
                <Text style={styles.mainActionLabel}>{t('billing.hub.viewInvoices')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mainActionCard} onPress={onNavigateToInvoiceHistory} activeOpacity={0.7}>
                <View style={styles.mainActionIconWrap}>
                  <InvoiceHistoryIcon size={26} />
                </View>
                <Text style={styles.mainActionLabel}>{t('billing.hub.invoiceHistory')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mainActionCard} onPress={onNavigateToGstInvoices} activeOpacity={0.7}>
                <View style={styles.mainActionIconWrap}>
                  <GstInvoiceIcon size={26} />
                </View>
                <Text style={styles.mainActionLabel}>{t('billing.hub.gstInvoice')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.kpiGrid}>{kpiCards}</View>
            <SectionTitle>{t('billing.hub.quickActions')}</SectionTitle>
            <View style={styles.actionsRow}>
              {canGenerate ? (
                <TouchableOpacity
                  style={[styles.actionCard, !generateAvailable && styles.actionUnavailable]}
                  onPress={onGenerateInvoice}
                  disabled={!generateAvailable}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !generateAvailable }}
                >
                  <TileIcon d={ICON.plus} />
                  <Text style={styles.actionLabel}>{t('billing.hub.generateInvoice')}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.actionCard} onPress={onNavigateToInvoiceList} activeOpacity={0.7}>
                <TileIcon d={ICON.list} />
                <Text style={styles.actionLabel}>{t('billing.hub.invoiceList')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={onNavigateToInvoiceHistory} activeOpacity={0.7}>
                <TileIcon d={ICON.history} />
                <Text style={styles.actionLabel}>{t('billing.hub.invoiceHistory')}</Text>
              </TouchableOpacity>
            </View>
            {canGenerate ? (
              <>
                <SectionTitle>{t('billing.hub.invoiceRequired')}</SectionTitle>
                <View style={styles.requiredCard}>
                  <Text style={styles.requiredTag}>{t('billing.hub.invoiceRequiredTag')}</Text>
                  <Text style={styles.requiredOrderId}>{dash}</Text>
                  <Text style={styles.requiredCustomer}>{dash}</Text>
                  <Text style={styles.requiredAmount}>{dash}</Text>
                  <BillingButton
                    label={t('billing.hub.generateInvoice')}
                    onPress={() => onGenerateInvoice?.()}
                    disabled={!generateAvailable}
                  />
                </View>
              </>
            ) : null}
          </>
        )}

        <View style={styles.recentHeaderRow}>
          <SectionTitle>{t('billing.hub.recentInvoices')}</SectionTitle>
          <TouchableOpacity onPress={onNavigateToInvoiceList} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>{t('billing.hub.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        {recentCard}
      </ScrollView>
    </BillingScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xl },

  actionsRow: { flexDirection: 'row', gap: adminSpacing.sm },
  actionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.sm,
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  actionUnavailable: { opacity: 0.5 },
  actionLabel: { ...adminType.caption, color: adminColors.ink, textAlign: 'center' },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  requiredCard: {
    backgroundColor: adminColors.brandSoft.bg,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    padding: adminSpacing.lg,
  },
  requiredTag: { ...adminType.caption, color: adminColors.brand, marginBottom: adminSpacing.xs },
  requiredOrderId: { ...adminType.sectionHead, color: adminColors.ink },
  requiredCustomer: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  requiredAmount: { ...adminType.kpiValue, color: adminColors.ink, marginTop: adminSpacing.sm, marginBottom: adminSpacing.md },
  mainKpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: adminSpacing.input },

  recentHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewAllText: { ...adminType.rowTitle, color: adminColors.brand },
  recentCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  invoiceNumber: { ...adminType.sectionHead, color: adminColors.ink },
  invoiceSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  recentBottom: { marginTop: adminSpacing.sm },
  invoiceDate: { ...adminType.rowMeta, color: adminColors.muted },
  invoiceAmount: { ...adminType.sectionHead, color: adminColors.ink },
  recentActions: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.md },
  errorWrap: { marginTop: adminSpacing.sm },

  // Main Warehouse hub tiles (kept from the Main design, on admin tokens)
  mainSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  mainActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.input,
  },
  mainActionCard: {
    // Two tiles per row with the grid gap between them.
    width: '48.4%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainActionIconWrap: {
    marginBottom: adminSpacing.sm,
    height: adminSpacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainActionLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    textAlign: 'center',
  },
});
