/**
 * The two Receiving Dashboard sub-views of design M2-01, each a route of its
 * own so hardware back returns to the dashboard:
 *
 *   ReceivingActivityScreen  "Receiving Activity": the warehouse's goods
 *                            receipts, newest received first.
 *   PendingQueueScreen       "Pending Queue": the purchase orders still to
 *                            finish, grouped Awaiting QC / Partly Received /
 *                            Not Yet Received (receivingViews.ts pendingQueueOf).
 *
 * Both read the same two walked lists as the dashboard (ReceivingFlow passes
 * them; the query keys are the dashboard's, so nothing is fetched twice) for
 * the warehouse the dashboard picked. There is no "Arrived" group and no
 * stage-by-stage pipeline: a purchase order has no arrival step (owner
 * decision) and BR-106 records the decision, batch and storage in the one
 * quality check. Read-only. Gate: inventory.batch.view or
 * inventory.goods_receipt.record.
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { InfoNote, ScopeHeader, SectionTitle, StatusBadge, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { isMainScope } from './mappers';
import { PermissionNote, canViewReceiving, receiptTone, shipmentTone } from './ReceivingParts';
import { pendingQueueOf, receivingActivityOf, type PendingQueueGroup } from './receivingViews';
import type { IncomingShipment, ReceivingLiveStateProps, ReceivingRecord, WarehouseScreenBaseProps } from './types';

const QUEUE_LABEL: Record<PendingQueueGroup, 'receiving.queue.awaitingQc' | 'receiving.queue.partlyReceived' | 'receiving.queue.notYetReceived'> = {
  awaitingQc: 'receiving.queue.awaitingQc',
  partlyReceived: 'receiving.queue.partlyReceived',
  notYetReceived: 'receiving.queue.notYetReceived',
};

interface SubViewProps extends WarehouseScreenBaseProps, ReceivingLiveStateProps {
  /** False when a walked list stopped early (the rows may be partial). */
  complete?: boolean | undefined;
  /** Main: the warehouse the dashboard picked, for the header pill (undefined = all). */
  scopeLabel?: string | undefined;
}

function kg(value: number | null): string {
  return value === null ? t('inventory.noValue') : formatKg(value);
}

/** The shared frame: header, permission gate, loading / error, pull to refresh. */
function SubViewFrame({
  title,
  scope,
  can,
  onBack,
  scopeLabel,
  isLoading,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  complete = true,
  children,
}: SubViewProps & { title: string; children: React.ReactNode }) {
  const mainView = isMainScope(scope);
  const header = {
    title,
    onBack,
    headerExtra: <ScopeHeader scope={scope} label={mainView ? scopeLabel : scope.warehouseName ?? scope.warehouseId} />,
  };
  if (!canViewReceiving(can)) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message={t('receiving.dashboard.noViewPermission')} />
        </View>
      </WalletScreen>
    );
  }
  if (isLoading === true) {
    return (
      <WalletScreen {...header}>
        <AdminLoadingState />
      </WalletScreen>
    );
  }
  if (error !== null && error !== undefined) {
    return (
      <WalletScreen {...header}>
        <AdminErrorState error={error} onRetry={onRetry} />
      </WalletScreen>
    );
  }
  return (
    <WalletScreen {...header}>
      <ScrollView
        contentContainerStyle={walletLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
          ) : undefined
        }
      >
        {!complete ? <InfoNote tone="brandSoft">{t('receiving.totals.incomplete')}</InfoNote> : null}
        {children}
      </ScrollView>
    </WalletScreen>
  );
}

export interface ReceivingActivityScreenProps extends SubViewProps {
  records?: readonly ReceivingRecord[] | undefined;
  onSelectRecord: (receiptId: string) => void;
}

export function ReceivingActivityScreen({ records = [], onSelectRecord, ...props }: ReceivingActivityScreenProps) {
  const mainView = isMainScope(props.scope);
  const rows = receivingActivityOf(records);
  return (
    <SubViewFrame {...props} title={t('receiving.activity.title')}>
      {rows.length === 0 ? <AdminEmptyState title={t('receiving.empty.receipts')} /> : null}
      {rows.map((rec) => (
        <TouchableOpacity key={rec.id} style={styles.card} onPress={() => onSelectRecord(rec.id)} activeOpacity={0.8} accessibilityRole="button">
          <View style={styles.rowBetween}>
            <Text style={styles.title}>{rec.receiptId}</Text>
            <StatusBadge label={rec.resultLabel} tone={receiptTone(rec.result)} />
          </View>
          <Text style={styles.meta}>
            {/* The row's grade is the order's listed grade (the assigned one is the batch's, BR-106). */}
            {[rec.product, rec.grade === '' ? '' : t('receiving.detail.listedGradeValue', { grade: rec.grade }), mainView ? rec.warehouseName : '']
              .filter((part) => part !== '')
              .join(' · ')}
          </Text>
          <View style={styles.rowBetween}>
            <Text style={styles.value}>{kg(rec.receivedGrams)}</Text>
            <Text style={styles.meta}>{rec.date}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </SubViewFrame>
  );
}

export interface PendingQueueScreenProps extends SubViewProps {
  shipments?: readonly IncomingShipment[] | undefined;
  onSelectShipment: (purchaseOrderId: string) => void;
}

export function PendingQueueScreen({ shipments = [], onSelectShipment, ...props }: PendingQueueScreenProps) {
  const mainView = isMainScope(props.scope);
  const sections = pendingQueueOf(shipments);
  const empty = sections.every((section) => section.shipments.length === 0);
  return (
    <SubViewFrame {...props} title={t('receiving.queue.title')}>
      {empty ? (
        <AdminEmptyState title={t('receiving.queue.empty')} />
      ) : (
        sections.map((section) => (
          <View key={section.group}>
            <SectionTitle right={<Text style={styles.count}>{section.shipments.length}</Text>}>{t(QUEUE_LABEL[section.group])}</SectionTitle>
            {section.shipments.length === 0 ? <Text style={styles.meta}>{t('receiving.queue.sectionEmpty')}</Text> : null}
            {section.shipments.map((s) => (
              <TouchableOpacity
                key={s.purchaseOrderId}
                style={styles.card}
                onPress={() => onSelectShipment(s.purchaseOrderId)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.title}>{s.code}</Text>
                  <StatusBadge label={s.statusLabel} tone={shipmentTone(s.status)} />
                </View>
                <Text style={styles.meta}>
                  {[s.cropName ?? '', s.grade, mainView ? s.to : ''].filter((part) => part !== '').join(' · ') || s.produce}
                </Text>
                <Text style={styles.meta}>
                  {s.status === 'Expected'
                    ? t('receiving.queue.orderedLine', { ordered: kg(s.expectedGrams) })
                    : t('receiving.queue.receivedLine', { received: kg(s.receivedGrams), ordered: kg(s.expectedGrams) })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}
    </SubViewFrame>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...adminType.rowTitle, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  value: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.xs },
  count: { ...adminType.sectionHead, color: adminColors.brandDeep },
});
