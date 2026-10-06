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

function SearchIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SlidersIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

export interface HistoryDateEntry {
  dateHeader: string;
  id: string;
  name: string;
  status: 'Present' | 'Absent' | 'On Leave';
  timeRange?: string;
}

const DEMO_HISTORY_ENTRIES: HistoryDateEntry[] = [
  {
    dateHeader: '25 SEP',
    id: 'h-1',
    name: 'Arun Kumar',
    status: 'Present',
    timeRange: '09:02 AM — 06:10 PM',
  },
  {
    dateHeader: '24 SEP',
    id: 'h-2',
    name: 'Arun Kumar',
    status: 'Present',
    timeRange: '09:05 AM — 06:04 PM',
  },
  {
    dateHeader: '23 SEP',
    id: 'h-3',
    name: 'Arun Kumar',
    status: 'On Leave',
  },
  {
    dateHeader: '22 SEP',
    id: 'h-4',
    name: 'Arun Kumar',
    status: 'Present',
    timeRange: '09:00 AM — 06:00 PM',
  },
];

export interface SubWarehouseAttendanceHistoryScreenProps {
  onBack: () => void;
  onNavigateToToday?: () => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
  warehouseName?: string;
}

export function SubWarehouseAttendanceHistoryScreen({
  onBack,
  onNavigateToToday,
  onTabChange,
  warehouseName = 'Coonoor Warehouse',
}: SubWarehouseAttendanceHistoryScreenProps) {
  const [activeRange, setActiveRange] = useState<'Today' | '7 Days' | 'This Month' | 'Custom'>('This Month');
  const [groupBy, setGroupBy] = useState<'Date' | 'Staff'>('Date');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = DEMO_HISTORY_ENTRIES.filter((entry) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return entry.name.toLowerCase().includes(q) || entry.dateHeader.toLowerCase().includes(q);
  });

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

          <Text style={styles.headerTitle}>Attendance History</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── From / To Date Header ─── */}
        <View style={styles.dateRangeHeader}>
          <View style={styles.dateCol}>
            <Text style={styles.dateColLabel}>From</Text>
            <Text style={styles.dateColValue}>01 Sep 2026</Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.dateColLabel}>To</Text>
            <Text style={styles.dateColValue}>25 Sep 2026</Text>
          </View>
        </View>

        {/* ─── Filter Range Pills ─── */}
        <View style={styles.rangeChipsRow}>
          {(['Today', '7 Days', 'This Month', 'Custom'] as const).map((chip) => {
            const isActive = activeRange === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.rangeChipBtn, isActive && styles.rangeChipBtnActive]}
                onPress={() => {
                  setActiveRange(chip);
                  if (chip === 'Today' && onNavigateToToday) {
                    onNavigateToToday();
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.rangeChipText, isActive && styles.rangeChipTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 3 Metrics Cards Row ─── */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>PRESENT</Text>
            <Text style={styles.metricValue}>184</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>ABSENT</Text>
            <Text style={styles.metricValue}>21</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>LEAVE</Text>
            <Text style={styles.metricValue}>15</Text>
          </View>
        </View>

        {/* ─── Segmented Control: Group by Date / Staff ─── */}
        <View style={styles.segmentedWrap}>
          <TouchableOpacity
            style={[styles.segmentBtn, groupBy === 'Date' && styles.segmentBtnActive]}
            onPress={() => setGroupBy('Date')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, groupBy === 'Date' && styles.segmentTextActive]}>
              Group by Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, groupBy === 'Staff' && styles.segmentBtnActive]}
            onPress={() => setGroupBy('Staff')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, groupBy === 'Staff' && styles.segmentTextActive]}>
              Group by Staff
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Search Bar with Sliders Icon ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9E9690" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
            placeholderTextColor="#9E9690"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity activeOpacity={0.7} style={styles.sliderBtn}>
            <SlidersIcon size={18} color="#7A726C" />
          </TouchableOpacity>
        </View>

        {/* ─── Date Grouped History Cards ─── */}
        {filteredEntries.map((item) => (
          <View key={item.id} style={styles.dateGroupWrap}>
            <Text style={styles.dateGroupHeader}>{item.dateHeader}</Text>
            <View style={styles.historyCard}>
              <View style={styles.historyCardLeft}>
                <Text style={styles.staffNameText}>{item.name}</Text>
                <Text style={[styles.statusSubText, item.status === 'On Leave' && styles.statusLeaveSubText]}>
                  {item.status}
                </Text>
              </View>
              {item.timeRange ? (
                <Text style={styles.timeRangeText}>{item.timeRange}</Text>
              ) : null}
            </View>
          </View>
        ))}

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
    minHeight: 44,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  /* From / To Date Header */
  dateRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateCol: {
    flex: 1,
  },
  dateColLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  dateColValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Filter Range Chips */
  rangeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  rangeChipBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeChipBtnActive: {
    borderColor: PALETTE.primary,
    backgroundColor: '#FFF7ED',
  },
  rangeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  rangeChipTextActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },

  /* 3 Metrics Cards Row */
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
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
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Segmented Control */
  segmentedWrap: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFF7ED',
    borderColor: PALETTE.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
  },
  segmentTextActive: {
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
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  sliderBtn: {
    padding: 4,
  },

  /* Date Group Wrap */
  dateGroupWrap: {
    marginBottom: 16,
  },
  dateGroupHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A5D3B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  historyCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyCardLeft: {
    flex: 1,
  },
  staffNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  statusSubText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  statusLeaveSubText: {
    color: PALETTE.amberText,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textInk,
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
