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
  Modal,
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

function WaterDropIcon({ size = 24, color = P.twBlue800 }: { size?: number; color?: string }) {
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

function BugIcon({ size = 24, color = P.twPurple600 }: { size?: number; color?: string }) {
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

function LeafIcon({ size = 24, color = P.twGreen800 }: { size?: number; color?: string }) {
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

function TractorIcon({ size = 24, color = P.twOrange700 }: { size?: number; color?: string }) {
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

function UsersIcon({ size = 14, color = P.twGray700 }: { size?: number; color?: string }) {
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
    color: P.twBlue600,
    bg: P.twBlue50,
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
    color: P.twPurple600,
    bg: P.twPurple100,
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
    color: P.twGreen800,
    bg: P.twGreen50,
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
    color: P.twOrange700,
    bg: P.twOrange50,
    Icon: TractorIcon,
    expanded: false,
    details: {
      method: 'Hand Pick · Grade 1 & 2',
      labour: '4 labour',
      description: 'Morning harvest across Zone 1. Total 85 kg harvested, cleaned, and sorted into crates for dispatch weighing.',
      images: [
        'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80', // green beans harvest
        'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400&q=80', // crates in field
      ],
    },
  },
];

const FIELDS_OPTIONS = ['All fields', 'Zone 1 — Upper Field', 'Zone 2 — Lower Slope', 'Zone 3 — Terrace'];
const CROPS_OPTIONS = ['All crops', 'Tomato', 'Carrot', 'Beans'];

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

export function FarmDiaryScreen({
  onBack,
  onNavigateToNewEntry,
  onNavigateToCalendar: _onNavigateToCalendar,
}: FarmDiaryScreenProps): React.JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 6, 16));
  const [selectedField, setSelectedField] = useState<string>('All fields');
  const [selectedCrop, setSelectedCrop] = useState<string>('All crops');
  const [expandedId, setExpandedId] = useState<string | null>('1');

  // Filter Modals
  const [isFieldPickerOpen, setIsFieldPickerOpen] = useState<boolean>(false);
  const [isCropPickerOpen, setIsCropPickerOpen] = useState<boolean>(false);

  // Dynamic Date Picker Modal State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date(2026, 6, 16));
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(6);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState<boolean>(false);

  const fieldOptions = [
    'All fields',
    'Zone 1 — Upper Field',
    'Zone 2 — Lower Slope',
    'Zone 3 — Terrace',
  ];

  const cropOptions = [
    'All crops',
    'Tomato',
    'Carrot',
    'Beans',
    'Potato',
  ];

  const openDatePicker = () => {
    setCalendarDate(new Date(selectedDate));
    setCalendarYear(selectedDate.getFullYear());
    setCalendarMonth(selectedDate.getMonth());
    setIsYearPickerOpen(false);
    setIsDatePickerOpen(true);
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleConfirmDate = () => {
    setSelectedDate(new Date(calendarDate));
    setIsDatePickerOpen(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Compute entries for current date & filter
  const dayKey = selectedDate.getDate();
  const dayEntries: DiaryEntryItem[] =
    DIARY_ENTRIES_BY_DAY[dayKey] ||
    (dayKey === 16
      ? BASE_ENTRIES
      : [
        {
          id: `d-${dayKey}-1`,
          type: 'Field inspection',
          crop: 'Tomato',
          zone: 'Zone 2 — Lower Slope',
          time: '08:00 AM',
          duration: '35m',
          color: P.twBlue700,
          bg: P.twBlue50,
          Icon: WaterDropIcon,
          expanded: false,
        },
        {
          id: `d-${dayKey}-2`,
          type: 'Weeding',
          crop: 'Carrot',
          zone: 'Zone 3 — Terrace',
          time: '10:15 AM',
          duration: '45m',
          color: P.twGreen800,
          bg: P.twGreen50,
          Icon: LeafIcon,
          expanded: false,
        },
      ]);

  const filteredEntries = dayEntries.filter((entry) => {
    const matchField =
      selectedField === 'All fields' ||
      entry.zone.toLowerCase().includes(selectedField.toLowerCase()) ||
      selectedField.toLowerCase().includes(entry.zone.toLowerCase());
    const matchCrop =
      selectedCrop === 'All crops' ||
      entry.crop.toLowerCase() === selectedCrop.toLowerCase();
    return matchField && matchCrop;
  });

  const timeLogged = computeTotalTime(filteredEntries);
  const fieldsCovered = new Set(filteredEntries.map((e) => e.zone)).size;
  const formattedFullDate = `${DAYS_FULL[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTHS_FULL[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

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
            style={[styles.filterBtn, selectedField !== 'All fields' && styles.filterBtnActive]}
            activeOpacity={0.75}
            onPress={() => setIsFieldPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Filter by field"
          >
            <Text style={[styles.filterBtnText, selectedField !== 'All fields' && styles.filterBtnTextActive]} numberOfLines={1}>
              {selectedField}
            </Text>
            <ChevronDownIcon size={16} color={selectedField !== 'All fields' ? P.deepGreen : P.twGray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, selectedCrop !== 'All crops' && styles.filterBtnActive]}
            activeOpacity={0.75}
            onPress={() => setIsCropPickerOpen(true)}
          >
            <Text style={[styles.filterBtnText, selectedCrop !== 'All crops' && styles.filterBtnTextActive]}>
              {selectedCrop}
            </Text>
            <ChevronDownIcon
              size={16}
              color={selectedCrop !== 'All crops' ? P.deepGreen : P.twGray400}
            />
          </TouchableOpacity>
        </View>

        {/* ── Section Title ── */}
        <Text style={styles.sectionTitle}>TODAY'S ENTRIES</Text>

        {/* ── Entries List or Empty State ── */}
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No diary entries found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedField !== 'All fields' || selectedCrop !== 'All crops'
                ? 'Try changing or clearing your filters to see more entries.'
                : 'No activities logged for this date yet.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={onNavigateToNewEntry}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyActionText}>+ Add entry for this day</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {filteredEntries.map((entry) => {
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
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Floating Action Button ── */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={onNavigateToNewEntry}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>New entry</Text>
      </TouchableOpacity>

      {/* ── Field Filter Modal ── */}
      <Modal
        visible={isFieldPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFieldPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsFieldPickerOpen(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Field</Text>
              <TouchableOpacity
                onPress={() => setIsFieldPickerOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CloseIcon size={18} color={P.twGray400} />
              </TouchableOpacity>
            </View>
            {fieldOptions.map((opt) => {
              const isSelected = selectedField === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                  onPress={() => {
                    setSelectedField(opt);
                    setIsFieldPickerOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                    {opt}
                  </Text>
                  {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ── Crop Filter Modal ── */}
      <Modal
        visible={isCropPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCropPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsCropPickerOpen(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Crop</Text>
              <TouchableOpacity
                onPress={() => setIsCropPickerOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CloseIcon size={18} color={P.twGray400} />
              </TouchableOpacity>
            </View>
            {cropOptions.map((opt) => {
              const isSelected = selectedCrop === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                  onPress={() => {
                    setSelectedCrop(opt);
                    setIsCropPickerOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                    {opt}
                  </Text>
                  {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ── Dynamic Calendar Modal (Before Calendar Style) ── */}
      <Modal
        visible={isDatePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDatePickerOpen(false)}
      >
        <View style={styles.calModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsDatePickerOpen(false)}
          />
          <View style={styles.calModalCard}>
            {/* Header */}
            <View style={styles.calHeader}>
              <Text style={styles.calFieldBadge}>Select Diary Date</Text>
              <Text style={styles.calSelectedDateTitle}>
                {calendarDate.getDate()} {MONTHS_FULL[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </Text>
            </View>

            {/* Navigation Row */}
            <View style={styles.calMonthNav}>
              <TouchableOpacity
                style={styles.calNavBtn}
                onPress={handlePrevMonth}
                accessibilityLabel="Previous month"
              >
                <ChevronLeftIcon size={18} color={P.deepGreen} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.calMonthYearBtn}
                onPress={() => setIsYearPickerOpen(!isYearPickerOpen)}
                activeOpacity={0.75}
              >
                <Text style={styles.calMonthYearLabel}>
                  {MONTHS_FULL[calendarMonth]} {calendarYear}
                </Text>
                <ChevronDownIcon size={14} color={P.deepGreen} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.calNavBtn}
                onPress={handleNextMonth}
                accessibilityLabel="Next month"
              >
                <ChevronRightIcon size={18} color={P.deepGreen} />
              </TouchableOpacity>
            </View>

            {/* Year Quick Selector View */}
            {isYearPickerOpen ? (
              <View style={styles.yearGridContainer}>
                <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={true}>
                  <View style={styles.yearGrid}>
                    {Array.from({ length: 75 }).map((_, i) => {
                      const y = 2026 - i;
                      const isSel = calendarYear === y;
                      return (
                        <TouchableOpacity
                          key={`yr-${y}`}
                          style={[styles.yearChip, isSel && styles.yearChipActive]}
                          onPress={() => {
                            setCalendarYear(y);
                            setCalendarDate(
                              new Date(
                                y,
                                calendarMonth,
                                Math.min(
                                  calendarDate.getDate(),
                                  new Date(y, calendarMonth + 1, 0).getDate(),
                                ),
                              ),
                            );
                            setIsYearPickerOpen(false);
                          }}
                        >
                          <Text style={[styles.yearChipText, isSel && styles.yearChipTextActive]}>
                            {y}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ) : (
              <>
                {/* Weekdays Row */}
                <View style={styles.calWeekdaysRow}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => (
                    <Text key={`${dayName}-${idx}`} style={styles.calWeekdayText}>
                      {dayName}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.calDaysGrid}>
                  {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }).map((_, idx) => (
                    <View key={`empty-${idx}`} style={styles.calDayCellEmpty} />
                  ))}
                  {Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }).map((_, idx) => {
                    const day = idx + 1;
                    const isSelected =
                      calendarDate.getFullYear() === calendarYear &&
                      calendarDate.getMonth() === calendarMonth &&
                      calendarDate.getDate() === day;
                    const isToday =
                      new Date().getFullYear() === calendarYear &&
                      new Date().getMonth() === calendarMonth &&
                      new Date().getDate() === day;
                    const hasEntries = DIARY_ENTRIES_BY_DAY[day] !== undefined || day === 16;

                    return (
                      <TouchableOpacity
                        key={`day-${day}`}
                        style={styles.calDayCell}
                        onPress={() => setCalendarDate(new Date(calendarYear, calendarMonth, day))}
                      >
                        <View
                          style={[
                            styles.calDayInner,
                            isSelected && styles.calDayInnerSelected,
                            !isSelected && isToday && styles.calDayInnerToday,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calDayText,
                              isSelected && styles.calDayTextSelected,
                              !isSelected && isToday && styles.calDayTextToday,
                            ]}
                          >
                            {day}
                          </Text>
                          {hasEntries && !isSelected && (
                            <View style={styles.calEntryDot} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Actions */}
            <View style={styles.calFooterActions}>
              <TouchableOpacity
                style={styles.calCancelBtn}
                onPress={() => setIsDatePickerOpen(false)}
              >
                <Text style={styles.calCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calApplyBtn}
                onPress={handleConfirmDate}
              >
                <Text style={styles.calApplyBtnText}>Apply Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Dropdown Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: P.nearBlack,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  modalOptionText: {
    fontSize: 15,
    color: P.twGray700,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: P.twGreen800,
  },

  // Calendar Modal
  calModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: P.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  calHeader: {
    borderBottomWidth: 1,
    borderColor: P.twGray100,
    paddingBottom: 14,
    marginBottom: 14,
  },
  calFieldBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.brandGreen,
    marginBottom: 4,
  },
  calSelectedDateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.nearBlack,
  },
  calMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: P.twGray100,
  },
  calMonthYearLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: P.deepGreen,
  },
  yearGridContainer: {
    height: 220,
  },
  yearScrollView: {
    flex: 1,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: P.twGray100,
    borderWidth: 1,
    borderColor: P.twGray200,
    minWidth: 62,
    alignItems: 'center',
  },
  yearChipActive: {
    backgroundColor: P.deepGreen,
    borderColor: P.deepGreen,
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray800,
  },
  yearChipTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  calWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calWeekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray400,
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCellEmpty: {
    width: '14.28%',
    height: 40,
  },
  calDayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calDayInnerSelected: {
    backgroundColor: P.deepGreen,
  },
  calDayInnerToday: {
    borderWidth: 1.5,
    borderColor: P.twGreen700,
  },
  calDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray800,
  },
  calDayTextSelected: {
    fontWeight: '700',
    color: P.white,
  },
  calDayTextToday: {
    color: P.twGreen700,
    fontWeight: '700',
  },
  calEntryDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brandGreen,
  },
  calFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: P.twGray200,
  },
  calCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: P.white,
  },
  calCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  calApplyBtn: {
    flex: 1.4,
    backgroundColor: P.deepGreen,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  calApplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.white,
  },
});
