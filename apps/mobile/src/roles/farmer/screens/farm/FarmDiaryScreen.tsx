import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// ── Icons ────────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 20, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="14" x2="16" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="18" x2="12" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 20, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 20, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WaterDropIcon({ size = 24, color = '#1E40AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a7 7 0 007-7c0-2-3-7.5-7-11-4 3.5-7 9-7 11a7 7 0 007 7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BugIcon({ size = 24, color = '#6B21A8' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20a6 6 0 006-6V9a6 6 0 10-12 0v5a6 6 0 006 6z M12 3v1 M7 6l-2-2 M17 6l2-2 M3 11h2 M19 11h2 M5 16l-2 2 M19 16l2 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LeafIcon({ size = 24, color = '#166534' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C12 22 4 16 4 10a6 6 0 0112 0c0 1.5-.5 3-1.5 4M12 22c0 0 8-6 8-12a6 6 0 00-12 0c0 1.5.5 3 1.5 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 22v-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TractorIcon({ size = 24, color = '#9A3412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="16" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="17" cy="16" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M4 16H2V9h5v7M9 16h5 M14 9h7v7 M9 9h5v7 M14 12h7 M14 9l2-4h3l2 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UsersIcon({ size = 14, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Date Helpers ─────────────────────────────────────────────────────────────

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface DiaryEntryItem {
  id: string;
  type: string;
  crop: string;
  zone: string;
  time: string;
  duration: string;
  color: string;
  bg: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  expanded?: boolean;
  details?: {
    method: string;
    labour: string;
    description: string;
    images: string[];
  };
}

// ── Data ─────────────────────────────────────────────────────────────────────

const BASE_ENTRIES: DiaryEntryItem[] = [
  {
    id: '1',
    type: 'Irrigation',
    crop: 'Tomato',
    zone: 'Zone 2 — Lower Slope',
    time: '07:10 AM',
    duration: '45m',
    color: '#3B82F6', // twBlue500
    bg: '#EFF6FF', // twBlue50
    Icon: WaterDropIcon,
    expanded: true,
    details: {
      method: 'Method - Drip',
      labour: '2 labour',
      description: 'Morning drip cycle on the lower beds; checked emitters on rows 4-7, two were clogged and cleared.',
      images: [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80',
        'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400&q=80',
      ],
    },
  },
  {
    id: '2',
    type: 'Pest scouting',
    crop: 'Tomato',
    zone: 'Zone 2 — Lower Slope',
    time: '08:30 AM',
    duration: '20m',
    color: '#9333EA', // twPurple600
    bg: '#FAF5FF', // twPurple50
    Icon: BugIcon,
    expanded: false,
  },
  {
    id: '3',
    type: 'Manure application',
    crop: 'Carrot',
    zone: 'Zone 3 — Terrace',
    time: '11:00 AM',
    duration: '1h 15m',
    color: '#166534', // twGreen800
    bg: '#F0FDF4', // twGreen50
    Icon: LeafIcon,
    expanded: false,
  },
  {
    id: '4',
    type: 'Harvesting',
    crop: 'Beans',
    zone: 'Zone 1 — Upper Field',
    time: '02:15 PM',
    duration: '1h',
    color: '#C2410C', // twOrange700
    bg: '#FFF7ED', // twOrange50
    Icon: TractorIcon,
    expanded: false,
  },
];

const DIARY_ENTRIES_BY_DAY: Record<number, DiaryEntryItem[]> = {
  16: BASE_ENTRIES,
  12: [
    {
      id: '12-1',
      type: 'Irrigation',
      crop: 'Tomato',
      zone: 'Zone 2 — Lower Slope',
      time: '07:30 AM',
      duration: '45m',
      color: P.twBlue700,
      bg: P.twBlue50,
      Icon: WaterDropIcon,
      expanded: true,
      details: {
        method: 'Method - Drip',
        labour: '1 labour',
        description: 'Scheduled regular irrigation cycle for tomato zone.',
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80'],
      },
    },
    {
      id: '12-2',
      type: 'Weeding',
      crop: 'Carrot',
      zone: 'Zone 3 — Terrace',
      time: '10:00 AM',
      duration: '1h',
      color: P.twGreen800,
      bg: P.twGreen50,
      Icon: LeafIcon,
      expanded: false,
    },
  ],
  15: [
    {
      id: '15-1',
      type: 'Manure application',
      crop: 'Carrot',
      zone: 'Zone 3 — Terrace',
      time: '09:00 AM',
      duration: '1h 15m',
      color: P.twGreen800,
      bg: P.twGreen50,
      Icon: LeafIcon,
      expanded: false,
    },
  ],
  14: [
    {
      id: '14-1',
      type: 'Pest scouting',
      crop: 'Tomato',
      zone: 'Zone 2 — Lower Slope',
      time: '08:00 AM',
      duration: '30m',
      color: P.deepPurple600,
      bg: P.violetTint,
      Icon: BugIcon,
      expanded: false,
    },
  ],
};

