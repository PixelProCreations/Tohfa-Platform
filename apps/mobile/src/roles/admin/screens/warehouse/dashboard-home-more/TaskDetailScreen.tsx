/**
 * Task Details: one live warehouse task (BR-77) with Mark as done (BR-78).
 *
 * There is no GET for a single task, so the detail shows the row the list
 * already loaded (passed in by HomeFlow) or, when opened directly by itemKey,
 * finds it in the open-task list of the scope. A task outside the scope is
 * never in that list, so it reads "Task not found" (no 403 leak, BR-30).
 *
 * Mark as done: POST /admin/tasks/{itemKey}/done with an Idempotency-Key that
 * stays the same across retries of this one action (useIdempotencyKey), so a
 * replay after a lost response is harmless. It changes only this user's list.
 * There is no "in progress" state on the server, so none is offered.
 */
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import { useIdempotencyKey } from '../../../api/hooks';
import { t } from '../../../i18n';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminLoadingState } from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { Card, StatusBadge, WalletButton, WalletFooter, WalletScreen, isAllWarehouses, walletLayout } from '../wallet-cashtopup/WalletParts';
import { HOME_CODES } from './HomeParts';
import { taskOpensRecord, warehouseLabel, type TaskRow } from './mappers_dashboardHome';
import type { WarehouseScreenBaseProps } from './types';
import { useMarkTaskDone, useTaskRows } from './useDashboardHomeData';

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowDivider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export interface TaskDetailScreenProps extends WarehouseScreenBaseProps {
  /** The row the list loaded, when opened from the list. */
  task: TaskRow | undefined;
  /** itemKey to look up when opened directly. */
  itemKey?: string | undefined;
  /** Open the order / goods receipt the task is about (host screen). */
  onOpenRecord?: ((task: TaskRow) => void) | undefined;
}

export function TaskDetailScreen({ scope, can, onBack, task: given, itemKey, onOpenRecord }: TaskDetailScreenProps) {
  const lookup = useTaskRows(scope, 'open');
  const task = given ?? lookup.items.find((row) => row.itemKey === itemKey);
  const markDone = useMarkTaskDone();
  const idempotency = useIdempotencyKey();
  const allWarehouses = isAllWarehouses(scope);
  const { options } = useWarehouseOptions({ enabled: allWarehouses && can(HOME_CODES.allView) });

  if (task === undefined) {
    return (
      <WalletScreen title={t('dashboardHome.task.detail.title')} onBack={onBack}>
        {lookup.isLoading ? (
          <AdminLoadingState />
        ) : (
          <AdminEmptyState title={t('dashboardHome.task.detail.notFound')} subtitle={t('dashboardHome.task.detail.notFoundSubtitle')} />
        )}
      </WalletScreen>
    );
  }

  const onMarkDone = () => {
    const key = idempotency.keyFor({ itemKey: task.itemKey });
    markDone.mutate(
      { itemKey: task.itemKey, idempotencyKey: key },
      {
        onSuccess: () => {
          idempotency.reset();
          onBack();
        },
        onError: (error) => Alert.alert(t('dashboardHome.task.detail.doneFailed'), t(adminErrorKey(error))),
      },
    );
  };

  const canOpen = onOpenRecord !== undefined && taskOpensRecord(task);

  return (
    <WalletScreen
      title={t('dashboardHome.task.detail.title')}
      onBack={onBack}
      footer={
        !task.done || canOpen ? (
          <WalletFooter>
            <View style={styles.footerRow}>
              {canOpen ? (
                <WalletButton
                  label={t('dashboardHome.task.detail.openRecord')}
                  variant="outline"
                  flex
                  onPress={() => onOpenRecord?.(task)}
                />
              ) : null}
              {!task.done ? (
                <WalletButton
                  label={t('dashboardHome.task.detail.markDone')}
                  flex
                  disabled={markDone.isPending}
                  onPress={onMarkDone}
                />
              ) : null}
            </View>
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gap} />
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <StatusBadge
              label={t(task.done ? 'dashboardHome.task.state.done' : 'dashboardHome.task.state.open')}
              tone={task.done ? 'success' : 'brandSoft'}
            />
          </View>
          {task.details !== null ? <Text style={styles.taskDesc}>{task.details}</Text> : null}
        </Card>

        <View style={styles.gap} />
        <Card>
          <Text style={styles.sectionTitle}>{t('dashboardHome.task.detail.info')}</Text>
          <InfoRow label={t('dashboardHome.task.detail.type')} value={task.typeLabel} />
          <InfoRow label={t('dashboardHome.task.detail.reference')} value={task.refCode === '' ? t('dashboardHome.noValue') : task.refCode} />
          <InfoRow label={t('dashboardHome.task.detail.due')} value={task.dueLabel ?? t('dashboardHome.noValue')} />
          {allWarehouses ? <InfoRow label={t('dashboardHome.task.detail.warehouse')} value={warehouseLabel(options, task.warehouseId)} /> : null}
          <InfoRow label={t('dashboardHome.task.detail.created')} value={task.createdLabel} last />
        </Card>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  gap: { height: adminSpacing.sm },
  footerRow: { flexDirection: 'row', gap: adminSpacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: adminSpacing.sm },
  taskTitle: { ...adminType.title, color: adminColors.ink, flex: 1 },
  taskDesc: { ...adminType.body, color: adminColors.muted, marginTop: adminSpacing.xs },
  sectionTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.sm },
  infoRowDivider: { borderBottomWidth: 1, borderBottomColor: adminColors.border },
  infoLabel: { ...adminType.body, color: adminColors.muted },
  infoValue: { ...adminType.rowTitle, color: adminColors.ink },
});
