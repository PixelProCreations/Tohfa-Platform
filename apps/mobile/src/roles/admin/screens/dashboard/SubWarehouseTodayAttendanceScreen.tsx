import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',
  greenDot:      '#10B981',
  greenText:     '#059669',
  redDot:        '#EF4444',
  redText:       '#DC2626',
  amberText:     '#D97706',
  blueBoxBg:     '#EFF6FF',
  blueBoxBorder: '#BFDBFE',
  blueBoxText:   '#1E40AF',
  redBoxBg:      '#FEF2F2',
  redBoxBorder:  '#FECACA',
  redBoxText:    '#DC2626',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function RefreshIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 4v5h-5M4 20v-5h5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 9A8 8 0 0 0 6.34 6.34L4 9M4 15a8 8 0 0 0 13.66 2.66L20 15"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarehouseStoreIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V9l9-5 9 5v12H3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProhibitedCircleIcon({ size = 16, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarHistoryIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Navigation Icons ──────────────────────────────────────────────────

function HomeTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v12M7 10l5 5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m3.3 7 8.7 5 8.7-5M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active = true }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

// ─── Data Types ───────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  name: string;
  role: string;
  status: 'Present' | 'Absent' | 'On Leave' | 'Not Checked In';
  checkInTime?: string;
  checkOutTime?: string;
}

const INITIAL_TODAY_RECORDS: AttendanceRecord[] = [
  {
    id: 'att-1',
    name: 'Arun Kumar',
    role: 'Driver',
    status: 'Present',
    checkInTime: '09:02 AM',
  },
  {
    id: 'att-2',
    name: 'Karthik',
    role: 'Warehouse Staff',
    status: 'Present',
    checkInTime: '09:18 AM',
  },
  {
    id: 'att-3',
    name: 'Manoj',
    role: 'Driver',
    status: 'Absent',
  },
  {
    id: 'att-4',
    name: 'Suresh',
    role: 'Warehouse Staff',
    status: 'On Leave',
  },
];

export interface SubWarehouseTodayAttendanceScreenProps {
  onBack: () => void;
  onNavigateToHistory?: () => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
  warehouseName?: string;
  dateStr?: string;
}

