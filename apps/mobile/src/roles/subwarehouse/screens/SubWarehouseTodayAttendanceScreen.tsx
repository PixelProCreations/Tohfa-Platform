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

function HistoryClockIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

function CircleIcon({ size = 8, color = '#10B981' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} />
    </Svg>
  );
}

function FilterLinesIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
    checkOutTime: '06:10 PM',
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
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
  warehouseName?: string;
  dateStr?: string;
  onNavigateToHistory?: () => void;
}

export function SubWarehouseTodayAttendanceScreen({
  onBack,
  onTabChange,
  warehouseName = 'Coonoor Warehouse',
  dateStr = '25 Sep 2026',
  onNavigateToHistory,
}: SubWarehouseTodayAttendanceScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Present' | 'Absent' | 'On Leave'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const filteredRecords = INITIAL_TODAY_RECORDS.filter((rec) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || rec.name.toLowerCase().includes(q) || rec.role.toLowerCase().includes(q);
    const matchesFilter = activeFilter === 'All' || rec.status === activeFilter;
    return matchesQuery && matchesFilter;
  });

  const handleBack = () => {
    if (selectedRecord) {
      setSelectedRecord(null);
    } else {
      onBack();
    }
  };

  const renderList = () => (
    <>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Row 1: 4 Metrics Cards ─── */}
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
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>TOTAL</Text>
            <Text style={styles.metricValueBlack}>12</Text>
          </View>
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9E9690" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employee..."
            placeholderTextColor="#9E9690"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity activeOpacity={0.7} style={styles.filterBtn}>
            <FilterLinesIcon size={18} color="#9E9690" />
          </TouchableOpacity>
        </View>

        {/* ─── Unified Employee List ─── */}
        <View style={styles.groupCard}>
          {filteredRecords.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.groupItemRow,
                idx < filteredRecords.length - 1 && styles.groupItemDivider,
              ]}
              onPress={() => setSelectedRecord(item)}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                <Text style={styles.staffName}>{item.name}</Text>
                <Text style={styles.staffRole}>{item.role}</Text>
              </View>
              <View style={styles.itemRight}>
                <View style={styles.statusRow}>
                  <CircleIcon size={8} color={item.status === 'Present' ? PALETTE.greenDot : item.status === 'Absent' ? PALETTE.redDot : PALETTE.amberText} />
                  <Text style={[styles.statusText]}>
                    {item.status}
                  </Text>
                </View>
                {item.status === 'Present' && item.checkInTime && <Text style={styles.timeText}>{item.checkInTime}</Text>}
                <Text style={styles.dateText}>{dateStr}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    </>
  );

  const renderDetail = (record: AttendanceRecord) => (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.detailSectionTitle}>Attendance Detail</Text>
      <View style={styles.detailCard}>
        <View style={styles.detailRowTwoCol}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{dateStr}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Employee</Text>
            <Text style={styles.detailValue}>{record.name}</Text>
          </View>
        </View>
        <View style={styles.detailRowTwoCol}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Role</Text>
            <Text style={styles.detailValue}>{record.role}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{record.status}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.detailSectionTitle}>Time</Text>
      <View style={styles.detailCard}>
        <View style={styles.detailRowTwoCol}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Check-in</Text>
            <Text style={styles.detailValue}>{record.checkInTime || '--'}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Check-out</Text>
            <Text style={styles.detailValue}>{record.checkOutTime || '--'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.detailSectionTitle}>Timeline</Text>
      <View style={styles.timelineContainer}>
        {/* Check-in Node */}
        <View style={styles.timelineRow}>
          <View style={styles.timelineNodeCol}>
            <View style={styles.timelineRing}>
              <View style={styles.timelineInnerDot} />
            </View>
            <View style={styles.timelineLine} />
          </View>
          <View style={styles.timelineTextCol}>
            <Text style={styles.timelineTitle}>Check-in</Text>
            {record.checkInTime && <Text style={styles.timelineTime}>{record.checkInTime}</Text>}
          </View>
        </View>

        {/* Workday Node */}
        <View style={styles.timelineRow}>
          <View style={styles.timelineNodeCol}>
            <View style={styles.timelineRing}>
              <View style={styles.timelineInnerDot} />
            </View>
            <View style={styles.timelineLine} />
          </View>
          <View style={styles.timelineTextCol}>
            <Text style={styles.timelineTitle}>Workday</Text>
          </View>
        </View>

        {/* Check-out Node */}
        <View style={styles.timelineRow}>
          <View style={styles.timelineNodeCol}>
            <View style={styles.timelineRing}>
              <View style={styles.timelineInnerDot} />
            </View>
          </View>
          <View style={styles.timelineTextCol}>
            <Text style={styles.timelineTitle}>Check-out</Text>
            {record.checkOutTime && <Text style={styles.timelineTime}>{record.checkOutTime}</Text>}
          </View>
        </View>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Today's Attendance</Text>

          <View style={styles.headerActions}>
            {onNavigateToHistory && (
              <TouchableOpacity
                style={styles.refreshButton}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={onNavigateToHistory}
              >
                <HistoryClockIcon size={20} color="#FFFFFF" />
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
        <View style={styles.warehousePill}>
          <WarehouseStoreIcon size={13} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>
            {warehouseName} · {dateStr}
          </Text>
        </View>
      </View>

      {selectedRecord ? renderDetail(selectedRecord) : renderList()}
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
  filterBtn: {
    padding: 4,
  },

  /* Group Sections */
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
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  staffRole: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A16207', /* Amber 700ish color */
    marginTop: 2,
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

  // ─── Detail View Styles ───
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 10,
    marginTop: 10,
  },
  detailCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  detailRowTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // ─── Timeline ───
  timelineContainer: {
    marginTop: 8,
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineNodeCol: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF7F2',
    zIndex: 2,
    marginTop: 2,
  },
  timelineInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#EBE5DC',
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
    minHeight: 36,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
});
