/**
 * Warehouse Detail (design M15-03): one warehouse's own data for the Main
 * admin. It is also D02 Warehouse Overview's per-warehouse panel (SWA, stock,
 * today's receipts, Pending Orders, Open Issues, capacity), which the D02
 * cards open; the cards themselves carry no Pending Orders.
 *
 * Gate (FINAL_LIST 156): Main-only; needs `warehouse.all.view` (MAIN all, SUB
 * none). The Sub equivalent is profile-settings Warehouse Profile.
 *
 * Tabs (local state, ./detailFigures.ts warehouseDetailTabs): Overview,
 * SWA, Capacity, Documents, Activity; a tab whose read the caller lacks is not
 * drawn. The design's Inventory / Operations / Staff tabs only point at other
 * modules, so they are link cards on Overview that open those modules on this
 * warehouse (the host does it: Inventory tab filter, Operations hub pick).
 *
 * Live data, every read keyed by and sent with this warehouse's uuid (BR-30):
 *   GET /warehouses/{id}                       identity, address, contact, status
 *   GET /warehouses/{id}/capacity              current stock, utilization (BR-66b)
 *   GET /warehouses/{id}/performance (IST day) today's gross kg received, receipt
 *                                              count and orders placed (BR-80; warehouse.all.view)
 *   GET /admin/orders?status=&warehouseId=     Pending Orders: CONFIRMED, PACKED,
 *                                              READY_FOR_PICKUP, one page each (order.list.view_all)
 *   GET /warehouses/{id}/issues                OPEN and IN_PROGRESS counts (BR-103; warehouse.issue.view)
 *   GET /admin/staff-attendance/roll-call      staff count, today's ACTIVE members (BR-84;
 *                                              admin.staff.attendance.view)
 *   GET /admin/sub-warehouse-admins            the SWA cards (admin.sub_wh_admin.create)
 *   GET /warehouses/{id}/documents             the first document, view-only (BR-105; warehouse.document.view)
 *   GET /warehouses/{id}/activity              the newest events (BR-104; warehouse.activity.view)
 *
 * Not shown, because no endpoint carries them: operating hours as text (the
 * stored JSON has no specified read format; Warehouse Settings edits it) and
 * an exact Pending Orders total past one page per status (the order list has
 * no `total`; the figure then reads "100+").
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { OverviewCardsGrid, OverviewDashboardCard } from '../../../components';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { canOpenStorageRoute } from '../storage-ops/StorageFlow';
import { ActivityRowCard } from '../storage-ops/WarehouseActivityScreen';
import {
  ChipGroup,
  EmptyState,
  InfoCard,
  InfoNote,
  ScopeHeader,
  SectionHint,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { useTodayPerformance } from '../dashboard-home-more/useDashboardHomeData';
import {
  documentSubtitle,
  pendingOrdersLabel,
  swaAssignedRows,
  swaCardMeta,
  todayOrdersCount,
  todayReceivedKgLabel,
  WAREHOUSE_DETAIL_CODES,
  warehouseDetailTabLabel,
  warehouseDetailTabs,
  type WarehouseDetailTab,
} from './detailFigures';
import {
  countLabel,
  figureLabel,
  formatWarehouseAddress,
  subAdminStatusTone,
  toCapacitySummary,
  warehouseKindLabel,
  warehouseStatusLabel,
} from './mappers';
import { todayReceiptsCount, WAREHOUSE_OVERVIEW_CODES } from './overviewFigures';
import {
  useFirstWarehouseDocument,
  usePendingOrders,
  useRecentWarehouseActivity,
  useStaffCounts,
  useWarehouseDetail,
  useWarehouseSubAdmins,
} from './useWarehouseAdminData';
import { CapacityBar, CapacityIcon, WAREHOUSE_ADMIN_CODES } from './WarehouseAdminParts';
import { DetailLinkCard, DocumentSummaryCard, SwaPersonCard, TimelineRow } from './WarehouseDetailParts';
import type { WarehouseScreenBaseProps } from './types';

export interface WarehouseCityDetailScreenProps extends WarehouseScreenBaseProps {
  /** Server uuid of the warehouse to show. */
  warehouseId?: string | undefined;
  onOpenDocuments?: ((warehouseId: string) => void) | undefined;
  onOpenSettings?: ((warehouseId: string) => void) | undefined;
  /** Capacity on this warehouse (its uuid), not the flow's default pick. */
  onOpenCapacity?: ((warehouseId: string) => void) | undefined;
  onOpenStaff?: ((warehouseId: string) => void) | undefined;
  /** Manage Sub Warehouse Admins; the flow passes it only when the route's code allows it. */
  onOpenSubAdmins?: (() => void) | undefined;
  /** Open Inventory on this warehouse (host: the Inventory tab, filtered to it). */
  onOpenInventory?: ((warehouseId: string) => void) | undefined;
  /** Open Operations on this warehouse (host: the Operations hub, preselected on it). */
  onOpenOperations?: ((warehouseId: string) => void) | undefined;
}

