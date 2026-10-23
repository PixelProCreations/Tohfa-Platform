/**
 * Warehouse City Detail: one warehouse's own data (identity, operational KPIs,
 * capacity usage, assigned SWAs) for the Main admin.
 *
 * Gate (FINAL_LIST 156): Main-only; needs `warehouse.all.view` (MAIN all, SUB
 * none). The Sub equivalent is profile-settings Warehouse Profile. Settings
 * also needs `warehouse.capacity.set`.
 *
 * Live data (./useWarehouseAdminData.ts), all keyed by the warehouse uuid:
 *   GET /warehouses/{id}             identity, address, contact, status
 *   GET /warehouses/{id}/capacity    current stock, utilization (BR-66b)
 *   GET /warehouses/{id}/issues      OPEN and IN_PROGRESS counts (`total`, BR-103; warehouse.issue.view)
 *   GET /admin/tasks/summary         open work items (`open`, BR-77; task.own.view)
 *   GET /admin/sub-warehouse-admins  assigned SWAs (admin.sub_wh_admin.create)
 *   GET /warehouses/{id}/performance today's receipts: the IST day's exact
 *                                    `receiving.goodsReceipts` (BR-80; warehouse.all.view, as this screen)
 *
 * Removed with the fixtures, because no endpoint carries them: staff count
 * (the staff list has no total) and operating hours
 * (the stored JSON has no specified read format; Warehouse Settings shows it).
 * "Pending orders" is now "open tasks" from the task summary, which is what
 * the server actually counts.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  EmptyState,
  InfoCard,
  InfoNote,
  KpiRow,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  countLabel,
  figureLabel,
  formatWarehouseAddress,
  toCapacitySummary,
  warehouseKindLabel,
  warehouseStatusLabel,
} from './mappers';
import { useTodayPerformance } from '../dashboard-home-more/useDashboardHomeData';
import { todayReceiptsCount } from './overviewFigures';
import { useWarehouseDetail, useWarehouseSubAdmins } from './useWarehouseAdminData';
import {
  CapacityBar,
  CapacityIcon,
  DocumentIcon,
  GearIcon,
  ManageUsersIcon,
  ViewTile,
  ViewTileGrid,
  WAREHOUSE_ADMIN_CODES,
} from './WarehouseAdminParts';
import type { WarehouseScreenBaseProps } from './types';

export interface WarehouseCityDetailScreenProps extends WarehouseScreenBaseProps {
  /** Server uuid of the warehouse to show. */
  warehouseId?: string | undefined;
  onOpenDocuments?: ((warehouseId: string) => void) | undefined;
  onOpenSettings?: ((warehouseId: string) => void) | undefined;
  /** Capacity on this warehouse (its uuid), not the flow's default pick. */
  onOpenCapacity?: ((warehouseId: string) => void) | undefined;
  onOpenStaff?: ((warehouseId: string) => void) | undefined;
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
}: WarehouseCityDetailScreenProps & { warehouseId: string }) {
  const canIssues = can(WAREHOUSE_ADMIN_CODES.issueView);
  const canTasks = can(WAREHOUSE_ADMIN_CODES.taskView);
  const canSwa = can(WAREHOUSE_ADMIN_CODES.swaCreate);
  const canStaff = (can(WAREHOUSE_ADMIN_CODES.staffView) || can(WAREHOUSE_ADMIN_CODES.attendanceView)) && onOpenStaff !== undefined;
  const detail = useWarehouseDetail(warehouseId, { issues: canIssues, tasks: canTasks });
  const swas = useWarehouseSubAdmins(warehouseId, canSwa);
  // This screen already requires warehouse.all.view, the performance read's code.
  const todayPerf = useTodayPerformance(warehouseId, true);
  const settings = can(WAREHOUSE_ADMIN_CODES.capacitySet) ? onOpenSettings : undefined;

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
        <View style={styles.statusRow}>
          <StatusBadge label={warehouseStatusLabel(w.isActive)} tone={w.isActive ? 'success' : 'danger'} />
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
            ],
          ]}
        />

        <SectionTitle>{t('warehouseAdmin.detail.section.kpis')}</SectionTitle>
        <KpiRow
          items={[
            { value: figureLabel(detail.capacity, (dto) => toCapacitySummary(dto).usedLabel), label: t('warehouseAdmin.detail.kpi.stock') },
            {
              value: figureLabel(todayPerf, (dto) => {
                const n = todayReceiptsCount(dto);
                return n === null ? noValue : countLabel(n);
              }),
              label: t('warehouseAdmin.detail.kpi.todayReceipts'),
            },
            {
              value: figureLabel(detail.capacity, (dto) => toCapacitySummary(dto).percentLabel ?? noValue),
              label: t('warehouseAdmin.detail.kpi.utilization'),
              tone: summary?.overCapacity ? 'warning' : undefined,
            },
          ]}
        />
        {canTasks || canIssues ? (
          <KpiRow
            items={[
              ...(canTasks
                ? [{ value: figureLabel(detail.tasks, (s) => countLabel(s.open)), label: t('warehouseAdmin.detail.kpi.openTasks') }]
                : []),
              ...(canIssues
                ? [
                    { value: figureLabel(detail.openIssues, countLabel), label: t('warehouseAdmin.detail.kpi.openIssues'), tone: issueTone },
                    { value: figureLabel(detail.inProgressIssues, countLabel), label: t('warehouseAdmin.detail.kpi.inProgressIssues') },
                  ]
                : []),
            ]}
          />
        ) : null}

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

        <SectionTitle>{t('warehouseAdmin.detail.section.info')}</SectionTitle>
        <InfoCard
          rows={[
            [{ label: t('warehouseAdmin.detail.field.address'), value: formatWarehouseAddress(w) ?? noValue }],
            [{ label: t('warehouseAdmin.detail.field.contact'), value: w.contactPhone ?? noValue }],
          ]}
        />

        {onOpenDocuments || settings || onOpenCapacity || canStaff ? (
          <SectionTitle>{t('warehouseAdmin.detail.section.actions')}</SectionTitle>
        ) : null}
        <ViewTileGrid>
          {onOpenDocuments ? (
            <ViewTile label={t('warehouseAdmin.action.documents')} icon={<DocumentIcon />} onPress={() => onOpenDocuments(w.id)} />
          ) : null}
          {settings ? <ViewTile label={t('warehouseAdmin.action.settings')} icon={<GearIcon />} onPress={() => settings(w.id)} /> : null}
          {onOpenCapacity ? (
            <ViewTile
              label={t('warehouseAdmin.action.capacity')}
              icon={<CapacityIcon size={22} color={adminColors.brand} />}
              onPress={() => onOpenCapacity(w.id)}
            />
          ) : null}
          {canStaff ? (
            <ViewTile
              label={t('warehouseAdmin.action.staff')}
              icon={<ManageUsersIcon size={22} />}
              onPress={() => onOpenStaff(w.id)}
            />
          ) : null}
        </ViewTileGrid>

        <InfoNote tone="brandSoft">{t('warehouseAdmin.detail.note')}</InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginVertical: adminSpacing.sm },
  meta: { ...adminType.rowMeta, color: adminColors.muted },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  capacityText: { ...adminType.rowTitle, color: adminColors.ink },
});
