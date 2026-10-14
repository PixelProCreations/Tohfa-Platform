/**
 * Task / Action Center: the warehouse's open tasks (QC follow-ups, pickups),
 * with counts, filter chips, search and a Start Task action for the selected
 * task.
 *
 * Gate (FINAL_LIST 27): NO rbac code exists for tasks (SPEC_GAPS W4z-3). Interim
 * rule: visible to any authenticated warehouse admin, scope-locked (Sub sees
 * only its own warehouse's tasks; Main all four, warehouse shown per card).
 * The counts are computed from the tasks in view (they were fixed 24/12/7/5).
 * Tapping or starting a task opens its detail, or for an order task hands the
 * order id to the host's order detail. There is no task endpoint yet.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, type AdminTone } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  KpiRow,
  SearchBar,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  inScope,
  isAllWarehouses,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { warehouseNameOf } from '../wallet-cashtopup/fixtures';
import type { TaskPriority, TaskRecord, TaskStatus, WarehouseScreenBaseProps } from './types';

type TaskFilter = 'All' | 'My Tasks' | 'Pending' | 'Completed';
const FILTERS: readonly TaskFilter[] = ['All', 'My Tasks', 'Pending', 'Completed'];

export const TASK_PRIORITY_TONE: Record<TaskPriority, AdminTone> = { HIGH: 'danger', MEDIUM: 'brandSoft', LOW: 'info' };
export const TASK_STATUS_TONE: Record<TaskStatus, AdminTone> = { Pending: 'brandSoft', 'In Progress': 'info', Completed: 'success' };

function PlayCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM10 8l6 4-6 4V8z"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface TaskActionCenterScreenProps extends WarehouseScreenBaseProps {
  tasks: readonly TaskRecord[];
  /** Open a task (its detail, or the order it is about). */
  onOpenTask: (task: TaskRecord) => void;
}

export function TaskActionCenterScreen({ scope, onBack, tasks, onOpenTask }: TaskActionCenterScreenProps) {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const inView = tasks.filter((t) => inScope(scope, t.warehouseId));
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(inView[0]?.id);
  const allWarehouses = isAllWarehouses(scope);

  const query = searchQuery.trim().toLowerCase();
  const filtered = inView.filter((t) => {
    if (activeFilter === 'My Tasks' && !t.mine) return false;
    if (activeFilter === 'Pending' && t.status === 'Completed') return false;
    if (activeFilter === 'Completed' && t.status !== 'Completed') return false;
    if (!query) return true;
    return (
      t.title.toLowerCase().includes(query) ||
      t.referenceId.toLowerCase().includes(query) ||
      t.id.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    );
  });
  const selected = inView.find((t) => t.id === selectedTaskId);

  return (
    <WalletScreen
      title="Task / Action Center"
      onBack={onBack}
      footer={
        selected !== undefined && selected.status !== 'Completed' ? (
          <WalletFooter>
            <WalletButton label="Start Task" icon={<PlayCircleIcon />} onPress={() => onOpenTask(selected)} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gap} />
        <KpiRow
          items={[
            { label: 'ALL TASKS', value: String(inView.length) },
            { label: 'PENDING', value: String(inView.filter((t) => t.status !== 'Completed').length) },
          ]}
        />
        <KpiRow
          items={[
            { label: 'DUE TODAY', value: String(inView.filter((t) => t.dueToday && t.status !== 'Completed').length) },
            { label: 'COMPLETED', value: String(inView.filter((t) => t.status === 'Completed').length) },
          ]}
        />
        <ChipGroup options={FILTERS} value={activeFilter} onChange={setActiveFilter} />
        <View style={styles.gap} />
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Task ID, Order ID, GR ID, RMA ID..." />
        <View style={styles.gap} />

        {filtered.length === 0 ? (
          <EmptyState title="No tasks" subtitle="No task matches this filter." />
        ) : (
          filtered.map((task) => {
            const isSelected = task.id === selectedTaskId;
            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, isSelected && styles.taskCardSelected]}
                onPress={() => {
                  setSelectedTaskId(task.id);
                  onOpenTask(task);
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${task.title} ${task.referenceId}`}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <StatusBadge label={task.priority} tone={TASK_PRIORITY_TONE[task.priority]} />
                </View>
                <Text style={styles.taskRef}>
                  {task.referenceId}
                  {allWarehouses ? ` · ${warehouseNameOf(task.warehouseId)}` : ''}
                </Text>
                <Text style={styles.taskDesc}>{task.description}</Text>
                <View style={styles.rowBetween}>
                  <Text style={styles.taskMeta}>{task.dueTime}</Text>
                  <StatusBadge label={task.status} tone={TASK_STATUS_TONE[task.status]} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
  taskCardSelected: { borderColor: adminColors.brand, borderWidth: 1.5 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: adminSpacing.sm },
  taskTitle: { ...adminType.sectionHead, color: adminColors.ink, flex: 1 },
  taskRef: { ...adminType.rowTitle, color: adminColors.brandDeep },
  taskDesc: { ...adminType.body, color: adminColors.muted },
  taskMeta: { ...adminType.rowMeta, color: adminColors.muted },
});
