/**
 * Task Details: one warehouse task (summary, task information, related
 * information) with a Mark as In Progress action.
 *
 * Gate (FINAL_LIST 28): NO rbac code exists for tasks (SPEC_GAPS W4z-3).
 * Scope-locked: a task of another warehouse reads "Task not found" (no 403
 * leak). 'Mark as In Progress' would need a task code; none exists, so it is
 * left ungated (interim, logged) and only updates the local mock list. The
 * QC task's values used to be written into this screen; they come from the
 * task record now.
 */
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminSpacing, adminType } from '../../../theme';
import {
  Card,
  EmptyState,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  inScope,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { warehouseNameOf } from '../wallet-cashtopup/fixtures';
import { TASK_PRIORITY_TONE, TASK_STATUS_TONE } from './TaskActionCenterScreen';
import type { TaskRecord, WarehouseScreenBaseProps } from './types';

function CheckCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoRow({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowDivider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      {typeof children === 'string' ? <Text style={styles.infoValue}>{children}</Text> : children}
    </View>
  );
}

const PRIORITY_LABEL: Record<TaskRecord['priority'], string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

export interface TaskDetailScreenProps extends WarehouseScreenBaseProps {
  task: TaskRecord | undefined;
  /** Marks the task In Progress (mock; no task endpoint). */
  onMarkInProgress: (taskId: string) => void;
}

export function TaskDetailScreen({ scope, onBack, task, onMarkInProgress }: TaskDetailScreenProps) {
  if (task === undefined || !inScope(scope, task.warehouseId)) {
    return (
      <WalletScreen title="Task Details" onBack={onBack}>
        <EmptyState title="Task not found" subtitle="This task is not available in your warehouse." />
      </WalletScreen>
    );
  }

  const markInProgress = () => {
    onMarkInProgress(task.id);
    Alert.alert('Task Updated', 'Task marked as In Progress');
    onBack();
  };

  return (
    <WalletScreen
      title="Task Details"
      onBack={onBack}
      footer={
        task.status === 'Pending' ? (
          <WalletFooter>
            <WalletButton label="Mark as In Progress" icon={<CheckCircleIcon />} onPress={markInProgress} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gap} />
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <StatusBadge label={task.priority} tone={TASK_PRIORITY_TONE[task.priority]} />
          </View>
          <Text style={styles.taskRef}>{task.referenceId}</Text>
          <Text style={styles.taskDesc}>{task.description}</Text>
        </Card>

        <View style={styles.gap} />
        <Card>
          <Text style={styles.sectionTitle}>Task Information</Text>
          <InfoRow label="Status">
            <StatusBadge label={task.status} tone={TASK_STATUS_TONE[task.status]} />
          </InfoRow>
          <InfoRow label="Priority">
            <Text style={[styles.infoValue, { color: adminColors[TASK_PRIORITY_TONE[task.priority]].text }]}>
              {PRIORITY_LABEL[task.priority]}
            </Text>
          </InfoRow>
          <InfoRow label="Due Date">{task.dueDate}</InfoRow>
          <InfoRow label="Reference">{task.referenceId}</InfoRow>
          <InfoRow label="Assigned To" last>
            {task.assignedTo}
          </InfoRow>
        </Card>

        <View style={styles.gap} />
        <Card>
          <Text style={styles.sectionTitle}>Related Information</Text>
          <InfoRow label="Warehouse">{warehouseNameOf(task.warehouseId)}</InfoRow>
          <InfoRow label="Type">{task.type}</InfoRow>
          <InfoRow label="Created On" last>
            {task.createdOn}
          </InfoRow>
        </Card>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  gap: { height: adminSpacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: adminSpacing.sm },
  taskTitle: { ...adminType.title, color: adminColors.ink, flex: 1 },
  taskRef: { ...adminType.rowTitle, color: adminColors.brandDeep, marginTop: adminSpacing.xs },
  taskDesc: { ...adminType.body, color: adminColors.muted, marginTop: adminSpacing.xs },
  sectionTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.sm },
  infoRowDivider: { borderBottomWidth: 1, borderBottomColor: adminColors.border },
  infoLabel: { ...adminType.body, color: adminColors.muted },
  infoValue: { ...adminType.rowTitle, color: adminColors.ink },
});
