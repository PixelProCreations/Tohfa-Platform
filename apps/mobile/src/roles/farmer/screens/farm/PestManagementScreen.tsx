import React, { useState } from 'react';
import {
  Alert,
  Image,
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';
import { PestLibraryScreen } from './PestLibraryScreen';
import { TreatmentScheduleScreen } from './TreatmentScheduleScreen';
import { WeatherRiskAnalyticsScreen } from './WeatherRiskAnalyticsScreen';

// ── Vector Icons ─────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

function PestBugIcon({ size = 24, color = P.red600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 7.5a3 3 0 0 1 6 0v0.5H9V7.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M8 4L6.5 2M16 4l1.5-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="7" y="8" width="10" height="11" rx="5" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="11" x2="12" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="15" r="1.2" fill={color} />
      <Path
        d="M7 11.5H3.5M20.5 11.5H17M7 15H3.5M20.5 15H17M7 18.5l-3 1.5M20 20l-3-1.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BookLibraryIcon({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarScheduleIcon({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 14v4M10 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WeatherAnalyticsIcon({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 17l6-6 4 4 8-8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 7h4v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon({ size = 26, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 16, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = P.googleBlue }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface DetectionItem {
  id: string;
  name: string;
  scientificName: string;
  crop: string;
  zone: string;
  date: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Ongoing' | 'Resolved' | 'Recurring';
  referenceTreatments: Array<{ name: string; notes: string }>;
  treatmentHistory: Array<{ treatment: string; date: string }>;
}

export interface PestManagementScreenProps {
  onBack?: () => void;
  onNavigateToSchedule?: () => void;
  onNavigateToPestLibrary?: () => void;
  onNavigateToWeatherRisk?: () => void;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

function formatDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

const INITIAL_DETECTIONS: DetectionItem[] = [
  {
    id: 'det-1',
    name: 'Aphids',
    scientificName: 'Aphidoidea',
    crop: 'Carrot — Nantes',
    zone: 'Zone 1',
    date: '15 Jul 2026',
    severity: 'Medium',
    status: 'Ongoing',
    referenceTreatments: [
      { name: 'Neem Oil Spray', notes: 'Foliar application, repeat every 5-7 days' },
      { name: 'Ladybird Release', notes: 'Biological control — natural predator' },
    ],
    treatmentHistory: [
      { treatment: 'Neem Oil Spray applied', date: '16 Jul 2026' },
    ],
  },
  {
    id: 'det-2',
    name: 'Powdery Mildew',
    scientificName: 'Erysiphales',
    crop: 'Beetroot',
    zone: 'Zone 2',
    date: '12 Jul 2026',
    severity: 'High',
    status: 'Recurring',
    referenceTreatments: [
      { name: 'Baking Soda Solution', notes: 'Spray affected leaves weekly' },
      { name: 'Sulfur Dusting', notes: 'Certified organic fungicide application' },
    ],
    treatmentHistory: [
      { treatment: 'Baking Soda Solution applied', date: '13 Jul 2026' },
    ],
  },
  {
    id: 'det-3',
    name: 'Caterpillar',
    scientificName: 'Pieris brassicae',
    crop: 'Cabbage',
    zone: 'Zone 3',
    date: '03 Jul 2026',
    severity: 'Low',
    status: 'Resolved',
    referenceTreatments: [
      { name: 'Bacillus thuringiensis (Bt)', notes: 'Natural biological insecticide' },
      { name: 'Handpicking & Netting', notes: 'Physical barrier protection' },
    ],
    treatmentHistory: [
      { treatment: 'Handpicking & Netting completed', date: '04 Jul 2026' },
    ],
  },
];

export function PestManagementScreen({
  onBack,
  onNavigateToSchedule,
  onNavigateToPestLibrary,
  onNavigateToWeatherRisk,
}: PestManagementScreenProps): React.JSX.Element {
  // Navigation view: 'hub' | 'log' | 'detail' | 'library' | 'schedule' | 'weatherRisk'
  const [currentView, setCurrentView] = useState<'hub' | 'log' | 'detail' | 'library' | 'schedule' | 'weatherRisk'>('hub');
  const [selectedDetection, setSelectedDetection] = useState<DetectionItem>(INITIAL_DETECTIONS[0]!);
  const [detections, setDetections] = useState<DetectionItem[]>(INITIAL_DETECTIONS);
  const [filterTab, setFilterTab] = useState<'All' | 'Ongoing' | 'Resolved' | 'Recurring'>('All');

  // Report Modal State
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [newCropZone, setNewCropZone] = useState('Carrot — Nantes, Zone 1');
  const [isCropPickerOpen, setIsCropPickerOpen] = useState(false);
  const [newPestType, setNewPestType] = useState('Aphids');
  const [newSeverity, setNewSeverity] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [newDate, setNewDate] = useState('18 Sep 2026');
  const [newNotes, setNewNotes] = useState('');

  // Calendar Modal for Date Detected
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(2026, 8, 18));
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(8);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const cropZoneOptions = [
    'Carrot — Nantes, Zone 1',
    'Beetroot, Zone 2',
    'Cabbage, Zone 3',
    'Tomato, Zone 2',
    'Beans, Zone 1',
  ];

  const handleSaveDetection = () => {
    if (!newPestType.trim()) {
      Alert.alert('Required Field', 'Please enter or select a pest type.');
      return;
    }

    const created: DetectionItem = {
      id: `det-${Date.now()}`,
      name: newPestType.trim(),
      scientificName: `${newPestType.trim()} spp.`,
      crop: newCropZone.split(',')[0]?.trim() || newCropZone,
      zone: newCropZone.split(',')[1]?.trim() || 'Zone 1',
      date: newDate,
      severity: newSeverity,
      status: 'Ongoing',
      referenceTreatments: [
        { name: 'Neem Oil Foliar Spray', notes: 'Apply every 5-7 days until resolved' },
        { name: 'Targeted Biological Control', notes: 'Monitor affected foliage daily' },
      ],
      treatmentHistory: [],
    };

    setDetections([created, ...detections]);
    setIsReportModalVisible(false);
    setSelectedDetection(created);
    setCurrentView('log');
    Alert.alert('Detection Reported', `${created.name} detection has been logged successfully.`);
  };

  const handleToggleResolved = () => {
    const nextStatus: 'Ongoing' | 'Resolved' =
      selectedDetection.status === 'Resolved' ? 'Ongoing' : 'Resolved';
    const updated: DetectionItem = { ...selectedDetection, status: nextStatus };
    setSelectedDetection(updated);
    setDetections(detections.map((d) => (d.id === updated.id ? updated : d)));
    Alert.alert(
      nextStatus === 'Resolved' ? 'Marked as Resolved' : 'Reopened Detection',
      `Status updated to ${nextStatus}.`,
    );
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

  const handleApplyCalendarDate = () => {
    setNewDate(formatDisplayDate(calendarDate));
    setIsCalendarOpen(false);
  };

  const activeCount = detections.filter((d) => d.status === 'Ongoing' || d.status === 'Recurring').length;
  const resolvedCount = detections.filter((d) => d.status === 'Resolved').length;

  const filteredDetections = detections.filter((d) => {
    if (filterTab === 'All') return true;
    return d.status === filterTab;
  });

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 1: PEST MANAGEMENT HUB (Screenshots 1 & 2)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'hub' && (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.hubScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header with back button */}
            <View style={styles.hubHeaderRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <ArrowBackIcon size={20} color={P.deepGreen} />
              </TouchableOpacity>
            </View>

            {/* Central Icon & Title */}
            <View style={styles.hubTitleSection}>
              <View style={styles.hubIconBadge}>
                <PestBugIcon size={28} color={colors.brandGreen} />
              </View>
              <Text style={styles.hubMainTitle}>Pest Management</Text>
              <Text style={styles.hubSubtitle}>
                Detection log, pest library, and treatment schedule — all in one place.
              </Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{activeCount}</Text>
                <Text style={styles.statLabel}>Active Detections</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>21 Sep</Text>
                <Text style={styles.statLabel}>Next Treatment</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{resolvedCount}</Text>
                <Text style={styles.statLabel}>Resolved This Month</Text>
              </View>
            </View>

            {/* Features List */}
            <Text style={styles.sectionHeaderTitle}>FEATURES</Text>

            <View style={styles.featuresList}>
              {/* Feature 1: Detection Log */}
              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => setCurrentView('log')}
              >
                <View style={[styles.featureIconBox, { backgroundColor: P.forestGreen }]}>
                  <PestBugIcon size={22} color={P.white} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureCode}>FR-F07-B</Text>
                  <Text style={styles.featureTitle}>Detection Log</Text>
                  <Text style={styles.featureDesc}>Photos, severity, and resolution status for every report</Text>
                </View>
                <ChevronRightIcon size={18} color={P.twGray400} />
              </TouchableOpacity>

              {/* Feature 2: Pest Library */}
              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (onNavigateToPestLibrary) {
                    onNavigateToPestLibrary();
                  } else {
                    setCurrentView('library');
                  }
                }}
              >
                <View style={[styles.featureIconBox, { backgroundColor: colors.brandGreen }]}>
                  <BookLibraryIcon size={22} color={P.white} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureCode}>FR-F07-C</Text>
                  <Text style={styles.featureTitle}>Pest Library</Text>
                  <Text style={styles.featureDesc}>Common pests, symptoms, seasonal risk, treatments</Text>
                </View>
                <ChevronRightIcon size={18} color={P.twGray400} />
              </TouchableOpacity>

              {/* Feature 3: Treatment Schedule */}
              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (onNavigateToSchedule) {
                    onNavigateToSchedule();
                  } else {
                    setCurrentView('schedule');
                  }
                }}
              >
                <View style={[styles.featureIconBox, { backgroundColor: P.orange800 }]}>
                  <CalendarScheduleIcon size={22} color={P.white} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureCode}>FR-F07-D</Text>
                  <Text style={styles.featureTitle}>Treatment Schedule</Text>
                  <Text style={styles.featureDesc}>Farmer-set reminders for applying treatments</Text>
                </View>
                <ChevronRightIcon size={18} color={P.twGray400} />
              </TouchableOpacity>

              {/* Feature 4: Weather Risk & Analytics */}
              <TouchableOpacity
                style={styles.featureCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (onNavigateToWeatherRisk) {
                    onNavigateToWeatherRisk();
                  } else {
                    setCurrentView('weatherRisk');
                  }
                }}
              >
                <View style={[styles.featureIconBox, { backgroundColor: P.googleBlue }]}>
                  <WeatherAnalyticsIcon size={22} color={P.white} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureCode}>FR-F07-E</Text>
                  <Text style={styles.featureTitle}>Weather Risk & Analytics</Text>
                  <Text style={styles.featureDesc}>Risk notes and season-wise detection trends</Text>
                </View>
                <ChevronRightIcon size={18} color={P.twGray400} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Floating Report Detection CTA */}
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              style={styles.reportCtaButton}
              activeOpacity={0.85}
              onPress={() => setIsReportModalVisible(true)}
            >
              <Text style={styles.reportCtaPlus}>+</Text>
              <Text style={styles.reportCtaText}>Report Detection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 2: DETECTION LOG (Screenshot 3)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'log' && (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.logScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.logHeaderRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentView('hub')}
                activeOpacity={0.7}
              >
                <ArrowBackIcon size={20} color={P.deepGreen} />
              </TouchableOpacity>
              <View style={styles.logHeaderTitleCol}>
                <Text style={styles.logHeaderTitle}>Detection Log</Text>
                <Text style={styles.logHeaderSubtitle}>
                  {activeCount} active · {resolvedCount} resolved this month
                </Text>
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabsRow}>
              {(['All', 'Ongoing', 'Resolved', 'Recurring'] as const).map((tab) => {
                const isActive = filterTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.filterTabPill, isActive && styles.filterTabPillActive]}
                    onPress={() => setFilterTab(tab)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Detections List */}
            <View style={styles.detectionsList}>
              {filteredDetections.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.detectionCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedDetection(item);
                    setCurrentView('detail');
                  }}
                >
                  <View style={styles.detectionIconBox}>
                    <PestBugIcon size={22} color={colors.brandGreen} />
                  </View>

                  <View style={styles.detectionMainCol}>
                    <Text style={styles.detectionName}>{item.name}</Text>
                    <Text style={styles.detectionSub}>
                      {item.crop} · {item.zone} · {item.date}
                    </Text>
                    <View style={styles.badgesRow}>
                      <View
                        style={[
                          styles.severityBadge,
                          item.severity === 'High' && styles.severityBadgeHigh,
                          item.severity === 'Medium' && styles.severityBadgeMed,
                          item.severity === 'Low' && styles.severityBadgeLow,
                        ]}
                      >
                        <Text
                          style={[
                            styles.severityBadgeText,
                            item.severity === 'High' && styles.severityBadgeTextHigh,
                            item.severity === 'Medium' && styles.severityBadgeTextMed,
                            item.severity === 'Low' && styles.severityBadgeTextLow,
                          ]}
                        >
                          {item.severity}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          item.status === 'Resolved' && styles.statusBadgeResolved,
                          item.status === 'Recurring' && styles.statusBadgeRecurring,
                          item.status === 'Ongoing' && styles.statusBadgeOngoing,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            item.status === 'Resolved' && styles.statusBadgeTextResolved,
                            item.status === 'Recurring' && styles.statusBadgeTextRecurring,
                            item.status === 'Ongoing' && styles.statusBadgeTextOngoing,
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Floating Report Detection CTA */}
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              style={styles.reportCtaButton}
              activeOpacity={0.85}
              onPress={() => setIsReportModalVisible(true)}
            >
              <Text style={styles.reportCtaPlus}>+</Text>
              <Text style={styles.reportCtaText}>Report Detection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 3: DETECTION DETAIL (Screenshot 5)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'detail' && (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.detailScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.detailHeaderRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentView('log')}
                activeOpacity={0.7}
              >
                <ArrowBackIcon size={20} color={P.deepGreen} />
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>Detection Detail</Text>
            </View>

            {/* Hero Image / Banner Card */}
            <View style={styles.detailHeroBanner}>
              <PestBugIcon size={56} color={P.deepGreen} />
            </View>

            {/* Title & Scientific Name */}
            <View style={styles.detailMetaCard}>
              <Text style={styles.detailPestTitle}>{selectedDetection.name}</Text>
              <Text style={styles.detailScientificName}>{selectedDetection.scientificName}</Text>
              <Text style={styles.detailCropDate}>
                {selectedDetection.crop} · {selectedDetection.zone} · Detected {selectedDetection.date}
              </Text>

              <View style={styles.badgesRow}>
                <View
                  style={[
                    styles.severityBadge,
                    selectedDetection.severity === 'High' && styles.severityBadgeHigh,
                    selectedDetection.severity === 'Medium' && styles.severityBadgeMed,
                    selectedDetection.severity === 'Low' && styles.severityBadgeLow,
                  ]}
                >
                  <Text
                    style={[
                      styles.severityBadgeText,
                      selectedDetection.severity === 'High' && styles.severityBadgeTextHigh,
                      selectedDetection.severity === 'Medium' && styles.severityBadgeTextMed,
                      selectedDetection.severity === 'Low' && styles.severityBadgeTextLow,
                    ]}
                  >
                    {selectedDetection.severity} Severity
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    selectedDetection.status === 'Resolved' && styles.statusBadgeResolved,
                    selectedDetection.status === 'Recurring' && styles.statusBadgeRecurring,
                    selectedDetection.status === 'Ongoing' && styles.statusBadgeOngoing,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      selectedDetection.status === 'Resolved' && styles.statusBadgeTextResolved,
                      selectedDetection.status === 'Recurring' && styles.statusBadgeTextRecurring,
                      selectedDetection.status === 'Ongoing' && styles.statusBadgeTextOngoing,
                    ]}
                  >
                    {selectedDetection.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Reference Treatments Card */}
            <View style={styles.detailSectionCard}>
              <Text style={styles.cardHeaderTitle}>REFERENCE TREATMENTS FOR THIS PEST</Text>
              {selectedDetection.referenceTreatments.map((t, idx) => (
                <View key={idx} style={styles.referenceTreatmentItem}>
                  <Text style={styles.referenceTreatmentName}>{t.name}</Text>
                  <Text style={styles.referenceTreatmentNotes}>{t.notes}</Text>
                </View>
              ))}

              <View style={styles.detailCalloutBox}>
                <InfoCircleIcon size={14} color={P.twGray500} />
                <Text style={styles.detailCalloutText}>
                  Reference list from the Pest Library — farmer selects and logs treatment manually.
                </Text>
              </View>
            </View>

            {/* Treatment History Card */}
            <View style={styles.detailSectionCard}>
              <Text style={styles.cardHeaderTitle}>TREATMENT HISTORY</Text>
              {selectedDetection.treatmentHistory.length > 0 ? (
                selectedDetection.treatmentHistory.map((th, idx) => (
                  <View key={idx} style={styles.treatmentHistoryItem}>
                    <Text style={styles.treatmentHistoryName}>{th.treatment}</Text>
                    <Text style={styles.treatmentHistoryDate}>{th.date}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.treatmentHistoryEmpty}>No further treatment logged</Text>
              )}
            </View>

            <View style={{ height: 90 }} />
          </ScrollView>

          {/* Bottom Dual Actions */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.scheduleButton}
              activeOpacity={0.8}
              onPress={() => {
                if (onNavigateToSchedule) {
                  onNavigateToSchedule();
                } else {
                  Alert.alert('Schedule Treatment', 'Set a treatment reminder in your calendar.');
                }
              }}
            >
              <CalendarIcon size={18} color={P.twGray700} />
              <Text style={styles.scheduleButtonText}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.markResolvedButton,
                selectedDetection.status === 'Resolved' && styles.markResolvedButtonActive,
              ]}
              activeOpacity={0.85}
              onPress={handleToggleResolved}
            >
              <CheckIcon size={18} color={P.white} />
              <Text style={styles.markResolvedButtonText}>
                {selectedDetection.status === 'Resolved' ? 'Reopen Case' : 'Mark Resolved'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 4: PEST LIBRARY (Screen 70)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'library' && (
        <PestLibraryScreen
          onBack={() => setCurrentView('hub')}
          onNavigateToSchedule={() => {
            if (onNavigateToSchedule) onNavigateToSchedule();
          }}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 5: TREATMENT SCHEDULE (Screen 43G / FR-F07-D)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'schedule' && (
        <TreatmentScheduleScreen onBack={() => setCurrentView('hub')} />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 6: WEATHER RISK & ANALYTICS (FR-F07-E)
      ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'weatherRisk' && (
        <WeatherRiskAnalyticsScreen onBack={() => setCurrentView('hub')} />
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: REPORT NEW DETECTION (Screenshot 4)
      ────────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={isReportModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsReportModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsReportModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon size={20} color={P.twGray700} />
            </TouchableOpacity>
            <View style={styles.modalHeaderTitleCol}>
              <Text style={styles.modalMainTitle}>Report New Detection</Text>
              <Text style={styles.modalSubtitle}>{newCropZone}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalFormContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Add Photo Dashed Box */}
            <TouchableOpacity
              style={styles.photoUploadBox}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert('Upload Photo', 'Choose photo from gallery or take a new photo with camera.', [
                  { text: 'Take Photo', onPress: () => {} },
                  { text: 'Choose Gallery', onPress: () => {} },
                  { text: 'Cancel', style: 'cancel' },
                ])
              }
            >
              <CameraIcon size={28} color={colors.brandGreen} />
              <Text style={styles.photoUploadText}>Add Photo</Text>
            </TouchableOpacity>

            {/* Crop / Zone Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Crop / Zone <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                activeOpacity={0.8}
                onPress={() => setIsCropPickerOpen(true)}
              >
                <Text style={styles.dropdownValueText}>{newCropZone}</Text>
                <ChevronDownIcon size={16} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {/* Pest Type with Search Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Pest Type <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.searchInputBox}>
                <SearchIcon size={16} color={P.twGray400} />
                <TextInput
                  style={styles.searchTextInput}
                  value={newPestType}
                  onChangeText={setNewPestType}
                  placeholder="Search Pest Library"
                  placeholderTextColor={P.twGray400}
                />
              </View>
              <View style={styles.infoCallout}>
                <InfoCircleIcon size={16} color={P.googleBlue} />
                <Text style={styles.infoCalloutText}>
                  Chosen manually from the Pest Library — no auto-detection from the photo.
                </Text>
              </View>
            </View>

            {/* Severity Segmented Toggle */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Severity <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.severityToggleRow}>
                {(['Low', 'Medium', 'High'] as const).map((sev) => {
                  const isSel = newSeverity === sev;
                  return (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        styles.severityToggleBtn,
                        isSel && sev === 'Low' && styles.severityToggleBtnLowActive,
                        isSel && sev === 'Medium' && styles.severityToggleBtnMedActive,
                        isSel && sev === 'High' && styles.severityToggleBtnHighActive,
                      ]}
                      onPress={() => setNewSeverity(sev)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.severityToggleText,
                          isSel && styles.severityToggleTextActive,
                        ]}
                      >
                        {sev}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Date Detected with Calendar Picker */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Date Detected <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                activeOpacity={0.8}
                onPress={() => setIsCalendarOpen(true)}
              >
                <Text style={styles.dropdownValueText}>{newDate}</Text>
                <CalendarIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={newNotes}
                onChangeText={setNewNotes}
                placeholder="Optional notes"
                placeholderTextColor={P.twGray400}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Modal Bottom Actions */}
          <View style={styles.modalBottomBar}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setIsReportModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSaveBtn}
              activeOpacity={0.85}
              onPress={handleSaveDetection}
            >
              <CheckIcon size={18} color={P.white} />
              <Text style={styles.modalSaveBtnText}>Save Detection</Text>
            </TouchableOpacity>
          </View>

          {/* ── In-Modal Crop / Zone Selector Overlay ── */}
          {isCropPickerOpen && (
            <View style={styles.inModalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setIsCropPickerOpen(false)}
              />
              <View style={styles.modalCard}>
                <View style={styles.modalCardHeader}>
                  <Text style={styles.modalCardTitle}>Select Crop / Zone</Text>
                  <TouchableOpacity onPress={() => setIsCropPickerOpen(false)}>
                    <CloseIcon size={18} color={P.twGray500} />
                  </TouchableOpacity>
                </View>
                {cropZoneOptions.map((opt) => {
                  const isSelected = newCropZone === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.modalCardOption, isSelected && styles.modalCardOptionSelected]}
                      onPress={() => {
                        setNewCropZone(opt);
                        setIsCropPickerOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.modalCardOptionText, isSelected && styles.modalCardOptionTextSelected]}
                      >
                        {opt}
                      </Text>
                      {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── In-Modal Dynamic Calendar Picker Overlay ── */}
          {isCalendarOpen && (
            <View style={styles.inModalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setIsCalendarOpen(false)}
              />
              <View style={styles.calModalCard}>
                {/* Header */}
                <View style={styles.calHeader}>
                  <Text style={styles.calFieldBadge}>Date Detected</Text>
                  <Text style={styles.calSelectedDateTitle}>
                    {calendarDate.getDate()} {MONTHS_FULL[calendarDate.getMonth()]} {calendarYear}
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

                {/* Year Quick Selector */}
                {isYearPickerOpen ? (
                  <View style={styles.yearGridContainer}>
                    <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={false}>
                      <View style={styles.yearGrid}>
                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => {
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
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayName) => (
                        <Text key={dayName} style={styles.calWeekdayText}>
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
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Actions */}
                <View style={styles.calFooterActions}>
                  <TouchableOpacity style={styles.calCancelBtn} onPress={() => setIsCalendarOpen(false)}>
                    <Text style={styles.calCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.calApplyBtn} onPress={handleApplyCalendarDate}>
                    <Text style={styles.calApplyBtnText}>Apply Date</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
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
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // ── Hub Styles ──
  hubScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  hubHeaderRow: {
    marginBottom: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  hubTitleSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  hubIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  hubMainTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: P.deepGreen,
    marginBottom: 4,
  },
  hubSubtitle: {
    fontSize: 12.5,
    color: P.twGray500,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minHeight: 74,
    backgroundColor: P.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: P.nearBlack,
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: P.twGray500,
    textAlign: 'center',
    lineHeight: 13,
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  featuresList: {
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureCode: {
    fontSize: 10.5,
    fontWeight: '700',
    color: P.twGray400,
    marginBottom: 2,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: P.twGray500,
    lineHeight: 16,
  },

  // ── Floating CTA ──
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  reportCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.deepGreen,
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 23,
    shadowColor: P.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  reportCtaPlus: {
    fontSize: 22,
    fontWeight: '700',
    color: P.white,
    lineHeight: 22,
  },
  reportCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },

  // ── In-Modal Overlays ──
  inModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 30,
  },

  // ── Log View Styles ──
  logScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 90,
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logHeaderTitleCol: {
    marginLeft: 14,
  },
  logHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.deepGreen,
  },
  logHeaderSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterTabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  filterTabPillActive: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray700,
  },
  filterTabTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  detectionsList: {
    gap: 12,
  },
  detectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  detectionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: P.twGreen50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detectionMainCol: {
    flex: 1,
  },
  detectionName: {
    fontSize: 15,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  detectionSub: {
    fontSize: 12,
    color: P.twGray500,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: P.twGray100,
  },
  severityBadgeHigh: {
    backgroundColor: P.red50,
  },
  severityBadgeMed: {
    backgroundColor: P.amber50,
  },
  severityBadgeLow: {
    backgroundColor: P.twGreen50,
  },
  severityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray700,
  },
  severityBadgeTextHigh: {
    color: P.red600,
  },
  severityBadgeTextMed: {
    color: P.amber600,
  },
  severityBadgeTextLow: {
    color: colors.brandGreen,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: P.twGray100,
  },
  statusBadgeResolved: {
    backgroundColor: P.twGreen50,
  },
  statusBadgeRecurring: {
    backgroundColor: P.amber50,
  },
  statusBadgeOngoing: {
    backgroundColor: P.sky100,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray700,
  },
  statusBadgeTextResolved: {
    color: colors.brandGreen,
  },
  statusBadgeTextRecurring: {
    color: P.amber600,
  },
  statusBadgeTextOngoing: {
    color: P.googleBlue,
  },

  // ── Detail View Styles ──
  detailScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.deepGreen,
    marginLeft: 14,
  },
  detailHeroBanner: {
    height: 140,
    borderRadius: 16,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailMetaCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    marginBottom: 16,
  },
  detailPestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.nearBlack,
    marginBottom: 2,
  },
  detailScientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    color: P.twGray500,
    marginBottom: 6,
  },
  detailCropDate: {
    fontSize: 12.5,
    color: P.twGray500,
    marginBottom: 12,
  },
  detailSectionCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  referenceTreatmentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  referenceTreatmentName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  referenceTreatmentNotes: {
    fontSize: 12,
    color: P.twGray500,
  },
  detailCalloutBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: P.twGray100,
    alignItems: 'flex-start',
  },
  detailCalloutText: {
    flex: 1,
    fontSize: 11.5,
    color: P.twGray600,
    lineHeight: 16,
  },
  treatmentHistoryItem: {
    paddingVertical: 10,
  },
  treatmentHistoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  treatmentHistoryDate: {
    fontSize: 12,
    color: P.twGray500,
  },
  treatmentHistoryEmpty: {
    fontSize: 13,
    color: P.twGray500,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    flexDirection: 'row',
    gap: 12,
  },
  scheduleButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    backgroundColor: P.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scheduleButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.twGray700,
  },
  markResolvedButton: {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.brandGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  markResolvedButtonActive: {
    backgroundColor: P.twGray700,
  },
  markResolvedButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.white,
  },

  // ── Modal Styles ──
  modalSafeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalHeaderTitleCol: {
    flex: 1,
  },
  modalMainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: P.deepGreen,
  },
  modalSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  modalScrollView: {
    flex: 1,
  },
  modalFormContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  photoUploadBox: {
    height: 100,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: P.twGray300,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.lightSurfaceAlt,
    gap: 8,
  },
  photoUploadText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray600,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGray700,
  },
  requiredAsterisk: {
    color: P.red600,
  },
  dropdownInput: {
    height: 48,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '500',
    color: P.nearBlack,
  },
  searchInputBox: {
    height: 46,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: P.nearBlack,
  },
  infoCallout: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: P.blue50,
    padding: 10,
    borderRadius: 10,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  infoCalloutText: {
    flex: 1,
    fontSize: 11.5,
    color: P.googleBlue,
    lineHeight: 16,
  },
  severityToggleRow: {
    flexDirection: 'row',
    backgroundColor: P.twGray100,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  severityToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  severityToggleBtnLowActive: {
    backgroundColor: colors.brandGreen,
  },
  severityToggleBtnMedActive: {
    backgroundColor: P.amber600,
  },
  severityToggleBtnHighActive: {
    backgroundColor: P.red600,
  },
  severityToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray600,
  },
  severityToggleTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  notesInput: {
    minHeight: 70,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: P.nearBlack,
    textAlignVertical: 'top',
  },
  modalBottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    gap: 12,
    backgroundColor: P.white,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: P.twGray700,
  },
  modalSaveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.deepGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSaveBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.white,
  },

  // Dropdown Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: P.nearBlack,
  },
  modalCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  modalCardOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  modalCardOptionText: {
    fontSize: 14.5,
    color: P.twGray700,
    fontWeight: '500',
  },
  modalCardOptionTextSelected: {
    fontWeight: '700',
    color: P.deepGreen,
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
    maxWidth: 360,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  calHeader: {
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    paddingBottom: 12,
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
    marginBottom: 14,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: P.twGray100,
  },
  calMonthYearLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.deepGreen,
  },
  yearGridContainer: {
    height: 180,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: P.twGray100,
    borderWidth: 1,
    borderColor: P.twGray200,
    minWidth: 64,
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
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  calDayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayInnerSelected: {
    backgroundColor: P.deepGreen,
  },
  calDayInnerToday: {
    borderWidth: 1.5,
    borderColor: P.deepGreen,
  },
  calDayText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray800,
  },
  calDayTextSelected: {
    fontWeight: '700',
    color: P.white,
  },
  calDayTextToday: {
    color: P.deepGreen,
    fontWeight: '700',
  },
  calFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  calCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  calCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  calApplyBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calApplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.white,
  },
});
