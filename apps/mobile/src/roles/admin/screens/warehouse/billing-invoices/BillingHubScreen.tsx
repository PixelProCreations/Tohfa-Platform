/**
 * Billing & Invoices hub: KPI tiles, quick actions, the "Invoice Required"
 * attention card and the most recent invoice.
 *
 * Scope (FINAL_LIST row 1): KPIs and the recent invoice are computed from the
 * rows visible in `scope` (Sub: own warehouse; Main: all, or the warehouse
 * picked in the all-warehouses selector, shown only when scope.warehouseId is
 * undefined).
 *
 * Gates:
 *   - Generate Invoice quick action and the Invoice Required card: invoice.generate.
 *   - Recent invoice View / Download: invoice.view_own.
 *
 * Absorbs the Main BillingInvoicesHubScreen (pair M9-S01). Its GST Invoice tile
 * is dropped with the GST restricted-notice screen (invoice.gst.generate is
 * none/none for both warehouse roles, SPEC_GAPS W4g); its View Invoices and
 * Invoice History tiles are the Invoice List and Invoice History actions here;
 * its Home | More bottom bar is the shared SWABottomNav. Its KPI set
 * (Today / Generated / Pending / Failed) is covered by the Sub tiles.
 */
// Design id: M9-S01
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { SWABottomNav } from '../../swa/components';
import {
  BillingButton,
  BillingScreen,
  HeaderIconButton,
  inScope,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  rupeesOf,
} from './BillingParts';
import { INITIAL_INVOICES, INVOICE_REQUIRED_TRANSACTION } from './fixtures';
import type { InvoiceRecord, WarehouseScope, WarehouseScreenBaseProps, WizardTransactionRecord } from './types';

export interface BillingHubScreenProps extends WarehouseScreenBaseProps {
  onNavigateToInvoiceList: () => void;
  onNavigateToInvoiceHistory: () => void;
  onNavigateToInvoiceDetail: (invoiceId: string) => void;
  /** Open the transaction picker, or the wizard directly for a known sale. */
  onGenerateInvoice: (transaction?: WizardTransactionRecord) => void;
  onNavigateToNotifications?: (() => void) | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Invoice rows; defaults to the mock set until the invoice API is wired. */
  invoices?: readonly InvoiceRecord[] | undefined;
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

const ICON = {
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  cash: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  pending: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM8 12h.01M12 12h.01M16 12h.01',
  cancelled: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6',
  plus: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v8M8 12h8',
  list: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h6m-6 4h6m-8-4h.01m-.01 4h.01',
  history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
} as const;

/** Display rupees with Indian grouping (mock KPI only; money is never computed on the client). */
function formatRupees(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function BillingHubScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onNavigateToInvoiceList,
  onNavigateToInvoiceHistory,
  onNavigateToInvoiceDetail,
  onGenerateInvoice,
  onNavigateToNotifications,
  warehouseOptions,
  invoices = INITIAL_INVOICES,
}: BillingHubScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const canGenerate = can('invoice.generate');
  const canView = can('invoice.view_own');

  const visible = useMemo(
    () => invoices.filter((inv) => inScope(scope, inv.warehouseId, selectedWarehouseId)),
    [invoices, scope, selectedWarehouseId],
  );
  const latestDate = visible[0]?.date;
  const kpis = [
    { key: 'today', label: "Today's Invoices", value: String(visible.filter((i) => i.date === latestDate).length), icon: ICON.calendar },
    {
      key: 'value',
      label: 'Invoice Value',
      value: formatRupees(visible.filter((i) => i.status === 'Generated').reduce((sum, i) => sum + rupeesOf(i.amount), 0)),
      icon: ICON.cash,
    },
    { key: 'pending', label: 'Pending', value: String(visible.filter((i) => i.status === 'Pending').length), icon: ICON.pending },
    {
      key: 'cancelled',
      label: 'Cancelled',
      value: String(visible.filter((i) => i.status === 'Cancelled').length),
      icon: ICON.cancelled,
      alert: true,
    },
  ];
  const recent = visible[0];
  const required = INVOICE_REQUIRED_TRANSACTION;
  const showRequired = canGenerate && inScope(scope, required.warehouseId, selectedWarehouseId);

