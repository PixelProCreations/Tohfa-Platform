/**
 * Task / Action Center: the warehouse's open tasks (QC follow-ups, pickups),
 * with exact matching UI to Notifications screen, warehouse selector modal,
 * warehouse name mentioned on every card, and redirection to related screen.
 */
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { type AdminTone } from '../../../theme';
import { inScope, isAllWarehouses } from '../wallet-cashtopup/WalletParts';
import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import { WarehouseSelector } from '../inventory';
import type { TaskPriority, TaskRecord, TaskStatus, WarehouseScope, WarehouseScreenBaseProps } from './types';

export const TASK_PRIORITY_TONE: Record<TaskPriority, AdminTone> = { HIGH: 'danger', MEDIUM: 'brandSoft', LOW: 'info' };
export const TASK_STATUS_TONE: Record<TaskStatus, AdminTone> = { Pending: 'brandSoft', 'In Progress': 'info', Completed: 'success' };

// ─── SVG Icons Matching Reference Screenshot ────────────────────────────────

function BuildingWarehouseIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 6h4M10 10h4M10 14h4M10 18h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m6 9 6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TaskHeaderIcon({ size = 21, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="m9 12 2 2 4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SettingsGearIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Themed Task Card Icons (Screenshot Warm Palette) ────────────────────────

function QualityCheckIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="14" height="17" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1Z" stroke={color} strokeWidth="2" />
      <Path d="m9 12 2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function OrderBagIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 6h18M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReturnBoxIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 14 4 9l5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TruckTransferIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PackageBoxIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="m3.3 7 8.7 5 8.7-5M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TaskCardIcon({ task }: { task: TaskRecord }) {
  const type = (task.type ?? '').toLowerCase();
  const title = (task.title ?? '').toLowerCase();

  if (type.includes('qc') || type.includes('receipt') || title.includes('qc')) {
    return <QualityCheckIcon size={22} />;
  }
  if (type.includes('order') || title.includes('pickup') || title.includes('pack')) {
    return <OrderBagIcon size={22} />;
  }
  if (type.includes('rma') || type.includes('return') || title.includes('rma') || title.includes('inspect')) {
    return <ReturnBoxIcon size={22} />;
  }
  if (type.includes('transfer') || title.includes('transfer') || title.includes('dispatch')) {
    return <TruckTransferIcon size={22} />;
  }
  return <PackageBoxIcon size={22} />;
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface TaskActionCenterScreenProps extends WarehouseScreenBaseProps {
  tasks: readonly TaskRecord[];
  /** Open a task (its detail, or the order it is about). */
  onOpenTask: (task: TaskRecord) => void;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

export function TaskActionCenterScreen({
  scope,
  onBack,
  tasks,
  onOpenTask,
  warehouseOptions = WALLET_WAREHOUSES,
}: TaskActionCenterScreenProps) {
  const allWarehouses = isAllWarehouses(scope);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  // Scoped list
  const inView = useMemo(() => {
    return tasks.filter((t) => inScope(scope, t.warehouseId));
  }, [tasks, scope]);

  // Filter tasks by warehouse
  const filtered = useMemo(() => {
    let list = inView;
    if (scope.warehouseId !== undefined) {
      list = list.filter((t) => t.warehouseId === scope.warehouseId);
    } else if (selectedWarehouseId) {
      list = list.filter((t) => t.warehouseId === selectedWarehouseId);
    }
    return list;
  }, [inView, scope.warehouseId, selectedWarehouseId]);

  // Warehouse pill display label
  const warehousePillLabel = useMemo(() => {
    if (scope.warehouseId !== undefined) {
      return scope.warehouseName ?? warehouseNameOf(scope.warehouseId) ?? 'My Warehouse';
    }
    if (!selectedWarehouseId) return 'All Warehouses';
    const found = warehouseOptions.find((w) => w.warehouseId === selectedWarehouseId);
    return found?.warehouseName ?? warehouseNameOf(selectedWarehouseId);
  }, [scope, selectedWarehouseId, warehouseOptions]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

      {/* Header Matching Reference Screenshot */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          {/* Top Row: Back button, Task Icon, Title, Settings Gear Button */}
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              {onBack !== undefined && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBack}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                >
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M19 12H5M12 19l-7-7 7-7"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              )}
              <TaskHeaderIcon size={21} color="#FFFFFF" />
              <Text style={styles.headerTitle}>Tasks</Text>
            </View>

            <TouchableOpacity
              style={styles.gearButton}
              onPress={() => {}}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Task options"
            >
              <SettingsGearIcon size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Warehouse Selector */}
          {allWarehouses ? (
            <WarehouseSelector
              scope={scope}
              options={warehouseOptions}
              selectedId={selectedWarehouseId}
              onSelect={setSelectedWarehouseId}
            />
          ) : (
            <View style={styles.warehousePill}>
              <BuildingWarehouseIcon size={16} color="#FFFFFF" />
              <Text style={styles.warehousePillText}>{warehousePillLabel}</Text>
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* Tasks List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Tasks</Text>
            <Text style={styles.emptySubtitle}>
              {selectedWarehouseId ? 'No tasks for this warehouse.' : 'No open tasks found.'}
            </Text>
          </View>
        ) : (
          filtered.map((task) => {
            const whName = warehouseNameOf(task.warehouseId);
            return (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCard}
                onPress={() => onOpenTask(task)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${task.title}, ${task.description}, ${task.dueTime}, ${whName}`}
              >
                {/* Left Themed Icon Chip */}
                <View style={styles.iconChip}>
                  <TaskCardIcon task={task} />
                </View>

                {/* Right Content Column */}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{task.title}</Text>
                  <Text style={styles.cardMessage} numberOfLines={2}>
                    {task.description}
                  </Text>
                  <Text style={styles.cardFooter}>
                    {task.dueTime} · {whName}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
  },
  header: {
    backgroundColor: '#F0562A',
    paddingBottom: 14,
  },
  headerSafeArea: {
    backgroundColor: '#F0562A',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  gearButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 10,
    gap: 7,
  },
  warehousePillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
    backgroundColor: '#F7F4EE',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE6DC',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconChip: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FDF2E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  cardMessage: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#5F5E5A',
    lineHeight: 18,
    marginBottom: 5,
  },
  cardFooter: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8C827A',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7E7A75',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8C827A',
    paddingHorizontal: 4,
  },
  modalList: {
    maxHeight: 280,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 2,
  },
  modalItemSelected: {
    backgroundColor: '#FDF2E9',
  },
  modalItemText: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#2B2724',
  },
  modalItemTextSelected: {
    fontWeight: '700',
    color: '#F0562A',
  },
});
