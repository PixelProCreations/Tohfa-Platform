import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand + Inspect Element Tokens) ─────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#6B7280',
  textBody:      '#4B5563',
  border:        '#E7E2D6',
  buttonPrimary: '#F0562A',
  activeChipBg:  '#FFF0EB',
  activeChipBorder: '#F0562A',
  activeChipText:   '#F0562A',
  chipBg:        '#FFFFFF',
  chipBorder:    '#E5E7EB',
  chipText:      '#4B5563',
  highBadgeBg:   '#FEE2E2',
  highBadgeText: '#DC2626',
  medBadgeBg:    '#FFF0EB',
  medBadgeText:  '#F0562A',
  pendingBadgeBg:'#FFF0EB',
  pendingBadgeText:'#F0562A',
  blueBoxBg:     '#EFF6FF',
  blueBoxBorder: '#BFDBFE',
  blueBoxText:   '#1E40AF',
};

export interface TaskRecord {
  id: string;
  referenceId: string;
  title: string;
  description: string;
  dueTime: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Pending' | 'Completed';
}

const INITIAL_TASKS: TaskRecord[] = [
  {
    id: 'TSK-001',
    referenceId: 'GR-00245',
    title: 'QC Follow-up',
    description: 'Review receiving exception',
    dueTime: 'Due Today · 12:30 PM',
    priority: 'HIGH',
    status: 'Pending',
  },
  {
    id: 'TSK-002',
    referenceId: 'ORD-10284',
    title: 'Pickup Order',
    description: 'Prepare order for customer pickup.',
    dueTime: 'Due Today · 02:00 PM',
    priority: 'MEDIUM',
    status: 'Pending',
  },
];

// ─── Pure SVG Icons ─────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#8A928D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = '#8A928D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayCircleIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM10 8l6 4-6 4V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseTaskActionCenterScreenProps {
  onBack?: () => void;
  onStartTask?: (task?: TaskRecord) => void;
  onSelectTask?: (task: TaskRecord) => void;
  onNavigateToTaskDetail?: (task?: TaskRecord) => void;
  onNavigateToOrderDetail?: (task?: TaskRecord) => void;
}

export function SubWarehouseTaskActionCenterScreen({
  onBack,
  onStartTask,
  onSelectTask,
  onNavigateToTaskDetail,
  onNavigateToOrderDetail,
}: SubWarehouseTaskActionCenterScreenProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<'All' | 'My Tasks' | 'Pending' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('TSK-001');

  const filtered = INITIAL_TASKS.filter((t) => {
    if (activeFilter === 'Pending' && t.status !== 'Pending') return false;
    if (activeFilter === 'Completed' && t.status !== 'Completed') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.referenceId.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Task / Action Center</Text>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Stat Cards in 2x2 Grid ─── */}
        <View style={styles.statGrid}>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ALL TASKS</Text>
              <Text style={styles.statNumber}>24</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>PENDING</Text>
              <Text style={styles.statNumber}>12</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>DUE TODAY</Text>
              <Text style={styles.statNumber}>7</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>COMPLETED</Text>
              <Text style={styles.statNumber}>5</Text>
            </View>
          </View>
        </View>

        {/* ─── Filter Chips ─── */}
        <View style={styles.chipsRow}>
          {(['All', 'My Tasks', 'Pending', 'Completed'] as const).map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, isActive && styles.activeChip]}
                onPress={() => setActiveFilter(chip)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Search Input Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Task ID, Order ID, GR ID, RMA ID..."
            placeholderTextColor="#8A928D"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={() => Alert.alert('Filter', 'Filter tasks...')}
            activeOpacity={0.7}
          >
            <FilterSlidersIcon size={18} />
          </TouchableOpacity>
        </View>

        {/* ─── Task Cards ─── */}
        {filtered.map((task) => {
          const isSelected = selectedTaskId === task.id;
          const isHigh = task.priority === 'HIGH';
          return (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskCard, isSelected && styles.selectedTaskCard]}
              onPress={() => {
                setSelectedTaskId(task.id);
                if (onSelectTask) onSelectTask(task);
                if (task.id === 'TSK-001' || task.title.includes('QC')) {
                  if (onNavigateToTaskDetail) onNavigateToTaskDetail(task);
                } else if (task.id === 'TSK-002' || task.title.includes('Pickup')) {
                  if (onNavigateToOrderDetail) onNavigateToOrderDetail(task);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.taskTopRow}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={isHigh ? styles.highBadge : styles.medBadge}>
                  <Text style={isHigh ? styles.highBadgeText : styles.medBadgeText}>
                    {task.priority}
                  </Text>
                </View>
              </View>

              <Text style={styles.taskRefId}>{task.referenceId}</Text>
              <Text style={styles.taskDesc}>{task.description}</Text>

              <View style={styles.taskBottomRow}>
                <Text style={styles.taskDueTime}>{task.dueTime}</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{task.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ─── Sticky Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startTaskBtn}
          onPress={() => {
            const task = INITIAL_TASKS.find((t) => t.id === selectedTaskId);
            if (onStartTask) {
              onStartTask(task);
            } else if (task?.id === 'TSK-001' || task?.title.includes('QC')) {
              if (onNavigateToTaskDetail) onNavigateToTaskDetail(task);
            } else if (task?.id === 'TSK-002' || task?.title.includes('Pickup')) {
              if (onNavigateToOrderDetail) onNavigateToOrderDetail(task);
            } else {
              Alert.alert('Start Task', `Starting task: ${task?.title || 'QC Follow-up'}`);
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.btnRow}>
            <PlayCircleIcon size={20} />
            <Text style={styles.startBtnText}>Start Task</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 14,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  statGrid: {
    gap: 10,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
  },
  statNumber: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: PALETTE.chipBg,
    borderWidth: 1,
    borderColor: PALETTE.chipBorder,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  activeChip: {
    backgroundColor: PALETTE.activeChipBg,
    borderColor: PALETTE.activeChipBorder,
  },
  chipText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.chipText,
  },
  activeChipText: {
    color: PALETTE.activeChipText,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  taskCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 12,
  },
  selectedTaskCard: {
    borderColor: PALETTE.buttonPrimary,
  },
  taskTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  highBadge: {
    backgroundColor: PALETTE.highBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  highBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '800',
    color: PALETTE.highBadgeText,
  },
  medBadge: {
    backgroundColor: PALETTE.medBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  medBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '800',
    color: PALETTE.medBadgeText,
  },
  taskRefId: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  taskDesc: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    color: PALETTE.textBody,
    marginTop: 4,
    marginBottom: 12,
  },
  taskBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDueTime: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    color: PALETTE.textSecondary,
  },
  pendingBadge: {
    backgroundColor: PALETTE.pendingBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
  },
  pendingBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.pendingBadgeText,
  },
  infoBox: {
    backgroundColor: PALETTE.blueBoxBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.blueBoxBorder,
    padding: 13,
    marginTop: 4,
    marginBottom: 14,
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.blueBoxText,
    lineHeight: 16.5,
  },
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE3',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  startTaskBtn: {
    backgroundColor: PALETTE.buttonPrimary,
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