  return (
    <BillingScreen
      title="Billing & Invoices"
      onBack={onBack}
      headerRight={
        onNavigateToNotifications ? (
          <HeaderIconButton onPress={onNavigateToNotifications} accessibilityLabel="Notifications">
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
      footer={onTabChange ? <SWABottomNav activeTab="More" onTabChange={onTabChange} /> : null}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiGrid}>
          {kpis.map((kpi) => (
            <View key={kpi.key} style={styles.kpiCard}>
              <TileIcon d={kpi.icon} color={kpi.alert ? adminColors.danger.text : adminColors.brand} />
              <Text style={[styles.kpiValue, kpi.alert && styles.kpiValueAlert]}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        <SectionTitle>Quick Actions</SectionTitle>
        <View style={styles.actionsRow}>
          {canGenerate ? (
            <TouchableOpacity style={styles.actionCard} onPress={() => onGenerateInvoice()} activeOpacity={0.7}>
              <TileIcon d={ICON.plus} />
              <Text style={styles.actionLabel}>Generate Invoice</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.actionCard} onPress={onNavigateToInvoiceList} activeOpacity={0.7}>
            <TileIcon d={ICON.list} />
            <Text style={styles.actionLabel}>Invoice List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={onNavigateToInvoiceHistory} activeOpacity={0.7}>
            <TileIcon d={ICON.history} />
            <Text style={styles.actionLabel}>Invoice History</Text>
          </TouchableOpacity>
        </View>

        {showRequired ? (
          <>
            <SectionTitle>Invoice Required</SectionTitle>
            <View style={styles.requiredCard}>
              <Text style={styles.requiredTag}>INVOICE REQUIRED</Text>
              <Text style={styles.requiredOrderId}>{required.orderNumber}</Text>
              <Text style={styles.requiredCustomer}>{required.customerName}</Text>
              <Text style={styles.requiredAmount}>{required.amount}</Text>
              <BillingButton label="Generate Invoice" onPress={() => onGenerateInvoice(required)} />
            </View>
          </>
        ) : null}

        <View style={styles.recentHeaderRow}>
          <SectionTitle>Recent Invoices</SectionTitle>
          <TouchableOpacity onPress={onNavigateToInvoiceList} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {recent ? (
          <View style={styles.recentCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.invoiceNumber}>{recent.id}</Text>
              <StatusBadge status={recent.status} />
            </View>
            <Text style={styles.invoiceSub}>
              {recent.customerName} · {recent.orderNumber}
            </Text>
            <View style={[styles.rowBetween, styles.recentBottom]}>
              <Text style={styles.invoiceDate}>
                {recent.date}, {recent.time}
              </Text>
              <Text style={styles.invoiceAmount}>{recent.amount}</Text>
            </View>
            {canView ? (
              <View style={styles.recentActions}>
                <BillingButton
                  label="View"
                  variant="tint"
                  compact
                  flex
                  onPress={() => onNavigateToInvoiceDetail(recent.id)}
                />
                <BillingButton
                  label="Download"
                  variant="tint"
                  compact
                  flex
                  onPress={() => onNavigateToInvoiceDetail(recent.id)}
                />
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.emptyText}>No invoices yet.</Text>
        )}
      </ScrollView>
    </BillingScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xl },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  kpiCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  kpiValue: { ...adminType.kpiValue, color: adminColors.ink },
  kpiValueAlert: { color: adminColors.danger.text },
  kpiLabel: { ...adminType.caption, color: adminColors.muted },

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
  actionLabel: { ...adminType.caption, color: adminColors.ink, textAlign: 'center' },

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
  emptyText: { ...adminType.body, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.lg },
});