function computeTotalTime(entries: DiaryEntryItem[]): string {
  let totalMinutes = 0;
  for (const e of entries) {
    if (e.duration.includes('h') && e.duration.includes('m')) {
      const parts = e.duration.split('h');
      const hStr = parts[0];
      const mStr = parts[1];
      const h = parseInt(hStr || '0', 10);
      const m = parseInt((mStr || '').replace('m', '').trim() || '0', 10);
      totalMinutes += h * 60 + m;
    } else if (e.duration.includes('h')) {
      const h = parseInt(e.duration.replace('h', '').trim(), 10);
      totalMinutes += h * 60;
    } else if (e.duration.includes('m')) {
      const m = parseInt(e.duration.replace('m', '').trim(), 10);
      totalMinutes += m;
    }
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  if (mins > 0) return `${mins}m`;
  return '0m';
}

// ── Component ────────────────────────────────────────────────────────────────

interface FarmDiaryScreenProps {
  onBack?: () => void;
  onNavigateToNewEntry?: () => void;
  onNavigateToCalendar?: () => void;
}

export function FarmDiaryScreen({ onBack, onNavigateToNewEntry, onNavigateToCalendar }: FarmDiaryScreenProps): React.JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>('1');
  const [selectedField, setSelectedField] = useState<string>('All fields');
  const [selectedCrop, setSelectedCrop] = useState<string>('All crops');
  const [filterModalVisible, setFilterModalVisible] = useState<'field' | 'crop' | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredEntries = ENTRIES.filter((entry) => {
    const matchesField =
      selectedField === 'All fields' ||
      entry.zone.toLowerCase().includes(selectedField.toLowerCase()) ||
      selectedField.toLowerCase().includes(entry.zone.toLowerCase());
    const matchesCrop =
      selectedCrop === 'All crops' ||
      entry.crop.toLowerCase() === selectedCrop.toLowerCase();
    return matchesField && matchesCrop;
  });

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={P.deepGreen} />

      {/* ── Top Green Header ── */}
      <View style={styles.topHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerTitleCol}
            onPress={openDatePicker}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Change diary date"
          >
            <Text style={styles.headerTitle}>Farm Diary</Text>
            <View style={styles.headerSubtitleRow}>
              <Text style={styles.headerSubtitle}>{formattedFullDate}</Text>
              <ChevronDownIcon size={14} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.calendarBtn}
            activeOpacity={0.7}
            onPress={openDatePicker}
            accessibilityRole="button"
            accessibilityLabel="Open diary calendar"
          >
            <CalendarIcon size={22} color={P.white} />
          </TouchableOpacity>
        </View>

        {/* 3 Summary Stats Cards */}
        <View style={styles.summaryStatsRow}>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatNumber}>4</Text>
            <Text style={styles.summaryStatLabel}>Entries today</Text>
          </View>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatNumber}>{timeLogged}</Text>
            <Text style={styles.summaryStatLabel}>Time logged</Text>
          </View>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatNumber}>3</Text>
            <Text style={styles.summaryStatLabel}>Fields covered</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Filters Row (Interactive Dropdowns) ── */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.7}
            onPress={() => setFilterModalVisible('field')}
            accessibilityRole="button"
            accessibilityLabel="Filter by field"
          >
            <Text style={styles.filterBtnText} numberOfLines={1}>{selectedField}</Text>
            <ChevronDownIcon size={16} color={P.twGray400} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.7}
            onPress={() => setFilterModalVisible('crop')}
            accessibilityRole="button"
            accessibilityLabel="Filter by crop"
          >
            <Text style={styles.filterBtnText} numberOfLines={1}>{selectedCrop}</Text>
            <ChevronDownIcon size={16} color={P.twGray400} />
          </TouchableOpacity>
        </View>

        {/* ── Section Title ── */}
        <Text style={styles.sectionTitle}>TODAY'S ENTRIES</Text>

        <View style={styles.entriesList}>
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyEntriesBox}>
              <Text style={styles.emptyEntriesText}>No entries match the selected filters.</Text>
            </View>
          ) : (
            filteredEntries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.entryCard, isExpanded && styles.entryCardExpanded]}
                  activeOpacity={0.9}
                  onPress={() => toggleExpand(entry.id)}
                >
                  <View style={styles.entryHeaderRow}>
                    <View style={[styles.entryIconBox, { backgroundColor: entry.bg }]}>
                      <entry.Icon size={24} color={entry.color} />
                    </View>
                    <View style={styles.entryTitleCol}>
                      <Text style={styles.entryTitle}>
                        {entry.type} · {entry.crop}
                      </Text>
                      <Text style={styles.entrySubtitle}>
                        {entry.zone} · {entry.time}
                      </Text>
                    </View>
                    <View style={styles.entryRightCol}>
                      <Text style={[styles.entryDuration, isExpanded && styles.entryDurationActive]}>
                        {entry.duration}
                      </Text>
                      {isExpanded ? (
                        <ChevronUpIcon size={20} color={P.twGray400} />
                      ) : (
                        <ChevronDownIcon size={20} color={P.twGray400} />
                      )}
                    </View>
                  </View>

                  {isExpanded && entry.details && (
                    <View style={styles.entryDetails}>
                      <View style={styles.pillsRow}>
                        <View style={styles.detailPill}>
                          <Text style={styles.detailPillText}>{entry.details.method}</Text>
                        </View>
                        <View style={styles.detailPill}>
                          <UsersIcon size={12} color={P.twGray600} />
                          <Text style={styles.detailPillText}>{entry.details.labour}</Text>
                        </View>
                      </View>
                      <Text style={styles.entryDesc}>{entry.details.description}</Text>
                      <View style={styles.imagesRow}>
                        {entry.details.images.map((img, idx) => (
                          <Image key={idx} source={{ uri: img }} style={styles.detailImage} />
                        ))}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Filter Modal for Fields / Crops */}
      <Modal
        visible={filterModalVisible !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {filterModalVisible === 'field' ? 'Select Field' : 'Select Crop'}
            </Text>
            {(filterModalVisible === 'field' ? FIELDS_OPTIONS : CROPS_OPTIONS).map((opt) => {
              const isActive = filterModalVisible === 'field' ? selectedField === opt : selectedCrop === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={styles.modalOption}
                  onPress={() => {
                    if (filterModalVisible === 'field') setSelectedField(opt);
                    if (filterModalVisible === 'crop') setSelectedCrop(opt);
                    setFilterModalVisible(null);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isActive && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- FAB --- */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={onNavigateToNewEntry}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>New entry</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  topHeader: {
    backgroundColor: P.deepGreen,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: P.white,
    letterSpacing: -0.3,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  calendarBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  summaryStatNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: P.white,
    marginBottom: 2,
  },
  summaryStatLabel: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterBtn: {
    flex: 1,
    height: 44,
    backgroundColor: P.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  filterBtnActive: {
    borderColor: P.deepGreen,
    backgroundColor: P.twGreen50,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  filterBtnTextActive: {
    color: P.deepGreen,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  entryCardExpanded: {
    borderColor: P.twGray300,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  entryTitleCol: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: P.twGray900,
  },
  entrySubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 4,
  },
  entryRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGreen700,
  },
  entryDurationActive: {
    color: P.twGreen700,
  },
  entryDetails: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    paddingTop: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.twGray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.twGray700,
  },
  entryDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: P.twGray600,
    marginBottom: 16,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: P.twGray200,
  },
  emptyCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: P.twGray500,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: P.twGreen50,
    borderWidth: 1,
    borderColor: P.twGreen100,
  },
  emptyActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.deepGreen,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twGreen700,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: P.twGreen800,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  fabIcon: {
    fontSize: 22,
    fontWeight: '600',
    color: P.white,
    lineHeight: 24,
    marginTop: -2,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
  emptyEntriesBox: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
  },
  emptyEntriesText: {
    fontSize: 14,
    color: P.twGray500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalOptionText: {
    fontSize: 14,
    color: P.twGray700,
  },
  modalOptionTextActive: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
});