export function SubWarehouseTodayAttendanceScreen({
  onBack,
  onNavigateToHistory,
  onTabChange,
  warehouseName = 'Coonoor Warehouse',
  dateStr = '25 Sep 2026',
}: SubWarehouseTodayAttendanceScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Present' | 'Absent' | 'On Leave'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = INITIAL_TODAY_RECORDS.filter((rec) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || rec.name.toLowerCase().includes(q) || rec.role.toLowerCase().includes(q);
    const matchesFilter = activeFilter === 'All' || rec.status === activeFilter;
    return matchesQuery && matchesFilter;
  });

  const presentRecords = filteredRecords.filter((r) => r.status === 'Present');
  const absentRecords = filteredRecords.filter((r) => r.status === 'Absent');
  const leaveRecords = filteredRecords.filter((r) => r.status === 'On Leave');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Today's Attendance</Text>

          <View style={styles.headerActions}>
            {onNavigateToHistory && (
              <TouchableOpacity
                style={styles.historyBtn}
                onPress={onNavigateToHistory}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CalendarHistoryIcon size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.refreshButton}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <RefreshIcon size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Warehouse Pill Chip */}
        <TouchableOpacity
          style={styles.warehousePill}
          activeOpacity={0.8}
          onPress={onNavigateToHistory}
        >
          <WarehouseStoreIcon size={13} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>
            {warehouseName} · {dateStr}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Row 1: 3 Metrics Cards (Present, Absent, On Leave) ─── */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>PRESENT</Text>
            <Text style={styles.metricValueGreen}>9</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>ABSENT</Text>
            <Text style={styles.metricValueRed}>2</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>ON LEAVE</Text>
            <Text style={styles.metricValueAmber}>1</Text>
          </View>
        </View>

        {/* ─── Row 2: NOT CHECKED IN Full-width Card ─── */}
        <View style={styles.notCheckedInCard}>
          <Text style={styles.metricLabel}>NOT CHECKED IN</Text>
          <Text style={styles.metricValueBlack}>2</Text>
        </View>

        {/* ─── Blue Info Callout ─── */}
        <View style={styles.blueInfoBox}>
          <Text style={styles.blueInfoText}>
            "Not Checked In" is only shown if the attendance system actually supports that state.
          </Text>
        </View>

        {/* ─── Section: Today's Attendance Progress ─── */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionHeaderTitle}>Today's Attendance</Text>
          {onNavigateToHistory && (
            <TouchableOpacity onPress={onNavigateToHistory} activeOpacity={0.7}>
              <Text style={styles.historyLinkText}>View History →</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>9 / 12 Present</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '75%' }]} />
          </View>
        </View>

        {/* ─── Filter Pills Row ─── */}
        <View style={styles.chipsRow}>
          {(['All', 'Present', 'Absent', 'On Leave'] as const).map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chipBtn, isActive && styles.chipBtnActive]}
                onPress={() => setActiveFilter(chip)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9E9690" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
            placeholderTextColor="#9E9690"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ─── Grouped Section: PRESENT ─── */}
        {(activeFilter === 'All' || activeFilter === 'Present') && presentRecords.length > 0 && (
          <View style={styles.groupSection}>
            <Text style={styles.groupHeading}>PRESENT</Text>
            <View style={styles.groupCard}>
              {presentRecords.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.groupItemRow,
                    idx < presentRecords.length - 1 && styles.groupItemDivider,
                  ]}
                  onPress={onNavigateToHistory}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.staffName}>{item.name}</Text>
                    <Text style={styles.staffRole}>{item.role}</Text>
                  </View>
                  <Text style={styles.checkInTimeText}>{item.checkInTime || '09:00 AM'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ─── Grouped Section: ABSENT ─── */}
        {(activeFilter === 'All' || activeFilter === 'Absent') && absentRecords.length > 0 && (
          <View style={styles.groupSection}>
            <Text style={styles.groupHeading}>ABSENT</Text>
            <View style={styles.groupCard}>
              {absentRecords.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.groupItemRow,
                    idx < absentRecords.length - 1 && styles.groupItemDivider,
                  ]}
                  onPress={onNavigateToHistory}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.staffName}>{item.name}</Text>
                    <Text style={styles.staffRole}>{item.role}</Text>
                  </View>
                  <Text style={styles.statusAbsentText}>Absent</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ─── Grouped Section: ON LEAVE ─── */}
        {(activeFilter === 'All' || activeFilter === 'On Leave') && leaveRecords.length > 0 && (
          <View style={styles.groupSection}>
            <Text style={styles.groupHeading}>ON LEAVE</Text>
            <View style={styles.groupCard}>
              {leaveRecords.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.groupItemRow,
                    idx < leaveRecords.length - 1 && styles.groupItemDivider,
                  ]}
                  onPress={onNavigateToHistory}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.staffName}>{item.name}</Text>
                    <Text style={styles.staffRole}>{item.role}</Text>
                  </View>
                  <Text style={styles.statusLeaveText}>On Leave</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ─── Red Disclaimer Card ─── */}
        <View style={styles.redDisclaimerCard}>
          <ProhibitedCircleIcon size={18} color={PALETTE.redBoxText} />
          <Text style={styles.redDisclaimerText}>
            No Mark Attendance, Edit Attendance, or Approve Attendance actions here — the source only establishes SWA's ability to view team attendance, not edit it.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('Home')}
          android_ripple={{ color: '#F4EFEA', borderless: true }}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('Receiving')}
          android_ripple={{ color: '#F4EFEA', borderless: true }}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('Inventory')}
          android_ripple={{ color: '#F4EFEA', borderless: true }}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange?.('More')}
          android_ripple={{ color: '#F4EFEA', borderless: true }}
        >
          <MoreTabIcon active={true} />
          <Text style={styles.tabLabelActive}>More</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyBtn: {
    padding: 6,
  },
  refreshButton: {
    padding: 6,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  warehousePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  /* 3 Metrics Row */
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValueGreen: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.greenText,
  },
  metricValueRed: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.redText,
  },
  metricValueAmber: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.amberText,
  },
  metricValueBlack: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Not Checked In Card */
  notCheckedInCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 12,
  },

  /* Blue Info Box */
  blueInfoBox: {
    backgroundColor: PALETTE.blueBoxBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBoxBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  blueInfoText: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.blueBoxText,
    lineHeight: 18,
  },

  /* Section Header */
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  historyLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  /* Progress Card */
  progressCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#F3EFEA',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: PALETTE.primary,
    borderRadius: 5,
  },

  /* Filter Chips */
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chipBtnActive: {
    borderColor: PALETTE.primary,
    backgroundColor: '#FFF7ED',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  chipTextActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },

  /* Search Bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },

  /* Group Sections */
  groupSection: {
    marginBottom: 16,
  },
  groupHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A5D3B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  groupCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
  },
  groupItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  groupItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  itemLeft: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  staffRole: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  checkInTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  statusAbsentText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.redText,
  },
  statusLeaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.amberText,
  },

  /* Red Disclaimer */
  redDisclaimerCard: {
    flexDirection: 'row',
    backgroundColor: PALETTE.redBoxBg,
    borderWidth: 1,
    borderColor: PALETTE.redBoxBorder,
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  redDisclaimerText: {
    flex: 1,
    fontSize: 12,
    color: PALETTE.redBoxText,
    lineHeight: 17,
    fontWeight: '500',
  },

  /* Bottom Tab Bar */
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingVertical: 8,
    paddingBottom: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    color: '#9E9690',
    fontWeight: '500',
  },
  tabLabelActive: {
    fontSize: 11,
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
