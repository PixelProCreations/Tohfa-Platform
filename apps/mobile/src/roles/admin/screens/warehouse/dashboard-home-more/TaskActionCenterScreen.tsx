/**
 * Task / Action Center: the warehouse's live work items (BR-77), derived by
 * the server from existing records: QC of a goods receipt, packing / dispatch
 * / pickup of an order, inspection / approval of a return.
 *
 * Data: GET /admin/tasks?state=open|done (cursor paged) and GET
 * /admin/tasks/summary for the KPI tiles, both scoped to scope.warehouseId (a
 * Sub admin its own warehouse, BR-30; Main the whole scope, warehouse named on
 * each card). Permission `task.own.view` is checked by the server.
 *
 * The server knows only OPEN and DONE: there is no priority, assignee or "in
 * progress" state, so the screen offers none. Tapping a task opens its detail.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t, type TranslationKey } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { ChipGroup, KpiRow, SearchBar, StatusBadge, WalletButton, WalletScreen, isAllWarehouses, walletLayout } from '../wallet-cashtopup/WalletParts';
import { HOME_CODES } from './HomeParts';
import {
  TASK_STATE_FILTERS,
  filterTaskRows,
  taskKpis,
  warehouseLabel,
  type TaskRow,
  type TaskStateFilter,
} from './mappers_dashboardHome';
import type { WarehouseScreenBaseProps } from './types';
import { useTaskRows, useTaskSummary } from './useDashboardHomeData';

const FILTER_LABEL: Record<TaskStateFilter, TranslationKey> = {
  open: 'dashboardHome.task.filter.open',
  done: 'dashboardHome.task.filter.done',
};

export interface TaskActionCenterScreenProps extends WarehouseScreenBaseProps {
  /** Open a task's detail. */
  onOpenTask: (task: TaskRow) => void;
}

export function TaskActionCenterScreen({ scope, can, onBack, onOpenTask }: TaskActionCenterScreenProps) {
  const [filter, setFilter] = useState<TaskStateFilter>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const allWarehouses = isAllWarehouses(scope);
  const tasks = useTaskRows(scope, filter);
  const summary = useTaskSummary(scope);
  const { options } = useWarehouseOptions({ enabled: allWarehouses && can(HOME_CODES.allView) });

  const kpis = taskKpis(summary.data);
  const visible = filterTaskRows(tasks.items, searchQuery);
  const state = queryViewState({ isLoading: tasks.isLoading, error: tasks.error, itemCount: tasks.items.length });

  return (
    <WalletScreen title={t('dashboardHome.task.title')} onBack={onBack}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gap} />
        <KpiRow items={kpis.slice(0, 2)} />
        <KpiRow items={kpis.slice(2, 4)} />
        <ChipGroup
          options={TASK_STATE_FILTERS}
          value={filter}
          onChange={setFilter}
          labelOf={(f) => t(FILTER_LABEL[f])}
        />
        <View style={styles.gap} />
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={t('dashboardHome.task.searchPlaceholder')} />
        <View style={styles.gap} />

        {state === 'loading' ? (
          <AdminLoadingState />
        ) : state === 'error' ? (
          <AdminErrorState error={tasks.error} onRetry={tasks.refresh} />
        ) : state === 'empty' || visible.length === 0 ? (
          <AdminEmptyState title={t('dashboardHome.task.empty.title')} subtitle={t('dashboardHome.task.empty.subtitle')} />
        ) : (
          visible.map((task) => (
            <TouchableOpacity
              key={task.itemKey}
              style={styles.taskCard}
              onPress={() => onOpenTask(task)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={task.title}
            >
              <View style={styles.rowBetween}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <StatusBadge
                  label={t(task.done ? 'dashboardHome.task.state.done' : 'dashboardHome.task.state.open')}
                  tone={task.done ? 'success' : 'brandSoft'}
                />
              </View>
              {allWarehouses ? <Text style={styles.taskRef}>{warehouseLabel(options, task.warehouseId)}</Text> : null}
              {task.details !== null ? <Text style={styles.taskDesc}>{task.details}</Text> : null}
              <View style={styles.rowBetween}>
                <Text style={styles.taskMeta}>{task.dueLabel ?? task.createdLabel}</Text>
                {task.dueToday && !task.done ? <StatusBadge label={t('dashboardHome.task.dueToday')} tone="warning" /> : null}
              </View>
            </TouchableOpacity>
          ))
        )}
        {tasks.hasMore ? <WalletButton label={t('dashboardHome.loadMore')} variant="outline" onPress={tasks.loadMore} /> : null}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  gap: { height: adminSpacing.sm },
  taskCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: adminSpacing.sm },
  taskTitle: { ...adminType.sectionHead, color: adminColors.ink, flex: 1 },
  taskRef: { ...adminType.rowTitle, color: adminColors.brandDeep },
  taskDesc: { ...adminType.body, color: adminColors.muted },
  taskMeta: { ...adminType.rowMeta, color: adminColors.muted },
});