export function WarehouseCityDetailScreen(props: WarehouseCityDetailScreenProps) {
  if (!props.can(WAREHOUSE_ADMIN_CODES.allView)) {
    return (
      <WalletScreen title={t('warehouseAdmin.detail.title')} onBack={props.onBack}>
        <EmptyState title={t('warehouseAdmin.notAvailable.title')} subtitle={t('warehouseAdmin.detail.notAvailable')} />
      </WalletScreen>
    );
  }
  if (props.warehouseId === undefined) {
    return (
      <WalletScreen title={t('warehouseAdmin.detail.title')} onBack={props.onBack} headerExtra={<ScopeHeader scope={props.scope} />}>
        <EmptyState title={t('warehouseAdmin.detail.missing.title')} subtitle={t('warehouseAdmin.detail.missing.subtitle')} />
      </WalletScreen>
    );
  }
  return <WarehouseCityDetailContent {...props} warehouseId={props.warehouseId} />;
}

function WarehouseCityDetailContent({
  scope,
  can,
  onBack,
  warehouseId,
  onOpenDocuments,
  onOpenSettings,
  onOpenCapacity,
  onOpenStaff,
  onOpenSubAdmins,
  onOpenInventory,
  onOpenOperations,
}: WarehouseCityDetailScreenProps & { warehouseId: string }) {
  const tabs = warehouseDetailTabs(can);
  const [tab, setTab] = useState<WarehouseDetailTab>('overview');
  const activeTab = tabs.includes(tab) ? tab : 'overview';

  const canIssues = can(WAREHOUSE_ADMIN_CODES.issueView);
  const canSwa = can(WAREHOUSE_ADMIN_CODES.swaCreate);
  const canPending = can(WAREHOUSE_DETAIL_CODES.pendingOrders);
  const canStaffCount = can(WAREHOUSE_OVERVIEW_CODES.staffCount);
  // The flow's Staff route needs the roster code; without it the link would open nothing.
  const openStaff = can(WAREHOUSE_ADMIN_CODES.staffView) ? onOpenStaff : undefined;
  const openInventory = can(WAREHOUSE_DETAIL_CODES.inventory) ? onOpenInventory : undefined;
  const openOperations = canOpenStorageRoute('Operations', can) ? onOpenOperations : undefined;
  const settings = can(WAREHOUSE_ADMIN_CODES.capacitySet) ? onOpenSettings : undefined;

  const detail = useWarehouseDetail(warehouseId, { issues: canIssues });
  const swas = useWarehouseSubAdmins(warehouseId, canSwa);
  // This screen already requires warehouse.all.view, the performance read's code.
  const todayPerf = useTodayPerformance(warehouseId, true);
  const pending = usePendingOrders(warehouseId, can(WAREHOUSE_DETAIL_CODES.pendingOrders));
  const staffCount = useStaffCounts([warehouseId], canStaffCount).get(warehouseId);
  const firstDocument = useFirstWarehouseDocument(warehouseId, tabs.includes('documents'));
  const activity = useRecentWarehouseActivity(warehouseId, tabs.includes('activity'));

  const w = detail.warehouse.data;
  if (w === undefined) {
    return (
      <WalletScreen title={t('warehouseAdmin.detail.title')} onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        {detail.warehouse.isLoading ? (
          <AdminLoadingState />
        ) : (
          <AdminErrorState error={detail.warehouse.error} onRetry={detail.warehouse.refresh} />
        )}
      </WalletScreen>
    );
  }

  const summary = detail.capacity.data === undefined ? undefined : toCapacitySummary(detail.capacity.data);
  const noValue = t('warehouseAdmin.figure.unavailable');
  const issueTone = (detail.openIssues.data ?? 0) > 0 ? ('danger' as const) : undefined;
  // D02's "Today's Receipts" count rides under the kg figure (same read): "3 receipts".
  const receipts = todayPerf.data === undefined ? null : todayReceiptsCount(todayPerf.data);
  const receiptsLine = receipts === null ? undefined : t('warehouseAdmin.detail.kpi.receiptsCount', { count: countLabel(receipts) });

  const overview = (
    <>
      <View style={styles.statusRow}>
        {summary?.overCapacity ? (
          <StatusBadge label={t('warehouseAdmin.capacity.over', { percent: summary.percentLabel ?? '' })} tone="warning" />
        ) : null}
        <Text style={styles.meta}>{warehouseKindLabel(w.type)}</Text>
      </View>
      <InfoCard
        rows={[
          [
            { label: t('warehouseAdmin.detail.field.warehouse'), value: w.name },
            { label: t('warehouseAdmin.detail.field.code'), value: w.code },
          ],
          [
            { label: t('warehouseAdmin.detail.field.location'), value: w.city ?? noValue },
            { label: t('warehouseAdmin.detail.field.status'), value: warehouseStatusLabel(w.isActive) },
          ],
        ]}
      />

      <SectionTitle>{t('warehouseAdmin.detail.section.kpis')}</SectionTitle>
      <OverviewCardsGrid>
        <OverviewDashboardCard
          icon="inventory"
          title={t('warehouseAdmin.detail.kpi.stock')}
          value={figureLabel(detail.capacity, (dto) => toCapacitySummary(dto).usedLabel)}
        />
        <OverviewDashboardCard
          icon={<CapacityIcon size={18} color={adminColors.brandDeep} />}
          title={t('warehouseAdmin.detail.kpi.utilization')}
          value={figureLabel(detail.capacity, (dto) => toCapacitySummary(dto).percentLabel ?? noValue)}
          tone={summary?.overCapacity ? 'warning' : 'default'}
        />
        <OverviewDashboardCard
          icon="receiving"
          title={t('warehouseAdmin.detail.kpi.todayReceiving')}
          value={figureLabel(todayPerf, (dto) => todayReceivedKgLabel(dto) ?? noValue)}
          subtitle={receiptsLine}
        />
        <OverviewDashboardCard
          icon="orders"
          title={t('warehouseAdmin.detail.kpi.todayOrders')}
          value={figureLabel(todayPerf, (dto) => {
            const n = todayOrdersCount(dto);
            return n === null ? noValue : countLabel(n);
          })}
        />
        {canPending ? (
          <OverviewDashboardCard
            icon="pickup"
            title={t('warehouseAdmin.detail.kpi.pendingOrders')}
            value={figureLabel(pending, pendingOrdersLabel)}
          />
        ) : null}
        {canIssues ? (
          <>
            <OverviewDashboardCard
              icon="alert"
              title={t('warehouseAdmin.detail.kpi.openIssues')}
              value={figureLabel(detail.openIssues, countLabel)}
              tone={issueTone ?? 'default'}
            />
            <OverviewDashboardCard
              icon="alert"
              title={t('warehouseAdmin.detail.kpi.inProgressIssues')}
              value={figureLabel(detail.inProgressIssues, countLabel)}
            />
          </>
        ) : null}
      </OverviewCardsGrid>

      <SectionTitle>{t('warehouseAdmin.detail.section.info')}</SectionTitle>
      <InfoCard
        rows={[
          [{ label: t('warehouseAdmin.detail.field.address'), value: formatWarehouseAddress(w) ?? noValue }],
          [
            ...(canSwa
              ? [
                  {
                    label: t('warehouseAdmin.detail.field.swa'),
                    value: figureLabel(swas, (rows) =>
                      rows.length === 0
                        ? t('warehouseAdmin.swa.unassigned')
                        : rows.map((r) => r.fullName).join(t('warehouseAdmin.listSeparator')),
                    ),
                  },
                ]
              : []),
            // BR-84: only a successful roll-call read shows a number; loading and failure never read as 0.
            ...(canStaffCount ? [{ label: t('warehouseAdmin.detail.field.staffCount'), value: figureLabel(staffCount, countLabel) }] : []),
          ],
          [{ label: t('warehouseAdmin.detail.field.contact'), value: w.contactPhone ?? noValue }],
        ].filter((row) => row.length > 0)}
      />

      {openInventory ? (
        <DetailLinkCard
          text={t('warehouseAdmin.detail.link.inventory.text')}
          actionLabel={t('warehouseAdmin.detail.link.inventory.action')}
          onPress={() => openInventory(w.id)}
        />
      ) : null}
      {openOperations ? (
        <DetailLinkCard
          text={t('warehouseAdmin.detail.link.operations.text')}
          actionLabel={t('warehouseAdmin.detail.link.operations.action')}
          onPress={() => openOperations(w.id)}
        />
      ) : null}
      {openStaff ? (
        <DetailLinkCard
          text={t('warehouseAdmin.detail.link.staff.text')}
          actionLabel={t('warehouseAdmin.detail.link.staff.action')}
          onPress={() => openStaff(w.id)}
        />
      ) : null}
      {settings ? (
        <DetailLinkCard
          text={t('warehouseAdmin.detail.link.settings.text')}
          actionLabel={t('warehouseAdmin.detail.link.settings.action')}
          onPress={() => settings(w.id)}
        />
      ) : null}

      <InfoNote tone="brandSoft">{t('warehouseAdmin.detail.note')}</InfoNote>
    </>
  );

  const swaTab = (
    <>
      <SectionTitle>{t('warehouseAdmin.swa.title')}</SectionTitle>
      {swas.data === undefined ? (
        swas.isLoading ? (
          <AdminLoadingState />
        ) : (
          <AdminErrorState error={swas.error} onRetry={swas.refresh} />
        )
      ) : swas.data.length === 0 ? (
        <AdminEmptyState title={t('warehouseAdmin.swa.unassigned')} />
      ) : (
        swas.data.map((row) => (
          <SwaPersonCard key={row.userId} name={row.fullName} meta={swaCardMeta(row)} tone={subAdminStatusTone(row.status)} />
        ))
      )}
      {onOpenSubAdmins ? (
        <WalletButton label={t('warehouseAdmin.detail.swa.viewAll')} variant="outline" onPress={onOpenSubAdmins} />
      ) : null}
    </>
  );

  const capacityTab = (
    <>
      <SectionTitle>{t('warehouseAdmin.detail.section.capacity')}</SectionTitle>
      <View style={styles.card}>
        <CapacityBar percent={summary?.fillPercent ?? 0} warning={summary?.overCapacity === true} />
        <Text style={styles.capacityText}>
          {figureLabel(detail.capacity, (dto) => {
            const s = toCapacitySummary(dto);
            return s.capacityLabel === null
              ? t('warehouseAdmin.capacity.usedOnly', { used: s.usedLabel })
              : t('warehouseAdmin.capacity.usedOf', { used: s.usedLabel, capacity: s.capacityLabel });
          })}
        </Text>
        {summary?.availableLabel ? (
          <Text style={styles.meta}>{t('warehouseAdmin.capacity.available', { available: summary.availableLabel })}</Text>
        ) : null}
      </View>
      {onOpenCapacity ? (
        <WalletButton label={t('warehouseAdmin.detail.link.capacity')} variant="outline" onPress={() => onOpenCapacity(w.id)} />
      ) : null}
    </>
  );

  const document = firstDocument.data?.document;
  const documentsTab = (
    <>
      <SectionTitle right={<SectionHint>{t('warehouseAdmin.detail.documents.hint')}</SectionHint>}>
        {t('warehouseAdmin.detail.section.documents')}
      </SectionTitle>
      {firstDocument.data === undefined ? (
        firstDocument.isLoading ? (
          <AdminLoadingState />
        ) : (
          <AdminErrorState error={firstDocument.error} onRetry={firstDocument.refresh} />
        )
      ) : document === null || document === undefined ? (
        <AdminEmptyState title={t('warehouseAdmin.detail.documents.empty')} />
      ) : (
        <DocumentSummaryCard
          title={document.title}
          subtitle={documentSubtitle(document)}
          statusLabel={document.statusLabel}
          statusTone={document.statusTone}
          dateLine={document.dateLine}
        />
      )}
      {onOpenDocuments ? (
        <WalletButton label={t('warehouseAdmin.detail.documents.viewAll')} variant="outline" onPress={() => onOpenDocuments(w.id)} />
      ) : null}
    </>
  );

  const activityTab = (
    <>
      <SectionTitle>{t('warehouseAdmin.detail.section.activity')}</SectionTitle>
      {activity.data === undefined ? (
        activity.isLoading ? (
          <AdminLoadingState />
        ) : (
          <AdminErrorState error={activity.error} onRetry={activity.refresh} />
        )
      ) : activity.data.length === 0 ? (
        <AdminEmptyState title={t('warehouseAdmin.detail.activity.empty')} />
      ) : (
        activity.data.map((row) => <ActivityRowCard key={row.key} row={row} />)
      )}
      {canSwa && swas.data !== undefined && swas.data.length > 0 ? (
        <>
          <SectionTitle>{t('warehouseAdmin.detail.activity.assignments')}</SectionTitle>
          {swaAssignedRows(swas.data).map((row) => (
            <TimelineRow key={row.key} title={row.title} when={row.when} />
          ))}
        </>
      ) : null}
    </>
  );

  const body: Record<WarehouseDetailTab, React.ReactNode> = {
    overview,
    swa: swaTab,
    capacity: capacityTab,
    documents: documentsTab,
    activity: activityTab,
  };

  return (
    <WalletScreen
      title={w.name}
      subtitle={t('warehouseAdmin.detail.title')}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={w.name} />}
      footer={
        <WalletFooter>
          <WalletButton label={t('warehouseAdmin.detail.backToAll')} variant="outline" onPress={onBack} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {tabs.length > 1 ? (
          <View style={styles.tabs}>
            <ChipGroup options={tabs} value={activeTab} onChange={setTab} labelOf={warehouseDetailTabLabel} />
          </View>
        ) : null}
        {body[activeTab]}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  tabs: { marginBottom: adminSpacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginVertical: adminSpacing.sm },
  meta: { ...adminType.rowMeta, color: adminColors.muted },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  capacityText: { ...adminType.rowTitle, color: adminColors.ink },
});
