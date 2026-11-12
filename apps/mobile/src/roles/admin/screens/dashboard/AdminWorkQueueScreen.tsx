/**
 * Screen: Admin Work Queue
 * Exact UI implementation matching Image 5 (Work Queue) and Tohfa Admin reference.
 * Supports RBAC enforcement via Can and theme tokens from ../../theme.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { Can } from '../../permissions/can';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Types & Fixtures ─────────────────────────────────────────────────────────

export interface WorkQueueTask {
  id: string;
  title: string;
  badge: string;
  badgeTone: 'danger' | 'warning' | 'info';
  name: string;
  code: string;
  detail: string;
  created: string;
  actionLabel: string;
  permissionRequired?: string;
  category: 'Purchase exception' | 'Farmer application' | 'Audit follow-up';
}

const INITIAL_TASKS: WorkQueueTask[] = [
  {
    id: 'tsk_1',
    title: 'Purchase exception',
    badge: 'Exception',
    badgeTone: 'danger',
    name: 'Arun',
    code: 'TSK-PO-2026-00307 · PO-2026-00307',
    detail: 'Quality discrepancy recorded',
    created: 'Created 09 Oct 2026',
    actionLabel: 'Review Exception',
    permissionRequired: 'purchase.order.view',
    category: 'Purchase exception',
  },
  {
    id: 'tsk_2',
    title: 'Farmer application',
    badge: 'Pending',
    badgeTone: 'warning',
    name: 'Sathish Kumar',
    code: 'TSK-APP-2026-0101 · APP-2026-0101',
    detail: 'Awaiting review',
    created: 'Created 05 Oct 2026',
    actionLabel: 'Review Application',
    permissionRequired: 'farmer.application.view',
    category: 'Farmer application',
  },
  {
    id: 'tsk_3',
    title: 'Audit follow-up',
    badge: 'Overdue',
    badgeTone: 'danger',
    name: 'Vijay',
    code: 'TSK-AUD-2026-0052 · AUD-2026-0052',
    detail: '',
    created: 'Created 08 Oct 2026 · Due 08 Oct 2026',
    actionLabel: 'View Audit',
    permissionRequired: 'audit.view',
    category: 'Audit follow-up',
  },
];

export interface AdminWorkQueueScreenProps {
  onBack: () => void;
  can?: Can | undefined;
  role?: string | undefined;
  onReviewException?: ((task: WorkQueueTask) => void) | undefined;
  onReviewApplication?: ((task: WorkQueueTask) => void) | undefined;
  onViewAudit?: ((task: WorkQueueTask) => void) | undefined;
}

export function AdminWorkQueueScreen({
  onBack,
  can,
  role: _role = 'SUPER_ADMIN',
  onReviewException,
  onReviewApplication,
  onViewAudit,
}: AdminWorkQueueScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [taskTypeFilter, setTaskTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activePicker, setActivePicker] = useState<'type' | 'status' | null>(null);

  // Filtered Task List
  const filteredTasks = useMemo(() => {
    return INITIAL_TASKS.filter((task) => {
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          task.title.toLowerCase().includes(q) ||
          task.name.toLowerCase().includes(q) ||
          task.code.toLowerCase().includes(q) ||
          task.detail.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Type filter
      if (taskTypeFilter !== 'All' && task.category !== taskTypeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'All' && task.badge !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [searchQuery, taskTypeFilter, statusFilter]);

  const handleActionPress = (task: WorkQueueTask) => {
    // RBAC check: if `can` is provided, verify required permission
    if (can && task.permissionRequired && !can(task.permissionRequired)) {
      Alert.alert(
        'Access Restricted',
        `Your role lacks permission to perform this task (${task.permissionRequired}).`
      );
      return;
    }

    if (task.id === 'tsk_1') {
      if (onReviewException) {
        onReviewException(task);
      } else {
        Alert.alert('Review Exception', `Opening PO exception for ${task.name} (${task.code})`);
      }
    } else if (task.id === 'tsk_2') {
      if (onReviewApplication) {
        onReviewApplication(task);
      } else {
        Alert.alert('Farmer Application', `Opening application review for ${task.name}`);
      }
    } else if (task.id === 'tsk_3') {
      if (onViewAudit) {
        onViewAudit(task);
      } else {
        Alert.alert('View Audit', `Opening audit details for ${task.name} (${task.code})`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner matching Image 5 */}
      <View style={styles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="wqHeaderGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} stopOpacity={0.96} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#wqHeaderGrad)" />
        </Svg>

        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowWhiteIcon size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Work Queue</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search & Filter Trigger Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search common or scientific name"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.7}
              style={styles.filterTrigger}
              accessibilityRole="button"
              accessibilityLabel="Filter tasks"
            >
              <FilterSlidersIcon size={18} color={adminColors.brand} />
            </TouchableOpacity>
          </View>

          {/* Status & pending count row matching Image 5 */}
          <Text style={styles.countText}>
            6 pending · 3 blocked / exception
          </Text>
        </View>

        {/* Task Cards List */}
        <View style={styles.taskList}>
          {filteredTasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{task.title}</Text>
                <View
                  style={[
                    styles.badge,
                    task.badgeTone === 'danger' && styles.badgeDanger,
                    task.badgeTone === 'warning' && styles.badgeWarning,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      task.badgeTone === 'danger' && styles.badgeTextDanger,
                      task.badgeTone === 'warning' && styles.badgeTextWarning,
                    ]}
                  >
                    {task.badge}
                  </Text>
                </View>
              </View>

              <Text style={styles.personName}>{task.name}</Text>
              <Text style={styles.taskCode}>{task.code}</Text>
              {task.detail ? <Text style={styles.taskDetail}>{task.detail}</Text> : null}
              <Text style={styles.taskCreated}>{task.created}</Text>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleActionPress(task)}
                activeOpacity={0.75}
              >
                <Text style={styles.actionText}>{task.actionLabel}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Filter and Sort Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Filter and sort tasks</Text>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Task type</Text>
              <TouchableOpacity
                style={styles.filterSelect}
                onPress={() => setActivePicker(activePicker === 'type' ? null : 'type')}
                activeOpacity={0.75}
              >
                <Text style={styles.filterValue}>{taskTypeFilter}</Text>
                <ChevronDownIcon size={16} color={adminColors.muted} />
              </TouchableOpacity>
              {activePicker === 'type' && (
                <View style={styles.dropdownList}>
                  {['All', 'Purchase exception', 'Farmer application', 'Audit follow-up'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.dropdownItem,
                        taskTypeFilter === opt && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setTaskTypeFilter(opt);
                        setActivePicker(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          taskTypeFilter === opt && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status</Text>
              <TouchableOpacity
                style={styles.filterSelect}
                onPress={() => setActivePicker(activePicker === 'status' ? null : 'status')}
                activeOpacity={0.75}
              >
                <Text style={styles.filterValue}>{statusFilter}</Text>
                <ChevronDownIcon size={16} color={adminColors.muted} />
              </TouchableOpacity>
              {activePicker === 'status' && (
                <View style={styles.dropdownList}>
                  {['All', 'Pending', 'Exception', 'Overdue'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.dropdownItem,
                        statusFilter === opt && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setStatusFilter(opt);
                        setActivePicker(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          statusFilter === opt && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setTaskTypeFilter('All');
                  setStatusFilter('All');
                  setFilterModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: adminSpacing.xxxl,
  },
  searchContainer: {
    paddingHorizontal: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    marginLeft: adminSpacing.sm,
    paddingVertical: 2,
    includeFontPadding: false,
  },
  filterTrigger: {
    padding: adminSpacing.xs,
  },
  countText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
    paddingHorizontal: adminSpacing.xs,
    includeFontPadding: false,
  },
  taskList: {
    paddingHorizontal: adminSpacing.md,
    marginTop: adminSpacing.xs,
  },
  taskCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  cardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 14,
    includeFontPadding: false,
  },
  badge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    borderRadius: adminRadius.sm,
  },
  badgeDanger: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeWarning: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  badgeTextDanger: {
    color: adminColors.danger.text,
  },
  badgeTextWarning: {
    color: adminColors.warning.text,
  },
  personName: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
    includeFontPadding: false,
  },
  taskCode: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 4,
    includeFontPadding: false,
  },
  taskDetail: {
    ...adminType.body,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 2,
    includeFontPadding: false,
  },
  taskCreated: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
    includeFontPadding: false,
  },
  actionButton: {
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  actionText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.brand,
    fontSize: 13.5,
    includeFontPadding: false,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.md,
  },
  modalTitle: {
    ...adminType.title,
    fontSize: 16,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
    includeFontPadding: false,
  },
  filterGroup: {
    marginBottom: adminSpacing.md,
  },
  filterLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 6,
    includeFontPadding: false,
  },
  filterSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    backgroundColor: adminColors.canvas,
  },
  filterValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    includeFontPadding: false,
  },
  dropdownList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: adminColors.border,
  },
  dropdownItemSelected: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownItemText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    includeFontPadding: false,
  },
  dropdownItemTextSelected: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: adminSpacing.md,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  resetBtnText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
    includeFontPadding: false,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  applyBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
    includeFontPadding: false,
  },
});

